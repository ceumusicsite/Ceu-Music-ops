-- Script para adicionar ordenação personalizada aos artistas
-- Execute este SQL no Supabase SQL Editor

-- Adicionar coluna ordem
ALTER TABLE artistas 
ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_artistas_ordem ON artistas(ordem);

-- Inicializar ordem dos artistas existentes
-- (mantém a ordem atual baseada em created_at)
UPDATE artistas
SET ordem = subquery.row_num
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM artistas
) AS subquery
WHERE artistas.id = subquery.id;

-- Comentário
COMMENT ON COLUMN artistas.ordem IS 'Ordem de exibição personalizada. Menor = aparece primeiro.';

