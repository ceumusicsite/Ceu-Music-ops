import { useEffect, useMemo, useState } from 'react';
import CrmLayout from '../../../components/crm/CrmLayout';
import { CRM_SUBITENS_CONTATOS } from '../../../components/crm/navegacao';
import CrmDataTable from '../../../components/crm/CrmDataTable';
import CrmFiltroBar from '../../../components/crm/CrmFiltroBar';
import CrmPessoaForm from '../../../components/crm/CrmPessoaForm';
import CrmModal from '../../../components/crm/CrmModal';
import { aplicarFiltros, CONDICOES_VAZIAS } from '../../../services/crm/filtro';
import { formatarData, iniciais } from '../../../services/crm/formato';
import {
  atualizarPessoa,
  criarPessoa,
  excluirPessoas,
  listarPessoas,
  type EntradaPessoa,
} from '../../../services/crm/persons';
import { listarOpcoesOrganizacoes } from '../../../services/crm/organizations';
import { listarUsuarios, type OpcaoUsuario } from '../../../services/crm/usuarios';
import type { CrmCondicoesFiltro, CrmColuna, CrmPessoa } from '../../../services/crm/types';

const CAMPOS_FILTRO = [
  { chave: 'nome', titulo: 'Nome' },
  { chave: 'organizacao', titulo: 'Organização' },
  { chave: 'email', titulo: 'E-mail' },
  { chave: 'telefone', titulo: 'Telefone' },
  { chave: 'cargo', titulo: 'Cargo' },
  { chave: 'cidade', titulo: 'Cidade' },
  { chave: 'responsavel', titulo: 'Responsável' },
];

const CAMPOS_BUSCA = ['nome', 'organizacao', 'email', 'telefone'];

/** Valor textual de cada campo, usado pela busca, pelos filtros e pela ordenação. */
function valorDe(pessoa: CrmPessoa, campo: string): string | number | null | undefined {
  switch (campo) {
    case 'nome':
      return pessoa.nome;
    case 'organizacao':
      return pessoa.organizacao_nome;
    case 'email':
      return pessoa.emails.map((e) => e.email).join(' ');
    case 'telefone':
      return pessoa.telefones.map((t) => t.telefone).join(' ');
    case 'cargo':
      return pessoa.cargo;
    case 'cidade':
      return pessoa.cidade;
    case 'responsavel':
      return pessoa.dono_nome;
    case 'criado_em':
      return pessoa.created_at;
    default:
      return null;
  }
}

