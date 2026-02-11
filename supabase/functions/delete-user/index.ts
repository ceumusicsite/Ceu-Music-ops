// Supabase Edge Function: delete-user
// Remove o usuário do Supabase Auth (requer Admin API / service role).
// O frontend deve remover o perfil da tabela `users` após chamar esta função.
//
// Requer que o chamador seja um usuário autenticado com role 'admin'.
// Secrets: SUPABASE_SERVICE_ROLE_KEY (automático), opcional SUPABASE_ANON_KEY para validar caller.

// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...(init.headers || {}),
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
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

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Unauthorized: missing Authorization' }, { status: 401 });
  }

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  if (!url || !serviceRoleKey) {
    return json({ error: 'Server configuration error' }, { status: 500 });
  }
  if (!anonKey) {
    return json(
      { error: 'SUPABASE_ANON_KEY not set. Add it in Supabase Dashboard > Edge Functions > delete-user > Secrets (use the same anon key as in Settings > API).' },
      { status: 500 }
    );
  }

  let body: { userId?: string };
  try {
    body = (await req.json()) as { userId?: string };
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const targetUserId = body?.userId;
  if (!targetUserId || typeof targetUserId !== 'string') {
    return json({ error: 'userId is required' }, { status: 400 });
  }

  // Validar que o chamador é admin (se temos anon key)
  if (anonKey) {
    const clientWithAuth = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: userError } = await clientWithAuth.auth.getUser();
    if (userError || !caller) {
      return json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const adminClient = createClient(url, serviceRoleKey);
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', caller.id)
      .single();
    if (profileError || !profile || profile.role !== 'admin') {
      return json({ error: 'Forbidden: admin only' }, { status: 403 });
    }
  }

  const adminClient = createClient(url, serviceRoleKey);
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);

  if (deleteError) {
    console.error('[delete-user] Auth delete error:', deleteError.message);
    return json(
      { error: 'Failed to delete user from auth', details: deleteError.message },
      { status: 400 }
    );
  }

  return json({ success: true });
});
