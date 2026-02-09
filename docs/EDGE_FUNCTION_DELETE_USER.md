# Edge Function: delete-user

Esta função remove o usuário do **Supabase Auth** quando um administrador exclui um usuário nas Configurações. Assim, a conta de login é removida junto com o perfil, sem precisar excluir manualmente no Dashboard.

## O que fazer

1. **Fazer deploy da função** (no diretório do projeto):
   ```bash
   npx supabase functions deploy delete-user
   ```

2. **Configurar a secret no Supabase** (necessária para validar que quem chama é admin):
   - Acesse [Supabase Dashboard](https://app.supabase.com) → seu projeto
   - Vá em **Edge Functions** → **delete-user** → **Secrets** (ou **Project Settings** → **Edge Functions** → Secrets)
   - Adicione o secret:
     - **Nome:** `SUPABASE_ANON_KEY`
     - **Valor:** a mesma **anon public** key do projeto (em **Settings** → **API** → **Project API keys** → **anon public**)

Sem esse secret, a função retorna erro e o frontend continua apenas removendo o perfil da tabela `users` (comportamento anterior).

## Comportamento

- Só usuários com **role admin** podem chamar a função.
- O frontend chama a função e, em seguida, remove o registro da tabela `users`.
- Se a função falhar (ex.: não deployada ou secret não configurada), o perfil ainda é removido da tabela; a conta no Auth só é removida quando a função estiver configurada.
