-- ============================================================================
-- Correção das políticas de public.users e ativação do RLS
--
-- JÁ APLICADO em 2026-09-27 no projeto zbeygaayzhkvbgirtzne, como as migrations
-- corrigir_politicas_users_e_ligar_rls, ligar_rls_tabelas_restantes e
-- fechar_rpcs_expostos_ao_anon. Este arquivo fica como registro versionado.
--
-- Motivo: as políticas antigas de admin consultavam public.users de dentro de
-- uma política da própria public.users. Com RLS ligado isso estoura
-- "42P17: infinite recursion detected in policy" e derruba até o login.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Função auxiliar que checa "é admin?" SEM recursão
--
-- As políticas antigas consultavam public.users de dentro de uma política da
-- própria public.users. Com RLS ligado isso estoura
-- "42P17: infinite recursion detected in policy". SECURITY DEFINER roda como
-- dono da tabela, que ignora RLS, e quebra o ciclo.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.usuario_e_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.usuario_e_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.usuario_e_admin() TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. Trigger que impede auto-promoção
--
-- A política antiga users_update_own permitia UPDATE em qualquer coluna da
-- própria linha — inclusive role. Ou seja, qualquer usuário podia se tornar
-- admin. RLS sozinho não resolve: ele filtra linhas, não colunas.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bloquear_autopromocao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Sem auth.uid() a chamada veio do service_role, do SQL Editor ou de um job:
  -- acesso server-side já é privilegiado, não faz sentido barrar aqui.
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN NEW;
  END IF;

  IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status)
     AND NOT public.usuario_e_admin() THEN
    RAISE EXCEPTION 'Somente administradores podem alterar role ou status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS impedir_autopromocao ON public.users;
CREATE TRIGGER impedir_autopromocao
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_autopromocao();

-- ----------------------------------------------------------------------------
-- 3. Substituição das políticas
--
-- As antigas eram do role "public" (vale também para anon) e não havia
-- nenhuma política de DELETE — com RLS ligado, excluir usuário pararia.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can insert users"   ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users"   ON public.users;
DROP POLICY IF EXISTS "Users can read own data"   ON public.users;
DROP POLICY IF EXISTS users_insert_own            ON public.users;
DROP POLICY IF EXISTS users_select_own            ON public.users;
DROP POLICY IF EXISTS users_update_own            ON public.users;

-- Cada um lê a própria linha; admin lê todas (tela de Configurações).
CREATE POLICY users_select ON public.users FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = id OR public.usuario_e_admin());

-- Primeiro login cria o próprio perfil; admin cadastra qualquer um.
CREATE POLICY users_insert ON public.users FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = id OR public.usuario_e_admin());

-- Edição do próprio perfil (limitada pelo trigger do bloco 2) ou de qualquer um, se admin.
CREATE POLICY users_update ON public.users FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = id OR public.usuario_e_admin())
WITH CHECK ((SELECT auth.uid()) = id OR public.usuario_e_admin());

-- Exclusão só por admin.
CREATE POLICY users_delete ON public.users FOR DELETE TO authenticated
USING (public.usuario_e_admin());

-- ----------------------------------------------------------------------------
-- 4. anon não precisa de nada em users
--
-- Hoje o anon tem SELECT, INSERT, UPDATE, DELETE e TRUNCATE. O cadastro só
-- toca em users depois do signUp, já autenticado, e a recuperação de senha
-- passa por funções SECURITY DEFINER.
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.users FROM anon;

-- ----------------------------------------------------------------------------
-- 5. Enfim, ligar o RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 6. Lista de responsáveis para o CRM
--
-- Com o RLS ligado, um não-admin passa a enxergar só a própria linha, e os
-- selects de "Responsável" do CRM ficariam com um nome só. Esta função expõe
-- apenas id e nome dos usuários aprovados, sem abrir o resto da tabela.
--
-- Requer trocar src/services/crm/usuarios.ts para supabase.rpc('crm_listar_usuarios').
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_listar_usuarios()
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.id, u.name
  FROM public.users u
  WHERE u.status = 'approved'
  ORDER BY u.name;
$$;

REVOKE ALL ON FUNCTION public.crm_listar_usuarios() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_listar_usuarios() TO authenticated;

COMMIT;

-- ============================================================================
-- Fecha o cadastro aberto de administradores
--
-- src/pages/registro/page.tsx criava role 'admin' + status 'approved' quando o
-- cadastro acontecia SEM token de convite: qualquer pessoa que alcançasse
-- /registro virava admin. As políticas acima não barram isso, porque é a
-- própria linha do usuário — daí o trigger.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.forcar_cadastro_pendente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.usuario_e_admin() THEN
    RETURN NEW;
  END IF;

  NEW.role := 'operador';
  NEW.status := 'pending';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cadastro_sempre_pendente ON public.users;
CREATE TRIGGER cadastro_sempre_pendente
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.forcar_cadastro_pendente();

-- ============================================================================
-- Demais tabelas que estavam com RLS desligado (todas vazias)
-- ============================================================================
ALTER TABLE public.arquivos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kv_store_49a67f3a ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.kv_store_49a67f3a FROM anon, authenticated;
REVOKE ALL ON public.arquivos FROM anon;
REVOKE ALL ON public.tarefas  FROM anon;

-- ============================================================================
-- RPCs que estavam executáveis pelo anon
--
-- get_resend_api_key devolvia a chave da API do Resend para qualquer um com a
-- anon key. solicitar_redefinicao_senha continua aberta: é o "esqueci minha
-- senha", que roda deslogado.
-- ============================================================================
REVOKE EXECUTE ON FUNCTION public.get_resend_api_key() FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_resend_api_key() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.bloquear_autopromocao()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.forcar_cadastro_pendente() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.alterar_senha_usuario_admin(uuid, text, uuid) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.alterar_senha_usuario_admin(uuid, text, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.aprovar_redefinicao_senha(uuid, uuid) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.aprovar_redefinicao_senha(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.rejeitar_redefinicao_senha(uuid, uuid, text) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.rejeitar_redefinicao_senha(uuid, uuid, text) TO authenticated;
