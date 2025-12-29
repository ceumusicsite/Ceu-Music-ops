// Script para criar um usuário admin no Supabase
// Execute com: npm run create-admin
// 
// Requer variáveis de ambiente no arquivo .env.local:
// - VITE_PUBLIC_SUPABASE_URL
// - VITE_PUBLIC_SUPABASE_ANON_KEY
// - SUPABASE_SERVICE_ROLE_KEY (opcional, mas recomendado para criar sem confirmação de email)

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
  // Tentar carregar dotenv se disponível (mesma abordagem do check-users.js)
  try {
    const dotenv = (await import('dotenv')).default;
    dotenv.config({ path: join(__dirname, '../.env.local') });
  } catch (e) {
    // dotenv não disponível, usar variáveis de ambiente do sistema
    // As variáveis devem estar definidas no sistema ou no .env.local será ignorado
  }

  // Carregar variáveis de ambiente
  const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Erro: Credenciais do Supabase não encontradas!');
    console.log('\n💡 Dica: Crie um arquivo .env.local na raiz do projeto com:');
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

  // Verificar se tem service role key
  if (!supabaseServiceKey) {
    console.log('⚠️  Aviso: SUPABASE_SERVICE_ROLE_KEY não encontrada.');
    console.log('💡 O usuário será criado, mas pode precisar confirmar o e-mail.');
    console.log('💡 Para criar sem confirmação, adicione SUPABASE_SERVICE_ROLE_KEY no .env.local\n');
  }

  async function createAdmin() {
  console.log('🔐 Criar Usuário Admin\n');
  console.log('Preencha os dados do administrador:\n');

  try {
    const nome = await question('Nome completo: ');
    if (!nome.trim()) {
      console.error('❌ Nome é obrigatório!');
      rl.close();
      process.exit(1);
    }

    const email = await question('E-mail: ');
    if (!email.trim() || !email.includes('@')) {
      console.error('❌ E-mail inválido!');
      rl.close();
      process.exit(1);
    }

    const password = await question('Senha (mínimo 6 caracteres): ');
    if (!password.trim() || password.length < 6) {
      console.error('❌ Senha deve ter pelo menos 6 caracteres!');
      rl.close();
      process.exit(1);
    }

    console.log('\n⏳ Criando usuário...\n');

    // Se tiver service role key, criar diretamente
    if (supabaseServiceKey) {
      // Criar usuário usando Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email.trim(),
        password: password,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          name: nome.trim()
        }
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Criar perfil na tabela users
        const { error: profileError } = await supabase
          .from('users')
          .upsert([{
            id: authData.user.id,
            name: nome.trim(),
            email: email.trim(),
            role: 'admin',
            avatar: null
          }], {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('⚠️  Usuário criado no Auth, mas erro ao criar perfil:', profileError.message);
          console.log('💡 Você pode criar o perfil manualmente na tabela users do Supabase.');
        } else {
          console.log('✅ Usuário admin criado com sucesso!\n');
          console.log(`   Nome: ${nome.trim()}`);
          console.log(`   E-mail: ${email.trim()}`);
          console.log(`   Role: admin\n`);
          console.log('🎉 Agora você pode fazer login no sistema!');
        }
      }
    } else {
      // Sem service role key, usar signUp normal (requer confirmação de email)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: nome.trim()
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        // Criar perfil na tabela users
        const { error: profileError } = await supabase
          .from('users')
          .upsert([{
            id: data.user.id,
            name: nome.trim(),
            email: email.trim(),
            role: 'admin',
            avatar: null
          }], {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('⚠️  Usuário criado no Auth, mas erro ao criar perfil:', profileError.message);
        }

        console.log('✅ Usuário admin criado com sucesso!\n');
        console.log(`   Nome: ${nome.trim()}`);
        console.log(`   E-mail: ${email.trim()}`);
        console.log(`   Role: admin\n`);
        
        if (!data.session) {
          console.log('📧 Um e-mail de confirmação foi enviado para:', email.trim());
          console.log('💡 Verifique sua caixa de entrada e confirme o e-mail antes de fazer login.');
          console.log('💡 Ou desabilite a confirmação de email no Supabase Dashboard.\n');
        } else {
          console.log('🎉 Agora você pode fazer login no sistema!');
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Erro ao criar usuário:', error.message);
    
    if (error.message?.includes('User already registered')) {
      console.log('\n💡 Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.');
    } else if (error.message?.includes('Invalid API key')) {
      console.log('\n💡 Chave API inválida. Verifique suas variáveis de ambiente.');
      console.log('💡 Para criar usuários diretamente, use SUPABASE_SERVICE_ROLE_KEY no .env.local');
    }
  } finally {
    rl.close();
  }
  }

  await createAdmin();
}

// Executar função principal
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

