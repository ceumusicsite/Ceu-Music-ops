import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CrmLayout from '../../../components/crm/CrmLayout';
import { CRM_SUBITENS_NEGOCIOS } from '../../../components/crm/navegacao';
import CrmKanban from '../../../components/crm/CrmKanban';
import CrmNegocioForm from '../../../components/crm/CrmNegocioForm';
import {
  criarNegocio,
  listarEtapas,
  listarNegocios,
  listarPipelines,
  moverNegocio,
  type EntradaNegocio,
} from '../../../services/crm/deals';
import { listarOpcoesPessoas } from '../../../services/crm/persons';
import { listarOpcoesOrganizacoes } from '../../../services/crm/organizations';
import { listarUsuarios, type OpcaoUsuario } from '../../../services/crm/usuarios';
import { formatarMoeda } from '../../../services/crm/formato';
import type { CrmEtapa, CrmNegocio, CrmPipeline } from '../../../services/crm/types';

export default function CrmFunilPage() {
  const navigate = useNavigate();

  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [pipelineAtual, setPipelineAtual] = useState('');
  const [etapas, setEtapas] = useState<CrmEtapa[]>([]);
  const [negocios, setNegocios] = useState<CrmNegocio[]>([]);

  const [pessoas, setPessoas] = useState<{ id: string; nome: string }[]>([]);
  const [organizacoes, setOrganizacoes] = useState<{ id: string; nome: string }[]>([]);
  const [usuarios, setUsuarios] = useState<OpcaoUsuario[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [formAberto, setFormAberto] = useState(false);
  const [etapaInicial, setEtapaInicial] = useState<string | undefined>();
  const [salvando, setSalvando] = useState(false);

  const carregarFunil = useCallback(async (pipelineId: string) => {
    setCarregando(true);
    setErro('');
    try {
      const [listaEtapas, listaNegocios] = await Promise.all([
        listarEtapas(pipelineId),
        listarNegocios(pipelineId),
      ]);
      setEtapas(listaEtapas);
      setNegocios(listaNegocios);
    } catch (e) {
      console.error('Erro ao carregar o funil:', e);
      setErro('Não foi possível carregar o funil.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const carregarBase = async () => {
      try {
        const listaPipelines = await listarPipelines();
        setPipelines(listaPipelines);
        if (listaPipelines.length > 0) setPipelineAtual(listaPipelines[0].id);
        else setCarregando(false);
      } catch (e) {
        console.error('Erro ao carregar o funil:', e);
        setErro('Não foi possível carregar o funil.');
        setCarregando(false);
      }

      // Listas de vínculo só alimentam os selects do formulário: se alguma
      // falhar, o quadro continua utilizável.
      const [pessoasResultado, orgsResultado, usuariosResultado] = await Promise.allSettled([
        listarOpcoesPessoas(),
        listarOpcoesOrganizacoes(),
        listarUsuarios(),
      ]);

      if (pessoasResultado.status === 'fulfilled') setPessoas(pessoasResultado.value);
      if (orgsResultado.status === 'fulfilled') setOrganizacoes(orgsResultado.value);
      if (usuariosResultado.status === 'fulfilled') setUsuarios(usuariosResultado.value);
    };

    carregarBase();
  }, []);

  useEffect(() => {
    if (pipelineAtual) carregarFunil(pipelineAtual);
  }, [pipelineAtual, carregarFunil]);

  const totalAberto = useMemo(() => negocios.reduce((soma, n) => soma + n.valor, 0), [negocios]);

  const mover = async (negocioId: string, etapaDestinoId: string, posicao: number) => {
    const destino = negocios
      .filter((n) => n.stage_id === etapaDestinoId)
      .sort((a, b) => a.ordem - b.ordem);

    // Move na tela primeiro: o arraste precisa responder na hora.
    const anterior = negocios;
    setNegocios((atuais) =>
      atuais.map((n) => (n.id === negocioId ? { ...n, stage_id: etapaDestinoId } : n))
    );

    try {
      await moverNegocio(negocioId, etapaDestinoId, destino, posicao);
      await carregarFunil(pipelineAtual);
    } catch (e) {
      console.error('Erro ao mover negócio:', e);
      setNegocios(anterior);
      setErro('Não foi possível mover o negócio.');
    }
  };

  const abrirNovo = (etapaId?: string) => {
    setEtapaInicial(etapaId);
    setFormAberto(true);
  };

  const salvar = async (entrada: EntradaNegocio) => {
    setSalvando(true);
    setErro('');
    try {
      await criarNegocio(entrada);
      await carregarFunil(pipelineAtual);
      setFormAberto(false);
    } catch (e) {
      console.error('Erro ao salvar negócio:', e);
      setErro('Não foi possível salvar o negócio.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <CrmLayout
      modulo="Negócios"
      titulo="Funil"
      subItens={CRM_SUBITENS_NEGOCIOS}
      resumo={
        carregando
          ? 'Carregando…'
          : `${negocios.length} ${negocios.length === 1 ? 'negócio aberto' : 'negócios abertos'} · ${formatarMoeda(totalAberto)}`
      }
      acoes={
        <>
          {pipelines.length > 1 && (
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
          )}
          <button
            type="button"
            onClick={() => abrirNovo()}
            className="flex items-center gap-2 rounded-lg bg-primary-teal px-4 py-2.5 text-sm font-semibold text-white transition-smooth hover:opacity-90"
          >
            <i className="ri-add-line text-base" />
            Negócio
          </button>
        </>
      }
    >
      {erro && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}

      {carregando ? (
        <div className="rounded-xl border border-dark-border bg-dark-card p-10 text-center text-gray-500">
          <i className="ri-loader-4-line animate-spin text-2xl" />
          <p className="mt-2 text-sm">Carregando funil…</p>
        </div>
      ) : etapas.length === 0 ? (
        <div className="rounded-xl border border-dark-border bg-dark-card p-10 text-center text-gray-500">
          <i className="ri-layout-column-line text-3xl text-gray-600" />
          <p className="mt-2 text-sm">
            Nenhuma etapa cadastrada neste funil.
          </p>
        </div>
      ) : (
        <CrmKanban
          etapas={etapas}
          negocios={negocios}
          onMover={mover}
          onAbrirNegocio={(negocio) => navigate(`/crm/negocios/${negocio.id}`)}
          onNovoNegocio={abrirNovo}
        />
      )}

      <CrmNegocioForm
        aberto={formAberto}
        negocio={null}
        pipelineId={pipelineAtual}
        etapaInicialId={etapaInicial}
        etapas={etapas}
        pessoas={pessoas}
        organizacoes={organizacoes}
        usuarios={usuarios}
        salvando={salvando}
        onSalvar={salvar}
        onFechar={() => setFormAberto(false)}
      />
    </CrmLayout>
  );
}
