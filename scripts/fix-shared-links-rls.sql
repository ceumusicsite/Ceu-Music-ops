-- Script para corrigir políticas RLS da tabela shared_audio_video_links
-- Execute este SQL no Supabase SQL Editor

-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários autenticados podem criar links compartilháveis" ON shared_audio_video_links;
DROP POLICY IF EXISTS "Qualquer pessoa pode ler links válidos" ON shared_audio_video_links;
DROP POLICY IF EXISTS "Qualquer pessoa pode atualizar links válidos" ON shared_audio_video_links;
DROP POLICY IF EXISTS "Usuários podem ver links que criaram" ON shared_audio_video_links;

-- Política: usuários autenticados podem criar links (com ou sem created_by)
CREATE POLICY "Usuários autenticados podem criar links compartilháveis"
  ON shared_audio_video_links
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: qualquer pessoa pode ler links não expirados e não usados (para preencher formulário)
CREATE POLICY "Qualquer pessoa pode ler links válidos"
  ON shared_audio_video_links
  FOR SELECT
  TO anon, authenticated
  USING (
    usado = FALSE 
    AND (expira_em IS NULL OR expira_em > NOW())
  );

-- Política: usuários autenticados podem ver todos os links que criaram (se created_by estiver preenchido)
CREATE POLICY "Usuários podem ver links que criaram"
  ON shared_audio_video_links
  FOR SELECT
  TO authenticated
  USING (
    created_by IS NULL 
    OR auth.uid() = created_by
  );

-- Política: qualquer pessoa pode atualizar links válidos para marcar como usado
CREATE POLICY "Qualquer pessoa pode atualizar links válidos"
  ON shared_audio_video_links
  FOR UPDATE
  TO anon, authenticated
  USING (
    usado = FALSE 
    AND (expira_em IS NULL OR expira_em > NOW())
  )
  WITH CHECK (
    usado = TRUE 
    AND dados_preenchidos IS NOT NULL
  );

