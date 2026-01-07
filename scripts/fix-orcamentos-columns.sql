-- Script para adicionar todas as colunas necessárias na tabela orcamentos
-- Execute este SQL no Supabase SQL Editor
-- Este script é seguro para executar mesmo se a tabela já existir
-- Ele apenas adiciona as colunas que faltam, sem modificar as existentes

-- Tornar a coluna titulo opcional se ela existir e for obrigatória
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orcamentos' 
    AND column_name = 'titulo'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE orcamentos ALTER COLUMN titulo DROP NOT NULL;
  END IF;
END $$;

-- Adicionar todas as colunas necessárias (apenas se não existirem)
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS tipo TEXT,
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS titulo TEXT,
ADD COLUMN IF NOT EXISTS projeto TEXT,
ADD COLUMN IF NOT EXISTS valor DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS solicitado_por TEXT,
ADD COLUMN IF NOT EXISTS solicitante TEXT,
ADD COLUMN IF NOT EXISTS data DATE,
ADD COLUMN IF NOT EXISTS vinculo_artista TEXT,
ADD COLUMN IF NOT EXISTS recuperabilidade TEXT,
ADD COLUMN IF NOT EXISTS centro_custo TEXT,
ADD COLUMN IF NOT EXISTS divisao_verbas TEXT,
ADD COLUMN IF NOT EXISTS break_even DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS cronograma_desembolso TEXT,
ADD COLUMN IF NOT EXISTS reserva_contingencia DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS auditabilidade TEXT,
ADD COLUMN IF NOT EXISTS fluxo_caixa TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar artista_id com foreign key (apenas se a coluna não existir e a tabela artistas existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orcamentos' 
    AND column_name = 'artista_id'
  ) THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artistas') THEN
      ALTER TABLE orcamentos 
      ADD COLUMN artista_id UUID REFERENCES artistas(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE orcamentos 
      ADD COLUMN artista_id UUID;
    END IF;
  END IF;
END $$;

-- Remover constraints antigas de tipo se existirem
DO $$ 
DECLARE
  constraint_name TEXT;
BEGIN
  -- Buscar e remover todas as constraints relacionadas a tipo
  FOR constraint_name IN 
    SELECT conname FROM pg_constraint 
    WHERE conrelid = 'orcamentos'::regclass 
    AND (conname LIKE '%tipo%' OR conname LIKE '%Tipo%')
  LOOP
    EXECUTE 'ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS ' || constraint_name;
    RAISE NOTICE 'Constraint % removida', constraint_name;
  END LOOP;
END $$;

-- Adicionar constraints para validar valores (apenas se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_status' 
    AND conrelid = 'orcamentos'::regclass
  ) THEN
    ALTER TABLE orcamentos 
    ADD CONSTRAINT check_status CHECK (status IN ('pendente', 'aprovado', 'recusado', 'Pendente', 'Aprovado', 'Recusado'));
  END IF;
END $$;

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (apenas se não existirem)
-- Nota: Se já existirem políticas com nomes diferentes, elas serão mantidas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orcamentos' 
    AND policyname = 'Permitir leitura de orcamentos para usuários autenticados'
  ) THEN
    CREATE POLICY "Permitir leitura de orcamentos para usuários autenticados"
      ON orcamentos FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orcamentos' 
    AND policyname = 'Permitir inserção de orcamentos para usuários autenticados'
  ) THEN
    CREATE POLICY "Permitir inserção de orcamentos para usuários autenticados"
      ON orcamentos FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orcamentos' 
    AND policyname = 'Permitir atualização de orcamentos para usuários autenticados'
  ) THEN
    CREATE POLICY "Permitir atualização de orcamentos para usuários autenticados"
      ON orcamentos FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orcamentos' 
    AND policyname = 'Permitir deleção de orcamentos para usuários autenticados'
  ) THEN
    CREATE POLICY "Permitir deleção de orcamentos para usuários autenticados"
      ON orcamentos FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

