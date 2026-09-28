import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CrmLayout from '../../../components/crm/CrmLayout';
import { CRM_SUBITENS_NEGOCIOS } from '../../../components/crm/navegacao';
import CrmDataTable from '../../../components/crm/CrmDataTable';
import CrmFiltroBar from '../../../components/crm/CrmFiltroBar';
import CrmModal from '../../../components/crm/CrmModal';
import { aplicarFiltros, CONDICOES_VAZIAS } from '../../../services/crm/filtro';
import {
  excluirNegocios,
  listarEtapas,
  listarNegocios,
  listarPipelines,
  rotuloStatus,
} from '../../../services/crm/deals';
import { formatarData, formatarMoeda } from '../../../services/crm/formato';
import type {
  CrmColuna,
  CrmCondicoesFiltro,
  CrmEtapa,
  CrmNegocio,
  CrmPipeline,
} from '../../../services/crm/types';

const CAMPOS_FILTRO = [
  { chave: 'titulo', titulo: 'Título' },
  { chave: 'organizacao', titulo: 'Organização' },
  { chave: 'pessoa', titulo: 'Pessoa' },
  { chave: 'etapa', titulo: 'Etapa' },
  { chave: 'status', titulo: 'Status' },
  { chave: 'valor', titulo: 'Valor' },
  { chave: 'responsavel', titulo: 'Responsável' },
  { chave: 'origem', titulo: 'Origem' },
];

const CAMPOS_BUSCA = ['titulo', 'organizacao', 'pessoa'];

const COR_STATUS: Record<string, string> = {
  aberto: 'bg-primary-teal/15 text-primary-teal',
  ganho: 'bg-green-500/15 text-green-400',
  perdido: 'bg-red-500/15 text-red-400',
  arquivado: 'bg-gray-500/15 text-gray-400',
};

