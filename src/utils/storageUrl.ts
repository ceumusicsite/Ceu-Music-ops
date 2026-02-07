/**
 * Utilitário para converter URLs do R2 S3 API (r2.cloudflarestorage.com) 
 * em URLs públicas (r2.dev) que funcionam em navegadores.
 * 
 * O endpoint *.r2.cloudflarestorage.com usa protocolo SSL incompatível com navegadores
 * (ERR_SSL_VERSION_OR_CIPHER_MISMATCH). A URL pública r2.dev funciona normalmente.
 */

const PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL as string | undefined;

/**
 * Extrai bucket e key de uma URL do R2 S3 API
 */
function parseR2S3Url(url: string): { bucket: string; key: string } | null {
  if (!url || typeof url !== 'string') return null;
  
  try {
    // Adicionar protocolo se ausente para parsing
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(urlWithProtocol);
    
    if (!parsed.hostname.includes('r2.cloudflarestorage.com')) {
      return null;
    }

    // Estilo virtual-hosted: bucket.accountId.r2.cloudflarestorage.com/key
    const hostParts = parsed.hostname.split('.');
    if (hostParts.length >= 4 && hostParts[1]?.length === 32) {
      const bucket = hostParts[0] || '';
      const key = parsed.pathname.replace(/^\//, '') || '';
      if (bucket && key) return { bucket, key };
    }

    // Estilo path: accountId.r2.cloudflarestorage.com/bucket/key
    const pathParts = parsed.pathname.replace(/^\//, '').split('/');
    if (pathParts.length >= 2) {
      const bucket = pathParts[0] || '';
      const key = pathParts.slice(1).join('/') || '';
      if (bucket && key) return { bucket, key };
    }
  } catch {
    // Ignorar erros de parsing
  }
  return null;
}

/**
 * Converte uma URL do R2 para URL pública acessível no navegador.
 * Retorna a URL original se não for R2 S3 ou se VITE_R2_PUBLIC_URL não estiver configurada.
 */
export function getBrowserViewableUrl(
  url: string | undefined,
  bucket?: string,
  key?: string
): string {
  if (!url) return '';
  
  // Se já é URL pública (r2.dev, Supabase, etc), retornar como está
  if (
    url.includes('r2.dev') ||
    url.includes('supabase') ||
    url.includes('youtube') ||
    url.includes('youtu.be') ||
    url.includes('cloudflarestream.com')
  ) {
    return url;
  }

  // Se é URL do R2 S3 API e temos publicUrl configurada
  if (PUBLIC_URL) {
    let bucketToUse = bucket;
    let keyToUse = key;

    if (!bucketToUse || !keyToUse) {
      const parsed = parseR2S3Url(url);
      if (parsed) {
        bucketToUse = parsed.bucket;
        keyToUse = parsed.key;
      }
    }

    if (bucketToUse && keyToUse) {
      return `${PUBLIC_URL.replace(/\/$/, '')}/${bucketToUse}/${keyToUse}`;
    }
  }

  return url;
}
