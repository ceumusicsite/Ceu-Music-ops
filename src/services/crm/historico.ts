import { supabase } from '../../lib/supabase';

export interface CrmEventoHistorico {
  id: string;
  entidade: string;
  entidade_id: string;
  usuario_id?: string | null;
  usuario_nome?: string | null;
  acao: string;
  campo?: string | null;
  valor_anterior?: string | null;
  valor_novo?: string | null;
  created_at: string;
}

export async function listarHistorico(
  entidade: string,
  entidadeId: string
): Promise<CrmEventoHistorico[]> {
  const { data, error } = await supabase
    .from('crm_activity_log')
    .select('*, usuario:users!crm_activity_log_usuario_id_fkey ( id, name )')
    .eq('entidade', entidade)
    .eq('entidade_id', entidadeId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    entidade: row.entidade,
    entidade_id: row.entidade_id,
    usuario_id: row.usuario_id,
    usuario_nome: row.usuario?.name ?? null,
    acao: row.acao,
    campo: row.campo,
    valor_anterior: row.valor_anterior,
    valor_novo: row.valor_novo,
    created_at: row.created_at,
  }));
}

/**
 * Grava um evento no histórico.
 *
 * Nunca lança: o histórico é acessório, e falhar aqui não pode derrubar a ação
 * que o usuário acabou de fazer.
 */
export async function registrarEvento(
  entidade: string,
  entidadeId: string,
  acao: string,
  detalhes: { campo?: string; valorAnterior?: string | null; valorNovo?: string | null } = {}
): Promise<void> {
  try {
    const { data: sessao } = await supabase.auth.getUser();

    await supabase.from('crm_activity_log').insert({
      entidade,
      entidade_id: entidadeId,
      usuario_id: sessao.user?.id ?? null,
      acao,
      campo: detalhes.campo ?? null,
      valor_anterior: detalhes.valorAnterior ?? null,
      valor_novo: detalhes.valorNovo ?? null,
    });
  } catch (e) {
    console.warn('Não foi possível registrar o histórico:', e);
  }
}

/** Texto pronto para a tela, a partir do evento gravado. */
export function descreverEvento(evento: CrmEventoHistorico): string {
  const quem = evento.usuario_nome ?? 'Alguém';

  switch (evento.acao) {
    case 'criou':
      return `${quem} criou este negócio`;
    case 'mudou_etapa':
      return `${quem} moveu de "${evento.valor_anterior}" para "${evento.valor_novo}"`;
    case 'ganhou':
      return `${quem} marcou como ganho`;
    case 'perdeu':
      return evento.valor_novo
        ? `${quem} marcou como perdido — ${evento.valor_novo}`
        : `${quem} marcou como perdido`;
    case 'reabriu':
      return `${quem} reabriu o negócio`;
    case 'editou':
      return evento.campo
        ? `${quem} alterou ${evento.campo} de "${evento.valor_anterior ?? '—'}" para "${evento.valor_novo ?? '—'}"`
        : `${quem} editou o negócio`;
    default:
      return `${quem} ${evento.acao}`;
  }
}
