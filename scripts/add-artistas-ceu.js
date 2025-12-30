// Script para adicionar os artistas da CEU Music ao Supabase
// Execute com: node scripts/add-artistas-ceu.js

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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Credenciais do Supabase não encontradas!');
  console.log('\n💡 Dica: Crie um arquivo .env.local na raiz do projeto com:');
  console.log('   VITE_PUBLIC_SUPABASE_URL=sua_url_aqui');
  console.log('   VITE_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=sua_service_key_aqui (opcional, mas recomendado)\n');
  process.exit(1);
}

// Usar service role key se disponível para bypass RLS
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey
);

// Lista de artistas da CEU Music
// Nota: As colunas reais no banco são: nome, nome_artistico, email, telefone, instagram, status, ar_responsavel, foto, bio
const artistas = [
  {
    nome: 'Alex Lucio',
    nome_artistico: 'Alex Lucio',
    status: 'ativo',
    bio: 'Artista: Alexsander Lucio'
  },
  {
    nome: 'Na Graça',
    nome_artistico: 'Na Graça',
    status: 'ativo'
  },
  {
    nome: 'No Santuário',
    nome_artistico: 'No Santuário',
    status: 'ativo'
  },
  {
    nome: 'Debora Lopes',
    nome_artistico: 'Debora Lopes',
    status: 'ativo'
  },
  {
    nome: 'Caio Torres',
    nome_artistico: 'Caio Torres',
    status: 'ativo'
  },
  {
    nome: 'Nicole Lavinia',
    nome_artistico: 'Nicole Lavinia',
    status: 'ativo'
  },
  {
    nome: 'Maria Pita',
    nome_artistico: 'Maria Pita',
    status: 'ativo'
  },
  {
    nome: 'William Soares',
    nome_artistico: 'William Soares',
    status: 'ativo'
  },
  {
    nome: 'Martinha',
    nome_artistico: 'Martinha',
    status: 'ativo'
  },
  {
    nome: 'Kaka Tavares',
    nome_artistico: 'Kaka Tavares',
    status: 'ativo'
  }
];

async function addArtistas() {
  console.log('🎵 Adicionando Artistas da CEU Music\n');

  // Verificar se a tabela existe
  try {
    const { error: testError } = await supabase
      .from('artistas')
      .select('id')
      .limit(1);

    if (testError) {
      if (testError.code === 'PGRST116' || testError.message.includes('relation') || testError.message.includes('does not exist')) {
        console.error('❌ Erro: A tabela "artistas" não existe no Supabase!');
        console.log('💡 Você precisa criar a tabela no Supabase primeiro.\n');
        process.exit(1);
      }
      throw testError;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error.message);
    process.exit(1);
  }

  let sucesso = 0;
  let erros = 0;
  let ignorados = 0;
  const errosDetalhes = [];

  // Adicionar cada artista
  for (let i = 0; i < artistas.length; i++) {
    const artista = artistas[i];

    try {
      // Verificar se o artista já existe (por nome)
      const { data: existing } = await supabase
        .from('artistas')
        .select('id, nome')
        .eq('nome', artista.nome)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`⏭️  [${i + 1}/${artistas.length}] ${artista.nome}: Já existe no banco`);
        ignorados++;
        continue;
      }

      // Inserir artista
      const { error: insertError } = await supabase
        .from('artistas')
        .insert([artista]);

      if (insertError) {
        throw insertError;
      }

      console.log(`✅ [${i + 1}/${artistas.length}] ${artista.nome}: Adicionado com sucesso`);
      sucesso++;
    } catch (error) {
      console.log(`❌ [${i + 1}/${artistas.length}] ${artista.nome}: Erro - ${error.message}`);
      erros++;
      errosDetalhes.push({
        artista: artista.nome,
        erro: error.message
      });
    }
  }

  // Resumo
  console.log('\n' + '='.repeat(50));
  console.log('📊 Resumo:');
  console.log(`   ✅ Adicionados: ${sucesso}`);
  console.log(`   ⏭️  Já existiam: ${ignorados}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log('='.repeat(50) + '\n');

  if (erros > 0 && errosDetalhes.length > 0) {
    console.log('🔍 Detalhes dos erros:');
    errosDetalhes.forEach(({ artista, erro }) => {
      console.log(`   - ${artista}: ${erro}`);
    });
    console.log('');
  }

  if (sucesso > 0) {
    console.log('🎉 Artistas adicionados! Eles estão disponíveis no sistema.');
  }
}

addArtistas().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

