// Script para verificar se as colunas da tabela projetos foram adicionadas corretamente
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Credenciais não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyColumns() {
  console.log('🔍 Verificando colunas da tabela projetos...\n');

  const requiredColumns = ['fase', 'progresso', 'prioridade', 'tipo', 'artista_id', 'data_inicio', 'previsao_lancamento'];
  
  try {
    // Tentar fazer um select com todas as colunas necessárias
    const { data, error } = await supabase
      .from('projetos')
      .select('fase, progresso, prioridade, tipo, artista_id, data_inicio, previsao_lancamento')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST204') {
        console.log('❌ Erro: Coluna não encontrada!\n');
        console.log('💡 Isso significa que as colunas ainda não foram adicionadas ou o cache precisa ser atualizado.\n');
        console.log('📝 SOLUÇÃO:\n');
        console.log('1. Execute o SQL no Supabase SQL Editor (veja scripts/fix-projetos-columns.sql)');
        console.log('2. Após executar, aguarde alguns segundos para o cache atualizar');
        console.log('3. Execute este script novamente para verificar\n');
        console.log('📋 SQL necessário:\n');
        console.log(`
ALTER TABLE projetos 
ADD COLUMN IF NOT EXISTS fase TEXT DEFAULT 'planejamento',
ADD COLUMN IF NOT EXISTS progresso INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media',
ADD COLUMN IF NOT EXISTS tipo TEXT,
ADD COLUMN IF NOT EXISTS artista_id UUID REFERENCES artistas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS previsao_lancamento DATE;
        `);
        return;
      }
      throw error;
    }

    console.log('✅ Todas as colunas necessárias estão presentes!');
    console.log('📋 Colunas verificadas:', requiredColumns.join(', '));
    console.log('\n💡 Se ainda houver erro na aplicação:');
    console.log('   - Aguarde alguns segundos para o cache do PostgREST atualizar');
    console.log('   - Recarregue a página da aplicação');
    console.log('   - Tente criar um projeto novamente\n');

  } catch (error) {
    console.error('❌ Erro ao verificar:', error.message);
    if (error.code === 'PGRST204') {
      console.log('\n💡 A coluna ainda não existe. Execute o SQL primeiro!');
    }
  }
}

verifyColumns().catch(console.error);

