/**
 * Script para verificar se a tabela artistas_anexos foi criada corretamente
 * 
 * Uso: node scripts/verificar-artistas-anexos.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Credenciais do Supabase não encontradas!');
  console.log('💡 Verifique se as variáveis estão no .env.local:');
  console.log('   VITE_PUBLIC_SUPABASE_URL');
  console.log('   VITE_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verificarTabela() {
  console.log('🔍 Verificando tabela artistas_anexos...\n');

  try {
    // 1. Verificar se a tabela existe
    console.log('1️⃣ Verificando se a tabela existe...');
    const { data, error } = await supabase
      .from('artistas_anexos')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
        console.log('❌ A tabela artistas_anexos NÃO existe!\n');
        console.log('📝 SOLUÇÃO:');
        console.log('   1. Acesse o Supabase Dashboard');
        console.log('   2. Vá em SQL Editor');
        console.log('   3. Execute o script: scripts/create-artistas-anexos-table.sql\n');
        return;
      }
      
      if (error.code === 'PGRST301') {
        console.log('⚠️  Erro de permissão (RLS). Verifique as políticas de segurança.\n');
        console.log('💡 Execute o SQL novamente para garantir que as políticas foram criadas.\n');
        return;
      }
      
      throw error;
    }

    console.log('✅ A tabela existe!\n');

    // 2. Verificar estrutura
    console.log('2️⃣ Verificando estrutura da tabela...');
    if (data && data.length > 0) {
      console.log('   Colunas encontradas:', Object.keys(data[0]));
    } else {
      // Tentar inserir um registro de teste para verificar estrutura
      console.log('   Tabela vazia. Testando inserção...');
      
      // Buscar um artista para teste
      const { data: artistas } = await supabase
        .from('artistas')
        .select('id')
        .limit(1);

      if (artistas && artistas.length > 0) {
        const artistaId = artistas[0].id;
        
        const { error: insertError } = await supabase
          .from('artistas_anexos')
          .insert({
            artista_id: artistaId,
            tipo: 'pasta',
            nome: 'TESTE_DELETE_ME',
            pasta_pai_id: null,
          });

        if (insertError) {
          console.log('❌ Erro ao inserir teste:', insertError.message);
          console.log('   Código:', insertError.code);
          if (insertError.details) console.log('   Detalhes:', insertError.details);
          if (insertError.hint) console.log('   Dica:', insertError.hint);
        } else {
          console.log('✅ Estrutura OK! Registro de teste criado.');
          
          // Deletar registro de teste
          await supabase
            .from('artistas_anexos')
            .delete()
            .eq('nome', 'TESTE_DELETE_ME');
          
          console.log('   Registro de teste removido.\n');
        }
      } else {
        console.log('⚠️  Nenhum artista encontrado. Crie um artista primeiro.\n');
      }
    }

    // 3. Verificar RLS
    console.log('3️⃣ Verificando RLS (Row Level Security)...');
    const { data: rlsData, error: rlsError } = await supabase.rpc('check_rls_policies', {
      table_name: 'artistas_anexos'
    }).catch(() => ({ data: null, error: null }));

    console.log('   RLS está habilitado (verifique no Supabase Dashboard > Table Editor > artistas_anexos > Policies)\n');

    console.log('✅ Verificação concluída!\n');
    console.log('💡 Se ainda houver problemas:');
    console.log('   - Aguarde 10-30 segundos após criar a tabela (cache do PostgREST)');
    console.log('   - Recarregue a página do navegador (F5)');
    console.log('   - Verifique se está autenticado no sistema');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('   Detalhes:', error);
  }
}

verificarTabela().catch(console.error);
