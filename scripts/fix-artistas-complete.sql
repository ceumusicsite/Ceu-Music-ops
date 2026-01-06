-- Script COMPLETO para corrigir a estrutura da tabela artistas
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar as colunas faltantes
ALTER TABLE artistas 
ADD COLUMN IF NOT EXISTS contato_email TEXT,
ADD COLUMN IF NOT EXISTS contato_telefone TEXT,
ADD COLUMN IF NOT EXISTS observacoes_internas TEXT,
ADD COLUMN IF NOT EXISTS genero TEXT;

-- 2. Migrar dados das colunas antigas para as novas (se existirem)
UPDATE artistas 
SET contato_email = email 
WHERE contato_email IS NULL AND email IS NOT NULL;

UPDATE artistas 
SET contato_telefone = telefone 
WHERE contato_telefone IS NULL AND telefone IS NOT NULL;

-- 3. Corrigir políticas RLS (Row Level Security)
ALTER TABLE artistas ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Artistas são visíveis para usuários autenticados" ON artistas;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir artistas" ON artistas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar artistas" ON artistas;
DROP POLICY IF EXISTS "Permitir leitura de artistas para usuários autenticados" ON artistas;
DROP POLICY IF EXISTS "Permitir inserção de artistas para usuários autenticados" ON artistas;
DROP POLICY IF EXISTS "Permitir atualização de artistas para usuários autenticados" ON artistas;
DROP POLICY IF EXISTS "Permitir deleção de artistas para usuários autenticados" ON artistas;

-- Criar políticas corretas usando TO authenticated
CREATE POLICY "Permitir leitura de artistas para usuários autenticados"
  ON artistas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir inserção de artistas para usuários autenticados"
  ON artistas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de artistas para usuários autenticados"
  ON artistas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir deleção de artistas para usuários autenticados"
  ON artistas FOR DELETE
  TO authenticated
  USING (true);

-- 4. Verificar se as colunas foram criadas corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'artistas' 
  AND column_name IN ('contato_email', 'contato_telefone', 'observacoes_internas', 'genero')
ORDER BY column_name;

