# Script para corrigir permissões e fazer commit
# EXECUTE COMO ADMINISTRADOR (botão direito > Executar como administrador)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Correção de Permissões e Commit" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está executando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERRO: Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "Botão direito no PowerShell > Executar como administrador" -ForegroundColor Yellow
    exit 1
}

$projectPath = "C:\Users\jonat\OneDrive\Documentos\Ceu-Music-ops-1"
$gitPath = Join-Path $projectPath ".git"

if (-not (Test-Path $gitPath)) {
    Write-Host "ERRO: Pasta .git não encontrada!" -ForegroundColor Red
    exit 1
}

Write-Host "Corrigindo permissões da pasta .git..." -ForegroundColor Yellow

# Usar takeown e icacls com permissões de admin
try {
    # Tomar posse da pasta
    Write-Host "  Tomando posse da pasta..." -ForegroundColor Gray
    & takeown /F $gitPath /R /D Y 2>&1 | Out-Null
    
    # Remover todas as regras de negação e dar permissão total
    Write-Host "  Aplicando permissões..." -ForegroundColor Gray
    $user = $env:USERNAME
    & icacls $gitPath /grant "${user}:F" /T /Q 2>&1 | Out-Null
    & icacls $gitPath /reset /T /Q 2>&1 | Out-Null
    & icacls $gitPath /grant "${user}:(OI)(CI)F" /T /Q 2>&1 | Out-Null
    
    Write-Host "SUCESSO: Permissões corrigidas!" -ForegroundColor Green
} catch {
    Write-Host "ERRO ao corrigir permissões: $_" -ForegroundColor Red
    exit 1
}

# Testar permissão de escrita
Write-Host ""
Write-Host "Testando permissão de escrita..." -ForegroundColor Yellow
$testFile = Join-Path $gitPath "test-permissions.tmp"
try {
    [System.IO.File]::Create($testFile).Close()
    Remove-Item $testFile -Force
    Write-Host "SUCESSO: Permissão de escrita OK!" -ForegroundColor Green
} catch {
    Write-Host "AVISO: Ainda há problemas: $_" -ForegroundColor Yellow
}

# Fazer commit
Write-Host ""
Write-Host "Fazendo commit..." -ForegroundColor Yellow
Set-Location $projectPath

try {
    git add src/pages/shared-audio-video/page.tsx
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Arquivo adicionado ao staging" -ForegroundColor Green
    } else {
        Write-Host "  AVISO: Problema ao adicionar arquivo" -ForegroundColor Yellow
    }
    
    git commit -m "fix: corrigir erro cannot coerce em links compartilháveis em dispositivos móveis"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCESSO: Commit realizado!" -ForegroundColor Green
    } else {
        Write-Host "ERRO: Falha ao fazer commit" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERRO ao fazer commit: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Concluído com sucesso!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
