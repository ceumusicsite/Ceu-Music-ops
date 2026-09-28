import { supabase } from '../../lib/supabase';
import type { CrmAtividade, TipoAtividade } from './types';

const SELECT_ATIVIDADE = `
  *,
  dono:users!crm_activities_dono_id_fkey ( id, name ),
  negocio:crm_deals!crm_activities_deal_id_fkey ( id, titulo ),
  pessoa:crm_persons!crm_activities_person_id_fkey ( id, nome ),
  organizacao:crm_organizations!crm_activities_organizacao_id_fkey ( id, nome )
`;

export const TIPOS_ATIVIDADE: { valor: TipoAtividade; rotulo: string; icone: string }[] = [
  { valor: 'ligacao', rotulo: 'Chamada', icone: 'ri-phone-line' },
  { valor: 'reuniao', rotulo: 'Reunião', icone: 'ri-group-line' },
  { valor: 'tarefa', rotulo: 'Tarefa', icone: 'ri-check-line' },
  { valor: 'prazo', rotulo: 'Prazo', icone: 'ri-flag-line' },
  { valor: 'email', rotulo: 'E-mail', icone: 'ri-mail-line' },
  { valor: 'almoco', rotulo: 'Almoço', icone: 'ri-restaurant-line' },
];

export function infoTipo(tipo: TipoAtividade) {
  return TIPOS_ATIVIDADE.find((t) => t.valor === tipo) ?? TIPOS_ATIVIDADE[2];
}

function mapAtividade(row: any): CrmAtividade {
  return {
    id: row.id,
    tipo: row.tipo,
    assunto: row.assunto,
    nota: row.nota,
    local: row.local,
    data: row.data,
    hora: row.hora ? String(row.hora).slice(0, 5) : null,
    duracao_minutos: row.duracao_minutos,
    concluida: row.concluida,
    concluida_em: row.concluida_em,
    dono_id: row.dono_id,
    dono_nome: row.dono?.name ?? null,
    deal_id: row.deal_id,
    deal_titulo: row.negocio?.titulo ?? null,
    person_id: row.person_id,
    person_nome: row.pessoa?.nome ?? null,
    organizacao_id: row.organizacao_id,
    organizacao_nome: row.organizacao?.nome ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listarAtividades(): Promise<CrmAtividade[]> {
  const { data, error } = await supabase
    .from('crm_activities')
    .select(SELECT_ATIVIDADE)
    .order('data', { ascending: true, nullsFirst: false })
    .order('hora', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []).map(mapAtividade);
}

/** Atividades ligadas a um negócio, pessoa ou organização, para a linha do tempo. */
export async function listarAtividadesDe(
  campo: 'deal_id' | 'person_id' | 'organizacao_id',
  id: string
): Promise<CrmAtividade[]> {
  const { data, error } = await supabase
    .from('crm_activities')
    .select(SELECT_ATIVIDADE)
    .eq(campo, id)
    .order('concluida')
    .order('data', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []).map(mapAtividade);
}

export interface EntradaAtividade {
  tipo: TipoAtividade;
  assunto: string;
  nota?: string | null;
  local?: string | null;
  data?: string | null;
  hora?: string | null;
  duracao_minutos?: number | null;
  dono_id?: string | null;
  deal_id?: string | null;
  person_id?: string | null;
  organizacao_id?: string | null;
}

export async function criarAtividade(entrada: EntradaAtividade): Promise<void> {
  const { error } = await supabase.from('crm_activities').insert(normalizar(entrada));
  if (error) throw error;
}

export async function atualizarAtividade(id: string, entrada: EntradaAtividade): Promise<void> {
  const { error } = await supabase.from('crm_activities').update(normalizar(entrada)).eq('id', id);
  if (error) throw error;
}

export async function alternarConcluida(id: string, concluida: boolean): Promise<void> {
  const { error } = await supabase
    .from('crm_activities')
    .update({
      concluida,
      concluida_em: concluida ? new Date().toISOString() : null,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function excluirAtividades(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('crm_activities').delete().in('id', ids);
  if (error) throw error;
}

/** Quantas atividades estão pendentes e vencidas, para o selo do menu. */
export async function contarPendentes(): Promise<number> {
  const hoje = new Date().toISOString().slice(0, 10);
  const { count, error } = await supabase
    .from('crm_activities')
    .select('id', { count: 'exact', head: true })
    .eq('concluida', false)
    .lte('data', hoje);

  if (error) throw error;
  return count ?? 0;
}

export type PeriodoAtividade =
  | 'tudo'
  | 'para_fazer'
  | 'vencido'
  | 'hoje'
  | 'amanha'
  | 'esta_semana'
  | 'proxima_semana';

export const PERIODOS: { valor: PeriodoAtividade; rotulo: string }[] = [
  { valor: 'para_fazer', rotulo: 'Para fazer' },
  { valor: 'vencido', rotulo: 'Vencido' },
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'amanha', rotulo: 'Amanhã' },
  { valor: 'esta_semana', rotulo: 'Esta semana' },
  { valor: 'proxima_semana', rotulo: 'Próxima semana' },
  { valor: 'tudo', rotulo: 'Tudo' },
];

/** Filtra por período usando datas locais, não UTC, para "hoje" bater com o calendário do usuário. */
export function filtrarPorPeriodo(
  atividades: CrmAtividade[],
  periodo: PeriodoAtividade
): CrmAtividade[] {
  if (periodo === 'tudo') return atividades;

  const hoje = inicioDoDia(new Date());
  const amanha = somarDias(hoje, 1);
  const inicioSemana = somarDias(hoje, -((hoje.getDay() + 6) % 7)); // segunda-feira
  const fimSemana = somarDias(inicioSemana, 7);
  const fimProximaSemana = somarDias(inicioSemana, 14);

  return atividades.filter((atividade) => {
    if (periodo === 'para_fazer') return !atividade.concluida;

    if (!atividade.data) return false;
    const data = inicioDoDia(new Date(`${atividade.data}T00:00:00`));

    switch (periodo) {
      case 'vencido':
        return !atividade.concluida && data < hoje;
      case 'hoje':
        return data.getTime() === hoje.getTime();
      case 'amanha':
        return data.getTime() === amanha.getTime();
      case 'esta_semana':
        return data >= inicioSemana && data < fimSemana;
      case 'proxima_semana':
        return data >= fimSemana && data < fimProximaSemana;
      default:
        return true;
    }
  });
}

function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function somarDias(data: Date, dias: number): Date {
  const nova = new Date(data);
  nova.setDate(nova.getDate() + dias);
  return nova;
}

function normalizar(entrada: EntradaAtividade) {
  const normalizado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(entrada)) {
    normalizado[chave] = valor === '' ? null : valor;
  }
  return normalizado;
}
