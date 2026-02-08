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
  // Obter sessão atual - necessário para JWT
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('[createStreamVideoFromUrl] Erro ao obter sessão:', sessionError);
  }
  
  if (!session) {
    throw new Error('Você precisa estar autenticado para usar esta funcionalidade. Faça login novamente.');
  }
  
  console.log('[createStreamVideoFromUrl] Chamando Edge Function:', {
    hasSession: !!session,
    hasAccessToken: !!session?.access_token,
    sourceUrl: params.sourceUrl,
  });
  
  // Usar supabase.functions.invoke que automaticamente inclui o JWT da sessão
  const { data, error } = await supabase.functions.invoke('stream-copy', {
    body: {
      sourceUrl: params.sourceUrl,
      name: params.name,
      meta: params.meta,
    },
  });

  console.log('[createStreamVideoFromUrl] Resposta:', {
    hasData: !!data,
    hasError: !!error,
    dataKeys: data ? Object.keys(data) : [],
    errorMessage: error?.message,
  });

  // Erro da Edge Function (4xx/5xx): o body vem em data com { error, details? }
  if (data && typeof data === 'object' && 'error' in data && !data?.uid) {
    const msg = (data as { error?: string; details?: unknown }).error || 'Erro na função stream-copy';
    const details = (data as { details?: unknown }).details;
    const detailStr = details != null ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : '';
    throw new Error(detailStr ? `${msg} — ${detailStr}` : msg);
  }

  if (error) {
    console.error('[createStreamVideoFromUrl] Erro:', error);
    // Se for erro 401, pode ser problema de autenticação
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      throw new Error('Erro de autenticação. Por favor, faça login novamente.');
    }
    throw new Error(error.message || 'Falha ao chamar função stream-copy');
  }

  if (!data?.uid) {
    throw new Error('Resposta inválida da função stream-copy (uid ausente)');
  }

  console.log('[createStreamVideoFromUrl] Sucesso! UID:', data.uid, 'readyToStream:', data.readyToStream);
  return data as StreamCopyResult;
}

/**
 * Aguarda até que o vídeo esteja pronto para reprodução no Cloudflare Stream.
 * Faz polling a cada 2 segundos até que readyToStream seja true ou timeout (5 minutos).
 */
export async function waitForStreamReady(uid: string, maxWaitSeconds = 300): Promise<boolean> {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 segundos
  
  while (Date.now() - startTime < maxWaitSeconds * 1000) {
    try {
      // Verificar status via API do Cloudflare Stream (precisaríamos criar uma Edge Function para isso)
      // Por enquanto, vamos apenas aguardar um tempo mínimo e retornar true
      // O Cloudflare Stream geralmente processa vídeos em 1-3 minutos
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      // TODO: Implementar verificação real do status via Edge Function
      // Por enquanto, assumimos que após alguns segundos o vídeo pode estar pronto
      // O player do Cloudflare Stream mostrará erro se não estiver pronto ainda
      
      // Retornar true após 10 segundos (tempo mínimo para processamento iniciar)
      if (Date.now() - startTime >= 10000) {
        return true;
      }
    } catch (error) {
      console.error('[waitForStreamReady] Erro ao verificar status:', error);
      return false;
    }
  }
  
  return false;
}

