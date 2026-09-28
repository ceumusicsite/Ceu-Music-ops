import { useCallback, useEffect, useMemo, useState } from 'react';
import CrmLayout from '../../../components/crm/CrmLayout';
import { CRM_SUBITENS_CONFIGURACOES } from '../../../components/crm/navegacao';
import CrmDataTable from '../../../components/crm/CrmDataTable';
import CrmFiltroBar from '../../../components/crm/CrmFiltroBar';
import CrmModal from '../../../components/crm/CrmModal';
import { aplicarFiltros, CONDICOES_VAZIAS } from '../../../services/crm/filtro';
import {
  atualizarProduto,
  criarProduto,
  excluirProdutos,
  listarProdutos,
  type CrmProduto,
  type EntradaProduto,
} from '../../../services/crm/products';
import { formatarMoeda } from '../../../services/crm/formato';
import type { CrmColuna, CrmCondicoesFiltro } from '../../../services/crm/types';

const CAMPO =
  'w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-smooth focus:border-primary-teal';
const ROTULO = 'mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500';

const CAMPOS_FILTRO = [
  { chave: 'nome', titulo: 'Nome' },
  { chave: 'codigo', titulo: 'Código' },
  { chave: 'categoria', titulo: 'Categoria' },
  { chave: 'preco', titulo: 'Preço' },
];

const ENTRADA_VAZIA: EntradaProduto = {
  nome: '',
  codigo: '',
  descricao: '',
  categoria: '',
  unidade: '',
  preco: 0,
  imposto_percentual: 0,
  ativo: true,
};

