// Script para importar artistas de um arquivo JSON para o Supabase
// Execute com: node scripts/import-artistas.js [caminho-do-json]
// Se não especificar o caminho, procurará por 'artistas.json' na raiz do projeto

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Credenciais do Supabase não encontradas!');
  console.log('\n💡 Dica: Crie um arquivo .env.local na raiz do projeto com:');
  console.log('   VITE_PUBLIC_SUPABASE_URL=sua_url_aqui');
  console.log('   VITE_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para mapear dados do JSON para a estrutura do banco
function mapArtistaData(jsonArtista) {
  // Campos obrigatórios do sistema
  const artista = {
    nome: jsonArtista.nome || jsonArtista.name || '',
    genero: jsonArtista.genero || jsonArtista.genre || jsonArtista.genero_musical || '',
    status: jsonArtista.status || 'ativo',
    contato_email: jsonArtista.contato_email || jsonArtista.email || jsonArtista.contato?.email || '',
    contato_telefone: jsonArtista.contato_telefone || jsonArtista.telefone || jsonArtista.contato?.telefone || null,
    observacoes_internas: null
  };

  // Adicionar informações extras nas observações se disponíveis
  const observacoes = [];
  
  if (jsonArtista.biografia) {
    observacoes.push(`Biografia: ${jsonArtista.biografia}`);
  }
  
  if (jsonArtista.redes_sociais) {
    const redes = [];
    if (jsonArtista.redes_sociais.instagram) redes.push(`Instagram: ${jsonArtista.redes_sociais.instagram}`);
    if (jsonArtista.redes_sociais.spotify) redes.push(`Spotify: ${jsonArtista.redes_sociais.spotify}`);
    if (jsonArtista.redes_sociais.youtube) redes.push(`YouTube: ${jsonArtista.redes_sociais.youtube}`);
    if (redes.length > 0) {
      observacoes.push(`Redes Sociais: ${redes.join(', ')}`);
    }
  }

  if (jsonArtista.seguidores) {
    const seguidores = [];
    if (jsonArtista.seguidores.instagram) seguidores.push(`IG: ${jsonArtista.seguidores.instagram}`);
    if (jsonArtista.seguidores.spotify) seguidores.push(`Spotify: ${jsonArtista.seguidores.spotify}`);
    if (jsonArtista.seguidores.youtube) seguidores.push(`YT: ${jsonArtista.seguidores.youtube}`);
    if (seguidores.length > 0) {
      observacoes.push(`Seguidores: ${seguidores.join(', ')}`);
    }
  }

  if (observacoes.length > 0) {
    artista.observacoes_internas = observacoes.join('\n\n');
  }

  return artista;
}

async function importArtistas() {
  console.log('🎵 Importando Artistas da CEU Music\n');

  // Obter caminho do arquivo JSON
  const jsonPath = process.argv[2] || join(__dirname, '../artistas.json');

  let artistasData;
  try {
    console.log(`📂 Lendo arquivo: ${jsonPath}\n`);
    const fileContent = readFileSync(jsonPath, 'utf-8');
    artistasData = JSON.parse(fileContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`❌ Erro: Arquivo não encontrado: ${jsonPath}`);
      console.log('\n💡 Dica: Coloque o arquivo JSON na raiz do projeto como "artistas.json"');
      console.log('   ou especifique o caminho: node scripts/import-artistas.js caminho/para/artistas.json\n');
    } else if (error instanceof SyntaxError) {
      console.error('❌ Erro: Arquivo JSON inválido!');
      console.error(`   ${error.message}\n`);
    } else {
      console.error('❌ Erro ao ler arquivo:', error.message);
    }
    process.exit(1);
  }

  // Garantir que é um array
  if (!Array.isArray(artistasData)) {
    if (artistasData.artistas && Array.isArray(artistasData.artistas)) {
      artistasData = artistasData.artistas;
    } else {
      console.error('❌ Erro: O JSON deve conter um array de artistas ou um objeto com propriedade "artistas"');
      process.exit(1);
    }
  }

  console.log(`✅ Encontrados ${artistasData.length} artista(s) no arquivo\n`);

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
  const errosDetalhes = [];

  // Importar cada artista
  for (let i = 0; i < artistasData.length; i++) {
    const jsonArtista = artistasData[i];
    const artista = mapArtistaData(jsonArtista);

    // Validar campos obrigatórios
    if (!artista.nome || !artista.genero || !artista.contato_email) {
      console.log(`⚠️  [${i + 1}/${artistasData.length}] ${artista.nome || 'Sem nome'}: Campos obrigatórios faltando (nome, genero ou email)`);
      erros++;
      errosDetalhes.push({
        artista: artista.nome || 'Sem nome',
        erro: 'Campos obrigatórios faltando'
      });
      continue;
    }

    try {
      // Verificar se o artista já existe (por nome ou email)
      const { data: existing } = await supabase
        .from('artistas')
        .select('id, nome')
        .or(`nome.eq.${artista.nome},contato_email.eq.${artista.contato_email}`)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`⏭️  [${i + 1}/${artistasData.length}] ${artista.nome}: Já existe no banco (${existing[0].nome})`);
        continue;
      }

      // Inserir artista
      const { error: insertError } = await supabase
        .from('artistas')
        .insert([artista]);

      if (insertError) {
        throw insertError;
      }

      console.log(`✅ [${i + 1}/${artistasData.length}] ${artista.nome}: Importado com sucesso`);
      sucesso++;
    } catch (error) {
      console.log(`❌ [${i + 1}/${artistasData.length}] ${artista.nome}: Erro - ${error.message}`);
      erros++;
      errosDetalhes.push({
        artista: artista.nome,
        erro: error.message
      });
    }
  }

  // Resumo
  console.log('\n' + '='.repeat(50));
  console.log('📊 Resumo da Importação:');
  console.log(`   ✅ Sucesso: ${sucesso}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log(`   ⏭️  Ignorados (já existem): ${artistasData.length - sucesso - erros}`);
  console.log('='.repeat(50) + '\n');

  if (erros > 0 && errosDetalhes.length > 0) {
    console.log('🔍 Detalhes dos erros:');
    errosDetalhes.forEach(({ artista, erro }) => {
      console.log(`   - ${artista}: ${erro}`);
    });
    console.log('');
  }

  if (sucesso > 0) {
    console.log('🎉 Importação concluída! Os artistas estão disponíveis no sistema.');
  }
}

importArtistas().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

