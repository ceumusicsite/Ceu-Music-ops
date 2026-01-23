# Script para configurar VITE_STREAM_CUSTOMER_BASE_URL no .env.local
# Execute: .\configurar-stream-url.ps1

$streamUrl = "https://customer-jzsf7zucu5f099z5.cloudflarestream.com"
$envFile = ".env.local"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR CLOUDFLARE STREAM URL" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

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

# Ler conteúdo atual
$content = Get-Content $envFile -Raw

# Verificar se a variável já existe
if ($content -match "VITE_STREAM_CUSTOMER_BASE_URL") {
    Write-Host "Variável VITE_STREAM_CUSTOMER_BASE_URL encontrada. Atualizando..." -ForegroundColor Cyan
    
    # Substituir a linha existente
    $content = $content -replace "VITE_STREAM_CUSTOMER_BASE_URL=.*", "VITE_STREAM_CUSTOMER_BASE_URL=$streamUrl"
    
    Write-Host "Variável atualizada!" -ForegroundColor Green
} else {
    Write-Host "Adicionando variável VITE_STREAM_CUSTOMER_BASE_URL..." -ForegroundColor Cyan
    
    # Adicionar a variável no final do arquivo
    if (-not $content.EndsWith([Environment]::NewLine)) {
        $content += [Environment]::NewLine
    }
    $content += "# Cloudflare Stream" + [Environment]::NewLine
    $content += "VITE_STREAM_CUSTOMER_BASE_URL=$streamUrl" + [Environment]::NewLine
    
    Write-Host "Variável adicionada!" -ForegroundColor Green
}

# Salvar arquivo
$content | Set-Content $envFile -NoNewline

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACAO CONCLUIDA!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL configurada: $streamUrl" -ForegroundColor White
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Reinicie o servidor de desenvolvimento (Ctrl+C e depois npm run dev)" -ForegroundColor White
Write-Host "2. Teste fazendo upload de um video no sistema" -ForegroundColor White
Write-Host ""
Write-Host "Pronto! A integracao do Cloudflare Stream esta configurada." -ForegroundColor Green
Write-Host ""
