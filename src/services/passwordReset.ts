import { supabase } from '../lib/supabase';

export interface SolicitacaoSenha {
  id: string;
  user_id: string;
  email: string;
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'cancelada';
  motivo_rejeicao?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
  reviewer?: {
    name: string;
    email: string;
  };
}

export interface LogSistema {
  id: string;
  usuario_id?: string | null;
  usuario_nome?: string | null;
  usuario_email?: string | null;
  acao: string;
  detalhes: string;
  metadata?: Record<string, any>;
  ip_address?: string | null;
  created_at: string;
}

/**
 * Solicita a redefinição de senha para um e-mail com a nova senha desejada.
 * A solicitação fica pendente de aprovação de um administrador.
 */
export async function solicitarRedefinicaoSenha(email: string, novaSenha: string) {
  const { data, error } = await supabase.rpc('solicitar_redefinicao_senha', {
    p_email: email,
    p_nova_senha: novaSenha,
  });

  if (error) {
    throw new Error(error.message || 'Erro ao processar solicitação de senha.');
  }

  if (data && data.success === false) {
    throw new Error(data.error || 'Erro ao solicitar redefinição de senha.');
  }

  return data;
}

/**
 * Lista todas as solicitações de senha cadastradas no sistema.
 */
export async function listarSolicitacoesSenha(): Promise<SolicitacaoSenha[]> {
  const { data, error } = await supabase
    .from('solicitacoes_senha')
    .select(`
      *,
      user:users!solicitacoes_senha_user_id_fkey (name, email, role),
      reviewer:users!solicitacoes_senha_reviewed_by_fkey (name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    // Fallback simples caso os joins sofram com restrição de chave
    const { data: fallback, error: fallbackErr } = await supabase
      .from('solicitacoes_senha')
      .select('*')
      .order('created_at', { ascending: false });

    if (fallbackErr) throw fallbackErr;
    return fallback || [];
  }

  return data || [];
}

/**
 * Admin aprova uma solicitação de senha pendente.
 */
export async function aprovarSolicitacaoSenha(solicitacaoId: string, adminId: string) {
  const { data, error } = await supabase.rpc('aprovar_redefinicao_senha', {
    p_solicitacao_id: solicitacaoId,
    p_admin_id: adminId,
  });

  if (error) {
    throw new Error(error.message || 'Erro ao aprovar solicitação de senha.');
  }

  if (data && data.success === false) {
    throw new Error(data.error || 'Erro ao aprovar solicitação de senha.');
  }

  return data;
}

/**
 * Admin rejeita uma solicitação de senha pendente.
 */
export async function rejeitarSolicitacaoSenha(solicitacaoId: string, adminId: string, motivo?: string) {
  const { data, error } = await supabase.rpc('rejeitar_redefinicao_senha', {
    p_solicitacao_id: solicitacaoId,
    p_admin_id: adminId,
    p_motivo: motivo || null,
  });

  if (error) {
    throw new Error(error.message || 'Erro ao rejeitar solicitação de senha.');
  }

  if (data && data.success === false) {
    throw new Error(data.error || 'Erro ao rejeitar solicitação de senha.');
  }

  return data;
}

/**
 * Admin redefine diretamente a senha de qualquer usuário da equipe.
 */
export async function alterarSenhaDiretaAdmin(targetUserId: string, novaSenha: string, adminId: string) {
  const { data, error } = await supabase.rpc('alterar_senha_usuario_admin', {
    p_target_user_id: targetUserId,
    p_nova_senha: novaSenha,
    p_admin_id: adminId,
  });

  if (error) {
    throw new Error(error.message || 'Erro ao alterar senha do usuário.');
  }

  if (data && data.success === false) {
    throw new Error(data.error || 'Erro ao alterar senha do usuário.');
  }

  return data;
}

/**
 * Lista os logs de auditoria do sistema.
 */
export async function listarLogsSistema(limit = 100): Promise<LogSistema[]> {
  const { data, error } = await supabase
    .from('logs_sistema')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || 'Erro ao carregar logs do sistema.');
  }

  return data || [];
}
