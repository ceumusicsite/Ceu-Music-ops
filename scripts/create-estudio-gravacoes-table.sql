-- ============================================
-- SCRIPT: CRIAR TABELA ESTUDIO_GRAVACOES
-- Sistema de Gestão de Gravações e Demandas do Estúdio Céu Music
-- ============================================

CREATE TABLE IF NOT EXISTS public.estudio_gravacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  tipo_conteudo TEXT NOT NULL DEFAULT 'live_session', -- live_session, podcast, acustico, clipe, voz_guia, ensaio, outro
  tipo_artista TEXT NOT NULL DEFAULT 'casting',       -- casting, convidado
  artista_id UUID REFERENCES public.artistas(id) ON DELETE SET NULL,
  artista_nome TEXT NOT NULL,
  data_gravacao DATE NOT NULL,
  prazo_entrega DATE,
  prioridade TEXT NOT NULL DEFAULT 'media',           -- baixa, media, alta, urgente
  status TEXT NOT NULL DEFAULT 'pendente',            -- pendente, em_edicao, em_revisao, entregue, cancelado
  responsavel TEXT,
  link_arquivos TEXT,
  observacoes TEXT,
  criado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas se tabela já existir
ALTER TABLE public.estudio_gravacoes
ADD COLUMN IF NOT EXISTS titulo TEXT,
ADD COLUMN IF NOT EXISTS tipo_conteudo TEXT DEFAULT 'live_session',
ADD COLUMN IF NOT EXISTS tipo_artista TEXT DEFAULT 'casting',
ADD COLUMN IF NOT EXISTS artista_id UUID,
ADD COLUMN IF NOT EXISTS artista_nome TEXT,
ADD COLUMN IF NOT EXISTS data_gravacao DATE,
ADD COLUMN IF NOT EXISTS prazo_entrega DATE,
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS responsavel TEXT,
ADD COLUMN IF NOT EXISTS link_arquivos TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS criado_por UUID,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar índices para consultas e filtros de alta performance
CREATE INDEX IF NOT EXISTS idx_estudio_gravacoes_status ON public.estudio_gravacoes(status);
CREATE INDEX IF NOT EXISTS idx_estudio_gravacoes_prioridade ON public.estudio_gravacoes(prioridade);
CREATE INDEX IF NOT EXISTS idx_estudio_gravacoes_data_gravacao ON public.estudio_gravacoes(data_gravacao);
CREATE INDEX IF NOT EXISTS idx_estudio_gravacoes_prazo_entrega ON public.estudio_gravacoes(prazo_entrega);
CREATE INDEX IF NOT EXISTS idx_estudio_gravacoes_artista_id ON public.estudio_gravacoes(artista_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.estudio_gravacoes ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura de estudio_gravacoes para autenticados" ON public.estudio_gravacoes;
DROP POLICY IF EXISTS "Permitir insercao de estudio_gravacoes para autenticados" ON public.estudio_gravacoes;
DROP POLICY IF EXISTS "Permitir atualizacao de estudio_gravacoes para autenticados" ON public.estudio_gravacoes;
DROP POLICY IF EXISTS "Permitir exclusao de estudio_gravacoes para autenticados" ON public.estudio_gravacoes;

-- Criar políticas RLS para usuários autenticados
CREATE POLICY "Permitir leitura de estudio_gravacoes para autenticados"
  ON public.estudio_gravacoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir insercao de estudio_gravacoes para autenticados"
  ON public.estudio_gravacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualizacao de estudio_gravacoes para autenticados"
  ON public.estudio_gravacoes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusao de estudio_gravacoes para autenticados"
  ON public.estudio_gravacoes FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON TABLE public.estudio_gravacoes IS 'Armazena gravações e demandas do estúdio interno Céu Music (artistas da casa e convidados)';
