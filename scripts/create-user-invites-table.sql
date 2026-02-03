-- Script para criar a tabela user_invites e adicionar campo status na tabela users
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar campo status na tabela users (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'status'
  ) THEN
    ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'approved';
  END IF;
END $$;

-- Atualizar usuários existentes para 'approved'
UPDATE users SET status = 'approved' WHERE status IS NULL;

-- Adicionar constraint para validar status
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS check_user_status;

ALTER TABLE users 
ADD CONSTRAINT check_user_status CHECK (status IN ('pending', 'approved', 'rejected'));

-- 2. Criar tabela user_invites para armazenar convites compartilháveis
CREATE TABLE IF NOT EXISTS user_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice único para token
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_invites_token ON user_invites(token);

-- Criar índice para busca por criador
CREATE INDEX IF NOT EXISTS idx_user_invites_created_by ON user_invites(created_by);

-- Criar índice para busca por status de uso
CREATE INDEX IF NOT EXISTS idx_user_invites_used_at ON user_invites(used_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura para usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem ler convites" ON user_invites;
CREATE POLICY "Usuários autenticados podem ler convites"
  ON user_invites FOR SELECT
  TO authenticated
  USING (true);

-- Criar política para permitir inserção para admins
DROP POLICY IF EXISTS "Admins podem criar convites" ON user_invites;
CREATE POLICY "Admins podem criar convites"
  ON user_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Criar política para permitir atualização para admins
DROP POLICY IF EXISTS "Admins podem atualizar convites" ON user_invites;
CREATE POLICY "Admins podem atualizar convites"
  ON user_invites FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Permitir leitura pública de convites válidos (para verificação durante registro)
DROP POLICY IF EXISTS "Público pode verificar convites válidos" ON user_invites;
CREATE POLICY "Público pode verificar convites válidos"
  ON user_invites FOR SELECT
  TO anon
  USING (
    used_at IS NULL 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (current_uses < max_uses)
  );

-- Função para gerar token único
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  -- Gerar token aleatório de 32 caracteres
  token := encode(gen_random_bytes(24), 'base64');
  -- Remover caracteres especiais e garantir que seja URL-safe
  token := replace(replace(token, '/', '_'), '+', '-');
  token := substring(token from 1 for 32);
  RETURN token;
END;
$$ LANGUAGE plpgsql;
