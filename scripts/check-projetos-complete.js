// Script para verificar a estrutura completa da tabela projetos
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

async function checkComplete() {
  console.log('🔍 Verificando estrutura completa da tabela projetos...\n');

  try {
    // Tentar fazer um select simples para ver quais colunas existem
    const { data, error } = await supabase
      .from('projetos')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist') || error.message.includes('relation')) {
        console.log('❌ A tabela "projetos" não existe!\n');
        console.log('📝 Você precisa criar a tabela completa. Veja o SQL abaixo.\n');
        return;
      }
      
      if (error.code === 'PGRST204') {
        console.log('❌ Erro: Coluna não encontrada!\n');
        console.log('💡 A tabela existe mas está faltando colunas essenciais.\n');
        console.log('📝 Execute o SQL completo abaixo para criar/corrigir a tabela.\n');
        return;
      }
      
      throw error;
    }

    if (data && data.length > 0) {
      console.log('✅ Tabela existe e tem dados!');
      console.log('📋 Colunas encontradas:');
      const columns = Object.keys(data[0]);
      console.log(columns.join(', '));
      
      const requiredColumns = ['nome', 'tipo', 'artista_id', 'fase', 'progresso', 'prioridade', 'data_inicio', 'previsao_lancamento'];
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('\n⚠️  Colunas faltantes:', missingColumns.join(', '));
        console.log('\n📝 Execute o SQL abaixo para adicionar as colunas faltantes.\n');
      } else {
        console.log('\n✅ Todas as colunas necessárias estão presentes!');
      }
    } else {
      console.log('✅ Tabela existe mas está vazia.');
      console.log('\n📝 Execute o SQL abaixo para garantir que todas as colunas existam.\n');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  
  console.log('─'.repeat(60));
  console.log('SQL COMPLETO PARA CRIAR/CORRIGIR A TABELA:\n');
  console.log(`
-- Criar tabela projetos se não existir
CREATE TABLE IF NOT EXISTS projetos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'single',
  artista_id UUID REFERENCES artistas(id) ON DELETE SET NULL,
  fase TEXT NOT NULL DEFAULT 'planejamento',
  progresso INTEGER DEFAULT 0,
  prioridade TEXT DEFAULT 'media',
  data_inicio DATE,
  previsao_lancamento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas se a tabela já existir mas faltar colunas
ALTER TABLE projetos 
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'single',
ADD COLUMN IF NOT EXISTS artista_id UUID REFERENCES artistas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS fase TEXT DEFAULT 'planejamento',
ADD COLUMN IF NOT EXISTS progresso INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media',
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS previsao_lancamento DATE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar constraints
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

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;

-- Criar políticas se não existirem
DROP POLICY IF EXISTS "Projetos são visíveis para usuários autenticados" ON projetos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir projetos" ON projetos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar projetos" ON projetos;

CREATE POLICY "Projetos são visíveis para usuários autenticados"
  ON projetos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir projetos"
  ON projetos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar projetos"
  ON projetos FOR UPDATE
  USING (auth.role() = 'authenticated');
  `);
  console.log('─'.repeat(60));
}

checkComplete().catch(console.error);

