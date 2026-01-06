// Script para forçar atualização do cache do PostgREST
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

async function forceRefresh() {
  console.log('🔄 Forçando atualização do cache do PostgREST...\n');

  try {
    // Tentar fazer um select com todas as colunas para forçar atualização do cache
    console.log('1. Verificando coluna "nome"...');
    const { data: nomeTest, error: nomeError } = await supabase
      .from('projetos')
      .select('nome')
      .limit(1);
    
    if (nomeError) {
      console.log('❌ Erro ao acessar coluna "nome":', nomeError.message);
    } else {
      console.log('✅ Coluna "nome" acessível');
    }

    console.log('\n2. Verificando coluna "fase"...');
    const { data: faseTest, error: faseError } = await supabase
      .from('projetos')
      .select('fase')
      .limit(1);
    
    if (faseError) {
      console.log('❌ Erro ao acessar coluna "fase":', faseError.message);
    } else {
      console.log('✅ Coluna "fase" acessível');
    }

    console.log('\n3. Verificando todas as colunas juntas...');
    const { data: allTest, error: allError } = await supabase
      .from('projetos')
      .select('nome, tipo, artista_id, fase, progresso, prioridade, data_inicio, previsao_lancamento')
      .limit(1);
    
    if (allError) {
      console.log('❌ Erro ao acessar todas as colunas:', allError.message);
      console.log('   Código:', allError.code);
      
      if (allError.code === 'PGRST204') {
        console.log('\n💡 SOLUÇÃO:');
        console.log('   O cache do PostgREST ainda não foi atualizado.');
        console.log('   Isso pode levar alguns minutos após executar o SQL.');
        console.log('\n   Tente:');
        console.log('   1. Aguardar 2-3 minutos');
        console.log('   2. Recarregar a aplicação com Ctrl+Shift+R (hard refresh)');
        console.log('   3. Limpar cache do navegador');
        console.log('   4. Se persistir, reinicie o projeto Supabase (Settings > Restart)');
      }
    } else {
      console.log('✅ Todas as colunas estão acessíveis!');
      console.log('\n💡 Se ainda houver erro na aplicação:');
      console.log('   - Faça um hard refresh: Ctrl+Shift+R');
      console.log('   - Limpe o cache do navegador');
      console.log('   - Tente em uma aba anônima');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

forceRefresh().catch(console.error);

