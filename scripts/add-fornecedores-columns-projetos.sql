-- Script para adicionar colunas de fornecedores na tabela projetos
-- Execute este SQL no Supabase SQL Editor

-- Adicionar colunas de fornecedores e profissionais
ALTER TABLE projetos 
ADD COLUMN IF NOT EXISTS fornecedor_audio_id UUID,
ADD COLUMN IF NOT EXISTS fornecedor_video_id UUID,
ADD COLUMN IF NOT EXISTS local_gravacao_id UUID,
ADD COLUMN IF NOT EXISTS produtor_id UUID,
ADD COLUMN IF NOT EXISTS maquiador_id UUID,
ADD COLUMN IF NOT EXISTS outros_profissionais JSONB DEFAULT '[]'::jsonb;

-- Adicionar comentários para documentação
COMMENT ON COLUMN projetos.fornecedor_audio_id IS 'ID do fornecedor de serviços de áudio';
COMMENT ON COLUMN projetos.fornecedor_video_id IS 'ID do fornecedor de serviços de vídeo';
COMMENT ON COLUMN projetos.local_gravacao_id IS 'ID do local/estúdio de gravação';
COMMENT ON COLUMN projetos.produtor_id IS 'ID do produtor musical';
COMMENT ON COLUMN projetos.maquiador_id IS 'ID do maquiador';
COMMENT ON COLUMN projetos.outros_profissionais IS 'Array JSON com IDs de outros profissionais (estilista, diretor, etc.)';

-- Nota: As foreign keys para fornecedores podem ser adicionadas se houver uma tabela de fornecedores
-- Por enquanto, são apenas UUIDs que podem referenciar fornecedores futuramente
