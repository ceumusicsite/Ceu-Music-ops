/**
 * Script de Diagnóstico do YouTube Upload
 * Cole este código no Console do navegador (F12) para diagnosticar problemas
 */

console.log('═══════════════════════════════════════════════════════');
console.log('  DIAGNÓSTICO YOUTUBE UPLOAD - CEU Music Ops');
console.log('═══════════════════════════════════════════════════════\n');

// 1. Verificar variáveis de ambiente
console.log('1. VARIÁVEIS DE AMBIENTE:');
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

if (clientId) {
  console.log('   ✓ Client ID configurado:', clientId.substring(0, 20) + '...');
} else {
  console.log('   ✗ Client ID NÃO configurado!');
  console.log('     → Verifique VITE_GOOGLE_CLIENT_ID no .env.local');
}

if (apiKey) {
  console.log('   ✓ API Key configurada:', apiKey.substring(0, 10) + '...');
} else {
  console.log('   ✗ API Key NÃO configurada!');
  console.log('     → Verifique VITE_GOOGLE_API_KEY no .env.local');
}

// 2. Verificar scripts do Google
console.log('\n2. SCRIPTS DO GOOGLE:');
if (typeof window !== 'undefined') {
  if (window.gapi) {
    console.log('   ✓ window.gapi disponível');
    
    if (window.gapi.load) {
      console.log('   ✓ window.gapi.load disponível');
    } else {
      console.log('   ✗ window.gapi.load NÃO disponível!');
    }
    
    if (window.gapi.client) {
      console.log('   ✓ window.gapi.client disponível');
    } else {
      console.log('   ⚠ window.gapi.client ainda não carregado (normal se não inicializou)');
    }
  } else {
    console.log('   ✗ window.gapi NÃO disponível!');
    console.log('     → Verifique se os scripts estão no index.html:');
    console.log('       <script src="https://apis.google.com/js/api.js"></script>');
    console.log('       <script src="https://accounts.google.com/gsi/client"></script>');
  }
} else {
  console.log('   ✗ window não disponível (ambiente incorreto)');
}

// 3. Verificar scripts no DOM
console.log('\n3. SCRIPTS NO DOM:');
const scripts = document.querySelectorAll('script[src*="google"]');
if (scripts.length > 0) {
  console.log(`   ✓ ${scripts.length} script(s) do Google encontrado(s):`);
  scripts.forEach((script, index) => {
    console.log(`     ${index + 1}. ${script.src}`);
  });
} else {
  console.log('   ✗ Nenhum script do Google encontrado no DOM!');
  console.log('     → Adicione os scripts no index.html');
}

// 4. Testar inicialização manual
console.log('\n4. TESTE DE INICIALIZAÇÃO:');
if (window.gapi && window.gapi.load) {
  console.log('   Tentando inicializar manualmente...');
  
  const testClientId = clientId || 'TESTE_CLIENT_ID';
  const testApiKey = apiKey || 'TESTE_API_KEY';
  
  window.gapi.load('client:auth2', () => {
    window.gapi.client.init({
      apiKey: testApiKey,
      clientId: testClientId,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'],
      scope: 'https://www.googleapis.com/auth/youtube.upload'
    }).then(() => {
      console.log('   ✓ Inicialização manual bem-sucedida!');
      console.log('   → O problema pode estar nas credenciais ou URLs');
    }).catch((error) => {
      console.log('   ✗ Erro na inicialização manual:');
      console.error('     Erro completo:', error);
      console.error('     Tipo:', typeof error);
      console.error('     Error.error:', error?.error);
      console.error('     Error.message:', error?.message);
      console.error('     Error.details:', error?.details);
      
      if (error?.error) {
        if (error.error === 'invalid_client') {
          console.log('   → Client ID inválido. Verifique no .env.local');
        } else if (error.error === 'redirect_uri_mismatch') {
          console.log('   → Configure URLs no Google Cloud Console');
        } else {
          console.log(`   → Erro do Google: ${error.error}`);
        }
      }
    });
  });
} else {
  console.log('   ⚠ Não é possível testar (gapi não carregado)');
}

// 5. Verificar URL atual
console.log('\n5. URL ATUAL:');
console.log('   URL:', window.location.href);
console.log('   Origin:', window.location.origin);
console.log('   Port:', window.location.port || '(padrão)');

const currentOrigin = window.location.origin;
const expectedOrigins = ['http://localhost:5173', 'http://localhost:3000'];

if (expectedOrigins.includes(currentOrigin)) {
  console.log('   ✓ URL está nas origens esperadas');
} else {
  console.log('   ⚠ URL não está nas origens esperadas:', expectedOrigins);
  console.log('   → Adicione esta URL no Google Cloud Console se necessário');
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('  DIAGNÓSTICO CONCLUÍDO');
console.log('═══════════════════════════════════════════════════════\n');
