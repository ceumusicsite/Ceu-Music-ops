# Script para publicar app OAuth - CEU Music Ops
# Execute: .\publicar-app.ps1

Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PUBLICAR APP OAUTH - CEU Music Ops" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Abrindo Google Cloud Console..." -ForegroundColor White
Start-Process "https://console.cloud.google.com/apis/credentials/consent?project=helical-song-484514-c3"

Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  INSTRUCOES" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Na pagina que abriu, role ate o topo" -ForegroundColor White
Write-Host "2. Procure por 'Status de publicacao: Teste'" -ForegroundColor White
Write-Host "3. Clique no botao azul 'PUBLICAR APP'" -ForegroundColor Green
Write-Host "4. Confirme a publicacao" -ForegroundColor White
Write-Host "5. Aguarde alguns minutos para processar" -ForegroundColor White
Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  RESULTADO" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Apos publicar, qualquer pessoa podera usar o app!" -ForegroundColor Green
Write-Host "✅ Nao sera mais necessario adicionar usuarios de teste" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   - Certifique-se de que todas as informacoes do app estao corretas" -ForegroundColor White
Write-Host "   - Verifique email de suporte, nome do app, etc." -ForegroundColor White
Write-Host "   - A publicacao pode levar alguns minutos para processar" -ForegroundColor White
Write-Host ""
