// Script para corrigir automaticamente a estrutura da tabela artistas
// Execute com: node scripts/fix-artistas-columns-auto.js
// Requer SUPABASE_SERVICE_ROLE_KEY no .env

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Erro: VITE_PUBLIC_SUPABASE_URL não encontrada!');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada!');
  console.log('\n📝 Para executar este script automaticamente, você precisa:');
  console.log('   1. Acesse o Supabase Dashboard');
  console.log('   2. Vá em Settings > API');
  console.log('   3. Copie a "service_role" key (secreta)');
  console.log('   4. Adicione no arquivo .env:');
  console.log('      SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key\n');
  console.log('💡 Alternativa: Execute o SQL manualmente no Supabase SQL Editor');
  console.log('   Veja o arquivo: scripts/fix-artistas-columns.sql\n');
  process.exit(1);
}

// Criar cliente com service_role para ter acesso admin
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixArtistasColumns() {
  console.log('🔧 Corrigindo estrutura da tabela artistas...\n');

  try {
    // 1. Adicionar as colunas faltantes usando RPC ou SQL direto
    console.log('📝 Adicionando colunas faltantes...');
    
    // Usar a função rpc para executar SQL (se disponível) ou fazer via alterações diretas
    // Como não podemos executar ALTER TABLE diretamente via Supabase JS,
    // vamos verificar se as colunas existem e informar o usuário
    
    // Verificar estrutura atual
    const { data: testData, error: testError } = await supabaseAdmin
      .from('artistas')
      .select('*')
      .limit(1);

    if (testError && testError.code === 'PGRST204') {
      console.log('⚠️  Erro ao verificar estrutura. A tabela pode ter problemas.');
      console.log('💡 Execute o SQL manualmente no Supabase SQL Editor.\n');
      return;
    }

    // Tentar inserir um registro de teste com as novas colunas para verificar
    console.log('✅ Tabela acessível');
    console.log('\n⚠️  IMPORTANTE: Este script não pode executar ALTER TABLE automaticamente.');
    console.log('📝 Você precisa executar o SQL manualmente no Supabase:\n');
    console.log('─'.repeat(60));
    console.log(`
-- Adicionar as colunas faltantes
ALTER TABLE artistas 
ADD COLUMN IF NOT EXISTS contato_email TEXT,
ADD COLUMN IF NOT EXISTS contato_telefone TEXT,
ADD COLUMN IF NOT EXISTS observacoes_internas TEXT;

-- Migrar dados das colunas antigas para as novas
UPDATE artistas 
SET contato_email = email 
WHERE contato_email IS NULL AND email IS NOT NULL;

UPDATE artistas 
SET contato_telefone = telefone 
WHERE contato_telefone IS NULL AND telefone IS NOT NULL;
    `);
    console.log('─'.repeat(60));
    console.log('\n📋 Passos:');
    console.log('   1. Acesse: https://app.supabase.com');
    console.log('   2. Selecione seu projeto');
    console.log('   3. Vá em SQL Editor > New query');
    console.log('   4. Cole o SQL acima e clique em Run');
    console.log('   5. Teste criar um artista novamente na aplicação\n');

    // Tentar verificar se as colunas já existem após a execução manual
    console.log('💡 Após executar o SQL, você pode verificar executando:');
    console.log('   node scripts/check-artistas-structure.js\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

fixArtistasColumns().catch(console.error);

