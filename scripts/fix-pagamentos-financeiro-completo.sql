-- Script para adicionar colunas de controle financeiro completo na tabela pagamentos
-- Execute este SQL no Supabase SQL Editor
-- Este script é seguro para executar mesmo se a tabela já existir
-- Ele apenas adiciona as colunas que faltam, sem modificar as existentes
-- NÃO cria a tabela se ela já existir - apenas adiciona colunas faltantes

-- ============================================
-- 1. CONTROLE DE ORÇADO VS. REALIZADO
-- ============================================

-- Adicionar coluna para valor orçado (valor planejado)
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS valor_orcado DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS valor_realizado DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS diferenca_orcado_realizado DECIMAL(10, 2);

-- Adicionar orcamento_id para vincular ao orçamento (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pagamentos' 
    AND column_name = 'orcamento_id'
  ) THEN
    -- Verificar se a tabela orcamentos existe antes de criar foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orcamentos') THEN
      ALTER TABLE pagamentos 
      ADD COLUMN orcamento_id UUID REFERENCES orcamentos(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE pagamentos 
      ADD COLUMN orcamento_id UUID;
    END IF;
  END IF;
END $$;

-- ============================================
-- 2. FLUXO DE CAIXA E PAGAMENTOS
-- ============================================

-- Adicionar colunas para controle de fluxo de caixa
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS data_prevista_pagamento DATE,
ADD COLUMN IF NOT EXISTS tipo_movimentacao TEXT,
ADD COLUMN IF NOT EXISTS categoria_fluxo_caixa TEXT,
ADD COLUMN IF NOT EXISTS saldo_projetado DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS saldo_real DECIMAL(10, 2);

-- Definir valor padrão para tipo_movimentacao
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pagamentos' 
    AND column_name = 'tipo_movimentacao'
    AND column_default IS NULL
  ) THEN
    ALTER TABLE pagamentos ALTER COLUMN tipo_movimentacao SET DEFAULT 'saida';
  END IF;
END $$;

-- ============================================
-- 3. TRANSPARÊNCIA NO EXTRATO DO ARTISTA
-- ============================================

-- Adicionar colunas para vinculação com artista e projeto
DO $$ 
BEGIN
  -- Adicionar artista_id (se não existir)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pagamentos' 
    AND column_name = 'artista_id'
  ) THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artistas') THEN
      ALTER TABLE pagamentos 
      ADD COLUMN artista_id UUID REFERENCES artistas(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE pagamentos 
      ADD COLUMN artista_id UUID;
    END IF;
  END IF;

  -- Adicionar projeto_id (se não existir)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pagamentos' 
    AND column_name = 'projeto_id'
  ) THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projetos') THEN
      ALTER TABLE pagamentos 
      ADD COLUMN projeto_id UUID REFERENCES projetos(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE pagamentos 
      ADD COLUMN projeto_id UUID;
    END IF;
  END IF;
END $$;

-- Adicionar colunas para detalhamento do extrato
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS descricao_detalhada TEXT,
ADD COLUMN IF NOT EXISTS categoria_financeira TEXT,
ADD COLUMN IF NOT EXISTS centro_custo TEXT,
ADD COLUMN IF NOT EXISTS nota_fiscal TEXT,
ADD COLUMN IF NOT EXISTS numero_documento TEXT;

-- ============================================
-- 4. ADICIONAR CONSTRAINTS (OPCIONAL)
-- ============================================

-- Constraint para tipo_movimentacao (apenas se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'pagamentos_tipo_movimentacao_check' 
    AND conrelid = 'pagamentos'::regclass
  ) THEN
    ALTER TABLE pagamentos 
    ADD CONSTRAINT pagamentos_tipo_movimentacao_check 
    CHECK (tipo_movimentacao IN ('entrada', 'saida', 'Entrada', 'Saida', 'ENTRADA', 'SAIDA'));
  END IF;
END $$;

-- ============================================
-- 5. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================

-- Índices para consultas frequentes (apenas se não existirem)
DO $$ 
BEGIN
  -- Índice para artista_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'pagamentos' 
    AND indexname = 'idx_pagamentos_artista_id'
  ) THEN
    CREATE INDEX idx_pagamentos_artista_id ON pagamentos(artista_id);
  END IF;

  -- Índice para projeto_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'pagamentos' 
    AND indexname = 'idx_pagamentos_projeto_id'
  ) THEN
    CREATE INDEX idx_pagamentos_projeto_id ON pagamentos(projeto_id);
  END IF;

  -- Índice para orcamento_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'pagamentos' 
    AND indexname = 'idx_pagamentos_orcamento_id'
  ) THEN
    CREATE INDEX idx_pagamentos_orcamento_id ON pagamentos(orcamento_id);
  END IF;

  -- Índice para data_vencimento (para filtros de data)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'pagamentos' 
    AND indexname = 'idx_pagamentos_data_vencimento'
  ) THEN
    CREATE INDEX idx_pagamentos_data_vencimento ON pagamentos(data_vencimento);
  END IF;

  -- Índice para status (para filtros de status)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'pagamentos' 
    AND indexname = 'idx_pagamentos_status'
  ) THEN
    CREATE INDEX idx_pagamentos_status ON pagamentos(status);
  END IF;

  -- Índice para tipo_movimentacao
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'pagamentos' 
    AND indexname = 'idx_pagamentos_tipo_movimentacao'
  ) THEN
    CREATE INDEX idx_pagamentos_tipo_movimentacao ON pagamentos(tipo_movimentacao);
  END IF;
