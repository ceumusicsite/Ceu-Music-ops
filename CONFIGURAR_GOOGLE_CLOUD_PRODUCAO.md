# 🚀 Configurar Google Cloud Console para Produção

## 📋 URL de Produção

**Domínio:** `https://sys.ceumusicbr.com.br`

---

## ✅ Passo a Passo Rápido

### **1. Acessar Google Cloud Console**

1. Acesse: https://console.cloud.google.com/
2. Faça login
3. Selecione o projeto: **helical-song-484514-c3**

---

### **2. Acessar Credenciais OAuth**

1. Menu lateral: **APIs e Serviços** → **Credenciais**
2. Clique no **Client ID OAuth 2.0**:
   ```
   1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8
   ```

---

### **3. Adicionar URIs de Redirecionamento**

Role até **"URIs de redirecionamento autorizados"** e adicione:

**✅ URLs para adicionar:**

```
https://sys.ceumusicbr.com.br/youtube-callback
http://localhost:3000/youtube-callback
http://localhost:5173/youtube-callback
```

⚠️ **IMPORTANTE:**
- Use **`https://`** para produção
- Use **`http://`** para desenvolvimento
- **COM** `/youtube-callback` no final
- **SEM** espaços antes ou depois

---

### **4. Adicionar Origens JavaScript**

Role até **"Origens JavaScript autorizadas"** e adicione:

**✅ Origens para adicionar:**

```
https://sys.ceumusicbr.com.br
http://localhost:3000
http://localhost:5173
```

⚠️ **IMPORTANTE:**
- **NÃO** coloque `/youtube-callback` aqui
- Apenas a origem (domínio)

---

### **5. Salvar**

1. Clique no botão azul **"SALVAR"** no topo da página
2. Aguarde **1-2 minutos** para as mudanças serem propagadas

---

## 🔧 Configurar no Vercel

### **Variáveis de Ambiente**

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings** → **Environment Variables**
4. Adicione/Atualize:

   ```
   VITE_GOOGLE_CLIENT_ID = 1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com
   
   VITE_YOUTUBE_CLIENT_SECRET = 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
   
   VITE_GOOGLE_API_KEY = AIzaSyBNmwV62YsVOHvmMtCZyvGxOcyrZtMaHYA
   
   VITE_YOUTUBE_REDIRECT_URI = https://sys.ceumusicbr.com.br/youtube-callback
   
   VITE_PUBLIC_SUPABASE_URL = https://zbeygaayzhkvbgirtzne.supabase.co
   
   VITE_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZXlnYWF5emhrdmJnaXJ0em5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MjIxMDIsImV4cCI6MjA4MTk5ODEwMn0.5vOBNBwQFMrc3r1h8c2p-TMJAoPqEWm6vFHMq_xAlY8
   ```

5. Selecione **"Production"** como ambiente
6. Faça um novo deploy

---

## 📋 Checklist

- [ ] URL `https://sys.ceumusicbr.com.br/youtube-callback` adicionada em "URIs de redirecionamento"
- [ ] URL `https://sys.ceumusicbr.com.br` adicionada em "Origens JavaScript"
- [ ] URLs de desenvolvimento também adicionadas
- [ ] Mudanças salvas no Google Cloud Console
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] `VITE_YOUTUBE_REDIRECT_URI` configurada com URL de produção
- [ ] Novo deploy feito no Vercel
- [ ] Aguardado 1-2 minutos para propagação
- [ ] Testado em produção

---

## 🎯 Resumo das URLs

### **URIs de Redirecionamento:**
```
https://sys.ceumusicbr.com.br/youtube-callback
http://localhost:3000/youtube-callback
http://localhost:5173/youtube-callback
```

### **Origens JavaScript:**
```
https://sys.ceumusicbr.com.br
http://localhost:3000
http://localhost:5173
```

---

**✅ Após seguir estes passos, o erro 400 redirect_uri_mismatch será resolvido!**
