import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CrmLayout from '../../../components/crm/CrmLayout';
import { CRM_SUBITENS_NEGOCIOS } from '../../../components/crm/navegacao';
import CrmBarraEtapas from '../../../components/crm/CrmBarraEtapas';
import CrmNegocioForm from '../../../components/crm/CrmNegocioForm';
import CrmModal from '../../../components/crm/CrmModal';
import CrmLinhaDoTempo from '../../../components/crm/CrmLinhaDoTempo';
import CrmProdutosDoNegocio from '../../../components/crm/CrmProdutosDoNegocio';
import { listarCampos, type CrmCampoPersonalizado } from '../../../services/crm/customFields';
import {
  alterarEtapa,
  atualizarNegocio,
  buscarNegocio,
  excluirNegocios,
  listarEtapas,
  listarPipelines,
  marcarComoGanho,
  marcarComoPerdido,
  reabrirNegocio,
  rotuloStatus,
  type EntradaNegocio,
} from '../../../services/crm/deals';
import { listarOpcoesPessoas } from '../../../services/crm/persons';
import { listarOpcoesOrganizacoes } from '../../../services/crm/organizations';
import { listarUsuarios, type OpcaoUsuario } from '../../../services/crm/usuarios';
import { formatarData, formatarMoeda, iniciais } from '../../../services/crm/formato';
import type { CrmEtapa, CrmNegocio, CrmPipeline } from '../../../services/crm/types';

