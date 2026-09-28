import { useCallback, useEffect, useState } from 'react';
import CrmLayout from '../../../components/crm/CrmLayout';
import { CRM_SUBITENS_CONFIGURACOES } from '../../../components/crm/navegacao';
import CrmModal from '../../../components/crm/CrmModal';
import { listarEtapas, listarPipelines } from '../../../services/crm/deals';
import {
  atualizarEtapa,
  contarNegociosPorEtapa,
  criarEtapa,
  criarPipeline,
  excluirEtapa,
  excluirPipeline,
  renomearPipeline,
  reordenarEtapas,
} from '../../../services/crm/pipelines';
import type { CrmEtapa, CrmPipeline } from '../../../services/crm/types';

const CAMPO =
  'rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-smooth focus:border-primary-teal';

export default function CrmFunisPage() {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [pipelineAtual, setPipelineAtual] = useState('');
  const [etapas, setEtapas] = useState<CrmEtapa[]>([]);
  const [contagem, setContagem] = useState<Record<string, number>>({});

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  const [novaEtapa, setNovaEtapa] = useState('');
  const [novoFunilAberto, setNovoFunilAberto] = useState(false);
  const [nomeNovoFunil, setNomeNovoFunil] = useState('');
  const [etapaParaExcluir, setEtapaParaExcluir] = useState<CrmEtapa | null>(null);
  const [funilParaExcluir, setFunilParaExcluir] = useState<CrmPipeline | null>(null);

  const carregarEtapas = useCallback(async (pipelineId: string) => {
    setCarregando(true);
    setErro('');
    try {
      const [lista, contagens] = await Promise.all([
        listarEtapas(pipelineId),
        contarNegociosPorEtapa(pipelineId),
      ]);
      setEtapas(lista);
      setContagem(contagens);
    } catch (e) {
      console.error('Erro ao carregar etapas:', e);
      setErro('Não foi possível carregar as etapas.');
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarPipelines = useCallback(
    async (selecionar?: string) => {
      try {
        const lista = await listarPipelines();
        setPipelines(lista);
        const escolhido = selecionar ?? (lista[0]?.id ?? '');
        setPipelineAtual(escolhido);
        if (!escolhido) setCarregando(false);
      } catch (e) {
        console.error('Erro ao carregar funis:', e);
        setErro('Não foi possível carregar os funis.');
        setCarregando(false);
      }
    },
    []
  );

  useEffect(() => {
    carregarPipelines();
  }, [carregarPipelines]);

  useEffect(() => {
    if (pipelineAtual) carregarEtapas(pipelineAtual);
  }, [pipelineAtual, carregarEtapas]);

  const funil = pipelines.find((p) => p.id === pipelineAtual);

  /** Salva no banco só quando o campo perde o foco, para não gravar a cada tecla. */
  const salvarCampo = async (id: string, mudanca: Parameters<typeof atualizarEtapa>[1]) => {
    try {
      await atualizarEtapa(id, mudanca);
    } catch (e) {
      console.error('Erro ao salvar etapa:', e);
      setErro('Não foi possível salvar a alteração.');
    }
  };

  const alterarLocal = (id: string, mudanca: Partial<CrmEtapa>) =>
    setEtapas((atuais) => atuais.map((e) => (e.id === id ? { ...e, ...mudanca } : e)));

  const mover = async (indice: number, direcao: -1 | 1) => {
    const destino = indice + direcao;
    if (destino < 0 || destino >= etapas.length) return;

    const reordenadas = [...etapas];
    [reordenadas[indice], reordenadas[destino]] = [reordenadas[destino], reordenadas[indice]];
    setEtapas(reordenadas.map((e, i) => ({ ...e, ordem: i })));

    try {
      await reordenarEtapas(reordenadas.map((e) => e.id));
    } catch (e) {
      console.error('Erro ao reordenar etapas:', e);
      setErro('Não foi possível reordenar as etapas.');
      await carregarEtapas(pipelineAtual);
    }
  };

  const adicionarEtapa = async () => {
    if (novaEtapa.trim() === '') return;
    try {
      await criarEtapa(pipelineAtual, novaEtapa, 50);
      setNovaEtapa('');
      await carregarEtapas(pipelineAtual);
    } catch (e) {
      console.error('Erro ao criar etapa:', e);
      setErro('Não foi possível criar a etapa.');
    }
  };

  const confirmarExclusaoEtapa = async () => {
    if (!etapaParaExcluir) return;
    try {
      await excluirEtapa(etapaParaExcluir.id);
      setEtapaParaExcluir(null);
      await carregarEtapas(pipelineAtual);
    } catch (e) {
      setEtapaParaExcluir(null);
      setErro(e instanceof Error ? e.message : 'Não foi possível excluir a etapa.');
    }
  };

  const confirmarExclusaoFunil = async () => {
    if (!funilParaExcluir) return;
    try {
      await excluirPipeline(funilParaExcluir.id);
      setFunilParaExcluir(null);
      await carregarPipelines();
    } catch (e) {
      setFunilParaExcluir(null);
      setErro(e instanceof Error ? e.message : 'Não foi possível excluir o funil.');
    }
  };

  return (
    <CrmLayout
      modulo="Configurações"
      titulo="Funis e etapas"
      subItens={CRM_SUBITENS_CONFIGURACOES}
      resumo="Renomeie, reordene e ajuste as etapas do seu funil de captação"
      acoes={
        <button
          type="button"
          onClick={() => setNovoFunilAberto(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-teal px-4 py-2.5 text-sm font-semibold text-white transition-smooth hover:opacity-90"
        >
          <i className="ri-add-line text-base" />
          Funil
        </button>
      }
    >
      {erro && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}
      {aviso && (
        <p className="mb-4 rounded-lg border border-primary-teal/40 bg-primary-teal/10 px-4 py-3 text-sm text-primary-teal">
          {aviso}
        </p>
      )}

      {/* Seleção e nome do funil */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-dark-border bg-dark-card p-4">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500" htmlFor="funil-atual">
            Funil
          </label>
          <select
            id="funil-atual"
            value={pipelineAtual}
            onChange={(e) => setPipelineAtual(e.target.value)}
            className={CAMPO}
          >
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        {funil && (
          <>
            <div className="flex-1 min-w-[12rem]">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500" htmlFor="funil-nome">
                Nome
              </label>
              <input
                id="funil-nome"
                className={`${CAMPO} w-full`}
                value={funil.nome}
                onChange={(e) =>
                  setPipelines((atuais) =>
                    atuais.map((p) => (p.id === funil.id ? { ...p, nome: e.target.value } : p))
                  )
                }
                onBlur={async () => {
                  await renomearPipeline(funil.id, funil.nome);
                  setAviso('Nome do funil salvo.');
                  setTimeout(() => setAviso(''), 2500);
                }}
              />
            </div>

            {pipelines.length > 1 && (
              <button
                type="button"
                onClick={() => setFunilParaExcluir(funil)}
                className="rounded-lg border border-dark-border px-3 py-2 text-sm text-gray-400 transition-smooth hover:bg-dark-hover hover:text-red-400"
              >
                Excluir funil
              </button>
            )}
          </>
        )}
      </div>

      {/* Etapas */}
      <div className="rounded-xl border border-dark-border bg-dark-card">
        <header className="grid grid-cols-[2.5rem_1fr_7rem_8rem_2.5rem] items-center gap-3 border-b border-dark-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <span>Ordem</span>
          <span>Nome da etapa</span>
          <span>Probabilidade</span>
          <span>Parado após</span>
          <span />
        </header>

        {carregando ? (
          <div className="p-10 text-center text-gray-500">
            <i className="ri-loader-4-line animate-spin text-2xl" />
          </div>
        ) : (
          <ul>
            {etapas.map((etapa, indice) => (
              <li
                key={etapa.id}
                className="grid grid-cols-[2.5rem_1fr_7rem_8rem_2.5rem] items-center gap-3 border-b border-dark-border/60 px-4 py-3 last:border-0"
              >
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => mover(indice, -1)}
                    disabled={indice === 0}
                    aria-label="Subir etapa"
                    className="text-gray-500 transition-smooth hover:text-primary-teal disabled:opacity-25"
                  >
                    <i className="ri-arrow-up-s-line" />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(indice, 1)}
                    disabled={indice === etapas.length - 1}
                    aria-label="Descer etapa"
                    className="text-gray-500 transition-smooth hover:text-primary-teal disabled:opacity-25"
                  >
                    <i className="ri-arrow-down-s-line" />
                  </button>
                </div>

                <div>
                  <input
                    className={`${CAMPO} w-full`}
                    value={etapa.nome}
                    aria-label={`Nome da etapa ${indice + 1}`}
                    onChange={(e) => alterarLocal(etapa.id, { nome: e.target.value })}
                    onBlur={() => salvarCampo(etapa.id, { nome: etapa.nome })}
                  />
                  {contagem[etapa.id] > 0 && (
                    <p className="mt-1 text-xs text-gray-600">
                      {contagem[etapa.id]} {contagem[etapa.id] === 1 ? 'negócio' : 'negócios'}
                    </p>
                  )}
                </div>

                <input
                  type="number"
                  min="0"
                  max="100"
                  aria-label={`Probabilidade da etapa ${indice + 1}`}
                  className={`${CAMPO} w-full`}
                  value={etapa.probabilidade}
                  onChange={(e) =>
                    alterarLocal(etapa.id, { probabilidade: Number(e.target.value) })
                  }
                  onBlur={() => salvarCampo(etapa.id, { probabilidade: etapa.probabilidade })}
                />

                <input
                  type="number"
                  min="0"
                  placeholder="dias"
                  aria-label={`Dias até sinalizar parado na etapa ${indice + 1}`}
                  className={`${CAMPO} w-full`}
                  value={etapa.rotting_dias ?? ''}
                  onChange={(e) =>
                    alterarLocal(etapa.id, {
                      rotting_dias: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  onBlur={() => salvarCampo(etapa.id, { rotting_dias: etapa.rotting_dias ?? null })}
                />

                <button
                  type="button"
                  onClick={() => setEtapaParaExcluir(etapa)}
                  aria-label={`Excluir etapa ${etapa.nome}`}
                  className="rounded p-1.5 text-gray-600 transition-smooth hover:bg-dark-hover hover:text-red-400"
                >
                  <i className="ri-delete-bin-line" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-dark-border px-4 py-3">
          <input
            className={`${CAMPO} flex-1 min-w-[12rem]`}
            placeholder="Nome da nova etapa"
            value={novaEtapa}
            onChange={(e) => setNovaEtapa(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') adicionarEtapa();
            }}
          />
          <button
            type="button"
            onClick={adicionarEtapa}
            className="flex items-center gap-1.5 rounded-lg border border-dark-border px-3 py-2 text-sm font-medium text-primary-teal transition-smooth hover:bg-dark-hover"
          >
            <i className="ri-add-line" />
            Adicionar etapa
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-600">
        <strong className="text-gray-500">Parado após</strong> é o número de dias sem movimento a
        partir do qual o negócio recebe o aviso laranja no funil. Deixe em branco para não avisar.
      </p>

      <CrmModal
        titulo="Novo funil"
        aberto={novoFunilAberto}
        onFechar={() => setNovoFunilAberto(false)}
        largura="max-w-md"
        rodape={
          <>
            <button
              type="button"
              onClick={() => setNovoFunilAberto(false)}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                if (nomeNovoFunil.trim() === '') return;
                const criado = await criarPipeline(nomeNovoFunil);
                setNomeNovoFunil('');
                setNovoFunilAberto(false);
                await carregarPipelines(criado.id);
              }}
              className="rounded-lg bg-primary-teal px-4 py-2 text-sm font-semibold text-white transition-smooth hover:opacity-90"
            >
              Criar
            </button>
          </>
        }
      >
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500" htmlFor="novo-funil">
          Nome do funil
        </label>
        <input
          id="novo-funil"
          className={`${CAMPO} w-full`}
          value={nomeNovoFunil}
          onChange={(e) => setNomeNovoFunil(e.target.value)}
          placeholder="Ex.: Captação de artistas"
        />
        <p className="mt-2 text-xs text-gray-600">
          O funil nasce sem etapas. Adicione as etapas depois de criá-lo.
        </p>
      </CrmModal>

      <CrmModal
        titulo="Excluir etapa"
        aberto={etapaParaExcluir !== null}
        onFechar={() => setEtapaParaExcluir(null)}
        largura="max-w-md"
        rodape={
          <>
            <button
              type="button"
              onClick={() => setEtapaParaExcluir(null)}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarExclusaoEtapa}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-smooth hover:bg-red-600"
            >
              Excluir
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-300">
          A etapa <strong className="text-white">{etapaParaExcluir?.nome}</strong> será removida.
          {etapaParaExcluir && contagem[etapaParaExcluir.id] > 0 && (
            <>
              {' '}Ela ainda tem {contagem[etapaParaExcluir.id]} negócio(s) — mova-os para outra
              etapa antes, senão o banco vai recusar a exclusão.
            </>
          )}
        </p>
      </CrmModal>

      <CrmModal
        titulo="Excluir funil"
        aberto={funilParaExcluir !== null}
        onFechar={() => setFunilParaExcluir(null)}
        largura="max-w-md"
        rodape={
          <>
            <button
              type="button"
              onClick={() => setFunilParaExcluir(null)}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarExclusaoFunil}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-smooth hover:bg-red-600"
            >
              Excluir
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-300">
          O funil <strong className="text-white">{funilParaExcluir?.nome}</strong> e todas as suas
          etapas serão removidos. Negócios existentes impedem a exclusão.
        </p>
      </CrmModal>
    </CrmLayout>
  );
}
