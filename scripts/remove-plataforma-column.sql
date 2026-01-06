-- =============================================
-- SCRIPT: Remover Coluna Plataforma (Singular)
-- =============================================
-- Remove a coluna "plataforma" (singular) que não deveria existir
-- Mantém apenas "plataformas" (plural, JSONB)

-- Remover coluna "plataforma" (singular) se existir
ALTER TABLE public.lancamentos DROP COLUMN IF EXISTS plataforma;

-- Verificar resultado - deve mostrar apenas "plataformas"
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lancamentos' 
AND column_name IN ('plataforma', 'plataformas')
ORDER BY column_name;

-- Se aparecer apenas "plataformas" (jsonb), está correto!

