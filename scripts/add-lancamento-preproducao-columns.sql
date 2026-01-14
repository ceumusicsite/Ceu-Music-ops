-- Script para adicionar colunas de data de lançamento e pré-produção
-- Execute este SQL no Supabase SQL Editor

-- Adicionar colunas para data de lançamento
ALTER TABLE projetos 
ADD COLUMN IF NOT EXISTS data_lancamento DATE,
ADD COLUMN IF NOT EXISTS tipo_data_lancamento TEXT DEFAULT 'prevista' CHECK (tipo_data_lancamento IN ('real', 'prevista')),
ADD COLUMN IF NOT EXISTS tem_pre_producao BOOLEAN;

-- Comentários para documentação
COMMENT ON COLUMN projetos.data_lancamento IS 'Data real de lançamento do projeto';
COMMENT ON COLUMN projetos.tipo_data_lancamento IS 'Tipo da data: real (data de lançamento) ou prevista (previsão de lançamento)';
COMMENT ON COLUMN projetos.tem_pre_producao IS 'Indica se o projeto tem pré-produção (true) ou não (false)';
