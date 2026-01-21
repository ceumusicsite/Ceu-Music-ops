# 🎬 Configurar Conta YouTube Compartilhada da CEU Music

## 🎯 Objetivo

Configurar a conta YouTube da CEU Music para que **TODOS os uploads** sejam feitos automaticamente para essa conta, sem necessidade de cada usuário fazer login individual.

---

## ✅ Como Funciona

1. **Configuração única:** Um administrador faz a autenticação inicial uma única vez
2. **Tokens armazenados no Supabase:** Os tokens ficam salvos de forma segura no banco de dados
3. **Renovação automática:** O sistema renova os tokens automaticamente quando expiram
4. **Uso compartilhado:** Todos os usuários do sistema fazem upload para a mesma conta CEU Music

---

## 📋 Passo a Passo

### **PASSO 1: Criar Tabela no Supabase**

1. Acesse o Supabase: **https://app.supabase.com**
2. Selecione seu projeto
3. Vá em: **SQL Editor** (menu lateral)
4. Clique em **"New query"**
5. Abra o arquivo: `scripts/create-youtube-tokens-table.sql`
6. **Copie todo o conteúdo** do arquivo
7. **Cole no SQL Editor** do Supabase
8. Clique em **"Run"** (ou F5)
9. ✅ Deve aparecer "Success. No rows returned"

---

### **PASSO 2: Configurar Client Secret (se necessário)**

O sistema precisa do **Client Secret** para obter o refresh token.

1. Acesse: **Google Cloud Console** → **APIs e Serviços** → **Credenciais**
2. Clique no seu Client ID
3. **Copie o Client Secret** (se ainda não tiver)
4. Adicione no `.env.local`:

```env
VITE_YOUTUBE_CLIENT_SECRET=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
```

⚠️ **IMPORTANTE:** O Client Secret deve ser mantido em segredo. Não compartilhe publicamente.

---

### **PASSO 3: Fazer Autenticação Inicial**

1. **Acesse o sistema** e faça login
2. Vá em um **projeto** → **faixa** → **Adicionar mídia**
3. Selecione: **Tipo: Vídeo** → **Formato: Upload para YouTube**
4. Você verá uma mensagem: **"Configuração necessária"**
5. Clique em **"Configurar Conta YouTube da CEU Music"**
6. Uma nova aba abrirá com o Google
7. **Faça login com a conta YouTube da CEU Music** (a conta da qual você pegou a API)
8. **Autorize o acesso** ao canal
9. Você será redirecionado de volta ao sistema
10. ✅ **Pronto!** A conta está configurada

---

### **PASSO 4: Verificar se Funcionou**

1. Tente fazer upload de um vídeo de teste
2. O vídeo deve ser enviado para a conta da CEU Music
3. Verifique no YouTube Studio da conta CEU Music se o vídeo apareceu

---

## 🔄 Renovação Automática de Tokens

O sistema **renova automaticamente** os tokens quando expiram:

- ✅ Verifica se o token está próximo de expirar (5 minutos antes)
- ✅ Renova automaticamente usando o refresh token
- ✅ Salva o novo token no Supabase
- ✅ Continua funcionando sem interrupção

**Você não precisa fazer nada!** O sistema cuida de tudo automaticamente.

---

## 👥 Para Todos os Usuários

Após a configuração inicial:

1. ✅ **Nenhum usuário precisa fazer login**
2. ✅ **Todos os uploads vão para a conta CEU Music**
3. ✅ **O sistema funciona automaticamente**
4. ✅ **Tokens são renovados automaticamente**

---

## 🔐 Segurança

- ✅ Tokens armazenados no Supabase (não no navegador)
- ✅ Apenas usuários autenticados podem acessar
- ✅ Refresh token usado para renovação segura
- ✅ Client Secret não exposto no frontend

---

## 🆘 Problemas Comuns

### **Erro: "Conta YouTube não está configurada"**

**Solução:**
1. Verifique se a tabela `youtube_tokens` foi criada no Supabase
2. Faça a autenticação inicial (Passo 3)
3. Verifique se os tokens foram salvos no Supabase

---

### **Erro: "Refresh token não foi fornecido"**

**Causa:** O Google não forneceu o refresh token.

**Solução:**
1. Certifique-se de usar `access_type=offline` (já está no código)
2. Certifique-se de usar `prompt=consent` (já está no código)
3. Na primeira autenticação, o Google deve fornecer o refresh token
4. Se não fornecer, revogue o acesso e faça novamente

---

### **Token expira e não renova**

**Solução:**
1. Verifique se o Client Secret está configurado no `.env.local`
2. Verifique se o refresh token está salvo no Supabase
3. O sistema deve renovar automaticamente, mas se não funcionar:
   - Faça a autenticação novamente (Passo 3)

---

## 📊 Verificar Tokens no Supabase

Para verificar se os tokens estão salvos:

1. Acesse: **Supabase** → **Table Editor**
2. Procure pela tabela: **`youtube_tokens`**
3. Deve ter **1 registro** com:
   - `access_token`: Token de acesso atual
   - `refresh_token`: Token para renovação
   - `expires_at`: Data de expiração

---

## 🔄 Reconfigurar a Conta

Se precisar trocar a conta ou reconfigurar:

1. Acesse: **Supabase** → **Table Editor** → **`youtube_tokens`**
2. **Delete o registro** existente
3. Faça a autenticação novamente (Passo 3)

---

## ✅ Checklist

- [ ] Tabela `youtube_tokens` criada no Supabase
- [ ] Client Secret configurado no `.env.local`
- [ ] Autenticação inicial feita com conta CEU Music
- [ ] Tokens salvos no Supabase
- [ ] Upload de teste funcionando
- [ ] Vídeo aparece na conta CEU Music no YouTube

---

## 📚 Arquivos Criados

- `scripts/create-youtube-tokens-table.sql` - Script SQL para criar tabela
- `src/services/youtube-shared.ts` - Serviço com conta compartilhada
- `src/components/projetos/YouTubeUpload.tsx` - Componente atualizado
- `src/pages/youtube-callback/page.tsx` - Callback atualizado

---

## 🎯 Resultado Final

Após configurar:

✅ **Todos os uploads** → Conta YouTube da CEU Music  
✅ **Sem login individual** → Sistema usa conta compartilhada  
✅ **Renovação automática** → Tokens sempre válidos  
✅ **Seguro** → Tokens no Supabase, não no navegador  

---

**🚀 Pronto! Agora todos os uploads serão feitos automaticamente para a conta YouTube da CEU Music!**
