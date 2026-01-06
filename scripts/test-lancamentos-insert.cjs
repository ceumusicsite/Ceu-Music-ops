require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testInsert() {
  console.log('🧪 Testando inserção de lançamento...\n');

  try {
    // Dados de teste mínimos
    const testData = {
      titulo: 'Teste de Lançamento',
      tipo: 'single',
      status: 'agendado',
      data_planejada: '2024-12-31',
      plataformas: [],
      total_streams: 0,
      total_visualizacoes: 0
    };

    console.log('📤 Tentando inserir:', JSON.stringify(testData, null, 2));

    const { data, error } = await supabase
      .from('lancamentos')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Erro:', error);
      console.error('Código:', error.code);
      console.error('Mensagem:', error.message);
      console.error('Detalhes:', error.details);
      console.error('Hint:', error.hint);
      
      if (error.code === '42P01') {
        console.log('\n💡 SOLUÇÃO: A tabela "lancamentos" não existe!');
        console.log('Execute o script SQL: scripts/create-lancamentos-table.sql');
      }
      
      return;
    }

    console.log('✅ Sucesso! Lançamento criado:');
    console.log(JSON.stringify(data, null, 2));

    // Limpar teste
    if (data && data[0]) {
      await supabase
        .from('lancamentos')
        .delete()
        .eq('id', data[0].id);
      console.log('\n🧹 Teste removido do banco.');
    }

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

testInsert();

