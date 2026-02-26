# Corrigir erro 401 na Edge Function stream-copy

O erro `401 (Unauthorized)` ao chamar `stream-copy` geralmente acontece porque a Edge Function não está configurada para aceitar chamadas com a **anon key**.

---

## Solução rápida

### Opção 1: Configurar a função para aceitar anon key (recomendado)

1. Acesse o **Supabase Dashboard**: https://app.supabase.com
2. Vá em **Edge Functions** → **stream-copy**
3. Na aba **Settings** (Configurações), procure por **"Invoke URL"** ou **"Public Access"**
4. Se houver opção **"Allow public access"** ou **"Accept anon key"**, **ative**
5. Ou verifique se há uma opção de **"Authentication"** → escolha **"Public"** ou **"Anon key"**

### Opção 2: Verificar se a função está deployada corretamente

1. No Supabase: **Edge Functions** → **stream-copy**
2. Verifique se a função está **deployada** (status deve ser "Active" ou "Deployed")
3. Se não estiver, faça deploy:
   - Clique em **"Deploy"** ou
   - Via CLI: `npx supabase functions deploy stream-copy`

### Opção 3: Verificar secrets

1. No Supabase: **Project Settings** → **Edge Functions** → **Secrets**
2. Confirme que existem:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_STREAM_API_TOKEN`
3. Se não existirem, adicione-os

---

## Teste manual da função

Após configurar, teste diretamente no Supabase:

1. Vá em **Edge Functions** (no menu lateral esquerdo)
2. Clique na função **stream-copy**
3. Procure pela aba **"Invoke"** ou **"Test"** (não use "Logs & Analytics" ou "Templates" - essas são para SQL)
4. Na aba "Invoke", você verá:
   - Um campo **"Request body"** ou **"Body"**
   - Um botão **"Invoke"** ou **"Run"**
5. Cole este JSON no campo de body:
   ```json
   {
     "sourceUrl": "https://pub-a6e0c29efc16457baad633f22cf9ffb6.r2.dev/teste/video.mp4",
     "name": "Teste"
   }
   ```
6. Clique em **"Invoke"** ou **"Run"**
7. Verifique a resposta:
   - Se retornar `200` com `{"uid": "..."}`, está funcionando ✅
   - Se retornar `401`, a função precisa ser configurada para aceitar anon key
   - Se retornar `500` com "Missing CLOUDFLARE_ACCOUNT_ID", verifique os secrets

**⚠️ Importante:** Não use a aba "Logs & Analytics" ou "Templates" - essas são para SQL. Use a aba específica da Edge Function chamada "Invoke" ou "Test".

---

## Erro 502: Cloudflare Stream API error

Se você receber `502` com mensagem "Cloudflare Stream API error", significa que a Edge Function está sendo chamada (não é mais 401), mas há um problema ao chamar a API da Cloudflare. Possíveis causas:

### 1. Secrets não configurados ou incorretos

1. No Supabase: **Project Settings** → **Edge Functions** → **Secrets**
2. Verifique se existem e estão corretos:
   - `CLOUDFLARE_ACCOUNT_ID` - deve ser o Account ID da Cloudflare (32 caracteres hex)
   - `CLOUDFLARE_STREAM_API_TOKEN` - deve ser o token criado com permissão **Stream → Edit**
3. Se não existirem ou estiverem errados, adicione/corrija e **redeploy a função**

### 2. Token da Cloudflare sem permissão

1. Acesse: https://dash.cloudflare.com → **Meu perfil** → **API Tokens**
2. Verifique se o token tem permissão **Cloudflare Stream → Edit**
3. Se não tiver, crie um novo token com essa permissão e atualize o secret `CLOUDFLARE_STREAM_API_TOKEN`

### 3. URL do vídeo inacessível

A Cloudflare precisa conseguir baixar o vídeo da URL fornecida. Verifique:
- A URL está acessível publicamente? (teste abrindo no navegador)
- Se for URL assinada (signed), ela ainda está válida?
- O bucket R2 tem acesso público ou a URL assinada permite acesso externo?

### 4. Ver logs detalhados

1. No Supabase: **Edge Functions** → **stream-copy** → **Logs**
2. Procure por erros detalhados que mostram o que a Cloudflare retornou
3. O erro pode mostrar mensagens como:
   - "Invalid API token"
   - "Account not found"
   - "Failed to fetch URL"
   - etc.

---

## Se ainda não funcionar

O código já foi atualizado para incluir o header `apikey` automaticamente. Se ainda der 401:

1. **Verifique se você está logado** no app (o token de autenticação pode ser necessário)
2. **Confira os logs** da Edge Function no Supabase (Edge Functions → stream-copy → Logs)
3. **Redeploy a função** após alterar configurações

---

## Próximos passos

Depois que a função aceitar chamadas (sem 401):

1. Execute o SQL: `scripts/add-artistas-anexos-stream-columns.sql`
2. Teste abrindo um vídeo no FileManager
3. O vídeo deve criar no Stream automaticamente e reproduzir via Stream
