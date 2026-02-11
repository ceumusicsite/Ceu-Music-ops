-- ============================================
-- SCRIPT SEGURO: CRIAR TABELAS SEM DEPENDÊNCIAS
-- Execute este SQL no Supabase SQL Editor
-- 
-- Este script cria as tabelas de forma segura:
-- 1. Cria projetos SEM foreign key para artistas (pode ser adicionada depois)
-- 2. Cria faixas com foreign key para projetos
-- ============================================

-- ============================================
-- PARTE 1: CRIAR TABELA PROJETOS (SEM FK PARA ARTISTAS)
-- ============================================
CREATE TABLE IF NOT EXISTS projetos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'single',
  artista_id UUID, -- Sem foreign key por enquanto
  fase TEXT NOT NULL DEFAULT 'planejamento',
  progresso INTEGER DEFAULT 0,
  prioridade TEXT DEFAULT 'media',
  data_inicio DATE,
  previsao_lancamento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas adicionais se a tabela já existir
ALTER TABLE projetos 
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'single',
ADD COLUMN IF NOT EXISTS artista_id UUID,
ADD COLUMN IF NOT EXISTS fase TEXT DEFAULT 'planejamento',
ADD COLUMN IF NOT EXISTS progresso INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media',
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS previsao_lancamento DATE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS fornecedor_audio_id UUID,
ADD COLUMN IF NOT EXISTS fornecedor_video_id UUID,
ADD COLUMN IF NOT EXISTS local_gravacao_id UUID,
ADD COLUMN IF NOT EXISTS produtor_id UUID,
ADD COLUMN IF NOT EXISTS maquiador_id UUID,
ADD COLUMN IF NOT EXISTS outros_profissionais JSONB DEFAULT '[]'::jsonb;

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

-- Habilitar RLS
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir leitura de projetos para usuários autenticados" ON projetos;
DROP POLICY IF EXISTS "Permitir inserção de projetos para usuários autenticados" ON projetos;
DROP POLICY IF EXISTS "Permitir atualização de projetos para usuários autenticados" ON projetos;
DROP POLICY IF EXISTS "Permitir deleção de projetos para usuários autenticados" ON projetos;

-- Criar políticas RLS
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

-- ============================================
-- PARTE 2: CRIAR TABELA FAIXAS
-- ============================================
CREATE TABLE IF NOT EXISTS faixas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  o_que_falta_gravar TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar constraint de status
ALTER TABLE faixas
DROP CONSTRAINT IF EXISTS check_status_faixa;

ALTER TABLE faixas
ADD CONSTRAINT check_status_faixa CHECK (status IN ('pendente', 'gravada', 'em_mixagem', 'masterizacao', 'finalizada', 'lancada'));

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_faixas_projeto_id ON faixas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_faixas_ordem ON faixas(projeto_id, ordem);

-- Habilitar RLS
ALTER TABLE faixas ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir leitura de faixas para usuários autenticados" ON faixas;
DROP POLICY IF EXISTS "Permitir inserção de faixas para usuários autenticados" ON faixas;
DROP POLICY IF EXISTS "Permitir atualização de faixas para usuários autenticados" ON faixas;
DROP POLICY IF EXISTS "Permitir deleção de faixas para usuários autenticados" ON faixas;

-- Criar políticas RLS
CREATE POLICY "Permitir leitura de faixas para usuários autenticados"
  ON faixas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir inserção de faixas para usuários autenticados"
  ON faixas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de faixas para usuários autenticados"
  ON faixas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir deleção de faixas para usuários autenticados"
  ON faixas FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- PARTE 3: CRIAR FUNÇÃO E TRIGGERS
-- ============================================
-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para projetos
DROP TRIGGER IF EXISTS update_projetos_updated_at ON projetos;
CREATE TRIGGER update_projetos_updated_at
  BEFORE UPDATE ON projetos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar trigger para faixas
DROP TRIGGER IF EXISTS update_faixas_updated_at ON faixas;
CREATE TRIGGER update_faixas_updated_at
  BEFORE UPDATE ON faixas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PARTE 4: ADICIONAR FK PARA ARTISTAS (SE A TABELA EXISTIR)
-- ============================================
-- Tenta adicionar a foreign key para artistas se a tabela existir
-- Se não existir, não vai dar erro (comentado para segurança)
/*
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'artistas') THEN
    -- Adicionar foreign key se a tabela artistas existir
    ALTER TABLE projetos
    DROP CONSTRAINT IF EXISTS projetos_artista_id_fkey;
    
    ALTER TABLE projetos
    ADD CONSTRAINT projetos_artista_id_fkey 
    FOREIGN KEY (artista_id) 
    REFERENCES artistas(id) 
    ON DELETE SET NULL;
  END IF;
END $$;
*/

