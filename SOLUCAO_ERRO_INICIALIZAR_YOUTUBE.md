# 🔧 Solução: "Erro ao inicializar: Erro desconhecido"

## 🔴 Erro Encontrado

Quando você clica em **"Fazer login no YouTube"**, aparece:
```
Erro: Erro ao inicializar: Erro desconhecido
```

---

## ✅ Soluções (Teste uma de cada vez)

### **Solução 1: Verificar Credenciais no .env.local**

1. Abra o arquivo `.env.local` na raiz do projeto
2. Verifique se está assim:

```env
VITE_GOOGLE_CLIENT_ID=1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSyBNmwV62YsVOHvmMtCZyvGxOcyrZtMaHYA
```

3. **Certifique-se de que:**
   - Não há espaços antes ou depois dos valores
   - Não há aspas ao redor dos valores
   - Os valores estão completos

4. **Reinicie o servidor:**
   ```powershell
   # Ctrl+C para parar
   npm run dev
   ```

---

### **Solução 2: Verificar URLs no Google Cloud Console**

O erro pode ser causado por URLs não autorizadas.

1. Acesse: **https://console.cloud.google.com/**
2. Selecione o projeto: **helical-song-484514-c3**
3. Vá em: **APIs e Serviços** → **Credenciais**
4. Clique no Client ID: `1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8`
5. Verifique e adicione estas URLs:

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
7. Aguarde 1-2 minutos para as mudanças propagarem
8. Tente novamente no sistema

---

### **Solução 3: Adicionar Usuário de Teste**

Se o app está em modo "Teste":

1. Acesse: **Google Cloud Console** → **APIs e Serviços** → **Tela de consentimento OAuth**
2. Role até **"Usuários de teste"**
3. Clique em **"+ Adicionar usuários"**
4. Adicione seu email do Google
5. Clique em **SALVAR**
6. Tente fazer login novamente

---

### **Solução 4: Verificar Scripts no index.html**

1. Abra o arquivo `index.html`
2. Verifique se tem estas linhas no `<head>`:

```html
<!-- Google API Client Library -->
<script src="https://apis.google.com/js/api.js"></script>
<script src="https://accounts.google.com/gsi/client"></script>
```

3. Se não tiver, adicione antes do `</head>`
4. Salve o arquivo
5. Limpe o cache do navegador: **Ctrl+Shift+R**
6. Tente novamente

---

### **Solução 5: Verificar Console do Navegador**

1. Abra o Console do navegador: **F12**
2. Vá na aba **"Console"**
3. Tente fazer login novamente
4. Veja se aparece algum erro específico

**Erros comuns e soluções:**

| Erro no Console | Solução |
|----------------|---------|
| `invalid_client` | Verifique o Client ID no .env.local |
| `redirect_uri_mismatch` | Configure URLs no Google Cloud Console (Solução 2) |
| `access_denied` | Adicione usuário de teste (Solução 3) |
| `Google API não carregada` | Verifique scripts no index.html (Solução 4) |
| `Timeout` | Verifique sua conexão com internet |

---

### **Solução 6: Limpar Cache e Cookies**

1. Pressione **Ctrl+Shift+Delete**
2. Selecione:
   - ✅ Cookies e outros dados do site
   - ✅ Imagens e arquivos em cache
3. Período: **Última hora**
4. Clique em **Limpar dados**
5. Feche e abra o navegador novamente
6. Tente fazer login

---

### **Solução 7: Verificar Porta do Servidor**

O sistema pode estar rodando em uma porta diferente.

1. Verifique no terminal qual porta está sendo usada:
   ```
   Local:   http://localhost:5173/
   ```
   ou
   ```
   Local:   http://localhost:3000/
   ```

2. Certifique-se de que essa porta está nas URLs autorizadas no Google Cloud Console

3. Se estiver usando outra porta (ex: 5174), adicione também no Google Cloud Console

---

## 🔍 Diagnóstico Avançado

### **Testar no Console do Navegador**

Abra o Console (F12) e execute:

```javascript
// Verificar se as variáveis estão carregadas
console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log('API Key:', import.meta.env.VITE_GOOGLE_API_KEY ? 'Configurada' : 'NÃO CONFIGURADA');

// Verificar se gapi está carregado
console.log('gapi disponível:', typeof window.gapi !== 'undefined');
console.log('gapi.load disponível:', typeof window.gapi?.load !== 'undefined');
```

**Resultado esperado:**
- Client ID: Deve mostrar seu Client ID completo
- API Key: Deve mostrar "Configurada"
- gapi disponível: Deve ser `true`
- gapi.load disponível: Deve ser `true`

**Se algum estiver incorreto:**
- Client ID/API Key: Reinicie o servidor
- gapi: Verifique scripts no index.html

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
- [ ] Cache do navegador limpo
- [ ] Console do navegador verificado
- [ ] Conexão com internet funcionando

---

## 🆘 Ainda Não Funciona?

Se nenhuma solução funcionou:

1. **Verifique os logs completos:**
   - Abra o Console (F12)
   - Vá na aba **"Network"** (Rede)
   - Tente fazer login
   - Veja se há requisições falhando (vermelhas)

2. **Teste em outro navegador:**
   - Chrome, Firefox, Edge
   - Modo anônimo/privado

3. **Verifique se a API está ativada:**
   - Google Cloud Console → **APIs e Serviços** → **Biblioteca**
   - Busque: **YouTube Data API v3**
   - Certifique-se de que está **ATIVADA**

4. **Verifique a quota da API:**
   - Google Cloud Console → **APIs e Serviços** → **Dashboard**
   - Veja se há limites atingidos

---

## ✅ Após Resolver

Quando o erro desaparecer, você verá:

1. Um popup do Google para autorizar
2. Seleção da conta Google
3. Após autorizar, seu nome e email aparecerão
4. Você poderá selecionar e fazer upload de vídeos

---

## 📚 Documentação Relacionada

- [Guia Upload YouTube](GUIA_UPLOAD_YOUTUBE.md)
- [Configuração YouTube](CONFIGURACAO_YOUTUBE_CREDENCIAIS.md)
- [Guia Rápido YouTube](docs/GUIA_RAPIDO_YOUTUBE.md)

---

**💡 Dica:** O código foi atualizado para mostrar mensagens de erro mais específicas. Se o erro persistir, verifique o Console do navegador (F12) para ver a mensagem exata!
