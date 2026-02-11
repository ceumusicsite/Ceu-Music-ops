-- Script para ATUALIZAR APENAS a constraint de status
-- Use este script SE a tabela faixas JÁ EXISTE
-- Execute este SQL no Supabase SQL Editor

-- Remover constraint antiga
ALTER TABLE faixas
DROP CONSTRAINT IF EXISTS check_status_faixa;

-- Adicionar nova constraint com todos os status permitidos
ALTER TABLE faixas
ADD CONSTRAINT check_status_faixa CHECK (status IN ('pendente', 'gravada', 'em_mixagem', 'masterizacao', 'finalizada', 'lancada'));

