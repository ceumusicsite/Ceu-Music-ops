// Script para importar artistas de um arquivo CSV ou JSON
// Execute com: node scripts/import-artistas.js <arquivo.csv|arquivo.json>

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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para processar CSV
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const artistas = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const artista = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      if (header.includes('nome') || header.includes('name')) {
        artista.nome = value;
      } else if (header.includes('gênero') || header.includes('genero') || header.includes('genre')) {
        artista.genero = value;
      } else if (header.includes('email') || header.includes('e-mail')) {
        artista.contato_email = value;
      } else if (header.includes('telefone') || header.includes('phone') || header.includes('tel')) {
        artista.contato_telefone = value;
      } else if (header.includes('status')) {
        artista.status = value || 'ativo';
      } else if (header.includes('observa') || header.includes('note') || header.includes('obs')) {
        artista.observacoes_internas = value;
      }
    });
    
    if (artista.nome && artista.contato_email) {
      artistas.push(artista);
    }
  }
  
  return artistas;
}

// Função para processar JSON
function parseJSON(text) {
  const data = JSON.parse(text);
  const artistas = [];
  
  const items = Array.isArray(data) ? data : (data.artistas || data.artists || []);
  
  items.forEach((item) => {
    const artista = {
      nome: item.nome || item.name || item.artist_name || '',
      genero: item.genero || item.genero_musical || item.genre || '',
      contato_email: item.contato_email || item.email || item.contato?.email || '',
      contato_telefone: item.contato_telefone || item.telefone || item.phone || item.contato?.telefone || '',
      status: item.status || 'ativo',
      observacoes_internas: item.observacoes_internas || item.observacoes || item.notes || ''
    };
    
    if (artista.nome && artista.contato_email) {
      artistas.push(artista);
    }
  });
  
  return artistas;
}

async function importArtistas() {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('❌ Erro: Especifique o caminho do arquivo CSV ou JSON');
    console.log('Uso: node scripts/import-artistas.js <arquivo.csv|arquivo.json>');
    process.exit(1);
  }
  
  try {
    console.log(`📂 Lendo arquivo: ${filePath}\n`);
    const fileContent = readFileSync(filePath, 'utf-8');
    
    // Determinar tipo de arquivo
    const isCSV = filePath.toLowerCase().endsWith('.csv');
    const isJSON = filePath.toLowerCase().endsWith('.json');
    
    if (!isCSV && !isJSON) {
      throw new Error('Arquivo deve ser CSV (.csv) ou JSON (.json)');
    }
    
    // Processar arquivo
    console.log(`🔄 Processando arquivo ${isCSV ? 'CSV' : 'JSON'}...`);
    const artistas = isCSV ? parseCSV(fileContent) : parseJSON(fileContent);
    
    if (artistas.length === 0) {
      throw new Error('Nenhum artista válido encontrado no arquivo');
    }
    
    console.log(`✅ ${artistas.length} artista(s) encontrado(s) no arquivo\n`);
    
    // Verificar artistas existentes
    console.log('🔍 Verificando artistas existentes...');
    const { data: existingArtistas } = await supabase
      .from('artistas')
      .select('contato_email');
    
    const existingEmails = new Set((existingArtistas || []).map(a => a.contato_email.toLowerCase()));
    
    // Importar artistas
    console.log('📤 Importando artistas...\n');
    let successCount = 0;
    let skipCount = 0;
    const errors = [];
    
    for (const artista of artistas) {
      try {
        // Pular se já existe
        if (existingEmails.has(artista.contato_email.toLowerCase())) {
          console.log(`⏭️  Pulando: ${artista.nome} (email já existe)`);
          skipCount++;
          continue;
        }
        
        const { error } = await supabase
          .from('artistas')
          .insert([{
            nome: artista.nome,
            genero: artista.genero || 'Não especificado',
            status: artista.status || 'ativo',
            contato_email: artista.contato_email,
            contato_telefone: artista.contato_telefone || null,
            observacoes_internas: artista.observacoes_internas || null
          }]);
        
        if (error) {
          errors.push(`${artista.nome}: ${error.message}`);
          console.log(`❌ Erro: ${artista.nome} - ${error.message}`);
        } else {
          successCount++;
          existingEmails.add(artista.contato_email.toLowerCase());
          console.log(`✅ Importado: ${artista.nome}`);
        }
      } catch (error) {
        errors.push(`${artista.nome}: ${error.message}`);
        console.log(`❌ Erro: ${artista.nome} - ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Resumo da Importação:');
    console.log(`   ✅ Importados: ${successCount}`);
    console.log(`   ⏭️  Pulados: ${skipCount}`);
    console.log(`   ❌ Erros: ${errors.length}`);
    console.log('='.repeat(50));
    
    if (errors.length > 0) {
      console.log('\n⚠️  Erros encontrados:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (successCount > 0) {
      console.log('\n✅ Importação concluída com sucesso!');
    }
  } catch (error) {
    console.error('\n❌ Erro ao importar artistas:', error.message);
    process.exit(1);
  }
}

importArtistas();

