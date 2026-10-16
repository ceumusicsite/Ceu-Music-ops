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
  negocios: number;
  atuais: number;
  avancaram: number;
  valor: number;
  taxa: number;
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
  const promessaLogs = supabase
    .from('crm_activity_log')
    .select('entidade_id, valor_anterior, valor_novo')
    .eq('entidade', 'negocio')
    .eq('acao', 'mudou_etapa')
    .then((r) => r.data ?? [])
    .catch(() => []);

  const [{ data: negocios, error: erroNegocios }, { data: atividades, error: erroAtividades }, logs] =
    await Promise.all([
      supabase
        .from('crm_deals')
        .select('id, valor, status, stage_id, person_id, dono_id, created_at, data_fechamento, dono:users!crm_deals_dono_id_fkey ( name )')
        .eq('pipeline_id', pipelineId),
      supabase.from('crm_activities').select('tipo, concluida'),
      promessaLogs,
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

  // Garante a ordenação correta das etapas da esteira
  const etapasOrdenadas = [...etapas].sort((a, b) => a.ordem - b.ordem);

  const indicePorId = new Map<string, number>();
  const indicePorNome = new Map<string, number>();
  etapasOrdenadas.forEach((etapa, idx) => {
    indicePorId.set(etapa.id, idx);
    indicePorNome.set(etapa.nome.trim().toLowerCase(), idx);
  });

  const logsPorNegocio: Record<string, Array<{ valor_anterior: string | null; valor_novo: string | null }>> = {};
  for (const log of (logs ?? [])) {
    if (log?.entidade_id) {
      (logsPorNegocio[log.entidade_id] ??= []).push(log);
    }
  }

  // Negócios ativos, ganhos ou perdidos deste funil
  const negociosValidos = lista.filter((n) => n.status !== 'arquivado');

  // Determina o índice máximo de etapa já alcançado por cada negócio
  const negociosComAlcance = negociosValidos.map((n) => {
    const indiceAtual = indicePorId.get(n.stage_id) ?? 0;
    let maxIndice = indiceAtual;

    const eventos = logsPorNegocio[n.id] ?? [];
    for (const ev of eventos) {
      if (ev.valor_novo) {
        const idxNovo = indicePorNome.get(ev.valor_novo.trim().toLowerCase());
        if (idxNovo !== undefined && idxNovo > maxIndice) maxIndice = idxNovo;
      }
      if (ev.valor_anterior) {
        const idxAnt = indicePorNome.get(ev.valor_anterior.trim().toLowerCase());
        if (idxAnt !== undefined && idxAnt > maxIndice) maxIndice = idxAnt;
      }
    }

    // Identificador único da pessoa/contato (person_id ou id do próprio negócio caso avulso)
    const pessoaKey = n.person_id ? `p_${n.person_id}` : `d_${n.id}`;

    return {
      ...n,
      indiceAtual,
      maxIndice,
      pessoaKey,
    };
  });

  const totalTopo = (() => {
    const dealsTopo = negociosComAlcance.filter((n) => n.maxIndice >= 0);
    const pessoasTopo = new Set(dealsTopo.map((n) => n.pessoaKey));
    return pessoasTopo.size || 1;
  })();

  const funil: PontoFunil[] = etapasOrdenadas.map((etapa, idx) => {
    // Negócios que chegaram ou passaram por esta etapa
    const quePassaram = negociosComAlcance.filter((n) => n.maxIndice >= idx);
    const pessoasQuePassaram = new Set(quePassaram.map((n) => n.pessoaKey));

    // Pessoas atualmente paradas nesta etapa (abertas)
    const atuais = quePassaram.filter((n) => n.indiceAtual === idx && n.status === 'aberto');
    const pessoasAtuais = new Set(atuais.map((n) => n.pessoaKey));

    // Pessoas que avançaram para etapas seguintes ou já ganharam
    const avancaram = quePassaram.filter(
      (n) => n.maxIndice >= idx && (n.indiceAtual > idx || n.status === 'ganho')
    );
    const pessoasAvancaram = new Set(avancaram.map((n) => n.pessoaKey));

    const totalPessoas = pessoasQuePassaram.size;
    const taxa = (totalPessoas / totalTopo) * 100;

    return {
      etapa: etapa.nome,
      quantidade: totalPessoas,
      negocios: quePassaram.length,
      atuais: pessoasAtuais.size,
      avancaram: pessoasAvancaram.size,
      valor: soma(quePassaram.map((n) => Number(n.valor ?? 0))),
      taxa,
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
