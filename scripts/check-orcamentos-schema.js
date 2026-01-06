// Script para verificar a estrutura da tabela orcamentos
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Credenciais não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('🔍 Verificando estrutura da tabela orcamentos...\n');

  // Tentar fazer um select para ver a estrutura
  const { data, error } = await supabase
    .from('orcamentos')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Erro:', error.message);
    console.log('Código:', error.code);
    console.log('Detalhes:', error.details);
    console.log('Hint:', error.hint);
    
    if (error.message.includes('does not exist') || error.code === 'PGRST116') {
      console.log('\n💡 A tabela "orcamentos" não existe. Você precisa criá-la no Supabase.');
      console.log('\n📝 SQL sugerido para criar a tabela:');
      console.log(`
CREATE TABLE orcamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pendente',
  projeto TEXT,
  solicitante TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura/escrita autenticada
CREATE POLICY "Orcamentos são visíveis para usuários autenticados"
  ON orcamentos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir orcamentos"
  ON orcamentos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar orcamentos"
  ON orcamentos FOR UPDATE
  USING (auth.role() = 'authenticated');
      `);
    }
  } else {
    console.log('✅ Tabela existe!');
    if (data && data.length > 0) {
      console.log('\n📋 Estrutura encontrada (baseada no primeiro registro):');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('\n📋 Tabela vazia. Estrutura esperada baseada no código:');
      console.log('  - id (UUID)');
      console.log('  - tipo (TEXT)');
      console.log('  - descricao (TEXT)');
      console.log('  - valor (NUMERIC)');
      console.log('  - status (TEXT)');
      console.log('  - projeto (TEXT, opcional)');
      console.log('  - solicitante (TEXT, opcional)');
      console.log('  - created_at (TIMESTAMP)');
      console.log('  - updated_at (TIMESTAMP, opcional)');
    }
  }

  // Tentar inserir um registro de teste
  console.log('\n🧪 Testando inserção...');
  try {
    const { data: insertData, error: insertError } = await supabase
      .from('orcamentos')
      .insert([{
        tipo: 'Teste',
        descricao: 'Orçamento de teste',
        valor: 1000.00,
        status: 'pendente',
        projeto: 'Projeto Teste',
        solicitante: 'Teste'
      }])
      .select();

    if (insertError) {
      console.log('❌ Erro ao inserir:', insertError.message);
      console.log('Código:', insertError.code);
      console.log('Detalhes:', insertError.details);
      console.log('Hint:', insertError.hint);
    } else {
      console.log('✅ Inserção de teste bem-sucedida!');
      console.log('Dados inseridos:', JSON.stringify(insertData, null, 2));
      
      // Limpar o registro de teste
      if (insertData && insertData.length > 0) {
        await supabase.from('orcamentos').delete().eq('id', insertData[0].id);
        console.log('🧹 Registro de teste removido.');
      }
    }
  } catch (e) {
    console.log('❌ Erro ao testar inserção:', e.message);
  }
}

checkSchema().catch(console.error);



