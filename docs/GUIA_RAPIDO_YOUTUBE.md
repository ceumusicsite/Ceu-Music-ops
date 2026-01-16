# Guia Rápido - Configuração YouTube Upload

## ⚡ Configuração Rápida (5 minutos)

### 1. Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto ou selecione existente
3. Ative a API:
   - Menu lateral: **APIs e Serviços** > **Biblioteca**
   - Busque: **YouTube Data API v3**
   - Clique em **Ativar**

### 2. Criar Credenciais OAuth 2.0

1. Vá em **APIs e Serviços** > **Credenciais**
2. Clique em **+ Criar credenciais** > **ID do cliente OAuth**
3. Se for a primeira vez, configure a tela de consentimento:
   - **Tipo de usuário**: Externo
   - **Nome do app**: CEU Music Ops
   - **Email de suporte**: seu email
   - Clique em **Salvar e continuar** até finalizar
4. Configure o OAuth Client:
   - **Tipo de aplicativo**: Aplicativo da Web
   - **Nome**: CEU Music Ops
   - **Origens JavaScript autorizadas**:
     ```
     http://localhost:3000
     http://localhost:5173
     https://seu-dominio.com
     ```
   - **URIs de redirecionamento autorizados**:
     ```
     http://localhost:3000
     http://localhost:5173
     https://seu-dominio.com
     ```
5. Clique em **Criar**
6. **Copie o Client ID** (você vai precisar)

### 3. Criar API Key

1. Ainda em **Credenciais**, clique em **+ Criar credenciais** > **Chave de API**
2. **Copie a API Key**
3. (Recomendado) Clique na chave criada e restrinja:
   - **Restrições de API**: Selecione **YouTube Data API v3**
   - **Salvar**

### 4. Configurar no Projeto

1. Crie/edite o arquivo `.env.local` na raiz do projeto:

```env
# Google/YouTube API
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=sua-api-key-aqui
```

2. Substitua:
   - `seu-client-id-aqui.apps.googleusercontent.com` pelo Client ID copiado
   - `sua-api-key-aqui` pela API Key copiada

### 5. Testar

1. Reinicie o servidor: `npm run dev`
2. Acesse um projeto
3. Vá em uma faixa > Adicionar Áudio/Vídeo
4. Selecione: Tipo **Vídeo** > Formato **Upload para YouTube**
5. Faça login com sua conta Google
6. Teste o upload!

## ✅ Checklist de Configuração

- [ ] YouTube Data API v3 ativada
- [ ] OAuth 2.0 Client criado
- [ ] URLs autorizadas configuradas (localhost + produção)
- [ ] API Key criada
- [ ] Variáveis de ambiente configuradas no `.env.local`
- [ ] Servidor reiniciado após configurar variáveis

## 🔍 Verificar se está funcionando

Abra o console do navegador (F12) e verifique:
- Não deve aparecer erro sobre "Google API não carregada"
- Ao clicar em "Fazer login no YouTube", deve abrir popup do Google
- Após login, deve mostrar seu nome e email

## ❌ Problemas Comuns

### Erro: "Google API não carregada"
- Verifique se os scripts estão no `index.html`
- Verifique o console para erros de carregamento

### Erro: "redirect_uri_mismatch"
- Verifique se `http://localhost:3000` está nas URLs autorizadas
- Verifique se a porta está correta (pode ser 5173 no Vite)

### Erro: "invalid_client"
- Verifique se o Client ID está correto no `.env.local`
- Certifique-se de que não há espaços extras

### Não aparece opção de login
- Verifique se as variáveis de ambiente estão configuradas
- Reinicie o servidor após adicionar variáveis

## 📝 Notas Importantes

- **Client Secret**: NÃO é necessário no frontend, apenas Client ID
- **Quota**: YouTube API tem limite diário (10.000 unidades por padrão)
- **Privacidade**: Vídeos são enviados como "Privado" por padrão
- **Tamanho**: Máximo 128GB por vídeo

## 🆘 Precisa de Ajuda?

Consulte a documentação completa em: `docs/CONFIGURAR_YOUTUBE.md`