export default function CrmNegocioDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [negocio, setNegocio] = useState<CrmNegocio | null>(null);
  const [etapas, setEtapas] = useState<CrmEtapa[]>([]);
  const [pipeline, setPipeline] = useState<CrmPipeline | null>(null);
  const [pessoas, setPessoas] = useState<{ id: string; nome: string }[]>([]);
  const [organizacoes, setOrganizacoes] = useState<{ id: string; nome: string }[]>([]);
  const [usuarios, setUsuarios] = useState<OpcaoUsuario[]>([]);
  const [campos, setCampos] = useState<CrmCampoPersonalizado[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [formAberto, setFormAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [perdaAberta, setPerdaAberta] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');
  const [exclusaoAberta, setExclusaoAberta] = useState(false);

  const carregar = useCallback(async () => {
    if (!id) return;
    setCarregando(true);
    setErro('');
    try {
      const encontrado = await buscarNegocio(id);
      if (!encontrado) {
        setErro('Negócio não encontrado.');
        return;
      }

      const [listaEtapas, listaPipelines] = await Promise.all([
        listarEtapas(encontrado.pipeline_id),
        listarPipelines(),
      ]);

      setNegocio(encontrado);
      setEtapas(listaEtapas);
      setPipeline(listaPipelines.find((p) => p.id === encontrado.pipeline_id) ?? null);

      // Opções dos selects: falhar aqui não pode esconder o negócio.
      const [pessoasResultado, orgsResultado, usuariosResultado] = await Promise.allSettled([
        listarOpcoesPessoas(),
        listarOpcoesOrganizacoes(),
        listarUsuarios(),
      ]);

      if (pessoasResultado.status === 'fulfilled') setPessoas(pessoasResultado.value);
      if (orgsResultado.status === 'fulfilled') setOrganizacoes(orgsResultado.value);
      if (usuariosResultado.status === 'fulfilled') setUsuarios(usuariosResultado.value);

      listarCampos('negocio')
        .then(setCampos)
        .catch((e) => console.error('Erro ao carregar campos personalizados:', e));
    } catch (e) {
      console.error('Erro ao carregar negócio:', e);
      setErro('Não foi possível carregar o negócio.');
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const fechado = negocio !== null && negocio.status !== 'aberto';

  const moverEtapa = async (etapaId: string) => {
    if (!negocio || fechado || etapaId === negocio.stage_id) return;
    const anterior = negocio;
    setNegocio({ ...negocio, stage_id: etapaId, data_entrada_etapa: new Date().toISOString() });
    try {
      await alterarEtapa(negocio.id, etapaId);
      await carregar();
    } catch (e) {
      console.error('Erro ao mover etapa:', e);
      setNegocio(anterior);
      setErro('Não foi possível mover o negócio de etapa.');
    }
  };

  const salvar = async (entrada: EntradaNegocio) => {
    if (!negocio) return;
    setSalvando(true);
    try {
      await atualizarNegocio(negocio.id, entrada);
      setFormAberto(false);
      await carregar();
    } catch (e) {
      console.error('Erro ao salvar negócio:', e);
      setErro('Não foi possível salvar o negócio.');
    } finally {
      setSalvando(false);
    }
  };

  const etapaAtual = etapas.find((e) => e.id === negocio?.stage_id);

  if (carregando) {
    return (
      <CrmLayout modulo="Negócios" titulo="Detalhe" subItens={CRM_SUBITENS_NEGOCIOS}>
        <div className="rounded-xl border border-dark-border bg-dark-card p-10 text-center text-gray-500">
          <i className="ri-loader-4-line animate-spin text-2xl" />
          <p className="mt-2 text-sm">Carregando negócio…</p>
        </div>
      </CrmLayout>
    );
  }

  if (!negocio) {
    return (
      <CrmLayout modulo="Negócios" titulo="Detalhe" subItens={CRM_SUBITENS_NEGOCIOS}>
        <div className="rounded-xl border border-dark-border bg-dark-card p-10 text-center text-gray-500">
          <p className="text-sm">{erro || 'Negócio não encontrado.'}</p>
          <Link to="/crm/negocios/funil" className="mt-3 inline-block text-sm text-primary-teal hover:underline">
            Voltar ao funil
          </Link>
        </div>
      </CrmLayout>
    );
  }

  return (
    <CrmLayout modulo="Negócios" titulo={negocio.titulo} subItens={CRM_SUBITENS_NEGOCIOS}>
      {erro && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}

      {/* Cabeçalho do negócio */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-white">{negocio.titulo}</h1>
          <p className="mt-1 text-sm text-gray-500">
            <Link to="/crm/negocios/funil" className="hover:text-primary-teal">
              {pipeline?.nome ?? 'Funil'}
            </Link>
            {' › '}
            {etapaAtual?.nome ?? '—'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {negocio.dono_nome && (
            <div className="mr-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-hover text-xs font-semibold text-gray-300">
                {iniciais(negocio.dono_nome)}
              </span>
              <div className="leading-tight">
                <p className="text-sm text-white">{negocio.dono_nome}</p>
                <p className="text-xs text-gray-500">Responsável</p>
              </div>
            </div>
          )}

          {fechado ? (
            <>
              <span
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  negocio.status === 'ganho'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {rotuloStatus(negocio.status)}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await reabrirNegocio(negocio.id);
                  await carregar();
                }}
                className="rounded-lg border border-dark-border px-3 py-2 text-sm text-gray-300 transition-smooth hover:bg-dark-hover hover:text-white"
              >
                Reabrir
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={async () => {
                  await marcarComoGanho(negocio.id);
                  await carregar();
                }}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-smooth hover:bg-green-700"
              >
                Ganho
              </button>
              <button
                type="button"
                onClick={() => setPerdaAberta(true)}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-smooth hover:bg-red-600"
              >
                Perdido
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setExclusaoAberta(true)}
            aria-label="Excluir negócio"
            className="rounded-lg border border-dark-border px-2.5 py-2 text-gray-500 transition-smooth hover:bg-dark-hover hover:text-red-400"
          >
            <i className="ri-delete-bin-line" />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <CrmBarraEtapas
          etapas={etapas}
          etapaAtualId={negocio.stage_id}
          dataEntradaEtapa={negocio.data_entrada_etapa}
          desabilitado={fechado}
          onEscolherEtapa={moverEtapa}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        {/* Resumo */}
        <aside className="rounded-xl border border-dark-border bg-dark-card">
          <header className="flex items-center justify-between border-b border-dark-border px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Resumo</h2>
            <button
              type="button"
              onClick={() => setFormAberto(true)}
              className="text-xs font-medium text-primary-teal hover:underline"
            >
              Editar
            </button>
          </header>

          <dl className="space-y-3 px-4 py-4 text-sm">
            <Linha icone="ri-money-dollar-circle-line" rotulo="Valor">
              <span className="font-semibold text-primary-teal">
                {formatarMoeda(negocio.valor, negocio.moeda)}
              </span>
            </Linha>

            <Linha icone="ri-building-line" rotulo="Organização">
              {negocio.organizacao_nome ? (
                <Link
                  to="/crm/contatos/organizacoes"
                  className="text-primary-teal hover:underline"
                >
                  {negocio.organizacao_nome}
                </Link>
              ) : (
                <span className="text-gray-600">—</span>
              )}
            </Linha>

            <Linha icone="ri-user-line" rotulo="Pessoa de contato">
              {negocio.person_nome ? (
                <Link to="/crm/contatos/pessoas" className="text-primary-teal hover:underline">
                  {negocio.person_nome}
                </Link>
              ) : (
                <span className="text-gray-600">—</span>
              )}
            </Linha>

            <Linha icone="ri-flag-line" rotulo="Previsão de fechamento">
              {formatarData(negocio.data_prevista_fechamento)}
            </Linha>

            <Linha icone="ri-compass-3-line" rotulo="Origem">
              {negocio.origem || <span className="text-gray-600">—</span>}
            </Linha>

            {negocio.motivo_perda && (
              <Linha icone="ri-close-circle-line" rotulo="Motivo da perda">
                {negocio.motivo_perda}
              </Linha>
            )}

            {campos.map((campo) => {
              const valor = negocio.custom_fields?.[campo.chave];
              const vazio =
                valor === undefined ||
                valor === null ||
                valor === '' ||
                (Array.isArray(valor) && valor.length === 0);

              return (
                <Linha key={campo.id} icone="ri-price-tag-line" rotulo={campo.nome}>
                  {vazio ? (
                    <span className="text-gray-600">—</span>
                  ) : Array.isArray(valor) ? (
                    valor.join(', ')
                  ) : campo.tipo === 'checkbox' ? (
                    valor === true ? 'Sim' : 'Não'
                  ) : campo.tipo === 'data' ? (
                    formatarData(String(valor))
                  ) : (
                    String(valor)
                  )}
                </Linha>
              );
            })}
          </dl>
        </aside>

        <div className="space-y-4">
          <CrmProdutosDoNegocio
            dealId={negocio.id}
            onValorAlterado={(novoValor) =>
              setNegocio((atual) => (atual ? { ...atual, valor: novoValor } : atual))
            }
          />
          <CrmLinhaDoTempo vinculo={{ campo: 'deal_id', id: negocio.id }} usuarios={usuarios} />
        </div>
      </div>

      <CrmNegocioForm
        aberto={formAberto}
        negocio={negocio}
        pipelineId={negocio.pipeline_id}
        etapas={etapas}
        pessoas={pessoas}
        organizacoes={organizacoes}
        usuarios={usuarios}
        salvando={salvando}
        onSalvar={salvar}
        onFechar={() => setFormAberto(false)}
      />

      <CrmModal
        titulo="Marcar como perdido"
        aberto={perdaAberta}
        onFechar={() => setPerdaAberta(false)}
        largura="max-w-md"
        rodape={
          <>
            <button
              type="button"
              onClick={() => setPerdaAberta(false)}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                await marcarComoPerdido(negocio.id, motivoPerda);
                setPerdaAberta(false);
                setMotivoPerda('');
                await carregar();
              }}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-smooth hover:bg-red-600"
            >
              Confirmar perda
            </button>
          </>
        }
      >
        <label
          className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500"
          htmlFor="motivo-perda-detalhe"
        >
          Motivo da perda
        </label>
        <textarea
          id="motivo-perda-detalhe"
          rows={3}
          value={motivoPerda}
          onChange={(e) => setMotivoPerda(e.target.value)}
          placeholder="Ex.: preço acima do orçamento do cliente"
          className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary-teal"
        />
      </CrmModal>

      <CrmModal
        titulo="Excluir negócio"
        aberto={exclusaoAberta}
        onFechar={() => setExclusaoAberta(false)}
        largura="max-w-md"
        rodape={
          <>
            <button
              type="button"
              onClick={() => setExclusaoAberta(false)}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                await excluirNegocios([negocio.id]);
                navigate('/crm/negocios/funil');
              }}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-smooth hover:bg-red-600"
            >
              Excluir
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-300">
          As atividades e notas vinculadas também serão removidas. A ação não pode ser desfeita.
        </p>
      </CrmModal>
    </CrmLayout>
  );
}

function Linha({
  icone,
  rotulo,
  children,
}: {
  icone: string;
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <i className={`${icone} mt-0.5 text-base text-gray-600`} />
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wide text-gray-500">{rotulo}</dt>
        <dd className="mt-0.5 break-words text-gray-200">{children}</dd>
      </div>
    </div>
  );
}
