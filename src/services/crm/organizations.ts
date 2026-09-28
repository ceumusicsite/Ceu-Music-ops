import { supabase } from '../../lib/supabase';
import type { CrmOrganizacao } from './types';

const SELECT_ORGANIZACAO = `
  *,
  dono:users!crm_organizations_dono_id_fkey ( id, name ),
  pessoas:crm_persons ( id ),
  negocios:crm_deals ( id )
`;

function mapOrganizacao(row: any): CrmOrganizacao {
  return {
    id: row.id,
    nome: row.nome,
    dono_id: row.dono_id,
    dono_nome: row.dono?.name ?? null,
    endereco: row.endereco,
    cidade: row.cidade,
    estado: row.estado,
    pais: row.pais,
    cep: row.cep,
    cnpj: row.cnpj,
    website: row.website,
    telefone: row.telefone,
    email: row.email,
    setor: row.setor,
    observacoes: row.observacoes,
    custom_fields: row.custom_fields ?? {},
    total_pessoas: row.pessoas?.length ?? 0,
    total_negocios: row.negocios?.length ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listarOrganizacoes(): Promise<CrmOrganizacao[]> {
  const { data, error } = await supabase
    .from('crm_organizations')
    .select(SELECT_ORGANIZACAO)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapOrganizacao);
}

export async function buscarOrganizacao(id: string): Promise<CrmOrganizacao | null> {
  const { data, error } = await supabase
    .from('crm_organizations')
    .select(SELECT_ORGANIZACAO)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapOrganizacao(data) : null;
}

export interface EntradaOrganizacao {
  nome: string;
  dono_id?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  pais?: string | null;
  cep?: string | null;
  cnpj?: string | null;
  website?: string | null;
  telefone?: string | null;
  email?: string | null;
  setor?: string | null;
  observacoes?: string | null;
}

export async function criarOrganizacao(entrada: EntradaOrganizacao): Promise<CrmOrganizacao> {
  const { data, error } = await supabase
    .from('crm_organizations')
    .insert(normalizar(entrada))
    .select('id')
    .single();

  if (error) throw error;

  const criada = await buscarOrganizacao(data.id);
  if (!criada) throw new Error('Organização criada não pôde ser recarregada');
  return criada;
}

export async function atualizarOrganizacao(
  id: string,
  entrada: EntradaOrganizacao
): Promise<CrmOrganizacao> {
  const { error } = await supabase
    .from('crm_organizations')
    .update(normalizar(entrada))
    .eq('id', id);

  if (error) throw error;

  const atualizada = await buscarOrganizacao(id);
  if (!atualizada) throw new Error('Organização atualizada não pôde ser recarregada');
  return atualizada;
}

export async function excluirOrganizacoes(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('crm_organizations').delete().in('id', ids);
  if (error) throw error;
}

/** Opções para os selects de vínculo (pessoa -> organização). */
export async function listarOpcoesOrganizacoes(): Promise<{ id: string; nome: string }[]> {
  const { data, error } = await supabase
    .from('crm_organizations')
    .select('id, nome')
    .order('nome');

  if (error) throw error;
  return data ?? [];
}

function normalizar(entrada: EntradaOrganizacao) {
  const normalizado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(entrada)) {
    normalizado[chave] = valor === '' ? null : valor;
  }
  return normalizado;
}
