# Fazer o player do Cloudflare Stream funcionar

Siga estes passos **na ordem**. Quando tudo estiver certo, ao abrir um vídeo no sistema você verá o texto **"Reproduzindo via Cloudflare Stream"** no modal e o vídeo no painel da Cloudflare (Stream > Vídeos).

---

## Passo 1: Token da API do Cloudflare Stream

1. Acesse o **Dashboard da Cloudflare**: https://dash.cloudflare.com  
2. Selecione a conta (a mesma onde está o R2 e o Stream).  
3. No menu à esquerda: **Meu perfil** (ícone de pessoa) → **API Tokens**  
   - Ou direto: https://dash.cloudflare.com/profile/api-tokens  
4. Clique em **Criar token**.  
5. Use o template **"Editar Cloudflare Stream"** ou crie um token personalizado com permissão:
   - **Account** → **Cloudflare Stream** → **Edit**  
6. Copie o token e guarde em um lugar seguro (ele só aparece uma vez).

Anote também o **Account ID**: na página inicial do dashboard, no canto direito em “Detalhes da conta” → **ID da conta**.

---

## Passo 2: Subdomínio do player (Customer Subdomain)

1. No dashboard da Cloudflare: **Stream** (em Mídia) → **Vídeos**.  
2. Na barra lateral direita, em **Detalhes da conta**, veja **Subdomínio do cliente** (ex: `https://customer-xxxx.cloudflarestream.com`).  
3. Copie essa URL **inteira** (com `https://` e sem barra no final).  
   - Você vai usar no `.env` como `VITE_STREAM_CUSTOMER_BASE_URL`.

---

## Passo 3: Secrets no Supabase

1. Acesse https://app.supabase.com e abra o projeto do app.  
2. **Project Settings** (ícone de engrenagem) → **Edge Functions** → **Secrets**.  
3. Adicione dois secrets:

   | Nome                         | Valor                          |
   |-----------------------------|---------------------------------|
   | `CLOUDFLARE_ACCOUNT_ID`     | O Account ID do Passo 1         |
   | `CLOUDFLARE_STREAM_API_TOKEN` | O token criado no Passo 1     |

Salve os dois.

---

## Passo 4: Deploy da Edge Function `stream-copy`

A função que envia o vídeo do R2 para o Stream roda no Supabase. Ela **precisa estar publicada**.

**Opção A – Pelo dashboard do Supabase (mais simples)**

1. No Supabase: **Edge Functions** → **Create a new function**.  
2. Nome: **stream-copy**.  
3. Cole **todo** o conteúdo do arquivo do projeto:  
   `supabase/functions/stream-copy/index.ts`  
4. Clique em **Deploy**.

**Opção B – Pela CLI**

