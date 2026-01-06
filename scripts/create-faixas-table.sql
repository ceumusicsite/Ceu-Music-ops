-- Script para criar a tabela faixas
-- Esta tabela armazena as faixas (músicas) de cada projeto

-- Criar tabela faixas se não existir
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

-- Adicionar constraint para validar status
ALTER TABLE faixas
DROP CONSTRAINT IF EXISTS check_status_faixa;

ALTER TABLE faixas
ADD CONSTRAINT check_status_faixa CHECK (status IN ('gravada', 'pendente'));

-- Criar índice para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_faixas_projeto_id ON faixas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_faixas_ordem ON faixas(projeto_id, ordem);

-- Habilitar RLS
ALTER TABLE faixas ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Faixas são visíveis para usuários autenticados" ON faixas;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir faixas" ON faixas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar faixas" ON faixas;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar faixas" ON faixas;
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

-- Verificar se a tabela foi criada corretamente
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'faixas'
ORDER BY ordinal_position;

