import { supabase } from '../../lib/supabase';
import type { CrmEmail, CrmPessoa, CrmTelefone } from './types';

/** Colunas da pessoa + relações que a lista e o detalhe sempre precisam. */
const SELECT_PESSOA = `
  *,
  organizacao:crm_organizations ( id, nome ),
  dono:users!crm_persons_dono_id_fkey ( id, name ),
  emails:crm_person_emails ( id, email, rotulo, principal ),
  telefones:crm_person_phones ( id, telefone, rotulo, principal )
`;

function mapPessoa(row: any): CrmPessoa {
  return {
    id: row.id,
    nome: row.nome,
    organizacao_id: row.organizacao_id,
    organizacao_nome: row.organizacao?.nome ?? null,
    dono_id: row.dono_id,
    dono_nome: row.dono?.name ?? null,
    cargo: row.cargo,
    foto_url: row.foto_url,
    endereco: row.endereco,
    cidade: row.cidade,
    estado: row.estado,
    aniversario: row.aniversario,
    observacoes: row.observacoes,
    custom_fields: row.custom_fields ?? {},
    emails: ordenarPrincipalPrimeiro(row.emails ?? []),
    telefones: ordenarPrincipalPrimeiro(row.telefones ?? []),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function ordenarPrincipalPrimeiro<T extends { principal?: boolean }>(itens: T[]): T[] {
  return [...itens].sort((a, b) => Number(b.principal) - Number(a.principal));
}

export async function listarPessoas(): Promise<CrmPessoa[]> {
  const { data, error } = await supabase
    .from('crm_persons')
    .select(SELECT_PESSOA)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapPessoa);
}

export async function buscarPessoa(id: string): Promise<CrmPessoa | null> {
  const { data, error } = await supabase
    .from('crm_persons')
    .select(SELECT_PESSOA)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapPessoa(data) : null;
}

export interface EntradaPessoa {
  nome: string;
  organizacao_id?: string | null;
  dono_id?: string | null;
  cargo?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  aniversario?: string | null;
  observacoes?: string | null;
  emails: CrmEmail[];
  telefones: CrmTelefone[];
}

export async function criarPessoa(entrada: EntradaPessoa): Promise<CrmPessoa> {
  const { emails, telefones, ...pessoa } = entrada;

  const { data, error } = await supabase
    .from('crm_persons')
    .insert(normalizarPessoa(pessoa))
    .select('id')
    .single();

  if (error) throw error;

  await salvarContatos(data.id, emails, telefones);
  const criada = await buscarPessoa(data.id);
  if (!criada) throw new Error('Pessoa criada não pôde ser recarregada');
  return criada;
}

export async function atualizarPessoa(id: string, entrada: EntradaPessoa): Promise<CrmPessoa> {
  const { emails, telefones, ...pessoa } = entrada;

  const { error } = await supabase
    .from('crm_persons')
    .update(normalizarPessoa(pessoa))
    .eq('id', id);

  if (error) throw error;

  await salvarContatos(id, emails, telefones);
  const atualizada = await buscarPessoa(id);
  if (!atualizada) throw new Error('Pessoa atualizada não pôde ser recarregada');
  return atualizada;
}

export async function excluirPessoas(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('crm_persons').delete().in('id', ids);
  if (error) throw error;
}

/** Campos de texto vazios viram NULL para não poluir a base com strings em branco. */
function normalizarPessoa(pessoa: Omit<EntradaPessoa, 'emails' | 'telefones'>) {
  const normalizado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(pessoa)) {
    normalizado[chave] = valor === '' ? null : valor;
  }
  return normalizado;
}

/**
 * E-mails e telefones são substituídos por completo a cada gravação:
 * é mais simples e seguro do que reconciliar linha a linha, e o volume é baixo.
 */
async function salvarContatos(personId: string, emails: CrmEmail[], telefones: CrmTelefone[]) {
  await supabase.from('crm_person_emails').delete().eq('person_id', personId);
  await supabase.from('crm_person_phones').delete().eq('person_id', personId);

  const emailsValidos = emails.filter((e) => e.email.trim() !== '');
  if (emailsValidos.length > 0) {
    const { error } = await supabase.from('crm_person_emails').insert(
      emailsValidos.map((e, indice) => ({
        person_id: personId,
        email: e.email.trim(),
        rotulo: e.rotulo,
        principal: e.principal || indice === 0,
      }))
    );
    if (error) throw error;
  }

  const telefonesValidos = telefones.filter((t) => t.telefone.trim() !== '');
  if (telefonesValidos.length > 0) {
    const { error } = await supabase.from('crm_person_phones').insert(
      telefonesValidos.map((t, indice) => ({
        person_id: personId,
        telefone: t.telefone.trim(),
        rotulo: t.rotulo,
        principal: t.principal || indice === 0,
      }))
    );
    if (error) throw error;
  }
}

/** Opções para os selects de vínculo (negócio -> pessoa de contato). */
export async function listarOpcoesPessoas(): Promise<{ id: string; nome: string }[]> {
  const { data, error } = await supabase.from('crm_persons').select('id, nome').order('nome');
  if (error) throw error;
  return data ?? [];
}
