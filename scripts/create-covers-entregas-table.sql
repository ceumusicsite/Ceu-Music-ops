-- Tabela para armazenar informações de entrega de material aos clientes
CREATE TABLE IF NOT EXISTS covers_entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  items JSONB NOT NULL, -- Array de IDs de covers_anexos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expira_em TIMESTAMP WITH TIME ZONE, -- Opcional: data de expiração
  visualizacoes INTEGER DEFAULT 0
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_covers_entregas_slug ON covers_entregas(slug);

-- RLS (Row Level Security)
ALTER TABLE covers_entregas ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode ver uma entrega se souber o slug (público)
CREATE POLICY "Acesso público às entregas por slug"
  ON covers_entregas
  FOR SELECT
  USING (true);

-- Política: Apenas usuários autenticados podem criar entregas
CREATE POLICY "Usuários autenticados podem criar entregas"
  ON covers_entregas
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política: Apenas usuários autenticados podem atualizar entregas
CREATE POLICY "Usuários autenticados podem atualizar entregas"
  ON covers_entregas
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Comentários
COMMENT ON TABLE covers_entregas IS 'Armazena informações de pacotes de material entregues a clientes';
