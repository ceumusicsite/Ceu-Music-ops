import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CrmLayout from '../../../components/crm/CrmLayout';
import { CRM_SUBITENS_ATIVIDADES } from '../../../components/crm/navegacao';
import { infoTipo, listarAtividades } from '../../../services/crm/activities';
import type { CrmAtividade } from '../../../services/crm/types';

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function CrmCalendarioPage() {
  const [atividades, setAtividades] = useState<CrmAtividade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mesBase, setMesBase] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      setAtividades(await listarAtividades());
    } catch (e) {
      console.error('Erro ao carregar atividades:', e);
      setErro('Não foi possível carregar as atividades.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /** Grade sempre de segunda a domingo, completando as bordas com dias vizinhos. */
  const dias = useMemo(() => {
    const primeiro = new Date(mesBase);
    const deslocamento = (primeiro.getDay() + 6) % 7;
    const inicio = new Date(primeiro);
    inicio.setDate(inicio.getDate() - deslocamento);

    return Array.from({ length: 42 }, (_, i) => {
      const dia = new Date(inicio);
      dia.setDate(dia.getDate() + i);
      return dia;
    });
  }, [mesBase]);

  const porDia = useMemo(() => {
    const mapa: Record<string, CrmAtividade[]> = {};
    for (const atividade of atividades) {
      if (!atividade.data) continue;
      (mapa[atividade.data] ??= []).push(atividade);
    }
    for (const lista of Object.values(mapa)) {
      lista.sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''));
    }
    return mapa;
  }, [atividades]);

  const hoje = chave(new Date());
  const nomeMes = mesBase.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const andarMes = (passo: number) =>
    setMesBase((atual) => new Date(atual.getFullYear(), atual.getMonth() + passo, 1));

  return (
    <CrmLayout
      modulo="Atividades"
      titulo="Calendário"
      subItens={CRM_SUBITENS_ATIVIDADES}
      resumo={carregando ? 'Carregando…' : nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}
      acoes={
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => andarMes(-1)}
            aria-label="Mês anterior"
            className="rounded-lg border border-dark-border px-2.5 py-2 text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
          >
            <i className="ri-arrow-left-s-line" />
          </button>
          <button
            type="button"
            onClick={() => {
              const agora = new Date();
              setMesBase(new Date(agora.getFullYear(), agora.getMonth(), 1));
            }}
            className="rounded-lg border border-dark-border px-3 py-2 text-sm text-gray-300 transition-smooth hover:bg-dark-hover hover:text-white"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => andarMes(1)}
            aria-label="Próximo mês"
            className="rounded-lg border border-dark-border px-2.5 py-2 text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
          >
            <i className="ri-arrow-right-s-line" />
          </button>
        </div>
      }
    >
      {erro && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-dark-border bg-dark-card">
        <div className="grid grid-cols-7 border-b border-dark-border">
          {DIAS_SEMANA.map((dia) => (
            <div
              key={dia}
              className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              {dia}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {dias.map((dia) => {
            const id = chave(dia);
            const doMes = dia.getMonth() === mesBase.getMonth();
            const doDia = porDia[id] ?? [];

            return (
              <div
                key={id}
                className={`min-h-[6.5rem] border-b border-r border-dark-border/60 p-1.5 ${
                  doMes ? '' : 'bg-dark-bg/40'
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    id === hoje
                      ? 'bg-primary-teal font-semibold text-white'
                      : doMes
                        ? 'text-gray-300'
                        : 'text-gray-600'
                  }`}
                >
                  {dia.getDate()}
                </span>

                <div className="mt-1 space-y-1">
                  {doDia.slice(0, 3).map((atividade) => {
                    const tipo = infoTipo(atividade.tipo);
                    const conteudo = (
                      <>
                        <i className={`${tipo.icone} shrink-0`} />
                        {atividade.recorrencia && atividade.recorrencia !== 'nenhuma' && (
                          <i className="ri-repeat-line shrink-0 text-[10px] opacity-80" title="Atividade recorrente" />
                        )}
                        <span className="truncate">
                          {atividade.hora ? `${atividade.hora} ` : ''}
                          {atividade.assunto}
                        </span>
                      </>
                    );

                    const classe = `flex items-center gap-1 rounded px-1 py-0.5 text-[11px] ${
                      atividade.concluida
                        ? 'bg-dark-hover text-gray-500 line-through'
                        : 'bg-primary-teal/15 text-primary-teal'
                    }`;

                    return atividade.deal_id ? (
                      <Link
                        key={atividade.id}
                        to={`/crm/negocios/${atividade.deal_id}`}
                        title={atividade.assunto}
                        className={`${classe} hover:underline`}
                      >
                        {conteudo}
                      </Link>
                    ) : (
                      <div key={atividade.id} title={atividade.assunto} className={classe}>
                        {conteudo}
                      </div>
                    );
                  })}

                  {doDia.length > 3 && (
                    <p className="px-1 text-[11px] text-gray-500">+{doDia.length - 3}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CrmLayout>
  );
}

/** Data no formato YYYY-MM-DD em horário local, para casar com a coluna DATE. */
function chave(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}
