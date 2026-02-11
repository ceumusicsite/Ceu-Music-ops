-- ============================================
-- SCRIPT SIMPLES: Atualizar apenas a constraint de status
-- Execute este SQL no projeto CORRETO do Supabase
-- ============================================

-- Remover constraint antiga
ALTER TABLE faixas
DROP CONSTRAINT IF EXISTS check_status_faixa;

-- Adicionar nova constraint com TODOS os status permitidos
ALTER TABLE faixas
ADD CONSTRAINT check_status_faixa CHECK (status IN ('pendente', 'gravada', 'em_mixagem', 'masterizacao', 'finalizada', 'lancada'));

-- Verificar se funcionou (opcional)
SELECT 
  constraint_name, 
  check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'check_status_faixa';

