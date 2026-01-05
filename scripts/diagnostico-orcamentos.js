// Script de diagnóstico completo para a tabela orcamentos
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

async function diagnosticar() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DA TABELA ORCAMENTOS\n');
  console.log('='.repeat(60));

  // 1. Verificar se consegue conectar
  console.log('\n1️⃣ Testando conexão com Supabase...');
  try {
    const { data, error } = await supabase.from('orcamentos').select('count').single();
    if (error && error.code !== 'PGRST116') {
      console.log('❌ Erro de conexão:', error.message);
      console.log('   Código:', error.code);
    } else {
      console.log('✅ Conexão OK');
    }
  } catch (e) {
    console.log('❌ Erro de conexão:', e.message);
  }

  // 2. Listar todos os orçamentos existentes
  console.log('\n2️⃣ Verificando orçamentos existentes...');
  try {
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*')
      .limit(5);

    if (error) {
      console.log('❌ Erro ao buscar:', error.message);
      console.log('   Código:', error.code);
      console.log('   Detalhes:', error.details);
    } else {
      console.log(`✅ Encontrados ${data?.length || 0} orçamentos`);
      if (data && data.length > 0) {
        console.log('\n📋 Estrutura do primeiro orçamento:');
        console.log(JSON.stringify(data[0], null, 2));
        console.log('\n📋 Campos disponíveis:');
        Object.keys(data[0]).forEach(key => {
          console.log(`   - ${key}: ${typeof data[0][key]}`);
        });
      }
    }
  } catch (e) {
    console.log('❌ Erro:', e.message);
  }

  // 3. Testar insert com TODOS os campos
  console.log('\n3️⃣ Testando inserção com novos campos...');
  try {
    const { data, error } = await supabase
      .from('orcamentos')
      .insert([{
        tipo: 'Teste',
        descricao: 'Teste de diagnóstico',
        valor: 100.00,
        status: 'pendente',
        recuperavel: true,
        status_pagamento: 'pendente'
      }])
      .select();

    if (error) {
      console.log('❌ Erro na inserção:', error.message);
      console.log('   Código:', error.code);
      console.log('   Detalhes:', error.details);
      console.log('   Hint:', error.hint);
      
      // Identificar campos problemáticos
      if (error.message.includes('column')) {
        console.log('\n⚠️  Problema com colunas! Os campos novos podem não ter sido criados.');
      }
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('   ID criado:', data[0]?.id);
      
      // Remover registro de teste
      if (data && data[0]) {
        await supabase.from('orcamentos').delete().eq('id', data[0].id);
        console.log('   🧹 Registro de teste removido');
      }
    }
  } catch (e) {
    console.log('❌ Erro na inserção:', e.message);
  }

  // 4. Verificar tabela de artistas
  console.log('\n4️⃣ Verificando tabela de artistas...');
  try {
    const { data, error } = await supabase
      .from('artistas')
      .select('id, nome')
      .limit(3);

    if (error) {
      console.log('❌ Erro ao buscar artistas:', error.message);
      console.log('   Código:', error.code);
    } else {
      console.log(`✅ Encontrados ${data?.length || 0} artistas`);
      if (data && data.length > 0) {
        data.forEach(a => console.log(`   - ${a.nome} (${a.id})`));
      }
    }
  } catch (e) {
    console.log('❌ Erro:', e.message);
  }

  // 5. Verificar tabela de projetos
  console.log('\n5️⃣ Verificando tabela de projetos...');
  try {
    const { data, error } = await supabase
      .from('projetos')
      .select('id, nome')
      .limit(3);

    if (error) {
      console.log('❌ Erro ao buscar projetos:', error.message);
      console.log('   Código:', error.code);
    } else {
      console.log(`✅ Encontrados ${data?.length || 0} projetos`);
      if (data && data.length > 0) {
        data.forEach(p => console.log(`   - ${p.nome} (${p.id})`));
      }
    }
  } catch (e) {
    console.log('❌ Erro:', e.message);
  }

  // 6. Verificar bucket de storage
  console.log('\n6️⃣ Verificando bucket de storage...');
  try {
    const { data, error } = await supabase.storage.getBucket('orcamentos');

    if (error) {
      console.log('❌ Bucket não encontrado:', error.message);
      console.log('   Você precisa criar o bucket "orcamentos" no Supabase Storage');
    } else {
      console.log('✅ Bucket "orcamentos" existe');
      console.log('   Público:', data.public);
    }
  } catch (e) {
    console.log('❌ Erro:', e.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Diagnóstico concluído!\n');
}

diagnosticar().catch(console.error);

