import { supabase } from '../../lib/supabase';
import { registrarEvento } from './historico';
import type { CrmEtapa, CrmNegocio, CrmPipeline, StatusNegocio } from './types';

// A dica de chave em `pessoa` é obrigatória: existem dois caminhos de crm_deals
// até crm_persons (person_id e a tabela crm_deal_participants), e sem ela o
// PostgREST responde 300 Multiple Choices em vez dos dados.
const SELECT_NEGOCIO = `
  *,
  pessoa:crm_persons!crm_deals_person_id_fkey (
    id,
    nome,
    telefones:crm_person_phones ( telefone, principal ),
    emails:crm_person_emails ( email, principal )
  ),
  organizacao:crm_organizations!crm_deals_organizacao_id_fkey ( id, nome ),
  dono:users!crm_deals_dono_id_fkey ( id, name )
`;

function mapNegocio(row: any): CrmNegocio {
  const telefones: { telefone: string; principal?: boolean }[] = row.pessoa?.telefones ?? [];
  const emails: { email: string; principal?: boolean }[] = row.pessoa?.emails ?? [];
  const telPrincipal = telefones.find((t) => t.principal)?.telefone ?? telefones[0]?.telefone ?? null;
  const emailPrincipal = emails.find((e) => e.principal)?.email ?? emails[0]?.email ?? null;

  return {
    id: row.id,
    titulo: row.titulo,
    valor: Number(row.valor ?? 0),
    moeda: row.moeda ?? 'BRL',
    pipeline_id: row.pipeline_id,
    stage_id: row.stage_id,
    person_id: row.person_id,
    person_nome: row.pessoa?.nome ?? null,
    person_telefone: telPrincipal,
    person_email: emailPrincipal,
    organizacao_id: row.organizacao_id,
    organizacao_nome: row.organizacao?.nome ?? null,
    dono_id: row.dono_id,
    dono_nome: row.dono?.name ?? null,
    status: row.status,
    motivo_perda: row.motivo_perda,
    probabilidade: row.probabilidade,
    origem: row.origem,
    observacoes: row.observacoes ?? null,
    ordem: row.ordem ?? 0,
    data_prevista_fechamento: row.data_prevista_fechamento,
    data_fechamento: row.data_fechamento,
    data_entrada_etapa: row.data_entrada_etapa,
    custom_fields: row.custom_fields ?? {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listarPipelines(): Promise<CrmPipeline[]> {
  const { data, error } = await supabase
    .from('crm_pipelines')
    .select('id, nome, ordem, ativo')
    .eq('ativo', true)
    .order('ordem');

  if (error) throw error;
  return data ?? [];
}

export async function listarEtapas(pipelineId: string): Promise<CrmEtapa[]> {
  const { data, error } = await supabase
    .from('crm_stages')
    .select('id, pipeline_id, nome, ordem, probabilidade, rotting_dias')
    .eq('pipeline_id', pipelineId)
    .order('ordem');

  if (error) throw error;
  return data ?? [];
}

/** Negócios de um funil. Ganhos e perdidos ficam fora do kanban por padrão. */
export async function listarNegocios(
  pipelineId: string,
  incluirFechados = false
): Promise<CrmNegocio[]> {
  let consulta = supabase
    .from('crm_deals')
    .select(SELECT_NEGOCIO)
    .eq('pipeline_id', pipelineId);

  if (!incluirFechados) {
    consulta = consulta.eq('status', 'aberto');
  }

  const { data, error } = await consulta.order('ordem').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapNegocio);
}

export async function buscarNegocio(id: string): Promise<CrmNegocio | null> {
  const { data, error } = await supabase
    .from('crm_deals')
    .select(SELECT_NEGOCIO)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapNegocio(data) : null;
}

export interface EntradaNegocio {
  titulo: string;
  valor: number;
  moeda: string;
  pipeline_id: string;
  stage_id: string;
  person_id?: string | null;
  organizacao_id?: string | null;
  dono_id?: string | null;
  origem?: string | null;
  observacoes?: string | null;
  data_prevista_fechamento?: string | null;
  custom_fields?: Record<string, unknown>;
}

export async function criarNegocio(entrada: EntradaNegocio): Promise<CrmNegocio> {
  const ordem = await proximaOrdem(entrada.stage_id);

  const { data, error } = await supabase
    .from('crm_deals')
    .insert({ ...normalizar(entrada), ordem })
    .select('id')
    .single();

  if (error) throw error;

  await registrarEvento('negocio', data.id, 'criou');

  const criado = await buscarNegocio(data.id);
  if (!criado) throw new Error('Negócio criado não pôde ser recarregado');
  return criado;
}

export async function atualizarNegocio(id: string, entrada: EntradaNegocio): Promise<CrmNegocio> {
  const anterior = await buscarNegocio(id);

  const { error } = await supabase.from('crm_deals').update(normalizar(entrada)).eq('id', id);
  if (error) throw error;

  if (anterior) {
    if (anterior.titulo !== entrada.titulo) {
      await registrarEvento('negocio', id, 'editou', {
        campo: 'o título',
        valorAnterior: anterior.titulo,
        valorNovo: entrada.titulo,
      });
    }
    if (anterior.valor !== entrada.valor) {
      await registrarEvento('negocio', id, 'editou', {
        campo: 'o valor',
        valorAnterior: String(anterior.valor),
        valorNovo: String(entrada.valor),
      });
    }
  }

  const atualizado = await buscarNegocio(id);
  if (!atualizado) throw new Error('Negócio atualizado não pôde ser recarregado');
  return atualizado;
}

/**
 * Move um negócio para outra etapa/posição.
 *
 * As posições dos vizinhos são renumeradas de 10 em 10 para abrir espaço sem
 * precisar reescrever a coluna inteira a cada arraste.
 */
export async function moverNegocio(
  negocioId: string,
  etapaDestinoId: string,
  negociosDaEtapaDestino: CrmNegocio[],
  posicao: number
): Promise<void> {
  const semOMovido = negociosDaEtapaDestino.filter((n) => n.id !== negocioId);
  const destino = Math.max(0, Math.min(posicao, semOMovido.length));
  const ordenados = [
    ...semOMovido.slice(0, destino).map((n) => n.id),
    negocioId,
    ...semOMovido.slice(destino).map((n) => n.id),
  ];

  const mudouDeEtapa = !negociosDaEtapaDestino.some((n) => n.id === negocioId);
  const nomes = mudouDeEtapa ? await nomesDasEtapas(negocioId, etapaDestinoId) : null;

  const { error } = await supabase
    .from('crm_deals')
    .update({
      stage_id: etapaDestinoId,
      ordem: ordenados.indexOf(negocioId) * 10,
      // Reinicia o relógio de "apodrecimento" só quando a etapa muda de fato.
      ...(mudouDeEtapa ? { data_entrada_etapa: new Date().toISOString() } : {}),
    })
    .eq('id', negocioId);

  if (error) throw error;

  if (nomes) {
    await registrarEvento('negocio', negocioId, 'mudou_etapa', {
      campo: 'etapa',
      valorAnterior: nomes.anterior,
      valorNovo: nomes.novo,
    });
  }

  const vizinhos = ordenados
    .map((id, indice) => ({ id, ordem: indice * 10 }))
    .filter((item) => item.id !== negocioId);

  await Promise.all(
    vizinhos.map((item) =>
      supabase.from('crm_deals').update({ ordem: item.ordem }).eq('id', item.id)
    )
  );
}

export async function marcarComoGanho(id: string): Promise<void> {
  const { error } = await supabase
    .from('crm_deals')
    .update({ status: 'ganho', data_fechamento: new Date().toISOString(), motivo_perda: null })
    .eq('id', id);
  if (error) throw error;

  await registrarEvento('negocio', id, 'ganhou');
}

export async function marcarComoPerdido(id: string, motivo: string): Promise<void> {
  const { error } = await supabase
    .from('crm_deals')
    .update({
      status: 'perdido',
      data_fechamento: new Date().toISOString(),
      motivo_perda: motivo.trim() || null,
    })
    .eq('id', id);
  if (error) throw error;

  await registrarEvento('negocio', id, 'perdeu', { valorNovo: motivo.trim() || null });
}

export async function reabrirNegocio(id: string): Promise<void> {
  const { error } = await supabase
    .from('crm_deals')
    .update({ status: 'aberto', data_fechamento: null, motivo_perda: null })
    .eq('id', id);
  if (error) throw error;

  await registrarEvento('negocio', id, 'reabriu');
}

export async function excluirNegocios(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('crm_deals').delete().in('id', ids);
  if (error) throw error;
}

export function rotuloStatus(status: StatusNegocio): string {
  const rotulos: Record<StatusNegocio, string> = {
    aberto: 'Aberto',
    ganho: 'Ganho',
    perdido: 'Perdido',
    arquivado: 'Arquivado',
  };
  return rotulos[status];
}

async function proximaOrdem(stageId: string): Promise<number> {
  const { data } = await supabase
    .from('crm_deals')
    .select('ordem')
    .eq('stage_id', stageId)
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.ordem ?? -10) + 10;
}

function normalizar(entrada: EntradaNegocio) {
  const normalizado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(entrada)) {
    normalizado[chave] = valor === '' ? null : valor;
  }
  return normalizado;
}

