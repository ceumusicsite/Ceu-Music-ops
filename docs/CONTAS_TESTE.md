# Contas de Teste - CEU Music Ops

## 📋 Informações de Acesso

### Conta Administrador de Teste

**E-mail:** `admin@ceumusic.com`  
**Senha:** `Admin123!@#`

**Role:** `admin`

---

## 🔧 Como Criar a Conta de Teste

### Opção 1: Usando o Script create-admin (Recomendado)

1. Certifique-se de que o arquivo `.env.local` está configurado com as credenciais do Supabase:
   ```env
   VITE_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key (opcional, mas recomendado)
   ```

2. Execute o script:
   ```bash
   node scripts/create-admin.js
   ```

3. Quando solicitado, informe:
   - **Nome completo:** Admin Teste
   - **E-mail:** admin@ceumusic.com
   - **Senha:** Admin123!@#

### Opção 2: Criar Manualmente no Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Authentication** > **Users**
3. Clique em **Add User** > **Create new user**
4. Preencha:
   - **Email:** admin@ceumusic.com
   - **Password:** Admin123!@#
   - **Auto Confirm User:** ✅ (marque esta opção)
5. Após criar, vá em **Table Editor** > **users**
6. Crie um registro com:
   - **id:** (copie o ID do usuário criado em Authentication)
   - **name:** Admin Teste
   - **email:** admin@ceumusic.com
   - **role:** admin

---

## 🔐 Outras Contas de Teste (Opcional)

Você pode criar contas adicionais para diferentes roles:

### Conta de Produtor
- **E-mail:** `produtor@ceumusic.com`
- **Senha:** `Produtor123!@#`
- **Role:** `produtor`

### Conta de Usuário Comum
- **E-mail:** `usuario@ceumusic.com`
- **Senha:** `Usuario123!@#`
- **Role:** `user`

---

## ⚠️ Importante

- **Nunca use essas credenciais em produção!**
- Essas são apenas para desenvolvimento e testes locais
- Altere as senhas após o primeiro acesso se necessário
- Se usar `SUPABASE_SERVICE_ROLE_KEY`, o e-mail será confirmado automaticamente
- Sem a service role key, você precisará confirmar o e-mail manualmente

---

## 🚀 Após Criar a Conta

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse a página de login: `http://localhost:3000/login`

3. Faça login com as credenciais:
   - **E-mail:** admin@ceumusic.com
   - **Senha:** Admin123!@#

4. Você será redirecionado para o dashboard!

---

## 📝 Verificar Usuários Cadastrados

Para verificar quais usuários estão cadastrados, você pode:

1. Acessar o Supabase Dashboard > Authentication > Users
2. Ou executar (após instalar dotenv):
   ```bash
   node scripts/check-users.js
   ```

---

## 🔄 Resetar Senha

Se precisar resetar a senha:

1. No Supabase Dashboard > Authentication > Users
2. Encontre o usuário
3. Clique em **Reset Password**
4. Ou use a funcionalidade "Esqueci minha senha" na página de login
