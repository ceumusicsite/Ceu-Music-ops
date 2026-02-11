-- Script completo para criar/atualizar a tabela faixas com todos os status
-- Execute este SQL no Supabase SQL Editor
-- 
-- Este script:
-- 1. Cria a tabela faixas se não existir
-- 2. Configura a constraint com todos os status permitidos
-- 3. Configura índices, RLS e políticas de acesso
-- 4. Cria trigger para atualizar updated_at automaticamente

-- ============================================
-- 1. CRIAR TABELA FAIXAS
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

-- ============================================
-- 2. CONFIGURAR CONSTRAINT DE STATUS
-- ============================================
-- Remover constraint antiga se existir
ALTER TABLE faixas
DROP CONSTRAINT IF EXISTS check_status_faixa;

-- Adicionar nova constraint com todos os status permitidos
ALTER TABLE faixas
ADD CONSTRAINT check_status_faixa CHECK (status IN ('pendente', 'gravada', 'em_mixagem', 'masterizacao', 'finalizada', 'lancada'));

-- ============================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_faixas_projeto_id ON faixas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_faixas_ordem ON faixas(projeto_id, ordem);

-- ============================================
-- 4. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE faixas ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
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
-- 5. CRIAR TRIGGER PARA UPDATED_AT
-- ============================================
-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_faixas_updated_at ON faixas;
CREATE TRIGGER update_faixas_updated_at
  BEFORE UPDATE ON faixas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. VERIFICAÇÃO (OPCIONAL)
-- ============================================
-- Descomente as linhas abaixo para verificar se a tabela foi criada corretamente:
-- SELECT
--   column_name,
--   data_type,
--   is_nullable,
--   column_default
-- FROM information_schema.columns
-- WHERE table_name = 'faixas'
-- ORDER BY ordinal_position;

