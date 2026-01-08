-- Script para adicionar todas as colunas necessárias na tabela lancamentos
-- Execute este SQL no Supabase SQL Editor
-- Este script é seguro para executar mesmo se a tabela já existir
-- Ele apenas adiciona as colunas que faltam, sem modificar as existentes

-- Remover constraint de status se existir (para permitir flexibilidade)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'lancamentos_status_check'
  ) THEN
    ALTER TABLE lancamentos DROP CONSTRAINT lancamentos_status_check;
  END IF;
END $$;

-- Adicionar todas as colunas necessárias (apenas se não existirem)
-- Cada coluna em uma declaração separada
DO $$ 
BEGIN
  -- Adicionar titulo se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' AND column_name = 'titulo'
  ) THEN
    ALTER TABLE lancamentos ADD COLUMN titulo TEXT;
  END IF;

  -- Adicionar artista_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' AND column_name = 'artista_id'
  ) THEN
    ALTER TABLE lancamentos ADD COLUMN artista_id UUID;
  END IF;

  -- Adicionar projeto_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' AND column_name = 'projeto_id'
  ) THEN
    ALTER TABLE lancamentos ADD COLUMN projeto_id UUID;
  END IF;

  -- Adicionar tipo se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE lancamentos ADD COLUMN tipo TEXT;
  END IF;

  -- Adicionar plataforma se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' AND column_name = 'plataforma'
  ) THEN
    ALTER TABLE lancamentos ADD COLUMN plataforma TEXT;
  END IF;

  -- Adicionar data_planejada se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' AND column_name = 'data_planejada'
  ) THEN
    ALTER TABLE lancamentos ADD COLUMN data_planejada DATE;
  END IF;

  -- Adicionar data_real se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' AND column_name = 'data_real'
  ) THEN
    ALTER TABLE lancamentos ADD COLUMN data_real DATE;
  END IF;

  -- Adicionar status se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' AND column_name = 'status'
  ) THEN
    ALTER TABLE lancamentos ADD COLUMN status TEXT DEFAULT 'agendado';
  ELSE
    -- Se já existe, garantir que tenha um default
    ALTER TABLE lancamentos ALTER COLUMN status SET DEFAULT 'agendado';
  END IF;

  -- Adicionar url se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' AND column_name = 'url'
  ) THEN
    ALTER TABLE lancamentos ADD COLUMN url TEXT;
  END IF;

  -- Adicionar streams se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' AND column_name = 'streams'
  ) THEN
    ALTER TABLE lancamentos ADD COLUMN streams NUMERIC(12, 2);
  END IF;

  -- Adicionar observacoes se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' AND column_name = 'observacoes'
  ) THEN
    ALTER TABLE lancamentos ADD COLUMN observacoes TEXT;
  END IF;

  -- Adicionar created_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE lancamentos ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Adicionar updated_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE lancamentos ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Tornar campos opcionais (remover NOT NULL se existir)
DO $$ 
BEGIN
  -- Tornar titulo opcional se for NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' 
    AND column_name = 'titulo' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE lancamentos ALTER COLUMN titulo DROP NOT NULL;
  END IF;

  -- Tornar plataforma opcional se for NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' 
    AND column_name = 'plataforma' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE lancamentos ALTER COLUMN plataforma DROP NOT NULL;
  END IF;

  -- Tornar data_planejada opcional se for NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' 
    AND column_name = 'data_planejada' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE lancamentos ALTER COLUMN data_planejada DROP NOT NULL;
  END IF;
END $$;

-- Adicionar foreign keys (apenas se as colunas existirem e as tabelas referenciadas existirem)
DO $$ 
BEGIN
  -- Adicionar foreign key para artista_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' 
    AND column_name = 'artista_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'artistas'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'lancamentos_artista_id_fkey'
  ) THEN
    ALTER TABLE lancamentos 
    ADD CONSTRAINT lancamentos_artista_id_fkey 
    FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE SET NULL;
  END IF;

  -- Adicionar foreign key para projeto_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos' 
    AND column_name = 'projeto_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'projetos'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'lancamentos_projeto_id_fkey'
  ) THEN
    ALTER TABLE lancamentos 
    ADD CONSTRAINT lancamentos_projeto_id_fkey 
    FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_lancamentos_artista_id ON lancamentos(artista_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_projeto_id ON lancamentos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON lancamentos(status);
CREATE INDEX IF NOT EXISTS idx_lancamentos_plataforma ON lancamentos(plataforma);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_planejada ON lancamentos(data_planejada);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_lancamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lancamentos_updated_at ON lancamentos;
CREATE TRIGGER trigger_update_lancamentos_updated_at
BEFORE UPDATE ON lancamentos
FOR EACH ROW
EXECUTE FUNCTION update_lancamentos_updated_at();

-- Habilitar RLS (Row Level Security) se ainda não estiver habilitado
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (apenas se não existirem)
DO $$ 
BEGIN
  -- Política para SELECT: todos os usuários autenticados podem ler
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lancamentos' 
    AND policyname = 'lancamentos_select_policy'
  ) THEN
    CREATE POLICY lancamentos_select_policy ON lancamentos
    FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;

  -- Política para INSERT: todos os usuários autenticados podem inserir
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lancamentos' 
    AND policyname = 'lancamentos_insert_policy'
  ) THEN
    CREATE POLICY lancamentos_insert_policy ON lancamentos
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
  END IF;

  -- Política para UPDATE: todos os usuários autenticados podem atualizar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lancamentos' 
    AND policyname = 'lancamentos_update_policy'
  ) THEN
    CREATE POLICY lancamentos_update_policy ON lancamentos
    FOR UPDATE
    USING (auth.role() = 'authenticated');
  END IF;

  -- Política para DELETE: todos os usuários autenticados podem deletar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lancamentos' 
    AND policyname = 'lancamentos_delete_policy'
  ) THEN
    CREATE POLICY lancamentos_delete_policy ON lancamentos
    FOR DELETE
    USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Adicionar comentários nas colunas para documentação
COMMENT ON TABLE lancamentos IS 'Tabela de lançamentos musicais';
COMMENT ON COLUMN lancamentos.titulo IS 'Título do lançamento';
COMMENT ON COLUMN lancamentos.artista_id IS 'Referência ao artista';
COMMENT ON COLUMN lancamentos.projeto_id IS 'Referência ao projeto relacionado';
COMMENT ON COLUMN lancamentos.tipo IS 'Tipo do lançamento (Single, EP, Álbum, Clipe, etc)';
COMMENT ON COLUMN lancamentos.plataforma IS 'Plataforma de lançamento (Spotify, YouTube, etc)';
COMMENT ON COLUMN lancamentos.data_planejada IS 'Data planejada para o lançamento';
COMMENT ON COLUMN lancamentos.data_real IS 'Data real do lançamento';
COMMENT ON COLUMN lancamentos.status IS 'Status do lançamento (agendado, publicado, cancelado)';
COMMENT ON COLUMN lancamentos.url IS 'URL do lançamento na plataforma';
COMMENT ON COLUMN lancamentos.streams IS 'Número de streams/visualizações';
COMMENT ON COLUMN lancamentos.observacoes IS 'Observações adicionais sobre o lançamento';
