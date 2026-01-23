# ⚙️ Configurar Secrets do Cloudflare no Supabase

## ✅ Secrets Obtidos

Você já tem ambos os secrets necessários:

**Account ID:**
```
618f5ae8032ecdc71435fc5c81d231b1593a5
```

**API Token:**
```
exKE4dE3TDWcWQRak6vL9LhJG97hP99ZqGZ8IwPI
```

---

## 📋 Passo a Passo: Configurar no Supabase

### 1. Acessar o Supabase Dashboard

1. Vá para: https://app.supabase.com
2. Faça login
3. Selecione seu projeto

### 2. Navegar até Edge Functions Secrets

1. No menu lateral, clique em **"Project Settings"** (ícone de engrenagem)
2. No menu lateral esquerdo, clique em **"Edge Functions"**
3. Clique na aba **"Secrets"**

### 3. Adicionar o Account ID

1. Clique em **"Add new secret"** ou **"Adicionar novo secret"**
2. Preencha:
   - **Name:** `CLOUDFLARE_ACCOUNT_ID`
   - **Value:** `618f5ae8032ecdc71435fc5c81d231b1593a5`
3. Clique em **"Save"** ou **"Salvar"**

### 4. Adicionar o API Token

1. Clique em **"Add new secret"** novamente
2. Preencha:
   - **Name:** `CLOUDFLARE_STREAM_API_TOKEN`
   - **Value:** `exKE4dE3TDWcWQRak6vL9LhJG97hP99ZqGZ8IwPI`
3. Clique em **"Save"** ou **"Salvar"**

---

---

## ✅ Verificação

Após adicionar ambos os secrets, você deve ver:

- ✅ `CLOUDFLARE_ACCOUNT_ID`
- ✅ `CLOUDFLARE_STREAM_API_TOKEN`

Ambos devem aparecer na lista de secrets do Supabase.

---

## 🎯 Próximos Passos

Depois de configurar os secrets:

1. ✅ Verificar se a Edge Function `stream-copy` está deployada
2. ✅ Testar fazendo upload de um vídeo no sistema
3. ✅ Verificar os logs da Edge Function se houver erros

---

**💡 Dica:** Se você já tem o API Token, adicione-o agora seguindo os passos acima!
