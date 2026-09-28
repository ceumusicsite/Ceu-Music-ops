import { supabase } from '../../lib/supabase';
import type { CrmCondicoesFiltro, CrmFiltroSalvo } from './types';

export async function listarFiltrosSalvos(entidade: string): Promise<CrmFiltroSalvo[]> {
  const { data, error } = await supabase
    .from('crm_filters')
    .select('id, nome, entidade, condicoes, visibilidade, dono_id')
    .eq('entidade', entidade)
    .order('nome');

  if (error) throw error;
  return (data ?? []) as CrmFiltroSalvo[];
}

export async function salvarFiltro(
  nome: string,
  entidade: string,
  condicoes: CrmCondicoesFiltro,
  visibilidade: 'privado' | 'compartilhado'
): Promise<void> {
  const { data: sessao } = await supabase.auth.getUser();

  const { error } = await supabase.from('crm_filters').insert({
    nome: nome.trim(),
    entidade,
    condicoes,
    visibilidade,
    dono_id: sessao.user?.id ?? null,
  });

  if (error) throw error;
}

export async function excluirFiltro(id: string): Promise<void> {
  const { error } = await supabase.from('crm_filters').delete().eq('id', id);
  if (error) throw error;
}