export default function CrmProdutosPage() {
  const [produtos, setProdutos] = useState<CrmProduto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [busca, setBusca] = useState('');
  const [condicoes, setCondicoes] = useState<CrmCondicoesFiltro>(CONDICOES_VAZIAS);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<CrmProduto | null>(null);
  const [form, setForm] = useState<EntradaProduto>(ENTRADA_VAZIA);
  const [salvando, setSalvando] = useState(false);
  const [exclusaoAberta, setExclusaoAberta] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      // Inclui inativos: esta é a tela de manutenção do catálogo.
      setProdutos(await listarProdutos(true));
    } catch (e) {
      console.error('Erro ao carregar produtos:', e);
      setErro('Não foi possível carregar os produtos.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const valorDe = (produto: CrmProduto, campo: string): string | number | null | undefined => {
    switch (campo) {
      case 'nome':
        return produto.nome;
      case 'codigo':
        return produto.codigo;
      case 'categoria':
        return produto.categoria;
      case 'preco':
        return produto.preco;
      default:
        return null;
    }
  };

  const filtrados = useMemo(
    () => aplicarFiltros(produtos, busca, condicoes, valorDe, ['nome', 'codigo', 'categoria']),
    [produtos, busca, condicoes]
  );

  const colunas: CrmColuna<CrmProduto>[] = [
    {
      chave: 'nome',
      titulo: 'Nome',
      fixa: true,
      valor: (p) => p.nome,
      render: (p) => (
        <div>
          <span className={p.ativo ? 'font-medium text-white' : 'font-medium text-gray-500'}>
            {p.nome}
          </span>
          {!p.ativo && <span className="ml-2 text-xs text-gray-600">inativo</span>}
        </div>
      ),
    },
    {
      chave: 'codigo',
      titulo: 'Código',
      valor: (p) => p.codigo ?? '',
      render: (p) => p.codigo ?? <span className="text-gray-600">—</span>,
    },
    {
      chave: 'categoria',
      titulo: 'Categoria',
      valor: (p) => p.categoria ?? '',
      render: (p) => p.categoria ?? <span className="text-gray-600">—</span>,
    },
    {
      chave: 'unidade',
      titulo: 'Unidade',
      visivelPorPadrao: false,
      valor: (p) => p.unidade ?? '',
      render: (p) => p.unidade ?? <span className="text-gray-600">—</span>,
    },
    {
      chave: 'preco',
      titulo: 'Preço',
      alinhamento: 'right',
      valor: (p) => p.preco,
      render: (p) => (
        <span className="font-semibold text-primary-teal">{formatarMoeda(p.preco, p.moeda)}</span>
      ),
    },
  ];

  const abrirNovo = () => {
    setEmEdicao(null);
    setForm(ENTRADA_VAZIA);
    setFormAberto(true);
  };

  const abrirEdicao = (produto: CrmProduto) => {
    setEmEdicao(produto);
    setForm({
      nome: produto.nome,
      codigo: produto.codigo ?? '',
      descricao: produto.descricao ?? '',
      categoria: produto.categoria ?? '',
      unidade: produto.unidade ?? '',
      preco: produto.preco,
      imposto_percentual: produto.imposto_percentual,
      ativo: produto.ativo,
    });
    setFormAberto(true);
  };

  const alterar = (campo: keyof EntradaProduto, valor: unknown) =>
    setForm((atual) => ({ ...atual, [campo]: valor }));

  const salvar = async () => {
    if (form.nome.trim() === '') {
      setErro('O nome do produto é obrigatório.');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      const entrada = { ...form, nome: form.nome.trim() };
      if (emEdicao) await atualizarProduto(emEdicao.id, entrada);
      else await criarProduto(entrada);
      setFormAberto(false);
      setEmEdicao(null);
      await carregar();
    } catch (e) {
      console.error('Erro ao salvar produto:', e);
      setErro('Não foi possível salvar o produto.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <CrmLayout
      modulo="Configurações"
      titulo="Produtos"
      subItens={CRM_SUBITENS_CONFIGURACOES}
      resumo={
        carregando
          ? 'Carregando…'
          : `${filtrados.length} ${filtrados.length === 1 ? 'produto' : 'produtos'}`
      }
      acoes={
        <button
          type="button"
          onClick={abrirNovo}
          className="flex items-center gap-2 rounded-lg bg-primary-teal px-4 py-2.5 text-sm font-semibold text-white transition-smooth hover:opacity-90"
        >
          <i className="ri-add-line text-base" />
          Produto
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
          placeholder="Pesquisar produtos…"
          campos={CAMPOS_FILTRO}
          condicoes={condicoes}
          onCondicoesChange={setCondicoes}
        />
      </div>

      {selecionados.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary-teal/40 bg-primary-teal/10 px-4 py-3">
          <span className="text-sm text-white">{selecionados.length} selecionado(s)</span>
          <button
            type="button"
            onClick={() => setExclusaoAberta(true)}
            className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-300 transition-smooth hover:bg-red-500/30"
          >
            <i className="ri-delete-bin-line" />
            Excluir
          </button>
        </div>
      )}

      <CrmDataTable
        colunas={colunas}
        itens={filtrados}
        idDe={(p) => p.id}
        carregando={carregando}
        selecionados={selecionados}
        onSelecionadosChange={setSelecionados}
        preferenciaDe="produto"
        onLinhaClick={abrirEdicao}
        vazio={
          <div>
            <i className="ri-price-tag-3-line text-3xl text-gray-600" />
            <p className="mt-2 text-sm">
              {produtos.length === 0
                ? 'Nenhum produto cadastrado. Eles ficam disponíveis para adicionar aos negócios.'
                : 'Nenhum produto corresponde aos filtros.'}
            </p>
          </div>
        }
      />

      <CrmModal
        titulo={emEdicao ? 'Editar produto' : 'Novo produto'}
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
            <label className={ROTULO} htmlFor="produto-nome">Nome *</label>
            <input
              id="produto-nome"
              className={CAMPO}
              value={form.nome}
              onChange={(e) => alterar('nome', e.target.value)}
              placeholder="Ex.: Diária de estúdio"
            />
          </div>

          <div>
            <label className={ROTULO} htmlFor="produto-codigo">Código</label>
            <input
              id="produto-codigo"
              className={CAMPO}
              value={form.codigo ?? ''}
              onChange={(e) => alterar('codigo', e.target.value)}
            />
          </div>

          <div>
            <label className={ROTULO} htmlFor="produto-categoria">Categoria</label>
            <input
              id="produto-categoria"
              className={CAMPO}
              value={form.categoria ?? ''}
              onChange={(e) => alterar('categoria', e.target.value)}
              placeholder="Ex.: Estúdio, Produção, Audiovisual"
            />
          </div>

          <div>
            <label className={ROTULO} htmlFor="produto-preco">Preço (R$)</label>
            <input
              id="produto-preco"
              type="number"
              min="0"
              step="0.01"
              className={CAMPO}
              value={form.preco}
              onChange={(e) => alterar('preco', Number(e.target.value))}
            />
          </div>

          <div>
            <label className={ROTULO} htmlFor="produto-unidade">Unidade</label>
            <input
              id="produto-unidade"
              className={CAMPO}
              value={form.unidade ?? ''}
              onChange={(e) => alterar('unidade', e.target.value)}
              placeholder="Ex.: hora, diária, projeto"
            />
          </div>

          <div className="md:col-span-2">
            <label className={ROTULO} htmlFor="produto-descricao">Descrição</label>
            <textarea
              id="produto-descricao"
              rows={3}
              className={CAMPO}
              value={form.descricao ?? ''}
              onChange={(e) => alterar('descricao', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <input
              id="produto-ativo"
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => alterar('ativo', e.target.checked)}
              className="h-4 w-4 accent-primary-teal"
            />
            <label htmlFor="produto-ativo" className="text-sm text-gray-300">
              Ativo — aparece na lista ao adicionar produtos a um negócio
            </label>
          </div>
        </div>
      </CrmModal>

      <CrmModal
        titulo="Excluir produtos"
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
                await excluirProdutos(selecionados);
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
          Os itens já adicionados a negócios continuam lá, com o preço que foi copiado na época.
          Se quiser só tirar de circulação, marque o produto como inativo.
        </p>
      </CrmModal>
    </CrmLayout>
  );
}
