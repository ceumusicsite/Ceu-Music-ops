-- Script para tornar a coluna titulo opcional e garantir compatibilidade na tabela projetos
-- Executado no Supabase

-- Tornar a coluna titulo opcional se ela existir e for NOT NULL
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projetos' 
    AND column_name = 'titulo'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE projetos ALTER COLUMN titulo DROP NOT NULL;
    RAISE NOTICE 'Coluna titulo na tabela projetos tornada opcional';
  END IF;
END $$;

-- Garantir default para a coluna tipo
ALTER TABLE projetos ALTER COLUMN tipo SET DEFAULT 'single';

-- Atualizar constraint check_fase para suportar todas as fases do sistema
ALTER TABLE projetos DROP CONSTRAINT IF EXISTS check_fase;
ALTER TABLE projetos ADD CONSTRAINT check_fase CHECK (
  fase IN ('planejamento', 'gravando', 'em_edicao', 'mixagem', 'masterizacao', 'finalizado', 'em_fase_lancamento', 'lancado')
);
