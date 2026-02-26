-- Adiciona colunas para integração com Cloudflare Stream na tabela artistas_anexos
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE artistas_anexos
ADD COLUMN IF NOT EXISTS stream_uid TEXT;

ALTER TABLE artistas_anexos
ADD COLUMN IF NOT EXISTS stream_iframe_url TEXT;

-- Índice útil
CREATE INDEX IF NOT EXISTS idx_artistas_anexos_stream_uid
  ON artistas_anexos(stream_uid)
  WHERE stream_uid IS NOT NULL;

COMMENT ON COLUMN artistas_anexos.stream_uid IS 'UID do vídeo no Cloudflare Stream (para playback otimizado)';
COMMENT ON COLUMN artistas_anexos.stream_iframe_url IS 'URL do iframe do Cloudflare Stream (opcional; pode ser derivada do UID)';
