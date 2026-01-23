# Script para liberar a porta 3000
# Execute: .\liberar-porta-3000.ps1

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  LIBERAR PORTA 3000" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Encontrar processos usando a porta 3000
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    Write-Host "Processos encontrados usando a porta 3000:" -ForegroundColor Yellow
    foreach ($procId in $processes) {
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "  PID: $procId - Nome: $($proc.ProcessName) - Caminho: $($proc.Path)" -ForegroundColor White
        }
    }
    
    Write-Host ""
    $response = Read-Host "Deseja encerrar esses processos? (S/N)"
    
    if ($response -eq "S" -or $response -eq "s") {
        foreach ($processId in $processes) {
            try {
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Write-Host "Processo $processId encerrado com sucesso!" -ForegroundColor Green
            } catch {
                Write-Host ("Erro ao encerrar processo {0}: {1}" -f $processId, $_.Exception.Message) -ForegroundColor Red
            }
        }
        Write-Host ""
        Write-Host "Porta 3000 liberada! Agora voce pode iniciar o servidor." -ForegroundColor Green
    } else {
        Write-Host "Operacao cancelada." -ForegroundColor Yellow
    }
} else {
    Write-Host "Nenhum processo encontrado usando a porta 3000." -ForegroundColor Green
    Write-Host "A porta ja esta livre ou o comando nao conseguiu identificar o processo." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Tente:" -ForegroundColor Cyan
    Write-Host "1. Verificar se ha outro terminal com o servidor rodando" -ForegroundColor White
    Write-Host "2. Reiniciar o terminal/IDE" -ForegroundColor White
    Write-Host "3. Usar outra porta (vite --port 5173)" -ForegroundColor White
}

Write-Host ""
