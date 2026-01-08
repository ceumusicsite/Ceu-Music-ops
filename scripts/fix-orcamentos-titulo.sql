-- Script para tornar a coluna titulo opcional na tabela orcamentos
-- Execute este SQL no Supabase SQL Editor

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
    RAISE NOTICE 'Coluna titulo tornada opcional';
  ELSE
    -- Se a coluna não existir, criar como opcional
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orcamentos' 
      AND column_name = 'titulo'
    ) THEN
      ALTER TABLE orcamentos ADD COLUMN titulo TEXT;
      RAISE NOTICE 'Coluna titulo criada como opcional';
    END IF;
  END IF;
END $$;



