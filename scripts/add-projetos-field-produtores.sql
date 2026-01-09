-- Script para adicionar o campo projetos na tabela produtores
-- Execute este SQL no Supabase SQL Editor
-- Este script é seguro para executar múltiplas vezes (idempotente)

-- Adicionar coluna projetos se não existir
ALTER TABLE produtores 
ADD COLUMN IF NOT EXISTS projetos TEXT DEFAULT '[]';

-- Comentário na coluna para documentação
COMMENT ON COLUMN produtores.projetos IS 'Array JSON de projetos realizados pelo produtor. Formato: [{"id": "uuid", "nome": "string", "artista": "string", "tipo": "string", "ano": number}]';

-- Verificar se a coluna foi criada
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'produtores' 
    AND column_name = 'projetos'
  ) THEN
    RAISE NOTICE 'Coluna projetos adicionada com sucesso na tabela produtores';
  ELSE
    RAISE WARNING 'Coluna projetos não foi encontrada. Verifique se a tabela produtores existe.';
  END IF;
END $$;

