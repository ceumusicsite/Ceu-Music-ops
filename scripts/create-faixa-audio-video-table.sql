-- Script para criar a tabela faixa_audio_video
-- Esta tabela armazena arquivos e links de áudio e vídeo para cada faixa

-- Criar tabela faixa_audio_video se não existir
CREATE TABLE IF NOT EXISTS faixa_audio_video (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faixa_id UUID NOT NULL REFERENCES faixas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'audio' ou 'video'
  formato TEXT NOT NULL, -- 'arquivo' ou 'link'
  arquivo_url TEXT, -- URL do arquivo no Supabase Storage (se formato = 'arquivo')
  arquivo_nome TEXT, -- Nome original do arquivo
  link_url TEXT, -- URL externa (se formato = 'link')
  descricao TEXT,
  versao TEXT, -- Ex: 'Master', 'Demo', 'Versão Final', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar constraints para validar tipo e formato
ALTER TABLE faixa_audio_video
DROP CONSTRAINT IF EXISTS check_tipo_audio_video;

ALTER TABLE faixa_audio_video
ADD CONSTRAINT check_tipo_audio_video CHECK (tipo IN ('audio', 'video'));

ALTER TABLE faixa_audio_video
DROP CONSTRAINT IF EXISTS check_formato_audio_video;

ALTER TABLE faixa_audio_video
ADD CONSTRAINT check_formato_audio_video CHECK (formato IN ('arquivo', 'link'));

-- Criar índices para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_faixa_audio_video_faixa_id ON faixa_audio_video(faixa_id);
CREATE INDEX IF NOT EXISTS idx_faixa_audio_video_tipo ON faixa_audio_video(tipo);

-- Habilitar RLS
ALTER TABLE faixa_audio_video ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
DROP POLICY IF EXISTS "Permitir leitura de audio_video para usuários autenticados" ON faixa_audio_video;
DROP POLICY IF EXISTS "Permitir inserção de audio_video para usuários autenticados" ON faixa_audio_video;
DROP POLICY IF EXISTS "Permitir atualização de audio_video para usuários autenticados" ON faixa_audio_video;
DROP POLICY IF EXISTS "Permitir deleção de audio_video para usuários autenticados" ON faixa_audio_video;

CREATE POLICY "Permitir leitura de audio_video para usuários autenticados"
  ON faixa_audio_video FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir inserção de audio_video para usuários autenticados"
  ON faixa_audio_video FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de audio_video para usuários autenticados"
  ON faixa_audio_video FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir deleção de audio_video para usuários autenticados"
  ON faixa_audio_video FOR DELETE
  TO authenticated
  USING (true);

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_faixa_audio_video_updated_at ON faixa_audio_video;
CREATE TRIGGER update_faixa_audio_video_updated_at
  BEFORE UPDATE ON faixa_audio_video
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
