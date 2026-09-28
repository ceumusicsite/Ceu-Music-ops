import { useState } from 'react';
import { diasNaEtapa, formatarData, formatarMoeda, iniciais } from '../../services/crm/formato';
import type { CrmEtapa, CrmNegocio } from '../../services/crm/types';

interface CrmKanbanProps {
  etapas: CrmEtapa[];
  negocios: CrmNegocio[];
  onMover: (negocioId: string, etapaDestinoId: string, posicao: number) => void;
  onAbrirNegocio: (negocio: CrmNegocio) => void;
  onNovoNegocio: (etapaId: string) => void;
}

interface Alvo {
  etapaId: string;
  indice: number;
}

/**
 * Funil em colunas, com arraste entre etapas.
 *
 * Usa a API de drag & drop do próprio HTML em vez de uma biblioteca: o projeto
 * não tem nenhuma para isso e o comportamento necessário aqui é simples.
 */
export default function CrmKanban({
  etapas,
  negocios,
  onMover,
  onAbrirNegocio,
  onNovoNegocio,
}: CrmKanbanProps) {
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<Alvo | null>(null);

  const negociosDa = (etapaId: string) =>
    negocios.filter((n) => n.stage_id === etapaId).sort((a, b) => a.ordem - b.ordem);

  const soltar = (etapaId: string, indice: number) => {
    if (arrastando) onMover(arrastando, etapaId, indice);
    setArrastando(null);
    setAlvo(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {etapas.map((etapa) => {
        const daEtapa = negociosDa(etapa.id);
        const total = daEtapa.reduce((soma, n) => soma + n.valor, 0);
        const recebendo = alvo?.etapaId === etapa.id;

        return (
          <section
            key={etapa.id}
            onDragOver={(evento) => {
              evento.preventDefault();
              if (!alvo || alvo.etapaId !== etapa.id) {
                setAlvo({ etapaId: etapa.id, indice: daEtapa.length });
              }
            }}
            onDrop={(evento) => {
              evento.preventDefault();
              soltar(etapa.id, alvo?.etapaId === etapa.id ? alvo.indice : daEtapa.length);
            }}
            className={`flex w-72 shrink-0 flex-col rounded-xl border bg-dark-card/50 transition-smooth ${
              recebendo ? 'border-primary-teal' : 'border-dark-border'
            }`}
          >
            <header className="border-b border-dark-border px-3 py-2.5">
              <h3 className="truncate text-sm font-semibold text-white">{etapa.nome}</h3>
              <p className="mt-0.5 text-xs text-gray-500">
                {formatarMoeda(total)} · {daEtapa.length}{' '}
                {daEtapa.length === 1 ? 'negócio' : 'negócios'}
              </p>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ minHeight: '60vh' }}>
              {daEtapa.map((negocio, indice) => {
                const parado = diasNaEtapa(negocio.data_entrada_etapa);
                const apodrecendo = etapa.rotting_dias != null && parado > etapa.rotting_dias;

                return (
                  <article
                    key={negocio.id}
                    draggable
                    onDragStart={() => setArrastando(negocio.id)}
                    onDragEnd={() => {
                      setArrastando(null);
                      setAlvo(null);
                    }}
                    onDragOver={(evento) => {
                      evento.preventDefault();
                      evento.stopPropagation();
                      setAlvo({ etapaId: etapa.id, indice });
                    }}
                    onClick={() => onAbrirNegocio(negocio)}
                    className={`cursor-pointer rounded-lg border bg-dark-card p-3 transition-smooth hover:border-primary-teal/60 ${
                      arrastando === negocio.id ? 'opacity-40' : ''
                    } ${
                      recebendo && alvo?.indice === indice
                        ? 'border-t-2 border-t-primary-teal border-dark-border'
                        : 'border-dark-border'
                    }`}
                  >
                    <h4 className="text-sm font-medium leading-snug text-white">{negocio.titulo}</h4>

                    {(negocio.organizacao_nome || negocio.person_nome) && (
                      <p className="mt-1 truncate text-xs text-gray-400">
                        {[negocio.organizacao_nome, negocio.person_nome]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-primary-teal">
                        {formatarMoeda(negocio.valor, negocio.moeda)}
                      </span>
                      {negocio.dono_nome && (
                        <span
                          title={negocio.dono_nome}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-dark-hover text-[10px] font-semibold text-gray-300"
                        >
                          {iniciais(negocio.dono_nome)}
                        </span>
                      )}
                    </div>

                    {(apodrecendo || negocio.data_prevista_fechamento) && (
                      <div className="mt-2 flex items-center gap-2 text-[11px]">
                        {apodrecendo && (
                          <span className="flex items-center gap-1 rounded bg-orange-500/15 px-1.5 py-0.5 text-orange-300">
                            <i className="ri-time-line" />
                            {parado}d parado
                          </span>
                        )}
                        {negocio.data_prevista_fechamento && (
                          <span className="text-gray-500">
                            <i className="ri-flag-line mr-1" />
                            {formatarData(negocio.data_prevista_fechamento)}
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}

              {daEtapa.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-gray-600">
                  Nenhum negócio nesta etapa
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNovoNegocio(etapa.id)}
              className="flex items-center justify-center gap-1.5 border-t border-dark-border px-3 py-2.5 text-xs font-medium text-gray-400 transition-smooth hover:bg-dark-hover hover:text-primary-teal"
            >
              <i className="ri-add-line" />
              Negócio
            </button>
          </section>
        );
      })}
    </div>
  );
}
