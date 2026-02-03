# Script para Otimizar Imagens dos Artistas

Este documento descreve como otimizar as imagens dos artistas para melhorar o desempenho.

## Problema Atual

As imagens dos artistas estão muito grandes (13-20 MB cada), o que causa:
- Carregamento lento da página
- Alto consumo de banda
- Má experiência do usuário

## Solução Recomendada

### Opção 1: Usar Ferramenta Online (Mais Rápido)

1. Acesse https://squoosh.app/ ou https://tinypng.com/
2. Faça upload de cada imagem
3. Redimensione para 416x512px (2x do tamanho de exibição para retina)
4. Comprima para ~80% de qualidade
5. Salve como WebP (se possível) ou JPG otimizado
6. Substitua as imagens originais

### Opção 2: Usar Script Node.js (Automático)

Crie um script usando `sharp` ou `jimp` para:
- Redimensionar para 416x512px
- Comprimir para ~80% de qualidade
- Gerar versões WebP
- Criar thumbnails pequenos (20x20px) para blur-up

### Opção 3: Usar Cloudflare Images (Melhor para Produção)

Se você usar Cloudflare Images:
- Upload automático das imagens
- Otimização automática
- Geração de múltiplos tamanhos
- Suporte a WebP/AVIF automático
- CDN global

## Tamanhos Recomendados

- **Card de artista**: 416x512px (2x para retina) - ~50-100 KB
- **Thumbnail blur**: 20x20px - ~1-2 KB
- **Formato**: WebP (com fallback JPG)

## Estrutura de Pastas Sugerida

```
public/artistas/
  ├── alex-lucio/
  │   ├── IMG_3735.jpg (original - pode manter)
  │   ├── IMG_3735-optimized.webp (otimizada)
  │   └── IMG_3735-thumb.jpg (thumbnail para blur)
  └── ...
```

## Nota

O componente `OptimizedImage` já está preparado para usar imagens otimizadas quando disponíveis. Basta substituir as URLs no código quando as imagens otimizadas estiverem prontas.