No terminal, na pasta do projeto:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase functions deploy stream-copy
```

(O `project-ref` está em Supabase → Project Settings → General → Reference ID.)

---

## Passo 5: Colunas no banco (Supabase)

1. No Supabase: **SQL Editor** → Nova query.  
2. Cole e execute o conteúdo do arquivo:  
   `scripts/add-faixa-audio-video-stream-columns.sql`  
   (Ou execute o SQL que está nesse arquivo.)  
3. Confirme que não deu erro.

Isso garante que a tabela `faixa_audio_video` tem as colunas `stream_uid`, `stream_iframe_url`, `arquivo_bucket` e `arquivo_key`.

---

## Passo 6: Variável no frontend (.env)

Na raiz do projeto, no `.env` ou `.env.local`:

```env
VITE_STREAM_CUSTOMER_BASE_URL=https://customer-XXXX.cloudflarestream.com
```

Substitua pela URL do **Passo 2** (subdomínio do cliente), **sem** barra no final.

Depois, **reinicie** o servidor do frontend (parar com Ctrl+C e rodar de novo `npm run dev`).

---

## Passo 7: Testar

1. Abra o app e vá em um **Projeto** → **Detalhes** de uma faixa.  
2. Em **Áudio/Vídeo**, anexe um **vídeo** (formato **Arquivo**).  
3. Salve.  
4. Clique para **reproduzir** esse vídeo.

**Se estiver tudo certo:**

- No modal do app aparece o texto **"Reproduzindo via Cloudflare Stream"** e o player é o iframe do Stream (visual diferente do player nativo).  
- No dashboard da Cloudflare: **Stream** → **Vídeos** → aparece pelo menos 1 vídeo.

**Se ainda aparecer "Reproduzindo via armazenamento" ou o player nativo:**

- Abra o **Console** do navegador (F12 → Console) e veja se há erros ao salvar ou ao abrir o vídeo.  
- No Supabase: **Edge Functions** → **stream-copy** → **Logs**. Veja se há erros (por exemplo "Missing CLOUDFLARE_ACCOUNT_ID" ou erro da API da Cloudflare).

---

## Resumo rápido

| O quê                         | Onde / Como                                      |
|------------------------------|---------------------------------------------------|
| Token Stream                 | Cloudflare → API Tokens → criar com permissão Stream |
| Account ID                   | Cloudflare → detalhes da conta                    |
| Subdomínio do player         | Cloudflare → Stream → barra direita               |
| Secrets                      | Supabase → Project Settings → Edge Functions → Secrets |
| Deploy da função             | Supabase → Edge Functions → criar/deploy `stream-copy` |
| SQL                          | Supabase → SQL Editor → script `add-faixa-audio-video-stream-columns.sql` |
| Variável frontend            | `.env`: `VITE_STREAM_CUSTOMER_BASE_URL=...` e reiniciar o dev server |

Quando o player do Stream estiver funcionando, você verá **"Reproduzindo via Cloudflare Stream"** no modal e os vídeos listados em **Stream** no dashboard da Cloudflare.

---

## Se ainda não funcionar (diagnóstico)

O sistema agora mostra a **mensagem de erro real** no modal quando o Stream falha. Use isso para descobrir o problema.

1. **Abra um vídeo** que ainda não tem Stream (o que mostra "Reproduzindo via armazenamento" ou "Preparando transmissão...").
2. Quando aparecer a mensagem em amarelo, **copie o texto completo** do erro.
3. Confira abaixo o que cada tipo de erro costuma significar.

| Mensagem / trecho | O que fazer |
|-------------------|-------------|
| `Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_STREAM_API_TOKEN` | Secrets da Edge Function não estão configurados. Volte ao **Passo 3** e crie os dois secrets no Supabase (Edge Functions → Secrets). Depois **redeploy** da função `stream-copy`. |
| `Cloudflare Stream API error` / `403` / `401` | Token da Cloudflare inválido ou sem permissão. Crie um novo token no Passo 1 com permissão **Stream → Edit** e atualize o secret `CLOUDFLARE_STREAM_API_TOKEN` no Supabase. |
| `Cloudflare response missing uid` / `errors` no details | A API da Cloudflare respondeu mas não devolveu o vídeo. Veja o `details` no erro; pode ser "URL inacessível" ou "invalid url". Use um **vídeo recém-enviado** (que tem bucket/key) para testar; vídeos antigos podem ter URL expirada. |
| `Failed to call Cloudflare Stream API` / rede | Erro de rede na Edge Function ao chamar a Cloudflare. Veja os **Logs** da função no Supabase (Edge Functions → stream-copy → Logs). |
| Nada acontece / fica "Preparando" e depois volta | Abra o **Console** do navegador (F12 → Console). Veja se aparece algum erro em vermelho ao abrir o vídeo. Também confira os **Logs** da Edge Function no Supabase. |

4. **Teste com vídeo novo**  
   Anexe um **novo** vídeo numa faixa (Arquivo → Vídeo → Salvar). Só vídeos enviados depois de ter as colunas `arquivo_bucket` e `arquivo_key` no banco geram URL assinada válida para o Stream. Vídeos antigos podem falhar com "URL inacessível".

5. **Redeploy da Edge Function**  
   Depois de alterar os secrets ou o código da função, faça deploy de novo:  
   Supabase → Edge Functions → stream-copy → **Deploy** (ou `npx supabase functions deploy stream-copy`).
