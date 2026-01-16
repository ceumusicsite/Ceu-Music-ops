# 🎬 Guia Completo - Upload de Vídeos para YouTube

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Como Fazer Upload](#como-fazer-upload)
3. [Configurações Disponíveis](#configurações-disponíveis)
4. [Troubleshooting](#troubleshooting)
5. [Dicas e Boas Práticas](#dicas-e-boas-práticas)

---

## ✅ Pré-requisitos

Antes de fazer upload de vídeos, certifique-se de que:

- [x] **Credenciais do YouTube configuradas** no `.env.local`
  - `VITE_GOOGLE_CLIENT_ID` configurado
  - `VITE_GOOGLE_API_KEY` configurada
- [x] **URLs autorizadas** configuradas no Google Cloud Console
- [x] **Servidor rodando** (`npm run dev`)
- [x] **Conta Google** com acesso ao YouTube

---

## 🚀 Como Fazer Upload

### **Passo 1: Acessar um Projeto**

1. Faça login no sistema
2. Vá em **"Projetos"** no menu lateral
3. Clique em um projeto existente (ou crie um novo)

---

### **Passo 2: Adicionar Áudio/Vídeo**

1. No projeto, localize a seção de **"Faixas"** (tracks)
2. Clique na faixa onde deseja adicionar o vídeo
3. Clique no botão **"Adicionar Áudio/Vídeo"** ou **"+"** na seção de mídia

---

### **Passo 3: Selecionar Formato YouTube**

1. No modal que abrir, você verá opções:
   - **Tipo**: Selecione **"Vídeo"**
   - **Formato**: Selecione **"Upload para YouTube"**

2. A interface do YouTube Upload aparecerá

---

### **Passo 4: Fazer Login no YouTube**

Se você ainda não fez login:

1. Você verá um card com o botão **"Fazer login no YouTube"**
2. Clique no botão (cor vermelha com ícone do Google)
3. Uma janela popup do Google abrirá
4. **Autorize o acesso** ao seu canal do YouTube
5. Selecione a conta Google que deseja usar
6. Após autorizar, você verá:
   - Seu nome e email
   - Foto de perfil (se disponível)
   - Botão "Sair" para desconectar

---

### **Passo 5: Selecionar o Vídeo**

1. Clique em **"Selecionar vídeo"**
2. Escolha o arquivo de vídeo do seu computador
3. Formatos aceitos: Qualquer formato de vídeo (MP4, MOV, AVI, etc.)
4. Tamanho máximo: **128GB** (recomendado: menos de 2GB para uploads mais rápidos)

**Dica:** O nome do arquivo será usado como título padrão (você pode editar depois)

---

### **Passo 6: Preencher Informações do Vídeo**

Preencha os campos:

#### **Título** (Obrigatório) *
- Máximo: 100 caracteres
- Será preenchido automaticamente com o nome do arquivo
- Você pode editar

#### **Descrição** (Opcional)
- Máximo: 5.000 caracteres
- Use para descrever o vídeo, créditos, links, etc.

#### **Tags** (Opcional)
- Separe por vírgula
- Exemplo: `música, artista, lançamento, CEU Music`
- Ajuda na descoberta do vídeo no YouTube

#### **Privacidade** (Obrigatório)
Escolha uma opção:
- **Privado**: Apenas você pode ver
- **Não listado**: Quem tem o link pode ver
- **Público**: Qualquer um pode ver e encontrar

---

### **Passo 7: Fazer Upload**

1. Verifique se todos os campos obrigatórios estão preenchidos
2. Clique no botão **"Fazer upload no YouTube"** (botão vermelho)
3. Aguarde o upload:
   - Você verá uma animação de carregamento
   - O botão mostrará: **"Enviando para YouTube..."**
   - **Não feche a página** durante o upload!

---

### **Passo 8: Upload Concluído**

Após o upload:

1. O vídeo será salvo automaticamente no projeto
2. A URL do YouTube será adicionada à faixa
3. Você verá uma mensagem de sucesso
4. O formulário será limpo automaticamente

**Próximos passos:**
- O vídeo pode levar alguns minutos para processar no YouTube
- Você pode acessar o vídeo pelo link salvo no projeto
- Edite o vídeo diretamente no YouTube se necessário

---

## ⚙️ Configurações Disponíveis

### **Configurações Automáticas**

O sistema configura automaticamente:

- **Categoria**: Música (ID: 10)
- **Idioma padrão**: Português (pt)
- **Idioma de áudio**: Português (pt)
- **Não feito para crianças**: Sempre marcado

### **Configurações Personalizáveis**

Você pode configurar:

- ✅ Título do vídeo
- ✅ Descrição completa
- ✅ Tags personalizadas
- ✅ Nível de privacidade
- ✅ Conta Google/YouTube (escolha ao fazer login)

---

## 🔧 Troubleshooting

### **Erro: "Google API não carregada"**

**Causa:** Scripts do Google não foram carregados

**Solução:**
1. Verifique se o `index.html` tem os scripts:
   ```html
   <script src="https://apis.google.com/js/api.js"></script>
   <script src="https://accounts.google.com/gsi/client"></script>
   ```
2. Limpe o cache do navegador (Ctrl+Shift+R)
3. Reinicie o servidor

---

### **Erro: "redirect_uri_mismatch"**

**Causa:** URL não autorizada no Google Cloud Console

**Solução:**
1. Acesse: https://console.cloud.google.com/
2. Vá em: **APIs e Serviços** → **Credenciais**
3. Clique no seu Client ID
4. Adicione em **"URIs de redirecionamento"**:
   - `http://localhost:5173`
   - `http://localhost:3000`
5. Salve e tente novamente

---

### **Erro: "Access blocked: Authorization Error"**

**Causa:** App em modo teste e email não autorizado

**Solução:**
1. Acesse: Google Cloud Console → **APIs e Serviços** → **Tela de consentimento OAuth**
2. Vá em **"Usuários de teste"**
3. Adicione seu email do Google
4. Salve e tente fazer login novamente

---

### **Erro: "Arquivo muito grande"**

**Causa:** Vídeo maior que 128GB

**Solução:**
- Comprima o vídeo antes de fazer upload
- Use formatos mais eficientes (MP4 com H.264)
- Considere dividir vídeos muito longos

---

### **Upload muito lento**

**Causas possíveis:**
- Arquivo muito grande
- Conexão de internet lenta
- Vídeo não otimizado

**Soluções:**
- Comprima o vídeo antes (recomendado: menos de 2GB)
- Use conexão estável (WiFi ou cabo)
- Aguarde pacientemente (uploads grandes podem levar horas)

---

### **Vídeo não aparece após upload**

**Causa:** Processamento no YouTube

**Solução:**
- O YouTube precisa processar o vídeo (pode levar minutos ou horas)
- Acesse o link do vídeo diretamente
- Verifique no YouTube Studio se o vídeo está lá

---

### **Não consigo fazer login**

**Verificações:**
1. ✅ Credenciais configuradas no `.env.local`?
2. ✅ Servidor reiniciado após configurar?
3. ✅ URLs autorizadas no Google Cloud Console?
4. ✅ Email adicionado em "Usuários de teste"?

---

## 💡 Dicas e Boas Práticas

### **Antes do Upload**

1. **Otimize o vídeo:**
   - Resolução: 1080p (Full HD) é suficiente para a maioria
   - Formato: MP4 com H.264
   - Tamanho: Menos de 2GB para uploads mais rápidos

2. **Prepare as informações:**
   - Título claro e descritivo
   - Descrição completa com hashtags relevantes
   - Tags relacionadas ao conteúdo

3. **Escolha a privacidade correta:**
   - **Privado**: Para revisão antes de publicar
   - **Não listado**: Para compartilhar link específico
   - **Público**: Para lançamento oficial

---

### **Durante o Upload**

1. **Não feche a página** durante o upload
2. **Mantenha a conexão estável**
3. **Aguarde pacientemente** (uploads grandes levam tempo)

---

### **Após o Upload**

1. **Verifique o vídeo no YouTube:**
   - Acesse o link salvo no projeto
   - Confirme que o vídeo foi enviado corretamente

2. **Edite se necessário:**
   - Thumbnail personalizada
   - Cards e end screens
   - Playlists

3. **Monitore o processamento:**
   - Vídeos em HD/4K levam mais tempo
   - Verifique no YouTube Studio

---

## 📊 Limites e Especificações

| Item | Limite |
|------|--------|
| Tamanho máximo | 128GB |
| Duração máxima | 12 horas |
| Resolução máxima | 4K (3840x2160) |
| Formatos aceitos | MP4, MOV, AVI, WMV, FLV, WebM |
| Título | Máximo 100 caracteres |
| Descrição | Máximo 5.000 caracteres |
| Tags | Máximo 500 caracteres |

---

## 🎯 Fluxo Visual Resumido

```
1. Projetos → Selecionar Projeto
2. Faixas → Selecionar Faixa
3. Adicionar Áudio/Vídeo
4. Tipo: Vídeo | Formato: Upload para YouTube
5. Fazer login no YouTube (se necessário)
6. Selecionar arquivo de vídeo
7. Preencher: Título, Descrição, Tags, Privacidade
8. Clicar em "Fazer upload no YouTube"
9. Aguardar upload
10. ✅ Vídeo salvo no projeto!
```

---

## 📚 Documentação Relacionada

- [Guia Rápido YouTube](docs/GUIA_RAPIDO_YOUTUBE.md)
- [Configuração YouTube](CONFIGURACAO_YOUTUBE_CREDENCIAIS.md)
- [Documentação Completa YouTube](docs/CONFIGURAR_YOUTUBE.md)

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas:

1. Consulte a seção [Troubleshooting](#troubleshooting)
2. Verifique os logs no Console do navegador (F12)
3. Confirme que todas as configurações estão corretas
4. Teste com um vídeo pequeno primeiro

---

**🎉 Pronto para fazer upload de vídeos para o YouTube diretamente pelo sistema!**
