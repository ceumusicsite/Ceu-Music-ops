-- Tabela para armazenar tokens da conta YouTube da CEU Music
-- Esta tabela armazena os tokens de forma segura no backend
-- Todos os uploads usarão sempre esta conta

CREATE TABLE IF NOT EXISTS youtube_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Garantir que só existe um registro (a conta CEU Music)
  CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Índice único para garantir apenas um registro
CREATE UNIQUE INDEX IF NOT EXISTS youtube_tokens_single_row ON youtube_tokens ((true));

-- RLS (Row Level Security) - Apenas usuários autenticados podem ler
ALTER TABLE youtube_tokens ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver (para evitar erro ao reexecutar)
DROP POLICY IF EXISTS "Usuários autenticados podem ler tokens YouTube" ON youtube_tokens;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar tokens YouTube" ON youtube_tokens;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir tokens YouTube" ON youtube_tokens;

-- Política: Apenas usuários autenticados podem ler os tokens
CREATE POLICY "Usuários autenticados podem ler tokens YouTube"
  ON youtube_tokens
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Apenas usuários autenticados podem atualizar os tokens
CREATE POLICY "Usuários autenticados podem atualizar tokens YouTube"
  ON youtube_tokens
  FOR UPDATE
  TO authenticated
  USING (true);

-- Política: Apenas usuários autenticados podem inserir tokens
CREATE POLICY "Usuários autenticados podem inserir tokens YouTube"
  ON youtube_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_youtube_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se houver (para evitar erro ao reexecutar)
DROP TRIGGER IF EXISTS update_youtube_tokens_updated_at ON youtube_tokens;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_youtube_tokens_updated_at
  BEFORE UPDATE ON youtube_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_youtube_tokens_updated_at();

-- Comentários para documentação
COMMENT ON TABLE youtube_tokens IS 'Armazena tokens OAuth da conta YouTube da CEU Music. Todos os uploads usam esta conta compartilhada.';
COMMENT ON COLUMN youtube_tokens.access_token IS 'Token de acesso OAuth do YouTube';
COMMENT ON COLUMN youtube_tokens.refresh_token IS 'Token de refresh para renovar o access_token quando expirar';
COMMENT ON COLUMN youtube_tokens.expires_at IS 'Data/hora de expiração do access_token';
COMMENT ON COLUMN youtube_tokens.scope IS 'Escopos OAuth concedidos (ex: youtube.upload)';
