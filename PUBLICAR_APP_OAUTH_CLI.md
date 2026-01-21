# 🚀 Publicar App OAuth via Google Cloud CLI

## 📋 Pré-requisitos

1. **Instalar Google Cloud CLI (gcloud):**
   - Windows: https://cloud.google.com/sdk/docs/install
   - Ou use: `winget install Google.CloudSDK`

2. **Fazer login:**
   ```bash
   gcloud auth login
   ```

3. **Configurar projeto:**
   ```bash
   gcloud config set project helical-song-484514-c3
   ```

---

## 🎯 COMANDO PARA PUBLICAR O APP

### **Opção 1: Via gcloud CLI (Recomendado)**

```bash
# 1. Fazer login (se ainda não fez)
gcloud auth login

# 2. Configurar projeto
gcloud config set project helical-song-484514-c3

# 3. Publicar o app OAuth
gcloud alpha iap oauth-brands update \
  --project=helical-song-484514-c3 \
  --application_title="CEU Music Ops" \
  --support_email="seu-email@exemplo.com"
```

⚠️ **Nota:** O comando acima pode variar dependendo da API. A forma mais confiável é via API REST.

---

### **Opção 2: Via API REST (Mais Confiável)**

```bash
# 1. Obter access token
gcloud auth print-access-token

# 2. Usar o token para fazer requisição à API
# (Substitua YOUR_ACCESS_TOKEN pelo token obtido acima)
curl -X PATCH \
  "https://iap.googleapis.com/v1/projects/helical-song-484514-c3/brands/YOUR_BRAND_ID?updateMask=applicationTitle,supportEmail" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationTitle": "CEU Music Ops",
    "supportEmail": "seu-email@exemplo.com"
  }'
```

---

### **Opção 3: Script PowerShell Completo**

Crie um arquivo `publicar-app-oauth.ps1`:

```powershell
# Script para publicar app OAuth no Google Cloud
# Execute: .\publicar-app-oauth.ps1

Write-Host "Publicando app OAuth..." -ForegroundColor Cyan

# Verificar se gcloud está instalado
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: gcloud CLI não está instalado!" -ForegroundColor Red
    Write-Host "Instale em: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Fazer login
Write-Host "`n1. Fazendo login no Google Cloud..." -ForegroundColor White
gcloud auth login

# Configurar projeto
Write-Host "`n2. Configurando projeto..." -ForegroundColor White
gcloud config set project helical-song-484514-c3

# Obter access token
Write-Host "`n3. Obtendo access token..." -ForegroundColor White
$token = gcloud auth print-access-token

Write-Host "`n✅ Token obtido!" -ForegroundColor Green
Write-Host "`n⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "A publicação do app OAuth deve ser feita manualmente via:" -ForegroundColor White
Write-Host "https://console.cloud.google.com/apis/credentials/consent" -ForegroundColor Cyan
Write-Host "`nClique em 'PUBLICAR APP' na interface web." -ForegroundColor White
```

---

## 🌐 SOLUÇÃO MAIS SIMPLES: Via Interface Web

Infelizmente, **não existe um comando CLI direto** para publicar o app OAuth. A forma mais confiável é via interface web:

### **Comando para Abrir Diretamente:**

```powershell
# Abrir a página de consentimento OAuth no navegador
Start-Process "https://console.cloud.google.com/apis/credentials/consent?project=helical-song-484514-c3"
```

Depois, na página que abrir:
1. Role até o topo
2. Clique em **"PUBLICAR APP"** (botão azul)
3. Confirme a publicação

---

## 🔧 Alternativa: Usar Google Cloud Console API

Se você quiser automatizar completamente, pode usar a API diretamente:

```bash
# 1. Obter access token
ACCESS_TOKEN=$(gcloud auth print-access-token)

# 2. Obter o brand ID primeiro
BRAND_ID=$(curl -s \
  "https://iap.googleapis.com/v1/projects/helical-song-484514-c3/brands" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  | jq -r '.brands[0].name' | cut -d'/' -f4)

# 3. Publicar o app (mudar de TESTING para PUBLISHED)
curl -X PATCH \
  "https://iap.googleapis.com/v1/projects/helical-song-484514-c3/brands/$BRAND_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationTitle": "CEU Music Ops",
    "supportEmail": "seu-email@exemplo.com"
  }'
```

⚠️ **Nota:** A API de OAuth consent screen pode ter limitações. A forma mais garantida é via interface web.

---

## ✅ SOLUÇÃO RECOMENDADA

A forma mais simples e confiável é usar a interface web:

### **Comando PowerShell para Abrir:**

```powershell
Start-Process "https://console.cloud.google.com/apis/credentials/consent?project=helical-song-484514-c3"
```

Depois:
1. Clique em **"PUBLICAR APP"**
2. Confirme
3. ✅ Pronto!

---

## 📝 Script Completo para Windows

Crie o arquivo `publicar-app.ps1`:

```powershell
# Script para publicar app OAuth - CEU Music Ops
Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PUBLICAR APP OAUTH - CEU Music Ops" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Abrindo Google Cloud Console..." -ForegroundColor White
Start-Process "https://console.cloud.google.com/apis/credentials/consent?project=helical-song-484514-c3"

Write-Host ""
Write-Host "INSTRUCOES:" -ForegroundColor Yellow
Write-Host "1. Na pagina que abriu, role ate o topo" -ForegroundColor White
Write-Host "2. Procure por 'Status de publicacao: Teste'" -ForegroundColor White
Write-Host "3. Clique no botao azul 'PUBLICAR APP'" -ForegroundColor White
Write-Host "4. Confirme a publicacao" -ForegroundColor White
Write-Host "5. Aguarde alguns minutos" -ForegroundColor White
Write-Host ""
Write-Host "✅ Apos publicar, qualquer pessoa podera usar o app!" -ForegroundColor Green
Write-Host ""
```

Execute:
```powershell
.\publicar-app.ps1
```

---

## 🎯 Resumo

**Comando mais simples:**
```powershell
Start-Process "https://console.cloud.google.com/apis/credentials/consent?project=helical-song-484514-c3"
```

Depois clique em **"PUBLICAR APP"** na interface.

---

**💡 A publicação via CLI é complexa. A forma mais simples é usar a interface web que o comando acima abre automaticamente!**
