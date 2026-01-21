# Script para atualizar Node.js no Windows
# Execute: .\atualizar-nodejs.ps1

Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ATUALIZAR NODE.JS" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar versão atual
$currentVersion = node --version
Write-Host "Versao atual do Node.js: $currentVersion" -ForegroundColor White
Write-Host "Versao requerida pelo Vite: ^20.19.0 || >=22.12.0" -ForegroundColor Yellow
Write-Host ""

# Verificar se winget está disponível
try {
    $wingetVersion = winget --version
    Write-Host "Winget encontrado: $wingetVersion" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Atualizando Node.js via Winget..." -ForegroundColor Cyan
    Write-Host ""
    
    winget upgrade --id OpenJS.NodeJS --accept-source-agreements --accept-package-agreements
    
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ATUALIZACAO CONCLUIDA!" -ForegroundColor Yellow
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "PROXIMO PASSO:" -ForegroundColor Cyan
    Write-Host "  1. Feche este terminal" -ForegroundColor White
    Write-Host "  2. Abra um novo terminal" -ForegroundColor White
    Write-Host "  3. Execute: node --version" -ForegroundColor White
    Write-Host "  4. Reinicie o servidor: npm run dev" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "Winget nao encontrado." -ForegroundColor Red
    Write-Host ""
    Write-Host "OPCOES:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Instalar via download direto:" -ForegroundColor Cyan
    Write-Host "   https://nodejs.org/" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Instalar nvm-windows:" -ForegroundColor Cyan
    Write-Host "   https://github.com/coreybutler/nvm-windows/releases" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Instalar Winget (Windows Package Manager):" -ForegroundColor Cyan
    Write-Host "   Microsoft Store > App Installer" -ForegroundColor White
    Write-Host ""
}
