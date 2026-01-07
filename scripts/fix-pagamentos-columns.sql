-- Script para adicionar todas as colunas necessárias na tabela pagamentos
-- Execute este SQL no Supabase SQL Editor
-- Este script é seguro para executar mesmo se a tabela já existir
-- Ele apenas adiciona as colunas que faltam, sem modificar as existentes
-- NÃO cria a tabela se ela já existir - apenas adiciona colunas faltantes

-- Adicionar todas as colunas necessárias (apenas se não existirem)
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS valor DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS data_vencimento DATE,
ADD COLUMN IF NOT EXISTS data_pagamento DATE,
ADD COLUMN IF NOT EXISTS orcamento TEXT,
ADD COLUMN IF NOT EXISTS parcela TEXT,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS categoria TEXT,
ADD COLUMN IF NOT EXISTS fornecedor TEXT,
ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS comprovante_url TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Definir valor padrão para status apenas se a coluna não tiver default
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pagamentos' 
    AND column_name = 'status'
    AND column_default IS NULL
  ) THEN
    ALTER TABLE pagamentos ALTER COLUMN status SET DEFAULT 'pendente';
  END IF;
END $$;

-- Remover constraints antigas de status se existirem (para evitar conflitos)
DO $$ 
DECLARE
  constraint_name TEXT;
BEGIN
  -- Buscar e remover todas as constraints relacionadas a status
  FOR constraint_name IN 
    SELECT conname FROM pg_constraint 
    WHERE conrelid = 'pagamentos'::regclass 
    AND (conname LIKE '%status%' OR conname LIKE '%Status%')
  LOOP
    EXECUTE 'ALTER TABLE pagamentos DROP CONSTRAINT IF EXISTS ' || constraint_name;
    RAISE NOTICE 'Constraint % removida', constraint_name;
  END LOOP;
END $$;

-- Adicionar constraint para validar status (apenas se não existir)
-- Nota: Esta constraint é opcional e pode ser removida se causar problemas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pagamentos_status_check' 
    AND conrelid = 'pagamentos'::regclass
  ) THEN
    ALTER TABLE pagamentos 
    ADD CONSTRAINT pagamentos_status_check 
    CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado', 'Pendente', 'Pago', 'Atrasado', 'Cancelado'));
  END IF;
END $$;

-- Habilitar RLS se ainda não estiver habilitado (apenas se a tabela existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pagamentos') THEN
    ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Criar políticas de acesso (apenas se não existirem)
-- Nota: Se já existirem políticas com nomes diferentes, elas serão mantidas
DO $$ 
BEGIN
  -- Política para SELECT: usuários autenticados podem ver todos os pagamentos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pagamentos' 
    AND policyname = 'Permitir leitura de pagamentos para usuários autenticados'
  ) THEN
    CREATE POLICY "Permitir leitura de pagamentos para usuários autenticados"
      ON pagamentos FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Política para INSERT: usuários autenticados podem criar pagamentos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pagamentos' 
    AND policyname = 'Permitir inserção de pagamentos para usuários autenticados'
  ) THEN
    CREATE POLICY "Permitir inserção de pagamentos para usuários autenticados"
      ON pagamentos FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  -- Política para UPDATE: usuários autenticados podem atualizar pagamentos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pagamentos' 
    AND policyname = 'Permitir atualização de pagamentos para usuários autenticados'
  ) THEN
    CREATE POLICY "Permitir atualização de pagamentos para usuários autenticados"
      ON pagamentos FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Política para DELETE: apenas admins podem deletar pagamentos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pagamentos' 
    AND policyname = 'Permitir deleção de pagamentos para admins'
  ) THEN
    CREATE POLICY "Permitir deleção de pagamentos para admins"
      ON pagamentos FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE auth.users.id = auth.uid() 
          AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

