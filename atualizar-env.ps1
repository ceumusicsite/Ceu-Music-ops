# Script para atualizar credenciais do Supabase no .env.local
# Execute este script após obter suas credenciais do Supabase

Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ATUALIZADOR DE CREDENCIAIS - CEU Music Ops" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Solicitar credenciais
Write-Host "Cole suas credenciais do Supabase:`n" -ForegroundColor White

Write-Host "1. Project URL (ex: https://xxxxx.supabase.co):" -ForegroundColor Green
$supabaseUrl = Read-Host "   URL"

Write-Host "`n2. anon public key (ex: eyJhbG...):" -ForegroundColor Green
$supabaseKey = Read-Host "   Key"

# Validar
if ([string]::IsNullOrWhiteSpace($supabaseUrl) -or [string]::IsNullOrWhiteSpace($supabaseKey)) {
    Write-Host "`n[ERRO] Credenciais não podem estar vazias!" -ForegroundColor Red
    Write-Host "Execute o script novamente e forneça os valores corretos.`n" -ForegroundColor Yellow
    exit 1
}

if ($supabaseUrl -notmatch "https://.*\.supabase\.co") {
    Write-Host "`n[AVISO] URL parece incorreta. Deve ser: https://xxxxx.supabase.co" -ForegroundColor Yellow
    $continuar = Read-Host "Deseja continuar mesmo assim? (s/n)"
    if ($continuar -ne "s") {
        Write-Host "Operação cancelada.`n" -ForegroundColor Yellow
        exit 0
    }
}

# Criar conteúdo do arquivo
$envContent = @"
# Google/YouTube API Configuration
VITE_GOOGLE_CLIENT_ID=1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSyBNmwV62YsVOHvmMtCZyvGxOcyrZtMaHYA

# Supabase Configuration
VITE_PUBLIC_SUPABASE_URL=$supabaseUrl
VITE_PUBLIC_SUPABASE_ANON_KEY=$supabaseKey
"@

# Fazer backup do arquivo atual
if (Test-Path ".env.local") {
    Copy-Item ".env.local" ".env.local.backup" -Force
    Write-Host "`n[OK] Backup criado: .env.local.backup" -ForegroundColor Green
}

# Salvar novo arquivo
$envContent | Out-File -FilePath ".env.local" -Encoding utf8 -Force

Write-Host "[OK] Arquivo .env.local atualizado!" -ForegroundColor Green

# Verificar
Write-Host "`nVerificando configuração..." -ForegroundColor White
$content = Get-Content ".env.local" -Raw

if ($content -match "VITE_PUBLIC_SUPABASE_URL=$supabaseUrl") {
    Write-Host "[OK] URL configurada corretamente" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Problema ao configurar URL" -ForegroundColor Red
}

if ($content -match "VITE_PUBLIC_SUPABASE_ANON_KEY=$supabaseKey") {
    Write-Host "[OK] Key configurada corretamente" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Problema ao configurar Key" -ForegroundColor Red
}

Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PROXIMOS PASSOS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "1. Pare o servidor de desenvolvimento (Ctrl+C)" -ForegroundColor White
Write-Host "2. Reinicie com: npm run dev" -ForegroundColor White
Write-Host "3. Acesse: http://localhost:5173" -ForegroundColor White
Write-Host "4. Teste o login novamente`n" -ForegroundColor White

Write-Host "O erro 'Failed to fetch' deve desaparecer!`n" -ForegroundColor Green
