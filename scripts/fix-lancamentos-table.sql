-- =============================================
-- SCRIPT: Corrigir/Atualizar Tabela de Lançamentos
-- =============================================
-- Este script verifica e corrige a estrutura da tabela

-- Verificar se a tabela existe
DO $$
BEGIN
    -- Se a tabela não existe, criar do zero
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lancamentos') THEN
        CREATE TABLE public.lancamentos (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            titulo VARCHAR(255) NOT NULL,
            tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('single', 'ep', 'album', 'clipe', 'lyric_video', 'podcast', 'outro')),
            artista_id UUID REFERENCES public.artistas(id) ON DELETE SET NULL,
            projeto_id UUID REFERENCES public.projetos(id) ON DELETE SET NULL,
            data_planejada DATE NOT NULL,
            data_publicacao DATE,
            status VARCHAR(50) DEFAULT 'agendado' CHECK (status IN ('agendado', 'publicado', 'cancelado', 'adiado')),
            capa_url TEXT,
            isrc VARCHAR(50),
            upc VARCHAR(50),
            distribuidor VARCHAR(100),
            plataformas JSONB DEFAULT '[]'::jsonb,
            descricao TEXT,
            observacoes TEXT,
            total_streams BIGINT DEFAULT 0,
            total_visualizacoes BIGINT DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
        RAISE NOTICE 'Tabela lancamentos criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela lancamentos já existe. Verificando colunas...';
        
        -- Adicionar colunas faltantes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'artista_id') THEN
            ALTER TABLE public.lancamentos ADD COLUMN artista_id UUID REFERENCES public.artistas(id) ON DELETE SET NULL;
            RAISE NOTICE 'Coluna artista_id adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'projeto_id') THEN
            ALTER TABLE public.lancamentos ADD COLUMN projeto_id UUID REFERENCES public.projetos(id) ON DELETE SET NULL;
            RAISE NOTICE 'Coluna projeto_id adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'titulo') THEN
            ALTER TABLE public.lancamentos ADD COLUMN titulo VARCHAR(255) NOT NULL DEFAULT '';
            RAISE NOTICE 'Coluna titulo adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'tipo') THEN
            ALTER TABLE public.lancamentos ADD COLUMN tipo VARCHAR(50) NOT NULL DEFAULT 'single';
            RAISE NOTICE 'Coluna tipo adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'data_planejada') THEN
            ALTER TABLE public.lancamentos ADD COLUMN data_planejada DATE NOT NULL DEFAULT CURRENT_DATE;
            RAISE NOTICE 'Coluna data_planejada adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'data_publicacao') THEN
            ALTER TABLE public.lancamentos ADD COLUMN data_publicacao DATE;
            RAISE NOTICE 'Coluna data_publicacao adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'status') THEN
            ALTER TABLE public.lancamentos ADD COLUMN status VARCHAR(50) DEFAULT 'agendado';
            RAISE NOTICE 'Coluna status adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'capa_url') THEN
            ALTER TABLE public.lancamentos ADD COLUMN capa_url TEXT;
            RAISE NOTICE 'Coluna capa_url adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'isrc') THEN
            ALTER TABLE public.lancamentos ADD COLUMN isrc VARCHAR(50);
            RAISE NOTICE 'Coluna isrc adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'upc') THEN
            ALTER TABLE public.lancamentos ADD COLUMN upc VARCHAR(50);
            RAISE NOTICE 'Coluna upc adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'distribuidor') THEN
            ALTER TABLE public.lancamentos ADD COLUMN distribuidor VARCHAR(100);
            RAISE NOTICE 'Coluna distribuidor adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'plataformas') THEN
            ALTER TABLE public.lancamentos ADD COLUMN plataformas JSONB DEFAULT '[]'::jsonb;
            RAISE NOTICE 'Coluna plataformas adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'descricao') THEN
            ALTER TABLE public.lancamentos ADD COLUMN descricao TEXT;
            RAISE NOTICE 'Coluna descricao adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'observacoes') THEN
            ALTER TABLE public.lancamentos ADD COLUMN observacoes TEXT;
            RAISE NOTICE 'Coluna observacoes adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'total_streams') THEN
            ALTER TABLE public.lancamentos ADD COLUMN total_streams BIGINT DEFAULT 0;
            RAISE NOTICE 'Coluna total_streams adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'total_visualizacoes') THEN
            ALTER TABLE public.lancamentos ADD COLUMN total_visualizacoes BIGINT DEFAULT 0;
            RAISE NOTICE 'Coluna total_visualizacoes adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'created_at') THEN
            ALTER TABLE public.lancamentos ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
            RAISE NOTICE 'Coluna created_at adicionada!';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lancamentos' AND column_name = 'updated_at') THEN
            ALTER TABLE public.lancamentos ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
            RAISE NOTICE 'Coluna updated_at adicionada!';
        END IF;
        
        RAISE NOTICE 'Verificação de colunas concluída!';
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_lancamentos_artista_id ON public.lancamentos(artista_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_projeto_id ON public.lancamentos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON public.lancamentos(status);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_planejada ON public.lancamentos(data_planejada);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_publicacao ON public.lancamentos(data_publicacao);

-- Criar trigger se não existir
CREATE OR REPLACE FUNCTION update_lancamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lancamentos_updated_at ON public.lancamentos;
CREATE TRIGGER trigger_update_lancamentos_updated_at
    BEFORE UPDATE ON public.lancamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_lancamentos_updated_at();

-- Habilitar RLS
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem (para evitar conflitos)
DROP POLICY IF EXISTS "Usuários autenticados podem ver lançamentos" ON public.lancamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem criar lançamentos" ON public.lancamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar lançamentos" ON public.lancamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir lançamentos" ON public.lancamentos;

-- Criar policies
CREATE POLICY "Usuários autenticados podem ver lançamentos"
    ON public.lancamentos
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários autenticados podem criar lançamentos"
    ON public.lancamentos
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar lançamentos"
    ON public.lancamentos
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem excluir lançamentos"
    ON public.lancamentos
    FOR DELETE
    TO authenticated
    USING (true);

-- Verificar estrutura final
SELECT 'Tabela lancamentos corrigida com sucesso!' AS status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lancamentos' 
ORDER BY ordinal_position;

