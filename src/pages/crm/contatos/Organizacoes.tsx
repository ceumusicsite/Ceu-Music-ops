import { useEffect, useMemo, useState } from 'react';
import CrmLayout from '../../../components/crm/CrmLayout';
import { CRM_SUBITENS_CONTATOS } from '../../../components/crm/navegacao';
import CrmDataTable from '../../../components/crm/CrmDataTable';
import CrmFiltroBar from '../../../components/crm/CrmFiltroBar';
import CrmModal from '../../../components/crm/CrmModal';
import { aplicarFiltros, CONDICOES_VAZIAS } from '../../../services/crm/filtro';
import { formatarData } from '../../../services/crm/formato';
import {
  atualizarOrganizacao,
  criarOrganizacao,
  excluirOrganizacoes,
  listarOrganizacoes,
  type EntradaOrganizacao,
} from '../../../services/crm/organizations';
import { listarUsuarios, type OpcaoUsuario } from '../../../services/crm/usuarios';
import type { CrmColuna, CrmCondicoesFiltro, CrmOrganizacao } from '../../../services/crm/types';

const CAMPO =
  'w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-smooth focus:border-primary-teal';
const ROTULO = 'mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500';

const CAMPOS_FILTRO = [
  { chave: 'nome', titulo: 'Nome' },
  { chave: 'setor', titulo: 'Setor' },
  { chave: 'cidade', titulo: 'Cidade' },
  { chave: 'estado', titulo: 'Estado' },
  { chave: 'email', titulo: 'E-mail' },
  { chave: 'telefone', titulo: 'Telefone' },
  { chave: 'responsavel', titulo: 'Responsável' },
  { chave: 'total_pessoas', titulo: 'Nº de pessoas' },
];

const CAMPOS_BUSCA = ['nome', 'setor', 'cidade', 'email', 'telefone'];

function valorDe(org: CrmOrganizacao, campo: string): string | number | null | undefined {
  switch (campo) {
    case 'nome':
      return org.nome;
    case 'setor':
      return org.setor;
    case 'cidade':
      return org.cidade;
    case 'estado':
      return org.estado;
    case 'email':
      return org.email;
    case 'telefone':
      return org.telefone;
    case 'responsavel':
      return org.dono_nome;
    case 'total_pessoas':
      return org.total_pessoas ?? 0;
    case 'criado_em':
      return org.created_at;
    default:
      return null;
  }
}

const ENTRADA_VAZIA: EntradaOrganizacao = {
  nome: '',
  dono_id: null,
  setor: '',
  email: '',
  telefone: '',
  website: '',
  cnpj: '',
  endereco: '',
  cidade: '',
  estado: '',
  pais: '',
  cep: '',
  observacoes: '',
};

