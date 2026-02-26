-- Tabela para armazenar metadados de pastas e arquivos de covers
-- Estrutura tipo drive com hierarquia de pastas independente

CREATE TABLE IF NOT EXISTS covers_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo: 'pasta' ou 'arquivo'
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('pasta', 'arquivo')),
  
  -- Nome do arquivo ou pasta
  nome VARCHAR(255) NOT NULL,
  
  -- ID da pasta pai (NULL para raiz)
  pasta_pai_id UUID REFERENCES covers_anexos(id) ON DELETE CASCADE,
  
  -- Para arquivos: informações do arquivo no R2
  arquivo_key TEXT, -- Key no R2 (ex: covers/pasta/arquivo.pdf)
  arquivo_url TEXT, -- URL do arquivo (signed ou pública)
  arquivo_tamanho BIGINT, -- Tamanho em bytes
  arquivo_tipo VARCHAR(100), -- MIME type (ex: application/pdf)
  arquivo_extensao VARCHAR(10), -- Extensão (ex: pdf)
  
  -- Transmissão (Cloudflare Stream)
  stream_uid TEXT,
  stream_iframe_url TEXT,
  
  -- Metadados
  descricao TEXT,
  tags TEXT[], -- Array de tags para busca
  
  -- Ordenação
  ordem INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT arquivo_deve_ter_key CHECK (
    (tipo = 'arquivo' AND arquivo_key IS NOT NULL) OR 
    (tipo = 'pasta')
  ),
  CONSTRAINT pasta_nao_deve_ter_key CHECK (
    (tipo = 'pasta' AND arquivo_key IS NULL) OR 
    (tipo = 'arquivo')
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_covers_anexos_pasta_pai_id ON covers_anexos(pasta_pai_id);
CREATE INDEX IF NOT EXISTS idx_covers_anexos_tipo ON covers_anexos(tipo);
CREATE INDEX IF NOT EXISTS idx_covers_anexos_nome ON covers_anexos(nome);
CREATE INDEX IF NOT EXISTS idx_covers_anexos_tags ON covers_anexos USING GIN(tags);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_covers_anexos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_covers_anexos_updated_at
  BEFORE UPDATE ON covers_anexos
  FOR EACH ROW
  EXECUTE FUNCTION update_covers_anexos_updated_at();

-- RLS (Row Level Security)
ALTER TABLE covers_anexos ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem gerenciar seu próprio "drive" de covers
-- Para simplificar inicialmente, todos os usuários autenticados compartilham o drive de covers
CREATE POLICY "Usuários autenticados podem ver covers"
  ON covers_anexos
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem criar covers"
  ON covers_anexos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar covers"
  ON covers_anexos
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar covers"
  ON covers_anexos
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Comentários
COMMENT ON TABLE covers_anexos IS 'Armazena metadados de pastas e arquivos de covers (tipo drive)';
COMMENT ON COLUMN covers_anexos.tipo IS 'Tipo: pasta ou arquivo';
COMMENT ON COLUMN covers_anexos.pasta_pai_id IS 'ID da pasta pai (NULL para raiz)';
COMMENT ON COLUMN covers_anexos.arquivo_key IS 'Key do arquivo no Cloudflare R2';
