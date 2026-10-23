import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import CrmLayout from '../../../components/crm/CrmLayout';
import { CRM_SUBITENS_ATIVIDADES } from '../../../components/crm/navegacao';
import CrmAtividadeForm from '../../../components/crm/CrmAtividadeForm';
import CrmModal from '../../../components/crm/CrmModal';
import {
  alternarConcluida,
  atualizarAtividade,
  criarAtividade,
  duplicarAtividade,
  excluirAtividades,
  filtrarPorPeriodo,
  infoTipo,
  listarAtividades,
  PERIODOS,
  TIPOS_ATIVIDADE,
  type EntradaAtividade,
  type PeriodoAtividade,
} from '../../../services/crm/activities';
import { listarNegocios, listarPipelines } from '../../../services/crm/deals';
import { listarOpcoesPessoas } from '../../../services/crm/persons';
import { listarOpcoesOrganizacoes } from '../../../services/crm/organizations';
import { listarUsuarios, type OpcaoUsuario } from '../../../services/crm/usuarios';
import { formatarData } from '../../../services/crm/formato';
import type { CrmAtividade, TipoAtividade } from '../../../services/crm/types';

export default function CrmAtividadesPage() {
  const [atividades, setAtividades] = useState<CrmAtividade[]>([]);
  const [negocios, setNegocios] = useState<{ id: string; titulo: string }[]>([]);
  const [pessoas, setPessoas] = useState<{ id: string; nome: string }[]>([]);
  const [organizacoes, setOrganizacoes] = useState<{ id: string; nome: string }[]>([]);
  const [usuarios, setUsuarios] = useState<OpcaoUsuario[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [tipo, setTipo] = useState<TipoAtividade | 'tudo'>('tudo');
  const [periodo, setPeriodo] = useState<PeriodoAtividade>('para_fazer');

  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<CrmAtividade | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<CrmAtividade | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const lista = await listarAtividades();
      setAtividades(lista);
    } catch (e) {
      console.error('Erro ao carregar atividades:', e);
      setErro('Não foi possível carregar as atividades.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();

    const carregarVinculos = async () => {
      try {
        const [funis, listaPessoas, listaOrgs, listaUsuarios] = await Promise.all([
          listarPipelines(),
          listarOpcoesPessoas(),
          listarOpcoesOrganizacoes(),
          listarUsuarios(),
        ]);

        setPessoas(listaPessoas);
        setOrganizacoes(listaOrgs);
        setUsuarios(listaUsuarios);

        if (funis.length > 0) {
          const listaNegocios = await listarNegocios(funis[0].id, true);
          setNegocios(listaNegocios.map((n) => ({ id: n.id, titulo: n.titulo })));
        }
      } catch (e) {
        console.error('Erro ao carregar vínculos:', e);
      }
    };

    carregarVinculos();
  }, [carregar]);

  const filtradas = useMemo(() => {
    const porPeriodo = filtrarPorPeriodo(atividades, periodo);
    return tipo === 'tudo' ? porPeriodo : porPeriodo.filter((a) => a.tipo === tipo);
  }, [atividades, periodo, tipo]);

  const concluir = async (atividade: CrmAtividade) => {
    const anterior = atividades;
    setAtividades((atuais) =>
      atuais.map((a) => (a.id === atividade.id ? { ...a, concluida: !a.concluida } : a))
    );
    try {
      await alternarConcluida(atividade.id, !atividade.concluida);
    } catch (e) {
      console.error('Erro ao concluir atividade:', e);
      setAtividades(anterior);
      setErro('Não foi possível atualizar a atividade.');
    }
  };

  const salvar = async (entrada: EntradaAtividade) => {
    setSalvando(true);
    try {
      if (emEdicao) await atualizarAtividade(emEdicao.id, entrada);
      else await criarAtividade(entrada);
      setFormAberto(false);
      setEmEdicao(null);
      await carregar();
    } catch (e) {
      console.error('Erro ao salvar atividade:', e);
      setErro('Não foi possível salvar a atividade.');
    } finally {
      setSalvando(false);
    }
  };

  const duplicar = async (atividade: CrmAtividade) => {
    try {
      await duplicarAtividade(atividade);
      await carregar();
    } catch (e) {
      console.error('Erro ao duplicar atividade:', e);
      setErro('Não foi possível duplicar a atividade.');
    }
  };

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <CrmLayout
      modulo="Atividades"
      titulo="Lista"
      subItens={CRM_SUBITENS_ATIVIDADES}
      resumo={
        carregando
          ? 'Carregando…'
          : `${filtradas.length} ${filtradas.length === 1 ? 'atividade' : 'atividades'}`
      }
      acoes={
        <button
          type="button"
          onClick={() => {
            setEmEdicao(null);
            setFormAberto(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary-teal px-4 py-2.5 text-sm font-semibold text-white transition-smooth hover:opacity-90"
        >
          <i className="ri-add-line text-base" />
          Atividade
        </button>
      }
    >
      {erro && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}

      {/* Filtro por tipo */}
      <div className="mb-3 flex flex-wrap items-center gap-1">
        <FiltroBotao ativo={tipo === 'tudo'} onClick={() => setTipo('tudo')}>
          Tudo
        </FiltroBotao>
        {TIPOS_ATIVIDADE.map((t) => (
          <FiltroBotao key={t.valor} ativo={tipo === t.valor} onClick={() => setTipo(t.valor)}>
            <i className={`${t.icone} mr-1.5`} />
            {t.rotulo}
          </FiltroBotao>
        ))}
      </div>

      {/* Filtro por período */}
      <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-dark-border pb-3">
        {PERIODOS.map((p) => (
          <FiltroBotao key={p.valor} ativo={periodo === p.valor} onClick={() => setPeriodo(p.valor)}>
            {p.rotulo}
          </FiltroBotao>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-dark-border bg-dark-card">
        {carregando ? (
          <div className="p-10 text-center text-gray-500">
            <i className="ri-loader-4-line animate-spin text-2xl" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <i className="ri-calendar-check-line text-3xl text-gray-600" />
            <p className="mt-2 text-sm">Nenhuma atividade neste filtro.</p>
          </div>
        ) : (
          <ul>
            {filtradas.map((atividade) => {
              const tipoInfo = infoTipo(atividade.tipo);
              const vencida =
                !atividade.concluida && atividade.data !== null && (atividade.data ?? '') < hoje;

              return (
                <li
                  key={atividade.id}
                  className="flex flex-wrap items-center gap-3 border-b border-dark-border/60 px-4 py-3 transition-smooth last:border-0 hover:bg-dark-hover/40"
                >
                  <button
                    type="button"
                    onClick={() => concluir(atividade)}
                    aria-label={atividade.concluida ? 'Reabrir atividade' : 'Concluir atividade'}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-smooth ${
                      atividade.concluida
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-600 hover:border-primary-teal'
                    }`}
                  >
                    {atividade.concluida && <i className="ri-check-line text-xs" />}
                  </button>

                  <i className={`${tipoInfo.icone} shrink-0 text-base text-primary-teal`} />

                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEmEdicao(atividade);
                        setFormAberto(true);
                      }}
                      className={`block truncate text-left text-sm ${
                        atividade.concluida ? 'text-gray-500 line-through' : 'text-white'
                      }`}
                    >
                      {atividade.assunto}
                    </button>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      {atividade.data && (
                        <span className={vencida ? 'font-medium text-red-400' : ''}>
                          {formatarData(atividade.data)}
                          {atividade.hora ? ` · ${atividade.hora}` : ''}
                        </span>
                      )}
                      {atividade.recorrencia && atividade.recorrencia !== 'nenhuma' && (
                        <span
                          className="inline-flex items-center gap-1 rounded bg-primary-teal/15 px-1.5 py-0.5 text-[11px] font-medium text-primary-teal"
                          title={`Recorrência: ${atividade.recorrencia}`}
                        >
                          <i className="ri-repeat-line text-xs" />
                          <span className="capitalize">{atividade.recorrencia.replace('_', ' ')}</span>
                        </span>
                      )}
                      {atividade.deal_id && atividade.deal_titulo && (
                        <Link
                          to={`/crm/negocios/${atividade.deal_id}`}
                          className="text-primary-teal hover:underline"
                        >
                          {atividade.deal_titulo}
                        </Link>
                      )}
                      {atividade.person_nome && <span>{atividade.person_nome}</span>}
                      {atividade.dono_nome && <span>· {atividade.dono_nome}</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => duplicar(atividade)}
                    title="Duplicar atividade"
                    aria-label={`Duplicar ${atividade.assunto}`}
                    className="shrink-0 rounded p-1.5 text-gray-500 transition-smooth hover:bg-dark-hover hover:text-primary-teal"
                  >
                    <i className="ri-file-copy-line" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setParaExcluir(atividade)}
                    title="Excluir atividade"
                    aria-label={`Excluir ${atividade.assunto}`}
                    className="shrink-0 rounded p-1.5 text-gray-600 transition-smooth hover:bg-dark-hover hover:text-red-400"
                  >
                    <i className="ri-delete-bin-line" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <CrmAtividadeForm
        aberto={formAberto}
        atividade={emEdicao}
        usuarios={usuarios}
        negocios={negocios}
        pessoas={pessoas}
        organizacoes={organizacoes}
        salvando={salvando}
        onSalvar={salvar}
        onFechar={() => {
          setFormAberto(false);
          setEmEdicao(null);
        }}
      />

      <CrmModal
        titulo="Excluir atividade"
        aberto={paraExcluir !== null}
        onFechar={() => setParaExcluir(null)}
        largura="max-w-md"
        rodape={
          <>
            <button
              type="button"
              onClick={() => setParaExcluir(null)}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                if (paraExcluir) await excluirAtividades([paraExcluir.id]);
                setParaExcluir(null);
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
          A atividade <strong className="text-white">{paraExcluir?.assunto}</strong> será removida.
        </p>
      </CrmModal>
    </CrmLayout>
  );
}

function FiltroBotao({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-smooth ${
        ativo
          ? 'bg-primary-teal/15 font-medium text-primary-teal'
          : 'text-gray-400 hover:bg-dark-hover hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
