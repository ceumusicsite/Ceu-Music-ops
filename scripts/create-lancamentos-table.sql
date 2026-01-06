-- =============================================
-- SCRIPT: Criar Tabela de Lançamentos
-- =============================================

-- Criar tabela lancamentos
CREATE TABLE IF NOT EXISTS public.lancamentos (
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
    -- Formato: [{"plataforma": "Spotify", "url": "...", "streams": 0}]
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

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_lancamentos_artista_id ON public.lancamentos(artista_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_projeto_id ON public.lancamentos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON public.lancamentos(status);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_planejada ON public.lancamentos(data_planejada);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_publicacao ON public.lancamentos(data_publicacao);

-- Trigger para atualizar updated_at automaticamente
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

-- =============================================
-- RLS (Row Level Security) Policies
-- =============================================

-- Habilitar RLS
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir leitura para todos os usuários autenticados
CREATE POLICY "Usuários autenticados podem ver lançamentos"
    ON public.lancamentos
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Permitir inserção para usuários autenticados
CREATE POLICY "Usuários autenticados podem criar lançamentos"
    ON public.lancamentos
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Permitir atualização para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar lançamentos"
    ON public.lancamentos
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Permitir exclusão para usuários autenticados
CREATE POLICY "Usuários autenticados podem excluir lançamentos"
    ON public.lancamentos
    FOR DELETE
    TO authenticated
    USING (true);

-- =============================================
-- Dados de Exemplo (Opcional)
-- =============================================

-- Inserir alguns lançamentos de exemplo
-- Descomente as linhas abaixo se quiser dados iniciais

/*
INSERT INTO public.lancamentos (titulo, tipo, data_planejada, status, plataformas, descricao) VALUES
('Single Verão 2024', 'single', '2024-02-01', 'publicado', 
 '[{"plataforma": "Spotify", "url": "https://spotify.com", "streams": 125400}]'::jsonb,
 'Novo single de verão'),
('EP Acústico', 'ep', '2024-02-15', 'agendado',
 '[{"plataforma": "YouTube", "url": "", "streams": 0}]'::jsonb,
 'EP com 5 músicas acústicas'),
('Clipe Oficial', 'clipe', '2024-02-10', 'publicado',
 '[{"plataforma": "YouTube", "url": "https://youtube.com", "streams": 89200}]'::jsonb,
 'Clipe oficial da música');
*/

-- =============================================
-- Verificação
-- =============================================

-- Verificar se a tabela foi criada com sucesso
SELECT 'Tabela lancamentos criada com sucesso!' AS status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lancamentos' 
ORDER BY ordinal_position;

