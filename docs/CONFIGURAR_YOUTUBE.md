# Configuração de Upload para YouTube

Este documento explica como configurar o sistema para fazer upload de vídeos diretamente no YouTube.

## Pré-requisitos

1. Conta Google/YouTube
2. Projeto no Google Cloud Console
3. YouTube Data API v3 habilitada

## Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **YouTube Data API v3**:
   - Vá em "APIs e Serviços" > "Biblioteca"
   - Procure por "YouTube Data API v3"
   - Clique em "Ativar"

### 2. Configurar OAuth 2.0

1. Vá em "APIs e Serviços" > "Credenciais"
2. Clique em "Criar credenciais" > "ID do cliente OAuth"
3. Configure a tela de consentimento OAuth:
   - Tipo de aplicativo: "Aplicativo da Web"
   - Nome: "CEU Music Ops"
   - Adicione seu domínio nas "Origens JavaScript autorizadas"
   - Adicione `http://localhost:3000` para desenvolvimento
   - Adicione sua URL de produção
   - Em "URIs de redirecionamento autorizados", adicione:
     - `http://localhost:3000` (desenvolvimento)
     - Sua URL de produção

4. Crie o ID do cliente OAuth
5. Anote o **Client ID** e **Client Secret**

### 3. Criar API Key

1. Em "Credenciais", clique em "Criar credenciais" > "Chave de API"
2. Anote a **API Key**
3. (Opcional) Restrinja a chave apenas para YouTube Data API v3

### 4. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env.local`:

```env
# Google/YouTube API
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui
VITE_GOOGLE_API_KEY=sua-api-key-aqui
```

**⚠️ IMPORTANTE**: 
- Não compartilhe essas chaves publicamente
- Use variáveis de ambiente diferentes para desenvolvimento e produção
- Em produção, configure as URLs autorizadas no Google Cloud Console

### 5. Testar a Integração

1. Inicie o servidor de desenvolvimento: `npm run dev`
2. Acesse a página de detalhes de um projeto
3. Clique em "Adicionar Áudio/Vídeo" em uma faixa
4. Selecione o tipo "Vídeo"
5. Selecione o formato "Upload para YouTube"
6. Faça login com sua conta Google/YouTube
7. Selecione um vídeo e preencha os dados (título, descrição, tags, privacidade)
8. Faça o upload

## Como Usar

### Na Seção de Faixas

1. Na página de detalhes do projeto, vá até a seção de **Faixas**
2. Clique no botão **"Adicionar Áudio/Vídeo"** na faixa desejada
3. Selecione o tipo: **Vídeo**
4. Selecione o formato: **Upload para YouTube**
5. Se não estiver autenticado, clique em **"Fazer login no YouTube"**
6. Selecione o arquivo de vídeo
7. Preencha:
   - **Título**: Título do vídeo (obrigatório)
   - **Descrição**: Descrição do vídeo (opcional)
   - **Tags**: Tags separadas por vírgula (opcional)
   - **Privacidade**: Privado, Não listado ou Público
8. Clique em **"Fazer upload no YouTube"**
9. Aguarde o upload ser concluído
10. O link do YouTube será automaticamente salvo na faixa

## Limitações e Considerações

- **Tamanho máximo**: 128GB por vídeo (recomendamos menos)
- **Formatos suportados**: Todos os formatos de vídeo suportados pelo YouTube
- **Tempo de processamento**: O YouTube pode levar alguns minutos para processar o vídeo após o upload
- **Quota da API**: O YouTube Data API tem limites de quota diária
- **Autenticação**: Cada usuário precisa fazer login com sua própria conta Google/YouTube
- **Privacidade padrão**: O vídeo é enviado como "Privado" por padrão, mas pode ser alterado antes do upload

## Troubleshooting

### Erro: "Google API não carregada"
- Verifique se os scripts do Google foram incluídos no `index.html`
- Verifique se há bloqueadores de anúncios ou extensões interferindo
- Verifique o console do navegador para erros de carregamento

### Erro: "Usuário não autenticado"
- Faça logout e login novamente
- Verifique se as credenciais OAuth estão corretas
- Verifique se o Client ID está correto no `.env.local`

### Erro: "Quota excedida"
- Você atingiu o limite diário da API
- Aguarde 24 horas ou solicite aumento de quota no Google Cloud Console
- Verifique sua quota em: Google Cloud Console > APIs e Serviços > Dashboard

### Upload muito lento
- Depende da velocidade da internet
- Vídeos grandes podem levar muito tempo
- O YouTube processa o vídeo após o upload, o que pode levar alguns minutos
- O progresso do upload não é exibido (limitação da API)

### Vídeo não aparece após upload
- O YouTube precisa processar o vídeo primeiro
- Verifique o status do vídeo no YouTube Studio
- Vídeos privados só aparecem para o canal que fez o upload

## Segurança

- Nunca exponha o Client Secret no frontend
- Use apenas Client ID e API Key no frontend
- Configure corretamente as URLs autorizadas no Google Cloud Console
- Use HTTPS em produção
- Restrinja a API Key apenas para YouTube Data API v3
- Revise regularmente as permissões OAuth concedidas

## Recursos Adicionais

- [Documentação YouTube Data API v3](https://developers.google.com/youtube/v3)
- [Google Cloud Console](https://console.cloud.google.com/)
- [YouTube API Quotas](https://developers.google.com/youtube/v3/getting-started#quota)
- [OAuth 2.0 para Aplicativos Web](https://developers.google.com/identity/protocols/oauth2/web-server)
