// Script para criar usuário com qualquer perfil
// Execute com: npm run create-user
// OU: node scripts/create-user.js

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurar readline para entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Função principal assíncrona
async function main() {
  // Tentar carregar dotenv se disponível
  try {
    const dotenv = await import('dotenv');
    dotenv.config({ path: join(__dirname, '../.env.local') });
  } catch (e) {
    // dotenv não disponível, continuar sem ele
  }

  const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ Erro: VITE_PUBLIC_SUPABASE_URL não encontrada nas variáveis de ambiente!');
    console.log('📝 Adicione no arquivo .env.local:');
    console.log('   VITE_PUBLIC_SUPABASE_URL=your_url');
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada!');
    console.log('📝 Para criar usuários, você precisa da Service Role Key:');
    console.log('   1. Acesse o Supabase Dashboard');
    console.log('   2. Vá em Settings > API');
    console.log('   3. Copie a "service_role" key (secreta)');
    console.log('   4. Adicione no arquivo .env.local:');
    console.log('      SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    console.log('');
    console.log('⚠️  ATENÇÃO: A service_role key é muito sensível!');
    console.log('   Nunca a exponha em código público ou repositórios!');
    process.exit(1);
  }

  // Criar cliente com service_role para ter acesso admin
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('👤 Criar Novo Usuário\n');

  try {
    const nome = await question('Nome completo: ');
    const email = await question('E-mail: ');
    const password = await question('Senha (mínimo 6 caracteres): ');
    const roleInput = await question('Perfil (1=Admin, 2=Produção, 3=Financeiro) [2]: ') || '2';
    
    const roleMap = {
      '1': 'admin',
      '2': 'producao',
      '3': 'financeiro'
    };
    const role = roleMap[roleInput] || 'producao';

    if (!nome || !email || !password) {
      console.error('❌ Nome, email e senha são obrigatórios!');
      rl.close();
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ A senha deve ter pelo menos 6 caracteres!');
      rl.close();
      process.exit(1);
    }

    console.log('\n⏳ Criando usuário...\n');

    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: nome
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.error('❌ Este email já está cadastrado!');
      } else {
        console.error('❌ Erro ao criar usuário no Auth:', authError.message);
      }
      rl.close();
      process.exit(1);
    }

    if (!authData.user) {
      console.error('❌ Erro: Usuário não foi criado.');
      rl.close();
      process.exit(1);
    }

    // Criar perfil na tabela users
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .upsert([{
        id: authData.user.id,
        name: nome,
        email: email,
        role: role,
        avatar: null
      }], {
        onConflict: 'id'
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError.message);
      console.log('⚠️  O usuário foi criado no Auth, mas o perfil falhou.');
      console.log('   Você pode corrigir manualmente no banco de dados.');
      rl.close();
      process.exit(1);
    }

    console.log('✅ Usuário criado com sucesso!\n');
    console.log('📋 Detalhes:');
    console.log(`   Nome: ${profileData.name}`);
    console.log(`   Email: ${profileData.email}`);
    console.log(`   Perfil: ${role === 'admin' ? 'Administrador' : role === 'producao' ? 'Produção' : 'Financeiro'}`);
    console.log(`   ID: ${profileData.id}\n`);

  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    rl.close();
  }
}

main();

