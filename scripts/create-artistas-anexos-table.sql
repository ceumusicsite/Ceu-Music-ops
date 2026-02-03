-- Tabela para armazenar metadados de pastas e arquivos dos artistas
-- Estrutura tipo drive com hierarquia de pastas

CREATE TABLE IF NOT EXISTS artistas_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artista_id UUID NOT NULL REFERENCES artistas(id) ON DELETE CASCADE,
  
  -- Tipo: 'pasta' ou 'arquivo'
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('pasta', 'arquivo')),
  
  -- Nome do arquivo ou pasta
  nome VARCHAR(255) NOT NULL,
  
  -- ID da pasta pai (NULL para raiz)
  pasta_pai_id UUID REFERENCES artistas_anexos(id) ON DELETE CASCADE,
  
  -- Para arquivos: informações do arquivo no R2
  arquivo_key TEXT, -- Key no R2 (ex: artistas/{artista_id}/pasta/arquivo.pdf)
  arquivo_url TEXT, -- URL do arquivo (signed ou pública)
  arquivo_tamanho BIGINT, -- Tamanho em bytes
  arquivo_tipo VARCHAR(100), -- MIME type (ex: application/pdf)
  arquivo_extensao VARCHAR(10), -- Extensão (ex: pdf)
  
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
CREATE INDEX IF NOT EXISTS idx_artistas_anexos_artista_id ON artistas_anexos(artista_id);
CREATE INDEX IF NOT EXISTS idx_artistas_anexos_pasta_pai_id ON artistas_anexos(pasta_pai_id);
CREATE INDEX IF NOT EXISTS idx_artistas_anexos_tipo ON artistas_anexos(tipo);
CREATE INDEX IF NOT EXISTS idx_artistas_anexos_nome ON artistas_anexos(nome);

-- Índice para busca por tags
CREATE INDEX IF NOT EXISTS idx_artistas_anexos_tags ON artistas_anexos USING GIN(tags);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_artistas_anexos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_artistas_anexos_updated_at
  BEFORE UPDATE ON artistas_anexos
  FOR EACH ROW
  EXECUTE FUNCTION update_artistas_anexos_updated_at();

-- RLS (Row Level Security)
ALTER TABLE artistas_anexos ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ver anexos dos artistas
CREATE POLICY "Usuários autenticados podem ver anexos"
  ON artistas_anexos
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política: Usuários autenticados podem criar anexos
CREATE POLICY "Usuários autenticados podem criar anexos"
  ON artistas_anexos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política: Usuários autenticados podem atualizar anexos
CREATE POLICY "Usuários autenticados podem atualizar anexos"
  ON artistas_anexos
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política: Usuários autenticados podem deletar anexos
CREATE POLICY "Usuários autenticados podem deletar anexos"
  ON artistas_anexos
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Comentários
COMMENT ON TABLE artistas_anexos IS 'Armazena metadados de pastas e arquivos dos artistas (tipo drive)';
COMMENT ON COLUMN artistas_anexos.tipo IS 'Tipo: pasta ou arquivo';
COMMENT ON COLUMN artistas_anexos.pasta_pai_id IS 'ID da pasta pai (NULL para raiz)';
COMMENT ON COLUMN artistas_anexos.arquivo_key IS 'Key do arquivo no Cloudflare R2';
COMMENT ON COLUMN artistas_anexos.tags IS 'Array de tags para busca e organização';
