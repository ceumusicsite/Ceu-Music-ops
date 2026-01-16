# ⚡ SOLUÇÃO RÁPIDA - URL Não Autorizada

## 🔴 Erro Atual

```
Erro ao inicializar: Falha ao inicializar iframe de identidade.
CAUSA: URL não autorizada.
```

## ✅ SOLUÇÃO EM 4 PASSOS (2 minutos)

---

### **PASSO 1: Abrir Google Cloud Console**

🔗 **Acesse:** https://console.cloud.google.com/

1. Faça login com sua conta Google
2. Selecione o projeto: **helical-song-484514-c3**
   - Se não aparecer, clique no seletor de projetos no topo

---

### **PASSO 2: Acessar Credenciais**

1. No menu lateral esquerdo, clique em:
   ```
   APIs e Serviços → Credenciais
   ```

2. Você verá uma lista de credenciais
3. Procure e **clique** no Client ID que começa com:
   ```
   1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8
   ```
   - Está na coluna "Nome" ou "ID do cliente"

---

### **PASSO 3: Adicionar URLs**

Na página que abriu, você verá duas seções:

#### **A) Origens JavaScript autorizadas**

1. Clique em **"+ Adicionar URI"** ou no campo de texto
2. Digite (ou cole):
   ```
   http://localhost:5173
   ```
3. Pressione Enter ou clique fora
4. Clique em **"+ Adicionar URI"** novamente
5. Digite:
   ```
   http://localhost:3000
   ```

⚠️ **IMPORTANTE:**
- Use **`http://`** (não `https://`)
- **SEM** barra no final (`/`)
- **SEM** espaços antes ou depois

#### **B) URIs de redirecionamento autorizados**

1. Role a página para baixo até essa seção
2. Clique em **"+ Adicionar URI"**
3. Digite:
   ```
   http://localhost:5173
   ```
4. Clique em **"+ Adicionar URI"** novamente
5. Digite:
   ```
   http://localhost:3000
   ```

---

### **PASSO 4: Salvar e Aguardar**

1. **Role até o topo** da página
2. Clique no botão azul **"SALVAR"**
3. ⏰ **AGUARDE 1-2 MINUTOS**
   - As mudanças precisam ser propagadas nos servidores do Google
   - **NÃO** tente fazer login imediatamente!

---

### **PASSO 5: Testar**

1. **Limpe o cache do navegador:**
   - Pressione `Ctrl+Shift+R` (Windows/Linux)
   - Ou `Cmd+Shift+R` (Mac)

2. **Ou limpe completamente:**
   - `Ctrl+Shift+Delete` → Selecione "Imagens e arquivos em cache" → Limpar

3. **Tente fazer login no YouTube novamente**

4. ✅ **Deve funcionar agora!**

---

## 📸 Como Deve Ficar

### **Antes (Errado):**
```
Origens JavaScript autorizadas
[ Campo vazio ou sem as URLs ]
```

### **Depois (Correto):**
```
Origens JavaScript autorizadas
┌─────────────────────────────┐
│ http://localhost:5173       │
│ http://localhost:3000       │
└─────────────────────────────┘
```

---

## ❌ Erros Comuns

### **❌ ERRADO:**
```
https://localhost:5173    ← Não use https
http://localhost:5173/    ← Não coloque barra no final
 http://localhost:5173    ← Não coloque espaços
```

### **✅ CORRETO:**
```
http://localhost:5173     ← Sempre assim!
http://localhost:3000     ← Sempre assim!
```

---

## 🔍 Verificar se Funcionou

### **Método 1: Visual no Google Cloud Console**

1. Volte para: Credenciais → Seu Client ID
2. Verifique se as URLs aparecem nas duas seções:
   - ✅ Origens JavaScript autorizadas
   - ✅ URIs de redirecionamento

### **Método 2: Testar no Sistema**

1. Limpe o cache: `Ctrl+Shift+R`
2. Tente fazer login no YouTube
3. Se o erro desaparecer e abrir um popup do Google = ✅ Funcionou!

---

## 🆘 Ainda Não Funciona?

### **Verifique:**

1. ✅ Você **aguardou 1-2 minutos** após salvar?
   - ⚠️ Isso é **obrigatório**! As mudanças levam tempo para propagar

2. ✅ Você **limpou o cache** do navegador?
   - `Ctrl+Shift+R` ou `Ctrl+Shift+Delete`

3. ✅ Você usou `http://` (não `https://`)?

4. ✅ Você **não** colocou barra (`/`) no final?

5. ✅ Você adicionou as URLs nas **DUAS** seções?
   - Origens JavaScript autorizadas
   - URIs de redirecionamento

6. ✅ Você reiniciou o servidor?
   - `Ctrl+C` e depois `npm run dev`

---

## 🎯 Checklist Rápido

- [ ] Acessei Google Cloud Console
- [ ] Selecionei projeto: helical-song-484514-c3
- [ ] Fui em: APIs e Serviços → Credenciais
- [ ] Cliquei no Client ID correto
- [ ] Adicionei `http://localhost:5173` em "Origens JavaScript"
- [ ] Adicionei `http://localhost:3000` em "Origens JavaScript"
- [ ] Adicionei `http://localhost:5173` em "URIs de redirecionamento"
- [ ] Adicionei `http://localhost:3000` em "URIs de redirecionamento"
- [ ] Cliquei em SALVAR
- [ ] Aguardei 1-2 minutos
- [ ] Limpei cache do navegador (Ctrl+Shift+R)
- [ ] Testei fazer login novamente

---

## 📞 Precisa de Ajuda Visual?

Se ainda estiver com dificuldade:

1. **Tire uma captura de tela** da página de credenciais
2. **Verifique se aparece:**
   - `http://localhost:5173`
   - `http://localhost:3000`
   - Nas duas seções mencionadas

---

## ✅ Após Resolver

Quando configurar corretamente:

1. ✅ O erro desaparece
2. ✅ Um popup do Google abre ao clicar em "Fazer login"
3. ✅ Você pode autorizar o acesso
4. ✅ Seu nome aparece na interface
5. ✅ Você pode fazer upload de vídeos!

---

**🚀 Siga os passos acima com atenção, especialmente aguardar 1-2 minutos após salvar. Isso é crucial para funcionar!**
