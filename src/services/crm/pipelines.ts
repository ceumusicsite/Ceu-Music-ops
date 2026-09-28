import { supabase } from '../../lib/supabase';
import type { CrmEtapa, CrmPipeline } from './types';

export async function criarPipeline(nome: string): Promise<CrmPipeline> {
  const { data: ultimo } = await supabase
    .from('crm_pipelines')
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from('crm_pipelines')
    .insert({ nome: nome.trim(), ordem: (ultimo?.ordem ?? -1) + 1 })
    .select('id, nome, ordem, ativo')
    .single();

  if (error) throw error;
  return data;
}

export async function renomearPipeline(id: string, nome: string): Promise<void> {
  const { error } = await supabase
    .from('crm_pipelines')
    .update({ nome: nome.trim() })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Exclui um funil. O banco recusa (FK RESTRICT via crm_deals.pipeline_id) se
 * ainda houver negócios nele — a mensagem é traduzida para o usuário.
 */
export async function excluirPipeline(id: string): Promise<void> {
  const { error } = await supabase.from('crm_pipelines').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error('Este funil ainda tem negócios. Mova ou exclua os negócios antes.');
    }
    throw error;
  }
}

export async function criarEtapa(
  pipelineId: string,
  nome: string,
  probabilidade: number
): Promise<CrmEtapa> {
  const { data: ultima } = await supabase
    .from('crm_stages')
    .select('ordem')
    .eq('pipeline_id', pipelineId)
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from('crm_stages')
    .insert({
      pipeline_id: pipelineId,
      nome: nome.trim(),
      ordem: (ultima?.ordem ?? -1) + 1,
      probabilidade,
    })
    .select('id, pipeline_id, nome, ordem, probabilidade, rotting_dias')
    .single();

  if (error) throw error;
  return data;
}

export interface MudancaEtapa {
  nome?: string;
  probabilidade?: number;
  rotting_dias?: number | null;
}

export async function atualizarEtapa(id: string, mudanca: MudancaEtapa): Promise<void> {
  const { error } = await supabase.from('crm_stages').update(mudanca).eq('id', id);
  if (error) throw error;
}

export async function excluirEtapa(id: string): Promise<void> {
  const { error } = await supabase.from('crm_stages').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error('Esta etapa ainda tem negócios. Mova-os para outra etapa antes.');
    }
    throw error;
  }
}

/** Grava a nova ordem das etapas a partir da sequência de ids. */
export async function reordenarEtapas(idsNaOrdem: string[]): Promise<void> {
  await Promise.all(
    idsNaOrdem.map((id, indice) =>
      supabase.from('crm_stages').update({ ordem: indice }).eq('id', id)
    )
  );
}

/** Quantos negócios existem em cada etapa, para avisar antes de excluir. */
export async function contarNegociosPorEtapa(pipelineId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('crm_deals')
    .select('stage_id')
    .eq('pipeline_id', pipelineId);

  if (error) throw error;

  const contagem: Record<string, number> = {};
  for (const linha of data ?? []) {
    contagem[linha.stage_id] = (contagem[linha.stage_id] ?? 0) + 1;
  }
  return contagem;
}
