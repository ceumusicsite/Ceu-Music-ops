-- Script para atualizar a tabela shared_audio_video_links
-- Permitir que o campo tipo seja NULL (para que possa ser escolhido no formulário)
-- Execute este SQL no Supabase SQL Editor se a tabela já foi criada

-- Remover a constraint NOT NULL do campo tipo
ALTER TABLE shared_audio_video_links 
ALTER COLUMN tipo DROP NOT NULL;

-- Atualizar a constraint CHECK para permitir NULL
ALTER TABLE shared_audio_video_links 
DROP CONSTRAINT IF EXISTS shared_audio_video_links_tipo_check;

ALTER TABLE shared_audio_video_links 
ADD CONSTRAINT shared_audio_video_links_tipo_check 
CHECK (tipo IS NULL OR tipo IN ('audio', 'video'));

