// Script para verificar usuários no Supabase
// Execute com: node scripts/check-users.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Credenciais do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
  console.log('🔍 Verificando usuários...\n');
  
  try {
    // Listar usuários (requer service_role key, então vamos apenas verificar na tabela users)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('⚠️  A tabela "users" ainda não foi criada.');
        console.log('📝 Você precisa criar as tabelas no Supabase primeiro.\n');
        return;
      }
      throw error;
    }

    if (users && users.length > 0) {
      console.log(`✅ Encontrados ${users.length} usuário(s) cadastrado(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}\n`);
      });
    } else {
      console.log('📭 Nenhum usuário encontrado na tabela users.');
      console.log('📝 Você precisa criar o primeiro usuário através da página de registro.\n');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error.message);
  }
}

checkUsers();

