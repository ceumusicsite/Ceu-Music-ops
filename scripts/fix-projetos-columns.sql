-- Script para corrigir a estrutura da tabela projetos
-- Execute este SQL no Supabase SQL Editor

-- Criar tabela projetos se não existir
CREATE TABLE IF NOT EXISTS projetos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'single',
  artista_id UUID REFERENCES artistas(id) ON DELETE SET NULL,
  fase TEXT NOT NULL DEFAULT 'planejamento',
  progresso INTEGER DEFAULT 0,
  prioridade TEXT DEFAULT 'media',
  data_inicio DATE,
  previsao_lancamento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar todas as colunas necessárias (se a tabela já existir mas faltar colunas)
ALTER TABLE projetos 
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'single',
ADD COLUMN IF NOT EXISTS artista_id UUID REFERENCES artistas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS fase TEXT DEFAULT 'planejamento',
ADD COLUMN IF NOT EXISTS progresso INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media',
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS previsao_lancamento DATE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar constraints para validar valores
ALTER TABLE projetos 
DROP CONSTRAINT IF EXISTS check_fase,
DROP CONSTRAINT IF EXISTS check_tipo,
DROP CONSTRAINT IF EXISTS check_prioridade,
DROP CONSTRAINT IF EXISTS check_progresso;

ALTER TABLE projetos 
ADD CONSTRAINT check_fase CHECK (fase IN ('planejamento', 'gravando', 'em_edicao', 'mixagem', 'masterizacao', 'finalizado', 'lancado')),
ADD CONSTRAINT check_tipo CHECK (tipo IN ('single', 'ep', 'album')),
ADD CONSTRAINT check_prioridade CHECK (prioridade IN ('alta', 'media', 'baixa')),
ADD CONSTRAINT check_progresso CHECK (progresso >= 0 AND progresso <= 100);

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
DROP POLICY IF EXISTS "Projetos são visíveis para usuários autenticados" ON projetos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir projetos" ON projetos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar projetos" ON projetos;
DROP POLICY IF EXISTS "Permitir leitura de projetos para usuários autenticados" ON projetos;
DROP POLICY IF EXISTS "Permitir inserção de projetos para usuários autenticados" ON projetos;
DROP POLICY IF EXISTS "Permitir atualização de projetos para usuários autenticados" ON projetos;
DROP POLICY IF EXISTS "Permitir deleção de projetos para usuários autenticados" ON projetos;

-- Criar políticas corretas usando TO authenticated
CREATE POLICY "Permitir leitura de projetos para usuários autenticados"
  ON projetos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir inserção de projetos para usuários autenticados"
  ON projetos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de projetos para usuários autenticados"
  ON projetos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir deleção de projetos para usuários autenticados"
  ON projetos FOR DELETE
  TO authenticated
  USING (true);

-- Verificar se as colunas foram criadas corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projetos' 
  AND column_name IN ('nome', 'tipo', 'artista_id', 'fase', 'progresso', 'prioridade', 'data_inicio', 'previsao_lancamento')
ORDER BY column_name;

