# 🔴 DIAGNÓSTICO - Erro ao Fazer Login

## ❌ Erro Atual
```
AuthRetryableFetchError: Failed to fetch
```

## 🔍 O QUE SIGNIFICA ESSE ERRO

Este erro significa que o sistema **NÃO ESTÁ CONSEGUINDO SE CONECTAR ao Supabase**.

Possíveis causas (em ordem de probabilidade):

1. ⚠️ **As credenciais do Supabase ainda estão como placeholder** (mais provável)
2. 🔄 O servidor não foi reiniciado após configurar as variáveis
3. 🌐 URL do Supabase está incorreto
4. 🔒 Problemas de CORS ou rede

---

## ✅ SOLUÇÃO PASSO A PASSO

### PASSO 1: Verificar se as credenciais estão configuradas

Abra o Console do navegador (F12) e digite:

```javascript
console.log('Supabase URL:', import.meta.env.VITE_PUBLIC_SUPABASE_URL);
console.log('Anon Key:', import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ? 'Configurado' : 'NÃO CONFIGURADO');
```

**RESULTADO ESPERADO:**
- Deve mostrar seu URL real do Supabase (não "seu-projeto-id")
- Deve mostrar "Configurado" para a Anon Key

**SE MOSTRAR "undefined" ou "NÃO CONFIGURADO":**
→ As variáveis não foram carregadas. Vá para o PASSO 2.

---

### PASSO 2: Configurar as credenciais REAIS do Supabase

#### A) Obter as credenciais

1. Acesse: **https://app.supabase.com**
2. Faça login e selecione seu projeto
3. Vá em: **Settings** ⚙️ → **API**
4. Copie:

   **📋 Project URL** (Seção "Configuration"):
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   
   **📋 anon public key** (Seção "Project API keys"):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
   ```

#### B) Atualizar o arquivo .env.local

1. Abra o arquivo: `C:\Users\jonat\OneDrive\Documentos\Ceu-Music-ops-1\.env.local`

2. **SUBSTITUA** estas linhas:
   ```env
   VITE_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
   VITE_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
   ```

3. Pelos valores **REAIS** que você copiou:
   ```env
   VITE_PUBLIC_SUPABASE_URL=https://seu-projeto-REAL.supabase.co
   VITE_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sua-chave-REAL-completa
   ```

4. **SALVE o arquivo** (Ctrl+S)

---

### PASSO 3: Reiniciar o servidor (OBRIGATÓRIO!)

As variáveis de ambiente só são carregadas ao iniciar o servidor.

**No terminal onde o servidor está rodando:**

```powershell
# 1. Pare o servidor
Ctrl + C

# 2. Inicie novamente
npm run dev
```

**Aguarde** até ver a mensagem tipo:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

### PASSO 4: Testar novamente

1. Abra o navegador em: **http://localhost:5173**
2. Pressione **Ctrl+Shift+R** (limpar cache e recarregar)
3. Abra o Console (F12)
4. Tente fazer login novamente

**O erro deve desaparecer!** ✅

---

## 🆘 AINDA NÃO FUNCIONA?

### Verificação 1: Confirmar que o .env.local está correto

No terminal do PowerShell:

```powershell
cd "C:\Users\jonat\OneDrive\Documentos\Ceu-Music-ops-1"
Get-Content .env.local
```

**Deve mostrar** algo como:
```env
# Google/YouTube API Configuration
VITE_GOOGLE_CLIENT_ID=1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSyBNmwV62YsVOHvmMtCZyvGxOcyrZtMaHYA

# Supabase Configuration
VITE_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co  ← URL REAL aqui
VITE_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx  ← Chave REAL aqui
```

**SE AINDA MOSTRAR os placeholders** ("seu-projeto-id", "sua-anon-key-aqui"):
→ Você precisa substituir pelos valores reais do Supabase!

---

### Verificação 2: Testar conexão com o Supabase

No Console do navegador (F12), após reiniciar o servidor:

```javascript
// Testar se o cliente Supabase foi criado
console.log('Cliente Supabase:', window);

// Testar uma requisição simples
fetch(import.meta.env.VITE_PUBLIC_SUPABASE_URL + '/rest/v1/')
  .then(response => console.log('Status:', response.status))
  .catch(error => console.error('Erro de conexão:', error));
```

**RESULTADO ESPERADO:**
- Status: 200 ou 401 (ambos são bons, significa que conectou)

**SE DER ERRO:**
- Verifique se o URL do Supabase está correto
- Verifique sua conexão com a internet

---

### Verificação 3: Criar projeto Supabase (se não tiver)

Se você ainda não tem um projeto Supabase:

1. Acesse: **https://app.supabase.com**
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: `CEU Music Ops`
   - **Database Password**: Crie uma senha forte (anote!)
   - **Region**: `South America (São Paulo)`
4. Clique em **"Create new project"**
5. **Aguarde 2-3 minutos** enquanto o projeto é criado
6. Depois, obtenha as credenciais (Settings → API)

---

## 📝 EXEMPLO COMPLETO

### Seu arquivo .env.local deve ficar assim:

```env
# Google/YouTube API Configuration
VITE_GOOGLE_CLIENT_ID=1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSyBNmwV62YsVOHvmMtCZyvGxOcyrZtMaHYA

# Supabase Configuration (SUBSTITUIR com valores reais!)
VITE_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTEyMzQ1NiwiZXhwIjoxOTYwNjk5NDU2fQ.ABC123XYZ_sua_chave_completa_aqui
```

---

## ✅ CHECKLIST

Marque conforme você vai fazendo:

- [ ] 1. Acessei https://app.supabase.com
- [ ] 2. Selecionei/criei meu projeto Supabase
- [ ] 3. Fui em Settings → API
- [ ] 4. Copiei o Project URL
- [ ] 5. Copiei a anon public key
- [ ] 6. Editei o arquivo .env.local
- [ ] 7. Substituí o URL pelo real
- [ ] 8. Substituí a chave pela real
- [ ] 9. Salvei o arquivo (Ctrl+S)
- [ ] 10. Parei o servidor (Ctrl+C)
- [ ] 11. Reiniciei o servidor (npm run dev)
- [ ] 12. Recarreguei o navegador (Ctrl+Shift+R)
- [ ] 13. Testei o login novamente

---

## 🎯 APÓS RESOLVER

Depois de configurar corretamente:

1. ✅ O erro "Failed to fetch" vai desaparecer
2. ✅ Você verá outros erros relacionados a "usuário não encontrado" (isso é normal!)
3. ✅ Você precisará criar um usuário de teste

Para criar usuário de teste, consulte:
- `docs/CONTAS_TESTE.md`
- `scripts/create-test-user.js`

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- `CONFIGURAR_SUPABASE_URGENTE.md` - Guia completo de configuração
- `docs/CONFIGURAR_SUPABASE.md` - Documentação detalhada
- `STATUS_CONFIGURACAO.txt` - Status geral do sistema

---

**💡 DICA:** O erro "Failed to fetch" é sempre relacionado a configuração incorreta ou servidor não reiniciado. Siga o checklist acima com atenção! 🚀
