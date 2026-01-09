-- Script para adicionar o status "em_fase_lancamento" aos projetos
-- Execute este SQL no Supabase SQL Editor

-- Remover constraint antiga
ALTER TABLE projetos 
DROP CONSTRAINT IF EXISTS check_fase;

-- Adicionar nova constraint com o status "em_fase_lancamento"
ALTER TABLE projetos 
ADD CONSTRAINT check_fase CHECK (fase IN ('planejamento', 'gravando', 'em_edicao', 'mixagem', 'masterizacao', 'finalizado', 'em_fase_lancamento', 'lancado'));
