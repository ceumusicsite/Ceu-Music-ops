# 🎬 Configuração das Credenciais do YouTube

## ✅ Suas Credenciais

Você forneceu as seguintes credenciais do Google Cloud Console:

- **Client ID**: `1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com`
- **Client Secret**: `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` (não será usado no frontend)
- **API Key**: `AIzaSyBNmwV62YsVOHvmMtCZyvGxOcyrZtMaHYA`
- **Project ID**: `helical-song-484514-c3`

## 🚀 Passo a Passo para Configurar

### 1. Criar o arquivo `.env.local`

Na **raiz do projeto** (pasta `Ceu-Music-ops-1`), crie um arquivo chamado `.env.local` com o seguinte conteúdo:

```env
# Google/YouTube API Configuration
# Configuração da API do YouTube para upload de vídeos

# Client ID do OAuth 2.0
VITE_GOOGLE_CLIENT_ID=1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com

# API Key do Google Cloud Console
VITE_GOOGLE_API_KEY=AIzaSyBNmwV62YsVOHvmMtCZyvGxOcyrZtMaHYA
```

### 2. Como criar o arquivo `.env.local` no Windows

**Opção A - Usando o PowerShell:**
```powershell
# Navegue até a pasta do projeto
cd "C:\Users\jonat\OneDrive\Documentos\Ceu-Music-ops-1"

# Crie o arquivo
@"
# Google/YouTube API Configuration
VITE_GOOGLE_CLIENT_ID=1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSyBNmwV62YsVOHvmMtCZyvGxOcyrZtMaHYA
"@ | Out-File -FilePath ".env.local" -Encoding utf8
```

**Opção B - Usando o Notepad:**
1. Abra o Bloco de Notas
2. Cole o conteúdo acima
3. Salve como `.env.local` (com as aspas) na pasta do projeto
4. **IMPORTANTE**: Em "Tipo", selecione "Todos os arquivos"

**Opção C - Usando o VS Code/Cursor:**
1. No explorador de arquivos, clique com o botão direito na raiz do projeto
2. Selecione "Novo Arquivo"
3. Digite `.env.local`
4. Cole o conteúdo acima

### 3. Verificar se o arquivo foi criado

Execute no PowerShell:
```powershell
cd "C:\Users\jonat\OneDrive\Documentos\Ceu-Music-ops-1"
Get-Content .env.local
```

Deve mostrar as variáveis de ambiente.

### 4. Configurar URLs autorizadas no Google Cloud Console

⚠️ **IMPORTANTE**: Você precisa configurar as URLs autorizadas no Google Cloud Console:

1. Acesse: https://console.cloud.google.com/
2. Selecione o projeto: **helical-song-484514-c3**
3. Vá em **APIs e Serviços** > **Credenciais**
4. Clique no Client ID: `1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8`
5. Em **Origens JavaScript autorizadas**, adicione:
   ```
   http://localhost:5173
   http://localhost:3000
   ```
6. Em **URIs de redirecionamento autorizados**, adicione:
   ```
   http://localhost:5173
   http://localhost:3000
   ```
7. Clique em **Salvar**

### 5. Reiniciar o servidor de desenvolvimento

Após criar o `.env.local`, você DEVE reiniciar o servidor:

```powershell
# Pare o servidor (Ctrl+C se estiver rodando)
# Depois execute:
npm run dev
```

## ✅ Como testar

1. Acesse o sistema: http://localhost:5173 (ou a porta que estiver rodando)
2. Vá em um projeto
3. Clique em uma faixa/track
4. Na seção de adicionar mídia, selecione **"Upload para YouTube"**
5. Clique em **"Fazer login no YouTube"**
6. Deve abrir um popup do Google para autenticação
7. Após login, você poderá fazer upload de vídeos!

## 🔍 Verificar se está funcionando

### No Console do Navegador (F12):

1. Abra as ferramentas do desenvolvedor (F12)
2. Vá na aba "Console"
3. Verifique se NÃO aparecem erros como:
   - "Google API não carregada"
   - "Client ID não configurado"
   - "API Key não configurada"

### Verificar variáveis carregadas:

No console do navegador, digite:
```javascript
import.meta.env.VITE_GOOGLE_CLIENT_ID
import.meta.env.VITE_GOOGLE_API_KEY
```

Deve mostrar suas credenciais.

## ⚠️ Segurança

- ✅ O arquivo `.env.local` está no `.gitignore` - suas credenciais NÃO serão enviadas ao Git
- ✅ O Client Secret NÃO é usado no frontend (apenas Client ID e API Key)
- ✅ As credenciais são carregadas de forma segura através do Vite

## 🆘 Problemas Comuns

### Erro: "redirect_uri_mismatch"
**Solução**: Configure as URLs autorizadas no Google Cloud Console (passo 4)

### Erro: "Access blocked: Authorization Error"
**Solução**: 
1. Vá em Google Cloud Console > **APIs e Serviços** > **Tela de consentimento OAuth**
2. Adicione seu email em **"Usuários de teste"**
3. Ou publique o app (mudar de "Teste" para "Produção")

### Erro: "Google API não carregada"
**Solução**: 
1. Verifique se o arquivo `.env.local` foi criado corretamente
2. Reinicie o servidor (npm run dev)
3. Limpe o cache do navegador (Ctrl+Shift+Delete)

### Erro: "API Key inválida"
**Solução**: 
1. Verifique se a API Key está correta
2. No Google Cloud Console, vá em **Credenciais**
3. Clique na API Key
4. Certifique-se de que **YouTube Data API v3** está habilitada para a chave

## 📋 Checklist Final

- [ ] Arquivo `.env.local` criado na raiz do projeto
- [ ] Variáveis `VITE_GOOGLE_CLIENT_ID` e `VITE_GOOGLE_API_KEY` configuradas
- [ ] URLs autorizadas configuradas no Google Cloud Console
- [ ] YouTube Data API v3 ativada no projeto
- [ ] Servidor reiniciado após configurar variáveis
- [ ] Testado login no YouTube
- [ ] Upload de vídeo testado

## 📚 Documentação Adicional

- [Guia Rápido](docs/GUIA_RAPIDO_YOUTUBE.md)
- [Documentação Completa](docs/CONFIGURAR_YOUTUBE.md)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)

---

**Pronto!** Agora você pode fazer upload de vídeos direto do sistema para o YouTube! 🎉
