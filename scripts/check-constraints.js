// Script para verificar constraints da tabela orcamentos
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

async function checkConstraints() {
  console.log('🔍 VERIFICANDO CONSTRAINTS DA TABELA ORCAMENTOS\n');
  console.log('='.repeat(60));

  // Testar diferentes valores para o campo 'tipo'
  const tiposTeste = [
    'Produção',
    'producao',
    'PRODUCAO',
    'Clipe',
    'clipe',
    'Masterização',
    'masterizacao',
    'Capa',
    'capa',
    'Mídia',
    'midia',
    'Mixagem',
    'mixagem',
    'Outro',
    'outro'
  ];

  console.log('\n📋 Testando valores para o campo "tipo":\n');

  for (const tipo of tiposTeste) {
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .insert([{
          titulo: 'Teste',
          tipo: tipo,
          descricao: 'Teste de constraint',
          valor: 100.00,
          status: 'pendente'
        }])
        .select();

      if (error) {
        if (error.message.includes('orcamentos_tipo_check')) {
          console.log(`❌ "${tipo}" - NÃO aceito`);
        } else {
          console.log(`⚠️  "${tipo}" - Outro erro:`, error.message);
        }
      } else {
        console.log(`✅ "${tipo}" - ACEITO`);
        // Remover registro de teste
        if (data && data[0]) {
          await supabase.from('orcamentos').delete().eq('id', data[0].id);
        }
      }
    } catch (e) {
      console.log(`❌ "${tipo}" - Erro:`, e.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  
  // Tentar obter a definição do constraint
  console.log('\n📄 Para ver os valores permitidos, execute este SQL no Supabase:\n');
  console.log(`
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE contype = 'c'
  AND cl.relname = 'orcamentos'
  AND n.nspname = 'public';
  `);
  
  console.log('\n✨ Verificação concluída!\n');
}

checkConstraints().catch(console.error);

