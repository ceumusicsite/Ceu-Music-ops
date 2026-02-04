-- Script para adicionar campo arquivo_key na tabela documentos
-- Execute este SQL no Supabase SQL Editor

-- Adicionar coluna arquivo_key se não existir
ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS arquivo_key TEXT;

-- Criar índice para busca rápida por key
CREATE INDEX IF NOT EXISTS idx_documentos_arquivo_key ON documentos(arquivo_key) WHERE arquivo_key IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN documentos.arquivo_key IS 'Key do arquivo no storage (R2 ou Supabase) para gerar novas URLs assinadas quando necessário';










