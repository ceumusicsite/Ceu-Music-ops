# Como Configurar CORS no Cloudflare R2

O erro de CORS ocorre porque o bucket do R2 precisa permitir requisições do seu domínio. Siga estes passos:

## 🔧 Configuração de CORS no Cloudflare R2

### Passo 1: Acessar o Dashboard do Cloudflare

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em **R2** no menu lateral
3. Selecione o bucket que você quer configurar (ex: `documentos`, `anexos`, `comprovantes`)

### Passo 2: Configurar CORS Policy

1. No bucket selecionado, vá em **Settings** (Configurações)
2. Role até a seção **CORS Policy**
3. Clique em **Edit CORS Policy** ou **Add CORS Policy**

### Passo 3: Adicionar Regra de CORS

Cole a seguinte configuração JSON:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://seu-dominio.com"
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
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**Importante:**
- Adicione `http://localhost:3000` para desenvolvimento
- Adicione `http://localhost:5173` se usar outra porta do Vite
- Adicione seu domínio de produção quando for fazer deploy
- `AllowedHeaders: ["*"]` permite todos os headers (necessário para AWS SDK)

### Passo 4: Salvar e Testar

1. Clique em **Save** ou **Update**
2. Aguarde alguns segundos para a configuração ser aplicada
3. Teste novamente o upload no sistema

## 🔄 Repetir para Todos os Buckets

Configure CORS para **todos os buckets** que você está usando:
- ✅ `documentos`
- ✅ `anexos`
- ✅ `comprovantes`
- ✅ `music-audio` (se estiver usando)

## ⚠️ Alternativa: Usar Backend/Proxy

Se não conseguir configurar CORS ou preferir uma solução mais segura, você pode:

1. Criar um endpoint no backend que faça o upload
2. O frontend envia o arquivo para o backend
3. O backend faz o upload para o R2

Isso evita expor as credenciais do R2 no frontend.

## 📝 Exemplo de CORS Policy Completa

Para desenvolvimento e produção:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://seu-dominio-producao.com",
      "https://www.seu-dominio-producao.com"
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

## ✅ Após Configurar

1. Recarregue a página do sistema (F5)
2. Tente fazer upload novamente
3. O erro de CORS deve desaparecer

## 🐛 Se Ainda Não Funcionar

1. Verifique se salvou a configuração de CORS
2. Aguarde 1-2 minutos (pode levar tempo para propagar)
3. Limpe o cache do navegador
4. Verifique se o bucket está correto no `.env.local`

