# 📍 Como Obter o VITE_STREAM_CUSTOMER_BASE_URL

Este guia mostra passo a passo como encontrar a URL base do Cloudflare Stream para configurar a variável `VITE_STREAM_CUSTOMER_BASE_URL`.

---

## 🎯 O que é o VITE_STREAM_CUSTOMER_BASE_URL?

É a URL base do seu player do Cloudflare Stream. Ela tem o formato:
```
https://customer-XXXXX.cloudflarestream.com
```

Onde `XXXXX` é um identificador único da sua conta Cloudflare.

---

## 📋 Passo a Passo

### Método 1: Via Dashboard do Cloudflare (Recomendado)

1. **Acesse o Cloudflare Dashboard**
   - Vá para: https://dash.cloudflare.com
   - Faça login na sua conta

2. **Navegue até o Stream**
   - No menu lateral esquerdo, procure por **"Stream"**
   - Clique em **"Stream"** ou **"Stream Videos"**

3. **Encontre a URL Base**
   - Na página do Stream, você verá uma seção com informações sobre seu account
   - Procure por uma URL que comece com `https://customer-`
   - Ou vá em **"Settings"** ou **"Overview"** dentro do Stream
   - A URL base geralmente aparece no topo da página ou nas configurações

4. **Copie a URL**
   - A URL completa será algo como: `https://customer-abc123.cloudflarestream.com`
   - **Copie essa URL completa** (sem barra no final)

### Método 2: Via API do Cloudflare

Se você já tem um vídeo no Stream, pode descobrir a URL base:

1. **Acesse um vídeo no Stream**
   - Vá em **Stream** → **Videos**
   - Clique em qualquer vídeo

2. **Veja a URL do iframe**
   - Na página do vídeo, você verá uma URL de embed/iframe
   - Ela terá o formato: `https://customer-XXXXX.cloudflarestream.com/VIDEO_UID/iframe`
   - A parte antes de `/VIDEO_UID/iframe` é a sua URL base

### Método 3: Via Console do Navegador

1. **Acesse o Stream no Dashboard**
2. **Abra o Console do Navegador** (F12)
3. **Procure por requisições de rede**
   - Vá na aba **Network**
   - Recarregue a página
   - Procure por requisições que contenham `cloudflarestream.com`
   - A URL base aparecerá nessas requisições

---

## ✅ Exemplo de URL

A URL base geralmente tem este formato:

```
https://customer-abc1234567890.cloudflarestream.com
```

**⚠️ IMPORTANTE:**
- Não inclua barra (`/`) no final
- Não inclua o UID do vídeo
- Use apenas a parte base até `.com`

---

## 🔧 Como Configurar

Depois de obter a URL, adicione no seu `.env.local`:

```env
VITE_STREAM_CUSTOMER_BASE_URL=https://customer-abc1234567890.cloudflarestream.com
```

**Substitua** `customer-abc1234567890` pela sua URL real.

---

## 🆘 Não Consigo Encontrar a URL?

### Opção 1: Verificar se o Stream está Habilitado

1. Vá em **Stream** → **Overview**
2. Se você não vê a opção Stream, pode ser que não esteja habilitado
3. Entre em contato com o suporte do Cloudflare ou verifique seu plano

### Opção 2: Criar um Vídeo de Teste

1. Vá em **Stream** → **Upload**
2. Faça upload de um vídeo pequeno de teste
3. Depois do upload, você verá a URL do iframe
4. A URL base será a parte antes do UID do vídeo

### Opção 3: Verificar nas Configurações da Conta

1. Vá em **My Profile** → **Account Settings**
2. Procure por informações do Stream
3. A URL base pode aparecer nas configurações da conta

---

## 📸 Onde Procurar (Visual)

A URL base geralmente aparece em:

- **Stream → Overview**: No topo da página
- **Stream → Settings**: Nas configurações do Stream
- **Stream → Videos → [Vídeo]**: Na URL do iframe de embed
- **Account Settings**: Nas informações da conta

---

## ✅ Verificação

Para verificar se a URL está correta:

1. Adicione no `.env.local`:
   ```env
   VITE_STREAM_CUSTOMER_BASE_URL=https://customer-SUA-URL-AQUI.cloudflarestream.com
   ```

2. Reinicie o servidor:
   ```bash
   npm run dev
   ```

3. Tente fazer upload de um vídeo no sistema
4. Se o vídeo aparecer no player, a URL está correta! ✅

---

## 🔗 Links Úteis

- [Cloudflare Stream Dashboard](https://dash.cloudflare.com/?to=/:account/stream)
- [Documentação do Stream](https://developers.cloudflare.com/stream/)
- [Suporte do Cloudflare](https://support.cloudflare.com/)

---

**💡 Dica:** Se você já tem vídeos no Stream, a forma mais fácil é acessar um vídeo e ver a URL do iframe. A parte antes do UID é a sua URL base!
