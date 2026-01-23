# ✅ Checklist: Integração Cloudflare Stream

Use este checklist para verificar se tudo está configurado corretamente.

---

## ✅ Configurações Completadas

- [x] **Account ID do Cloudflare obtido:** `618f5ae8032ecdc71435fc5c81d231b1593a5`
- [x] **API Token do Cloudflare criado:** `exKE4dE3TDWcWQRak6vL9LhJG97hP99ZqGZ8IwPI`
- [x] **Secrets configurados no Supabase:**
  - [x] `CLOUDFLARE_ACCOUNT_ID`
  - [x] `CLOUDFLARE_STREAM_API_TOKEN`
- [x] **Variável de ambiente no frontend:**
  - [x] `VITE_STREAM_CUSTOMER_BASE_URL` = `https://customer-jzsf7zucu5f099z5.cloudflarestream.com`

---

## ⚠️ Verificações Pendentes

### 1. Edge Function Deployada?

**Verificar:**
1. Acesse: https://app.supabase.com
2. Vá em: **Edge Functions**
3. Procure por: `stream-copy`
4. Se não existir, precisa fazer deploy

**Como fazer deploy:**

**Opção 1: Via Dashboard (Mais Fácil)**
1. Vá em: **Edge Functions** → **Create a new function**
2. Nome: `stream-copy`
3. Cole o conteúdo do arquivo: `supabase/functions/stream-copy/index.ts`
4. Clique em **Deploy**

**Opção 2: Via CLI**
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

---

### 2. Banco de Dados Configurado?

**Verificar:**
Execute no Supabase SQL Editor:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'faixa_audio_video' 
  AND column_name IN ('stream_uid', 'stream_iframe_url', 'arquivo_bucket', 'arquivo_key');
```

**Se não retornar 4 linhas, execute o script:**

Arquivo: `scripts/add-faixa-audio-video-stream-columns.sql`

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

### 3. Servidor Reiniciado?

**Verificar:**
- Após adicionar `VITE_STREAM_CUSTOMER_BASE_URL` no `.env.local`, você reiniciou o servidor?

**Se não:**
```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

---

## 🧪 Teste Final

Após verificar tudo acima:

1. **Acesse um projeto no sistema**
2. **Vá em uma faixa**
3. **Clique em "Anexar Áudio/Vídeo"**
4. **Configure:**
   - Formato: **"Arquivo (R2)"**
   - Tipo: **"Vídeo"**
5. **Faça upload de um vídeo**
6. **Aguarde o processamento no Stream**
7. **Verifique se o vídeo aparece com o player do Stream**

---

## 🔍 Verificação de Logs

Se algo não funcionar:

1. **Logs da Edge Function:**
   - Supabase → Edge Functions → stream-copy → Logs
   - Verifique se há erros

2. **Console do Navegador:**
   - Abra o DevTools (F12)
   - Vá na aba Console
   - Procure por erros relacionados ao Stream

3. **Banco de Dados:**
   ```sql
   SELECT 
     id,
     tipo,
     stream_uid,
     stream_iframe_url,
     created_at
   FROM faixa_audio_video
   WHERE tipo = 'video'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

---

## ✅ Status Atual

- ✅ Secrets configurados no Supabase
- ✅ Variável de ambiente configurada
- ⚠️ Verificar: Edge Function deployada?
- ⚠️ Verificar: Banco de dados configurado?
- ⚠️ Verificar: Servidor reiniciado?

---

**🎯 Próximo passo:** Verifique os itens pendentes acima e depois teste fazendo upload de um vídeo!
