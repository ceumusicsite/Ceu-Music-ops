import { useCallback, useEffect, useState } from 'react';
import CrmAtividadeForm from './CrmAtividadeForm';
import {
  alternarConcluida,
  atualizarAtividade,
  criarAtividade,
  duplicarAtividade,
  excluirAtividades,
  infoTipo,
  listarAtividadesDe,
  type EntradaAtividade,
} from '../../services/crm/activities';
import { criarNota, excluirNota, listarNotasDe } from '../../services/crm/notes';
import {
  enviarArquivo,
  excluirArquivo,
  formatarTamanho,
  listarArquivosDe,
  urlParaBaixar,
  type CrmArquivo,
} from '../../services/crm/files';
import { formatarData } from '../../services/crm/formato';
import {
  descreverEvento,
  listarHistorico,
  type CrmEventoHistorico,
} from '../../services/crm/historico';
import { useAuth } from '../../contexts/AuthContext';
import type { OpcaoUsuario } from '../../services/crm/usuarios';
import type { CrmAtividade, CrmNota } from '../../services/crm/types';

const ABAS = ['Atividade', 'Anotações', 'Arquivos', 'Histórico'] as const;
type Aba = (typeof ABAS)[number];

interface CrmLinhaDoTempoProps {
  /** Qual entidade a linha do tempo acompanha. */
  vinculo: { campo: 'deal_id' | 'person_id' | 'organizacao_id'; id: string };
  usuarios: OpcaoUsuario[];
}

