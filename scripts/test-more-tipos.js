// Testar mais variações para mixagem e masterização
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

async function testTipos() {
  console.log('🔍 Testando mais variações...\n');

  const tiposTeste = [
    'mix',
    'mixagem',
    'master',
    'masterizacao',
    'mastering',
    'video',
    'videoclipe',
    'design',
    'arte',
    'marketing',
    'divulgacao'
  ];

  for (const tipo of tiposTeste) {
    const { data, error } = await supabase
      .from('orcamentos')
      .insert([{
        titulo: 'Teste',
        tipo: tipo,
        descricao: 'Teste',
        valor: 100.00,
        status: 'pendente'
      }])
      .select();

    if (error) {
      if (error.message.includes('orcamentos_tipo_check')) {
        console.log(`❌ "${tipo}"`);
      }
    } else {
      console.log(`✅ "${tipo}"`);
      if (data && data[0]) {
        await supabase.from('orcamentos').delete().eq('id', data[0].id);
      }
    }
  }
  
  console.log('\n✨ Teste concluído!\n');
}

testTipos().catch(console.error);



