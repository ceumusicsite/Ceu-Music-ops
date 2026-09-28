import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CrmColuna } from '../../services/crm/types';
import { carregarPreferencia, salvarPreferencia } from '../../services/crm/preferencias';

/** Classes literais: o Tailwind não detecta nomes montados por interpolação. */
const ALINHAMENTO: Record<'left' | 'right' | 'center', string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

interface CrmDataTableProps<T> {
  colunas: CrmColuna<T>[];
  itens: T[];
  idDe: (item: T) => string;
  carregando?: boolean;
  /** Ids marcados nas caixas de seleção, controlados pela página. */
  selecionados: string[];
  onSelecionadosChange: (ids: string[]) => void;
  onLinhaClick?: (item: T) => void;
  acoesLinha?: (item: T) => ReactNode;
  vazio?: ReactNode;
  /** Identificador da listagem; quando informado, colunas e ordenação são lembradas por usuário. */
  preferenciaDe?: string;
}

export default function CrmDataTable<T>({
  colunas,
  itens,
  idDe,
  carregando = false,
  selecionados,
  onSelecionadosChange,
  onLinhaClick,
  acoesLinha,
  vazio,
  preferenciaDe,
}: CrmDataTableProps<T>) {
  const [colunasVisiveis, setColunasVisiveis] = useState<string[]>(() =>
    colunas.filter((c) => c.fixa || c.visivelPorPadrao !== false).map((c) => c.chave)
  );
  const [ordenacao, setOrdenacao] = useState<{ chave: string; direcao: 'asc' | 'desc' } | null>(null);
  const [menuColunasAberto, setMenuColunasAberto] = useState(false);
  const menuColunasRef = useRef<HTMLDivElement>(null);
  // Enquanto a preferência salva não chega, não sobrescreve o que está no banco.
  const preferenciaCarregada = useRef(false);

  useEffect(() => {
    if (!preferenciaDe) return;

    carregarPreferencia(preferenciaDe)
      .then((preferencia) => {
        if (preferencia && preferencia.colunas.length > 0) {
          // Colunas fixas entram sempre, mesmo que a preferência antiga não as tenha.
          const fixas = colunas.filter((c) => c.fixa).map((c) => c.chave);
          setColunasVisiveis([...new Set([...fixas, ...preferencia.colunas])]);
          setOrdenacao(preferencia.ordenacao);
        }
      })
      .catch((e) => console.warn('Não foi possível carregar a preferência de colunas:', e))
      .finally(() => {
        preferenciaCarregada.current = true;
      });
    // As colunas são estáticas por tela; recarregar a preferência a cada render não faz sentido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferenciaDe]);

  useEffect(() => {
    if (!preferenciaDe || !preferenciaCarregada.current) return;

    salvarPreferencia(preferenciaDe, { colunas: colunasVisiveis, ordenacao }).catch((e) =>
      console.warn('Não foi possível salvar a preferência de colunas:', e)
    );
  }, [preferenciaDe, colunasVisiveis, ordenacao]);

  useEffect(() => {
    if (!menuColunasAberto) return;
    const aoClicarFora = (evento: MouseEvent) => {
      if (!menuColunasRef.current?.contains(evento.target as Node)) {
        setMenuColunasAberto(false);
      }
    };
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, [menuColunasAberto]);

  const colunasExibidas = useMemo(
    () => colunas.filter((c) => colunasVisiveis.includes(c.chave)),
    [colunas, colunasVisiveis]
  );

  const itensOrdenados = useMemo(() => {
    if (!ordenacao) return itens;
    const coluna = colunas.find((c) => c.chave === ordenacao.chave);
    if (!coluna?.valor) return itens;

    const fator = ordenacao.direcao === 'asc' ? 1 : -1;
    return [...itens].sort((a, b) => {
      const va = coluna.valor!(a);
      const vb = coluna.valor!(b);
      if (va === vb) return 0;
      if (va === null || va === undefined || va === '') return 1;
      if (vb === null || vb === undefined || vb === '') return -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * fator;
      return String(va).localeCompare(String(vb), 'pt-BR') * fator;
    });
  }, [itens, ordenacao, colunas]);

  const ids = itensOrdenados.map(idDe);
  const todosSelecionados = ids.length > 0 && ids.every((id) => selecionados.includes(id));

  const alternarTodos = () => {
    onSelecionadosChange(todosSelecionados ? [] : ids);
  };

  const alternarLinha = (id: string) => {
    onSelecionadosChange(
      selecionados.includes(id) ? selecionados.filter((s) => s !== id) : [...selecionados, id]
    );
  };

  const alternarOrdenacao = (coluna: CrmColuna<T>) => {
    if (!coluna.valor) return;
    setOrdenacao((atual) => {
      if (atual?.chave !== coluna.chave) return { chave: coluna.chave, direcao: 'asc' };
      if (atual.direcao === 'asc') return { chave: coluna.chave, direcao: 'desc' };
      return null;
    });
  };

  const alternarColuna = (chave: string) => {
    setColunasVisiveis((atuais) =>
      atuais.includes(chave) ? atuais.filter((c) => c !== chave) : [...atuais, chave]
    );
  };

  if (carregando) {
    return (
      <div className="rounded-xl border border-dark-border bg-dark-card p-10 text-center text-gray-500">
        <i className="ri-loader-4-line animate-spin text-2xl" />
        <p className="mt-2 text-sm">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-dark-border bg-dark-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-dark-border bg-dark-hover/40">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={todosSelecionados}
                  onChange={alternarTodos}
                  aria-label="Selecionar todos"
                  className="h-4 w-4 cursor-pointer accent-primary-teal"
                />
              </th>

              {colunasExibidas.map((coluna) => {
                const ordenavel = Boolean(coluna.valor);
                const ativa = ordenacao?.chave === coluna.chave;
                return (
                  <th
                    key={coluna.chave}
                    style={coluna.largura ? { width: coluna.largura } : undefined}
                    className={`px-3 py-3 font-semibold text-gray-300 ${
                      ALINHAMENTO[coluna.alinhamento ?? 'left']
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => alternarOrdenacao(coluna)}
                      disabled={!ordenavel}
                      className={`flex items-center gap-1 ${
                        ordenavel ? 'cursor-pointer hover:text-white' : 'cursor-default'
                      } ${ativa ? 'text-primary-teal' : ''}`}
                    >
                      {coluna.titulo}
                      {ativa && (
                        <i
                          className={`text-base ${
                            ordenacao?.direcao === 'asc' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'
                          }`}
                        />
                      )}
                    </button>
                  </th>
                );
              })}

              {/* Engrenagem de colunas, no mesmo lugar do Pipedrive */}
              <th className="w-12 px-3 py-3 text-right">
                <div className="relative inline-block" ref={menuColunasRef}>
                  <button
                    type="button"
                    onClick={() => setMenuColunasAberto((aberto) => !aberto)}
                    aria-label="Escolher colunas"
                    className="rounded p-1 text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
                  >
                    <i className="ri-settings-3-line text-lg" />
                  </button>

                  {menuColunasAberto && (
                    <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-dark-border bg-dark-card p-2 text-left shadow-xl">
                      <p className="px-2 py-1 text-xs uppercase tracking-wide text-gray-500">
                        Colunas visíveis
                      </p>
                      {colunas.map((coluna) => (
                        <label
                          key={coluna.chave}
                          className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                            coluna.fixa ? 'text-gray-600' : 'cursor-pointer text-gray-300 hover:bg-dark-hover'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={coluna.fixa}
                            checked={colunasVisiveis.includes(coluna.chave)}
                            onChange={() => alternarColuna(coluna.chave)}
                            className="h-4 w-4 accent-primary-teal"
                          />
                          {coluna.titulo}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {itensOrdenados.map((item) => {
              const id = idDe(item);
              const marcada = selecionados.includes(id);
              return (
                <tr
                  key={id}
                  onClick={() => onLinhaClick?.(item)}
                  className={`border-b border-dark-border/60 transition-smooth last:border-0 ${
                    marcada ? 'bg-primary-teal/10' : 'hover:bg-dark-hover/60'
                  } ${onLinhaClick ? 'cursor-pointer' : ''}`}
                >
                  <td className="px-3 py-3" onClick={(evento) => evento.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={marcada}
                      onChange={() => alternarLinha(id)}
                      aria-label={`Selecionar ${id}`}
                      className="h-4 w-4 cursor-pointer accent-primary-teal"
                    />
                  </td>

                  {colunasExibidas.map((coluna) => (
                    <td
                      key={coluna.chave}
                      className={`px-3 py-3 text-gray-300 ${ALINHAMENTO[coluna.alinhamento ?? 'left']}`}
                    >
                      {coluna.render(item)}
                    </td>
                  ))}

                  <td className="px-3 py-3 text-right" onClick={(evento) => evento.stopPropagation()}>
                    {acoesLinha?.(item)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {itensOrdenados.length === 0 && (
        <div className="p-10 text-center text-gray-500">
          {vazio ?? <p className="text-sm">Nenhum registro encontrado.</p>}
        </div>
      )}
    </div>
  );
}
