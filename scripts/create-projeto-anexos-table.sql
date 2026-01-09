-- Script para criar a tabela projeto_anexos
-- Execute este SQL no Supabase SQL Editor

-- Criar tabela projeto_anexos se não existir
CREATE TABLE IF NOT EXISTS projeto_anexos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  faixa_id UUID REFERENCES faixas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('pre', 'outro')),
  arquivo_url TEXT NOT NULL,
  arquivo_nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_projeto_anexos_projeto_id ON projeto_anexos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_projeto_anexos_faixa_id ON projeto_anexos(faixa_id);
CREATE INDEX IF NOT EXISTS idx_projeto_anexos_tipo ON projeto_anexos(tipo);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_projeto_anexos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_projeto_anexos_updated_at ON projeto_anexos;
CREATE TRIGGER trigger_update_projeto_anexos_updated_at
  BEFORE UPDATE ON projeto_anexos
  FOR EACH ROW
  EXECUTE FUNCTION update_projeto_anexos_updated_at();

-- Habilitar RLS
ALTER TABLE projeto_anexos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
DROP POLICY IF EXISTS "Projeto anexos são visíveis para usuários autenticados" ON projeto_anexos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir projeto anexos" ON projeto_anexos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar projeto anexos" ON projeto_anexos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar projeto anexos" ON projeto_anexos;

CREATE POLICY "Projeto anexos são visíveis para usuários autenticados"
  ON projeto_anexos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir projeto anexos"
  ON projeto_anexos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar projeto anexos"
  ON projeto_anexos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar projeto anexos"
  ON projeto_anexos FOR DELETE
  USING (auth.role() = 'authenticated');