export default function CrmOrganizacoesPage() {
  const [organizacoes, setOrganizacoes] = useState<CrmOrganizacao[]>([]);
  const [usuarios, setUsuarios] = useState<OpcaoUsuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [busca, setBusca] = useState('');
  const [condicoes, setCondicoes] = useState<CrmCondicoesFiltro>(CONDICOES_VAZIAS);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<CrmOrganizacao | null>(null);
  const [form, setForm] = useState<EntradaOrganizacao>(ENTRADA_VAZIA);
  const [salvando, setSalvando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  useEffect(() => {
    carregarTudo();
  }, []);

  const carregarTudo = async () => {
    setCarregando(true);
    setErro('');
    try {
      setOrganizacoes(await listarOrganizacoes());

      // Opções do select de responsável: falhar aqui não pode esconder a lista.
      const usuariosResultado = await Promise.allSettled([listarUsuarios()]);
      if (usuariosResultado[0].status === 'fulfilled') setUsuarios(usuariosResultado[0].value);
    } catch (e) {
      console.error('Erro ao carregar organizações:', e);
      setErro('Não foi possível carregar as organizações.');
    } finally {
      setCarregando(false);
    }
  };

  const filtradas = useMemo(
    () => aplicarFiltros(organizacoes, busca, condicoes, valorDe, CAMPOS_BUSCA),
    [organizacoes, busca, condicoes]
  );

  const colunas: CrmColuna<CrmOrganizacao>[] = [
    {
      chave: 'nome',
      titulo: 'Nome',
      fixa: true,
      valor: (o) => o.nome,
      render: (o) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary-brown/25 text-primary-light">
            <i className="ri-building-line text-sm" />
          </span>
          <span className="font-medium text-white">{o.nome}</span>
        </div>
      ),
    },
    {
      chave: 'total_pessoas',
      titulo: 'Pessoas',
      alinhamento: 'right',
      valor: (o) => o.total_pessoas ?? 0,
      render: (o) => o.total_pessoas ?? 0,
    },
    {
      chave: 'total_negocios',
      titulo: 'Negócios',
      alinhamento: 'right',
      valor: (o) => o.total_negocios ?? 0,
      render: (o) => o.total_negocios ?? 0,
    },
    {
      chave: 'setor',
      titulo: 'Setor',
      valor: (o) => o.setor ?? '',
      render: (o) => o.setor ?? <span className="text-gray-600">—</span>,
    },
    {
      chave: 'cidade',
      titulo: 'Cidade',
      valor: (o) => o.cidade ?? '',
      render: (o) =>
        o.cidade ? (
          <span>
            {o.cidade}
            {o.estado ? `/${o.estado}` : ''}
          </span>
        ) : (
          <span className="text-gray-600">—</span>
        ),
    },
    {
      chave: 'telefone',
      titulo: 'Telefone',
      visivelPorPadrao: false,
      valor: (o) => o.telefone ?? '',
      render: (o) => o.telefone ?? <span className="text-gray-600">—</span>,
    },
    {
      chave: 'responsavel',
      titulo: 'Responsável',
      visivelPorPadrao: false,
      valor: (o) => o.dono_nome ?? '',
      render: (o) => o.dono_nome ?? <span className="text-gray-600">—</span>,
    },
    {
      chave: 'criado_em',
      titulo: 'Criado em',
      visivelPorPadrao: false,
      valor: (o) => o.created_at,
      render: (o) => formatarData(o.created_at),
    },
  ];

  const abrirNova = () => {
    setEmEdicao(null);
    setForm(ENTRADA_VAZIA);
    setFormAberto(true);
  };

  const abrirEdicao = (org: CrmOrganizacao) => {
    setEmEdicao(org);
    setForm({
      nome: org.nome,
      dono_id: org.dono_id ?? null,
      setor: org.setor ?? '',
      email: org.email ?? '',
      telefone: org.telefone ?? '',
      website: org.website ?? '',
      cnpj: org.cnpj ?? '',
      endereco: org.endereco ?? '',
      cidade: org.cidade ?? '',
      estado: org.estado ?? '',
      pais: org.pais ?? '',
      cep: org.cep ?? '',
      observacoes: org.observacoes ?? '',
    });
    setFormAberto(true);
  };

  const alterar = (campo: keyof EntradaOrganizacao, valor: unknown) =>
    setForm((atual) => ({ ...atual, [campo]: valor }));

  const salvar = async () => {
    if (form.nome.trim() === '') {
      setErro('O nome da organização é obrigatório.');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      const entrada = { ...form, nome: form.nome.trim() };
      if (emEdicao) {
        const atualizada = await atualizarOrganizacao(emEdicao.id, entrada);
        setOrganizacoes((atuais) => atuais.map((o) => (o.id === atualizada.id ? atualizada : o)));
      } else {
        const criada = await criarOrganizacao(entrada);
        setOrganizacoes((atuais) => [criada, ...atuais]);
      }
      setFormAberto(false);
      setEmEdicao(null);
    } catch (e) {
      console.error('Erro ao salvar organização:', e);
      setErro('Não foi possível salvar a organização.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirSelecionadas = async () => {
    try {
      await excluirOrganizacoes(selecionados);
      setOrganizacoes((atuais) => atuais.filter((o) => !selecionados.includes(o.id)));
      setSelecionados([]);
    } catch (e) {
      console.error('Erro ao excluir organizações:', e);
      setErro('Não foi possível excluir as organizações selecionadas.');
    } finally {
      setConfirmarExclusao(false);
    }
  };

  return (
    <CrmLayout
      modulo="Contatos"
      titulo="Organizações"
      subItens={CRM_SUBITENS_CONTATOS}
      resumo={
        carregando
          ? 'Carregando…'
          : `${filtradas.length} ${filtradas.length === 1 ? 'organização' : 'organizações'}${
              filtradas.length !== organizacoes.length ? ` de ${organizacoes.length}` : ''
            }`
      }
      acoes={
        <button
          type="button"
          onClick={abrirNova}
          className="flex items-center gap-2 rounded-lg bg-primary-teal px-4 py-2.5 text-sm font-semibold text-white transition-smooth hover:opacity-90"
        >
          <i className="ri-add-line text-base" />
          Organização
        </button>
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
          placeholder="Pesquisar organizações…"
          campos={CAMPOS_FILTRO}
          condicoes={condicoes}
          onCondicoesChange={setCondicoes}
          entidade="organizacao"
        />
      </div>

      {selecionados.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary-teal/40 bg-primary-teal/10 px-4 py-3">
          <span className="text-sm text-white">
            {selecionados.length} {selecionados.length === 1 ? 'selecionada' : 'selecionadas'}
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
        itens={filtradas}
        idDe={(o) => o.id}
        carregando={carregando}
        selecionados={selecionados}
        onSelecionadosChange={setSelecionados}
        preferenciaDe="organizacao"
        onLinhaClick={abrirEdicao}
        acoesLinha={(org) => (
          <button
            type="button"
            onClick={() => abrirEdicao(org)}
            aria-label={`Editar ${org.nome}`}
            className="rounded p-1.5 text-gray-500 transition-smooth hover:bg-dark-hover hover:text-white"
          >
            <i className="ri-more-2-fill" />
          </button>
        )}
        vazio={
          <div>
            <i className="ri-building-line text-3xl text-gray-600" />
            <p className="mt-2 text-sm">
              {organizacoes.length === 0
                ? 'Nenhuma organização cadastrada ainda.'
                : 'Nenhuma organização corresponde aos filtros.'}
            </p>
          </div>
        }
      />

      <CrmModal
        titulo={emEdicao ? 'Editar organização' : 'Nova organização'}
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
            <label className={ROTULO} htmlFor="org-nome">Nome *</label>
            <input
              id="org-nome"
              className={CAMPO}
              value={form.nome}
              onChange={(e) => alterar('nome', e.target.value)}
              placeholder="Nome da organização"
            />
          </div>

          <div>
            <label className={ROTULO} htmlFor="org-setor">Setor</label>
            <input id="org-setor" className={CAMPO} value={form.setor ?? ''} onChange={(e) => alterar('setor', e.target.value)} />
          </div>

          <div>
            <label className={ROTULO} htmlFor="org-dono">Responsável</label>
            <select
              id="org-dono"
              className={CAMPO}
              value={form.dono_id ?? ''}
              onChange={(e) => alterar('dono_id', e.target.value || null)}
            >
              <option value="">—</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>{usuario.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={ROTULO} htmlFor="org-email">E-mail</label>
            <input id="org-email" className={CAMPO} value={form.email ?? ''} onChange={(e) => alterar('email', e.target.value)} />
          </div>

          <div>
            <label className={ROTULO} htmlFor="org-telefone">Telefone</label>
            <input id="org-telefone" className={CAMPO} value={form.telefone ?? ''} onChange={(e) => alterar('telefone', e.target.value)} />
          </div>

          <div>
            <label className={ROTULO} htmlFor="org-website">Website</label>
            <input id="org-website" className={CAMPO} value={form.website ?? ''} onChange={(e) => alterar('website', e.target.value)} />
          </div>

          <div>
            <label className={ROTULO} htmlFor="org-cnpj">CNPJ</label>
            <input id="org-cnpj" className={CAMPO} value={form.cnpj ?? ''} onChange={(e) => alterar('cnpj', e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className={ROTULO} htmlFor="org-endereco">Endereço</label>
            <input id="org-endereco" className={CAMPO} value={form.endereco ?? ''} onChange={(e) => alterar('endereco', e.target.value)} />
          </div>

          <div>
            <label className={ROTULO} htmlFor="org-cidade">Cidade</label>
            <input id="org-cidade" className={CAMPO} value={form.cidade ?? ''} onChange={(e) => alterar('cidade', e.target.value)} />
          </div>

          <div>
            <label className={ROTULO} htmlFor="org-estado">Estado</label>
            <input id="org-estado" className={CAMPO} value={form.estado ?? ''} onChange={(e) => alterar('estado', e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className={ROTULO} htmlFor="org-obs">Observações</label>
            <textarea
              id="org-obs"
              rows={3}
              className={CAMPO}
              value={form.observacoes ?? ''}
              onChange={(e) => alterar('observacoes', e.target.value)}
            />
          </div>
        </div>
      </CrmModal>

      <CrmModal
        titulo="Excluir organizações"
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
              onClick={excluirSelecionadas}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-smooth hover:bg-red-600"
            >
              Excluir
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-300">
          As pessoas vinculadas continuam cadastradas, apenas ficam sem organização. A ação não pode
          ser desfeita.
        </p>
      </CrmModal>
    </CrmLayout>
  );
}
