# Diagnóstico e Solução Definitiva para CORS no R2

## 🔍 Passo 1: Identificar o Bucket Real

O erro mostra que o bucket sendo usado é: `music-audio.1db437b...`

**Verifique no Cloudflare Dashboard:**
1. Vá em **R2** → Liste todos os buckets
2. Procure por um bucket que comece com `music-audio` ou tenha esse nome
3. **Anote o nome exato do bucket**

## ✅ Passo 2: Configurar CORS no Bucket Correto

1. No Cloudflare Dashboard → **R2**
2. Selecione o bucket **`music-audio`** (ou o nome exato que você encontrou)
3. Vá em **Settings** → **CORS Policy**
4. **Apague qualquer configuração existente**
5. Cole **exatamente** este JSON (sem espaços extras):

```json
[{"AllowedOrigins":["http://localhost:3000","http://localhost:5173"],"AllowedMethods":["GET","PUT","POST","DELETE","HEAD","OPTIONS"],"AllowedHeaders":["*"],"ExposeHeaders":["ETag"],"MaxAgeSeconds":3600}]
```

**OU** se preferir formatado (mas copie exatamente):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD",
      "OPTIONS"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

6. Clique em **Save**
7. **Aguarde 2-3 minutos** (pode levar tempo para propagar)

## 🔄 Passo 3: Verificar Variáveis de Ambiente

Verifique seu arquivo `.env.local`:

```env
VITE_R2_BUCKET_AUDIO=music-audio
```

Ou se estiver usando outro nome, atualize para corresponder ao bucket real no R2.

## 🧪 Passo 4: Testar

1. **Feche completamente o navegador** (não apenas a aba)
2. Abra novamente
3. Acesse `http://localhost:3000`
4. Tente fazer upload novamente
5. Abra o Console (F12) e verifique se ainda há erros de CORS

## ⚠️ Se Ainda Não Funcionar

### Alternativa 1: Verificar se o Bucket Existe

1. No Cloudflare Dashboard → R2
2. Verifique se o bucket `music-audio` existe
3. Se não existir, crie um novo bucket com esse nome
4. Configure CORS no bucket recém-criado

### Alternativa 2: Usar Bucket Diferente

Se preferir usar um bucket existente (como `ceu-music-audio`):

1. Atualize `.env.local`:
   ```env
   VITE_R2_BUCKET_AUDIO=ceu-music-audio
   ```

2. Configure CORS no bucket `ceu-music-audio`

3. Reinicie o servidor de desenvolvimento

### Alternativa 3: Verificar Permissões do Token

1. No Cloudflare Dashboard → **R2** → **Manage R2 API Tokens**
2. Verifique se o token tem permissão de **Object Read & Write** no bucket `music-audio`
3. Se não tiver, crie um novo token com as permissões corretas

## 📋 Checklist Final

- [ ] Identifiquei o nome exato do bucket no R2
- [ ] Configurei CORS no bucket correto
- [ ] Salvei a configuração de CORS
- [ ] Aguardei 2-3 minutos após salvar
- [ ] Verifiquei as variáveis de ambiente no `.env.local`
- [ ] Fechei e reabri o navegador completamente
- [ ] Limpei o cache do navegador (Ctrl+Shift+Delete)
- [ ] Reiniciei o servidor de desenvolvimento
- [ ] Testei novamente o upload

## 🆘 Último Recurso

Se nada funcionar, o problema pode ser que o Cloudflare R2 não permite uploads diretos do navegador para esse bucket específico. Nesse caso, seria necessário:

1. Criar um endpoint no backend (Supabase Edge Function ou similar)
2. O frontend envia o arquivo para o backend
3. O backend faz o upload para o R2

Isso evita completamente o problema de CORS, mas requer implementação de backend.









