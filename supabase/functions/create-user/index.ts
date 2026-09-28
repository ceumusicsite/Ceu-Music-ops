// Supabase Edge Function: create-user
// Cria um usuário no Supabase Auth e o perfil correspondente em `users`.
//
// Existe porque o caminho antigo chamava supabase.auth.signUp() no navegador do
// admin: como a confirmação de e-mail está desligada, o signUp devolve sessão na
// hora e TROCAVA a sessão do admin pela do usuário recém-criado. Aqui a criação
// acontece no servidor, com service role, e a sessão do admin fica intacta.
//
// Requer que o chamador seja um usuário autenticado com role 'admin'.
// Secret: SUPABASE_SERVICE_ROLE_KEY (automático no ambiente de Edge Functions).

// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PAPEIS_VALIDOS = ['admin', 'executivo', 'ar', 'producao', 'financeiro', 'viewer', 'operador'];

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
  if (!url || !serviceRoleKey) {
    return json({ error: 'Server configuration error' }, { status: 500 });
  }

  const adminClient = createClient(url, serviceRoleKey);

  // Valida o chamador direto pelo JWT, sem depender do secret da anon key.
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: { user: caller }, error: callerError } = await adminClient.auth.getUser(token);
  if (callerError || !caller) {
    return json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const { data: perfilChamador, error: perfilError } = await adminClient
    .from('users')
    .select('role')
    .eq('id', caller.id)
    .single();

  if (perfilError || perfilChamador?.role !== 'admin') {
    return json({ error: 'Forbidden: admin only' }, { status: 403 });
  }

  let body: { email?: string; password?: string; name?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;
  const name = body.name?.trim();
  const role = body.role ?? 'operador';

  if (!email || !password || !name) {
    return json({ error: 'email, password e name são obrigatórios' }, { status: 400 });
  }
  if (password.length < 6) {
    return json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
  }
  if (!PAPEIS_VALIDOS.includes(role)) {
    return json({ error: `role inválido: ${role}` }, { status: 400 });
  }

  const { data: criado, error: criarError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (criarError || !criado.user) {
    console.error('[create-user] Auth create error:', criarError?.message);
    return json(
      { error: 'Falha ao criar usuário no Auth', details: criarError?.message },
      { status: 400 }
    );
  }

  const { error: perfilInsertError } = await adminClient
    .from('users')
    .upsert([{ id: criado.user.id, name, email, role, status: 'approved', avatar: null }], {
      onConflict: 'id',
    });

  if (perfilInsertError) {
    // Desfaz a conta de Auth para não deixar usuário órfão, sem perfil.
    await adminClient.auth.admin.deleteUser(criado.user.id);
    console.error('[create-user] Profile insert error:', perfilInsertError.message);
    return json(
      { error: 'Falha ao criar o perfil do usuário', details: perfilInsertError.message },
      { status: 400 }
    );
  }

  return json({ success: true, userId: criado.user.id });
});
