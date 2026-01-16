# 🔧 Como Configurar o Supabase

## ⚠️ Erro: "Supabase URL e Anon Key são obrigatórios"

Este erro ocorre quando as variáveis de ambiente do Supabase não estão configuradas no arquivo `.env.local`.

---

## 📝 Passo a Passo

### 1. Obter as Credenciais do Supabase

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://app.supabase.com
   - Faça login na sua conta

2. **Selecione ou Crie um Projeto:**
   - Se já tiver um projeto, selecione-o
   - Se não tiver, clique em **New Project** e crie um novo

3. **Acesse as Configurações da API:**
   - No menu lateral, clique em **Settings** (ícone de engrenagem)
   - Clique em **API** no submenu

4. **Copie as Credenciais:**
   - **Project URL**: Está na seção "Project URL"
     - Formato: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: Está na seção "Project API keys"
     - Procure pela chave com label "anon" e "public"
     - É uma string longa que começa com `eyJ...`

---

### 2. Configurar o Arquivo .env.local

1. **Abra o arquivo `.env.local`** na raiz do projeto

2. **Localize as linhas:**
   ```env
   VITE_PUBLIC_SUPABASE_URL=
   VITE_PUBLIC_SUPABASE_ANON_KEY=
   ```

3. **Preencha com suas credenciais:**
   ```env
   VITE_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
   VITE_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNldS1wcm9qZXRvLWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxMjM0NTYsImV4cCI6MTk2MDcwOTQ1Nn0.sua-chave-aqui
   ```

   ⚠️ **IMPORTANTE:** Substitua pelos valores reais do seu projeto!

---

### 3. Reiniciar o Servidor

Após salvar o arquivo `.env.local`:

1. **Pare o servidor** (se estiver rodando):
   - Pressione `Ctrl + C` no terminal

2. **Inicie novamente:**
   ```bash
   npm run dev
   ```

3. **Verifique se o erro desapareceu:**
   - O erro "Supabase URL e Anon Key são obrigatórios" não deve mais aparecer
   - A aplicação deve carregar normalmente

---

## ✅ Verificação

Para verificar se está funcionando:

1. Abra o **Console do Navegador** (F12)
2. Não deve aparecer o erro do Supabase
3. A página de login deve carregar normalmente

---

## 🔐 Service Role Key (Opcional)

Se você quiser criar usuários automaticamente (sem confirmação de email), também pode adicionar:

```env
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

**Onde encontrar:**
- No mesmo lugar (Settings > API)
- Procure pela chave com label "service_role" e "secret"
- ⚠️ **NUNCA compartilhe ou commite esta chave!** Ela tem acesso total ao banco.

---

## 🆘 Problemas Comuns

### Erro persiste após configurar

1. **Verifique se salvou o arquivo** `.env.local`
2. **Reinicie o servidor** (Ctrl+C e `npm run dev` novamente)
3. **Verifique se não há espaços** antes ou depois dos valores
4. **Verifique se não há aspas** ao redor dos valores (não use aspas)

### Não tenho um projeto Supabase

1. Acesse https://app.supabase.com
2. Clique em **New Project**
3. Preencha:
   - **Name**: Nome do seu projeto
   - **Database Password**: Escolha uma senha forte
   - **Region**: Escolha a região mais próxima
4. Aguarde a criação (pode levar alguns minutos)
5. Depois, siga os passos acima para obter as credenciais

### Esqueci minha senha do Supabase

1. Acesse https://app.supabase.com
2. Clique em **Forgot Password**
3. Siga as instruções para recuperar

---

## 📚 Próximos Passos

Após configurar o Supabase:

1. ✅ Execute os scripts SQL no Supabase (em `scripts/`)
2. ✅ Crie uma conta de teste usando `node scripts/create-test-user.js`
3. ✅ Faça login no sistema

---

## 💡 Dica

Você pode verificar se as variáveis estão sendo carregadas corretamente adicionando temporariamente no código:

```typescript
console.log('Supabase URL:', import.meta.env.VITE_PUBLIC_SUPABASE_URL);
console.log('Anon Key:', import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado');
```

Depois de verificar, remova essas linhas por segurança.
