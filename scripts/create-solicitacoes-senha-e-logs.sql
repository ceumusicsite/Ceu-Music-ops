-- ==============================================================================
-- MIGRAÇÃO: SISTEMA DE SOLICITAÇÃO/REDEFINIÇÃO DE SENHA POR ADMIN E AUDITORIA
-- ==============================================================================

-- 1. Garantir que a extensão pgcrypto esteja habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Criar tabela de solicitações de senha
CREATE TABLE IF NOT EXISTS public.solicitacoes_senha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nova_senha_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'cancelada')),
  motivo_rejeicao TEXT,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_solicitacoes_senha_status ON public.solicitacoes_senha(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_senha_email ON public.solicitacoes_senha(email);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_senha_created_at ON public.solicitacoes_senha(created_at DESC);

-- 3. Criar tabela de logs de auditoria do sistema
CREATE TABLE IF NOT EXISTS public.logs_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  usuario_nome TEXT,
  usuario_email TEXT,
  acao TEXT NOT NULL,
  detalhes TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_sistema_created_at ON public.logs_sistema(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_sistema_acao ON public.logs_sistema(acao);
CREATE INDEX IF NOT EXISTS idx_logs_sistema_usuario_email ON public.logs_sistema(usuario_email);

-- 4. Função auxiliar para registrar logs com segurança
CREATE OR REPLACE FUNCTION public.registrar_log_sistema(
  p_usuario_id UUID,
  p_usuario_nome TEXT,
  p_usuario_email TEXT,
  p_acao TEXT,
  p_detalhes TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.logs_sistema (
    usuario_id,
    usuario_nome,
    usuario_email,
    acao,
    detalhes,
    metadata,
    created_at
  ) VALUES (
    p_usuario_id,
    p_usuario_nome,
    p_usuario_email,
    p_acao,
    p_detalhes,
    p_metadata,
    now()
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- 5. Função RPC: Usuário solicita alteração de senha (pública / anônima)
CREATE OR REPLACE FUNCTION public.solicitar_redefinicao_senha(
  p_email TEXT,
  p_nova_senha TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user RECORD;
  v_hash TEXT;
  v_solicitacao_id UUID;
  v_clean_email TEXT;
BEGIN
  v_clean_email := lower(trim(p_email));

  IF length(p_nova_senha) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'A senha deve conter no mínimo 6 caracteres.');
  END IF;

  -- Localiza o usuário na tabela public.users
  SELECT id, name, email, status, role
  INTO v_user
  FROM public.users
  WHERE lower(trim(email)) = v_clean_email
  LIMIT 1;

  IF v_user IS NULL THEN
    -- Resposta segura para evitar enumeração de usuários, ou direta para facilitar a operação interna
    RETURN jsonb_build_object('success', false, 'error', 'Nenhum usuário ativo foi encontrado com este e-mail.');
  END IF;

  -- Gera hash bcrypt seguro da nova senha
  v_hash := crypt(p_nova_senha, gen_salt('bf'));

  -- Cancela solicitações anteriores pendentes deste e-mail
  UPDATE public.solicitacoes_senha
  SET status = 'cancelada', updated_at = now()
  WHERE lower(trim(email)) = v_clean_email AND status = 'pendente';

  -- Registra a nova solicitação
  INSERT INTO public.solicitacoes_senha (
    user_id,
    email,
    nova_senha_hash,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_user.id,
    v_user.email,
    v_hash,
    'pendente',
    now(),
    now()
  ) RETURNING id INTO v_solicitacao_id;

  -- Registra no log de auditoria
  PERFORM public.registrar_log_sistema(
    v_user.id,
    v_user.name,
    v_user.email,
    'SOLICITACAO_SENHA',
    'Usuário solicitou redefinição de senha. Aguardando aprovação de um administrador.',
    jsonb_build_object('solicitacao_id', v_solicitacao_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Solicitação enviada com sucesso! Aguarde a aprovação de um administrador para que sua nova senha seja ativada.'
  );
END;
$$;

-- 6. Função RPC: Admin aprova a redefinição de senha
CREATE OR REPLACE FUNCTION public.aprovar_redefinicao_senha(
  p_solicitacao_id UUID,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_admin RECORD;
  v_solicitacao RECORD;
  v_target_user RECORD;
BEGIN
  -- Validar se quem está aprovando é de fato admin
  SELECT id, name, email, role, status
  INTO v_admin
  FROM public.users
  WHERE id = p_admin_id AND role = 'admin' AND status = 'approved';

  IF v_admin IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas administradores aprovados podem autorizar a troca de senha.');
  END IF;

  -- Buscar a solicitação pendente
  SELECT *
  INTO v_solicitacao
  FROM public.solicitacoes_senha
  WHERE id = p_solicitacao_id AND status = 'pendente'
  FOR UPDATE;

  IF v_solicitacao IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solicitação não encontrada ou já processada.');
  END IF;

  -- Atualizar a senha no auth.users do Supabase
  UPDATE auth.users
  SET encrypted_password = v_solicitacao.nova_senha_hash,
      updated_at = now()
  WHERE id = v_solicitacao.user_id OR lower(trim(email)) = lower(trim(v_solicitacao.email));

  -- Atualizar status da solicitação
  UPDATE public.solicitacoes_senha
  SET status = 'aprovada',
      reviewed_by = v_admin.id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_solicitacao_id;

  -- Gravar log de auditoria
  PERFORM public.registrar_log_sistema(
    v_admin.id,
    v_admin.name,
    v_admin.email,
    'APROVACAO_SENHA',
    'Administrador aprovou a redefinição de senha para o usuário: ' || v_solicitacao.email,
    jsonb_build_object(
      'solicitacao_id', p_solicitacao_id,
      'usuario_afetado_email', v_solicitacao.email,
      'admin_nome', v_admin.name
    )
  );

  RETURN jsonb_build_object('success', true, 'message', 'Senha atualizada e aprovada com sucesso!');
END;
$$;

-- 7. Função RPC: Admin rejeita a redefinição de senha
CREATE OR REPLACE FUNCTION public.rejeitar_redefinicao_senha(
  p_solicitacao_id UUID,
  p_admin_id UUID,
  p_motivo TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_admin RECORD;
  v_solicitacao RECORD;
BEGIN
  -- Validar admin
  SELECT id, name, email, role, status
  INTO v_admin
  FROM public.users
  WHERE id = p_admin_id AND role = 'admin' AND status = 'approved';

  IF v_admin IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas administradores aprovados podem rejeitar solicitações.');
  END IF;

  SELECT *
  INTO v_solicitacao
  FROM public.solicitacoes_senha
  WHERE id = p_solicitacao_id AND status = 'pendente';

  IF v_solicitacao IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solicitação não encontrada ou já processada.');
  END IF;

  UPDATE public.solicitacoes_senha
  SET status = 'rejeitada',
      motivo_rejeicao = p_motivo,
      reviewed_by = v_admin.id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_solicitacao_id;

  PERFORM public.registrar_log_sistema(
    v_admin.id,
    v_admin.name,
    v_admin.email,
    'REJEICAO_SENHA',
    'Administrador rejeitou a solicitação de redefinição de senha para ' || v_solicitacao.email || COALESCE('. Motivo: ' || p_motivo, ''),
    jsonb_build_object(
      'solicitacao_id', p_solicitacao_id,
      'usuario_afetado_email', v_solicitacao.email,
      'motivo', p_motivo
    )
  );

  RETURN jsonb_build_object('success', true, 'message', 'Solicitação rejeitada com sucesso.');
END;
$$;

-- 8. Função RPC: Admin altera a senha de um usuário diretamente
CREATE OR REPLACE FUNCTION public.alterar_senha_usuario_admin(
  p_target_user_id UUID,
  p_nova_senha TEXT,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_admin RECORD;
  v_target_user RECORD;
  v_hash TEXT;
BEGIN
  -- Validar permissão de admin
  SELECT id, name, email, role, status
  INTO v_admin
  FROM public.users
  WHERE id = p_admin_id AND role = 'admin' AND status = 'approved';

  IF v_admin IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas administradores podem alterar senhas diretamente.');
  END IF;

  IF length(p_nova_senha) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'A nova senha deve ter no mínimo 6 caracteres.');
  END IF;

  -- Buscar usuário alvo
  SELECT id, name, email
  INTO v_target_user
  FROM public.users
  WHERE id = p_target_user_id;

  IF v_target_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado.');
  END IF;

  -- Gerar hash
  v_hash := crypt(p_nova_senha, gen_salt('bf'));

  -- Atualizar auth.users
  UPDATE auth.users
  SET encrypted_password = v_hash,
      updated_at = now()
  WHERE id = v_target_user.id OR lower(trim(email)) = lower(trim(v_target_user.email));

  -- Cancelar eventuais solicitações pendentes deste usuário
  UPDATE public.solicitacoes_senha
  SET status = 'cancelada', updated_at = now()
  WHERE user_id = v_target_user.id AND status = 'pendente';

  -- Registrar no log
  PERFORM public.registrar_log_sistema(
    v_admin.id,
    v_admin.name,
    v_admin.email,
    'ALTERACAO_DIRETA_SENHA',
    'Administrador alterou diretamente a senha do usuário: ' || v_target_user.email,
    jsonb_build_object(
      'target_user_id', v_target_user.id,
      'target_user_email', v_target_user.email,
      'admin_nome', v_admin.name
    )
  );

  RETURN jsonb_build_object('success', true, 'message', 'Senha alterada com sucesso pelo administrador!');
END;
$$;

-- 9. Permissões de RLS e EXECUTE
ALTER TABLE public.solicitacoes_senha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas para solicitacoes_senha:
-- Permitir anon e authenticated criarem solicitações via RPC
DROP POLICY IF EXISTS "Admins podem visualizar solicitacoes" ON public.solicitacoes_senha;
CREATE POLICY "Admins podem visualizar solicitacoes" ON public.solicitacoes_senha
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin' AND users.status = 'approved'
    )
  );

-- Políticas para logs_sistema:
DROP POLICY IF EXISTS "Admins podem visualizar logs" ON public.logs_sistema;
CREATE POLICY "Admins podem visualizar logs" ON public.logs_sistema
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin' AND users.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Permitir insercao de logs via funcoes seguras" ON public.logs_sistema;
CREATE POLICY "Permitir insercao de logs via funcoes seguras" ON public.logs_sistema
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Conceder permissão de execução nas funções públicas e autenticadas
GRANT EXECUTE ON FUNCTION public.solicitar_redefinicao_senha(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aprovar_redefinicao_senha(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rejeitar_redefinicao_senha(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.alterar_senha_usuario_admin(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_log_sistema(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
