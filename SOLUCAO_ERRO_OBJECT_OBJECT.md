# 🔧 Solução: Erro "Uncaught [object Object]" no Google API

## 🔴 Erro Encontrado

```
cb=gapi.loaded_0?le=…m_migration_mod:115 Uncaught [object Object]
```

Este erro indica que o Google API está lançando um erro não capturado durante o carregamento.

---

## ✅ Soluções Implementadas

O código foi melhorado para:

1. ✅ Capturar erros globais do `gapi`
2. ✅ Adicionar timeout para detectar quando a API não responde
3. ✅ Logs muito mais detalhados
4. ✅ Mensagens de erro mais específicas

---

## 🔍 Causas Possíveis e Soluções

### **Causa 1: Client ID ou API Key Inválidos**

**Sintomas:**
- Erro "Uncaught [object Object]"
- Console mostra erro relacionado a `invalid_client`

**Solução:**
1. Verifique o arquivo `.env.local`:
   ```env
   VITE_GOOGLE_CLIENT_ID=1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=AIzaSyBNmwV62YsVOHvmMtCZyvGxOcyrZtMaHYA
   ```

2. Certifique-se de que:
   - Não há espaços antes ou depois dos valores
   - Não há aspas ao redor dos valores
   - Os valores estão completos

3. **Reinicie o servidor:**
   ```powershell
   Ctrl+C
   npm run dev
   ```

---

### **Causa 2: URLs Não Autorizadas**

**Sintomas:**
- Erro "Uncaught [object Object]"
- Pode aparecer erro `redirect_uri_mismatch` no console

**Solução:**
1. Acesse: **https://console.cloud.google.com/**
2. Selecione o projeto: **helical-song-484514-c3**
3. Vá em: **APIs e Serviços** → **Credenciais**
4. Clique no Client ID: `1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8`
5. Adicione estas URLs:

   **Origens JavaScript autorizadas:**
   ```
   http://localhost:5173
   http://localhost:3000
   ```

   **URIs de redirecionamento autorizados:**
   ```
   http://localhost:5173
   http://localhost:3000
   ```

6. Clique em **SALVAR**
7. Aguarde 1-2 minutos
8. Tente novamente

---

### **Causa 3: Usuário Não Autorizado (App em Modo Teste)**

**Sintomas:**
- Erro "Uncaught [object Object]"
- Popup do Google não abre ou dá erro de acesso

**Solução:**
1. Acesse: **Google Cloud Console** → **APIs e Serviços** → **Tela de consentimento OAuth**
2. Vá em **"Usuários de teste"**
3. Clique em **"+ Adicionar usuários"**
4. Adicione seu email do Google
5. Clique em **SALVAR**
6. Tente fazer login novamente

---

### **Causa 4: Scripts do Google Não Carregados**

**Sintomas:**
- Erro "Uncaught [object Object]"
- Console mostra que `window.gapi` não está disponível

**Solução:**
1. Abra o arquivo `index.html`
2. Verifique se tem estas linhas no `<head>`:
   ```html
   <!-- Google API Client Library -->
   <script src="https://apis.google.com/js/api.js"></script>
   <script src="https://accounts.google.com/gsi/client"></script>
   ```
3. Se não tiver, adicione antes de `</head>`
4. Salve o arquivo
5. Limpe o cache: **Ctrl+Shift+R**
6. Tente novamente

---

### **Causa 5: API Não Ativada**

**Sintomas:**
- Erro "Uncaught [object Object]"
- Pode não aparecer nenhuma mensagem específica

**Solução:**
1. Acesse: **Google Cloud Console** → **APIs e Serviços** → **Biblioteca**
2. Busque: **YouTube Data API v3**
3. Certifique-se de que está **ATIVADA**
4. Se não estiver, clique em **ATIVAR**
5. Aguarde alguns segundos
6. Tente novamente

---

## 🔍 Diagnóstico

### **Passo 1: Verificar Console do Navegador**

1. Abra o Console: **F12**
2. Vá na aba **"Console"**
3. Tente fazer login no YouTube
4. Procure por:
   - `=== ERRO DETALHADO AO INICIALIZAR GOOGLE API ===`
   - `=== ERRO GLOBAL CAPTURADO DO gapi ===`
5. Anote o erro específico que aparecer

### **Passo 2: Executar Script de Diagnóstico**

1. Abra o Console (F12)
2. Abra o arquivo `DIAGNOSTICO_YOUTUBE.js`
3. Copie todo o código
4. Cole no Console
5. Pressione Enter
6. Veja os resultados

### **Passo 3: Verificar Variáveis de Ambiente**

No Console do navegador, execute:

```javascript
console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log('API Key:', import.meta.env.VITE_GOOGLE_API_KEY ? 'Configurada' : 'NÃO CONFIGURADA');
```

**Resultado esperado:**
- Client ID: Deve mostrar seu Client ID
- API Key: Deve mostrar "Configurada"

**Se mostrar "undefined" ou "NÃO CONFIGURADA":**
- Verifique o `.env.local`
- Reinicie o servidor

---

## 📋 Checklist Completo

Marque conforme você verifica:

- [ ] Credenciais configuradas no `.env.local`
- [ ] Sem espaços ou aspas nas credenciais
- [ ] Servidor reiniciado após configurar
- [ ] URLs autorizadas no Google Cloud Console
- [ ] Porta correta nas URLs autorizadas
- [ ] Usuário de teste adicionado (se app em modo teste)
- [ ] Scripts do Google no `index.html`
- [ ] YouTube Data API v3 ativada
- [ ] Cache do navegador limpo
- [ ] Console do navegador verificado

---

## 🆘 Ainda Não Funciona?

Se o erro persistir:

1. **Execute o diagnóstico:**
   - Console (F12) → Cole código de `DIAGNOSTICO_YOUTUBE.js`

2. **Verifique os logs detalhados:**
   - Procure por `=== ERRO DETALHADO ===` no Console
   - Anote o erro específico

3. **Teste em outro navegador:**
   - Chrome, Firefox, Edge
   - Modo anônimo/privado

4. **Verifique a conexão:**
   - Teste se consegue acessar: https://apis.google.com/js/api.js
   - Verifique se não há firewall bloqueando

---

## 📚 Documentação Relacionada

- [Solução Erro Inicializar](SOLUCAO_ERRO_INICIALIZAR_YOUTUBE.md)
- [Guia Upload YouTube](GUIA_UPLOAD_YOUTUBE.md)
- [Configuração YouTube](CONFIGURACAO_YOUTUBE_CREDENCIAIS.md)

---

**💡 Agora o código captura erros globais do `gapi` e fornece mensagens muito mais específicas. Verifique o Console para ver o erro detalhado!**
