import type { CrmCondicoesFiltro, CrmOperadorFiltro, CrmRegraFiltro } from './types';

export const OPERADORES_FILTRO: { valor: CrmOperadorFiltro; rotulo: string; semValor?: boolean }[] = [
  { valor: 'contem', rotulo: 'contém' },
  { valor: 'nao_contem', rotulo: 'não contém' },
  { valor: 'igual', rotulo: 'é igual a' },
  { valor: 'diferente', rotulo: 'é diferente de' },
  { valor: 'maior_que', rotulo: 'é maior que' },
  { valor: 'menor_que', rotulo: 'é menor que' },
  { valor: 'vazio', rotulo: 'está vazio', semValor: true },
  { valor: 'preenchido', rotulo: 'está preenchido', semValor: true },
];

export const CONDICOES_VAZIAS: CrmCondicoesFiltro = { operador: 'and', regras: [] };

export function operadorSemValor(operador: CrmOperadorFiltro): boolean {
  return OPERADORES_FILTRO.find((o) => o.valor === operador)?.semValor === true;
}

/** Conta apenas as regras que realmente filtram algo, para o selo do botão. */
export function contarRegrasAtivas(condicoes: CrmCondicoesFiltro): number {
  return condicoes.regras.filter(regraEstaCompleta).length;
}

function regraEstaCompleta(regra: CrmRegraFiltro): boolean {
  if (!regra.campo) return false;
  return operadorSemValor(regra.operador) || regra.valor.trim() !== '';
}

type ValorDe<T> = (item: T, campo: string) => string | number | null | undefined;

/**
 * Aplica busca livre e condições em memória. O volume de contatos por
 * organização é pequeno; quando crescer, estas regras viram filtros no Postgres.
 */
export function aplicarFiltros<T>(
  itens: T[],
  busca: string,
  condicoes: CrmCondicoesFiltro,
  valorDe: ValorDe<T>,
  camposBusca: string[]
): T[] {
  const termo = busca.trim().toLowerCase();
  const regras = condicoes.regras.filter(regraEstaCompleta);

  return itens.filter((item) => {
    if (termo) {
      const encontrou = camposBusca.some((campo) =>
        String(valorDe(item, campo) ?? '').toLowerCase().includes(termo)
      );
      if (!encontrou) return false;
    }

    if (regras.length === 0) return true;

    const resultados = regras.map((regra) => avaliarRegra(valorDe(item, regra.campo), regra));
    return condicoes.operador === 'and' ? resultados.every(Boolean) : resultados.some(Boolean);
  });
}

function avaliarRegra(valorBruto: string | number | null | undefined, regra: CrmRegraFiltro): boolean {
  const vazio = valorBruto === null || valorBruto === undefined || String(valorBruto).trim() === '';

  if (regra.operador === 'vazio') return vazio;
  if (regra.operador === 'preenchido') return !vazio;
  if (vazio) return false;

  const valor = String(valorBruto).toLowerCase();
  const alvo = regra.valor.trim().toLowerCase();

  switch (regra.operador) {
    case 'contem':
      return valor.includes(alvo);
    case 'nao_contem':
      return !valor.includes(alvo);
    case 'igual':
      return valor === alvo;
    case 'diferente':
      return valor !== alvo;
    case 'maior_que':
    case 'menor_que': {
      const a = Number(valorBruto);
      const b = Number(regra.valor);
      if (Number.isNaN(a) || Number.isNaN(b)) {
        // Sem números dos dois lados, compara como texto (útil para datas ISO).
        return regra.operador === 'maior_que' ? valor > alvo : valor < alvo;
      }
      return regra.operador === 'maior_que' ? a > b : a < b;
    }
    default:
      return true;
  }
}

export function novaRegra(campoPadrao: string): CrmRegraFiltro {
  return {
    id: `regra-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    campo: campoPadrao,
    operador: 'contem',
    valor: '',
  };
}