export default function CrmNegociosListaPage() {
  const navigate = useNavigate();
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [pipelineAtual, setPipelineAtual] = useState('');
  const [etapas, setEtapas] = useState<CrmEtapa[]>([]);
  const [negocios, setNegocios] = useState<CrmNegocio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [busca, setBusca] = useState('');
  const [condicoes, setCondicoes] = useState<CrmCondicoesFiltro>(CONDICOES_VAZIAS);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  useEffect(() => {
    listarPipelines()
      .then((lista) => {
        setPipelines(lista);
        if (lista.length > 0) setPipelineAtual(lista[0].id);
        else setCarregando(false);
      })
      .catch((e) => {
        console.error('Erro ao carregar funis:', e);
        setErro('Não foi possível carregar os funis.');
        setCarregando(false);
      });
  }, []);

  useEffect(() => {
    if (!pipelineAtual) return;
    carregar(pipelineAtual);
  }, [pipelineAtual]);

  const carregar = async (pipelineId: string) => {
    setCarregando(true);
    setErro('');
    try {
      // Aqui, diferente do funil, ganhos e perdidos também aparecem.
      const [listaEtapas, listaNegocios] = await Promise.all([
        listarEtapas(pipelineId),
        listarNegocios(pipelineId, true),
      ]);
      setEtapas(listaEtapas);
      setNegocios(listaNegocios);
    } catch (e) {
      console.error('Erro ao carregar negócios:', e);
      setErro('Não foi possível carregar os negócios.');
    } finally {
      setCarregando(false);
    }
  };

  const nomeEtapa = (id: string) => etapas.find((e) => e.id === id)?.nome ?? '—';

  const valorDe = (negocio: CrmNegocio, campo: string): string | number | null | undefined => {
    switch (campo) {
      case 'titulo':
        return negocio.titulo;
      case 'organizacao':
        return negocio.organizacao_nome;
      case 'pessoa':
        return negocio.person_nome;
      case 'etapa':
        return nomeEtapa(negocio.stage_id);
      case 'status':
        return rotuloStatus(negocio.status);
      case 'valor':
        return negocio.valor;
      case 'responsavel':
        return negocio.dono_nome;
      case 'origem':
        return negocio.origem;
      case 'previsao':
        return negocio.data_prevista_fechamento;
      default:
        return null;
    }
  };

  const filtrados = useMemo(
    () => aplicarFiltros(negocios, busca, condicoes, valorDe, CAMPOS_BUSCA),
    // nomeEtapa depende de `etapas`, por isso ele entra nas dependências
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [negocios, busca, condicoes, etapas]
  );

  const totalFiltrado = filtrados.reduce((soma, n) => soma + n.valor, 0);

  const colunas: CrmColuna<CrmNegocio>[] = [
    {
      chave: 'titulo',
      titulo: 'Título',
      fixa: true,
      valor: (n) => n.titulo,
      render: (n) => <span className="font-medium text-white">{n.titulo}</span>,
    },
    {
      chave: 'organizacao',
      titulo: 'Organização',
      valor: (n) => n.organizacao_nome ?? '',
      render: (n) => n.organizacao_nome ?? <span className="text-gray-600">—</span>,
    },
    {
      chave: 'valor',
      titulo: 'Valor',
      alinhamento: 'right',
      valor: (n) => n.valor,
      render: (n) => (
        <span className="font-semibold text-primary-teal">
          {formatarMoeda(n.valor, n.moeda)}
        </span>
      ),
    },
    {
      chave: 'etapa',
      titulo: 'Etapa',
      valor: (n) => nomeEtapa(n.stage_id),
      render: (n) => nomeEtapa(n.stage_id),
    },
    {
      chave: 'status',
      titulo: 'Status',
      valor: (n) => n.status,
      render: (n) => (
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${COR_STATUS[n.status]}`}>
          {rotuloStatus(n.status)}
        </span>
      ),
    },
    {
      chave: 'responsavel',
      titulo: 'Responsável',
      valor: (n) => n.dono_nome ?? '',
      render: (n) => n.dono_nome ?? <span className="text-gray-600">—</span>,
    },
    {
      chave: 'previsao',
      titulo: 'Previsão',
      visivelPorPadrao: false,
      valor: (n) => n.data_prevista_fechamento ?? '',
      render: (n) => formatarData(n.data_prevista_fechamento),
    },
    {
      chave: 'origem',
      titulo: 'Origem',
      visivelPorPadrao: false,
      valor: (n) => n.origem ?? '',
      render: (n) => n.origem ?? <span className="text-gray-600">—</span>,
    },
  ];

  const excluirSelecionados = async () => {
    try {
      await excluirNegocios(selecionados);
      setNegocios((atuais) => atuais.filter((n) => !selecionados.includes(n.id)));
      setSelecionados([]);
    } catch (e) {
      console.error('Erro ao excluir negócios:', e);
      setErro('Não foi possível excluir os negócios selecionados.');
    } finally {
      setConfirmarExclusao(false);
    }
  };

  return (
    <CrmLayout
      modulo="Negócios"
      titulo="Lista"
      subItens={CRM_SUBITENS_NEGOCIOS}
      resumo={
        carregando
          ? 'Carregando…'
          : `${filtrados.length} ${filtrados.length === 1 ? 'negócio' : 'negócios'} · ${formatarMoeda(totalFiltrado)}`
      }
      acoes={
        pipelines.length > 1 && (
          <select
            value={pipelineAtual}
            onChange={(e) => setPipelineAtual(e.target.value)}
            aria-label="Funil"
            className="rounded-lg border border-dark-border bg-dark-card px-3 py-2.5 text-sm text-white outline-none focus:border-primary-teal"
          >
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        )
      }
    >
      {erro && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}

      <div className="mb-4">
        <CrmFiltroBar
          busca={busca}
          onBuscaChange={setBusca}
          placeholder="Pesquisar negócios…"
          campos={CAMPOS_FILTRO}
          condicoes={condicoes}
          onCondicoesChange={setCondicoes}
          entidade="negocio"
        />
      </div>

      {selecionados.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary-teal/40 bg-primary-teal/10 px-4 py-3">
          <span className="text-sm text-white">
            {selecionados.length} {selecionados.length === 1 ? 'selecionado' : 'selecionados'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelecionados([])}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-300 transition-smooth hover:bg-dark-hover hover:text-white"
            >
              Limpar seleção
            </button>
            <button
              type="button"
              onClick={() => setConfirmarExclusao(true)}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-300 transition-smooth hover:bg-red-500/30"
            >
              <i className="ri-delete-bin-line" />
              Excluir
            </button>
          </div>
        </div>
      )}

      <CrmDataTable
        colunas={colunas}
        itens={filtrados}
        idDe={(n) => n.id}
        carregando={carregando}
        selecionados={selecionados}
        onSelecionadosChange={setSelecionados}
        preferenciaDe="negocio"
        onLinhaClick={(negocio) => navigate(`/crm/negocios/${negocio.id}`)}
        vazio={
          <div>
            <i className="ri-briefcase-line text-3xl text-gray-600" />
            <p className="mt-2 text-sm">
              {negocios.length === 0
                ? 'Nenhum negócio cadastrado. Crie o primeiro pelo funil.'
                : 'Nenhum negócio corresponde aos filtros.'}
            </p>
          </div>
        }
      />

      <CrmModal
        titulo="Excluir negócios"
        aberto={confirmarExclusao}
        onFechar={() => setConfirmarExclusao(false)}
        largura="max-w-md"
        rodape={
          <>
            <button
              type="button"
              onClick={() => setConfirmarExclusao(false)}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={excluirSelecionados}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-smooth hover:bg-red-600"
            >
              Excluir
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-300">
          As atividades e notas vinculadas a estes negócios também serão removidas. A ação não pode
          ser desfeita.
        </p>
      </CrmModal>
    </CrmLayout>
  );
}
