# 🔐 Como Obter os Secrets do Cloudflare para Supabase

Este guia mostra passo a passo como obter o **Account ID** e criar o **API Token** do Cloudflare para configurar no Supabase.

---

## 📋 O que você precisa

Para configurar a integração do Cloudflare Stream no Supabase, você precisa de **2 secrets**:

1. **`CLOUDFLARE_ACCOUNT_ID`** - ID da sua conta Cloudflare
2. **`CLOUDFLARE_STREAM_API_TOKEN`** - Token de API com permissão para Stream

---

## 🆔 1. Obter o Account ID do Cloudflare

### Passo a Passo:

1. **Acesse o Cloudflare Dashboard**
   - Vá para: https://dash.cloudflare.com
   - Faça login na sua conta

2. **Encontre o Account ID**
   - No painel lateral direito, você verá uma seção com informações da conta
   - Procure por **"Account ID"** ou **"ID da Conta"**
   - É um código alfanumérico (exemplo: `abc123def456ghi789`)
   - **Copie esse ID**

   **Alternativa:**
   - Se não encontrar no painel lateral, vá em qualquer domínio
   - Role até o final da página
   - O Account ID aparece na seção "API" ou "Account ID"

3. **Exemplo de Account ID:**
   ```
   abc123def456ghi789jkl012mno345
   ```

---

## 🔑 2. Criar o API Token do Cloudflare

### Passo a Passo:

1. **Acesse a página de API Tokens**
   - No Cloudflare Dashboard, clique no seu **perfil** (canto superior direito)
   - Clique em **"My Profile"** ou **"Meu Perfil"**
   - No menu lateral, clique em **"API Tokens"** ou **"Tokens de API"**

2. **Criar um novo token**
   - Clique no botão **"Create Token"** ou **"Criar Token"**
   - Você verá templates pré-configurados
   - **NÃO use um template**, clique em **"Create Custom Token"** ou **"Criar Token Personalizado"**

3. **Configurar o token**

   **Nome do Token:**
   - Dê um nome descritivo, por exemplo: `CEU Music Stream API`

   **Permissões:**
   - Seção: **"Account"**
   - Permissão: **"Cloudflare Stream"**
   - Nível: **"Edit"** (Editar)
   - Clique em **"Add"** ou **"Adicionar"**

   **Recursos da Conta:**
   - Selecione: **"Include"** → **"All accounts"** ou **"Todas as contas"**
   - Ou selecione sua conta específica

4. **Criar o token**
   - Clique em **"Continue to summary"** ou **"Continuar para resumo"**
   - Revise as configurações
   - Clique em **"Create Token"** ou **"Criar Token"**

5. **⚠️ IMPORTANTE: Copiar o token**
   - O token será exibido **apenas uma vez**
   - **Copie imediatamente** e guarde em local seguro
   - O token terá o formato: `abc123def456ghi789jkl012mno345pqr678stu901`
   - Se você perder, precisará criar um novo token

---

## 🗄️ 3. Configurar os Secrets no Supabase

Agora que você tem o Account ID e o API Token, configure-os no Supabase:

### Método 1: Via Dashboard do Supabase (Recomendado)

1. **Acesse o Supabase Dashboard**
   - Vá para: https://app.supabase.com
   - Faça login na sua conta
   - Selecione seu projeto

2. **Navegar até Edge Functions Secrets**
   - No menu lateral, vá em **"Project Settings"** ou **"Configurações do Projeto"**
   - Clique em **"Edge Functions"** no menu lateral
   - Clique na aba **"Secrets"**

3. **Adicionar os secrets**

   **Secret 1: CLOUDFLARE_ACCOUNT_ID**
   - Clique em **"Add new secret"** ou **"Adicionar novo secret"**
   - **Name:** `CLOUDFLARE_ACCOUNT_ID`
   - **Value:** Cole o Account ID que você copiou
   - Clique em **"Save"** ou **"Salvar"**

   **Secret 2: CLOUDFLARE_STREAM_API_TOKEN**
   - Clique em **"Add new secret"** novamente
   - **Name:** `CLOUDFLARE_STREAM_API_TOKEN`
   - **Value:** Cole o API Token que você criou
   - Clique em **"Save"** ou **"Salvar"**