END $$;

-- ============================================
-- 6. FUNÇÃO PARA CALCULAR DIFERENÇA AUTOMÁTICA (OPCIONAL)
-- ============================================

-- Criar função para calcular diferença orçado vs realizado
CREATE OR REPLACE FUNCTION calcular_diferenca_orcado_realizado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.valor_orcado IS NOT NULL AND NEW.valor_realizado IS NOT NULL THEN
    NEW.diferenca_orcado_realizado := NEW.valor_realizado - NEW.valor_orcado;
  ELSIF NEW.valor IS NOT NULL AND NEW.valor_orcado IS NOT NULL THEN
    -- Se valor_realizado não estiver preenchido, usar valor como realizado
    NEW.diferenca_orcado_realizado := NEW.valor - NEW.valor_orcado;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para calcular diferença automaticamente (apenas se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_calcular_diferenca_orcado_realizado'
  ) THEN
    CREATE TRIGGER trigger_calcular_diferenca_orcado_realizado
    BEFORE INSERT OR UPDATE ON pagamentos
    FOR EACH ROW
    EXECUTE FUNCTION calcular_diferenca_orcado_realizado();
  END IF;
END $$;

-- ============================================
-- 7. COMENTÁRIOS NAS COLUNAS (DOCUMENTAÇÃO)
-- ============================================

COMMENT ON COLUMN pagamentos.valor_orcado IS 'Valor planejado/orçado para este pagamento';
COMMENT ON COLUMN pagamentos.valor_realizado IS 'Valor efetivamente realizado/pago';
COMMENT ON COLUMN pagamentos.diferenca_orcado_realizado IS 'Diferença entre valor realizado e orçado (calculado automaticamente)';
COMMENT ON COLUMN pagamentos.orcamento_id IS 'Referência ao orçamento relacionado';
COMMENT ON COLUMN pagamentos.data_prevista_pagamento IS 'Data prevista para o pagamento (pode ser diferente da data de vencimento)';
COMMENT ON COLUMN pagamentos.tipo_movimentacao IS 'Tipo de movimentação: entrada ou saída';
COMMENT ON COLUMN pagamentos.categoria_fluxo_caixa IS 'Categoria para agrupamento no fluxo de caixa';
COMMENT ON COLUMN pagamentos.artista_id IS 'Referência ao artista relacionado ao pagamento';
COMMENT ON COLUMN pagamentos.projeto_id IS 'Referência ao projeto relacionado ao pagamento';
COMMENT ON COLUMN pagamentos.descricao_detalhada IS 'Descrição detalhada para o extrato do artista';
COMMENT ON COLUMN pagamentos.categoria_financeira IS 'Categoria financeira para agrupamento e relatórios';

