import { supabase } from '../lib/supabase';

export interface StreamCopyResult {
  uid: string;
  readyToStream?: boolean;
}

/**
 * Base URL do player do Cloudflare Stream, ex:
 * - https://customer-abc123.cloudflarestream.com
 */
export function getStreamCustomerBaseUrl(): string {
  const base = import.meta.env.VITE_STREAM_CUSTOMER_BASE_URL as string | undefined;
  if (!base) return '';
  return base.replace(/\/+$/, '');
}

export function getStreamIframeUrl(uid: string): string | null {
  const base = getStreamCustomerBaseUrl();
  if (!base) return null;
  return `${base}/${uid}/iframe`;
}

/**
 * Cria um vídeo no Cloudflare Stream a partir de uma URL (R2).
 * Implementação via Supabase Edge Function para não expor tokens da Cloudflare no frontend.
 */
export async function createStreamVideoFromUrl(params: {
  sourceUrl: string;
  name?: string;
  meta?: Record<string, unknown>;
}): Promise<StreamCopyResult> {
  const { data, error } = await supabase.functions.invoke('stream-copy', {
    body: {
      sourceUrl: params.sourceUrl,
      name: params.name,
      meta: params.meta,
    },
  });

  // Erro da Edge Function (4xx/5xx): o body vem em data com { error, details? }
  if (data && typeof data === 'object' && 'error' in data && !data?.uid) {
    const msg = (data as { error?: string; details?: unknown }).error || 'Erro na função stream-copy';
    const details = (data as { details?: unknown }).details;
    const detailStr = details != null ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : '';
    throw new Error(detailStr ? `${msg} — ${detailStr}` : msg);
  }

  if (error) {
    throw new Error(error.message || 'Falha ao chamar função stream-copy');
  }

  if (!data?.uid) {
    throw new Error('Resposta inválida da função stream-copy (uid ausente)');
  }

  return data as StreamCopyResult;
}

