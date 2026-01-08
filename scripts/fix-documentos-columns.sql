-- Script para criar a tabela documentos e adicionar todas as colunas necessárias
-- Execute este SQL no Supabase SQL Editor
-- Este script é seguro para executar mesmo se a tabela já existir
-- Ele apenas adiciona as colunas que faltam, sem modificar as existentes

-- Criar tabela documentos se não existir
CREATE TABLE IF NOT EXISTS documentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  artista_id UUID,
  projeto_id UUID,
  data_inicio DATE,
  data_fim DATE,
  valor NUMERIC(12, 2),
  descricao TEXT,
  status TEXT DEFAULT 'ativo',
  arquivo_url TEXT,
  arquivo_nome TEXT,
  identificacao_partes TEXT,
  objeto_escopo TEXT,
  valores_pagamento TEXT,
  vigencia_prazos TEXT,
  termos_legais TEXT,
  assinatura TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar todas as colunas necessárias (apenas se não existirem)
DO $$ 
BEGIN
  -- Adicionar titulo se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'titulo'
  ) THEN
    ALTER TABLE documentos ADD COLUMN titulo TEXT;
  END IF;

  -- Adicionar tipo se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE documentos ADD COLUMN tipo TEXT;
  END IF;

  -- Adicionar artista_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'artista_id'
  ) THEN
    ALTER TABLE documentos ADD COLUMN artista_id UUID;
  END IF;

  -- Adicionar projeto_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'projeto_id'
  ) THEN
    ALTER TABLE documentos ADD COLUMN projeto_id UUID;
  END IF;

  -- Adicionar data_inicio se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'data_inicio'
  ) THEN
    ALTER TABLE documentos ADD COLUMN data_inicio DATE;
  END IF;

  -- Adicionar data_fim se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'data_fim'
  ) THEN
    ALTER TABLE documentos ADD COLUMN data_fim DATE;
  END IF;

  -- Adicionar valor se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'valor'
  ) THEN
    ALTER TABLE documentos ADD COLUMN valor NUMERIC(12, 2);
  END IF;

  -- Adicionar descricao se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'descricao'
  ) THEN
    ALTER TABLE documentos ADD COLUMN descricao TEXT;
  END IF;

  -- Adicionar status se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'status'
  ) THEN
    ALTER TABLE documentos ADD COLUMN status TEXT DEFAULT 'ativo';
  ELSE
    -- Se já existe, garantir que tenha um default
    ALTER TABLE documentos ALTER COLUMN status SET DEFAULT 'ativo';
  END IF;

  -- Adicionar arquivo_url se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'arquivo_url'
  ) THEN
    ALTER TABLE documentos ADD COLUMN arquivo_url TEXT;
  END IF;

  -- Adicionar arquivo_nome se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'arquivo_nome'
  ) THEN
    ALTER TABLE documentos ADD COLUMN arquivo_nome TEXT;
  END IF;

  -- Adicionar identificacao_partes se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'identificacao_partes'
  ) THEN
    ALTER TABLE documentos ADD COLUMN identificacao_partes TEXT;
  END IF;

  -- Adicionar objeto_escopo se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'objeto_escopo'
  ) THEN
    ALTER TABLE documentos ADD COLUMN objeto_escopo TEXT;
  END IF;

  -- Adicionar valores_pagamento se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'valores_pagamento'
  ) THEN
    ALTER TABLE documentos ADD COLUMN valores_pagamento TEXT;
  END IF;

  -- Adicionar vigencia_prazos se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'vigencia_prazos'
  ) THEN
    ALTER TABLE documentos ADD COLUMN vigencia_prazos TEXT;
  END IF;

  -- Adicionar termos_legais se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'termos_legais'
  ) THEN
    ALTER TABLE documentos ADD COLUMN termos_legais TEXT;
  END IF;

  -- Adicionar assinatura se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'assinatura'
  ) THEN
    ALTER TABLE documentos ADD COLUMN assinatura TEXT;
  END IF;

  -- Adicionar created_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE documentos ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Adicionar updated_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE documentos ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Tornar campos opcionais (remover NOT NULL se existir)
DO $$ 
BEGIN
  -- Tornar titulo opcional se for NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' 
    AND column_name = 'titulo' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE documentos ALTER COLUMN titulo DROP NOT NULL;
  END IF;

  -- Tornar tipo opcional se for NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' 
    AND column_name = 'tipo' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE documentos ALTER COLUMN tipo DROP NOT NULL;
  END IF;
