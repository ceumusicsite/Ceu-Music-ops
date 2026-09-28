import { supabase } from '../../lib/supabase';
import type { CrmLead, StatusLead } from './types';

const SELECT_LEAD = `
  *,
  dono:users!crm_leads_dono_id_fkey ( id, name ),
  pessoa:crm_persons!crm_leads_person_id_fkey ( id, nome ),
  organizacao:crm_organizations!crm_leads_organizacao_id_fkey ( id, nome )
`;

function mapLead(row: any): CrmLead {
  return {
    id: row.id,
    titulo: row.titulo,
    valor: Number(row.valor ?? 0),
    moeda: row.moeda ?? 'BRL',
    origem: row.origem,
    status: row.status,
    deal_id: row.deal_id,
    observacoes: row.observacoes,
    dono_id: row.dono_id,
    dono_nome: row.dono?.name ?? null,
    person_id: row.person_id,
    person_nome: row.pessoa?.nome ?? null,
    organizacao_id: row.organizacao_id,
    organizacao_nome: row.organizacao?.nome ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listarLeads(status: StatusLead | 'todos' = 'ativo'): Promise<CrmLead[]> {
  let consulta = supabase.from('crm_leads').select(SELECT_LEAD);
  if (status !== 'todos') consulta = consulta.eq('status', status);

  const { data, error } = await consulta.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapLead);
}

export interface EntradaLead {
  titulo: string;
  valor: number;
  moeda: string;
  origem?: string | null;
  observacoes?: string | null;
  dono_id?: string | null;
  person_id?: string | null;
  organizacao_id?: string | null;
}

export async function criarLead(entrada: EntradaLead): Promise<CrmLead> {
  const { data, error } = await supabase
    .from('crm_leads')
    .insert(normalizar(entrada))
    .select('id')
    .single();
  if (error) throw error;

  const { data: criado, error: erroBusca } = await supabase
    .from('crm_leads')
    .select(SELECT_LEAD)
    .eq('id', data.id)
    .single();
  if (erroBusca) throw erroBusca;

  return mapLead(criado);
}

export async function atualizarLead(id: string, entrada: EntradaLead): Promise<void> {
  const { error } = await supabase.from('crm_leads').update(normalizar(entrada)).eq('id', id);
  if (error) throw error;
}

export async function arquivarLead(id: string, arquivar: boolean): Promise<void> {
  const { error } = await supabase
    .from('crm_leads')
    .update({ status: arquivar ? 'arquivado' : 'ativo' })
    .eq('id', id);
  if (error) throw error;
}

export async function excluirLeads(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('crm_leads').delete().in('id', ids);
  if (error) throw error;
}

/**
 * Converte o lead em negócio na primeira etapa do funil escolhido.
 *
 * O lead não é apagado: vira 'convertido' e guarda o deal_id, para o histórico
 * de origem continuar rastreável.
 */
export async function converterEmNegocio(lead: CrmLead, pipelineId: string): Promise<string> {
  const { data: primeiraEtapa, error: erroEtapa } = await supabase
    .from('crm_stages')
    .select('id')
    .eq('pipeline_id', pipelineId)
    .order('ordem')
    .limit(1)
    .maybeSingle();

  if (erroEtapa) throw erroEtapa;
  if (!primeiraEtapa) throw new Error('O funil escolhido não tem nenhuma etapa.');

  const { data: negocio, error: erroNegocio } = await supabase
    .from('crm_deals')
    .insert({
      titulo: lead.titulo,
      valor: lead.valor,
      moeda: lead.moeda,
      pipeline_id: pipelineId,
      stage_id: primeiraEtapa.id,
      person_id: lead.person_id ?? null,
      organizacao_id: lead.organizacao_id ?? null,
      dono_id: lead.dono_id ?? null,
      origem: lead.origem ?? null,
      ordem: 0,
    })
    .select('id')
    .single();

  if (erroNegocio) throw erroNegocio;

  const { error: erroLead } = await supabase
    .from('crm_leads')
    .update({ status: 'convertido', deal_id: negocio.id })
    .eq('id', lead.id);

  if (erroLead) throw erroLead;

  return negocio.id;
}

function normalizar(entrada: EntradaLead) {
  const normalizado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(entrada)) {
    normalizado[chave] = valor === '' ? null : valor;
  }
  return normalizado;
}
