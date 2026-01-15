# Configuração do YouTube Data API v3

Este guia explica como configurar a integração com YouTube para fazer upload de vídeos diretamente pelo sistema.

## 📋 Pré-requisitos

- Conta Google (Gmail)
- Acesso ao [Google Cloud Console](https://console.cloud.google.com/)

## 🔧 Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em **"Selecionar projeto"** no topo
3. Clique em **"Novo Projeto"**
4. Preencha:
   - **Nome do projeto**: `CEU Music Ops` (ou outro nome de sua escolha)
   - **Organização**: (opcional)
5. Clique em **"Criar"**

### 2. Habilitar YouTube Data API v3

1. No menu lateral, vá em **"APIs e Serviços"** > **"Biblioteca"**
2. Busque por **"YouTube Data API v3"**
3. Clique no resultado e depois em **"Habilitar"**
4. Aguarde a confirmação

### 3. Criar Credenciais OAuth 2.0

1. No menu lateral, vá em **"APIs e Serviços"** > **"Credenciais"**
2. Clique em **"Criar credenciais"** > **"ID do cliente OAuth"**
3. Se solicitado, configure a tela de consentimento:
   - **Tipo de usuário**: Externo
   - **Nome do app**: CEU Music Ops
   - **Email de suporte**: seu-email@exemplo.com
   - **Domínios autorizados**: (deixe vazio por enquanto)
   - Clique em **"Salvar e continuar"**
   - Adicione escopos: `https://www.googleapis.com/auth/youtube.upload`
   - Adicione usuários de teste (seu email)
   - Clique em **"Salvar e continuar"**

4. Configure o ID do cliente OAuth:
   - **Tipo de aplicativo**: Aplicativo da Web
   - **Nome**: CEU Music Ops Web Client
   - **URIs de redirecionamento autorizados**:
     - Para desenvolvimento: `http://localhost:3000/youtube-callback`
     - Para produção: `https://seu-dominio.com/youtube-callback`
   - Clique em **"Criar"**

5. **IMPORTANTE**: Copie e salve:
   - **ID do cliente** (ex: `123456789-abc.apps.googleusercontent.com`)
   - **Chave secreta do cliente** (ex: `GOCSPX-abc123...`)

### 4. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no seu arquivo `.env.local`:

```env
# YouTube Data API v3
VITE_YOUTUBE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
VITE_YOUTUBE_CLIENT_SECRET=seu-client-secret
VITE_YOUTUBE_REDIRECT_URI=http://localhost:3000/youtube-callback
```

**Para produção**, atualize `VITE_YOUTUBE_REDIRECT_URI` para:
```env
VITE_YOUTUBE_REDIRECT_URI=https://seu-dominio.com/youtube-callback
```

### 5. Configurar no Supabase (Variáveis de Ambiente)

Se você estiver usando variáveis de ambiente no Supabase (Edge Functions ou similar), adicione as mesmas variáveis lá.

**Nota**: Como estamos usando Vite no frontend, as variáveis precisam começar com `VITE_` e serão expostas ao cliente. Para maior segurança, considere criar uma API backend que faça o upload.

### 6. Testar a Integração

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Acesse um projeto e vá em uma faixa
3. Clique em **"Anexar Áudio/Vídeo"**
4. Selecione **"Vídeo"** como tipo
5. Selecione **"Upload para YouTube"** como formato
6. Clique em **"Autenticar com YouTube"**
7. Faça login e autorize o acesso
8. Após autenticar, você poderá fazer upload de vídeos

## 🔒 Segurança

### Limitações do Frontend

⚠️ **IMPORTANTE**: As credenciais OAuth estão expostas no frontend (variáveis `VITE_*`). Isso é aceitável para OAuth 2.0, mas considere:

1. **Usar API Backend**: Para maior segurança, crie uma API que gerencie os tokens
2. **Restringir Domínios**: Configure domínios autorizados no Google Cloud Console
3. **Rotacionar Credenciais**: Se comprometidas, crie novas credenciais

### Boas Práticas

- ✅ Nunca commite `.env.local` no Git
- ✅ Use diferentes credenciais para desenvolvimento e produção
- ✅ Monitore o uso da API no Google Cloud Console
- ✅ Configure limites de cota se necessário

## 📊 Limites e Cotas

### Limites de Upload
- **Tamanho máximo**: 2GB por vídeo
- **Formatos suportados**: MP4, MOV, AVI, etc. (consulte documentação do YouTube)

### Cotas da API
- **Quota padrão**: 10.000 unidades/dia
- **Upload de vídeo**: ~1.600 unidades por upload
- **Limite diário**: ~6 uploads/dia (com quota padrão)

Para aumentar a cota:
1. Acesse Google Cloud Console
2. Vá em **"APIs e Serviços"** > **"Cotas"**
3. Busque por "YouTube Data API v3"
4. Solicite aumento se necessário

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"
- Verifique se a URI no `.env.local` corresponde exatamente à configurada no Google Cloud Console
- Certifique-se de incluir `http://` ou `https://` e a porta correta

### Erro: "access_denied"
- Verifique se o escopo `youtube.upload` está habilitado
- Certifique-se de que o usuário está na lista de usuários de teste (modo de teste)

### Erro: "quota_exceeded"
- Você atingiu o limite diário de uploads
- Aguarde 24 horas ou solicite aumento de cota

### Token expirado
- O token de acesso expira após 1 hora
- O sistema solicitará nova autenticação automaticamente
- Para evitar isso, use refresh token (implementado no código)

## 📚 Referências

- [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3)
- [OAuth 2.0 for Web Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Cloud Console](https://console.cloud.google.com/)

## ✅ Checklist de Configuração

- [ ] Projeto criado no Google Cloud Console
- [ ] YouTube Data API v3 habilitada
- [ ] Credenciais OAuth 2.0 criadas
- [ ] URIs de redirecionamento configuradas
- [ ] Variáveis de ambiente adicionadas no `.env.local`
- [ ] Teste de autenticação realizado
- [ ] Teste de upload realizado
- [ ] Configurado para produção (se aplicável)

---

**Última atualização**: Dezembro 2024
