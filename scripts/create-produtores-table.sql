-- Script para criar a tabela produtores
-- Execute este SQL no Supabase SQL Editor

-- Criar tabela produtores se não existir
CREATE TABLE IF NOT EXISTS produtores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  especialidade TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disponivel',
  contato_email TEXT NOT NULL,
  contato_telefone TEXT,
  instagram TEXT,
  portfolio TEXT,
  anos_experiencia INTEGER DEFAULT 0,
  artistas_trabalhados TEXT, -- JSON array como string
  projetos TEXT, -- JSON array como string
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar constraints para validar valores
ALTER TABLE produtores 
DROP CONSTRAINT IF EXISTS check_status;

ALTER TABLE produtores 
ADD CONSTRAINT check_status CHECK (status IN ('ativo', 'ocupado', 'disponivel', 'inativo'));

-- Criar índice para busca
CREATE INDEX IF NOT EXISTS idx_produtores_nome ON produtores(nome);
CREATE INDEX IF NOT EXISTS idx_produtores_status ON produtores(status);
CREATE INDEX IF NOT EXISTS idx_produtores_created_at ON produtores(created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE produtores ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura para usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem ler produtores" ON produtores;
CREATE POLICY "Usuários autenticados podem ler produtores"
  ON produtores FOR SELECT
  TO authenticated
  USING (true);

-- Criar política para permitir inserção para usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem inserir produtores" ON produtores;
CREATE POLICY "Usuários autenticados podem inserir produtores"
  ON produtores FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Criar política para permitir atualização para usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar produtores" ON produtores;
CREATE POLICY "Usuários autenticados podem atualizar produtores"
  ON produtores FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Criar política para permitir exclusão para usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem deletar produtores" ON produtores;
CREATE POLICY "Usuários autenticados podem deletar produtores"
  ON produtores FOR DELETE
  TO authenticated
  USING (true);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_produtores_updated_at ON produtores;
CREATE TRIGGER update_produtores_updated_at
  BEFORE UPDATE ON produtores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

