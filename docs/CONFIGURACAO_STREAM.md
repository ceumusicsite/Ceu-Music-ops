# Configuração - Cloudflare Stream (upload interno de vídeos)

Este sistema foi ajustado para **subir vídeos das faixas para o Cloudflare Stream** (para playback interno) e **manter o arquivo no Cloudflare R2** (para armazenamento/backup).

> 📖 **Para um guia completo e detalhado, consulte:** [`GUIA_INTEGRACAO_STREAM.md`](../GUIA_INTEGRACAO_STREAM.md)

Referência: [Cloudflare Stream docs](https://developers.cloudflare.com/stream/)

## 1) Pré-requisitos no Cloudflare

- Ter o **Cloudflare Stream** habilitado no seu account.
- Criar um **API Token** com permissão para Stream (Read/Write).
- Saber o seu **Account ID** do Cloudflare.

## 2) Variáveis de ambiente do Frontend (Vite)

No seu `.env.local` (ou variáveis de ambiente do deploy), configure:

```env
# Base do player do Stream (para embed no app)
# Exemplo: https://customer-abc123.cloudflarestream.com
VITE_STREAM_CUSTOMER_BASE_URL=
```

## 3) Supabase Edge Function (recomendado)

O frontend chama uma Edge Function para criar o vídeo no Stream sem expor segredos no navegador.

### Função criada no repositório

- `supabase/functions/stream-copy/index.ts`

### Secrets necessários no Supabase

Configure os secrets no Supabase (Project Settings > Edge Functions > Secrets):

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_STREAM_API_TOKEN`

### Deploy da função

Via Supabase CLI (exemplo):

```bash
supabase functions deploy stream-copy
supabase secrets set CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_STREAM_API_TOKEN=...
```

## 4) Fluxo implementado (resumo)

1. Usuário anexa **um arquivo de vídeo** na faixa (Projetos > Detalhes).
2. O sistema faz upload do arquivo no **R2**.
3. O sistema gera uma URL assinada (24h) do R2 e chama a Edge Function `stream-copy`.
4. A Edge Function chama o endpoint de **Copy-from-URL** do Stream.
5. O `uid` retornado do Stream é salvo no registro (`faixa_audio_video.stream_uid`) e o playback interno usa o Stream.

## 5) Alterações no banco (SQL)

Execute no Supabase SQL Editor:

- `scripts/add-faixa-audio-video-stream-columns.sql`

Isso adiciona:
- `stream_uid`, `stream_iframe_url`
- `arquivo_bucket`, `arquivo_key` (para regenerar URLs do R2 quando necessário)

