# Script para corrigir permissões da pasta .git bloqueadas pelo OneDrive
# Execute este script como Administrador (botão direito > Executar como administrador)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Correção de Permissões da Pasta .git" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$gitPath = Join-Path $PSScriptRoot ".git"

if (-not (Test-Path $gitPath)) {
    Write-Host "ERRO: Pasta .git não encontrada em: $PSScriptRoot" -ForegroundColor Red
    exit 1
}

Write-Host "Pasta .git encontrada: $gitPath" -ForegroundColor Green
Write-Host ""

# Obter usuário atual
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
Write-Host "Usuário atual: $currentUser" -ForegroundColor Yellow

# Remover regras de negação (Deny)
Write-Host "Removendo regras de negação..." -ForegroundColor Yellow
$acl = Get-Acl $gitPath

# Remover todas as regras de Deny
$acl.Access | Where-Object { $_.AccessControlType -eq "Deny" } | ForEach-Object {
    Write-Host "  Removendo regra Deny: $($_.IdentityReference) - $($_.FileSystemRights)" -ForegroundColor Gray
    $acl.RemoveAccessRule($_) | Out-Null
}

# Adicionar regra de permissão total para o usuário atual
Write-Host "Adicionando permissão total para o usuário atual..." -ForegroundColor Yellow
$permission = $currentUser, "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)

# Aplicar as mudanças
try {
    Set-Acl $gitPath $acl
    Write-Host "SUCESSO: Permissões corrigidas!" -ForegroundColor Green
} catch {
    Write-Host "ERRO ao aplicar permissões: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Certifique-se de executar este script como Administrador!" -ForegroundColor Yellow
    exit 1
}

# Testar se agora funciona
Write-Host ""
Write-Host "Testando permissão de escrita..." -ForegroundColor Yellow
$testFile = Join-Path $gitPath "test-permissions.tmp"
try {
    [System.IO.File]::Create($testFile).Close()
    Remove-Item $testFile -Force
    Write-Host "SUCESSO: Permissão de escrita está funcionando!" -ForegroundColor Green
} catch {
    Write-Host "AVISO: Ainda há problemas de permissão: $_" -ForegroundColor Yellow
    Write-Host "Pode ser necessário reiniciar o OneDrive ou o computador." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Concluído!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Agora você pode tentar fazer o commit novamente." -ForegroundColor Green
