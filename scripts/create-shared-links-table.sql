-- Script para criar a tabela de links compartilháveis para formulários de Áudio/Vídeo
-- Execute este SQL no Supabase SQL Editor

-- Criar tabela shared_audio_video_links se não existir
CREATE TABLE IF NOT EXISTS shared_audio_video_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  faixa_id UUID NOT NULL REFERENCES faixas(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('audio', 'video')), -- Permite NULL para que o tipo seja escolhido no formulário
  expira_em TIMESTAMP WITH TIME ZONE,
  usado BOOLEAN DEFAULT FALSE,
  usado_em TIMESTAMP WITH TIME ZONE,
  dados_preenchidos JSONB, -- Armazena os dados do formulário quando preenchido
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Criar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_shared_links_token ON shared_audio_video_links(token);

-- Criar índice para busca por faixa
CREATE INDEX IF NOT EXISTS idx_shared_links_faixa ON shared_audio_video_links(faixa_id);

-- Criar índice para busca por projeto
CREATE INDEX IF NOT EXISTS idx_shared_links_projeto ON shared_audio_video_links(projeto_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE shared_audio_video_links ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados podem criar links
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

-- Política: usuários autenticados podem ver todos os links que criaram
CREATE POLICY "Usuários podem ver links que criaram"
  ON shared_audio_video_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

