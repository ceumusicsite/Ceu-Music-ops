# 🔧 Solução: "Erro 400: redirect_uri_mismatch"

## 🔴 Erro Encontrado

```
Acesso bloqueado: a solicitação desta app é inválida
Erro 400: redirect_uri_mismatch
```

## ✅ CAUSA IDENTIFICADA!

A **URL de redirecionamento** que o sistema está usando **não está autorizada** no Google Cloud Console.

O sistema usa: `http://localhost:5173/youtube-callback` ou `http://localhost:3000/youtube-callback`

Essa URL precisa estar configurada no Google Cloud Console!

---

## 🚀 SOLUÇÃO DEFINITIVA (3 minutos)

### **PASSO 1: Acessar Google Cloud Console**

1. Acesse: **https://console.cloud.google.com/**
2. Faça login com sua conta Google
3. Selecione o projeto: **helical-song-484514-c3**

---

### **PASSO 2: Acessar Credenciais**

1. No menu lateral, clique em:
   ```
   APIs e Serviços → Credenciais
   ```

2. Clique no seu **Client ID OAuth 2.0**:
   ```
   1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8
   ```

---

### **PASSO 3: Adicionar URIs de Redirecionamento**

1. Role a página até a seção **"URIs de redirecionamento autorizados"**

2. Clique em **"+ Adicionar URI"** (ou no campo de texto)

3. Adicione estas URLs (uma de cada vez):

   **URL 1:**
   ```
   http://localhost:5173/youtube-callback
   ```

   **URL 2:**
   ```
   http://localhost:3000/youtube-callback
   ```

   ⚠️ **IMPORTANTE:**
   - Use **`http://`** (não `https://`)
   - **COM** a barra e `/youtube-callback` no final
   - **SEM** espaços antes ou depois

4. Se você estiver usando outra porta (ex: 5174), adicione também:
   ```
   http://localhost:5174/youtube-callback
   ```

---

### **PASSO 4: Verificar Origens JavaScript**

Também verifique se estas URLs estão em **"Origens JavaScript autorizadas"**:

```
http://localhost:5173
http://localhost:3000
```

⚠️ **Nota:** Aqui **NÃO** coloque `/youtube-callback`, apenas a origem!

---

### **PASSO 5: Salvar e Aguardar**

1. Clique no botão azul **"SALVAR"** no topo da página
2. ⏰ **AGUARDE 1-2 MINUTOS**
   - As mudanças precisam ser propagadas nos servidores do Google
   - **NÃO** tente fazer login imediatamente!

---

### **PASSO 6: Testar**

1. **Limpe o cache do navegador:**
   - Pressione `Ctrl+Shift+R` (recarregar forçado)

2. **Tente fazer login no YouTube novamente**

3. ✅ **Deve funcionar agora!**

---

## 📋 Como Deve Ficar

Sua configuração no Google Cloud Console deve ter:

### **Origens JavaScript autorizadas:**
```
http://localhost:5173
http://localhost:3000
```

### **URIs de redirecionamento autorizados:**
```
http://localhost:5173/youtube-callback
http://localhost:3000/youtube-callback
```

---

## ⚠️ Diferença Importante

| Seção | Formato | Exemplo |
|-------|---------|---------|
| **Origens JavaScript** | Sem caminho | `http://localhost:5173` |
| **URIs de Redirecionamento** | Com caminho | `http://localhost:5173/youtube-callback` |

---

## 🔍 Verificar Qual Porta Você Está Usando

No terminal onde o servidor está rodando, você verá algo como:

```
Local:   http://localhost:5173/
```

ou

```
Local:   http://localhost:3000/
```

**Use essa porta** nas URLs de redirecionamento!

---

## ❌ Erros Comuns

### **❌ ERRADO:**
```
https://localhost:5173/youtube-callback    ← Não use https
http://localhost:5173/youtube-callback/     ← Não coloque barra extra
http://localhost:5173                       ← Falta /youtube-callback
```

### **✅ CORRETO:**
```
http://localhost:5173/youtube-callback     ← Sempre assim!
http://localhost:3000/youtube-callback     ← Sempre assim!
```

---

## 🆘 Ainda Não Funciona?

### **Verifique:**

1. ✅ Você **aguardou 1-2 minutos** após salvar?
   - ⚠️ Isso é **obrigatório**!

2. ✅ Você adicionou `/youtube-callback` no final?
   - A URL completa deve ser: `http://localhost:5173/youtube-callback`

3. ✅ Você usou `http://` (não `https://`)?

4. ✅ Você limpou o cache do navegador?
   - `Ctrl+Shift+R`

5. ✅ Você adicionou a porta correta?
   - Verifique qual porta seu servidor está usando

---

## 🔍 Verificar no Console

No Console do navegador (F12), execute:

```javascript
console.log('Origin:', window.location.origin);
console.log('Redirect URI esperado:', window.location.origin + '/youtube-callback');
```

Isso mostrará qual URL você precisa adicionar no Google Cloud Console.

---

## ✅ Após Resolver

Quando configurar corretamente:

1. ✅ O erro "redirect_uri_mismatch" desaparece
2. ✅ O Google redireciona para `/youtube-callback` após autorizar
3. ✅ O sistema recebe o código de autorização
4. ✅ O token de acesso é obtido
5. ✅ Você pode fazer upload de vídeos!

---

## 📚 Documentação Relacionada

- [Solução Rápida URL Não Autorizada](SOLUCAO_RAPIDA_URL_NAO_AUTORIZADA.md)
- [Solução Missing Client ID](SOLUCAO_MISSING_CLIENT_ID.md)
- [Configuração YouTube](CONFIGURACAO_YOUTUBE_CREDENCIAIS.md)

---

**🎯 Este erro tem solução garantida! Basta adicionar as URLs de redirecionamento corretas (com `/youtube-callback`) no Google Cloud Console e aguardar 1-2 minutos!**
