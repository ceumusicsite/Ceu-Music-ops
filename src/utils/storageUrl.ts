/**
 * Utilitário para converter URLs do R2 S3 API (r2.cloudflarestorage.com) 
 * em URLs públicas (r2.dev) ou assinadas para visualização no navegador.
 *
 * Com bucket privado: use getViewableUrlAsync() ao abrir/copiar link para gerar URL assinada.
 * Com bucket público: VITE_R2_PUBLIC_URL + acesso público habilitado no R2.
 */

const PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL as string | undefined;
// No R2, a URL pública é por bucket; o path é só a key (não /bucket/key)
const R2_BUCKET_ANEXOS = (import.meta.env.VITE_R2_BUCKET_ANEXOS as string) || 'ceu-music-anexos';

/**
 * Extrai bucket e key de uma URL pública r2.dev.
 * No R2 a URL pública é por bucket: path é só a key (ex: pub-xxx.r2.dev/artistas/pasta/arquivo.wav).
 * Se a URL for do mesmo host que PUBLIC_URL, assumimos bucket anexos e path = key.
 */
function parseR2PublicUrl(url: string): { bucket: string; key: string } | null {
  if (!url || !url.includes('r2.dev')) return null;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const path = parsed.pathname.replace(/^\//, '').trim();
    if (!path) return null;
    const base = PUBLIC_URL ? new URL(PUBLIC_URL.replace(/\/$/, '') + '/').host : '';
    if (base && parsed.host === base) {
      return { bucket: R2_BUCKET_ANEXOS, key: path };
    }
    const parts = path.split('/');
    if (parts.length < 2) return null;
    return { bucket: parts[0], key: parts.slice(1).join('/') };
  } catch {
    return null;
  }
}

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
      const base = PUBLIC_URL.replace(/\/$/, '');
      // URL pública do R2 é por bucket: path é só a key (não /bucket/key)
      if (bucketToUse === R2_BUCKET_ANEXOS || bucketToUse === 'anexos') {
        return `${base}/${keyToUse}`;
      }
      return `${base}/${bucketToUse}/${keyToUse}`;
    }
  }

  return url;
}

/**
 * Retorna uma URL que funciona para abrir o arquivo no navegador (nova aba / copiar link).
 * Com bucket público: usa URL pública r2.dev (evita ERR_SSL_VERSION_OR_CIPHER_MISMATCH).
 * Com bucket privado: tenta URL assinada (pode falhar no navegador por SSL).
 */
export async function getViewableUrlAsync(
  url: string | undefined,
  bucket?: string,
  key?: string
): Promise<string> {
  if (!url) return '';

  let bucketToUse = bucket;
  let keyToUse = key;
  if ((!bucketToUse || !keyToUse) && url.includes('r2.dev')) {
    const parsed = parseR2PublicUrl(url);
    if (parsed) {
      bucketToUse = parsed.bucket;
      keyToUse = parsed.key;
    }
  }

  // Se temos PUBLIC_URL configurado, usar URL pública (r2.dev) - funciona no navegador
  // URLs assinadas do endpoint S3 (r2.cloudflarestorage.com) causam ERR_SSL_VERSION_OR_CIPHER_MISMATCH
  if (PUBLIC_URL && bucketToUse && keyToUse) {
    const base = PUBLIC_URL.replace(/\/$/, '');
    if (bucketToUse === R2_BUCKET_ANEXOS || bucketToUse === 'anexos') {
      return `${base}/${keyToUse}`;
    }
    return `${base}/${bucketToUse}/${keyToUse}`;
  }

  // Se não temos PUBLIC_URL, tentar URL assinada (pode falhar no navegador)
  if (bucketToUse && keyToUse) {
    try {
      const { getSignedUrlR2 } = await import('../lib/r2');
      return await getSignedUrlR2(bucketToUse, keyToUse, 3600); // 1h
    } catch {
      // Fallback para URL original
    }
  }

  return getBrowserViewableUrl(url, bucket, key);
}
