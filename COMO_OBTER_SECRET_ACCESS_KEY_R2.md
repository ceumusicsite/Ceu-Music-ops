# 🔑 Como Obter o Secret Access Key do R2 - Passo a Passo

Este guia mostra exatamente como obter o **Secret Access Key** do Cloudflare R2.

---

## ⚠️ IMPORTANTE

O **Secret Access Key** só aparece **UMA VEZ** quando você cria o token. Se você já criou um token antes e não salvou o Secret Access Key, você precisará criar um **novo token**.

---

## 📋 Passo a Passo Completo

### Passo 1: Acessar o Cloudflare Dashboard

1. Abra seu navegador
2. Acesse: **https://dash.cloudflare.com**
3. Faça login na sua conta Cloudflare

### Passo 2: Navegar até R2

1. No menu lateral esquerdo, procure por **"R2"**
2. Clique em **"R2"** ou **"R2 Storage"**

### Passo 3: Acessar a Página de API Tokens

1. Na página do R2, procure por **"Manage R2 API Tokens"** ou **"Gerenciar Tokens de API R2"**
2. Você pode encontrar isso:
   - No topo da página, como um botão ou link
   - No menu lateral direito
   - Na seção "Settings" ou "Configurações"

3. Clique em **"Manage R2 API Tokens"**

### Passo 4: Criar um Novo Token (ou Verificar Tokens Existentes)

#### Opção A: Se você já tem um token

1. Na lista de tokens, você verá os tokens existentes
2. **⚠️ ATENÇÃO:** O Secret Access Key **NÃO** é exibido novamente após a criação
3. Se você não salvou o Secret Access Key, você precisará criar um novo token (veja Opção B)

#### Opção B: Criar um Novo Token

1. Clique em **"Create API token"** ou **"Criar token de API"**
2. Configure o token:
   - **Token name:** Dê um nome descritivo (ex: `CEU Music R2 Token`)
   - **Permissions (Permissões):**
     - Selecione **"Object Read & Write"** para o bucket que você quer usar
     - Se você tem múltiplos buckets, adicione permissões para cada um
   - **TTL:** Deixe em branco para token permanente (ou defina uma data de expiração)
3. Clique em **"Create API Token"** ou **"Criar Token"**

### Passo 5: ⚠️ COPIE O SECRET ACCESS KEY IMEDIATAMENTE

Após criar o token, você verá uma tela com **3 informações importantes**:

1. **Account ID** - Um código alfanumérico longo
2. **Access Key ID** - Um código alfanumérico
3. **Secret Access Key** - ⚠️ **ESTE É O MAIS IMPORTANTE!**

**O que fazer:**

1. **Copie o Secret Access Key IMEDIATAMENTE**
   - Clique no botão de copiar ao lado do Secret Access Key
   - Ou selecione todo o texto e copie (Ctrl+C)

2. **Cole em um local seguro** (bloco de notas, gerenciador de senhas, etc.)

3. **⚠️ IMPORTANTE:** 
   - Você **NÃO** poderá ver este valor novamente depois de fechar esta página
   - Se você perder, precisará criar um novo token
   - Guarde em local seguro e não compartilhe

### Passo 6: Copiar as Outras Credenciais

Enquanto está na tela, também copie:

- **Account ID** - Você precisará dele também
- **Access Key ID** - Você precisará dele também

---

## 📸 Onde Encontrar (Visual)

```
Cloudflare Dashboard
  └─ Menu Lateral: "R2"
      └─ "Manage R2 API Tokens" (botão/link)
          └─ "Create API token" (se não tiver token)
              └─ Configure e crie
                  └─ Tela de sucesso com 3 valores:
                      ├─ Account ID: abc123def456...
                      ├─ Access Key ID: xyz789uvw456...
                      └─ Secret Access Key: mno345pqr678... ⚠️ COPIE AGORA!
```

---

## 🔍 Se Você Já Criou um Token Antes

Se você já criou um token mas não salvou o Secret Access Key:

### Opção 1: Criar um Novo Token (Recomendado)

1. Siga os passos acima para criar um novo token
2. Desta vez, **copie e salve** o Secret Access Key
3. Você pode manter o token antigo ou revogá-lo depois

### Opção 2: Verificar se Está Salvo em Algum Lugar

Procure em:
- Arquivos de configuração antigos
- Documentos de notas
- Gerenciador de senhas
- Outros arquivos `.env` ou de configuração

---

## ✅ Depois de Obter o Secret Access Key

1. **Adicione no `.env.local`:**
   ```env
   VITE_R2_ACCOUNT_ID=seu_account_id_aqui
   VITE_R2_ACCESS_KEY_ID=sua_access_key_id_aqui
   VITE_R2_SECRET_ACCESS_KEY=seu_secret_access_key_aqui
   ```

2. **Ou use o script automatizado:**
   ```powershell
   .\configurar-r2.ps1
   ```
   O script vai pedir todas as 3 credenciais.

---

## 🔒 Segurança

**⚠️ IMPORTANTE - Boas Práticas:**

1. **Nunca compartilhe o Secret Access Key**
   - Ele dá acesso completo ao seu R2
   - Mantenha-o privado e seguro

2. **Não commite no Git**
   - Nunca adicione o Secret Access Key em arquivos que vão para o repositório
   - Use sempre `.env.local` (que está no `.gitignore`)

3. **Use tokens com permissões mínimas**
   - Dê apenas as permissões necessárias
   - Isso é mais seguro

4. **Rotacione tokens regularmente**
   - Considere criar novos tokens periodicamente
   - Revogue tokens antigos que não são mais usados

---

## 🆘 Problemas Comuns

### "Não consigo ver o Secret Access Key"

**Causa:** Você já fechou a página de criação do token.

**Solução:** Crie um novo token. O Secret Access Key só aparece uma vez.

### "Onde está o botão Manage R2 API Tokens?"

**Causa:** Pode estar em local diferente dependendo da versão do dashboard.

**Solução:** 
- Procure por "API Tokens" no menu do R2
- Ou vá em "Settings" > "API Tokens"
- Ou use a busca do dashboard

### "Preciso de permissões diferentes"

**Causa:** O token atual não tem as permissões necessárias.

**Solução:** Crie um novo token com as permissões corretas.

---

## 📋 Checklist

Use este checklist para garantir que você tem tudo:

- [ ] Acessei o Cloudflare Dashboard
- [ ] Naveguei até R2
- [ ] Acessei "Manage R2 API Tokens"
- [ ] Criei um novo token (ou verifiquei tokens existentes)
- [ ] Copiei o **Account ID**
- [ ] Copiei o **Access Key ID**
- [ ] ⚠️ Copiei o **Secret Access Key** (e salvei em local seguro)
- [ ] Adicionei as credenciais no `.env.local` ou usei o script

---

## 🔗 Links Úteis

- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [R2 API Tokens Documentation](https://developers.cloudflare.com/r2/api/s3/tokens/)
- [R2 Dashboard](https://dash.cloudflare.com/?to=/:account/r2)

---

**🎉 Pronto! Agora você sabe como obter o Secret Access Key do R2!**

**Lembre-se:** Copie e salve o Secret Access Key imediatamente, pois você não poderá vê-lo novamente!
