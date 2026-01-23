# 🔧 Configurar R2 para Funcionar com Cloudflare Stream

Este guia mostra como configurar o Cloudflare R2 para que o sistema possa fazer upload de vídeos e integrá-los com o Cloudflare Stream.

---

## 🎯 Por que o R2 é necessário?

O sistema funciona assim:

```
1. Usuário faz upload de vídeo → Upload para R2
2. Sistema gera URL assinada (24h) do R2
3. Edge Function usa essa URL para copiar vídeo para Stream
4. Stream processa o vídeo e retorna UID
5. Player usa Stream para reprodução
```

**O R2 é essencial** porque:
- ✅ Armazena o arquivo original (backup)
- ✅ Fornece URL assinada para o Stream copiar
- ✅ Permite acesso seguro sem expor o arquivo publicamente

---

## 📋 Pré-requisitos

Antes de começar, você precisa:

- ✅ Conta no Cloudflare
- ✅ R2 habilitado na sua conta Cloudflare
- ✅ Acesso ao Cloudflare Dashboard

---

## 🚀 Passo 1: Criar Buckets no R2

### 1.1 Acessar o Dashboard do R2

1. Acesse: https://dash.cloudflare.com
2. Faça login na sua conta
3. No menu lateral, clique em **"R2"**

### 1.2 Criar o Bucket para Vídeos

1. Clique em **"Create bucket"** ou **"Criar bucket"**
2. Configure:
   - **Bucket name:** `ceu-music-audio` (ou outro nome de sua preferência)
   - **Location Hint:** Escolha a região mais próxima dos seus usuários (opcional)
3. Clique em **"Create bucket"**

**⚠️ IMPORTANTE:** O bucket `ceu-music-audio` é usado para armazenar vídeos e áudios das faixas. Se você usar outro nome, precisará configurar no `.env.local`.

### 1.3 (Opcional) Criar Outros Buckets

Se quiser organizar melhor, você pode criar buckets separados:

- `ceu-music-documentos` - Para documentos gerais
- `ceu-music-anexos` - Para anexos de projetos
- `ceu-music-comprovantes` - Para comprovantes financeiros
- `ceu-music-audio` - Para áudios e vídeos (usado pelo Stream)

---

## 🔑 Passo 2: Criar API Token do R2

### 2.1 Acessar a Página de API Tokens

1. No Cloudflare Dashboard, vá em **"R2"**
2. Clique em **"Manage R2 API Tokens"** ou **"Gerenciar Tokens de API R2"**

### 2.2 Criar um Novo Token

1. Clique em **"Create API token"** ou **"Criar token de API"**
2. Configure:
   - **Token name:** `CEU Music R2 Token` (ou outro nome)
   - **Permissions:** 
     - Selecione **"Object Read & Write"** para o bucket `ceu-music-audio`
     - Se criou outros buckets, adicione permissões para eles também
   - **TTL:** Deixe em branco para token permanente (ou defina expiração)
3. Clique em **"Create API Token"**

### 2.3 ⚠️ IMPORTANTE: Copiar as Credenciais

Após criar o token, você verá **3 informações importantes**:

1. **Account ID** - Copie e guarde
2. **Access Key ID** - Copie e guarde
3. **Secret Access Key** - ⚠️ **Só aparece uma vez!** Copie imediatamente

**Exemplo:**
```
Account ID: abc123def456ghi789
Access Key ID: xyz789uvw456rst123
Secret Access Key: mno345pqr678stu901vwx234yza567bcd890
```

**Guarde essas credenciais em local seguro!**

---

## ⚙️ Passo 3: Configurar CORS (Opcional mas Recomendado)

Para permitir uploads diretos do navegador, configure CORS no bucket:

### 3.1 Acessar Configurações do Bucket

1. No R2 Dashboard, clique no bucket `ceu-music-audio`
2. Vá em **"Settings"** ou **"Configurações"**
3. Role até **"CORS Policy"** ou **"Política CORS"**

### 3.2 Configurar CORS

1. Clique em **"Edit CORS Policy"** ou **"Editar Política CORS"**
2. Adicione a seguinte configuração:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://sys.ceumusicbr.com.br"
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

3. Clique em **"Save"** ou **"Salvar"**

**⚠️ IMPORTANTE:** Substitua `https://sys.ceumusicbr.com.br` pelo seu domínio de produção.

---

## 💻 Passo 4: Configurar Variáveis de Ambiente

### 4.1 Adicionar no `.env.local`

Abra o arquivo `.env.local` na raiz do projeto e adicione:

```env
# ============================================
# Configuração do Cloudflare R2
# ============================================
VITE_R2_ACCOUNT_ID=seu_account_id_aqui
VITE_R2_ACCESS_KEY_ID=sua_access_key_id_aqui
VITE_R2_SECRET_ACCESS_KEY=sua_secret_access_key_aqui
VITE_R2_ENDPOINT=https://seu_account_id.r2.cloudflarestorage.com
VITE_R2_PUBLIC_URL=https://pub-seu_account_id.r2.dev

# Buckets R2
VITE_R2_BUCKET_AUDIO=ceu-music-audio
VITE_R2_BUCKET_DOCUMENTOS=ceu-music-documentos
VITE_R2_BUCKET_ANEXOS=ceu-music-anexos
VITE_R2_BUCKET_COMPROVANTES=ceu-music-comprovantes

# Provider de Storage (r2 ou supabase)
VITE_STORAGE_PROVIDER=r2
```

**⚠️ IMPORTANTE:** 
- Substitua `seu_account_id_aqui` pelo Account ID que você copiou
- Substitua `sua_access_key_id_aqui` pelo Access Key ID
- Substitua `sua_secret_access_key_aqui` pelo Secret Access Key
- Substitua `seu_account_id` no endpoint e public URL pelo Account ID

