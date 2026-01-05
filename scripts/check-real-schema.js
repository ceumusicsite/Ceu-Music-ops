// Script para verificar a estrutura REAL das tabelas
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('🔍 VERIFICANDO ESTRUTURA REAL DAS TABELAS\n');
  
  // Tabela orcamentos
  console.log('📋 TABELA: orcamentos');
  console.log('='.repeat(60));
  try {
    const { data, error } = await supabase.rpc('get_table_columns', { 
      table_name: 'orcamentos' 
    });
    
    if (error) {
      // Método alternativo: tentar select vazio
      const { error: selectError } = await supabase
        .from('orcamentos')
        .select('*')
        .limit(0);
      
      if (selectError) {
        console.log('❌ Não foi possível determinar a estrutura');
        console.log('Tente executar este SQL no Supabase:');
        console.log(`
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orcamentos'
ORDER BY ordinal_position;
        `);
      }
    }
  } catch (e) {
    console.log('Método alternativo...\n');
  }
  
  // Tentar pegar um registro para ver os campos
  const { data: orcData } = await supabase
    .from('orcamentos')
    .select('*')
    .limit(1);
  
  if (orcData && orcData.length > 0) {
    console.log('Campos encontrados no primeiro registro:');
    Object.keys(orcData[0]).forEach(key => {
      console.log(`  ✓ ${key}`);
    });
  } else {
    console.log('Tabela vazia - vou tentar inserir e ver o erro...');
    const { error } = await supabase
      .from('orcamentos')
      .insert([{ tipo: 'Teste' }])
      .select();
    
    if (error) {
      console.log('\nCampos obrigatórios faltando:');
      const match = error.message.match(/column "(\w+)"/);
      if (match) {
        console.log(`  ⚠️  ${match[1]} (NOT NULL)`);
      }
      console.log('\nMensagem completa:', error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Tabela projetos
  console.log('\n📋 TABELA: projetos');
  console.log('='.repeat(60));
  
  const { data: projData, error: projError } = await supabase
    .from('projetos')
    .select('*')
    .limit(1);
  
  if (projError) {
    console.log('❌ Erro:', projError.message);
  } else if (projData && projData.length > 0) {
    console.log('Campos encontrados:');
    Object.keys(projData[0]).forEach(key => {
      console.log(`  ✓ ${key}`);
    });
  } else {
    console.log('Tabela vazia');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Verificação concluída!\n');
}

checkSchema().catch(console.error);

