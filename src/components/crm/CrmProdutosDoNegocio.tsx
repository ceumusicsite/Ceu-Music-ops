import { useCallback, useEffect, useState } from 'react';
import {
  adicionarItem,
  atualizarItem,
  listarItensDoNegocio,
  listarProdutos,
  removerItem,
  sincronizarValorDoNegocio,
  totalDoItem,
  totalDosItens,
  type CrmItemNegocio,
  type CrmProduto,
} from '../../services/crm/products';
import { formatarMoeda } from '../../services/crm/formato';

const CAMPO =
  'w-full rounded-lg border border-dark-border bg-dark-bg px-2 py-1.5 text-sm text-white outline-none transition-smooth focus:border-primary-teal';

interface CrmProdutosDoNegocioProps {
  dealId: string;
  /** Chamado depois de qualquer mudança, para a página recarregar o valor do negócio. */
  onValorAlterado: (novoValor: number) => void;
}

export default function CrmProdutosDoNegocio({
  dealId,
  onValorAlterado,
}: CrmProdutosDoNegocioProps) {
  const [itens, setItens] = useState<CrmItemNegocio[]>([]);
  const [catalogo, setCatalogo] = useState<CrmProduto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [produtoEscolhido, setProdutoEscolhido] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setItens(await listarItensDoNegocio(dealId));
    } catch (e) {
      console.error('Erro ao carregar itens do negócio:', e);
      setErro('Não foi possível carregar os produtos deste negócio.');
    } finally {
      setCarregando(false);
    }
  }, [dealId]);

  useEffect(() => {
    carregar();
    listarProdutos()
      .then(setCatalogo)
      .catch((e) => console.error('Erro ao carregar catálogo:', e));
  }, [carregar]);

  const aposMudanca = async () => {
    const total = await sincronizarValorDoNegocio(dealId);
    onValorAlterado(total);
    await carregar();
  };

  const adicionar = async () => {
    const produto = catalogo.find((p) => p.id === produtoEscolhido);
    if (!produto) return;
    try {
      await adicionarItem(dealId, produto);
      setProdutoEscolhido('');
      await aposMudanca();
    } catch (e) {
      console.error('Erro ao adicionar produto:', e);
      setErro('Não foi possível adicionar o produto.');
    }
  };

  const alterarLocal = (id: string, mudanca: Partial<CrmItemNegocio>) =>
    setItens((atuais) => atuais.map((i) => (i.id === id ? { ...i, ...mudanca } : i)));

  const salvarCampo = async (
    id: string,
    mudanca: Partial<Pick<CrmItemNegocio, 'quantidade' | 'preco_unitario' | 'desconto_percentual'>>
  ) => {
    try {
      await atualizarItem(id, mudanca);
      await aposMudanca();
    } catch (e) {
      console.error('Erro ao salvar item:', e);
      setErro('Não foi possível salvar a alteração.');
    }
  };

  const total = totalDosItens(itens);

  return (
    <section className="rounded-xl border border-dark-border bg-dark-card">
      <header className="flex items-center justify-between border-b border-dark-border px-4 py-3">
        <h2 className="text-sm font-semibold text-white">Produtos</h2>
        {itens.length > 0 && (
          <span className="text-sm font-semibold text-primary-teal">{formatarMoeda(total)}</span>
        )}
      </header>

      {erro && (
        <p className="m-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {erro}
        </p>
      )}

      {carregando ? (
        <div className="p-6 text-center text-gray-500">
          <i className="ri-loader-4-line animate-spin text-xl" />
        </div>
      ) : (
        <div className="p-4">
          {itens.length === 0 ? (
            <p className="mb-4 text-center text-sm text-gray-600">
              Nenhum produto neste negócio.
            </p>
          ) : (
            <div className="mb-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-gray-500">
                    <th className="pb-2 text-left font-medium">Produto</th>
                    <th className="pb-2 text-right font-medium">Qtd.</th>
                    <th className="pb-2 text-right font-medium">Preço</th>
                    <th className="pb-2 text-right font-medium">Desc. %</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item) => (
                    <tr key={item.id} className="border-t border-dark-border/60">
                      <td className="py-2 pr-2 text-gray-200">{item.nome}</td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          aria-label={`Quantidade de ${item.nome}`}
                          className={`${CAMPO} w-20 text-right`}
                          value={item.quantidade}
                          onChange={(e) =>
                            alterarLocal(item.id, { quantidade: Number(e.target.value) })
                          }
                          onBlur={() => salvarCampo(item.id, { quantidade: item.quantidade })}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          aria-label={`Preço de ${item.nome}`}
                          className={`${CAMPO} w-28 text-right`}
                          value={item.preco_unitario}
                          onChange={(e) =>
                            alterarLocal(item.id, { preco_unitario: Number(e.target.value) })
                          }
                          onBlur={() =>
                            salvarCampo(item.id, { preco_unitario: item.preco_unitario })
                          }
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          aria-label={`Desconto de ${item.nome}`}
                          className={`${CAMPO} w-20 text-right`}
                          value={item.desconto_percentual}
                          onChange={(e) =>
                            alterarLocal(item.id, {
                              desconto_percentual: Number(e.target.value),
                            })
                          }
                          onBlur={() =>
                            salvarCampo(item.id, {
                              desconto_percentual: item.desconto_percentual,
                            })
                          }
                        />
                      </td>
                      <td className="py-2 pr-2 text-right font-medium text-gray-200">
                        {formatarMoeda(totalDoItem(item))}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            await removerItem(item.id);
                            await aposMudanca();
                          }}
                          aria-label={`Remover ${item.nome}`}
                          className="rounded p-1 text-gray-600 transition-smooth hover:bg-dark-hover hover:text-red-400"
                        >
                          <i className="ri-close-line" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {catalogo.length === 0 ? (
            <p className="text-xs text-gray-600">
              Nenhum produto ativo no catálogo. Cadastre em Configurações › Produtos.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={produtoEscolhido}
                onChange={(e) => setProdutoEscolhido(e.target.value)}
                aria-label="Produto a adicionar"
                className={`${CAMPO} flex-1 min-w-[12rem]`}
              >
                <option value="">Escolha um produto…</option>
                {catalogo.map((produto) => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome} — {formatarMoeda(produto.preco)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={adicionar}
                disabled={!produtoEscolhido}
                className="flex items-center gap-1.5 rounded-lg border border-dark-border px-3 py-1.5 text-sm font-medium text-primary-teal transition-smooth hover:bg-dark-hover disabled:opacity-40"
              >
                <i className="ri-add-line" />
                Adicionar
              </button>
            </div>
          )}

          {itens.length > 0 && (
            <p className="mt-3 text-xs text-gray-600">
              O valor do negócio passa a espelhar a soma dos produtos.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
