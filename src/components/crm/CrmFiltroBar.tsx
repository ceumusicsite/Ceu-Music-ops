import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CONDICOES_VAZIAS,
  OPERADORES_FILTRO,
  contarRegrasAtivas,
  novaRegra,
  operadorSemValor,
} from '../../services/crm/filtro';
import type { CrmCondicoesFiltro, CrmFiltroSalvo, CrmOperadorFiltro } from '../../services/crm/types';
import {
  excluirFiltro,
  listarFiltrosSalvos,
  salvarFiltro,
} from '../../services/crm/filtrosSalvos';

interface CrmFiltroBarProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  placeholder?: string;
  campos: { chave: string; titulo: string }[];
  condicoes: CrmCondicoesFiltro;
  onCondicoesChange: (condicoes: CrmCondicoesFiltro) => void;
  /** Quando informado, habilita salvar e reaplicar filtros desta listagem. */
  entidade?: string;
}

/** Busca livre + construtor de condições, equivalente ao painel "Filtro". */
export default function CrmFiltroBar({
  busca,
  onBuscaChange,
  placeholder = 'Pesquisar…',
  campos,
  condicoes,
  onCondicoesChange,
  entidade,
}: CrmFiltroBarProps) {
  const [painelAberto, setPainelAberto] = useState(false);
  const [salvos, setSalvos] = useState<CrmFiltroSalvo[]>([]);
  const [nomeNovo, setNomeNovo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const recarregarSalvos = useCallback(() => {
    if (!entidade) return;
    listarFiltrosSalvos(entidade)
      .then(setSalvos)
      .catch((e) => console.warn('Não foi possível carregar os filtros salvos:', e));
  }, [entidade]);

  useEffect(() => {
    recarregarSalvos();
  }, [recarregarSalvos]);
  const painelRef = useRef<HTMLDivElement>(null);
  const regrasAtivas = contarRegrasAtivas(condicoes);

  useEffect(() => {
    if (!painelAberto) return;
    const aoClicarFora = (evento: MouseEvent) => {
      if (!painelRef.current?.contains(evento.target as Node)) setPainelAberto(false);
    };
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, [painelAberto]);

  const atualizarRegra = (id: string, mudanca: Partial<{ campo: string; operador: CrmOperadorFiltro; valor: string }>) => {
    onCondicoesChange({
      ...condicoes,
      regras: condicoes.regras.map((regra) => (regra.id === id ? { ...regra, ...mudanca } : regra)),
    });
  };

  const removerRegra = (id: string) => {
    onCondicoesChange({ ...condicoes, regras: condicoes.regras.filter((r) => r.id !== id) });
  };

  const adicionarRegra = () => {
    onCondicoesChange({
      ...condicoes,
      regras: [...condicoes.regras, novaRegra(campos[0]?.chave ?? '')],
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={busca}
          onChange={(evento) => onBuscaChange(evento.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-dark-border bg-dark-card py-2.5 pl-10 pr-3 text-sm text-white placeholder-gray-500 outline-none transition-smooth focus:border-primary-teal"
        />
      </div>

      <div className="relative" ref={painelRef}>
        <button
          type="button"
          onClick={() => setPainelAberto((aberto) => !aberto)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-smooth ${
            regrasAtivas > 0
              ? 'border-primary-teal bg-primary-teal/10 text-primary-teal'
              : 'border-dark-border bg-dark-card text-gray-300 hover:bg-dark-hover'
          }`}
        >
          <i className="ri-filter-3-line text-base" />
          Filtro
          {regrasAtivas > 0 && (
            <span className="rounded-full bg-primary-teal px-1.5 text-xs font-semibold text-white">
              {regrasAtivas}
            </span>
          )}
          <i className="ri-arrow-down-s-line text-base" />
        </button>

        {painelAberto && (
          <div className="absolute right-0 z-30 mt-2 w-[min(92vw,34rem)] rounded-xl border border-dark-border bg-dark-card p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Condições</p>
              <div className="flex overflow-hidden rounded-lg border border-dark-border">
                {(['and', 'or'] as const).map((operador) => (
                  <button
                    key={operador}
                    type="button"
                    onClick={() => onCondicoesChange({ ...condicoes, operador })}
                    className={`px-3 py-1 text-xs font-medium transition-smooth ${
                      condicoes.operador === operador
                        ? 'bg-primary-teal text-white'
                        : 'text-gray-400 hover:bg-dark-hover'
                    }`}
                  >
                    {operador === 'and' ? 'Todas' : 'Qualquer'}
                  </button>
                ))}
              </div>
            </div>

            {entidade && salvos.length > 0 && (
              <div className="mb-4 border-b border-dark-border pb-3">
                <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                  Filtros salvos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {salvos.map((filtro) => (
                    <span
                      key={filtro.id}
                      className="flex items-center gap-1 rounded-lg border border-dark-border bg-dark-bg pl-3 text-sm text-gray-300"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onCondicoesChange(filtro.condicoes);
                          setPainelAberto(false);
                        }}
                        className="py-1.5 transition-smooth hover:text-primary-teal"
                      >
                        {filtro.nome}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await excluirFiltro(filtro.id);
                          recarregarSalvos();
                        }}
                        aria-label={`Excluir filtro ${filtro.nome}`}
                        className="px-2 py-1.5 text-gray-600 transition-smooth hover:text-red-400"
                      >
                        <i className="ri-close-line" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {condicoes.regras.length === 0 && (
              <p className="mb-3 text-sm text-gray-500">
                Nenhuma condição. Adicione uma para restringir a lista.
              </p>
            )}

            <div className="space-y-2">
              {condicoes.regras.map((regra) => (
                <div key={regra.id} className="flex flex-wrap items-center gap-2">
                  <select
                    value={regra.campo}
                    onChange={(evento) => atualizarRegra(regra.id, { campo: evento.target.value })}
                    className="min-w-[8rem] flex-1 rounded-lg border border-dark-border bg-dark-bg px-2 py-2 text-sm text-white outline-none focus:border-primary-teal"
                  >
                    {campos.map((campo) => (
                      <option key={campo.chave} value={campo.chave}>
                        {campo.titulo}
                      </option>
                    ))}
                  </select>

                  <select
                    value={regra.operador}
                    onChange={(evento) =>
                      atualizarRegra(regra.id, { operador: evento.target.value as CrmOperadorFiltro })
                    }
                    className="min-w-[8rem] rounded-lg border border-dark-border bg-dark-bg px-2 py-2 text-sm text-white outline-none focus:border-primary-teal"
                  >
                    {OPERADORES_FILTRO.map((operador) => (
                      <option key={operador.valor} value={operador.valor}>
                        {operador.rotulo}
                      </option>
                    ))}
                  </select>

                  {!operadorSemValor(regra.operador) && (
                    <input
                      type="text"
                      value={regra.valor}
                      onChange={(evento) => atualizarRegra(regra.id, { valor: evento.target.value })}
                      placeholder="valor"
                      className="min-w-[7rem] flex-1 rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary-teal"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => removerRegra(regra.id)}
                    aria-label="Remover condição"
                    className="rounded p-2 text-gray-500 transition-smooth hover:bg-dark-hover hover:text-red-400"
                  >
                    <i className="ri-close-line" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={adicionarRegra}
                className="flex items-center gap-1.5 text-sm font-medium text-primary-teal hover:underline"
              >
                <i className="ri-add-line" />
                Adicionar condição
              </button>

              <button
                type="button"
                onClick={() => onCondicoesChange(CONDICOES_VAZIAS)}
                className="text-sm text-gray-400 transition-smooth hover:text-white"
              >
                Limpar
              </button>
            </div>

            {entidade && regrasAtivas > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dark-border pt-3">
                <input
                  type="text"
                  value={nomeNovo}
                  onChange={(evento) => setNomeNovo(evento.target.value)}
                  placeholder="Nome para salvar este filtro"
                  aria-label="Nome do filtro"
                  className="min-w-[10rem] flex-1 rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary-teal"
                />
                <button
                  type="button"
                  disabled={nomeNovo.trim() === '' || salvando}
                  onClick={async () => {
                    setSalvando(true);
                    try {
                      await salvarFiltro(nomeNovo, entidade, condicoes, 'privado');
                      setNomeNovo('');
                      recarregarSalvos();
                    } catch (e) {
                      console.error('Erro ao salvar filtro:', e);
                    } finally {
                      setSalvando(false);
                    }
                  }}
                  className="rounded-lg bg-primary-teal px-3 py-2 text-sm font-semibold text-white transition-smooth hover:opacity-90 disabled:opacity-40"
                >
                  Salvar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
