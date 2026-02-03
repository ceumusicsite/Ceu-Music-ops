/**
 * Utilitários para otimização de imagens
 */

/**
 * Gera uma URL de thumbnail para uma imagem
 * Por enquanto retorna a URL original, mas pode ser expandido para usar um CDN ou serviço de otimização
 */
export function getOptimizedImageUrl(
  src: string,
  width?: number,
  height?: number,
  quality: number = 80
): string {
  // Se for uma URL externa, retorna como está
  if (src.startsWith('http') || src.startsWith('data:')) {
    return src;
  }

  // Por enquanto retorna a URL original
  // Em produção, você pode usar um serviço como:
  // - Cloudflare Images
  // - Imgix
  // - Cloudinary
  // - Ou um endpoint próprio que redimensiona imagens
  
  return src;
}

/**
 * Gera um placeholder blur base64 para uma imagem
 */
export function generateBlurPlaceholder(width: number = 20, height: number = 20): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#374151;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1F2937;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <rect x="0" y="0" width="50%" height="50%" fill="#4B5563" opacity="0.3"/>
      <rect x="50%" y="50%" width="50%" height="50%" fill="#4B5563" opacity="0.3"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Preload de imagens críticas
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'high'): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = priority;
  
  // Verifica se já existe
  const existing = document.querySelector(`link[href="${src}"]`);
  if (!existing) {
    document.head.appendChild(link);
  }
}

/**
 * Preload múltiplas imagens
 */
export function preloadImages(srcs: string[], priority: 'high' | 'low' = 'high'): void {
  srcs.forEach((src, index) => {
    // Primeiras 3 com alta prioridade, resto com baixa
    preloadImage(src, index < 3 ? 'high' : 'low');
  });
}

/**
 * Verifica se o navegador suporta WebP
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Converte uma URL de imagem para WebP (se suportado)
 * Por enquanto retorna a URL original, mas pode ser expandido
 */
export async function getWebPUrl(src: string): Promise<string> {
  const webPSupported = await supportsWebP();
  
  if (!webPSupported || src.startsWith('data:') || src.startsWith('http')) {
    return src;
  }

  // Em produção, você pode converter para WebP no servidor ou usar um serviço
  // Por enquanto retorna a URL original
  return src;
}
