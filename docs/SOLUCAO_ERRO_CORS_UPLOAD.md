# Solução para Erro de CORS no Upload de Áudio/Vídeo

## 🔴 Problema

Ao tentar fazer upload de áudio/vídeo através do formulário de link compartilhável, você recebe o erro:

```
Access to fetch at 'https://faixas-audio-video.xxx.r2.cloudflarestorage.com' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

## ✅ Solução: Configurar CORS no Bucket do Cloudflare R2

O bucket do R2 precisa permitir requisições do seu domínio de desenvolvimento e produção.

### Passo 1: Identificar o Bucket

O sistema mapeia o bucket `faixas-audio-video` para o bucket R2 configurado em `VITE_R2_BUCKET_AUDIO` (padrão: `ceu-music-audio`).

**O bucket que precisa ter CORS configurado é:** `ceu-music-audio` (ou o valor de `VITE_R2_BUCKET_AUDIO` no seu `.env.local`)

### Passo 2: Configurar CORS no Cloudflare Dashboard

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em **R2** no menu lateral
3. Selecione o bucket **`ceu-music-audio`** (ou o valor de `VITE_R2_BUCKET_AUDIO` no seu `.env.local`)
4. Clique em **Settings** (Configurações)
5. Role até a seção **CORS Policy**
6. Clique em **Edit CORS Policy** ou **Add CORS Policy**

### Passo 3: Adicionar Política de CORS

Cole a seguinte configuração JSON:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "https://seu-dominio-producao.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "x-amz-request-id"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**Importante:**
- `AllowedOrigins`: Adicione todas as URLs que precisam acessar o bucket
  - `http://localhost:3000` - Para desenvolvimento (Vite padrão)
  - `http://localhost:5173` - Para desenvolvimento (Vite alternativo)
  - Adicione seu domínio de produção quando fizer deploy
- `AllowedMethods`: Não inclua `OPTIONS` (pode invalidar a política no Cloudflare R2)
- `AllowedHeaders: ["*"]`: Permite todos os headers (necessário para AWS SDK)
- `MaxAgeSeconds`: Tempo de cache da política CORS (1 hora)

### Passo 4: Salvar e Testar

1. Clique em **Save** ou **Update**
2. Aguarde 30-60 segundos para a configuração ser aplicada
3. Recarregue a página do sistema (F5 ou Ctrl+R)
4. Tente fazer upload novamente

## 📋 Buckets que Precisam de CORS

Configure CORS para **todos os buckets** que você está usando:

- ✅ `ceu-music-audio` (ou `VITE_R2_BUCKET_AUDIO`) - Para áudios/vídeos de faixas
- ✅ `ceu-music-documentos` (ou `VITE_R2_BUCKET_DOCUMENTOS`) - Para documentos
- ✅ `ceu-music-anexos` (ou `VITE_R2_BUCKET_ANEXOS`) - Para anexos de projetos
- ✅ `ceu-music-comprovantes` (ou `VITE_R2_BUCKET_COMPROVANTES`) - Para comprovantes

**Repita o Passo 2 e 3 para cada bucket acima!**

## ✅ Verificar se Funcionou

Após configurar CORS:

1. Abra o console do navegador (F12)
2. Tente fazer upload novamente
3. O erro de CORS deve desaparecer
4. O upload deve completar com sucesso

## 🐛 Se Ainda Não Funcionar

1. **Verifique se salvou a configuração de CORS** no Cloudflare Dashboard
2. **Aguarde 1-2 minutos** (pode levar tempo para propagar)
3. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
4. **Verifique se o bucket existe** e o nome está correto
5. **Verifique as variáveis de ambiente** no `.env.local`:
   ```env
   VITE_R2_ACCOUNT_ID=seu_account_id
   VITE_R2_ACCESS_KEY_ID=seu_access_key
   VITE_R2_SECRET_ACCESS_KEY=seu_secret_key
   VITE_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
   ```
6. **Reinicie o servidor de desenvolvimento** após alterar variáveis de ambiente

## 📝 Nota sobre Segurança

Para produção, considere:
- Restringir `AllowedOrigins` apenas aos seus domínios de produção
- Usar signed URLs ao invés de buckets públicos
- Implementar um backend proxy para uploads (mais seguro, evita expor credenciais)

