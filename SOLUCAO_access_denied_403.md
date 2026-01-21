# 🔧 Solução: "Erro 403: access_denied" - App em Modo Teste

## 🔴 Erro Encontrado

```
Acesso bloqueado: a app ceu-music-ops não concluiu o processo de validação da Google
Erro 403: access_denied
```

## ✅ CAUSA IDENTIFICADA!

O app OAuth está em **modo "Teste"** no Google Cloud Console e precisa ter **usuários de teste aprovados** para funcionar.

---

## 🚀 SOLUÇÃO RÁPIDA (2 minutos)

### **OPÇÃO 1: Adicionar Usuários de Teste (Recomendado para Desenvolvimento)**

Esta é a solução mais rápida para desenvolvimento/teste.

#### **Passo 1: Acessar Google Cloud Console**

1. Acesse: **https://console.cloud.google.com/**
2. Faça login com sua conta Google
3. Selecione o projeto: **helical-song-484514-c3**

#### **Passo 2: Acessar Tela de Consentimento OAuth**

1. No menu lateral, clique em:
   ```
   APIs e Serviços → Tela de consentimento OAuth
   ```

#### **Passo 3: Adicionar Usuários de Teste**

1. Role a página até a seção **"Usuários de teste"**
2. Clique em **"+ Adicionar usuários"**
3. Adicione os emails que precisam acessar:
   - `ceumusicsite@gmail.com` (conta que está tentando fazer login)
   - Qualquer outro email que precise usar o sistema
4. Clique em **"Adicionar"**
5. Clique em **"SALVAR"** no topo da página

#### **Passo 4: Aguardar e Testar**

1. ⏰ **Aguarde 1-2 minutos** para as mudanças propagarem
2. **Limpe o cache do navegador:** `Ctrl+Shift+R`
3. Tente fazer login novamente
4. ✅ **Deve funcionar agora!**

---

### **OPÇÃO 2: Publicar o App (Para Produção)**

Se você quiser que qualquer pessoa possa usar o app sem ser adicionada como testador:

#### **Passo 1: Acessar Tela de Consentimento OAuth**

1. Acesse: **Google Cloud Console** → **APIs e Serviços** → **Tela de consentimento OAuth**

#### **Passo 2: Verificar Informações do App**

Certifique-se de que todas as informações estão preenchidas:
- ✅ Nome do app: **CEU Music Ops**
- ✅ Email de suporte do usuário
- ✅ Logotipo (opcional)
- ✅ Domínios autorizados
- ✅ Escopos OAuth

#### **Passo 3: Publicar o App**

1. Role até o topo da página
2. Você verá: **"Status de publicação: Teste"**
3. Clique em **"PUBLICAR APP"** (botão azul)
4. Confirme a publicação
5. ⏰ **Aguarde alguns minutos** para a publicação ser processada

⚠️ **IMPORTANTE:** 
- Publicar o app permite que qualquer pessoa use
- Para desenvolvimento, é melhor usar a Opção 1 (adicionar testadores)

---

## 📋 Checklist - Adicionar Usuários de Teste

- [ ] Acessei Google Cloud Console
- [ ] Selecionei projeto: helical-song-484514-c3
- [ ] Fui em: APIs e Serviços → Tela de consentimento OAuth
- [ ] Rolei até "Usuários de teste"
- [ ] Cliquei em "+ Adicionar usuários"
- [ ] Adicionei: ceumusicsite@gmail.com
- [ ] Adicionei outros emails necessários
- [ ] Cliquei em "Adicionar"
- [ ] Cliquei em "SALVAR"
- [ ] Aguardei 1-2 minutos
- [ ] Limpei cache do navegador (Ctrl+Shift+R)
- [ ] Testei fazer login novamente

---

## 🔍 Verificar se Funcionou

### **No Google Cloud Console:**

1. Vá em: **Tela de consentimento OAuth** → **Usuários de teste**
2. Verifique se o email `ceumusicsite@gmail.com` aparece na lista
3. Se aparecer, está configurado corretamente

### **No Sistema:**

1. Tente fazer login no YouTube novamente
2. O erro "access_denied" deve desaparecer
3. O popup do Google deve permitir autorizar o acesso

---

## ⚠️ Diferença Entre Modo Teste e Produção

| Modo | Quem Pode Usar | Quando Usar |
|------|----------------|-------------|
| **Teste** | Apenas usuários adicionados em "Usuários de teste" | Desenvolvimento, testes |
| **Produção** | Qualquer pessoa | App finalizado e publicado |

**Para desenvolvimento:** Use modo **Teste** e adicione usuários de teste.

---

## 🆘 Ainda Não Funciona?

### **Verifique:**

1. ✅ Você **aguardou 1-2 minutos** após adicionar o usuário?
2. ✅ Você **salvou** as alterações no Google Cloud Console?
3. ✅ O email adicionado é **exatamente** o mesmo que está tentando fazer login?
4. ✅ Você **limpou o cache** do navegador (`Ctrl+Shift+R`)?
5. ✅ Você está usando a **conta correta** do Google?

---

## 📚 Por Que Isso Acontece?

O Google exige que apps OAuth em modo "Teste" tenham usuários de teste aprovados por segurança. Isso evita que apps não verificados sejam usados por qualquer pessoa.

**Solução:** Adicionar os emails necessários em "Usuários de teste" ou publicar o app.

---

## ✅ Após Resolver

Quando configurar corretamente:

1. ✅ O erro "access_denied" desaparece
2. ✅ O Google permite autorizar o acesso
3. ✅ Os tokens são salvos no Supabase
4. ✅ O upload funciona normalmente

---

## 🎯 Resumo Rápido

```
1. Google Cloud Console → Tela de consentimento OAuth
2. "Usuários de teste" → "+ Adicionar usuários"
3. Adicionar: ceumusicsite@gmail.com
4. SALVAR
5. Aguardar 1-2 minutos
6. Limpar cache (Ctrl+Shift+R)
7. Testar novamente
```

---

**🚀 Adicione o email em "Usuários de teste" e o erro será resolvido!**
