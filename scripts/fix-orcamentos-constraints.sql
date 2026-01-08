-- Script para corrigir constraints da tabela orcamentos
-- Execute este SQL no Supabase SQL Editor

-- Remover constraint antiga de tipo que está causando erro
ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS orcamentos_tipo_check;
ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS check_tipo;
ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS tipo_check;

-- Tornar a coluna titulo opcional
ALTER TABLE orcamentos ALTER COLUMN titulo DROP NOT NULL;

-- Verificar e listar todas as constraints da tabela
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'orcamentos'::regclass;



