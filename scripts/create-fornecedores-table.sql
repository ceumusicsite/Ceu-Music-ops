-- Script para criar a tabela fornecedores
-- Execute este SQL no Supabase SQL Editor

-- Criar tabela fornecedores se não existir
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tipo_servico TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo',
  contato_email TEXT NOT NULL,
  contato_telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cnpj TEXT,
  responsavel TEXT,
  website TEXT,
  observacoes TEXT,
  projetos_utilizados INTEGER DEFAULT 0,
  avaliacao NUMERIC(3, 1), -- Permite valores como 4.8, 4.9, etc.
  servicos TEXT, -- JSON array como string
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar constraints para validar valores
ALTER TABLE fornecedores 
DROP CONSTRAINT IF EXISTS check_categoria;

ALTER TABLE fornecedores 
ADD CONSTRAINT check_categoria CHECK (categoria IN ('estudio', 'equipamento', 'servico', 'outro'));

ALTER TABLE fornecedores 
DROP CONSTRAINT IF EXISTS check_status;

ALTER TABLE fornecedores 
ADD CONSTRAINT check_status CHECK (status IN ('ativo', 'inativo', 'suspenso'));

-- Criar índices para busca
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX IF NOT EXISTS idx_fornecedores_categoria ON fornecedores(categoria);
CREATE INDEX IF NOT EXISTS idx_fornecedores_status ON fornecedores(status);
CREATE INDEX IF NOT EXISTS idx_fornecedores_created_at ON fornecedores(created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura para usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem ler fornecedores" ON fornecedores;
CREATE POLICY "Usuários autenticados podem ler fornecedores"
  ON fornecedores FOR SELECT
  TO authenticated
  USING (true);

-- Criar política para permitir inserção para usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem inserir fornecedores" ON fornecedores;
CREATE POLICY "Usuários autenticados podem inserir fornecedores"
  ON fornecedores FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Criar política para permitir atualização para usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar fornecedores" ON fornecedores;
CREATE POLICY "Usuários autenticados podem atualizar fornecedores"
  ON fornecedores FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Criar política para permitir exclusão para usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem deletar fornecedores" ON fornecedores;
CREATE POLICY "Usuários autenticados podem deletar fornecedores"
  ON fornecedores FOR DELETE
  TO authenticated
  USING (true);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_fornecedores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fornecedores_updated_at ON fornecedores;
CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION update_fornecedores_updated_at();

