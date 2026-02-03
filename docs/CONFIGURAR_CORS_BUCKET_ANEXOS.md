# Configurar CORS no Bucket "anexos" do Cloudflare R2

## 🔴 Erro que você está vendo

```
Erro de CORS: O bucket "anexos" precisa ter CORS configurado no Cloudflare R2 
para permitir uploads de http://localhost:3000 e https://sys.ceumusicbr.com.br
```

## ✅ Solução Rápida

### Passo 1: Acessar o Cloudflare Dashboard

1. Acesse: **https://dash.cloudflare.com**
2. Faça login na sua conta
3. No menu lateral, clique em **R2**

### Passo 2: Selecionar o bucket

1. Encontre e clique no bucket **`anexos`** (ou `ceu-music-anexos` — depende do que está no seu `.env`)
2. Clique em **Settings** (Configurações)

### Passo 3: Configurar CORS

1. Role até a seção **CORS Policy**
2. Clique em **Edit CORS Policy** ou **Add CORS Policy**
3. **Cole** o JSON abaixo (substituindo todo o conteúdo):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "https://sys.ceumusicbr.com.br",
      "https://www.sys.ceumusicbr.com.br"
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
      "Content-Length"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**Se der "política não válida":** Cole o JSON acima linha por linha, sem copiar/colar de documento com formatação. Evite vírgulas extras ou aspas incorretas.

4. Clique em **Save** ou **Update**

### Passo 4: Aguardar e Testar

1. **Aguarde 1–2 minutos** (a configuração pode demorar para aplicar)
2. Recarregue a página do sistema (F5)
3. Tente fazer o upload novamente

## 📋 Se o bucket tiver outro nome

Se você usa `ceu-music-anexos` no `.env`:

- Configure CORS no bucket **`ceu-music-anexos`** no Cloudflare
- O nome exibido no erro é o nome real do bucket que está sendo usado

## ⚠️ Importante

- A origem **`https://sys.ceumusicbr.com.br`** já está na lista para produção
- **`AllowedHeaders: ["*"]`** é necessário para o AWS SDK funcionar
- **Nota:** Não inclua `OPTIONS` em AllowedMethods — pode invalidar a política no Cloudflare R2

## 🔍 Verificar o nome do bucket

Veja no seu `.env` ou `.env.local`:

```env
VITE_R2_BUCKET_ANEXOS=anexos
# ou
VITE_R2_BUCKET_ANEXOS=ceu-music-anexos
```

Use o valor configurado para encontrar o bucket correto no Cloudflare.
