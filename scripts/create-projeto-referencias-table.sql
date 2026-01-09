-- Script para criar a tabela projeto_referencias
-- Execute este SQL no Supabase SQL Editor

-- Criar tabela projeto_referencias se não existir
CREATE TABLE IF NOT EXISTS projeto_referencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  faixa_id UUID REFERENCES faixas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('youtube_url', 'arquivo')),
  url TEXT, -- URL do YouTube ou link externo
  arquivo_url TEXT, -- URL do arquivo no Supabase Storage
  arquivo_nome TEXT, -- Nome original do arquivo
  titulo TEXT,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_projeto_referencias_projeto_id ON projeto_referencias(projeto_id);
CREATE INDEX IF NOT EXISTS idx_projeto_referencias_faixa_id ON projeto_referencias(faixa_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_projeto_referencias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_projeto_referencias_updated_at ON projeto_referencias;
CREATE TRIGGER trigger_update_projeto_referencias_updated_at
  BEFORE UPDATE ON projeto_referencias
  FOR EACH ROW
  EXECUTE FUNCTION update_projeto_referencias_updated_at();

-- Habilitar RLS
ALTER TABLE projeto_referencias ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
DROP POLICY IF EXISTS "Projeto referencias são visíveis para usuários autenticados" ON projeto_referencias;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir projeto referencias" ON projeto_referencias;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar projeto referencias" ON projeto_referencias;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar projeto referencias" ON projeto_referencias;

CREATE POLICY "Projeto referencias são visíveis para usuários autenticados"
  ON projeto_referencias FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir projeto referencias"
  ON projeto_referencias FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar projeto referencias"
  ON projeto_referencias FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar projeto referencias"
  ON projeto_referencias FOR DELETE
  USING (auth.role() = 'authenticated');
