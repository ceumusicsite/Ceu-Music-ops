# Script para configurar Cloudflare R2 no .env.local
# Execute: .\configurar-r2.ps1

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR CLOUDFLARE R2" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.local"

# Verificar se .env.local existe
if (-not (Test-Path $envFile)) {
    Write-Host "Arquivo .env.local nao encontrado!" -ForegroundColor Yellow
    Write-Host "Criando arquivo .env.local a partir do .env.example..." -ForegroundColor White
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" $envFile
        Write-Host "Arquivo .env.local criado!" -ForegroundColor Green
    } else {
        Write-Host "Arquivo .env.example nao encontrado!" -ForegroundColor Red
        Write-Host "Por favor, crie o arquivo .env.local manualmente." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Por favor, forneca as credenciais do Cloudflare R2:" -ForegroundColor Cyan
Write-Host ""

# Solicitar Account ID
$accountId = Read-Host "Account ID do Cloudflare"
if ([string]::IsNullOrWhiteSpace($accountId)) {
    Write-Host "Account ID nao pode estar vazio!" -ForegroundColor Red
    exit 1
}

# Solicitar Access Key ID
$accessKeyId = Read-Host "Access Key ID"
if ([string]::IsNullOrWhiteSpace($accessKeyId)) {
    Write-Host "Access Key ID nao pode estar vazio!" -ForegroundColor Red
    exit 1
}

# Solicitar Secret Access Key
$secretAccessKey = Read-Host "Secret Access Key"
if ([string]::IsNullOrWhiteSpace($secretAccessKey)) {
    Write-Host "Secret Access Key nao pode estar vazio!" -ForegroundColor Red
    exit 1
}

# Gerar endpoint e public URL
$endpoint = "https://${accountId}.r2.cloudflarestorage.com"
$publicUrl = "https://pub-${accountId}.r2.dev"

# Ler conteúdo atual
$content = Get-Content $envFile -Raw

# Variáveis a configurar
$variables = @{
    "VITE_R2_ACCOUNT_ID" = $accountId
    "VITE_R2_ACCESS_KEY_ID" = $accessKeyId
    "VITE_R2_SECRET_ACCESS_KEY" = $secretAccessKey
    "VITE_R2_ENDPOINT" = $endpoint
    "VITE_R2_PUBLIC_URL" = $publicUrl
    "VITE_R2_BUCKET_AUDIO" = "ceu-music-audio"
    "VITE_R2_BUCKET_DOCUMENTOS" = "ceu-music-documentos"
    "VITE_R2_BUCKET_ANEXOS" = "ceu-music-anexos"
    "VITE_R2_BUCKET_COMPROVANTES" = "ceu-music-comprovantes"
    "VITE_STORAGE_PROVIDER" = "r2"
}

Write-Host ""
Write-Host "Configurando variaveis..." -ForegroundColor Cyan

# Adicionar seção do R2 se não existir
if ($content -notmatch "#.*Cloudflare R2|#.*R2 Configuration") {
    if (-not $content.EndsWith([Environment]::NewLine)) {
        $content += [Environment]::NewLine
    }
    $content += [Environment]::NewLine
    $content += "# ============================================" + [Environment]::NewLine
    $content += "# Configuracao do Cloudflare R2" + [Environment]::NewLine
    $content += "# ============================================" + [Environment]::NewLine
}

# Atualizar ou adicionar cada variável
foreach ($varName in $variables.Keys) {
    $varValue = $variables[$varName]
    
    if ($content -match "${varName}=.*") {
        Write-Host "  Atualizando: $varName" -ForegroundColor White
        $content = $content -replace "${varName}=.*", "${varName}=$varValue"
    } else {
        Write-Host "  Adicionando: $varName" -ForegroundColor White
        if (-not $content.EndsWith([Environment]::NewLine)) {
            $content += [Environment]::NewLine
        }
        $content += "${varName}=$varValue" + [Environment]::NewLine
    }
}

# Salvar arquivo
$content | Set-Content $envFile -NoNewline

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACAO CONCLUIDA!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Variaveis configuradas:" -ForegroundColor Yellow
Write-Host "  - VITE_R2_ACCOUNT_ID" -ForegroundColor White
Write-Host "  - VITE_R2_ACCESS_KEY_ID" -ForegroundColor White
Write-Host "  - VITE_R2_SECRET_ACCESS_KEY" -ForegroundColor White
Write-Host "  - VITE_R2_ENDPOINT" -ForegroundColor White
Write-Host "  - VITE_R2_PUBLIC_URL" -ForegroundColor White
Write-Host "  - VITE_R2_BUCKET_AUDIO" -ForegroundColor White
Write-Host "  - VITE_R2_BUCKET_DOCUMENTOS" -ForegroundColor White
Write-Host "  - VITE_R2_BUCKET_ANEXOS" -ForegroundColor White
Write-Host "  - VITE_R2_BUCKET_COMPROVANTES" -ForegroundColor White
Write-Host "  - VITE_STORAGE_PROVIDER" -ForegroundColor White
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Reinicie o servidor de desenvolvimento (Ctrl+C e depois npm run dev)" -ForegroundColor White
Write-Host "2. Teste fazendo upload de um arquivo no sistema" -ForegroundColor White
Write-Host "3. Configure o Cloudflare Stream (veja CONFIGURAR_R2_PARA_STREAM.md)" -ForegroundColor White
Write-Host ""
Write-Host "Pronto! A configuracao do Cloudflare R2 esta completa." -ForegroundColor Green
Write-Host ""
