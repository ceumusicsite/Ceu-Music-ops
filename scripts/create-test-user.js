// Script para criar automaticamente a conta de teste padrão
// Execute com: node scripts/create-test-user.js
// 
// Requer variáveis de ambiente no arquivo .env.local:
// - VITE_PUBLIC_SUPABASE_URL
// - VITE_PUBLIC_SUPABASE_ANON_KEY
// - SUPABASE_SERVICE_ROLE_KEY (opcional, mas recomendado)

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tentar carregar dotenv se disponível
try {
  const dotenv = (await import('dotenv')).default;
  dotenv.config({ path: join(__dirname, '../.env.local') });
} catch (e) {
  // dotenv não disponível, usar variáveis de ambiente do sistema
}

// Carregar variáveis de ambiente
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Credenciais do Supabase não encontradas!');
  console.log('\n💡 Configure o arquivo .env.local com:');
  console.log('   VITE_PUBLIC_SUPABASE_URL=sua_url_aqui');
  console.log('   VITE_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=sua_service_key_aqui (opcional)\n');
  process.exit(1);
}

// Usar service role key se disponível, senão usar anon key
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey
);

// Credenciais da conta de teste
const TEST_USER = {
  name: 'Admin Teste',
  email: 'admin@ceumusic.com',
  password: 'Admin123!@#',
  role: 'admin'
};

async function createTestUser() {
  console.log('🔐 Criando conta de teste...\n');
  console.log(`📧 E-mail: ${TEST_USER.email}`);
  console.log(`🔑 Senha: ${TEST_USER.password}`);
  console.log(`👤 Role: ${TEST_USER.role}\n`);

  try {
    // Verificar se o usuário já existe
    const { data: existingUsers } = await supabase
      .from('users')
      .select('email')
      .eq('email', TEST_USER.email)
      .maybeSingle();

    if (existingUsers) {
      console.log('⚠️  Esta conta de teste já existe!');
      console.log('💡 Você pode fazer login com as credenciais acima.\n');
      return;
    }

    // Se tiver service role key, criar diretamente
    if (supabaseServiceKey) {
      // Criar usuário usando Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: TEST_USER.email,
        password: TEST_USER.password,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          name: TEST_USER.name
        }
      });

      if (authError) {
        // Se o erro for de usuário já existente, tentar fazer login
        if (authError.message?.includes('already registered') || authError.message?.includes('User already registered')) {
          console.log('⚠️  Usuário já existe no Auth. Criando perfil na tabela users...\n');
          
          // Buscar o usuário existente
          const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
          const user = existingAuthUser?.users?.find(u => u.email === TEST_USER.email);
          
          if (user) {
            // Criar perfil na tabela users
            const { error: profileError } = await supabase
              .from('users')
              .upsert([{
                id: user.id,
                name: TEST_USER.name,
                email: TEST_USER.email,
                role: TEST_USER.role,
                avatar: null
              }], {
                onConflict: 'id'
              });

            if (profileError) {
              console.error('❌ Erro ao criar perfil:', profileError.message);
              return;
            }

            console.log('✅ Conta de teste configurada com sucesso!\n');
            console.log('📧 E-mail:', TEST_USER.email);
            console.log('🔑 Senha:', TEST_USER.password);
            console.log('👤 Role:', TEST_USER.role);
            console.log('\n🎉 Agora você pode fazer login no sistema!');
            return;
          }
        }
        throw authError;
      }

      if (authData.user) {
        // Criar perfil na tabela users
        const { error: profileError } = await supabase
          .from('users')
          .upsert([{
            id: authData.user.id,
            name: TEST_USER.name,
            email: TEST_USER.email,
            role: TEST_USER.role,
            avatar: null
          }], {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('⚠️  Usuário criado no Auth, mas erro ao criar perfil:', profileError.message);
          console.log('💡 Você pode criar o perfil manualmente na tabela users do Supabase.');
        } else {
          console.log('✅ Conta de teste criada com sucesso!\n');
          console.log('📧 E-mail:', TEST_USER.email);
          console.log('🔑 Senha:', TEST_USER.password);
          console.log('👤 Role:', TEST_USER.role);
          console.log('\n🎉 Agora você pode fazer login no sistema!');
        }
      }
    } else {
      console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY não encontrada.');
      console.log('💡 Para criar a conta automaticamente, adicione SUPABASE_SERVICE_ROLE_KEY no .env.local');
      console.log('💡 Ou use o script create-admin.js para criar manualmente.\n');
      console.log('📋 Credenciais sugeridas:');
      console.log('   E-mail:', TEST_USER.email);
      console.log('   Senha:', TEST_USER.password);
    }

  } catch (error) {
    console.error('\n❌ Erro ao criar conta de teste:', error.message);
    
    if (error.message?.includes('Invalid API key')) {
      console.log('\n💡 Chave API inválida. Verifique suas variáveis de ambiente.');
      console.log('💡 Para criar usuários diretamente, use SUPABASE_SERVICE_ROLE_KEY no .env.local');
    }
  }
}

// Executar função principal
createTestUser().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
