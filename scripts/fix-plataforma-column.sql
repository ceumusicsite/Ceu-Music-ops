-- =============================================
-- SCRIPT: Corrigir Coluna Plataforma
-- =============================================
-- Remove coluna "plataforma" (singular) se existir
-- e garante que apenas "plataformas" (plural) existe

DO $$
BEGIN
    -- Remover coluna "plataforma" (singular) se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lancamentos' 
        AND column_name = 'plataforma'
    ) THEN
        ALTER TABLE public.lancamentos DROP COLUMN plataforma;
        RAISE NOTICE 'Coluna "plataforma" (singular) removida!';
    ELSE
        RAISE NOTICE 'Coluna "plataforma" (singular) não existe. OK!';
    END IF;
    
    -- Garantir que coluna "plataformas" (plural) existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lancamentos' 
        AND column_name = 'plataformas'
    ) THEN
        ALTER TABLE public.lancamentos ADD COLUMN plataformas JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Coluna "plataformas" (plural) criada!';
    ELSE
        RAISE NOTICE 'Coluna "plataformas" (plural) já existe. OK!';
    END IF;
END $$;

-- Verificar resultado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'lancamentos' 
AND column_name IN ('plataforma', 'plataformas')
ORDER BY column_name;

