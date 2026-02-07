// Supabase Edge Function: stream-copy
// Cria um vídeo no Cloudflare Stream a partir de uma URL (ex: URL do R2).
//
// Secrets necessários (configurar no Supabase):
// - CLOUDFLARE_ACCOUNT_ID
// - CLOUDFLARE_STREAM_API_TOKEN
//
// Referências:
// - Overview: https://developers.cloudflare.com/stream/
// - Upload via link (copy): https://developers.cloudflare.com/stream/uploading-videos/upload-via-link/
// - API: https://developers.cloudflare.com/api/resources/stream/subresources/copy/methods/create/

type CopyRequest = {
  sourceUrl: string;
  name?: string;
  meta?: Record<string, unknown>;
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === 'OPTIONS') {
      // CORS preflight
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, { status: 405 });
    }

    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID') || '';
    const token = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN') || '';

    if (!accountId || !token) {
      return json(
        { error: 'Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_STREAM_API_TOKEN' },
        { status: 500 }
      );
    }

    let body: CopyRequest;
    try {
      body = (await req.json()) as CopyRequest;
    } catch {
      return json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body?.sourceUrl) {
      return json({ error: 'sourceUrl is required' }, { status: 400 });
    }

    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/copy`;
    const payload = {
      url: body.sourceUrl,
      meta: {
        name: body.name,
        ...(body.meta || {}),
      },
    };

    try {
      const res = await fetch(cfUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errMsg = data?.errors?.[0]?.message || data?.error || `HTTP ${res.status}`;
        return json(
          {
            error: 'Cloudflare Stream API error',
            status: res.status,
            details: { cloudflareMessage: errMsg, raw: data },
          },
          { status: 502 }
        );
      }

      const uid = data?.result?.uid;
      const readyToStream = data?.result?.readyToStream;

      if (!uid) {
        return json({ error: 'Cloudflare response missing uid', details: data }, { status: 502 });
      }

      return json(
        { uid, readyToStream },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      return json({ error: 'Failed to call Cloudflare Stream API', details: errMsg }, { status: 502 });
    }
  },
};

