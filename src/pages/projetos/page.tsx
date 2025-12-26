import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';

type ViewMode = 'list' | 'kanban';

interface Projeto {
  id: string;
  nome: string;
  fase: string;
  progresso: number;
  prazo: string;
  prioridade: string;
  artista: { nome: string };
}

interface Artista {
  id: string;
  nome: string;
}

export default function Projetos() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    artista_id: '',
    fase: 'ideia',
    progresso: 0,
    prioridade: 'media',
    prazo: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projetosRes, artistasRes] = await Promise.all([
        supabase
          .from('projetos')
          .select('id, nome, fase, progresso, prazo, prioridade, artista:artista_id(nome)')
          .order('created_at', { ascending: false }),
        supabase
          .from('artistas')
          .select('id, nome')
          .eq('status', 'ativo')
          .order('nome')
      ]);

      if (projetosRes.data) setProjetos(projetosRes.data as any);
      if (artistasRes.data) setArtistas(artistasRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('projetos')
        .insert([formData]);

      if (error) throw error;

      setShowModal(false);
      setFormData({
        nome: '',
        artista_id: '',
        fase: 'ideia',
        progresso: 0,
        prioridade: 'media',
        prazo: ''
      });
      loadData();
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      alert('Erro ao criar projeto. Tente novamente.');
    }
  };

  const phases = ['ideia', 'producao', 'gravacao', 'mixagem', 'masterizacao', 'aprovacao', 'agendamento', 'publicacao'];

  const filteredProjetos = projetos.filter(projeto =>
    projeto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    projeto.artista?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPhaseColor = (phase: string) => {
    const colors: Record<string, string> = {
      'ideia': 'bg-gray-500/20 text-gray-400',
      'producao': 'bg-blue-500/20 text-blue-400',
      'gravacao': 'bg-purple-500/20 text-purple-400',
      'mixagem': 'bg-yellow-500/20 text-yellow-400',
      'masterizacao': 'bg-orange-500/20 text-orange-400',
      'aprovacao': 'bg-pink-500/20 text-pink-400',
      'agendamento': 'bg-primary-teal/20 text-primary-teal',
      'publicacao': 'bg-green-500/20 text-green-400',
    };
    return colors[phase] || 'bg-gray-500/20 text-gray-400';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'alta': 'bg-red-500/20 text-red-400',
      'media': 'bg-yellow-500/20 text-yellow-400',
      'baixa': 'bg-green-500/20 text-green-400',
    };
    return colors[priority] || 'bg-gray-500/20 text-gray-400';
  };

  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      'ideia': 'Ideia',
      'producao': 'Produção',
      'gravacao': 'Gravação',
      'mixagem': 'Mixagem',
      'masterizacao': 'Masterização',
      'aprovacao': 'Aprovação',
      'agendamento': 'Agendamento',
      'publicacao': 'Publicação'
    };
    return labels[phase] || phase;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
            <p className="text-gray-400 mt-4">Carregando projetos...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Projetos</h1>
            <p className="text-gray-400">Gerencie todos os projetos musicais</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-add-line text-xl"></i>
            Novo Projeto
          </button>
        </div>

        {/* Filters and View Toggle */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="text"
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2 bg-dark-bg rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-smooth cursor-pointer whitespace-nowrap ${
                  viewMode === 'list' ? 'bg-gradient-primary text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <i className="ri-list-check text-lg"></i>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 rounded-lg transition-smooth cursor-pointer whitespace-nowrap ${
                  viewMode === 'kanban' ? 'bg-gradient-primary text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <i className="ri-layout-grid-line text-lg"></i>
              </button>
            </div>
          </div>
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-bg border-b border-dark-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Projeto</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Artista</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Fase</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Progresso</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Prioridade</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Prazo</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjetos.map((projeto) => (
                    <tr key={projeto.id} className="border-b border-dark-border hover:bg-dark-hover transition-smooth cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                            <i className="ri-music-2-line text-white"></i>
                          </div>
                          <span className="text-sm font-medium text-white">{projeto.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{projeto.artista?.nome || 'Sem artista'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPhaseColor(projeto.fase)}`}>
                          {getPhaseLabel(projeto.fase)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-dark-border rounded-full overflow-hidden min-w-[100px]">
                            <div 
                              className="h-full bg-gradient-primary rounded-full transition-smooth"
                              style={{ width: `${projeto.progresso}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{projeto.progresso}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPriorityColor(projeto.prioridade)}`}>
                          {projeto.prioridade.charAt(0).toUpperCase() + projeto.prioridade.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                        {projeto.prazo ? new Date(projeto.prazo).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 hover:bg-dark-bg rounded-lg transition-smooth cursor-pointer">
                          <i className="ri-more-2-fill text-gray-400"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {phases.map((phase) => {
                const phaseProjetos = filteredProjetos.filter(p => p.fase === phase);
                return (
                  <div key={phase} className="w-80 flex-shrink-0">
                    <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-white">{getPhaseLabel(phase)}</h3>
                        <span className="px-2 py-1 bg-dark-bg text-gray-400 text-xs rounded whitespace-nowrap">
                          {phaseProjetos.length}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {phaseProjetos.map((projeto) => (
                          <div key={projeto.id} className="p-4 bg-dark-bg rounded-lg hover:bg-dark-hover transition-smooth cursor-pointer">
                            <h4 className="text-sm font-medium text-white mb-2">{projeto.nome}</h4>
                            <p className="text-xs text-gray-400 mb-3">{projeto.artista?.nome || 'Sem artista'}</p>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex-1 h-1.5 bg-dark-border rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-primary rounded-full transition-smooth"
                                  style={{ width: `${projeto.progresso}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-400 whitespace-nowrap">{projeto.progresso}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getPriorityColor(projeto.prioridade)}`}>
                                {projeto.prioridade.charAt(0).toUpperCase() + projeto.prioridade.slice(1)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {projeto.prazo ? new Date(projeto.prazo).toLocaleDateString('pt-BR') : '-'}
                              </span>
                            </div>
                          </div>
                        ))}
                        {phaseProjetos.length === 0 && (
                          <div className="text-center py-8 text-gray-600 text-sm">
                            Nenhum projeto
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Novo Projeto */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Novo Projeto</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Nome do Projeto</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Novo Single - Verão 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Artista</label>
                  <select
                    required
                    value={formData.artista_id}
                    onChange={(e) => setFormData({ ...formData, artista_id: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="">Selecione um artista</option>
                    {artistas.map((artista) => (
                      <option key={artista.id} value={artista.id}>{artista.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Fase Inicial</label>
                  <select
                    value={formData.fase}
                    onChange={(e) => setFormData({ ...formData, fase: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    {phases.map((phase) => (
                      <option key={phase} value={phase}>{getPhaseLabel(phase)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Prioridade</label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Prazo</label>
                  <input
                    type="date"
                    value={formData.prazo}
                    onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Criar Projeto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}