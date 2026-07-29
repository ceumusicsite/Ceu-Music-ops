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

interface RequestBody {
  assunto: string;
  conteudo: string;
  destinatarios_tipo: 'artistas' | 'produtores' | 'fornecedores' | 'todos' | 'custom' | 'list';
  destinatarios_custom?: string | string[];
  lista_id?: string;
  anexos?: Array<{ content: string; filename: string }>;
  remetente?: string;
}

interface Recipient {
  nome: string;
  email: string;
}

Deno.serve(async (req: Request) => {
  // CORS Preflight
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
    return json({ error: 'Unauthorized: missing Authorization header' }, { status: 401 });
  }

  // Obter chaves de ambiente
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  let resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';

  if (!url || !serviceRoleKey) {
    return json({ error: 'Server configuration error: missing Supabase environment variables' }, { status: 500 });
  }

  // 1. Validar Token do Usuário e Role (Admin/Executivo)
  const clientWithAuth = createClient(url, anonKey || serviceRoleKey, {
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

  if (profileError || !profile || !['admin', 'executivo', 'operador'].includes(profile.role)) {
    return json({ error: 'Forbidden: admin, executivo or operador role required' }, { status: 403 });
  }

  // Se a chave não estiver no ambiente Deno, buscar no Vault via RPC
  if (!resendApiKey) {
    const { data: keyFromDb, error: rpcError } = await clientWithAuth.rpc('get_resend_api_key');
    if (rpcError || !keyFromDb) {
      console.error('[send-bulk-emails] Failed to retrieve RESEND_API_KEY from Deno env or DB Vault:', rpcError?.message);
      return json({
        error: 'RESEND_API_KEY is not set. Please add it to your Supabase Edge Function Secrets or Database Vault.'
      }, { status: 500 });
    }
    resendApiKey = keyFromDb;
  }

  // 2. Parse do Corpo da Requisição
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { assunto, conteudo, destinatarios_tipo, destinatarios_custom, lista_id, anexos, remetente } = body;
  if (!assunto || !conteudo || !destinatarios_tipo) {
    return json({ error: 'Missing required fields: assunto, conteudo, destinatarios_tipo' }, { status: 400 });
  }

  const resendSender = remetente || Deno.env.get('RESEND_SENDER_EMAIL') || 'CEU Music Ops <onboarding@resend.dev>';

  // 3. Registrar a Campanha como Pendente no Banco de Dados
  const { data: campanha, error: insertError } = await adminClient
    .from('campanhas_email')
    .insert([
      {
        assunto,
        conteudo,
        destinatarios_tipo,
        status: 'pendente',
        total_destinatarios: 0,
        criado_por: caller.id,
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error('[send-bulk-emails] Error inserting campaign:', insertError.message);
    return json({ error: 'Failed to create campaign log', details: insertError.message }, { status: 500 });
  }

  const campanhaId = campanha.id;

  try {
    // 4. Atualizar status para "enviando"
    await adminClient
      .from('campanhas_email')
      .update({ status: 'enviando' })
      .eq('id', campanhaId);

    // 5. Buscar destinatários conforme o tipo
    const recipientsMap = new Map<string, Recipient>();

    if (destinatarios_tipo === 'artistas' || destinatarios_tipo === 'todos') {
      const { data: artistas } = await adminClient
        .from('artistas')
        .select('nome, contato_email')
        .not('contato_email', 'is', null);

      if (artistas) {
        artistas.forEach(a => {
          const email = a.contato_email?.trim().toLowerCase();
          if (email && email.includes('@')) {
            recipientsMap.set(email, { nome: a.nome, email });
          }
        });
      }
    }

    if (destinatarios_tipo === 'produtores' || destinatarios_tipo === 'todos') {
      const { data: produtores } = await adminClient
        .from('produtores')
        .select('nome, contato_email')
        .not('contato_email', 'is', null);

      if (produtores) {
        produtores.forEach(p => {
          const email = p.contato_email?.trim().toLowerCase();
          if (email && email.includes('@')) {
            recipientsMap.set(email, { nome: p.nome, email });
          }
        });
      }
    }

    if (destinatarios_tipo === 'fornecedores' || destinatarios_tipo === 'todos') {
      const { data: fornecedores } = await adminClient
        .from('fornecedores')
        .select('nome, contato_email')
        .not('contato_email', 'is', null);

      if (fornecedores) {
        fornecedores.forEach(f => {
          const email = f.contato_email?.trim().toLowerCase();
          if (email && email.includes('@')) {
            recipientsMap.set(email, { nome: f.nome, email });
          }
        });
      }
    }

    if (destinatarios_tipo === 'custom' && destinatarios_custom) {
      const customEmails = Array.isArray(destinatarios_custom)
        ? destinatarios_custom
        : typeof destinatarios_custom === 'string'
          ? (destinatarios_custom as string).split(',').map(e => e.trim())
          : [];

      customEmails.forEach(emailStr => {
        const email = emailStr?.trim().toLowerCase();
        if (email && email.includes('@')) {
          const username = email.split('@')[0];
          const nome = username.charAt(0).toUpperCase() + username.slice(1);
          recipientsMap.set(email, { nome, email });
        }
      });
    }

    if (destinatarios_tipo === 'list' && lista_id) {
      const { data: lista, error: listaError } = await adminClient
        .from('listas_transmissao')
        .select('emails')
        .eq('id', lista_id)
        .single();

      if (listaError || !lista) {
        throw new Error(`Failed to load transmission list: ${listaError?.message || 'List not found'}`);
      }

      const emailsList = lista.emails || [];
      emailsList.forEach(emailStr => {
        const email = emailStr?.trim().toLowerCase();
        if (email && email.includes('@')) {
          const username = email.split('@')[0];
          const nome = username.charAt(0).toUpperCase() + username.slice(1);
          recipientsMap.set(email, { nome, email });
        }
      });
    }

    const recipients = Array.from(recipientsMap.values());
    const totalDestinatarios = recipients.length;

    // Atualizar total na campanha
    await adminClient
      .from('campanhas_email')
      .update({ total_destinatarios: totalDestinatarios })
      .eq('id', campanhaId);

    if (totalDestinatarios === 0) {
      await adminClient
        .from('campanhas_email')
        .update({ status: 'enviado', erro_detalhes: 'Nenhum destinatário válido encontrado.' })
        .eq('id', campanhaId);
      return json({ success: true, message: 'No recipients found', totalSent: 0 });
    }

    const hasAttachments = anexos && anexos.length > 0;

    if (hasAttachments) {
      // 6a. Envio individual com anexos (Batch não aceita attachments)
      // Processamento em grupos de concorrência controlada para evitar timeouts
      const chunkedRecipients = [];
      const concurrencyChunkSize = 20;

      for (let i = 0; i < recipients.length; i += concurrencyChunkSize) {
        chunkedRecipients.push(recipients.slice(i, i + concurrencyChunkSize));
      }

      for (const group of chunkedRecipients) {
        const promises = group.map(async (r) => {
          const personalizedContent = conteudo.replace(/\{\{\s*nome\s*\}\}/gi, r.nome);
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: resendSender,
              to: r.email,
              subject: assunto,
              html: personalizedContent,
              attachments: anexos,
            }),
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Resend API Error (single with attachments): ${response.status} - ${errText}`);
          }
        });

        await Promise.all(promises);
      }
    } else {
      // 6b. Envio via lote otimizado (sem anexos)
      const emailsPayload = recipients.map(r => {
        const personalizedContent = conteudo.replace(/\{\{\s*nome\s*\}\}/gi, r.nome);
        return {
          from: resendSender,
          to: r.email,
          subject: assunto,
          html: personalizedContent,
        };
      });

      const chunkSize = 100;
      for (let i = 0; i < emailsPayload.length; i += chunkSize) {
        const chunk = emailsPayload.slice(i, i + chunkSize);

        const response = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify(chunk),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Resend API Error (batch): ${response.status} - ${errText}`);
        }
      }
    }

    // 8. Atualizar status para enviado com sucesso
    await adminClient
      .from('campanhas_email')
      .update({ status: 'enviado' })
      .eq('id', campanhaId);

    return json({ success: true, totalSent: totalDestinatarios });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[send-bulk-emails] Error executing email campaign:', message);

    await adminClient
      .from('campanhas_email')
      .update({
        status: 'erro',
        erro_detalhes: message,
      })
      .eq('id', campanhaId);

    return json({ error: 'Error sending emails', details: message }, { status: 500 });
  }
});
