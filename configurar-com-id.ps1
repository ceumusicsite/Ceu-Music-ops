# Script para configurar Supabase com o ID do projeto fornecido
# ID do projeto: zbeygaayzhkvbgirtzne

Write-Host "`n══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  CONFIGURACAO SUPABASE - CEU Music Ops" -ForegroundColor Yellow
Write-Host "══════════════════════════════════════════════════`n" -ForegroundColor Cyan

# URL já conhecida
$supabaseUrl = "https://zbeygaayzhkvbgirtzne.supabase.co"

Write-Host "[OK] Project URL identificada:" -ForegroundColor Green
Write-Host "     $supabaseUrl`n" -ForegroundColor Cyan

# Solicitar apenas a anon key
Write-Host "Agora voce precisa apenas da anon public key:`n" -ForegroundColor White

Write-Host "ONDE ENCONTRAR:" -ForegroundColor Yellow
Write-Host "1. Acesse: https://supabase.com/dashboard/project/zbeygaayzhkvbgirtzne/settings/api" -ForegroundColor White
Write-Host "2. Na secao 'Project API keys'" -ForegroundColor White
Write-Host "3. Copie a chave com label 'anon' 'public'" -ForegroundColor White
Write-Host "4. Cole abaixo (comeca com eyJ...):`n" -ForegroundColor White

Write-Host "anon public key:" -ForegroundColor Green
$supabaseKey = Read-Host "Chave"

# Validar
if ([string]::IsNullOrWhiteSpace($supabaseKey)) {
    Write-Host "`n[ERRO] A chave nao pode estar vazia!" -ForegroundColor Red
    Write-Host "Execute o script novamente.`n" -ForegroundColor Yellow
    exit 1
}

if ($supabaseKey -notmatch "^eyJ") {
    Write-Host "`n[AVISO] A chave deve comecar com 'eyJ'" -ForegroundColor Yellow
    $continuar = Read-Host "Deseja continuar mesmo assim? (s/n)"
    if ($continuar -ne "s") {
        Write-Host "Operacao cancelada.`n" -ForegroundColor Yellow
        exit 0
    }
}

# Criar conteúdo do arquivo
$envContent = @"
# Google/YouTube API Configuration
VITE_GOOGLE_CLIENT_ID=1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSyBNmwV62YsVOHvmMtCZyvGxOcyrZtMaHYA

# Supabase Configuration
# Projeto: zbeygaayzhkvbgirtzne
VITE_PUBLIC_SUPABASE_URL=$supabaseUrl
VITE_PUBLIC_SUPABASE_ANON_KEY=$supabaseKey
"@

# Fazer backup
if (Test-Path ".env.local") {
    Copy-Item ".env.local" ".env.local.backup" -Force
    Write-Host "`n[OK] Backup criado: .env.local.backup" -ForegroundColor Green
}

# Salvar
$envContent | Out-File -FilePath ".env.local" -Encoding utf8 -Force

Write-Host "[OK] Arquivo .env.local configurado!" -ForegroundColor Green

# Verificar
Write-Host "`nVerificando..." -ForegroundColor White
$content = Get-Content ".env.local" -Raw

if ($content -match "zbeygaayzhkvbgirtzne") {
    Write-Host "[OK] URL configurada: https://zbeygaayzhkvbgirtzne.supabase.co" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Problema na configuracao da URL" -ForegroundColor Red
}

if ($content -match $supabaseKey.Substring(0, 20)) {
    Write-Host "[OK] Anon Key configurada" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Problema na configuracao da Key" -ForegroundColor Red
}

Write-Host "`n══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PROXIMOS PASSOS" -ForegroundColor Yellow
Write-Host "══════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "1. Pare o servidor (Ctrl+C)" -ForegroundColor White
Write-Host "2. Reinicie: npm run dev" -ForegroundColor White
Write-Host "3. Acesse: http://localhost:5173" -ForegroundColor White
Write-Host "4. Teste o login!`n" -ForegroundColor White

Write-Host "[SUCCESS] Configuracao concluida!`n" -ForegroundColor Green
