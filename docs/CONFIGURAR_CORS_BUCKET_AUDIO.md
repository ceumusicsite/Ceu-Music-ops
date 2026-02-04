# Configurar CORS no Bucket "audio" do Cloudflare R2

## ✅ Passo a Passo

### 1. Acessar o Bucket

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em **R2** no menu lateral
3. Clique no bucket **`audio`**

### 2. Configurar CORS

1. No bucket `audio`, clique em **Settings** (Configurações)
2. Role até a seção **CORS Policy**
3. Clique em **Edit CORS Policy** ou **Add CORS Policy**
4. **Apague qualquer configuração existente**
5. Cole **exatamente** este JSON:

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

### 3. Salvar

1. Clique em **Save**
2. **Aguarde 2-3 minutos** para a configuração propagar

### 4. Verificar Variável de Ambiente

Certifique-se de que seu arquivo `.env.local` tem:

```env
VITE_R2_BUCKET_AUDIO=audio
```

### 5. Reiniciar e Testar

1. **Feche completamente o navegador** (não apenas a aba)
2. Reinicie o servidor de desenvolvimento:
   ```bash
   # Pare o servidor (Ctrl+C) e inicie novamente
   npm run dev
   ```
3. Abra o navegador e acesse `http://localhost:3000`
4. Tente fazer upload novamente

## 🔍 Verificar se Funcionou

1. Abra o Console do navegador (F12)
2. Tente fazer upload
3. **Não deve aparecer mais erros de CORS**
4. O upload deve completar com sucesso

## ⚠️ Se Ainda Não Funcionar

1. Verifique se o bucket `audio` existe no R2
2. Verifique se o token R2 tem permissão de **Object Read & Write** no bucket `audio`
3. Limpe o cache do navegador (Ctrl+Shift+Delete)
4. Aguarde mais 2-3 minutos após salvar o CORS
5. Verifique se não há erros de sintaxe no JSON (vírgulas extras, etc.)









