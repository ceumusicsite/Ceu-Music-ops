-- Script para corrigir o tipo da coluna parcela na tabela pagamentos
-- Execute este SQL no Supabase SQL Editor
-- Este script altera a coluna parcela de INTEGER para TEXT (se necessário)

-- Verificar e alterar o tipo da coluna parcela
DO $$ 
BEGIN
  -- Se a coluna parcela existir e for INTEGER, alterar para TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pagamentos' 
    AND column_name = 'parcela'
    AND data_type = 'integer'
  ) THEN
    -- Primeiro, converter os valores existentes para TEXT
    ALTER TABLE pagamentos 
    ALTER COLUMN parcela TYPE TEXT USING parcela::TEXT;
    
    RAISE NOTICE 'Coluna parcela alterada de INTEGER para TEXT';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pagamentos' 
    AND column_name = 'parcela'
    AND data_type = 'text'
  ) THEN
    RAISE NOTICE 'Coluna parcela já é do tipo TEXT';
  ELSE
    -- Se a coluna não existir, criar como TEXT
    ALTER TABLE pagamentos 
    ADD COLUMN IF NOT EXISTS parcela TEXT;
    
    RAISE NOTICE 'Coluna parcela criada como TEXT';
  END IF;
END $$;

