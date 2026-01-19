-- Script para permitir inserções anônimas na tabela faixa_audio_video
-- através de links compartilháveis válidos
-- Execute este SQL no Supabase SQL Editor

-- Política: permitir inserção anônima quando há um link compartilhável válido associado
-- Isso permite que o formulário compartilhável funcione sem autenticação
CREATE POLICY "Permitir inserção anônima via link compartilhável"
  ON faixa_audio_video
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM shared_audio_video_links 
      WHERE shared_audio_video_links.faixa_id = faixa_audio_video.faixa_id
        AND shared_audio_video_links.usado = false
        AND (shared_audio_video_links.expira_em IS NULL OR shared_audio_video_links.expira_em > NOW())
    )
  );

-- Política: permitir leitura anônima de áudio/vídeo associados a links compartilháveis válidos
CREATE POLICY "Permitir leitura anônima via link compartilhável"
  ON faixa_audio_video
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 
      FROM shared_audio_video_links 
      WHERE shared_audio_video_links.faixa_id = faixa_audio_video.faixa_id
        AND shared_audio_video_links.usado = false
        AND (shared_audio_video_links.expira_em IS NULL OR shared_audio_video_links.expira_em > NOW())
    )
  );