export default function CrmLinhaDoTempo({ vinculo, usuarios }: CrmLinhaDoTempoProps) {
  const { user } = useAuth();
  const [aba, setAba] = useState<Aba>('Atividade');

  const [atividades, setAtividades] = useState<CrmAtividade[]>([]);
  const [notas, setNotas] = useState<CrmNota[]>([]);
  const [arquivos, setArquivos] = useState<CrmArquivo[]>([]);
  const [enviando, setEnviando] = useState<number | null>(null);
  const [historico, setHistorico] = useState<CrmEventoHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<CrmAtividade | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [rascunhoNota, setRascunhoNota] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const entidadeDoLog =
        vinculo.campo === 'deal_id'
          ? 'negocio'
          : vinculo.campo === 'person_id'
            ? 'pessoa'
            : 'organizacao';

      const [listaAtividades, listaNotas, listaArquivos, listaHistorico] = await Promise.all([
        listarAtividadesDe(vinculo.campo, vinculo.id),
        listarNotasDe(vinculo.campo, vinculo.id),
        listarArquivosDe(vinculo.campo, vinculo.id),
        listarHistorico(entidadeDoLog, vinculo.id),
      ]);
      setAtividades(listaAtividades);
      setNotas(listaNotas);
      setArquivos(listaArquivos);
      setHistorico(listaHistorico);
    } catch (e) {
      console.error('Erro ao carregar a linha do tempo:', e);
      setErro('Não foi possível carregar a linha do tempo.');
    } finally {
      setCarregando(false);
    }
  }, [vinculo.campo, vinculo.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const vinculoFixo = { [vinculo.campo]: vinculo.id } as {
    deal_id?: string;
    person_id?: string;
    organizacao_id?: string;
  };

  const salvarAtividade = async (entrada: EntradaAtividade) => {
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

  const concluir = async (atividade: CrmAtividade) => {
    setAtividades((atuais) =>
      atuais.map((a) => (a.id === atividade.id ? { ...a, concluida: !a.concluida } : a))
    );
    try {
      await alternarConcluida(atividade.id, !atividade.concluida);
    } catch (e) {
      console.error('Erro ao concluir atividade:', e);
      await carregar();
    }
  };

  const adicionarNota = async () => {
    if (rascunhoNota.trim() === '') return;
    try {
      await criarNota(rascunhoNota, vinculoFixo, user?.id);
      setRascunhoNota('');
      await carregar();
    } catch (e) {
      console.error('Erro ao salvar nota:', e);
      setErro('Não foi possível salvar a anotação.');
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

  const pendentes = atividades.filter((a) => !a.concluida);
  const concluidas = atividades.filter((a) => a.concluida);

  return (
    <section className="rounded-xl border border-dark-border bg-dark-card">
      <nav className="flex gap-1 border-b border-dark-border px-3 pt-2">
        {ABAS.map((nome) => (
          <button
            key={nome}
            type="button"
            onClick={() => setAba(nome)}
            className={`rounded-t-lg px-3 py-2 text-sm transition-smooth ${
              aba === nome
                ? 'border-b-2 border-primary-teal font-semibold text-primary-teal'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {nome}
            {nome === 'Atividade' && pendentes.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary-teal px-1.5 text-xs font-semibold text-white">
                {pendentes.length}
              </span>
            )}
            {nome === 'Arquivos' && arquivos.length > 0 && (
              <span className="ml-1.5 text-xs text-gray-500">{arquivos.length}</span>
            )}
          </button>
        ))}
      </nav>

      {erro && (
        <p className="m-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {erro}
        </p>
      )}

      {carregando ? (
        <div className="p-10 text-center text-gray-500">
          <i className="ri-loader-4-line animate-spin text-2xl" />
        </div>
      ) : aba === 'Atividade' ? (
        <div className="p-4">
          <button
            type="button"
            onClick={() => {
              setEmEdicao(null);
              setFormAberto(true);
            }}
            className="mb-4 w-full rounded-lg border border-dashed border-dark-border px-4 py-3 text-left text-sm text-gray-500 transition-smooth hover:border-primary-teal hover:text-primary-teal"
          >
            <i className="ri-add-line mr-1.5" />
            Clique aqui para adicionar uma atividade…
          </button>

          {atividades.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-600">
              Nenhuma atividade registrada ainda.
            </p>
          ) : (
            <>
              <ListaAtividades
                titulo="Pendentes"
                atividades={pendentes}
                onConcluir={concluir}
                onEditar={(a) => {
                  setEmEdicao(a);
                  setFormAberto(true);
                }}
                onDuplicar={duplicar}
                onExcluir={async (a) => {
                  await excluirAtividades([a.id]);
                  await carregar();
                }}
              />
              <ListaAtividades
                titulo="Concluídas"
                atividades={concluidas}
                onConcluir={concluir}
                onEditar={(a) => {
                  setEmEdicao(a);
                  setFormAberto(true);
                }}
                onDuplicar={duplicar}
                onExcluir={async (a) => {
                  await excluirAtividades([a.id]);
                  await carregar();
                }}
              />
            </>
          )}
        </div>
      ) : aba === 'Anotações' ? (
        <div className="p-4">
          <textarea
            rows={3}
            value={rascunhoNota}
            onChange={(e) => setRascunhoNota(e.target.value)}
            placeholder="Escreva uma anotação…"
            className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-smooth focus:border-primary-teal"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={adicionarNota}
              disabled={rascunhoNota.trim() === ''}
              className="rounded-lg bg-primary-teal px-4 py-2 text-sm font-semibold text-white transition-smooth hover:opacity-90 disabled:opacity-40"
            >
              Salvar anotação
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {notas.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-600">Nenhuma anotação ainda.</p>
            )}
            {notas.map((nota) => (
              <article key={nota.id} className="rounded-lg border border-dark-border p-3">
                <header className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-500">
                  <span>
                    {nota.autor_nome ?? 'Alguém'} ·{' '}
                    {new Date(nota.created_at).toLocaleString('pt-BR')}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await excluirNota(nota.id);
                      await carregar();
                    }}
                    aria-label="Excluir anotação"
                    className="rounded p-1 transition-smooth hover:bg-dark-hover hover:text-red-400"
                  >
                    <i className="ri-delete-bin-line" />
                  </button>
                </header>
                <p className="whitespace-pre-wrap text-sm text-gray-200">{nota.conteudo}</p>
              </article>
            ))}
          </div>
        </div>
      ) : aba === 'Arquivos' ? (
        <div className="p-4">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-dark-border px-4 py-6 text-sm text-gray-500 transition-smooth hover:border-primary-teal hover:text-primary-teal">
            <i className="ri-upload-2-line text-base" />
            {enviando === null ? 'Clique para anexar um arquivo' : `Enviando… ${enviando}%`}
            <input
              type="file"
              className="hidden"
              disabled={enviando !== null}
              onChange={async (evento) => {
                const arquivo = evento.target.files?.[0];
                if (!arquivo) return;
                setEnviando(0);
                try {
                  await enviarArquivo(arquivo, vinculoFixo, user?.id, setEnviando);
                  await carregar();
                } catch (e) {
                  console.error('Erro ao enviar arquivo:', e);
                  // O R2 devolve mensagens úteis (CORS, credenciais, tamanho):
                  // esconder isso atrás de um texto genérico só atrapalha.
                  setErro(
                    e instanceof Error ? e.message : 'Não foi possível enviar o arquivo.'
                  );
                } finally {
                  setEnviando(null);
                  evento.target.value = '';
                }
              }}
            />
          </label>

          <div className="mt-4 space-y-2">
            {arquivos.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-600">Nenhum arquivo anexado.</p>
            )}
            {arquivos.map((arquivo) => (
              <div
                key={arquivo.id}
                className="flex items-center gap-3 rounded-lg border border-dark-border px-3 py-2.5"
              >
                <i className="ri-file-line shrink-0 text-lg text-gray-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{arquivo.nome}</p>
                  <p className="text-xs text-gray-500">
                    {formatarTamanho(arquivo.tamanho)}
                    {arquivo.autor_nome ? ` · ${arquivo.autor_nome}` : ''} ·{' '}
                    {new Date(arquivo.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      window.open(await urlParaBaixar(arquivo), '_blank', 'noopener');
                    } catch (e) {
                      console.error('Erro ao gerar link do arquivo:', e);
                      setErro('Não foi possível gerar o link de download.');
                    }
                  }}
                  aria-label={`Baixar ${arquivo.nome}`}
                  className="rounded p-1.5 text-gray-500 transition-smooth hover:bg-dark-hover hover:text-primary-teal"
                >
                  <i className="ri-download-2-line" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await excluirArquivo(arquivo);
                    await carregar();
                  }}
                  aria-label={`Excluir ${arquivo.nome}`}
                  className="rounded p-1.5 text-gray-600 transition-smooth hover:bg-dark-hover hover:text-red-400"
                >
                  <i className="ri-delete-bin-line" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4">
          {historico.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-600">
              Nenhuma alteração registrada ainda.
            </p>
          ) : (
            <ol className="relative space-y-4 border-l border-dark-border pl-5">
              {historico.map((evento) => (
                <li key={evento.id} className="relative">
                  <span className="absolute -left-[1.6rem] top-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-dark-card bg-primary-teal" />
                  <p className="text-sm text-gray-200">{descreverEvento(evento)}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {new Date(evento.created_at).toLocaleString('pt-BR')}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <CrmAtividadeForm
        aberto={formAberto}
        atividade={emEdicao}
        usuarios={usuarios}
        vinculoFixo={vinculoFixo}
        salvando={salvando}
        onSalvar={salvarAtividade}
        onFechar={() => {
          setFormAberto(false);
          setEmEdicao(null);
        }}
      />
    </section>
  );
}

function ListaAtividades({
  titulo,
  atividades,
  onConcluir,
  onEditar,
  onDuplicar,
  onExcluir,
}: {
  titulo: string;
  atividades: CrmAtividade[];
  onConcluir: (a: CrmAtividade) => void;
  onEditar: (a: CrmAtividade) => void;
  onDuplicar: (a: CrmAtividade) => void;
  onExcluir: (a: CrmAtividade) => void;
}) {
  if (atividades.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {titulo}
      </h3>
      <ul className="space-y-1.5">
        {atividades.map((atividade) => {
          const tipo = infoTipo(atividade.tipo);
          return (
            <li
              key={atividade.id}
              className="flex items-start gap-3 rounded-lg border border-dark-border px-3 py-2.5"
            >
              <button
                type="button"
                onClick={() => onConcluir(atividade)}
                aria-label={atividade.concluida ? 'Reabrir' : 'Concluir'}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-smooth ${
                  atividade.concluida
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-600 hover:border-primary-teal'
                }`}
              >
                {atividade.concluida && <i className="ri-check-line text-xs" />}
              </button>

              <i className={`${tipo.icone} mt-0.5 shrink-0 text-primary-teal`} />

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onEditar(atividade)}
                  className={`block truncate text-left text-sm ${
                    atividade.concluida ? 'text-gray-500 line-through' : 'text-white'
                  }`}
                >
                  {atividade.assunto}
                </button>
                {(atividade.data || atividade.dono_nome || (atividade.recorrencia && atividade.recorrencia !== 'nenhuma')) && (
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                    {atividade.data && <span>{formatarData(atividade.data)}</span>}
                    {atividade.hora && <span>· {atividade.hora}</span>}
                    {atividade.recorrencia && atividade.recorrencia !== 'nenhuma' && (
                      <span className="inline-flex items-center gap-1 rounded bg-primary-teal/15 px-1.5 py-0.5 text-[10px] font-medium text-primary-teal">
                        <i className="ri-repeat-line" />
                        <span className="capitalize">{atividade.recorrencia.replace('_', ' ')}</span>
                      </span>
                    )}
                    {atividade.dono_nome && <span>· {atividade.dono_nome}</span>}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onDuplicar(atividade)}
                title="Duplicar atividade"
                aria-label="Duplicar atividade"
                className="shrink-0 rounded p-1 text-gray-500 transition-smooth hover:bg-dark-hover hover:text-primary-teal"
              >
                <i className="ri-file-copy-line" />
              </button>

              <button
                type="button"
                onClick={() => onExcluir(atividade)}
                title="Excluir atividade"
                aria-label="Excluir atividade"
                className="shrink-0 rounded p-1 text-gray-600 transition-smooth hover:bg-dark-hover hover:text-red-400"
              >
                <i className="ri-delete-bin-line" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
