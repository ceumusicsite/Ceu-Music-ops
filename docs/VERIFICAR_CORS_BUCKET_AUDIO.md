# Verificação Final de CORS no Bucket "audio"

## ⚠️ IMPORTANTE: Checklist Completo

Siga estes passos **na ordem** para garantir que o CORS está configurado corretamente:

### 1. ✅ Verificar que o Bucket Existe

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em **R2**
3. **Confirme que o bucket `audio` existe** na lista
4. Se não existir, crie um novo bucket com o nome `audio`

### 2. ✅ Configurar CORS (PASSO CRÍTICO)

1. Clique no bucket **`audio`**
2. Vá em **Settings** (Configurações)
3. Role até **CORS Policy**
4. **APAGUE qualquer configuração existente** (se houver)
5. Clique em **Edit CORS Policy** ou **Add CORS Policy**
6. **Cole EXATAMENTE este JSON** (copie e cole, não digite):

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

7. **Clique em SAVE**
8. **AGUARDE 3-5 MINUTOS** (pode levar tempo para propagar)

### 3. ✅ Verificar Variáveis de Ambiente

Abra o arquivo `.env.local` na raiz do projeto e verifique:

```env
VITE_R2_ACCOUNT_ID=seu_account_id
VITE_R2_ACCESS_KEY_ID=seu_access_key_id
VITE_R2_SECRET_ACCESS_KEY=seu_secret_access_key
VITE_R2_ENDPOINT=https://seu_account_id.r2.cloudflarestorage.com
VITE_R2_BUCKET_AUDIO=audio
```

**Importante:** O valor de `VITE_R2_BUCKET_AUDIO` deve ser exatamente `audio` (sem aspas, sem espaços).

### 4. ✅ Verificar Permissões do Token

1. No Cloudflare Dashboard → **R2** → **Manage R2 API Tokens**
2. Verifique o token que você está usando
3. Confirme que ele tem permissão de **Object Read & Write** no bucket `audio`
4. Se não tiver, crie um novo token com as permissões corretas

### 5. ✅ Reiniciar Tudo

1. **Pare o servidor de desenvolvimento** (Ctrl+C no terminal)
2. **Feche completamente o navegador** (todas as abas e janelas)
3. **Aguarde 10 segundos**
4. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```
5. **Abra o navegador novamente** e acesse `http://localhost:3000`
6. **Limpe o cache do navegador** (Ctrl+Shift+Delete → Cache → Limpar)

### 6. ✅ Testar Upload

1. Acesse o formulário de link compartilhável
2. Tente fazer upload de um arquivo de áudio
3. Abra o Console do navegador (F12)
4. Verifique se ainda há erros de CORS

## 🔍 Se Ainda Não Funcionar

### Verificar no Console do Navegador

1. Abra o Console (F12)
2. Tente fazer upload
3. Procure por erros que mencionem:
   - `CORS policy`
   - `Access-Control-Allow-Origin`
   - `Failed to fetch`

### Verificar a URL do Erro

O erro deve mostrar uma URL como:
```
https://audio.1db437b...r2.cloudflarestorage.com/...
```

Confirme que:
- O bucket na URL é `audio` (ou começa com `audio`)
- A origem é `http://localhost:3000`

### Testar CORS Manualmente

Você pode testar se o CORS está funcionando abrindo o Console do navegador e executando:

```javascript
fetch('https://seu-bucket.r2.cloudflarestorage.com/', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:3000'
  }
}).then(r => {
  console.log('CORS Headers:', r.headers.get('Access-Control-Allow-Origin'));
}).catch(e => console.error('Erro:', e));
```

Se retornar `null` ou der erro, o CORS não está configurado corretamente.

## 🆘 Última Alternativa

Se após todos esses passos ainda não funcionar, o problema pode ser:

1. **Bucket com nome diferente**: Verifique se o bucket realmente se chama `audio` ou se tem outro nome
2. **Token sem permissões**: Crie um novo token com todas as permissões
3. **Configuração de CORS inválida**: Tente uma configuração mais simples:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

**Nota:** Usar `"*"` em `AllowedOrigins` é menos seguro, mas pode funcionar para desenvolvimento.


