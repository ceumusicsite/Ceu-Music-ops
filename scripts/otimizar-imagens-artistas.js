/**
 * Script para otimizar imagens dos artistas
 * 
 * Requisitos:
 * npm install sharp --save-dev
 * 
 * Uso:
 * node --input-type=commonjs scripts/otimizar-imagens-artistas.js
 * OU renomeie para .cjs
 */

const fs = require('fs');
const path = require('path');

// Verifica se sharp está instalado
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Erro: sharp não está instalado.');
  console.log('📦 Instale com: npm install sharp --save-dev');
  console.log('💡 Execute com: node --input-type=commonjs scripts/otimizar-imagens-artistas.js');
  process.exit(1);
}

const ARTISTAS_DIR = path.join(__dirname, '../public/artistas');
const TARGET_WIDTH = 416; // 2x do tamanho de exibição (208px) para retina
const TARGET_HEIGHT = 512; // 2x do tamanho de exibição (256px) para retina
const QUALITY = 80; // Qualidade JPEG/WebP (0-100)
const THUMBNAIL_SIZE = 20; // Tamanho do thumbnail para blur

// Mapeamento de arquivos de imagem por artista
const artistasImagens = {
  'alex-lucio': 'IMG_3735.jpg',
  'caio-torres': 'IMG_0273.jpg',
  'debora-lopes': 'debora-lopes.png',
  'gabriel-magalhaes': 'IMG_4165.jpg',
  'george-lean': 'IMG_1982.jpg',
  'kaka-tavares': 'IMG_3648.jpg',
  'maria-pita': 'IMG_4240.jpg',
  'martinha': 'Gemini_Generated_Image_o5dhzho5dhzho5dh (1).png',
  'na graca': 'na graca.png',
  'nicole-lavinia': 'IMG_3996.jpg',
  'no santuario': 'IMG_0090.jpg',
  'rachel-malafaia': 'IMG_5693.jpg',
  'william-soares': 'IMG_4092.jpg',
};

async function otimizarImagem(artistaDir, nomeArquivo) {
  const caminhoOriginal = path.join(artistaDir, nomeArquivo);
  
  if (!fs.existsSync(caminhoOriginal)) {
    console.warn(`⚠️  Arquivo não encontrado: ${caminhoOriginal}`);
    return null;
  }

  const nomeSemExt = path.parse(nomeArquivo).name;
  const ext = path.parse(nomeArquivo).ext.toLowerCase();
  
  // Caminhos de saída
  const caminhoOtimizado = path.join(artistaDir, `${nomeSemExt}-optimized.webp`);
  const caminhoThumbnail = path.join(artistaDir, `${nomeSemExt}-thumb.jpg`);

  try {
    // Estatísticas do arquivo original
    const statsOriginal = fs.statSync(caminhoOriginal);
    const tamanhoOriginalMB = (statsOriginal.size / 1024 / 1024).toFixed(2);

    console.log(`\n📸 Processando: ${nomeArquivo} (${tamanhoOriginalMB} MB)`);

    // Carregar imagem
    const imagem = sharp(caminhoOriginal);

    // Obter metadados
    const metadata = await imagem.metadata();
    console.log(`   Dimensões originais: ${metadata.width}x${metadata.height}`);

    // 1. Criar versão otimizada (WebP)
    await imagem
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: QUALITY })
      .toFile(caminhoOtimizado);

    const statsOtimizado = fs.statSync(caminhoOtimizado);
    const tamanhoOtimizadoMB = (statsOtimizado.size / 1024 / 1024).toFixed(2);
    const reducao = ((1 - statsOtimizado.size / statsOriginal.size) * 100).toFixed(1);
    
    console.log(`   ✅ Otimizada: ${caminhoOtimizado}`);
    console.log(`   📊 Tamanho: ${tamanhoOtimizadoMB} MB (redução de ${reducao}%)`);

    // 2. Criar thumbnail para blur
    await sharp(caminhoOriginal)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 50 })
      .blur(10)
      .toFile(caminhoThumbnail);

    const statsThumb = fs.statSync(caminhoThumbnail);
    const tamanhoThumbKB = (statsThumb.size / 1024).toFixed(2);
    
    console.log(`   ✅ Thumbnail: ${caminhoThumbnail} (${tamanhoThumbKB} KB)`);

    return {
      original: tamanhoOriginalMB,
      otimizada: tamanhoOtimizadoMB,
      thumbnail: tamanhoThumbKB,
      reducao: parseFloat(reducao),
    };
  } catch (error) {
    console.error(`   ❌ Erro ao processar ${nomeArquivo}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Iniciando otimização de imagens dos artistas...\n');

  if (!fs.existsSync(ARTISTAS_DIR)) {
    console.error(`❌ Diretório não encontrado: ${ARTISTAS_DIR}`);
    process.exit(1);
  }

  const resultados = [];
  let totalOriginal = 0;
  let totalOtimizado = 0;

  for (const [artista, arquivo] of Object.entries(artistasImagens)) {
    const artistaDir = path.join(ARTISTAS_DIR, artista);
    
    if (!fs.existsSync(artistaDir)) {
      console.warn(`⚠️  Diretório não encontrado: ${artistaDir}`);
      continue;
    }

    const resultado = await otimizarImagem(artistaDir, arquivo);
    if (resultado) {
      resultados.push({ artista, ...resultado });
      totalOriginal += parseFloat(resultado.original);
      totalOtimizado += parseFloat(resultado.otimizada);
    }
  }

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA OTIMIZAÇÃO');
  console.log('='.repeat(60));
  console.log(`Total de imagens processadas: ${resultados.length}`);
  console.log(`Tamanho original total: ${totalOriginal.toFixed(2)} MB`);
  console.log(`Tamanho otimizado total: ${totalOtimizado.toFixed(2)} MB`);
  console.log(`Redução total: ${((1 - totalOtimizado / totalOriginal) * 100).toFixed(1)}%`);
  console.log(`Economia de banda: ${(totalOriginal - totalOtimizado).toFixed(2)} MB`);
  console.log('\n✅ Otimização concluída!');
  console.log('\n📝 Próximos passos:');
  console.log('   1. Teste as imagens otimizadas no navegador');
  console.log('   2. Se estiver tudo ok, atualize as URLs no código para usar "-optimized.webp"');
  console.log('   3. (Opcional) Faça backup das imagens originais antes de removê-las');
}

main().catch(console.error);
