-- Script para verificar as constraints da tabela documentos
-- Execute este SQL no Supabase SQL Editor para ver as constraints

-- Ver todas as colunas da tabela documentos
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'documentos'
ORDER BY ordinal_position;

-- Ver todas as constraints da tabela documentos
SELECT
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'documentos';

