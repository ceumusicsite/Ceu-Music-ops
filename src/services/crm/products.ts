import { supabase } from '../../lib/supabase';

export interface CrmProduto {
  id: string;
  nome: string;
  codigo?: string | null;
  descricao?: string | null;
  categoria?: string | null;
  unidade?: string | null;
  preco: number;
  moeda: string;
  imposto_percentual: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrmItemNegocio {
  id: string;
  deal_id: string;
  product_id?: string | null;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  desconto_percentual: number;
  observacoes?: string | null;
}

/** Total de uma linha já com o desconto aplicado. */
export function totalDoItem(item: CrmItemNegocio): number {
  const bruto = item.quantidade * item.preco_unitario;
  return bruto * (1 - item.desconto_percentual / 100);
}

export function totalDosItens(itens: CrmItemNegocio[]): number {
  return itens.reduce((soma, item) => soma + totalDoItem(item), 0);
}

export async function listarProdutos(incluirInativos = false): Promise<CrmProduto[]> {
  let consulta = supabase.from('crm_products').select('*');
  if (!incluirInativos) consulta = consulta.eq('ativo', true);

  const { data, error } = await consulta.order('nome');
  if (error) throw error;
  return (data ?? []).map(mapProduto);
}

export interface EntradaProduto {
  nome: string;
  codigo?: string | null;
  descricao?: string | null;
  categoria?: string | null;
  unidade?: string | null;
  preco: number;
  imposto_percentual: number;
  ativo: boolean;
}

export async function criarProduto(entrada: EntradaProduto): Promise<void> {
  const { error } = await supabase.from('crm_products').insert(normalizar(entrada));
  if (error) throw error;
}

export async function atualizarProduto(id: string, entrada: EntradaProduto): Promise<void> {
  const { error } = await supabase.from('crm_products').update(normalizar(entrada)).eq('id', id);
  if (error) throw error;
}

export async function excluirProdutos(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('crm_products').delete().in('id', ids);
  if (error) throw error;
}

export async function listarItensDoNegocio(dealId: string): Promise<CrmItemNegocio[]> {
  const { data, error } = await supabase
    .from('crm_deal_products')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at');

  if (error) throw error;
  return (data ?? []).map(mapItem);
}

/**
 * Adiciona um produto ao negócio copiando o preço vigente do catálogo.
 *
 * A cópia é proposital: mudar o preço de tabela depois não pode reescrever o
 * valor de negócios já fechados.
 */
export async function adicionarItem(
  dealId: string,
  produto: CrmProduto,
  quantidade = 1
): Promise<void> {
  const { error } = await supabase.from('crm_deal_products').insert({
    deal_id: dealId,
    product_id: produto.id,
    nome: produto.nome,
    quantidade,
    preco_unitario: produto.preco,
  });
  if (error) throw error;
}

export async function atualizarItem(
  id: string,
  mudanca: Partial<Pick<CrmItemNegocio, 'quantidade' | 'preco_unitario' | 'desconto_percentual'>>
): Promise<void> {
  const { error } = await supabase.from('crm_deal_products').update(mudanca).eq('id', id);
  if (error) throw error;
}

export async function removerItem(id: string): Promise<void> {
  const { error } = await supabase.from('crm_deal_products').delete().eq('id', id);
  if (error) throw error;
}

/** Espelha a soma dos itens no valor do negócio, como o Pipedrive faz. */
export async function sincronizarValorDoNegocio(dealId: string): Promise<number> {
  const itens = await listarItensDoNegocio(dealId);
  const total = totalDosItens(itens);

  const { error } = await supabase.from('crm_deals').update({ valor: total }).eq('id', dealId);
  if (error) throw error;

  return total;
}

function mapProduto(row: any): CrmProduto {
  return {
    id: row.id,
    nome: row.nome,
    codigo: row.codigo,
    descricao: row.descricao,
    categoria: row.categoria,
    unidade: row.unidade,
    preco: Number(row.preco ?? 0),
    moeda: row.moeda ?? 'BRL',
    imposto_percentual: Number(row.imposto_percentual ?? 0),
    ativo: row.ativo,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapItem(row: any): CrmItemNegocio {
  return {
    id: row.id,
    deal_id: row.deal_id,
    product_id: row.product_id,
    nome: row.nome,
    quantidade: Number(row.quantidade ?? 0),
    preco_unitario: Number(row.preco_unitario ?? 0),
    desconto_percentual: Number(row.desconto_percentual ?? 0),
    observacoes: row.observacoes,
  };
}

function normalizar(entrada: EntradaProduto) {
  const normalizado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(entrada)) {
    normalizado[chave] = valor === '' ? null : valor;
  }
  return normalizado;
}
