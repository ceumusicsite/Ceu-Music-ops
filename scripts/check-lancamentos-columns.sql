-- =============================================
-- SCRIPT: Verificar Colunas da Tabela Lancamentos
-- =============================================

-- Verificar todas as colunas da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lancamentos' 
ORDER BY ordinal_position;

-- Verificar se existe coluna "plataforma" (singular) que não deveria existir
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lancamentos' 
            AND column_name = 'plataforma'
        ) THEN 'ERRO: Coluna "plataforma" (singular) existe! Deve ser removida.'
        ELSE 'OK: Não existe coluna "plataforma" (singular)'
    END AS status_plataforma;

-- Verificar se existe coluna "plataformas" (plural) correta
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lancamentos' 
            AND column_name = 'plataformas'
        ) THEN 'OK: Coluna "plataformas" (plural) existe corretamente'
        ELSE 'ERRO: Coluna "plataformas" (plural) não existe!'
    END AS status_plataformas;

