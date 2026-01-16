-- Script para corrigir a constraint de categoria na tabela documentos
-- Execute este SQL no Supabase SQL Editor

-- Primeiro, verificar qual constraint existe
SELECT 
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'documentos' 
  AND tc.constraint_type = 'CHECK'
  AND tc.constraint_name LIKE '%categoria%';

-- Remover a constraint antiga se existir
ALTER TABLE documentos 
DROP CONSTRAINT IF EXISTS documentos_categoria_check;

-- Adicionar coluna categoria se não existir
ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS categoria TEXT;

-- Criar nova constraint com os valores corretos
-- Os valores permitidos são os mesmos do campo tipo: contrato, termo, aditivo, outro
-- Permitir NULL também para documentos antigos
ALTER TABLE documentos 
ADD CONSTRAINT documentos_categoria_check 
CHECK (categoria IS NULL OR categoria IN ('contrato', 'termo', 'aditivo', 'outro'));

-- Atualizar documentos existentes que podem ter categoria NULL ou inválida
-- Se a categoria for NULL mas o tipo existir, copiar o tipo para categoria
UPDATE documentos 
SET categoria = tipo 
WHERE categoria IS NULL 
  AND tipo IS NOT NULL 
  AND tipo IN ('contrato', 'termo', 'aditivo', 'outro');

-- Comentário explicativo
COMMENT ON COLUMN documentos.categoria IS 'Categoria do documento (deve ser igual ao tipo: contrato, termo, aditivo, outro)';

