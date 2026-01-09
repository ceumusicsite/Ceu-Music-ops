-- Script para adicionar campos de lançamento e ficha técnica na tabela faixas
-- Execute este SQL no Supabase SQL Editor

-- Adicionar colunas de lançamento
ALTER TABLE faixas
ADD COLUMN IF NOT EXISTS data_lancamento DATE,
ADD COLUMN IF NOT EXISTS plataformas_lancamento TEXT[], -- Array de plataformas (Spotify, YouTube, etc.)
ADD COLUMN IF NOT EXISTS link_spotify TEXT,
ADD COLUMN IF NOT EXISTS link_youtube TEXT,
ADD COLUMN IF NOT EXISTS link_apple_music TEXT,
ADD COLUMN IF NOT EXISTS link_deezer TEXT,
ADD COLUMN IF NOT EXISTS link_outros TEXT[]; -- Array de outros links

-- Adicionar colunas de ficha técnica
ALTER TABLE faixas
ADD COLUMN IF NOT EXISTS compositores TEXT[], -- Array de compositores
ADD COLUMN IF NOT EXISTS letristas TEXT[], -- Array de letristas
ADD COLUMN IF NOT EXISTS arranjadores TEXT[], -- Array de arranjadores
ADD COLUMN IF NOT EXISTS produtores_musicais TEXT[], -- Array de produtores musicais
ADD COLUMN IF NOT EXISTS engenheiros_audio TEXT[], -- Array de engenheiros de áudio
ADD COLUMN IF NOT EXISTS mixagem TEXT, -- Nome do responsável pela mixagem
ADD COLUMN IF NOT EXISTS masterizacao TEXT, -- Nome do responsável pela masterização
ADD COLUMN IF NOT EXISTS gravacao_local TEXT, -- Local de gravação
ADD COLUMN IF NOT EXISTS gravacao_data DATE, -- Data de gravação
ADD COLUMN IF NOT EXISTS genero TEXT,
ADD COLUMN IF NOT EXISTS duracao INTERVAL, -- Duração da faixa
ADD COLUMN IF NOT EXISTS bpm INTEGER, -- BPM da faixa
ADD COLUMN IF NOT EXISTS tonalidade TEXT, -- Tonalidade musical
ADD COLUMN IF NOT EXISTS observacoes_ficha_tecnica TEXT; -- Observações adicionais

-- Adicionar comentários para documentação
COMMENT ON COLUMN faixas.data_lancamento IS 'Data de lançamento da faixa';
COMMENT ON COLUMN faixas.plataformas_lancamento IS 'Array de plataformas onde a faixa foi lançada';
COMMENT ON COLUMN faixas.compositores IS 'Array com nomes dos compositores';
COMMENT ON COLUMN faixas.letristas IS 'Array com nomes dos letristas';
COMMENT ON COLUMN faixas.arranjadores IS 'Array com nomes dos arranjadores';
COMMENT ON COLUMN faixas.produtores_musicais IS 'Array com nomes dos produtores musicais';
COMMENT ON COLUMN faixas.engenheiros_audio IS 'Array com nomes dos engenheiros de áudio';
