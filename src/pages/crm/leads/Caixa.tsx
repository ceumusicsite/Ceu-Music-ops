import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CrmLayout from '../../../components/crm/CrmLayout';
import { CRM_SUBITENS_LEADS } from '../../../components/crm/navegacao';
import CrmDataTable from '../../../components/crm/CrmDataTable';
import CrmFiltroBar from '../../../components/crm/CrmFiltroBar';
import CrmModal from '../../../components/crm/CrmModal';
import { aplicarFiltros, CONDICOES_VAZIAS } from '../../../services/crm/filtro';
import {
  arquivarLead,
  atualizarLead,
  converterEmNegocio,
  criarLead,
  excluirLeads,
  listarLeads,
  type EntradaLead,
} from '../../../services/crm/leads';
import { definirEtiquetas, listarEtiquetas, listarVinculosDeEtiqueta } from '../../../services/crm/labels';
import { listarPipelines } from '../../../services/crm/deals';
import { listarOpcoesPessoas } from '../../../services/crm/persons';
import { listarOpcoesOrganizacoes } from '../../../services/crm/organizations';
import { listarUsuarios, type OpcaoUsuario } from '../../../services/crm/usuarios';
import { formatarData, formatarMoeda } from '../../../services/crm/formato';
import type {
  CrmColuna,
  CrmCondicoesFiltro,
  CrmLabel,
  CrmLead,
  CrmPipeline,
  StatusLead,
} from '../../../services/crm/types';

const CAMPO =
  'w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-smooth focus:border-primary-teal';
const ROTULO = 'mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500';

const CAMPOS_FILTRO = [
  { chave: 'titulo', titulo: 'Título' },
  { chave: 'pessoa', titulo: 'Pessoa de contato' },
  { chave: 'organizacao', titulo: 'Organização' },
  { chave: 'valor', titulo: 'Valor' },
  { chave: 'origem', titulo: 'Origem' },
  { chave: 'responsavel', titulo: 'Responsável' },
];

const CAMPOS_BUSCA = ['titulo', 'pessoa', 'organizacao', 'origem'];

const ABAS: { valor: StatusLead | 'todos'; rotulo: string }[] = [
  { valor: 'ativo', rotulo: 'Caixa de entrada' },
  { valor: 'convertido', rotulo: 'Convertidos' },
  { valor: 'arquivado', rotulo: 'Arquivados' },
  { valor: 'todos', rotulo: 'Todos' },
];

const ENTRADA_VAZIA: EntradaLead = {
  titulo: '',
  valor: 0,
  moeda: 'BRL',
  origem: '',
  observacoes: '',
  dono_id: null,
  person_id: null,
  organizacao_id: null,
};

