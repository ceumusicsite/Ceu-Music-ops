import { supabase } from '../../lib/supabase';
import type { CrmNota } from './types';

const SELECT_NOTA = `*, autor:users!crm_notes_autor_id_fkey ( id, name )`;

function mapNota(row: any): CrmNota {
  return {
    id: row.id,
    conteudo: row.conteudo,
    autor_id: row.autor_id,
    autor_nome: row.autor?.name ?? null,
    deal_id: row.deal_id,
    person_id: row.person_id,
    organizacao_id: row.organizacao_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listarNotasDe(
  campo: 'deal_id' | 'person_id' | 'organizacao_id',
  id: string
): Promise<CrmNota[]> {
  const { data, error } = await supabase
    .from('crm_notes')
    .select(SELECT_NOTA)
    .eq(campo, id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapNota);
}

export async function criarNota(
  conteudo: string,
  vinculo: { deal_id?: string; person_id?: string; organizacao_id?: string },
  autorId?: string | null
): Promise<void> {
  const { error } = await supabase
    .from('crm_notes')
    .insert({ conteudo: conteudo.trim(), autor_id: autorId ?? null, ...vinculo });
  if (error) throw error;
}

export async function excluirNota(id: string): Promise<void> {
  const { error } = await supabase.from('crm_notes').delete().eq('id', id);
  if (error) throw error;
}
