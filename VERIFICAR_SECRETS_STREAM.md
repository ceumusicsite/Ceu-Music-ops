# Verificar e Configurar Secrets do Stream no Supabase

O erro 502 geralmente acontece porque os **secrets** não estão configurados corretamente no Supabase.

---

## Passo 1: Obter Account ID e Token da Cloudflare

### Account ID
1. Acesse: https://dash.cloudflare.com
2. No canto direito, em **"Detalhes da conta"**, copie o **ID da conta**
   - Exemplo: `1db437b87dac2f428ee5ec949a1ad9ce` (32 caracteres hex)

### API Token do Stream
1. No Cloudflare Dashboard: **Meu perfil** (ícone de pessoa) → **API Tokens**
2. Clique em **"Criar token"**
3. Use o template **"Editar Cloudflare Stream"** ou crie um token personalizado com:
   - **Account** → **Cloudflare Stream** → **Edit**
4. Copie o token (ele só aparece uma vez!)

---

## Passo 2: Configurar Secrets no Supabase

1. Acesse: https://app.supabase.com → seu projeto
2. Vá em: **Project Settings** (ícone de engrenagem) → **Edge Functions** → **Secrets**
3. Adicione ou verifique estes dois secrets:

   | Nome | Valor | Exemplo |
   |------|-------|---------|
   | `CLOUDFLARE_ACCOUNT_ID` | O Account ID do Passo 1 | `1db437b87dac2f428ee5ec949a1ad9ce` |
   | `CLOUDFLARE_STREAM_API_TOKEN` | O token criado no Passo 1 | `exKE4dE3TDWcWQRak6vL9LhJG97hP99ZqGZ8IwPI` |

4. **Salve** os dois secrets

---

## Passo 3: Redeploy da Edge Function

Após adicionar/alterar secrets, **sempre faça redeploy** da função:

1. No Supabase: **Edge Functions** → **stream-copy**
2. Clique em **"Deploy"** (ou use a CLI: `npx supabase functions deploy stream-copy`)

**⚠️ Importante:** Secrets só ficam disponíveis após o redeploy!

---

## Passo 4: Testar a Função

1. No Supabase: **Edge Functions** → **stream-copy** → aba **"Invoke"**
2. Cole este JSON no body:
   ```json
   {
     "sourceUrl": "https://pub-a6e0c29efc16457baad633f22cf9ffb6.r2.dev/teste/video.mp4",
     "name": "Teste"
   }
   ```
3. Clique em **"Invoke"**
4. Verifique a resposta:
   - ✅ **200** com `{"uid": "..."}` = funcionando!
   - ❌ **500** com "Missing CLOUDFLARE_ACCOUNT_ID" = secrets não configurados
   - ❌ **502** com "Cloudflare Stream API error" = verifique:
     - Account ID está correto? (deve ser 32 caracteres)
     - Token tem permissão Stream → Edit?
     - Token está correto? (sem espaços extras)

---

## Erros Comuns

### "Missing CLOUDFLARE_ACCOUNT_ID"
- **Causa:** Secret não existe ou nome está errado
- **Solução:** Adicione o secret `CLOUDFLARE_ACCOUNT_ID` e faça redeploy

### "Cloudflare Stream API error" / 401 ou 403
- **Causa:** Token inválido ou sem permissão
- **Solução:** Crie um novo token com permissão **Stream → Edit** e atualize o secret

### "Cloudflare Stream API error" / 404
- **Causa:** Account ID incorreto
- **Solução:** Verifique se o Account ID está correto (32 caracteres hex)

---

## Verificar Logs Detalhados

Se ainda não funcionar, veja os logs:

1. No Supabase: **Edge Functions** → **stream-copy** → aba **"Logs"**
2. Procure por erros que mostram o que a Cloudflare retornou
3. A mensagem de erro vai indicar exatamente o problema

---

## Confirmação Rápida

✅ Account ID no Supabase = Account ID no Cloudflare Dashboard  
✅ Token no Supabase = Token criado com permissão Stream → Edit  
✅ Função redeployada após adicionar secrets  
✅ Teste retorna 200 com `uid`

Se tudo isso estiver correto, o Stream deve funcionar! 🎉
