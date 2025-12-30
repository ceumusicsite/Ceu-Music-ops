// Script para verificar a estrutura da tabela artistas
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
  console.log('🔍 Verificando estrutura da tabela artistas...\n');

  // Tentar fazer um select vazio para ver o erro
  const { data, error } = await supabase
    .from('artistas')
    .select('*')
    .limit(0);

  if (error) {
    console.log('❌ Erro:', error.message);
    console.log('Código:', error.code);
    console.log('Detalhes:', error.details);
    console.log('Hint:', error.hint);
    
    if (error.message.includes('does not exist') || error.code === 'PGRST116') {
      console.log('\n💡 A tabela "artistas" não existe. Você precisa criá-la no Supabase.');
      console.log('\n📝 SQL sugerido para criar a tabela:');
      console.log(`
CREATE TABLE artistas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  genero TEXT,
  status TEXT DEFAULT 'ativo',
  contato_email TEXT,
  contato_telefone TEXT,
  observacoes_internas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE artistas ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura/escrita autenticada
CREATE POLICY "Artistas são visíveis para usuários autenticados"
  ON artistas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir artistas"
  ON artistas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar artistas"
  ON artistas FOR UPDATE
  USING (auth.role() = 'authenticated');
      `);
    }
  } else {
    console.log('✅ Tabela existe!');
    console.log('Estrutura esperada baseada no código:');
    console.log('  - id (UUID)');
    console.log('  - nome (TEXT)');
    console.log('  - genero (TEXT)');
    console.log('  - status (TEXT)');
    console.log('  - contato_email (TEXT)');
    console.log('  - contato_telefone (TEXT, opcional)');
    console.log('  - observacoes_internas (TEXT, opcional)');
    console.log('  - created_at (TIMESTAMP)');
    console.log('  - updated_at (TIMESTAMP, opcional)');
  }
}

checkSchema().catch(console.error);

