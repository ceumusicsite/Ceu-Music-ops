-- Script SQL para criar tabela de documentos e configurar permissões
-- Execute este script no SQL Editor do Supabase

-- ============================================
-- 1. Criar tabela de documentos
-- ============================================

CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('contrato', 'letra', 'guia_gravacao', 'arte')),
  tipo_associacao TEXT NOT NULL CHECK (tipo_associacao IN ('artista', 'projeto', 'nenhum')),
  artista_id UUID REFERENCES artistas(id) ON DELETE SET NULL,
  projeto_id UUID REFERENCES projetos(id) ON DELETE SET NULL,
  arquivo_url TEXT NOT NULL,
  arquivo_nome TEXT NOT NULL,
  tamanho BIGINT,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Criar índices para melhorar performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_documentos_artista_id ON documentos(artista_id);
CREATE INDEX IF NOT EXISTS idx_documentos_projeto_id ON documentos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_documentos_categoria ON documentos(categoria);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo_associacao ON documentos(tipo_associacao);
CREATE INDEX IF NOT EXISTS idx_documentos_created_at ON documentos(created_at DESC);

-- ============================================
-- 3. Criar função para atualizar updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Criar trigger para atualizar updated_at automaticamente
-- ============================================

DROP TRIGGER IF EXISTS update_documentos_updated_at ON documentos;
CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON documentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Habilitar Row Level Security (RLS)
-- ============================================

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. Criar políticas de acesso (RLS)
-- ============================================

-- Política: Todos os usuários autenticados podem visualizar documentos
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar documentos" ON documentos;
CREATE POLICY "Usuários autenticados podem visualizar documentos"
  ON documentos
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Apenas admins e executivos podem criar documentos
DROP POLICY IF EXISTS "Admins e executivos podem criar documentos" ON documentos;
CREATE POLICY "Admins e executivos podem criar documentos"
  ON documentos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'executivo')
    )
  );

-- Política: Apenas admins e executivos podem atualizar documentos
DROP POLICY IF EXISTS "Admins e executivos podem atualizar documentos" ON documentos;
CREATE POLICY "Admins e executivos podem atualizar documentos"
  ON documentos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'executivo')
    )
  );

-- Política: Apenas admins e executivos podem deletar documentos
DROP POLICY IF EXISTS "Admins e executivos podem deletar documentos" ON documentos;
CREATE POLICY "Admins e executivos podem deletar documentos"
  ON documentos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'executivo')
    )
  );

-- ============================================
-- 7. COMENTÁRIOS SOBRE CONFIGURAÇÃO DO STORAGE
-- ============================================
-- 
-- IMPORTANTE: Configure o Storage no Supabase:
-- 
-- 1. Acesse: Supabase Dashboard -> Storage
-- 2. Clique em "New bucket"
-- 3. Nome do bucket: "arquivos"
-- 4. Público: SIM (para URLs públicas funcionarem)
-- 5. File size limit: ajuste conforme necessário (ex: 50MB)
-- 6. Allowed MIME types: deixe vazio ou configure tipos específicos
-- 
-- Políticas de Storage (execute no SQL Editor):
-- 
-- ============================================
-- 8. CONFIGURAR POLÍTICAS DO STORAGE
-- ============================================

-- Habilitar RLS no bucket
-- (Execute no SQL Editor do Supabase)

-- Política: Usuários autenticados podem fazer upload
INSERT INTO storage.buckets (id, name, public) 
VALUES ('arquivos', 'arquivos', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Todos podem visualizar arquivos públicos
DROP POLICY IF EXISTS "Arquivos públicos são visíveis" ON storage.objects;
CREATE POLICY "Arquivos públicos são visíveis"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'arquivos');

-- Política: Usuários autenticados podem fazer upload
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
CREATE POLICY "Usuários autenticados podem fazer upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'arquivos');

-- Política: Usuários autenticados podem atualizar seus próprios arquivos
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar arquivos" ON storage.objects;
CREATE POLICY "Usuários autenticados podem atualizar arquivos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'arquivos');

-- Política: Admins e executivos podem deletar arquivos
DROP POLICY IF EXISTS "Admins e executivos podem deletar arquivos" ON storage.objects;
CREATE POLICY "Admins e executivos podem deletar arquivos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'arquivos' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'executivo')
    )
  );

-- ============================================
-- 9. VERIFICAÇÕES E VALIDAÇÕES
-- ============================================

-- Verificar se a tabela foi criada corretamente
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documentos') THEN
    RAISE NOTICE 'Tabela documentos criada com sucesso!';
  ELSE
    RAISE EXCEPTION 'Erro: Tabela documentos não foi criada';
  END IF;
END $$;

-- Verificar se os índices foram criados
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_indexes WHERE tablename = 'documentos' AND indexname = 'idx_documentos_artista_id') THEN
    RAISE NOTICE 'Índices criados com sucesso!';
  END IF;
END $$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- 
-- Após executar este script:
-- 1. Crie o bucket "arquivos" no Storage (se ainda não existir)
-- 2. Configure as políticas de Storage manualmente se necessário
-- 3. Teste o upload de um documento na interface
--

