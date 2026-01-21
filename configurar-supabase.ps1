# Script para configurar variáveis do Supabase no .env.local
# Execute: .\configurar-supabase.ps1

Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  CONFIGURAR SUPABASE - CEU Music Ops" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar se .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Host "ERRO: Arquivo .env.local nao encontrado!" -ForegroundColor Red
    Write-Host "Criando arquivo .env.local..." -ForegroundColor Yellow
    New-Item -Path ".env.local" -ItemType File -Force | Out-Null
}

# Credenciais do Supabase (do histórico anterior)
$supabaseUrl = "https://zbeygaayzhkvbgirtzne.supabase.co"
$supabaseAnonKey = "sb_publishable_H12O0bI0YWeO1m9Xl-yQkQ_CqoJ7SHd"

Write-Host "Configurando credenciais do Supabase..." -ForegroundColor White
Write-Host ""
Write-Host "Project URL: $supabaseUrl" -ForegroundColor Cyan
Write-Host "Anon Key: $($supabaseAnonKey.Substring(0, 20))..." -ForegroundColor Cyan
Write-Host ""

# Ler conteúdo atual do .env.local
$envContent = Get-Content ".env.local" -ErrorAction SilentlyContinue

# Variáveis necessárias
$requiredVars = @{
    "VITE_GOOGLE_CLIENT_ID" = "1007716861877-418o7hiac93kmnqaga2tjcprftdmn3r8.apps.googleusercontent.com"
    "VITE_GOOGLE_API_KEY" = "AIzaSyBNmwV62YsVOHvmMtCZyvGxOcyrZtMaHYA"
    "VITE_PUBLIC_SUPABASE_URL" = $supabaseUrl
    "VITE_PUBLIC_SUPABASE_ANON_KEY" = $supabaseAnonKey
}

# Criar novo conteúdo
$newContent = @()

# Adicionar comentários e variáveis
$newContent += "# Google/YouTube API Configuration"
$newContent += "VITE_GOOGLE_CLIENT_ID=$($requiredVars['VITE_GOOGLE_CLIENT_ID'])"
$newContent += "VITE_GOOGLE_API_KEY=$($requiredVars['VITE_GOOGLE_API_KEY'])"
$newContent += ""
$newContent += "# Supabase Configuration"
$newContent += "VITE_PUBLIC_SUPABASE_URL=$($requiredVars['VITE_PUBLIC_SUPABASE_URL'])"
$newContent += "VITE_PUBLIC_SUPABASE_ANON_KEY=$($requiredVars['VITE_PUBLIC_SUPABASE_ANON_KEY'])"

# Escrever no arquivo
$newContent | Set-Content ".env.local" -Encoding UTF8

Write-Host "✅ Arquivo .env.local atualizado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  PROXIMO PASSO" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Reinicie o servidor!" -ForegroundColor Red
Write-Host ""
Write-Host "1. Pare o servidor (Ctrl+C)" -ForegroundColor White
Write-Host "2. Execute: npm run dev" -ForegroundColor White
Write-Host "3. O erro deve desaparecer" -ForegroundColor White
Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
