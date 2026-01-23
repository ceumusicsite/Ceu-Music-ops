# 🔧 Solução: Erro 400 do Google Accounts

## 🔴 Erro Encontrado

```
GET https://accounts.google.com/info/unknownerror?... 400 (Bad Request)
```

Este erro geralmente indica um problema com a configuração OAuth no Google Cloud Console.

---

## ✅ CAUSAS POSSÍVEIS

1. **Redirect URI não autorizado** (mais comum)
2. **Origem JavaScript não autorizada**
3. **Client ID inválido ou não configurado**
4. **App OAuth em modo de teste sem usuários de teste**

---

## 🚀 SOLUÇÃO PASSO A PASSO

### **PASSO 1: Verificar Configuração no Google Cloud Console**

1. **Acesse Google Cloud Console:**
   - URL: https://console.cloud.google.com/
   - Projeto: **helical-song-484514-c3**

2. **Vá em Credenciais:**
   - Menu: **APIs e Serviços** → **Credenciais**
   - Clique no Client ID: `1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8`

---

### **PASSO 2: Verificar URIs de Redirecionamento**

Na seção **"URIs de redirecionamento autorizados"**, certifique-se de ter:

**✅ URLs que DEVEM estar configuradas:**

```
https://sys.ceumusicbr.com.br/youtube-callback
http://localhost:3000/youtube-callback
http://localhost:5173/youtube-callback
```

⚠️ **IMPORTANTE:**
- Use **`https://`** para produção
- Use **`http://`** para desenvolvimento
- **COM** `/youtube-callback` no final
- **SEM** espaços ou barras extras

---

### **PASSO 3: Verificar Origens JavaScript**

Na seção **"Origens JavaScript autorizadas"**, certifique-se de ter:

**✅ Origens que DEVEM estar configuradas:**

```
https://sys.ceumusicbr.com.br
http://localhost:3000
http://localhost:5173
```

⚠️ **IMPORTANTE:**
- **NÃO** coloque `/youtube-callback` aqui
- Apenas a origem (domínio)

---

### **PASSO 4: Verificar Status do App OAuth**

1. Vá em: **APIs e Serviços** → **Tela de consentimento OAuth**

2. Verifique o **Status de publicação:**
   - Se estiver em **"Teste"**, adicione usuários de teste:
     - Email: `ceumusicsite@gmail.com`
     - Ou publique o app (recomendado para produção)

3. Se estiver em **"Em produção"**, está correto

---

### **PASSO 5: Verificar Variáveis de Ambiente**

**No Vercel (Produção):**

Certifique-se de que estas variáveis estão configuradas:

```
VITE_GOOGLE_CLIENT_ID=1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com
VITE_YOUTUBE_CLIENT_SECRET=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
VITE_YOUTUBE_REDIRECT_URI=https://sys.ceumusicbr.com.br/youtube-callback
```

**No .env.local (Desenvolvimento):**

```
VITE_GOOGLE_CLIENT_ID=1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com
VITE_YOUTUBE_CLIENT_SECRET=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
VITE_YOUTUBE_REDIRECT_URI=http://localhost:3000/youtube-callback
```

---

### **PASSO 6: Limpar Cache e Testar**

1. **Limpar cache do navegador:**
   - Pressione `Ctrl+Shift+R` (recarregar forçado)
   - Ou `Ctrl+Shift+Delete` → Limpar dados de navegação

2. **Aguardar 1-2 minutos** após salvar no Google Cloud Console

3. **Testar novamente**

---

## 🔍 DIAGNÓSTICO RÁPIDO

### Verificar qual URL está sendo usada:

Abra o console do navegador (F12) e execute:

```javascript
console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log('Redirect URI:', import.meta.env.VITE_YOUTUBE_REDIRECT_URI || window.location.origin + '/youtube-callback');
```

Compare a URL mostrada com as URLs configuradas no Google Cloud Console.

---

## 📋 CHECKLIST COMPLETO

- [ ] URL `https://sys.ceumusicbr.com.br/youtube-callback` em "URIs de redirecionamento"
- [ ] URL `https://sys.ceumusicbr.com.br` em "Origens JavaScript"
- [ ] URLs de desenvolvimento também configuradas
- [ ] App OAuth publicado ou usuários de teste adicionados
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Mudanças salvas no Google Cloud Console
- [ ] Aguardado 1-2 minutos para propagação
- [ ] Cache do navegador limpo
- [ ] Testado novamente

---

## 🆘 SE AINDA NÃO FUNCIONAR

1. **Verifique a URL exata no erro:**
   - Abra o console do navegador (F12)
   - Veja a URL completa no erro
   - Compare com as URLs configuradas

2. **Verifique se o Client ID está correto:**
   - Deve ser: `1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com`

3. **Verifique se o app está publicado:**
   - Se estiver em modo "Teste", publique ou adicione usuários de teste

4. **Tente em modo anônimo/privado:**
   - Para descartar problemas de cache ou cookies

---

**✅ Após seguir estes passos, o erro deve ser resolvido!**
