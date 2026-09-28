import { supabase } from '../../lib/supabase';
import type { CrmEtapa } from './types';

export interface ResumoInsights {
  valorEmAberto: number;
  negociosAbertos: number;
  valorGanho: number;
  negociosGanhos: number;
  negociosPerdidos: number;
  taxaConversao: number;
  ticketMedio: number;
  cicloMedioDias: number | null;
}

export interface PontoFunil {
  etapa: string;
  quantidade: number;
  valor: number;
}

export interface PontoMes {
  mes: string;
  ganho: number;
  perdido: number;
  valorGanho: number;
}

export interface PontoResponsavel {
  responsavel: string;
  abertos: number;
  ganhos: number;
  valorGanho: number;
}

export interface PontoAtividade {
  tipo: string;
  concluidas: number;
  pendentes: number;
}

export interface DadosInsights {
  resumo: ResumoInsights;
  funil: PontoFunil[];
  porMes: PontoMes[];
  porResponsavel: PontoResponsavel[];
  atividades: PontoAtividade[];
}

const ROTULO_TIPO: Record<string, string> = {
  ligacao: 'Chamada',
  reuniao: 'Reunião',
  tarefa: 'Tarefa',
  prazo: 'Prazo',
  email: 'E-mail',
  almoco: 'Almoço',
};

/**
 * Calcula os indicadores no cliente a partir dos negócios do funil.
 *
 * Funciona bem no volume de uma gravadora; se a base crescer muito, estes
 * agregados viram views ou funções no Postgres.
 */
export async function carregarInsights(
  pipelineId: string,
  etapas: CrmEtapa[]
): Promise<DadosInsights> {
  const [{ data: negocios, error: erroNegocios }, { data: atividades, error: erroAtividades }] =
    await Promise.all([
      supabase
        .from('crm_deals')
        .select('valor, status, stage_id, dono_id, created_at, data_fechamento, dono:users!crm_deals_dono_id_fkey ( name )')
        .eq('pipeline_id', pipelineId),
      supabase.from('crm_activities').select('tipo, concluida'),
    ]);

  if (erroNegocios) throw erroNegocios;
  if (erroAtividades) throw erroAtividades;

  const lista = (negocios ?? []) as any[];

  const abertos = lista.filter((n) => n.status === 'aberto');
  const ganhos = lista.filter((n) => n.status === 'ganho');
  const perdidos = lista.filter((n) => n.status === 'perdido');

  const valorGanho = soma(ganhos.map((n) => Number(n.valor ?? 0)));
  const fechados = ganhos.length + perdidos.length;

  const ciclos = ganhos
    .filter((n) => n.data_fechamento && n.created_at)
    .map(
      (n) =>
        (new Date(n.data_fechamento).getTime() - new Date(n.created_at).getTime()) / 86_400_000
    );

  const resumo: ResumoInsights = {
    valorEmAberto: soma(abertos.map((n) => Number(n.valor ?? 0))),
    negociosAbertos: abertos.length,
    valorGanho,
    negociosGanhos: ganhos.length,
    negociosPerdidos: perdidos.length,
    taxaConversao: fechados === 0 ? 0 : (ganhos.length / fechados) * 100,
    ticketMedio: ganhos.length === 0 ? 0 : valorGanho / ganhos.length,
    cicloMedioDias: ciclos.length === 0 ? null : Math.round(soma(ciclos) / ciclos.length),
  };

  const funil: PontoFunil[] = etapas.map((etapa) => {
    const daEtapa = abertos.filter((n) => n.stage_id === etapa.id);
    return {
      etapa: etapa.nome,
      quantidade: daEtapa.length,
      valor: soma(daEtapa.map((n) => Number(n.valor ?? 0))),
    };
  });

  // Últimos 6 meses, incluindo os vazios, para o gráfico não ficar esburacado.
  const meses = ultimosMeses(6);
  const porMes: PontoMes[] = meses.map(({ chave, rotulo }) => {
    const fechadosNoMes = lista.filter(
      (n) => n.data_fechamento && n.data_fechamento.slice(0, 7) === chave
    );
    const ganhosNoMes = fechadosNoMes.filter((n) => n.status === 'ganho');
    return {
      mes: rotulo,
      ganho: ganhosNoMes.length,
      perdido: fechadosNoMes.filter((n) => n.status === 'perdido').length,
      valorGanho: soma(ganhosNoMes.map((n) => Number(n.valor ?? 0))),
    };
  });

  const porDono: Record<string, PontoResponsavel> = {};
  for (const negocio of lista) {
    const nome = negocio.dono?.name ?? 'Sem responsável';
    const item = (porDono[nome] ??= { responsavel: nome, abertos: 0, ganhos: 0, valorGanho: 0 });
    if (negocio.status === 'aberto') item.abertos += 1;
    if (negocio.status === 'ganho') {
      item.ganhos += 1;
      item.valorGanho += Number(negocio.valor ?? 0);
    }
  }

  const contagemAtividades: Record<string, PontoAtividade> = {};
  for (const atividade of (atividades ?? []) as any[]) {
    const rotulo = ROTULO_TIPO[atividade.tipo] ?? atividade.tipo;
    const item = (contagemAtividades[rotulo] ??= { tipo: rotulo, concluidas: 0, pendentes: 0 });
    if (atividade.concluida) item.concluidas += 1;
    else item.pendentes += 1;
  }

  return {
    resumo,
    funil,
    porMes,
    porResponsavel: Object.values(porDono).sort((a, b) => b.valorGanho - a.valorGanho),
    atividades: Object.values(contagemAtividades),
  };
}

function soma(valores: number[]): number {
  return valores.reduce((total, valor) => total + valor, 0);
}

function ultimosMeses(quantidade: number): { chave: string; rotulo: string }[] {
  const hoje = new Date();
  return Array.from({ length: quantidade }, (_, i) => {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - (quantidade - 1 - i), 1);
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return {
      chave: `${data.getFullYear()}-${mes}`,
      rotulo: data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    };
  });
}
