-- Script para adicionar campos de identificação, distribuição, titularidade, documentação (Seção 7) e créditos oficiais (Seção 8) na tabela faixas
-- Execute este script no Supabase SQL Editor

ALTER TABLE faixas
ADD COLUMN IF NOT EXISTS titulo_oficial TEXT,
ADD COLUMN IF NOT EXISTS titulo_provisorio TEXT,
ADD COLUMN IF NOT EXISTS versao_faixa TEXT,
ADD COLUMN IF NOT EXISTS versao_faixa_outra TEXT,
ADD COLUMN IF NOT EXISTS duracao TEXT,
ADD COLUMN IF NOT EXISTS isrc TEXT,
ADD COLUMN IF NOT EXISTS upc_ean TEXT,
ADD COLUMN IF NOT EXISTS data_prevista_lancamento DATE,
ADD COLUMN IF NOT EXISTS data_efetiva_lancamento DATE,
ADD COLUMN IF NOT EXISTS distribuidora_digital TEXT,
ADD COLUMN IF NOT EXISTS titular_fonograma TEXT DEFAULT 'Céu Music',
ADD COLUMN IF NOT EXISTS produtor_fonografico TEXT DEFAULT 'Céu Music',
ADD COLUMN IF NOT EXISTS modelo_exploracao TEXT,
ADD COLUMN IF NOT EXISTS modelo_exploracao_outro TEXT,
ADD COLUMN IF NOT EXISTS documentacao_obrigatoria JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS credito_artista TEXT,
ADD COLUMN IF NOT EXISTS credito_producao_musical TEXT,
ADD COLUMN IF NOT EXISTS credito_compositores TEXT,
ADD COLUMN IF NOT EXISTS credito_musicos TEXT,
ADD COLUMN IF NOT EXISTS credito_mixagem TEXT,
ADD COLUMN IF NOT EXISTS credito_masterizacao TEXT,
ADD COLUMN IF NOT EXISTS credito_demais_obrigatorios TEXT;

-- Comentários para documentação
COMMENT ON COLUMN faixas.titulo_oficial IS 'Título Oficial da Faixa';
COMMENT ON COLUMN faixas.titulo_provisorio IS 'Título Provisório da Faixa';
COMMENT ON COLUMN faixas.versao_faixa IS 'Versão: Original, Ao vivo, Acústica, Remix, Versão, Outra';
COMMENT ON COLUMN faixas.duracao IS 'Duração no formato MM:SS';
COMMENT ON COLUMN faixas.isrc IS 'Código ISRC da faixa';
COMMENT ON COLUMN faixas.upc_ean IS 'Código UPC/EAN da faixa';
COMMENT ON COLUMN faixas.data_prevista_lancamento IS 'Data prevista de lançamento da faixa';
COMMENT ON COLUMN faixas.data_efetiva_lancamento IS 'Data efetiva de lançamento da faixa';
COMMENT ON COLUMN faixas.distribuidora_digital IS 'Distribuidora digital';
COMMENT ON COLUMN faixas.titular_fonograma IS 'Titular do fonograma (master)';
COMMENT ON COLUMN faixas.produtor_fonografico IS 'Produtor fonográfico';
COMMENT ON COLUMN faixas.modelo_exploracao IS 'Modelo de exploração';
COMMENT ON COLUMN faixas.documentacao_obrigatoria IS 'Status da documentação obrigatória (Seção 7)';
COMMENT ON COLUMN faixas.credito_artista IS 'Crédito do artista (Seção 8)';
COMMENT ON COLUMN faixas.credito_producao_musical IS 'Crédito de produção musical (Seção 8)';
COMMENT ON COLUMN faixas.credito_compositores IS 'Crédito de compositores (Seção 8)';
COMMENT ON COLUMN faixas.credito_musicos IS 'Crédito de músicos (Seção 8)';
COMMENT ON COLUMN faixas.credito_mixagem IS 'Crédito de mixagem (Seção 8)';
COMMENT ON COLUMN faixas.credito_masterizacao IS 'Crédito de masterização (Seção 8)';
COMMENT ON COLUMN faixas.credito_demais_obrigatorios IS 'Demais créditos obrigatórios (Seção 8)';
