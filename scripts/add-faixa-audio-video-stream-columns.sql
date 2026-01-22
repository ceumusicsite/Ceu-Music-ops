-- Adiciona colunas para integração com Cloudflare Stream + R2
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE faixa_audio_video
ADD COLUMN IF NOT EXISTS arquivo_bucket TEXT;

ALTER TABLE faixa_audio_video
ADD COLUMN IF NOT EXISTS arquivo_key TEXT;

ALTER TABLE faixa_audio_video
ADD COLUMN IF NOT EXISTS stream_uid TEXT;

ALTER TABLE faixa_audio_video
ADD COLUMN IF NOT EXISTS stream_iframe_url TEXT;

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_faixa_audio_video_stream_uid
  ON faixa_audio_video(stream_uid)
  WHERE stream_uid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_faixa_audio_video_arquivo_key
  ON faixa_audio_video(arquivo_key)
  WHERE arquivo_key IS NOT NULL;

COMMENT ON COLUMN faixa_audio_video.arquivo_bucket IS 'Bucket do arquivo no R2 (para regenerar URL quando necessário)';
COMMENT ON COLUMN faixa_audio_video.arquivo_key IS 'Key do arquivo no R2 (para regenerar URL quando necessário)';
COMMENT ON COLUMN faixa_audio_video.stream_uid IS 'UID do vídeo no Cloudflare Stream (para playback interno)';
COMMENT ON COLUMN faixa_audio_video.stream_iframe_url IS 'URL do iframe do Cloudflare Stream (opcional; pode ser derivada do UID)';