export default function CrmPessoasPage() {
  const [pessoas, setPessoas] = useState<CrmPessoa[]>([]);
  const [organizacoes, setOrganizacoes] = useState<{ id: string; nome: string }[]>([]);
  const [usuarios, setUsuarios] = useState<OpcaoUsuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [busca, setBusca] = useState('');
  const [condicoes, setCondicoes] = useState<CrmCondicoesFiltro>(CONDICOES_VAZIAS);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const [formAberto, setFormAberto] = useState(false);
  const [pessoaEmEdicao, setPessoaEmEdicao] = useState<CrmPessoa | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  useEffect(() => {
    carregarTudo();
  }, []);

  const carregarTudo = async () => {
    setCarregando(true);
    setErro('');
    try {
      setPessoas(await listarPessoas());

      // Opções dos selects do formulário: falhar aqui não pode esconder a lista.
      const [orgsResultado, usuariosResultado] = await Promise.allSettled([
        listarOpcoesOrganizacoes(),
        listarUsuarios(),
      ]);
      if (orgsResultado.status === 'fulfilled') setOrganizacoes(orgsResultado.value);
      if (usuariosResultado.status === 'fulfilled') setUsuarios(usuariosResultado.value);
    } catch (e) {
      console.error('Erro ao carregar contatos:', e);
      setErro('Não foi possível carregar os contatos.');
    } finally {
      setCarregando(false);
    }
  };

  const pessoasFiltradas = useMemo(
    () => aplicarFiltros(pessoas, busca, condicoes, valorDe, CAMPOS_BUSCA),
    [pessoas, busca, condicoes]
  );

  const colunas: CrmColuna<CrmPessoa>[] = [
    {
      chave: 'nome',
      titulo: 'Nome',
      fixa: true,
      valor: (p) => p.nome,
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-teal/20 text-xs font-semibold text-primary-teal">
            {iniciais(p.nome)}
          </span>
          <span className="font-medium text-white">{p.nome}</span>
        </div>
      ),
    },
    {
      chave: 'organizacao',
      titulo: 'Organização',
      valor: (p) => p.organizacao_nome ?? '',
      render: (p) => p.organizacao_nome ?? <span className="text-gray-600">—</span>,
    },
    {
      chave: 'email',
      titulo: 'E-mail',
      valor: (p) => p.emails[0]?.email ?? '',
      render: (p) =>
        p.emails.length === 0 ? (
          <span className="text-gray-600">—</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <a
              href={`mailto:${p.emails[0].email}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded bg-dark-hover px-2 py-0.5 text-primary-teal hover:underline"
            >
              {p.emails[0].email}
            </a>
            <span className="text-xs text-gray-500">({rotuloLegivel(p.emails[0].rotulo)})</span>
            {p.emails.length > 1 && (
              <span className="text-xs text-gray-500">+{p.emails.length - 1}</span>
            )}
          </div>
        ),
    },
    {
      chave: 'telefone',
      titulo: 'Telefone',
      valor: (p) => p.telefones[0]?.telefone ?? '',
      render: (p) =>
        p.telefones.length === 0 ? (
          <span className="text-gray-600">—</span>
        ) : (
          <a
            href={`tel:${p.telefones[0].telefone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-primary-teal hover:underline"
          >
            {p.telefones[0].telefone}
          </a>
        ),
    },
    {
      chave: 'cargo',
      titulo: 'Cargo',
      visivelPorPadrao: false,
      valor: (p) => p.cargo ?? '',
      render: (p) => p.cargo ?? <span className="text-gray-600">—</span>,
    },
    {
      chave: 'responsavel',
      titulo: 'Responsável',
      visivelPorPadrao: false,
      valor: (p) => p.dono_nome ?? '',
      render: (p) => p.dono_nome ?? <span className="text-gray-600">—</span>,
    },
    {
      chave: 'criado_em',
      titulo: 'Criado em',
      visivelPorPadrao: false,
      valor: (p) => p.created_at,
      render: (p) => formatarData(p.created_at),
    },
  ];

  const abrirNovo = () => {
    setPessoaEmEdicao(null);
    setFormAberto(true);
  };

  const abrirEdicao = (pessoa: CrmPessoa) => {
    setPessoaEmEdicao(pessoa);
    setFormAberto(true);
  };

  const salvar = async (entrada: EntradaPessoa) => {
    setSalvando(true);
    setErro('');
    try {
      if (pessoaEmEdicao) {
        const atualizada = await atualizarPessoa(pessoaEmEdicao.id, entrada);
        setPessoas((atuais) => atuais.map((p) => (p.id === atualizada.id ? atualizada : p)));
      } else {
        const criada = await criarPessoa(entrada);
        setPessoas((atuais) => [criada, ...atuais]);
      }
      setFormAberto(false);
      setPessoaEmEdicao(null);
    } catch (e) {
      console.error('Erro ao salvar pessoa:', e);
      setErro('Não foi possível salvar a pessoa.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirSelecionadas = async () => {
    try {
      await excluirPessoas(selecionados);
      setPessoas((atuais) => atuais.filter((p) => !selecionados.includes(p.id)));
      setSelecionados([]);
    } catch (e) {
      console.error('Erro ao excluir pessoas:', e);
      setErro('Não foi possível excluir os contatos selecionados.');
    } finally {
      setConfirmarExclusao(false);
    }
  };

  return (
    <CrmLayout
      modulo="Contatos"
      titulo="Pessoas"
      subItens={CRM_SUBITENS_CONTATOS}
      resumo={
        carregando
          ? 'Carregando…'
          : `${pessoasFiltradas.length} ${pessoasFiltradas.length === 1 ? 'pessoa' : 'pessoas'}${
              pessoasFiltradas.length !== pessoas.length ? ` de ${pessoas.length}` : ''
            }`
      }
      acoes={
        <button
          type="button"
          onClick={abrirNovo}
          className="flex items-center gap-2 rounded-lg bg-primary-teal px-4 py-2.5 text-sm font-semibold text-white transition-smooth hover:opacity-90"
        >
          <i className="ri-add-line text-base" />
          Pessoa
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
          placeholder="Pesquisar pessoas…"
          campos={CAMPOS_FILTRO}
          condicoes={condicoes}
          onCondicoesChange={setCondicoes}
          entidade="pessoa"
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
        itens={pessoasFiltradas}
        idDe={(p) => p.id}
        carregando={carregando}
        selecionados={selecionados}
        onSelecionadosChange={setSelecionados}
        preferenciaDe="pessoa"
        onLinhaClick={abrirEdicao}
        acoesLinha={(pessoa) => (
          <button
            type="button"
            onClick={() => abrirEdicao(pessoa)}
            aria-label={`Editar ${pessoa.nome}`}
            className="rounded p-1.5 text-gray-500 transition-smooth hover:bg-dark-hover hover:text-white"
          >
            <i className="ri-more-2-fill" />
          </button>
        )}
        vazio={
          <div>
            <i className="ri-user-search-line text-3xl text-gray-600" />
            <p className="mt-2 text-sm">
              {pessoas.length === 0
                ? 'Nenhuma pessoa cadastrada ainda.'
                : 'Nenhuma pessoa corresponde aos filtros.'}
            </p>
          </div>
        }
      />

      <CrmPessoaForm
        aberto={formAberto}
        pessoa={pessoaEmEdicao}
        organizacoes={organizacoes}
        usuarios={usuarios}
        salvando={salvando}
        onSalvar={salvar}
        onFechar={() => {
          setFormAberto(false);
          setPessoaEmEdicao(null);
        }}
      />

      <CrmModal
        titulo="Excluir contatos"
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
          {selecionados.length === 1
            ? 'Esta pessoa será removida junto com seus e-mails e telefones.'
            : `${selecionados.length} pessoas serão removidas junto com seus e-mails e telefones.`}{' '}
          A ação não pode ser desfeita.
        </p>
      </CrmModal>
    </CrmLayout>
  );
}

function rotuloLegivel(rotulo: string): string {
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
}
