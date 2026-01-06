// Script para executar automaticamente o SQL de correção da tabela projetos
// Execute com: node scripts/execute-fix-projetos.js
// Requer SUPABASE_SERVICE_ROLE_KEY no .env

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

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
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada!\n');
  console.log('📝 Para executar este script automaticamente, você precisa:');
  console.log('   1. Acesse o Supabase Dashboard');
  console.log('   2. Vá em Settings > API');
  console.log('   3. Copie a "service_role" key (secreta)');
  console.log('   4. Adicione no arquivo .env:');
  console.log('      SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key\n');
  console.log('💡 Alternativa: Execute o SQL manualmente no Supabase SQL Editor');
  console.log('   Veja o arquivo: scripts/fix-projetos-columns.sql\n');
  process.exit(1);
}

// Criar cliente com service_role para ter acesso admin
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeFix() {
  console.log('🔧 Executando correção da tabela projetos...\n');

  try {
    // Ler o arquivo SQL
    const sqlFile = join(__dirname, 'fix-projetos-columns.sql');
    let sql;
    
    try {
      sql = readFileSync(sqlFile, 'utf-8');
    } catch (error) {
      console.error('❌ Erro ao ler arquivo SQL:', error.message);
      console.log('\n💡 Executando SQL diretamente...\n');
      sql = `
-- Adicionar todas as colunas necessárias
ALTER TABLE projetos 
ADD COLUMN IF NOT EXISTS fase TEXT DEFAULT 'planejamento',
ADD COLUMN IF NOT EXISTS progresso INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media',
ADD COLUMN IF NOT EXISTS tipo TEXT,
ADD COLUMN IF NOT EXISTS artista_id UUID REFERENCES artistas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS previsao_lancamento DATE;

-- Adicionar constraints para validar valores
ALTER TABLE projetos 
DROP CONSTRAINT IF EXISTS check_fase,
DROP CONSTRAINT IF EXISTS check_tipo,
DROP CONSTRAINT IF EXISTS check_prioridade,
DROP CONSTRAINT IF EXISTS check_progresso;

ALTER TABLE projetos 
ADD CONSTRAINT check_fase CHECK (fase IN ('planejamento', 'gravando', 'em_edicao', 'mixagem', 'masterizacao', 'finalizado', 'lancado')),
ADD CONSTRAINT check_tipo CHECK (tipo IN ('single', 'ep', 'album')),
ADD CONSTRAINT check_prioridade CHECK (prioridade IN ('alta', 'media', 'baixa')),
ADD CONSTRAINT check_progresso CHECK (progresso >= 0 AND progresso <= 100);
      `;
    }

    // Dividir o SQL em comandos individuais
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('SELECT'));

    console.log(`📝 Executando ${commands.length} comandos SQL...\n`);

    // Executar cada comando usando RPC (PostgreSQL function)
    // Nota: O Supabase JS não suporta execução direta de SQL arbitrário
    // Vamos tentar usar a API REST diretamente
    
    console.log('⚠️  IMPORTANTE: O Supabase JS não permite executar ALTER TABLE diretamente.');
    console.log('📝 Você precisa executar o SQL manualmente no Supabase SQL Editor.\n');
    console.log('─'.repeat(60));
    console.log('SQL para executar:\n');
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('\n📋 Passos:');
    console.log('   1. Acesse: https://app.supabase.com');
    console.log('   2. Selecione seu projeto');
    console.log('   3. Vá em SQL Editor > New query');
    console.log('   4. Cole o SQL acima e clique em Run');
    console.log('   5. Aguarde alguns segundos');
    console.log('   6. Recarregue a aplicação e tente criar um projeto\n');

    // Tentar verificar se as colunas já existem
    console.log('🔍 Verificando estrutura atual...\n');
    const { data, error: checkError } = await supabaseAdmin
      .from('projetos')
      .select('fase, progresso, prioridade, tipo, artista_id')
      .limit(1);

    if (checkError) {
      if (checkError.code === 'PGRST204') {
        console.log('❌ Colunas ainda não existem. Execute o SQL acima.\n');
      } else {
        console.log('⚠️  Erro ao verificar:', checkError.message);
      }
    } else {
      console.log('✅ Colunas já existem! O problema pode ser cache.');
      console.log('💡 Tente recarregar a aplicação (F5).\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

executeFix().catch(console.error);

