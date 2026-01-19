-- Script para adicionar campo de nome do anexador na tabela faixa_audio_video
-- Execute este SQL no Supabase SQL Editor

-- Adicionar coluna nome_anexador
ALTER TABLE faixa_audio_video
ADD COLUMN IF NOT EXISTS nome_anexador TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN faixa_audio_video.nome_anexador IS 'Nome da pessoa que anexou o áudio/vídeo através do link compartilhável';

