-- =============================================
-- SCRIPT: Atualizar Roles de Usuários
-- =============================================
-- Este script adiciona suporte ao role 'operador' na tabela users

-- Verificar se a coluna role existe e tem o constraint correto
DO $$
BEGIN
    -- Verificar se a coluna role existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        -- Remover constraint antigo se existir
        ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
        
        -- Adicionar novo constraint com 'operador'
        ALTER TABLE public.users 
        ADD CONSTRAINT users_role_check 
        CHECK (role IN ('admin', 'operador', 'executivo', 'ar', 'producao', 'financeiro', 'viewer'));
        
        RAISE NOTICE 'Constraint de role atualizado com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna role não existe na tabela users.';
    END IF;
END $$;

-- Verificar roles disponíveis
SELECT DISTINCT role, COUNT(*) as total_usuarios
FROM public.users
GROUP BY role
ORDER BY role;

-- Exemplo: Atualizar um usuário específico para 'operador'
-- Descomente e ajuste o email conforme necessário
/*
UPDATE public.users 
SET role = 'operador' 
WHERE email = 'operador@exemplo.com';
*/

-- Exemplo: Atualizar um usuário específico para 'admin'
-- Descomente e ajuste o email conforme necessário
/*
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@exemplo.com';
*/

