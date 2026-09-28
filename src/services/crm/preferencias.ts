import { supabase } from '../../lib/supabase';

export interface PreferenciaDeTabela {
  colunas: string[];
  ordenacao: { chave: string; direcao: 'asc' | 'desc' } | null;
}

/**
 * Colunas visíveis e ordenação que o usuário escolheu para cada listagem.
 *
 * Guardado por usuário em crm_views, para a escolha sobreviver ao recarregar.
 */
export async function carregarPreferencia(
  entidade: string
): Promise<PreferenciaDeTabela | null> {
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) return null;

  const { data, error } = await supabase
    .from('crm_views')
    .select('colunas, ordenacao')
    .eq('usuario_id', sessao.user.id)
    .eq('entidade', entidade)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const ordenacao = data.ordenacao as PreferenciaDeTabela['ordenacao'];
  return {
    colunas: Array.isArray(data.colunas) ? (data.colunas as string[]) : [],
    ordenacao: ordenacao && typeof ordenacao === 'object' && 'chave' in ordenacao ? ordenacao : null,
  };
}

export async function salvarPreferencia(
  entidade: string,
  preferencia: PreferenciaDeTabela
): Promise<void> {
  const { data: sessao } = await supabase.auth.getUser();
  if (!sessao.user) return;

  const { error } = await supabase.from('crm_views').upsert(
    {
      usuario_id: sessao.user.id,
      entidade,
      colunas: preferencia.colunas,
      ordenacao: preferencia.ordenacao ?? {},
    },
    { onConflict: 'usuario_id,entidade' }
  );

  if (error) throw error;
}