/** Move o negócio para uma etapa pela trilha do topo, sem reordenar a coluna. */
export async function alterarEtapa(negocioId: string, etapaId: string): Promise<void> {
  const nomes = await nomesDasEtapas(negocioId, etapaId);

  const { error } = await supabase
    .from('crm_deals')
    .update({ stage_id: etapaId, data_entrada_etapa: new Date().toISOString() })
    .eq('id', negocioId);
  if (error) throw error;

  if (nomes) {
    await registrarEvento('negocio', negocioId, 'mudou_etapa', {
      campo: 'etapa',
      valorAnterior: nomes.anterior,
      valorNovo: nomes.novo,
    });
  }
}

/**
 * Nomes das etapas de origem e destino.
 *
 * Precisa ser chamado ANTES do update: depois dele o negócio já aponta para a
 * etapa nova e a de origem se perde.
 */
async function nomesDasEtapas(
  negocioId: string,
  etapaDestinoId: string
): Promise<{ anterior: string; novo: string } | null> {
  const { data: negocio } = await supabase
    .from('crm_deals')
    .select('stage_id, pipeline_id')
    .eq('id', negocioId)
    .maybeSingle();

  if (!negocio) return null;

  const { data: etapas } = await supabase
    .from('crm_stages')
    .select('id, nome')
    .eq('pipeline_id', negocio.pipeline_id);

  const nomeDe = (id: string) => etapas?.find((e) => e.id === id)?.nome ?? '—';

  return { anterior: nomeDe(negocio.stage_id), novo: nomeDe(etapaDestinoId) };
}
