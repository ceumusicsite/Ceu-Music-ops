import { supabase } from '../../lib/supabase';
import type { CrmEntidade } from './types';

export type TipoCampo =
  | 'texto'
  | 'texto_longo'
  | 'numero'
  | 'moeda'
  | 'data'
  | 'hora'
  | 'lista_unica'
  | 'lista_multipla'
  | 'usuario'
  | 'telefone'
  | 'endereco'
  | 'checkbox';

export const TIPOS_CAMPO: { valor: TipoCampo; rotulo: string; temOpcoes?: boolean }[] = [
  { valor: 'texto', rotulo: 'Texto' },
  { valor: 'texto_longo', rotulo: 'Texto longo' },
  { valor: 'numero', rotulo: 'Número' },
  { valor: 'moeda', rotulo: 'Moeda' },
  { valor: 'data', rotulo: 'Data' },
  { valor: 'hora', rotulo: 'Hora' },
  { valor: 'lista_unica', rotulo: 'Lista (uma opção)', temOpcoes: true },
  { valor: 'lista_multipla', rotulo: 'Lista (várias opções)', temOpcoes: true },
  { valor: 'usuario', rotulo: 'Usuário' },
  { valor: 'telefone', rotulo: 'Telefone' },
  { valor: 'endereco', rotulo: 'Endereço' },
  { valor: 'checkbox', rotulo: 'Caixa de seleção' },
];

export function tipoTemOpcoes(tipo: TipoCampo): boolean {
  return TIPOS_CAMPO.find((t) => t.valor === tipo)?.temOpcoes === true;
}

export interface CrmCampoPersonalizado {
  id: string;
  entidade: CrmEntidade;
  nome: string;
  chave: string;
  tipo: TipoCampo;
  opcoes: string[];
  obrigatorio: boolean;
  ordem: number;
  ativo: boolean;
}

export async function listarCampos(entidade: CrmEntidade): Promise<CrmCampoPersonalizado[]> {
  const { data, error } = await supabase
    .from('crm_custom_fields')
    .select('*')
    .eq('entidade', entidade)
    .eq('ativo', true)
    .order('ordem');

  if (error) throw error;
  return (data ?? []).map(mapCampo);
}

export async function listarTodosOsCampos(
  entidade: CrmEntidade
): Promise<CrmCampoPersonalizado[]> {
  const { data, error } = await supabase
    .from('crm_custom_fields')
    .select('*')
    .eq('entidade', entidade)
    .order('ordem');

  if (error) throw error;
  return (data ?? []).map(mapCampo);
}

export interface EntradaCampo {
  entidade: CrmEntidade;
  nome: string;
  tipo: TipoCampo;
  opcoes: string[];
  obrigatorio: boolean;
}

export async function criarCampo(entrada: EntradaCampo): Promise<void> {
  const { data: ultimo } = await supabase
    .from('crm_custom_fields')
    .select('ordem')
    .eq('entidade', entrada.entidade)
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('crm_custom_fields').insert({
    entidade: entrada.entidade,
    nome: entrada.nome.trim(),
    chave: await chaveDisponivel(entrada.entidade, entrada.nome),
    tipo: entrada.tipo,
    opcoes: tipoTemOpcoes(entrada.tipo) ? entrada.opcoes : [],
    obrigatorio: entrada.obrigatorio,
    ordem: (ultimo?.ordem ?? -1) + 1,
  });

  if (error) throw error;
}

export async function atualizarCampo(
  id: string,
  mudanca: Partial<Pick<CrmCampoPersonalizado, 'nome' | 'opcoes' | 'obrigatorio' | 'ativo' | 'ordem'>>
): Promise<void> {
  const { error } = await supabase.from('crm_custom_fields').update(mudanca).eq('id', id);
  if (error) throw error;
}

export async function excluirCampo(id: string): Promise<void> {
  const { error } = await supabase.from('crm_custom_fields').delete().eq('id', id);
  if (error) throw error;
}

export async function reordenarCampos(idsNaOrdem: string[]): Promise<void> {
  await Promise.all(
    idsNaOrdem.map((id, indice) =>
      supabase.from('crm_custom_fields').update({ ordem: indice }).eq('id', id)
    )
  );
}

/**
 * Gera a chave usada dentro do JSONB a partir do nome, garantindo que não
 * colida com outra já existente na mesma entidade.
 */
async function chaveDisponivel(entidade: CrmEntidade, nome: string): Promise<string> {
  const base =
    nome
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'campo';

  const { data } = await supabase
    .from('crm_custom_fields')
    .select('chave')
    .eq('entidade', entidade)
    .like('chave', `${base}%`);

  const usadas = new Set((data ?? []).map((linha: { chave: string }) => linha.chave));
  if (!usadas.has(base)) return base;

  let sufixo = 2;
  while (usadas.has(`${base}_${sufixo}`)) sufixo += 1;
  return `${base}_${sufixo}`;
}

function mapCampo(row: any): CrmCampoPersonalizado {
  return {
    id: row.id,
    entidade: row.entidade,
    nome: row.nome,
    chave: row.chave,
    tipo: row.tipo,
    opcoes: Array.isArray(row.opcoes) ? row.opcoes : [],
    obrigatorio: row.obrigatorio,
    ordem: row.ordem,
    ativo: row.ativo,
  };
}

/** Valida os obrigatórios antes de salvar; devolve o nome do primeiro vazio. */
export function primeiroObrigatorioVazio(
  campos: CrmCampoPersonalizado[],
  valores: Record<string, unknown>
): string | null {
  for (const campo of campos) {
    if (!campo.obrigatorio) continue;
    const valor = valores[campo.chave];
    const vazio =
      valor === undefined ||
      valor === null ||
      valor === '' ||
      (Array.isArray(valor) && valor.length === 0);
    if (vazio) return campo.nome;
  }
  return null;
}
