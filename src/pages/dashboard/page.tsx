import { useEffect, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Stats {
  projetos_ativos: number;
  orcamentos_pendentes: number;
  tarefas_atrasadas: number;
  lancamentos_mes: number;
}

interface Projeto {
  id: string;
  nome: string;
  fase: string;
  progresso: number;
  artista: { nome: string };
}

interface Orcamento {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  created_at: string;
}

interface Lancamento {
  id: string;
  titulo: string;
  data_planejada: string;
  plataforma: string;
  projeto: { artista: { nome: string } };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    projetos_ativos: 0,
    orcamentos_pendentes: 0,
    tarefas_atrasadas: 0,
    lancamentos_mes: 0
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
      // Carregar estatísticas
      const [projetos, orcamentos, tarefas, lancamentos] = await Promise.all([
        supabase.from('projetos').select('id', { count: 'exact', head: true }).neq('status', 'arquivado'),
        supabase.from('orcamentos').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('tarefas').select('id', { count: 'exact', head: true }).eq('status', 'atrasada'),
        supabase.from('lancamentos').select('id', { count: 'exact', head: true })
          .gte('data_planejada', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .lt('data_planejada', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString())
      ]);

      setStats({
        projetos_ativos: projetos.count || 0,
        orcamentos_pendentes: orcamentos.count || 0,
        tarefas_atrasadas: tarefas.count || 0,
        lancamentos_mes: lancamentos.count || 0
      });

      // Carregar projetos recentes
      const { data: projetosData } = await supabase
        .from('projetos')
        .select('id, nome, fase, progresso, artista:artista_id(nome)')
        .order('updated_at', { ascending: false })
        .limit(4);

      if (projetosData) setRecentProjects(projetosData as any);

      // Carregar orçamentos pendentes
      const { data: orcamentosData } = await supabase
        .from('orcamentos')
        .select('id, tipo, descricao, valor, created_at')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false })
        .limit(3);

      if (orcamentosData) setPendingApprovals(orcamentosData);

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

  const statsConfig = [
    { label: 'Projetos Ativos', value: stats.projetos_ativos, icon: 'ri-music-2-line', color: 'from-primary-teal to-primary-brown' },
    { label: 'Orçamentos Pendentes', value: stats.orcamentos_pendentes, icon: 'ri-file-list-3-line', color: 'from-primary-brown to-primary-dark' },
    { label: 'Tarefas Atrasadas', value: stats.tarefas_atrasadas, icon: 'ri-alert-line', color: 'from-red-500 to-red-700' },
    { label: 'Lançamentos Este Mês', value: stats.lancamentos_mes, icon: 'ri-rocket-line', color: 'from-primary-dark to-primary-light' },
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsConfig.map((stat, index) => (
            <div key={index} className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-primary-teal transition-smooth">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Projects */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Projetos Recentes</h2>
              <a href="/projetos" className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer">
                Ver todos
              </a>
            </div>
            <div className="space-y-4">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <div key={project.id} className="p-4 bg-dark-bg rounded-lg hover:bg-dark-hover transition-smooth cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-medium text-white">{project.nome}</h3>
                        <p className="text-xs text-gray-400">{project.artista?.nome || 'Sem artista'}</p>
                      </div>
                      <span className="px-3 py-1 bg-gradient-primary text-white text-xs rounded-full whitespace-nowrap">
                        {project.fase}
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
              <a href="/orcamentos" className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer">
                Ver todos
              </a>
            </div>
            <div className="space-y-4">
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map((item) => (
                  <div key={item.id} className="p-4 bg-dark-bg rounded-lg hover:bg-dark-hover transition-smooth cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded whitespace-nowrap">
                            {item.tipo}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-white">{item.descricao}</h3>
                      </div>
                      <span className="text-sm font-semibold text-primary-teal whitespace-nowrap ml-3">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
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
            <a href="/lancamentos" className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer">
              Ver calendário
            </a>
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