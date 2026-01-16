# ⚠️ AÇÃO NECESSÁRIA - Configurar Supabase

## 🔴 Erro Atual
```
Supabase URL e Anon Key são obrigatórios
```

## ✅ O que já foi feito
- ✓ Arquivo `.env.local` atualizado com placeholders do Supabase
- ✓ Configurações do YouTube mantidas

## 🚀 O QUE VOCÊ PRECISA FAZER AGORA

### Passo 1: Obter Credenciais do Supabase

1. **Acesse o Supabase Dashboard:**
   - URL: https://app.supabase.com
   - Faça login na sua conta

2. **Selecione seu projeto** (ou crie um novo se não tiver)

3. **Acesse as configurações da API:**
   - Clique em **Settings** (⚙️ ícone de engrenagem no menu lateral)
   - Clique em **API**

4. **Copie as credenciais:**
   
   📋 **Project URL** (na seção "Configuration"):
   - Formato: `https://xxxxxxxxxxxxx.supabase.co`
   - Exemplo: `https://abcdefghijklmnop.supabase.co`
   
   📋 **anon public key** (na seção "Project API keys"):
   - Procure pela chave com label **"anon"** e **"public"**
   - É uma string longa que começa com `eyJ...`
   - Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### Passo 2: Atualizar o arquivo .env.local

1. **Abra o arquivo `.env.local`** na raiz do projeto

2. **Substitua os valores de placeholder:**

   Procure por estas linhas:
   ```env
   VITE_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
   VITE_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
   ```

   Substitua pelos valores REAIS que você copiou:
   ```env
   VITE_PUBLIC_SUPABASE_URL=https://seu-projeto-real.supabase.co
   VITE_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sua-chave-real-aqui
   ```

3. **Salve o arquivo**

---

### Passo 3: Reiniciar o Servidor

⚠️ **OBRIGATÓRIO** - O servidor precisa ser reiniciado para carregar as novas variáveis:

```powershell
# Pressione Ctrl+C para parar o servidor
# Depois execute:
npm run dev
```

---

## 🎯 Exemplo Completo do .env.local

Seu arquivo `.env.local` deve ficar assim:

```env
# Google/YouTube API Configuration
VITE_GOOGLE_CLIENT_ID=1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSyBNmwV62YsVOHvmMtCZyvGxOcyrZtMaHYA

# Supabase Configuration
VITE_PUBLIC_SUPABASE_URL=https://seu-projeto-real.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sua-chave-real-completa-aqui
```

---

## 🆘 Não tenho um projeto Supabase?

Se você ainda não tem um projeto Supabase:

1. Acesse: https://app.supabase.com
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: CEU Music Ops (ou o nome que preferir)
   - **Database Password**: Crie uma senha forte e guarde-a
   - **Region**: Escolha a região mais próxima (ex: South America)
4. Clique em **"Create new project"**
5. Aguarde 2-3 minutos enquanto o projeto é criado
6. Depois, siga os passos acima para obter as credenciais

---

## ✅ Como verificar se funcionou

Após configurar e reiniciar o servidor:

1. Abra o navegador em `http://localhost:5173`
2. Abra o Console do navegador (F12)
3. O erro **"Supabase URL e Anon Key são obrigatórios"** NÃO deve mais aparecer
4. A página de login deve carregar normalmente

---

## 📚 Documentação Adicional

- Guia completo: `docs/CONFIGURAR_SUPABASE.md`
- Documentação do Supabase: https://supabase.com/docs

---

## 💡 Dica Rápida

Para verificar se as variáveis estão carregadas, abra o Console do navegador (F12) e digite:

```javascript
console.log('Supabase URL:', import.meta.env.VITE_PUBLIC_SUPABASE_URL);
console.log('Anon Key configurado:', import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ? 'Sim' : 'Não');
```

Se mostrar "undefined" ou "Não", significa que precisa reiniciar o servidor.

---

**🔥 Após configurar o Supabase, você terá:**
- ✅ Sistema de autenticação funcionando
- ✅ Banco de dados conectado
- ✅ Upload para YouTube configurado
- ✅ Sistema completo operacional!
