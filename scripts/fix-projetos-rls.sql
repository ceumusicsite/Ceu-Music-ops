-- Script para corrigir as políticas RLS da tabela projetos
-- Execute este SQL no Supabase SQL Editor

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Projetos são visíveis para usuários autenticados" ON projetos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir projetos" ON projetos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar projetos" ON projetos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar projetos" ON projetos;

-- Criar políticas corretas para RLS
-- Política para SELECT (visualizar)
CREATE POLICY "Permitir leitura de projetos para usuários autenticados"
  ON projetos FOR SELECT
  TO authenticated
  USING (true);

-- Política para INSERT (criar)
CREATE POLICY "Permitir inserção de projetos para usuários autenticados"
  ON projetos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para UPDATE (atualizar)
CREATE POLICY "Permitir atualização de projetos para usuários autenticados"
  ON projetos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para DELETE (deletar)
CREATE POLICY "Permitir deleção de projetos para usuários autenticados"
  ON projetos FOR DELETE
  TO authenticated
  USING (true);

-- Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'projetos';

