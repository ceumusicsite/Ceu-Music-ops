# 🔧 Solução: Erro 400 redirect_uri_mismatch em Produção

## 🔴 Problema

O sistema está em produção na Vercel e está retornando:
```
Erro 400: redirect_uri_mismatch
Acesso bloqueado: a solicitação desta app é inválida
```

## ✅ CAUSA

A URL de redirecionamento de **produção** não está autorizada no Google Cloud Console.

O sistema está tentando usar: `https://ceu-music-ops.vercel.app/youtube-callback` (ou similar)

Mas essa URL não está configurada no Google Cloud Console!

---

## 🚀 SOLUÇÃO COMPLETA (5 minutos)

### **PASSO 1: URL de Produção Identificada**

**URL de Produção:**
```
https://sys.ceumusicbr.com.br
```

Esta é a URL que precisa ser configurada no Google Cloud Console.

---

### **PASSO 2: Adicionar URL de Produção no Google Cloud Console**

1. **Acesse Google Cloud Console:**
   - URL: https://console.cloud.google.com/
   - Faça login
   - Selecione o projeto: **helical-song-484514-c3**

2. **Vá em Credenciais:**
   - Menu lateral: **APIs e Serviços** → **Credenciais**
   - Clique no seu **Client ID OAuth 2.0**:
     ```
     1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8
     ```

3. **Adicionar URIs de Redirecionamento:**

   Role até **"URIs de redirecionamento autorizados"** e adicione:

   **URL de Produção:**
   ```
   https://sys.ceumusicbr.com.br/youtube-callback
   ```
   
   ⚠️ **IMPORTANTE:**
   - Use **`https://`** (não `http://`)
   - **COM** `/youtube-callback` no final
   - **SEM** espaços antes ou depois
   - URL exata: `https://sys.ceumusicbr.com.br/youtube-callback`

   **URLs de Desenvolvimento (se ainda não tiver):**
   ```
   http://localhost:3000/youtube-callback
   http://localhost:5173/youtube-callback
   ```

4. **Adicionar Origens JavaScript:**

   Role até **"Origens JavaScript autorizadas"** e adicione:

   **Origem de Produção:**
   ```
   https://sys.ceumusicbr.com.br
   ```
   
   ⚠️ **Nota:** Aqui **NÃO** coloque `/youtube-callback`, apenas a origem!

   **Origens de Desenvolvimento (se ainda não tiver):**
   ```
   http://localhost:3000
   http://localhost:5173
   ```

5. **SALVAR:**
   - Clique no botão azul **"SALVAR"** no topo da página
   - Aguarde 1-2 minutos para as mudanças serem propagadas

---

### **PASSO 3: Configurar Variáveis de Ambiente no Vercel**

As variáveis de ambiente precisam estar configuradas no Vercel, não apenas no `.env.local`!

1. **Acesse o Vercel Dashboard:**
   - URL: https://vercel.com
   - Faça login
   - Selecione seu projeto

2. **Vá em Settings → Environment Variables:**

3. **Adicione as seguintes variáveis:**

   ```
   VITE_GOOGLE_CLIENT_ID = 1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com
   
   VITE_YOUTUBE_CLIENT_SECRET = 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
   
   VITE_GOOGLE_API_KEY = AIzaSyBNmwV62YsVOHvmMtCZyvGxOcyrZtMaHYA
   
   VITE_YOUTUBE_REDIRECT_URI = https://sys.ceumusicbr.com.br/youtube-callback
   
   VITE_PUBLIC_SUPABASE_URL = https://zbeygaayzhkvbgirtzne.supabase.co
   
   VITE_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZXlnYWF5emhrdmJnaXJ0em5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MjIxMDIsImV4cCI6MjA4MTk5ODEwMn0.5vOBNBwQFMrc3r1h8c2p-TMJAoPqEWm6vFHMq_xAlY8
   ```

   ⚠️ **IMPORTANTE:**
   - URL de produção: `https://sys.ceumusicbr.com.br/youtube-callback`
   - Selecione **"Production"** como ambiente
   - Opcionalmente, adicione também para **"Preview"** e **"Development"**

4. **Fazer novo deploy:**
   - Após adicionar as variáveis, faça um novo deploy
   - Ou aguarde o próximo deploy automático

---

### **PASSO 4: Verificar se Funcionou**

1. Acesse sua aplicação em produção
2. Tente fazer login/autenticação com YouTube
3. O erro `redirect_uri_mismatch` deve desaparecer

---

## 📋 Checklist Completo

- [ ] URL de produção identificada (ex: `ceu-music-ops.vercel.app`)
- [ ] URL adicionada em "URIs de redirecionamento autorizados" no Google Cloud Console
- [ ] Origem adicionada em "Origens JavaScript autorizadas" no Google Cloud Console
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] `VITE_YOUTUBE_REDIRECT_URI` configurada com URL de produção
- [ ] Mudanças salvas no Google Cloud Console
- [ ] Novo deploy feito no Vercel (ou aguardando deploy automático)
- [ ] Testado em produção

---

## 🔍 Como Descobrir sua URL do Vercel

1. Acesse: https://vercel.com/dashboard
2. Clique no seu projeto
3. Veja a URL no topo (ex: `ceu-music-ops.vercel.app`)
4. Ou veja em **Settings** → **Domains**

---

## ⚠️ IMPORTANTE

- A URL deve ser **exatamente** como está no Vercel
- Use **`https://`** para produção (não `http://`)
- Inclua `/youtube-callback` no final da URI de redirecionamento
- Aguarde 1-2 minutos após salvar no Google Cloud Console
- Faça um novo deploy no Vercel após adicionar variáveis de ambiente

---

## 🆘 Se Ainda Não Funcionar

1. **Verifique a URL exata:**
   - Abra o console do navegador (F12)
   - Veja qual URL está sendo usada no erro

2. **Verifique se as variáveis estão carregadas:**
   - No console do navegador, digite:
     ```javascript
     console.log('Redirect URI:', import.meta.env.VITE_YOUTUBE_REDIRECT_URI);
     ```

3. **Verifique o Google Cloud Console:**
   - Confirme que a URL está **exatamente** como aparece no erro
   - Verifique se salvou as mudanças

---

**✅ Após seguir estes passos, o erro deve ser resolvido!**
