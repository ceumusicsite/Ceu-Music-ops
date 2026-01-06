-- =============================================
-- SCRIPT: Recriar Tabela de Lançamentos (Limpa)
-- =============================================
-- ATENÇÃO: Este script vai EXCLUIR todos os dados existentes!
-- Use apenas se não tiver dados importantes na tabela

-- Excluir tabela existente (CUIDADO!)
DROP TABLE IF EXISTS public.lancamentos CASCADE;

-- Criar tabela do zero
CREATE TABLE public.lancamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Informações Básicas
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('single', 'ep', 'album', 'clipe', 'lyric_video', 'podcast', 'outro')),
    artista_id UUID REFERENCES public.artistas(id) ON DELETE SET NULL,
    projeto_id UUID REFERENCES public.projetos(id) ON DELETE SET NULL,
    
    -- Datas
    data_planejada DATE NOT NULL,
    data_publicacao DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'agendado' CHECK (status IN ('agendado', 'publicado', 'cancelado', 'adiado')),
    
    -- Mídia
    capa_url TEXT,
    
    -- Identificadores
    isrc VARCHAR(50),
    upc VARCHAR(50),
    distribuidor VARCHAR(100),
    
    -- Plataformas (array de objetos JSON)
    plataformas JSONB DEFAULT '[]'::jsonb,
    
    -- Informações Adicionais
    descricao TEXT,
    observacoes TEXT,
    
    -- Métricas Consolidadas
    total_streams BIGINT DEFAULT 0,
    total_visualizacoes BIGINT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices
CREATE INDEX idx_lancamentos_artista_id ON public.lancamentos(artista_id);
CREATE INDEX idx_lancamentos_projeto_id ON public.lancamentos(projeto_id);
CREATE INDEX idx_lancamentos_status ON public.lancamentos(status);
CREATE INDEX idx_lancamentos_data_planejada ON public.lancamentos(data_planejada);
CREATE INDEX idx_lancamentos_data_publicacao ON public.lancamentos(data_publicacao);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_lancamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lancamentos_updated_at
    BEFORE UPDATE ON public.lancamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_lancamentos_updated_at();

-- RLS Policies
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver lançamentos"
    ON public.lancamentos FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem criar lançamentos"
    ON public.lancamentos FOR INSERT
    TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar lançamentos"
    ON public.lancamentos FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem excluir lançamentos"
    ON public.lancamentos FOR DELETE
    TO authenticated USING (true);

-- Verificação
SELECT 'Tabela lancamentos recriada com sucesso!' AS status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lancamentos' 
ORDER BY ordinal_position;

