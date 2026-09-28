import { supabase } from '../../lib/supabase';
import type { CrmEntidade, CrmLabel } from './types';

export async function listarEtiquetas(entidade: CrmEntidade): Promise<CrmLabel[]> {
  const { data, error } = await supabase
    .from('crm_labels')
    .select('id, nome, cor, entidade, ordem')
    .eq('entidade', entidade)
    .order('ordem');

  if (error) throw error;
  return data ?? [];
}

/** Etiquetas aplicadas, agrupadas por id da entidade, para pintar a lista de uma vez. */
export async function listarVinculosDeEtiqueta(
  entidade: CrmEntidade
): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from('crm_entity_labels')
    .select('label_id, entidade_id')
    .eq('entidade', entidade);

  if (error) throw error;

  const mapa: Record<string, string[]> = {};
  for (const linha of data ?? []) {
    (mapa[linha.entidade_id] ??= []).push(linha.label_id);
  }
  return mapa;
}

/** Substitui por completo as etiquetas de um registro. */
export async function definirEtiquetas(
  entidade: CrmEntidade,
  entidadeId: string,
  labelIds: string[]
): Promise<void> {
  const { error: erroRemocao } = await supabase
    .from('crm_entity_labels')
    .delete()
    .eq('entidade', entidade)
    .eq('entidade_id', entidadeId);
  if (erroRemocao) throw erroRemocao;

  if (labelIds.length === 0) return;

  const { error } = await supabase
    .from('crm_entity_labels')
    .insert(labelIds.map((labelId) => ({ label_id: labelId, entidade, entidade_id: entidadeId })));
  if (error) throw error;
}
