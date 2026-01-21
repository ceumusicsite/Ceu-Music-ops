# Configurar CORS no Bucket "music-audio"

## ⚠️ IMPORTANTE: O bucket correto é "music-audio"

O erro mostra que o sistema está tentando usar o bucket **`music-audio`**, não `audio`.

## ✅ Solução: Configurar CORS no Bucket Correto

### Passo 1: Verificar qual bucket existe

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em **R2**
3. **Liste todos os buckets** e verifique:
   - Existe um bucket chamado **`music-audio`**?
   - Existe um bucket chamado **`audio`**?
   - **Anote qual existe**

### Passo 2: Configurar CORS no bucket correto

**Se o bucket `music-audio` existe:**

1. Clique no bucket **`music-audio`**
2. Vá em **Settings** → **CORS Policy**
3. **Apague qualquer configuração existente**
4. Cole este JSON:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "HEAD"
    ],
    "AllowedHeaders": [
      "Content-Type",
      "Authorization"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

5. Clique em **Save**
6. **Aguarde 3-5 minutos**

### Passo 3: Verificar/Atualizar .env.local

Abra o arquivo `.env.local` e verifique:

```env
VITE_R2_BUCKET_AUDIO=music-audio
```

**OU** se você quiser usar o bucket `audio`:

1. Configure CORS no bucket `audio` (mesmo processo acima)
2. Atualize `.env.local`:
   ```env
   VITE_R2_BUCKET_AUDIO=audio
   ```
3. Reinicie o servidor

### Passo 4: Reiniciar tudo

1. **Pare o servidor** (Ctrl+C)
2. **Feche completamente o navegador**
3. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```
4. **Abra o navegador novamente**
5. **Limpe o cache** (Ctrl+Shift+Delete → Cache)

### Passo 5: Testar

Tente fazer upload novamente. O erro de CORS deve desaparecer.

## 🔍 Se ainda não funcionar

1. Verifique se o bucket `music-audio` realmente existe no R2
2. Verifique se o token R2 tem permissão no bucket `music-audio`
3. Tente esta configuração CORS ainda mais simples:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

**Nota:** `"*"` é menos seguro, mas funciona para desenvolvimento.


