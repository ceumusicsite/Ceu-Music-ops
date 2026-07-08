-- Script para criar a tabela campanhas_email
-- Execute este SQL no Supabase SQL Editor

-- Criar tabela campanhas_email se não existir
CREATE TABLE IF NOT EXISTS campanhas_email (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assunto TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  destinatarios_tipo TEXT NOT NULL CHECK (destinatarios_tipo IN ('artistas', 'produtores', 'fornecedores', 'todos')),
  total_destinatarios INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviando', 'enviado', 'erro')),
  erro_detalhes TEXT,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE campanhas_email ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura de campanhas para admin e executivo" ON campanhas_email;
DROP POLICY IF EXISTS "Permitir inserção de campanhas para admin e executivo" ON campanhas_email;
DROP POLICY IF EXISTS "Permitir leitura de campanhas para usuários autenticados" ON campanhas_email;
DROP POLICY IF EXISTS "Permitir inserção de campanhas para usuários autenticados" ON campanhas_email;

-- Criar política de leitura: admin e executivo podem ler
CREATE POLICY "Permitir leitura de campanhas para admin e executivo"
  ON campanhas_email FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'executivo')
    )
  );

-- Criar política de inserção: admin e executivo podem inserir
CREATE POLICY "Permitir inserção de campanhas para admin e executivo"
  ON campanhas_email FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'executivo')
    )
  );
