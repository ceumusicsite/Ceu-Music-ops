-- Script para criar a tabela listas_transmissao
-- Execute este SQL no Supabase SQL Editor

-- Criar tabela listas_transmissao se não existir
CREATE TABLE IF NOT EXISTS listas_transmissao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  emails TEXT[] NOT NULL DEFAULT '{}',
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE listas_transmissao ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura de listas para admin e executivo" ON listas_transmissao;
DROP POLICY IF EXISTS "Permitir modificação de listas para admin e executivo" ON listas_transmissao;

-- Criar política de leitura: admin e executivo podem ler
CREATE POLICY "Permitir leitura de listas para admin e executivo"
  ON listas_transmissao FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'executivo', 'operador')
    )
  );

-- Criar política de modificação (inserção, atualização, deleção): admin e executivo podem modificar
CREATE POLICY "Permitir modificação de listas para admin e executivo"
  ON listas_transmissao FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'executivo', 'operador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'executivo', 'operador')
    )
  );