END $$;

-- Adicionar foreign keys (apenas se as colunas existirem e as tabelas referenciadas existirem)
DO $$ 
BEGIN
  -- Adicionar foreign key para artista_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' 
    AND column_name = 'artista_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'artistas'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'documentos_artista_id_fkey'
  ) THEN
    ALTER TABLE documentos 
    ADD CONSTRAINT documentos_artista_id_fkey 
    FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE SET NULL;
  END IF;

  -- Adicionar foreign key para projeto_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' 
    AND column_name = 'projeto_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'projetos'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'documentos_projeto_id_fkey'
  ) THEN
    ALTER TABLE documentos 
    ADD CONSTRAINT documentos_projeto_id_fkey 
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_documentos_artista_id ON documentos(artista_id);
CREATE INDEX IF NOT EXISTS idx_documentos_projeto_id ON documentos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos(tipo);
CREATE INDEX IF NOT EXISTS idx_documentos_status ON documentos(status);
CREATE INDEX IF NOT EXISTS idx_documentos_data_inicio ON documentos(data_inicio);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_documentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_documentos_updated_at ON documentos;
CREATE TRIGGER trigger_update_documentos_updated_at
BEFORE UPDATE ON documentos
FOR EACH ROW
EXECUTE FUNCTION update_documentos_updated_at();

-- Habilitar RLS (Row Level Security) se ainda não estiver habilitado
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (apenas se não existirem)
DO $$ 
BEGIN
  -- Política para SELECT: todos os usuários autenticados podem ler
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documentos' 
    AND policyname = 'documentos_select_policy'
  ) THEN
    CREATE POLICY documentos_select_policy ON documentos
    FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;

  -- Política para INSERT: todos os usuários autenticados podem inserir
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documentos' 
    AND policyname = 'documentos_insert_policy'
  ) THEN
    CREATE POLICY documentos_insert_policy ON documentos
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
  END IF;

  -- Política para UPDATE: todos os usuários autenticados podem atualizar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documentos' 
    AND policyname = 'documentos_update_policy'
  ) THEN
    CREATE POLICY documentos_update_policy ON documentos
    FOR UPDATE
    USING (auth.role() = 'authenticated');
  END IF;

  -- Política para DELETE: todos os usuários autenticados podem deletar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documentos' 
    AND policyname = 'documentos_delete_policy'
  ) THEN
    CREATE POLICY documentos_delete_policy ON documentos
    FOR DELETE
    USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Adicionar comentários nas colunas para documentação
COMMENT ON TABLE documentos IS 'Tabela de documentos e contratos da gravadora';
COMMENT ON COLUMN documentos.titulo IS 'Título do documento';
COMMENT ON COLUMN documentos.tipo IS 'Tipo do documento (contrato, termo, aditivo, outro)';
COMMENT ON COLUMN documentos.artista_id IS 'Referência ao artista relacionado';
COMMENT ON COLUMN documentos.projeto_id IS 'Referência ao projeto relacionado';
COMMENT ON COLUMN documentos.data_inicio IS 'Data de início do contrato/documento';
COMMENT ON COLUMN documentos.data_fim IS 'Data de fim do contrato/documento';
COMMENT ON COLUMN documentos.valor IS 'Valor do contrato/documento';
COMMENT ON COLUMN documentos.descricao IS 'Descrição detalhada do documento';
COMMENT ON COLUMN documentos.status IS 'Status do documento (ativo, vencido, cancelado)';
COMMENT ON COLUMN documentos.arquivo_url IS 'URL do arquivo no Supabase Storage';
COMMENT ON COLUMN documentos.arquivo_nome IS 'Nome original do arquivo';
COMMENT ON COLUMN documentos.identificacao_partes IS 'Identificação das partes envolvidas no contrato (Quem?)';
COMMENT ON COLUMN documentos.objeto_escopo IS 'Objeto e escopo do contrato/documento (O quê?)';
COMMENT ON COLUMN documentos.valores_pagamento IS 'Valores e condições de pagamento (Quanto e Como?)';
COMMENT ON COLUMN documentos.vigencia_prazos IS 'Vigência e prazos do contrato/documento (Quando?)';
COMMENT ON COLUMN documentos.termos_legais IS 'Termos legais e cláusulas do contrato';
COMMENT ON COLUMN documentos.assinatura IS 'Assinaturas e concordância das partes';