4. **Verificar**
   - Você deve ver os dois secrets listados:
     - `CLOUDFLARE_ACCOUNT_ID`
     - `CLOUDFLARE_STREAM_API_TOKEN`

### Método 2: Via Supabase CLI

Se você tem o Supabase CLI instalado:

```bash
# Configurar Account ID
supabase secrets set CLOUDFLARE_ACCOUNT_ID=seu_account_id_aqui

# Configurar API Token
supabase secrets set CLOUDFLARE_STREAM_API_TOKEN=seu_token_aqui
```

**⚠️ IMPORTANTE:** Substitua `seu_account_id_aqui` e `seu_token_aqui` pelos valores reais.

---

## ✅ Verificação

Para verificar se os secrets estão configurados corretamente:

1. **No Supabase Dashboard:**
   - Vá em: **Project Settings** → **Edge Functions** → **Secrets**
   - Verifique se ambos os secrets aparecem na lista

2. **Testar a Edge Function:**
   - Faça upload de um vídeo no sistema
   - Vá em: **Edge Functions** → **stream-copy** → **Logs**
   - Verifique se não há erros relacionados a secrets ausentes

---

## 🔒 Segurança

**⚠️ IMPORTANTE - Boas Práticas:**

1. **Nunca compartilhe seus tokens**
   - Os tokens dão acesso à sua conta Cloudflare
   - Mantenha-os seguros e privados

2. **Use tokens com permissões mínimas**
   - O token criado tem apenas permissão para Stream
   - Isso é mais seguro do que usar tokens com permissões amplas

3. **Rotacione tokens regularmente**
   - Considere criar novos tokens periodicamente
   - Revogue tokens antigos que não são mais usados

4. **Não commite tokens no Git**
   - Nunca adicione tokens em arquivos que vão para o repositório
   - Use sempre variáveis de ambiente ou secrets do Supabase

---

## 🆘 Problemas Comuns

### Erro: "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_STREAM_API_TOKEN"

**Causa:** Secrets não configurados no Supabase.

**Solução:**
1. Verifique se os secrets foram adicionados corretamente
2. Verifique se os nomes estão exatamente como mostrado (case-sensitive)
3. Aguarde alguns minutos para propagação

### Erro: "Cloudflare Stream API error" ou "401 Unauthorized"

**Causa:** Token inválido ou sem permissões corretas.

**Solução:**
1. Verifique se o token tem permissão **"Edit"** no Stream
2. Verifique se o Account ID está correto
3. Crie um novo token se necessário

### Token não funciona após criar

**Causa:** Pode levar alguns minutos para o token ser ativado.

**Solução:**
1. Aguarde 2-3 minutos
2. Tente novamente
3. Se ainda não funcionar, crie um novo token

---

## 📸 Onde Encontrar (Visual)

### Account ID:
```
Cloudflare Dashboard
  └─ Painel Lateral Direito
      └─ "Account ID" ou "ID da Conta"
```

### API Token:
```
Cloudflare Dashboard
  └─ Perfil (canto superior direito)
      └─ My Profile
          └─ API Tokens
              └─ Create Token
                  └─ Create Custom Token
```

### Secrets no Supabase:
```
Supabase Dashboard
  └─ Project Settings
      └─ Edge Functions
          └─ Secrets (aba)
              └─ Add new secret
```

---

## 📋 Checklist

Use este checklist para garantir que tudo está configurado:

- [ ] Account ID do Cloudflare obtido
- [ ] API Token do Cloudflare criado com permissão Stream Edit
- [ ] Token copiado e guardado em local seguro
- [ ] Secret `CLOUDFLARE_ACCOUNT_ID` adicionado no Supabase
- [ ] Secret `CLOUDFLARE_STREAM_API_TOKEN` adicionado no Supabase
- [ ] Ambos os secrets aparecem na lista do Supabase
- [ ] Edge Function `stream-copy` está deployada
- [ ] Teste de upload de vídeo realizado

---

## 🔗 Links Úteis

- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)
- [Cloudflare Stream API](https://developers.cloudflare.com/api/resources/stream/)

---

**🎉 Pronto! Agora você sabe como obter e configurar os secrets do Cloudflare no Supabase!**
