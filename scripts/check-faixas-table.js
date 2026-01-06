// Script para verificar se a tabela faixas existe
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

async function checkFaixasTable() {
  console.log('🔍 Verificando se a tabela faixas existe...\n');

  try {
    // Tentar fazer um select na tabela faixas
    const { data, error } = await supabase
      .from('faixas')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        console.log('❌ A tabela faixas NÃO existe no banco de dados!\n');
        console.log('📝 SOLUÇÃO:\n');
        console.log('1. Acesse o Supabase Dashboard');
        console.log('2. Vá em SQL Editor');
        console.log('3. Execute o script: scripts/create-faixas-table.sql\n');
        console.log('─'.repeat(60));
      } else {
        console.log('⚠️  Erro ao verificar tabela:', error.message);
        console.log('Código:', error.code);
      }
    } else {
      console.log('✅ A tabela faixas existe!\n');
      console.log('📊 Estrutura da tabela:');
      
      // Tentar obter informações sobre a estrutura
      const { data: sampleData } = await supabase
        .from('faixas')
        .select('*')
        .limit(1);
      
      if (sampleData && sampleData.length > 0) {
        console.log('Colunas encontradas:', Object.keys(sampleData[0]));
      }
      
      console.log('\n💡 Se ainda estiver com erro, pode ser cache do PostgREST.');
      console.log('   Aguarde alguns segundos e tente novamente, ou recarregue a página.');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkFaixasTable().catch(console.error);