export default function CrmLeadsPage() {
  const navigate = useNavigate();

  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [etiquetas, setEtiquetas] = useState<CrmLabel[]>([]);
  const [vinculos, setVinculos] = useState<Record<string, string[]>>({});
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [pessoas, setPessoas] = useState<{ id: string; nome: string }[]>([]);
  const [organizacoes, setOrganizacoes] = useState<{ id: string; nome: string }[]>([]);
  const [usuarios, setUsuarios] = useState<OpcaoUsuario[]>([]);

  const [status, setStatus] = useState<StatusLead | 'todos'>('ativo');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [busca, setBusca] = useState('');
  const [condicoes, setCondicoes] = useState<CrmCondicoesFiltro>(CONDICOES_VAZIAS);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<CrmLead | null>(null);
  const [form, setForm] = useState<EntradaLead>(ENTRADA_VAZIA);
  const [etiquetasForm, setEtiquetasForm] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [conversaoAberta, setConversaoAberta] = useState<CrmLead | null>(null);
  const [funilEscolhido, setFunilEscolhido] = useState('');
  const [exclusaoAberta, setExclusaoAberta] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      setLeads(await listarLeads(status));
    } catch (e) {
      console.error('Erro ao carregar leads:', e);
      setErro('Não foi possível carregar os leads.');
    } finally {
      setCarregando(false);
    }
  }, [status]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    const carregarAuxiliares = async () => {
      const resultados = await Promise.allSettled([
        listarEtiquetas('lead'),
        listarVinculosDeEtiqueta('lead'),
        listarPipelines(),
        listarOpcoesPessoas(),
        listarOpcoesOrganizacoes(),
        listarUsuarios(),
      ]);

      const [rotulos, vinc, funis, listaPessoas, listaOrgs, listaUsuarios] = resultados;
      if (rotulos.status === 'fulfilled') setEtiquetas(rotulos.value);
      if (vinc.status === 'fulfilled') setVinculos(vinc.value);
      if (funis.status === 'fulfilled') {
        setPipelines(funis.value);
        if (funis.value.length > 0) setFunilEscolhido(funis.value[0].id);
      }
      if (listaPessoas.status === 'fulfilled') setPessoas(listaPessoas.value);
      if (listaOrgs.status === 'fulfilled') setOrganizacoes(listaOrgs.value);
      if (listaUsuarios.status === 'fulfilled') setUsuarios(listaUsuarios.value);
    };

    carregarAuxiliares();
  }, []);

  const valorDe = (lead: CrmLead, campo: string): string | number | null | undefined => {
    switch (campo) {
      case 'titulo':
        return lead.titulo;
      case 'pessoa':
        return lead.person_nome;
      case 'organizacao':
        return lead.organizacao_nome;
      case 'valor':
        return lead.valor;
      case 'origem':
        return lead.origem;
      case 'responsavel':
        return lead.dono_nome;
      case 'criado_em':
        return lead.created_at;
      default:
        return null;
    }
  };

  const filtrados = useMemo(
    () => aplicarFiltros(leads, busca, condicoes, valorDe, CAMPOS_BUSCA),
    [leads, busca, condicoes]
  );

  const colunas: CrmColuna<CrmLead>[] = [
    {
      chave: 'titulo',
      titulo: 'Título',
      fixa: true,
      valor: (l) => l.titulo,
      render: (l) => (
        <div>
          <span className="font-medium text-white">{l.titulo}</span>
          {(vinculos[l.id] ?? []).length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {(vinculos[l.id] ?? []).map((labelId) => {
                const etiqueta = etiquetas.find((e) => e.id === labelId);
                if (!etiqueta) return null;
                return (
                  <span
                    key={labelId}
                    style={{ backgroundColor: `${etiqueta.cor}25`, color: etiqueta.cor }}
                    className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                  >
                    {etiqueta.nome}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
    {
      chave: 'pessoa',
      titulo: 'Pessoa de contato',
      valor: (l) => l.person_nome ?? '',
      render: (l) => l.person_nome ?? <span className="text-gray-600">—</span>,
    },
    {
      chave: 'organizacao',
      titulo: 'Organização',
      valor: (l) => l.organizacao_nome ?? '',
      render: (l) => l.organizacao_nome ?? <span className="text-gray-600">—</span>,
    },
    {
      chave: 'valor',
      titulo: 'Valor',
      alinhamento: 'right',
      valor: (l) => l.valor,
      render: (l) => (
        <span className="font-semibold text-primary-teal">{formatarMoeda(l.valor, l.moeda)}</span>
      ),
    },
    {
      chave: 'origem',
      titulo: 'Origem',
      valor: (l) => l.origem ?? '',
      render: (l) => l.origem ?? <span className="text-gray-600">—</span>,
    },
    {
      chave: 'responsavel',
      titulo: 'Responsável',
      visivelPorPadrao: false,
      valor: (l) => l.dono_nome ?? '',
      render: (l) => l.dono_nome ?? <span className="text-gray-600">—</span>,
    },
    {
      chave: 'criado_em',
      titulo: 'Criado',
      valor: (l) => l.created_at,
      render: (l) => formatarData(l.created_at),
    },
  ];

  const abrirNovo = () => {
    setEmEdicao(null);
    setForm(ENTRADA_VAZIA);
    setEtiquetasForm([]);
    setFormAberto(true);
  };

  const abrirEdicao = (lead: CrmLead) => {
    setEmEdicao(lead);
    setForm({
      titulo: lead.titulo,
      valor: lead.valor,
      moeda: lead.moeda,
      origem: lead.origem ?? '',
      observacoes: lead.observacoes ?? '',
      dono_id: lead.dono_id ?? null,
      person_id: lead.person_id ?? null,
      organizacao_id: lead.organizacao_id ?? null,
    });
    setEtiquetasForm(vinculos[lead.id] ?? []);
    setFormAberto(true);
  };

  const alterar = (campo: keyof EntradaLead, valor: unknown) =>
    setForm((atual) => ({ ...atual, [campo]: valor }));

  const salvar = async () => {
    if (form.titulo.trim() === '') {
      setErro('O título do lead é obrigatório.');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      const entrada = { ...form, titulo: form.titulo.trim() };
      const id = emEdicao ? emEdicao.id : (await criarLead(entrada)).id;
      if (emEdicao) await atualizarLead(emEdicao.id, entrada);

      await definirEtiquetas('lead', id, etiquetasForm);
      setVinculos((atuais) => ({ ...atuais, [id]: etiquetasForm }));

      setFormAberto(false);
      setEmEdicao(null);
      await carregar();
    } catch (e) {
      console.error('Erro ao salvar lead:', e);
      setErro('Não foi possível salvar o lead.');
    } finally {
      setSalvando(false);
    }
  };

  const converter = async () => {
    if (!conversaoAberta || !funilEscolhido) return;
    try {
      const negocioId = await converterEmNegocio(conversaoAberta, funilEscolhido);
      setConversaoAberta(null);
      navigate(`/crm/negocios/${negocioId}`);
    } catch (e) {
      console.error('Erro ao converter lead:', e);
      setConversaoAberta(null);
      setErro(e instanceof Error ? e.message : 'Não foi possível converter o lead.');
    }
  };

  return (
    <CrmLayout
      modulo="Leads"
      titulo="Caixa de entrada"
      subItens={CRM_SUBITENS_LEADS}
      resumo={
        carregando ? 'Carregando…' : `${filtrados.length} ${filtrados.length === 1 ? 'lead' : 'leads'}`
      }
      acoes={
        <button
          type="button"
          onClick={abrirNovo}
          className="flex items-center gap-2 rounded-lg bg-primary-teal px-4 py-2.5 text-sm font-semibold text-white transition-smooth hover:opacity-90"
        >
          <i className="ri-add-line text-base" />
          Lead
        </button>
      }
    >
      {erro && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-dark-border pb-3">
        {ABAS.map((item) => (
          <button
            key={item.valor}
            type="button"
            onClick={() => {
              setStatus(item.valor);
              setSelecionados([]);
            }}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-smooth ${
              status === item.valor
                ? 'bg-primary-teal/15 font-medium text-primary-teal'
                : 'text-gray-400 hover:bg-dark-hover hover:text-white'
            }`}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <CrmFiltroBar
          busca={busca}
          onBuscaChange={setBusca}
          placeholder="Pesquisar leads…"
          campos={CAMPOS_FILTRO}
          condicoes={condicoes}
          onCondicoesChange={setCondicoes}
          entidade="lead"
        />
      </div>

      {selecionados.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary-teal/40 bg-primary-teal/10 px-4 py-3">
          <span className="text-sm text-white">{selecionados.length} selecionado(s)</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await Promise.all(selecionados.map((id) => arquivarLead(id, status !== 'arquivado')));
                setSelecionados([]);
                await carregar();
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-300 transition-smooth hover:bg-dark-hover hover:text-white"
            >
              {status === 'arquivado' ? 'Desarquivar' : 'Arquivar'}
            </button>
            <button
              type="button"
              onClick={() => setExclusaoAberta(true)}
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
        idDe={(l) => l.id}
        carregando={carregando}
        selecionados={selecionados}
        onSelecionadosChange={setSelecionados}
        preferenciaDe="lead"
        onLinhaClick={abrirEdicao}
        acoesLinha={(lead) =>
          lead.status === 'convertido' ? (
            <button
              type="button"
              onClick={() => lead.deal_id && navigate(`/crm/negocios/${lead.deal_id}`)}
              className="whitespace-nowrap rounded-lg border border-dark-border px-2.5 py-1.5 text-xs text-gray-300 transition-smooth hover:bg-dark-hover hover:text-white"
            >
              Ver negócio
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConversaoAberta(lead)}
              className="whitespace-nowrap rounded-lg bg-primary-teal/20 px-2.5 py-1.5 text-xs font-medium text-primary-teal transition-smooth hover:bg-primary-teal/30"
            >
              Converter
            </button>
          )
        }
        vazio={
          <div>
            <i className="ri-inbox-line text-3xl text-gray-600" />
            <p className="mt-2 text-sm">
              {leads.length === 0
                ? 'Nenhum lead nesta caixa ainda.'
                : 'Nenhum lead corresponde aos filtros.'}
            </p>
          </div>
        }
      />

      {/* Formulário */}
      <CrmModal
        titulo={emEdicao ? 'Editar lead' : 'Novo lead'}
        aberto={formAberto}
        onFechar={() => setFormAberto(false)}
        rodape={
          <>
            <button
              type="button"
              onClick={() => setFormAberto(false)}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="rounded-lg bg-primary-teal px-4 py-2 text-sm font-semibold text-white transition-smooth hover:opacity-90 disabled:opacity-50"
            >
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={ROTULO} htmlFor="lead-titulo">Título *</label>
            <input
              id="lead-titulo"
              className={CAMPO}
              value={form.titulo}
              onChange={(e) => alterar('titulo', e.target.value)}
              placeholder="Ex.: Banda Aurora — interesse em gravação"
            />
          </div>

          <div>
            <label className={ROTULO} htmlFor="lead-valor">Valor (R$)</label>
            <input
              id="lead-valor"
              type="number"
              min="0"
              step="0.01"
              className={CAMPO}
              value={form.valor}
              onChange={(e) => alterar('valor', Number(e.target.value))}
            />
          </div>

          <div>
            <label className={ROTULO} htmlFor="lead-origem">Origem</label>
            <input
              id="lead-origem"
              className={CAMPO}
              value={form.origem ?? ''}
              onChange={(e) => alterar('origem', e.target.value)}
              placeholder="Ex.: Instagram, indicação"
            />
          </div>

          <div>
            <label className={ROTULO} htmlFor="lead-pessoa">Pessoa de contato</label>
            <select
              id="lead-pessoa"
              className={CAMPO}
              value={form.person_id ?? ''}
              onChange={(e) => alterar('person_id', e.target.value || null)}
            >
              <option value="">—</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={ROTULO} htmlFor="lead-org">Organização</label>
            <select
              id="lead-org"
              className={CAMPO}
              value={form.organizacao_id ?? ''}
              onChange={(e) => alterar('organizacao_id', e.target.value || null)}
            >
              <option value="">—</option>
              {organizacoes.map((o) => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={ROTULO} htmlFor="lead-dono">Responsável</label>
            <select
              id="lead-dono"
              className={CAMPO}
              value={form.dono_id ?? ''}
              onChange={(e) => alterar('dono_id', e.target.value || null)}
            >
              <option value="">—</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {etiquetas.length > 0 && (
            <div className="md:col-span-2">
              <span className={ROTULO}>Etiquetas</span>
              <div className="flex flex-wrap gap-1.5">
                {etiquetas.map((etiqueta) => {
                  const ativa = etiquetasForm.includes(etiqueta.id);
                  return (
                    <button
                      key={etiqueta.id}
                      type="button"
                      onClick={() =>
                        setEtiquetasForm((atuais) =>
                          ativa ? atuais.filter((id) => id !== etiqueta.id) : [...atuais, etiqueta.id]
                        )
                      }
                      style={
                        ativa
                          ? { backgroundColor: `${etiqueta.cor}25`, color: etiqueta.cor, borderColor: etiqueta.cor }
                          : undefined
                      }
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-smooth ${
                        ativa ? 'font-medium' : 'border-dark-border text-gray-400 hover:bg-dark-hover'
                      }`}
                    >
                      {etiqueta.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <label className={ROTULO} htmlFor="lead-obs">Observações</label>
            <textarea
              id="lead-obs"
              rows={3}
              className={CAMPO}
              value={form.observacoes ?? ''}
              onChange={(e) => alterar('observacoes', e.target.value)}
            />
          </div>
        </div>
      </CrmModal>

      {/* Conversão */}
      <CrmModal
        titulo="Converter em negócio"
        aberto={conversaoAberta !== null}
        onFechar={() => setConversaoAberta(null)}
        largura="max-w-md"
        rodape={
          <>
            <button
              type="button"
              onClick={() => setConversaoAberta(null)}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={converter}
              className="rounded-lg bg-primary-teal px-4 py-2 text-sm font-semibold text-white transition-smooth hover:opacity-90"
            >
              Converter
            </button>
          </>
        }
      >
        <p className="mb-4 text-sm text-gray-300">
          <strong className="text-white">{conversaoAberta?.titulo}</strong> vira um negócio na
          primeira etapa do funil escolhido. O lead continua registrado como convertido, ligado ao
          negócio criado.
        </p>
        <label className={ROTULO} htmlFor="conversao-funil">Funil de destino</label>
        <select
          id="conversao-funil"
          className={CAMPO}
          value={funilEscolhido}
          onChange={(e) => setFunilEscolhido(e.target.value)}
        >
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </CrmModal>

      <CrmModal
        titulo="Excluir leads"
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
                await excluirLeads(selecionados);
                setSelecionados([]);
                setExclusaoAberta(false);
                await carregar();
              }}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-smooth hover:bg-red-600"
            >
              Excluir
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-300">
          {selecionados.length} lead(s) serão removidos. Negócios já criados a partir deles
          continuam existindo. A ação não pode ser desfeita.
        </p>
      </CrmModal>
    </CrmLayout>
  );
}