**Exemplo real:**
```env
VITE_R2_ACCOUNT_ID=abc123def456ghi789
VITE_R2_ACCESS_KEY_ID=xyz789uvw456rst123
VITE_R2_SECRET_ACCESS_KEY=mno345pqr678stu901vwx234yza567bcd890
VITE_R2_ENDPOINT=https://abc123def456ghi789.r2.cloudflarestorage.com
VITE_R2_PUBLIC_URL=https://pub-abc123def456ghi789.r2.dev
```

### 4.2 Configurar no Vercel (Produção)

Se estiver usando Vercel:

1. Acesse: https://vercel.com
2. Vá em seu projeto → **Settings** → **Environment Variables**
3. Adicione todas as variáveis do R2:
   - `VITE_R2_ACCOUNT_ID`
   - `VITE_R2_ACCESS_KEY_ID`
   - `VITE_R2_SECRET_ACCESS_KEY`
   - `VITE_R2_ENDPOINT`
   - `VITE_R2_PUBLIC_URL`
   - `VITE_R2_BUCKET_AUDIO`
   - `VITE_R2_BUCKET_DOCUMENTOS`
   - `VITE_R2_BUCKET_ANEXOS`
   - `VITE_R2_BUCKET_COMPROVANTES`
   - `VITE_STORAGE_PROVIDER`
4. Selecione os ambientes (Production, Preview, Development)
5. Clique em **Save**
6. Faça um novo deploy

---

## 🔄 Passo 5: Reiniciar o Servidor

Após adicionar as variáveis de ambiente:

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

---

## ✅ Passo 6: Verificar a Configuração

### 6.1 Teste de Upload

1. Acesse um projeto no sistema
2. Vá em uma faixa
3. Clique em **"Anexar Áudio/Vídeo"**
4. Selecione **Formato: "Arquivo (R2)"**
5. Selecione **Tipo: "Vídeo"**
6. Faça upload de um arquivo de vídeo
7. Verifique se o upload funciona

### 6.2 Verificar no Console

Abra o console do navegador (F12) e verifique:

- ✅ Não deve aparecer erro: "Configuração do R2 não encontrada"
- ✅ O upload deve completar com sucesso
- ✅ Após o upload, deve aparecer "Enviando para Stream..."

### 6.3 Verificar no R2 Dashboard

1. Acesse o R2 Dashboard
2. Clique no bucket `ceu-music-audio`
3. Você deve ver o arquivo que fez upload

---

## 🔍 Troubleshooting

### Erro: "Configuração do R2 não encontrada"

**Causa:** Variáveis de ambiente não configuradas ou incorretas.

**Solução:**
1. Verifique se todas as variáveis estão no `.env.local`
2. Verifique se os valores estão corretos (sem espaços extras)
3. Reinicie o servidor de desenvolvimento
4. No Vercel, verifique se as variáveis estão configuradas

### Erro: "Access Denied" ou "403 Forbidden"

**Causa:** Token sem permissões ou bucket incorreto.

**Solução:**
1. Verifique se o token tem permissão **"Object Read & Write"** no bucket
2. Verifique se o nome do bucket está correto no `.env.local`
3. Crie um novo token se necessário

### Erro de CORS

**Causa:** CORS não configurado no bucket.

**Solução:**
1. Configure CORS no bucket (veja Passo 3)
2. Adicione seu domínio na lista de origens permitidas
3. Aguarde alguns minutos para propagação

### Upload funciona mas Stream não processa

**Causa:** URL assinada do R2 não está acessível ou expirou.

**Solução:**
1. Verifique se o R2 está configurado corretamente
2. Verifique se a URL assinada tem validade de 24h
3. Verifique os logs da Edge Function no Supabase

### Erro: "Bucket not found"

**Causa:** Nome do bucket incorreto ou bucket não existe.

**Solução:**
1. Verifique se o bucket existe no R2 Dashboard
2. Verifique se o nome do bucket no `.env.local` está correto
3. Crie o bucket se não existir

---

## 📋 Checklist de Configuração

Use este checklist para garantir que tudo está configurado:

- [ ] Bucket `ceu-music-audio` criado no R2
- [ ] API Token do R2 criado
- [ ] Account ID copiado e guardado
- [ ] Access Key ID copiado e guardado
- [ ] Secret Access Key copiado e guardado
- [ ] CORS configurado no bucket (opcional mas recomendado)
- [ ] Variáveis de ambiente adicionadas no `.env.local`
- [ ] Variáveis de ambiente adicionadas no Vercel (produção)
- [ ] Servidor reiniciado após adicionar variáveis
- [ ] Teste de upload realizado com sucesso
- [ ] Arquivo aparece no R2 Dashboard após upload

---

## 🔗 Links Úteis

- [Cloudflare R2 Dashboard](https://dash.cloudflare.com)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 API Tokens](https://developers.cloudflare.com/r2/api/s3/tokens/)
- [R2 CORS Configuration](https://developers.cloudflare.com/r2/buckets/cors/)

---

## 🎉 Próximos Passos

Após configurar o R2:

1. ✅ Configure o Cloudflare Stream (veja `GUIA_INTEGRACAO_STREAM.md`)
2. ✅ Configure os secrets no Supabase (veja `COMO_OBTER_SECRETS_CLOUDFLARE.md`)
3. ✅ Deploy da Edge Function `stream-copy`
4. ✅ Execute o script SQL no banco de dados
5. ✅ Teste o upload de vídeo completo

---

**🎉 Pronto! O R2 está configurado e pronto para trabalhar com o Cloudflare Stream!**
