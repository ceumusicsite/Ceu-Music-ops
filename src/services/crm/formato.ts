export function formatarMoeda(valor: number, moeda = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: moeda,
    maximumFractionDigits: valor % 1 === 0 ? 0 : 2,
  }).format(valor);
}

export function formatarData(iso?: string | null): string {
  if (!iso) return '—';

  // Uma coluna DATE chega como "2026-09-22". O construtor Date lê esse formato
  // como meia-noite em UTC, e em fusos negativos (Brasília é -3) a conversão
  // para hora local volta um dia. Forçar a hora faz o valor ser lido como local.
  const apenasData = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const data = apenasData ? new Date(`${iso}T00:00:00`) : new Date(iso);

  return data.toLocaleDateString('pt-BR');
}

/** Dias parados na etapa atual, usado para sinalizar negócios "apodrecendo". */
export function diasNaEtapa(dataEntrada?: string | null): number {
  if (!dataEntrada) return 0;
  const ms = Date.now() - new Date(dataEntrada).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function iniciais(nome?: string | null): string {
  if (!nome) return '?';

  // Só partes que começam com letra: prefixos como "[Amostra]" ou pontuação
  // solta não devem virar inicial.
  const partes = nome.split(/\s+/).filter((parte) => /^\p{L}/u.test(parte));

  return partes.slice(0, 2).map((parte) => parte[0].toUpperCase()).join('') || '?';
}
