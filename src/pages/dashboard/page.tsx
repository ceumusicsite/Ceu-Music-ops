import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Stats {
  artistas_ativos: number;
  projetos_andamento: number;
  projetos_finalizados: number;
  projetos_atrasados: number;
  orcamentos_pendentes: number;
  lancamentos_mes: number;
}

interface FinanceiroSummary {
  total_orcado: number;
  total_realizado: number;
  total_pendente: number;
}

interface Projeto {
  id: string;
  nome: string;
  fase: string;
  progresso: number;
  previsao_lancamento?: string;
  artista: { nome: string };
}

interface Orcamento {
  id: string;
  projeto_id: string;
  valor_total: number;
  descricao?: string;
  created_at: string;
  projeto?: { nome: string };
}

interface Lancamento {
  id: string;
  titulo: string;
  data_planejada: string;
  plataforma: string;
  projeto: { artista: { nome: string } };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    artistas_ativos: 0,
    projetos_andamento: 0,
    projetos_finalizados: 0,
    projetos_atrasados: 0,
    orcamentos_pendentes: 0,
    lancamentos_mes: 0
  });
  const [financeiro, setFinanceiro] = useState<FinanceiroSummary>({
    total_orcado: 0,
    total_realizado: 0,
    total_pendente: 0
  });
  const [recentProjects, setRecentProjects] = useState<Projeto[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Orcamento[]>([]);
  const [upcomingReleases, setUpcomingReleases] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Carregar estatísticas de artistas
      const { count: artistasAtivos } = await supabase
        .from('artistas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');

      // Carregar projetos
      const { data: projetosData } = await supabase
        .from('projetos')
        .select('id, fase, previsao_lancamento');

      if (projetosData) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const projetosAndamento = projetosData.filter(p => 
          !['finalizado', 'lancado'].includes(p.fase)
        ).length;

        const projetosFinalizados = projetosData.filter(p => 
          ['finalizado', 'lancado'].includes(p.fase)
        ).length;

        const projetosAtrasados = projetosData.filter(p => {
          if (!p.previsao_lancamento || ['finalizado', 'lancado'].includes(p.fase)) {
            return false;
          }
          const previsao = new Date(p.previsao_lancamento);
          previsao.setHours(0, 0, 0, 0);
          return previsao < hoje;
        }).length;

        setStats(prev => ({
          ...prev,
          artistas_ativos: artistasAtivos || 0,
          projetos_andamento: projetosAndamento,
          projetos_finalizados: projetosFinalizados,
          projetos_atrasados: projetosAtrasados
        }));
      }

      // Carregar orçamentos pendentes
      const { count: orcamentosPendentes } = await supabase
        .from('orcamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      // Carregar lançamentos do mês
      const primeiroDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const ultimoDiaMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      const { count: lancamentosMes } = await supabase
        .from('lancamentos')
        .select('*', { count: 'exact', head: true })
        .gte('data_planejada', primeiroDiaMes.toISOString())
        .lte('data_planejada', ultimoDiaMes.toISOString());

      setStats(prev => ({
        ...prev,
        orcamentos_pendentes: orcamentosPendentes || 0,
        lancamentos_mes: lancamentosMes || 0
      }));

      // Carregar resumo financeiro
      const { data: orcamentosAprovados } = await supabase
        .from('orcamentos')
        .select('id, valor_total')
        .eq('status', 'aprovado');

      if (orcamentosAprovados) {
        const totalOrcado = orcamentosAprovados.reduce((sum, o) => sum + (o.valor_total || 0), 0);
        
        // Calcular total realizado e pendente
        let totalRealizado = 0;
        let totalPendente = 0;

        for (const orc of orcamentosAprovados) {
          const { data: pagamentos } = await supabase
            .from('pagamentos')
            .select('valor, status')
            .eq('orcamento_id', orc.id);

          if (pagamentos) {
            const pago = pagamentos
              .filter(p => p.status === 'pago')
              .reduce((sum, p) => sum + (p.valor || 0), 0);
            const pendente = pagamentos
              .filter(p => p.status === 'pendente')
              .reduce((sum, p) => sum + (p.valor || 0), 0);

            totalRealizado += pago;
            totalPendente += pendente;
          }
        }

        setFinanceiro({
          total_orcado: totalOrcado,
          total_realizado: totalRealizado,
          total_pendente: totalPendente
        });
      }

      // Carregar projetos recentes
      const { data: projetosRecentes } = await supabase
        .from('projetos')
        .select('id, nome, fase, progresso, previsao_lancamento, artista:artista_id(nome)')
        .order('updated_at', { ascending: false })
        .limit(4);

      if (projetosRecentes) setRecentProjects(projetosRecentes as any);

      // Carregar orçamentos pendentes
      const { data: orcamentosPendentesData } = await supabase
        .from('orcamentos')
        .select('id, projeto_id, valor_total, descricao, created_at, projeto:projeto_id(nome)')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false })
        .limit(3);

      if (orcamentosPendentesData) setPendingApprovals(orcamentosPendentesData as any);

      // Carregar próximos lançamentos
      const { data: lancamentosData } = await supabase
        .from('lancamentos')
        .select('id, titulo, data_planejada, plataforma, projeto:projeto_id(artista:artista_id(nome))')
        .gte('data_planejada', new Date().toISOString())
        .order('data_planejada', { ascending: true })
        .limit(3);

      if (lancamentosData) setUpcomingReleases(lancamentosData as any);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getFaseLabel = (fase: string) => {
    const labels: Record<string, string> = {
      'planejamento': 'Planejamento',
      'gravando': 'Gravando',
      'em_edicao': 'Em edição',
      'mixagem': 'Mixagem',
      'masterizacao': 'Masterização',
      'finalizado': 'Finalizado',
      'lancado': 'Lançado'
    };
    return labels[fase] || fase;
  };

  const statsConfig = [
    { label: 'Artistas Ativos', value: stats.artistas_ativos, icon: 'ri-user-star-line', color: 'from-primary-teal to-primary-brown', link: '/artistas' },
    { label: 'Projetos em Andamento', value: stats.projetos_andamento, icon: 'ri-music-2-line', color: 'from-blue-500 to-blue-700', link: '/projetos' },
    { label: 'Projetos Finalizados', value: stats.projetos_finalizados, icon: 'ri-checkbox-circle-line', color: 'from-green-500 to-green-700', link: '/projetos' },
    { label: 'Projetos Atrasados', value: stats.projetos_atrasados, icon: 'ri-alert-line', color: 'from-red-500 to-red-700', link: '/projetos' },
  ];

  const financeiroConfig = [
    { label: 'Total Orçado', value: formatCurrency(financeiro.total_orcado), icon: 'ri-file-list-3-line', color: 'from-purple-500 to-purple-700' },
    { label: 'Total Realizado', value: formatCurrency(financeiro.total_realizado), icon: 'ri-check-double-line', color: 'from-green-500 to-green-700' },
    { label: 'Total Pendente', value: formatCurrency(financeiro.total_pendente), icon: 'ri-time-line', color: 'from-yellow-500 to-yellow-700' },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
            <p className="text-gray-400 mt-4">Carregando dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const percentualRealizado = financeiro.total_orcado > 0 
    ? (financeiro.total_realizado / financeiro.total_orcado) * 100 
    : 0;

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Bem-vindo, {user?.name || 'Usuário'}
          </h1>
          <p className="text-gray-400">Visão geral da sua operação musical</p>
        </div>

        {/* Stats Grid - Projetos e Artistas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statsConfig.map((stat, index) => (
            <div 
              key={index} 
              onClick={() => stat.link && navigate(stat.link)}
              className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-primary-teal transition-smooth cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <i className={`${stat.icon} text-2xl text-white`}></i>
                </div>
                <span className="text-3xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Resumo Financeiro */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Resumo Financeiro</h2>
            <button
              onClick={() => navigate('/financeiro')}
              className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer flex items-center gap-2"
            >
              Ver detalhes
              <i className="ri-arrow-right-line"></i>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {financeiroConfig.map((item, index) => (
              <div key={index} className="bg-dark-bg rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                    <i className={`${item.icon} text-lg text-white`}></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-lg font-bold text-white">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Gráfico de Progresso Financeiro */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progresso de Realização</span>
              <span className="text-sm font-semibold text-white">{percentualRealizado.toFixed(1)}%</span>
            </div>
            <div className="w-full h-4 bg-dark-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-teal to-primary-brown rounded-full transition-all duration-500"
                style={{ width: `${Math.min(percentualRealizado, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Realizado: {formatCurrency(financeiro.total_realizado)}</span>
              <span>Orçado: {formatCurrency(financeiro.total_orcado)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de Progresso dos Projetos */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Progresso dos Projetos</h2>
              <button
                onClick={() => navigate('/projetos')}
                className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer"
              >
                Ver todos
              </button>
            </div>
            <div className="space-y-6">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">{project.nome}</h3>
                        <p className="text-xs text-gray-400">{project.artista?.nome || 'Sem artista'}</p>
                      </div>
                      <span className="text-xs text-gray-400 ml-3 whitespace-nowrap">{project.progresso}%</span>
                    </div>
                    <div className="w-full h-3 bg-dark-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-teal to-primary-brown rounded-full transition-all duration-300"
                        style={{ width: `${project.progresso}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{getFaseLabel(project.fase)}</span>
                      {project.previsao_lancamento && (
                        <span className="text-gray-500">
                          {new Date(project.previsao_lancamento).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="ri-music-2-line text-4xl mb-2"></i>
                  <p className="text-sm">Nenhum projeto encontrado</p>
                </div>
              )}
            </div>
          </div>

          {/* Distribuição de Projetos por Status */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Distribuição de Projetos</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Em Andamento</span>
                  <span className="text-sm font-semibold text-white">{stats.projetos_andamento}</span>
                </div>
                <div className="w-full h-4 bg-dark-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"
                    style={{ 
                      width: `${stats.projetos_andamento + stats.projetos_finalizados + stats.projetos_atrasados > 0 
                        ? (stats.projetos_andamento / (stats.projetos_andamento + stats.projetos_finalizados + stats.projetos_atrasados)) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Finalizados</span>
                  <span className="text-sm font-semibold text-white">{stats.projetos_finalizados}</span>
                </div>
                <div className="w-full h-4 bg-dark-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-700 rounded-full"
                    style={{ 
                      width: `${stats.projetos_andamento + stats.projetos_finalizados + stats.projetos_atrasados > 0 
                        ? (stats.projetos_finalizados / (stats.projetos_andamento + stats.projetos_finalizados + stats.projetos_atrasados)) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Atrasados</span>
                  <span className="text-sm font-semibold text-white">{stats.projetos_atrasados}</span>
                </div>
                <div className="w-full h-4 bg-dark-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-700 rounded-full"
                    style={{ 
                      width: `${stats.projetos_andamento + stats.projetos_finalizados + stats.projetos_atrasados > 0 
                        ? (stats.projetos_atrasados / (stats.projetos_andamento + stats.projetos_finalizados + stats.projetos_atrasados)) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div className="pt-4 border-t border-dark-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Total</span>
                  <span className="text-lg font-bold text-white">
                    {stats.projetos_andamento + stats.projetos_finalizados + stats.projetos_atrasados}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Projects */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Projetos Recentes</h2>
              <button
                onClick={() => navigate('/projetos')}
                className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer"
              >
                Ver todos
              </button>
            </div>
            <div className="space-y-4">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <div 
                    key={project.id} 
                    onClick={() => navigate(`/projetos/${project.id}`)}
                    className="p-4 bg-dark-bg rounded-lg hover:bg-dark-hover transition-smooth cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-medium text-white">{project.nome}</h3>
                        <p className="text-xs text-gray-400">{project.artista?.nome || 'Sem artista'}</p>
                      </div>
                      <span className="px-3 py-1 bg-gradient-primary text-white text-xs rounded-full whitespace-nowrap">
                        {getFaseLabel(project.fase)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-dark-border rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-primary rounded-full transition-smooth"
                          style={{ width: `${project.progresso}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{project.progresso}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="ri-music-2-line text-4xl mb-2"></i>
                  <p className="text-sm">Nenhum projeto encontrado</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Aprovações Pendentes</h2>
              <button
                onClick={() => navigate('/orcamentos')}
                className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer"
              >
                Ver todos
              </button>
            </div>
            <div className="space-y-4">
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => navigate('/orcamentos')}
                    className="p-4 bg-dark-bg rounded-lg hover:bg-dark-hover transition-smooth cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded whitespace-nowrap">
                            Pendente
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-white">
                          {item.projeto?.nome || item.descricao || 'Orçamento'}
                        </h3>
                      </div>
                      <span className="text-sm font-semibold text-primary-teal whitespace-nowrap ml-3">
                        {formatCurrency(item.valor_total)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="ri-file-list-3-line text-4xl mb-2"></i>
                  <p className="text-sm">Nenhuma aprovação pendente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Releases */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Próximos Lançamentos</h2>
            <button
              onClick={() => navigate('/lancamentos')}
              className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer"
            >
              Ver calendário
            </button>
          </div>
          {upcomingReleases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingReleases.map((release) => (
                <div key={release.id} className="p-4 bg-dark-bg rounded-lg hover:bg-dark-hover transition-smooth cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-white mb-1">{release.titulo}</h3>
                      <p className="text-xs text-gray-400">{release.projeto?.artista?.nome || 'Sem artista'}</p>
                    </div>
                    <i className="ri-calendar-line text-primary-teal text-lg"></i>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(release.data_planejada).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="px-2 py-1 bg-primary-teal/20 text-primary-teal text-xs rounded whitespace-nowrap">
                      {release.plataforma}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="ri-rocket-line text-4xl mb-2"></i>
              <p className="text-sm">Nenhum lançamento agendado</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
