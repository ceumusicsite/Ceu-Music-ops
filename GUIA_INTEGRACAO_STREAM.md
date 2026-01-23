# 🎬 Guia Completo: Integração Cloudflare Stream

Este guia explica como configurar e usar a integração do Cloudflare Stream no sistema CEU Music Ops.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração no Cloudflare](#configuração-no-cloudflare)
4. [Configuração no Supabase](#configuração-no-supabase)
5. [Configuração no Frontend](#configuração-no-frontend)
6. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
7. [Testando a Integração](#testando-a-integração)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

A integração do Cloudflare Stream permite:

- ✅ **Upload automático de vídeos** para o Cloudflare Stream quando um vídeo é anexado a uma faixa
- ✅ **Playback otimizado** usando o player do Cloudflare Stream (melhor performance e qualidade)
- ✅ **Armazenamento duplo**: vídeo no R2 (backup) + Stream (playback)
- ✅ **URLs assinadas temporárias** para segurança

### Fluxo de Funcionamento

```
1. Usuário anexa vídeo → Upload para R2
2. Sistema gera URL assinada (24h) do R2
3. Edge Function chama Cloudflare Stream API (Copy-from-URL)
4. Stream processa o vídeo e retorna UID
5. UID é salvo no banco de dados
6. Player usa o Stream para reprodução
```

---

## 🔧 Pré-requisitos

Antes de começar, você precisa:

- ✅ Conta no Cloudflare com **Stream habilitado**
- ✅ Projeto no Supabase configurado
- ✅ **Cloudflare R2 configurado** (para armazenamento) - ⚠️ **OBRIGATÓRIO**
- ✅ Supabase CLI instalado (para deploy da Edge Function)

> 📖 **Para configurar o R2, consulte:** [`CONFIGURAR_R2_PARA_STREAM.md`](../CONFIGURAR_R2_PARA_STREAM.md)

---

## ☁️ Configuração no Cloudflare

### 1. Obter Account ID

1. Acesse: https://dash.cloudflare.com
2. Selecione sua conta
3. No painel lateral direito, copie o **Account ID**

### 2. Criar API Token

1. Vá em: **My Profile** → **API Tokens**
2. Clique em **Create Token**
3. Use o template **Custom token**
4. Configure as permissões:
   - **Account** → **Cloudflare Stream** → **Edit**
5. Configure os recursos:
   - **Include** → **All accounts**
6. Clique em **Continue to summary** e depois **Create Token**
7. **Copie o token** (você só verá ele uma vez!)

### 3. Obter Customer Base URL

1. Vá em: **Stream** → **Overview**
2. Você verá uma URL como: `https://customer-abc123.cloudflarestream.com`
3. **Copie essa URL** (será usada no `.env.local`)

---

## 🗄️ Configuração no Supabase

### 1. Configurar Secrets da Edge Function

1. Acesse: https://app.supabase.com
2. Vá em: **Project Settings** → **Edge Functions** → **Secrets**
3. Adicione os seguintes secrets:

```
CLOUDFLARE_ACCOUNT_ID=seu_account_id_aqui
CLOUDFLARE_STREAM_API_TOKEN=seu_token_aqui
```

### 2. Deploy da Edge Function

A Edge Function já está criada em `supabase/functions/stream-copy/index.ts`.

Para fazer o deploy:

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref seu-project-ref

# Deploy da função
supabase functions deploy stream-copy
```

**Alternativa via Dashboard:**

1. Vá em: **Edge Functions** → **Create a new function**
2. Nome: `stream-copy`
3. Cole o conteúdo de `supabase/functions/stream-copy/index.ts`
4. Clique em **Deploy**

---

## 💻 Configuração no Frontend

### 1. Adicionar Variável de Ambiente

No arquivo `.env.local`, adicione:

```env
# Cloudflare Stream
VITE_STREAM_CUSTOMER_BASE_URL=https://customer-abc123.cloudflarestream.com
```

**⚠️ IMPORTANTE:** Substitua `customer-abc123` pela sua URL real do Cloudflare Stream.

### 2. Reiniciar o Servidor

Após adicionar a variável:

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

### 3. Configurar no Vercel (Produção)

Se estiver usando Vercel:

1. Vá em: **Project Settings** → **Environment Variables**
2. Adicione:
   - **Name:** `VITE_STREAM_CUSTOMER_BASE_URL`
   - **Value:** `https://customer-abc123.cloudflarestream.com`
3. Selecione os ambientes (Production, Preview, Development)
4. Clique em **Save**
5. Faça um novo deploy

---

## 🗃️ Configuração do Banco de Dados

Execute o script SQL no Supabase SQL Editor:

**Arquivo:** `scripts/add-faixa-audio-video-stream-columns.sql`

Ou execute manualmente:

```sql
-- Adiciona colunas para integração com Cloudflare Stream + R2
ALTER TABLE faixa_audio_video
ADD COLUMN IF NOT EXISTS arquivo_bucket TEXT;

ALTER TABLE faixa_audio_video
ADD COLUMN IF NOT EXISTS arquivo_key TEXT;

ALTER TABLE faixa_audio_video
ADD COLUMN IF NOT EXISTS stream_uid TEXT;

ALTER TABLE faixa_audio_video
ADD COLUMN IF NOT EXISTS stream_iframe_url TEXT;

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_faixa_audio_video_stream_uid
  ON faixa_audio_video(stream_uid)
  WHERE stream_uid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_faixa_audio_video_arquivo_key
  ON faixa_audio_video(arquivo_key)
  WHERE arquivo_key IS NOT NULL;
```

---

## 🧪 Testando a Integração

### 1. Teste Básico

1. Acesse um projeto no sistema
2. Vá em uma faixa
3. Clique em **"Anexar Áudio/Vídeo"**
4. Selecione **Formato: "Arquivo (R2)"**
5. Selecione **Tipo: "Vídeo"**
6. Faça upload de um arquivo de vídeo
7. Aguarde o upload e o processamento no Stream
8. O vídeo deve aparecer usando o player do Cloudflare Stream

### 2. Verificar no Banco de Dados

Execute no Supabase SQL Editor:

```sql
SELECT 
  id,
  faixa_id,
  tipo,
  arquivo_nome,
  stream_uid,
  stream_iframe_url,
  created_at
FROM faixa_audio_video
WHERE stream_uid IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

Você deve ver os registros com `stream_uid` preenchido.

### 3. Verificar Logs da Edge Function

No Supabase Dashboard:

1. Vá em: **Edge Functions** → **stream-copy** → **Logs**
2. Verifique se há erros ou sucessos nas chamadas

---

## 🔍 Troubleshooting

### Erro: "Cloudflare Stream não configurado"

**Causa:** Variável `VITE_STREAM_CUSTOMER_BASE_URL` não está configurada.

**Solução:**
1. Verifique se a variável está no `.env.local`
2. Reinicie o servidor de desenvolvimento
3. No Vercel, verifique se a variável está configurada

### Erro: "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_STREAM_API_TOKEN"

**Causa:** Secrets não configurados no Supabase.

**Solução:**
1. Vá em: Supabase → **Project Settings** → **Edge Functions** → **Secrets**
2. Adicione os secrets necessários
3. Aguarde alguns minutos para propagação

### Erro: "Cloudflare Stream API error"

**Causa:** Token inválido ou sem permissões.

**Solução:**
1. Verifique se o token tem permissão **Edit** no Stream
2. Verifique se o Account ID está correto
3. Crie um novo token se necessário

### Vídeo não aparece no player

**Causa:** `stream_uid` não foi salvo ou `VITE_STREAM_CUSTOMER_BASE_URL` incorreta.

**Solução:**
1. Verifique no banco se `stream_uid` foi salvo
2. Verifique se `VITE_STREAM_CUSTOMER_BASE_URL` está correta
3. Verifique os logs da Edge Function

### Upload funciona mas Stream não processa

**Causa:** URL assinada do R2 expirou ou é inválida.

**Solução:**
1. Verifique se o R2 está configurado corretamente
2. Verifique se a URL assinada tem validade de 24h
3. Verifique os logs da Edge Function para ver o erro específico

---

## 📚 Referências

- [Cloudflare Stream Documentation](https://developers.cloudflare.com/stream/)
- [Stream Upload via Link](https://developers.cloudflare.com/stream/uploading-videos/upload-via-link/)
- [Stream API Reference](https://developers.cloudflare.com/api/resources/stream/subresources/copy/methods/create/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## ✅ Checklist de Configuração

Use este checklist para garantir que tudo está configurado:

- [ ] Account ID do Cloudflare obtido
- [ ] API Token do Cloudflare criado com permissão Stream Edit
- [ ] Customer Base URL obtida do Cloudflare
- [ ] Secrets configurados no Supabase (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_STREAM_API_TOKEN)
- [ ] Edge Function `stream-copy` deployada
- [ ] Variável `VITE_STREAM_CUSTOMER_BASE_URL` no `.env.local`
- [ ] Variável `VITE_STREAM_CUSTOMER_BASE_URL` no Vercel (produção)
- [ ] Script SQL executado no banco de dados
- [ ] Servidor reiniciado após adicionar variável
- [ ] Teste de upload de vídeo realizado com sucesso

---

**🎉 Pronto! A integração do Cloudflare Stream está configurada e funcionando!**
