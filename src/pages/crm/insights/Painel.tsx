import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import CrmLayout from '../../../components/crm/CrmLayout';
import { CRM_SUBITENS_INSIGHTS } from '../../../components/crm/navegacao';
import { listarEtapas, listarPipelines } from '../../../services/crm/deals';
import { carregarInsights, type DadosInsights, type PontoFunil } from '../../../services/crm/insights';
import { formatarMoeda } from '../../../services/crm/formato';
import type { CrmPipeline } from '../../../services/crm/types';

const TEAL = '#10767c';
const VERDE = '#16a34a';
const VERMELHO = '#dc2626';
const MARROM = '#925938';

const EIXO = { stroke: '#6b7280', fontSize: 12 };
const GRADE = '#2a2a2a';

const ESTILO_TOOLTIP = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: '0.5rem',
  color: '#fff',
  fontSize: '0.8rem',
};

export default function CrmInsightsPage() {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [pipelineAtual, setPipelineAtual] = useState('');
  const [dados, setDados] = useState<DadosInsights | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async (pipelineId: string) => {
    setCarregando(true);
    setErro('');
    try {
      const etapas = await listarEtapas(pipelineId);
      setDados(await carregarInsights(pipelineId, etapas));
    } catch (e) {
      console.error('Erro ao carregar insights:', e);
      setErro('Não foi possível carregar os indicadores.');
    } finally {
      setCarregando(false);
    }
  }, []);

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
    if (pipelineAtual) carregar(pipelineAtual);
  }, [pipelineAtual, carregar]);

  const resumo = dados?.resumo;

  return (
    <CrmLayout
      modulo="Insights"
      titulo="Painel"
      subItens={CRM_SUBITENS_INSIGHTS}
      resumo="Desempenho do funil, conversão e atividades"
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

      {carregando ? (
        <div className="rounded-xl border border-dark-border bg-dark-card p-10 text-center text-gray-500">
          <i className="ri-loader-4-line animate-spin text-2xl" />
          <p className="mt-2 text-sm">Calculando indicadores…</p>
        </div>
      ) : !dados ? (
        <div className="rounded-xl border border-dark-border bg-dark-card p-10 text-center text-gray-500">
          <p className="text-sm">Nenhum funil disponível.</p>
        </div>
      ) : (
        <>
          {/* Cartões de resumo */}
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Cartao
              rotulo="Em aberto"
              valor={formatarMoeda(resumo!.valorEmAberto)}
              detalhe={`${resumo!.negociosAbertos} negócio(s)`}
              icone="ri-briefcase-line"
            />
            <Cartao
              rotulo="Ganho"
              valor={formatarMoeda(resumo!.valorGanho)}
              detalhe={`${resumo!.negociosGanhos} negócio(s)`}
              icone="ri-trophy-line"
              cor="text-green-400"
            />
            <Cartao
              rotulo="Taxa de conversão"
              valor={`${resumo!.taxaConversao.toFixed(0)}%`}
              detalhe={`${resumo!.negociosGanhos} ganhos · ${resumo!.negociosPerdidos} perdidos`}
              icone="ri-line-chart-line"
            />
            <Cartao
              rotulo="Ticket médio"
              valor={formatarMoeda(resumo!.ticketMedio)}
              detalhe={
                resumo!.cicloMedioDias === null
                  ? 'Ciclo médio indisponível'
                  : `Ciclo médio de ${resumo!.cicloMedioDias} dias`
              }
              icone="ri-price-tag-3-line"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Painel
              titulo="Funil de conversão"
              descricao="Total acumulado de pessoas que passaram por cada etapa"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dados.funil} layout="vertical" margin={{ left: 8, right: 32 }}>
                  <CartesianGrid stroke={GRADE} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} {...EIXO} />
                  <YAxis type="category" dataKey="etapa" width={130} {...EIXO} />
                  <Tooltip
                    cursor={{ fill: '#ffffff08' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const ponto = payload[0].payload as PontoFunil;
                      return (
                        <div style={ESTILO_TOOLTIP} className="p-3 text-xs space-y-1 shadow-xl">
                          <p className="font-semibold text-white text-sm mb-1">{ponto.etapa}</p>
                          <p className="text-primary-teal font-medium">
                            Total que passaram: <strong className="text-white">{ponto.quantidade} {ponto.quantidade === 1 ? 'pessoa' : 'pessoas'}</strong>
                          </p>
                          {ponto.negocios !== undefined && ponto.negocios !== ponto.quantidade && (
                            <p className="text-gray-300">
                              Negócios relacionados: <strong className="text-white">{ponto.negocios}</strong>
                            </p>
                          )}
                          <p className="text-gray-400">
                            Parados nesta etapa: <span className="text-gray-200">{ponto.atuais ?? 0}</span>
                          </p>
                          <p className="text-gray-400">
                            Avançaram de etapa: <span className="text-gray-200">{ponto.avancaram ?? 0}</span>
                          </p>
                          {ponto.taxa !== undefined && (
                            <p className="text-gray-400">
                              Conversão do funil: <span className="text-emerald-400 font-medium">{ponto.taxa.toFixed(0)}%</span>
                            </p>
                          )}
                          {ponto.valor > 0 && (
                            <p className="text-gray-400">
                              Valor acumulado: <span className="text-white">{formatarMoeda(ponto.valor)}</span>
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="quantidade" name="Pessoas que passaram" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="quantidade" position="right" fill="#9ca3af" fontSize={11} offset={8} />
                    {dados.funil.map((_, indice) => (
                      <Cell key={indice} fill={TEAL} fillOpacity={1 - indice * 0.12} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Painel>

            <Painel titulo="Ganhos e perdas" descricao="Negócios fechados nos últimos 6 meses">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dados.porMes} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid stroke={GRADE} vertical={false} />
                  <XAxis dataKey="mes" {...EIXO} />
                  <YAxis allowDecimals={false} {...EIXO} />
                  <Tooltip contentStyle={ESTILO_TOOLTIP} cursor={{ fill: '#ffffff08' }} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                  <Bar dataKey="ganho" name="Ganhos" fill={VERDE} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="perdido" name="Perdidos" fill={VERMELHO} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Painel>

            <Painel titulo="Receita ganha por mês" descricao="Valor dos negócios fechados como ganhos">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dados.porMes} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid stroke={GRADE} vertical={false} />
                  <XAxis dataKey="mes" {...EIXO} />
                  <YAxis {...EIXO} tickFormatter={(v) => formatarMoeda(Number(v))} width={90} />
                  <Tooltip
                    contentStyle={ESTILO_TOOLTIP}
                    cursor={{ fill: '#ffffff08' }}
                    formatter={(valor: number) => formatarMoeda(valor)}
                  />
                  <Bar dataKey="valorGanho" name="Receita" fill={TEAL} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Painel>

            <Painel titulo="Desempenho por responsável" descricao="Valor ganho por pessoa">
              {dados.porResponsavel.length === 0 ? (
                <Vazio texto="Nenhum negócio com responsável ainda." />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={dados.porResponsavel}
                    layout="vertical"
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid stroke={GRADE} horizontal={false} />
                    <XAxis type="number" {...EIXO} tickFormatter={(v) => formatarMoeda(Number(v))} />
                    <YAxis type="category" dataKey="responsavel" width={130} {...EIXO} />
                    <Tooltip
                      contentStyle={ESTILO_TOOLTIP}
                      cursor={{ fill: '#ffffff08' }}
                      formatter={(valor: number) => formatarMoeda(valor)}
                    />
                    <Bar dataKey="valorGanho" name="Valor ganho" fill={MARROM} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Painel>

            <Painel
              titulo="Atividades por tipo"
              descricao="Concluídas e pendentes"
              largura="xl:col-span-2"
            >
              {dados.atividades.length === 0 ? (
                <Vazio texto="Nenhuma atividade registrada ainda." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dados.atividades} margin={{ left: 8, right: 16 }}>
                    <CartesianGrid stroke={GRADE} vertical={false} />
                    <XAxis dataKey="tipo" {...EIXO} />
                    <YAxis allowDecimals={false} {...EIXO} />
                    <Tooltip contentStyle={ESTILO_TOOLTIP} cursor={{ fill: '#ffffff08' }} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                    <Bar dataKey="concluidas" name="Concluídas" fill={VERDE} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pendentes" name="Pendentes" fill={TEAL} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Painel>
          </div>
        </>
      )}
    </CrmLayout>
  );
}

function Cartao({
  rotulo,
  valor,
  detalhe,
  icone,
  cor = 'text-primary-teal',
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
  icone: string;
  cor?: string;
}) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
        <i className={`${icone} text-base`} />
        {rotulo}
      </div>
      <p className={`mt-2 text-2xl font-semibold ${cor}`}>{valor}</p>
      <p className="mt-0.5 text-xs text-gray-500">{detalhe}</p>
    </div>
  );
}

function Painel({
  titulo,
  descricao,
  largura = '',
  children,
}: {
  titulo: string;
  descricao: string;
  largura?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-dark-border bg-dark-card p-4 ${largura}`}>
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-white">{titulo}</h2>
        <p className="text-xs text-gray-500">{descricao}</p>
      </header>
      {children}
    </section>
  );
}

function Vazio({ texto }: { texto: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-center text-sm text-gray-600">
      {texto}
    </div>
  );
}
