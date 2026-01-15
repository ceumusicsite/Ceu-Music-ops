# Variáveis de Ambiente para Supabase - Integração YouTube

Este documento lista as variáveis de ambiente que precisam ser configuradas no Supabase (se você estiver usando Edge Functions ou outras funcionalidades serverless).

## 📝 Variáveis Necessárias

### Para Edge Functions (Opcional - Recomendado para Produção)

Se você criar uma Edge Function no Supabase para gerenciar uploads do YouTube de forma mais segura, adicione estas variáveis:

```env
YOUTUBE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=seu-client-secret
YOUTUBE_REDIRECT_URI=https://seu-dominio.com/youtube-callback
```

### Como Adicionar no Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** > **Edge Functions**
4. Clique em **"Add new secret"** ou **"Manage secrets"**
5. Adicione cada variável:
   - **Name**: `YOUTUBE_CLIENT_ID`
   - **Value**: `seu-client-id.apps.googleusercontent.com`
   - Repita para `YOUTUBE_CLIENT_SECRET` e `YOUTUBE_REDIRECT_URI`

### Para Variáveis Públicas (Frontend)

Se você quiser expor as variáveis no frontend via Supabase (não recomendado para produção), use:

```env
VITE_YOUTUBE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
VITE_YOUTUBE_CLIENT_SECRET=seu-client-secret
VITE_YOUTUBE_REDIRECT_URI=https://seu-dominio.com/youtube-callback
```

⚠️ **ATENÇÃO**: Variáveis com prefixo `VITE_` são expostas ao cliente. Para produção, prefira usar Edge Functions.

## 🔐 Segurança

### Recomendação para Produção

Para maior segurança, recomenda-se:

1. **Criar Edge Function no Supabase** que gerencie a autenticação e upload
2. **Manter credenciais no servidor** (Edge Functions)
3. **Frontend apenas chama a Edge Function** com o arquivo de vídeo

### Exemplo de Estrutura Segura

```
Frontend (React)
    ↓ (envia arquivo)
Edge Function (Supabase)
    ↓ (usa credenciais)
YouTube API
```

## 📋 Checklist

- [ ] Credenciais OAuth 2.0 criadas no Google Cloud Console
- [ ] Variáveis adicionadas no `.env.local` (desenvolvimento)
- [ ] Variáveis adicionadas no Supabase (se usar Edge Functions)
- [ ] URI de redirecionamento configurada corretamente
- [ ] Testado em ambiente de desenvolvimento
- [ ] Configurado para produção

## 🔗 Referências

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Secrets](https://supabase.com/docs/guides/functions/secrets)

---

**Nota**: Atualmente, o sistema funciona com variáveis no frontend (`VITE_*`). Para produção, considere migrar para Edge Functions para maior segurança.
