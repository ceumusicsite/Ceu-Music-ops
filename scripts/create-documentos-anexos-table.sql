-- Script para criar tabela de anexos de documentos
-- Permite múltiplos arquivos por documento
-- Execute este SQL no Supabase SQL Editor
--
-- IMPORTANTE: Os arquivos dos anexos são salvos no Cloudflare R2, não no Supabase Storage.
-- Esta tabela apenas armazena as referências (URL, key, nome) dos arquivos que estão no R2.
-- O campo 'arquivo_key' armazena o key do arquivo no R2 para gerar URLs assinadas quando necessário.

-- Criar tabela documentos_anexos se não existir
CREATE TABLE IF NOT EXISTS documentos_anexos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id UUID NOT NULL,
  arquivo_url TEXT NOT NULL,
  arquivo_nome TEXT NOT NULL,
  arquivo_key TEXT,
  arquivo_tipo TEXT,
  arquivo_tamanho BIGINT,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_documento FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE
);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_documentos_anexos_documento_id ON documentos_anexos(documento_id);
CREATE INDEX IF NOT EXISTS idx_documentos_anexos_ordem ON documentos_anexos(documento_id, ordem);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_documentos_anexos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_documentos_anexos_updated_at ON documentos_anexos;
CREATE TRIGGER trigger_update_documentos_anexos_updated_at
BEFORE UPDATE ON documentos_anexos
FOR EACH ROW
EXECUTE FUNCTION update_documentos_anexos_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE documentos_anexos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
DO $$ 
BEGIN
  -- Política para SELECT: todos os usuários autenticados podem ler
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documentos_anexos' 
    AND policyname = 'documentos_anexos_select_policy'
  ) THEN
    CREATE POLICY documentos_anexos_select_policy ON documentos_anexos
    FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;

  -- Política para INSERT: todos os usuários autenticados podem inserir
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documentos_anexos' 
    AND policyname = 'documentos_anexos_insert_policy'
  ) THEN
    CREATE POLICY documentos_anexos_insert_policy ON documentos_anexos
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
  END IF;

  -- Política para UPDATE: todos os usuários autenticados podem atualizar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documentos_anexos' 
    AND policyname = 'documentos_anexos_update_policy'
  ) THEN
    CREATE POLICY documentos_anexos_update_policy ON documentos_anexos
    FOR UPDATE
    USING (auth.role() = 'authenticated');
  END IF;

  -- Política para DELETE: todos os usuários autenticados podem deletar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documentos_anexos' 
    AND policyname = 'documentos_anexos_delete_policy'
  ) THEN
    CREATE POLICY documentos_anexos_delete_policy ON documentos_anexos
    FOR DELETE
    USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Adicionar comentários
COMMENT ON TABLE documentos_anexos IS 'Tabela de anexos adicionais para documentos. Os arquivos são armazenados no Cloudflare R2.';
COMMENT ON COLUMN documentos_anexos.documento_id IS 'Referência ao documento principal';
COMMENT ON COLUMN documentos_anexos.arquivo_url IS 'URL do arquivo no Cloudflare R2 (pode ser signed URL temporária)';
COMMENT ON COLUMN documentos_anexos.arquivo_nome IS 'Nome original do arquivo';
COMMENT ON COLUMN documentos_anexos.arquivo_key IS 'Key do arquivo no Cloudflare R2 para gerar URLs assinadas quando necessário';
COMMENT ON COLUMN documentos_anexos.arquivo_tipo IS 'Tipo MIME do arquivo';
COMMENT ON COLUMN documentos_anexos.arquivo_tamanho IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN documentos_anexos.descricao IS 'Descrição opcional do anexo';
COMMENT ON COLUMN documentos_anexos.ordem IS 'Ordem de exibição dos anexos';

