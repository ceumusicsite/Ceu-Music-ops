import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type FilterStatus = 'todos' | 'agendado' | 'publicado' | 'cancelado';
type FilterPlatform = 'todas' | 'Spotify' | 'YouTube' | 'Apple Music' | 'Deezer' | 'TikTok';

export default function Lancamentos() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [filterPlatform, setFilterPlatform] = useState<FilterPlatform>('todas');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [artistas, setArtistas] = useState<any[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLancamento, setSelectedLancamento] = useState<any>(null);
  const [editingLancamento, setEditingLancamento] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    titulo: '',
    artista_id: '',
    projeto_id: '',
    tipo: '',
    plataforma: '',
    data_planejada: '',
    data_real: '',
    status: 'agendado',
    url: '',
    streams: '',
    observacoes: '',
  });

  useEffect(() => {
    loadLancamentos();
    loadArtistas();
    loadProjetos();
  }, []);

  const loadLancamentos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lancamentos')
        .select(`
          *,
          artista:artista_id(id, nome),
          projeto:projeto_id(id, nome)
        `)
        .order('data_planejada', { ascending: false });

      if (error) throw error;

      if (data) {
        setLancamentos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
      setLancamentos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadArtistas = async () => {
    try {
      const { data, error } = await supabase
        .from('artistas')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome', { ascending: true });

      if (error) throw error;

      if (data) {
        setArtistas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar artistas:', error);
    }
  };

  const loadProjetos = async () => {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .select('id, nome, artista_id')
        .order('nome', { ascending: true });

      if (error) throw error;

      if (data) {
        setProjetos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  };

  const filteredLancamentos = lancamentos.filter(lanc => {
    const matchesSearch = 
      (lanc.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lanc.artista?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lanc.projeto?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'todos' || (lanc.status || 'agendado') === filterStatus;
    const matchesPlatform = filterPlatform === 'todas' || (lanc.plataforma || '') === filterPlatform;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'agendado': 'bg-yellow-500/20 text-yellow-400',
      'publicado': 'bg-green-500/20 text-green-400',
      'cancelado': 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'agendado': 'Agendado',
      'publicado': 'Publicado',
      'cancelado': 'Cancelado',
    };
    return labels[status] || status;
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      'Spotify': 'ri-spotify-line',
      'YouTube': 'ri-youtube-line',
      'Apple Music': 'ri-apple-line',
      'Deezer': 'ri-music-line',
      'TikTok': 'ri-tiktok-line',
    };
    return icons[platform] || 'ri-music-line';
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch {
      return date;
    }
  };

  const formatStreams = (streams: string | number | null) => {
    if (!streams) return '-';
    if (typeof streams === 'number') {
      if (streams >= 1000000) return `${(streams / 1000000).toFixed(1)}M`;
      if (streams >= 1000) return `${(streams / 1000).toFixed(1)}K`;
      return streams.toString();
    }
    return streams;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validar campos obrigatórios
      if (!formData.titulo.trim()) {
        alert('Por favor, preencha o título.');
        return;
      }
      if (!formData.plataforma) {
        alert('Por favor, selecione a plataforma.');
        return;
      }
      if (!formData.data_planejada) {
        alert('Por favor, selecione a data planejada.');
        return;
      }

      const lancamentoData: any = {
        titulo: formData.titulo.trim(),
        plataforma: formData.plataforma,
        data_planejada: formData.data_planejada,
        status: formData.status || 'agendado',
      };

      if (formData.artista_id) lancamentoData.artista_id = formData.artista_id;
      if (formData.projeto_id) lancamentoData.projeto_id = formData.projeto_id;
      if (formData.tipo) lancamentoData.tipo = formData.tipo;
      if (formData.data_real && formData.data_real.trim()) {
        lancamentoData.data_real = formData.data_real;
      }
      if (formData.url && formData.url.trim()) {
        lancamentoData.url = formData.url.trim();
      }
      if (formData.streams && formData.streams.trim()) {
        const streamsNum = parseFloat(formData.streams.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(streamsNum) && streamsNum > 0) {
          lancamentoData.streams = streamsNum;
        }
      }
      if (formData.observacoes && formData.observacoes.trim()) {
        lancamentoData.observacoes = formData.observacoes.trim();
      }

      console.log('Dados a serem inseridos:', lancamentoData);

      const { error, data } = await supabase
        .from('lancamentos')
        .insert([lancamentoData])
        .select();

      if (error) {
        console.error('Erro detalhado:', error);
        console.error('Código do erro:', error.code);
        console.error('Mensagem:', error.message);
        console.error('Detalhes:', error.details);
        console.error('Hint:', error.hint);
        throw error;
      }

      console.log('Lançamento criado com sucesso:', data);

      await loadLancamentos();
      
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Erro ao criar lançamento:', error);
      alert(`Erro ao criar lançamento: ${error.message || 'Verifique o console para mais detalhes.'}`);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLancamento) return;

    try {
      // Validar campos obrigatórios
      if (!formData.titulo.trim()) {
        alert('Por favor, preencha o título.');
        return;
      }
      if (!formData.plataforma) {
        alert('Por favor, selecione a plataforma.');
        return;
      }
      if (!formData.data_planejada) {
        alert('Por favor, selecione a data planejada.');
        return;
      }

      const updateData: any = {
        titulo: formData.titulo.trim(),
        plataforma: formData.plataforma,
        data_planejada: formData.data_planejada,
        status: formData.status || 'agendado',
      };

      if (formData.artista_id) updateData.artista_id = formData.artista_id;
      if (formData.projeto_id) updateData.projeto_id = formData.projeto_id;
      if (formData.tipo) updateData.tipo = formData.tipo;
      if (formData.data_real && formData.data_real.trim()) {
        updateData.data_real = formData.data_real;
      } else {
        // Se a data real foi removida, definir como null
        updateData.data_real = null;
      }
      if (formData.url && formData.url.trim()) {
        updateData.url = formData.url.trim();
      } else {
        updateData.url = null;
      }
      if (formData.streams && formData.streams.trim()) {
        const streamsNum = parseFloat(formData.streams.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(streamsNum) && streamsNum > 0) {
          updateData.streams = streamsNum;
        } else {
          updateData.streams = null;
        }
      } else {
        updateData.streams = null;
      }
      if (formData.observacoes && formData.observacoes.trim()) {
        updateData.observacoes = formData.observacoes.trim();
      } else {
        updateData.observacoes = null;
      }

      console.log('Dados a serem atualizados:', updateData);

      const { error, data } = await supabase
        .from('lancamentos')
        .update(updateData)
        .eq('id', editingLancamento.id)
        .select();

      if (error) {
        console.error('Erro detalhado ao atualizar:', error);
        console.error('Código do erro:', error.code);
        console.error('Mensagem:', error.message);
        console.error('Detalhes:', error.details);
        console.error('Hint:', error.hint);
        throw error;
      }

      console.log('Lançamento atualizado com sucesso:', data);

      await loadLancamentos();
      
      setShowEditModal(false);
      setEditingLancamento(null);
      resetForm();
    } catch (error: any) {
      console.error('Erro ao atualizar lançamento:', error);
      alert(`Erro ao atualizar lançamento: ${error.message || 'Verifique o console para mais detalhes.'}`);
    }
  };

  const handleMarcarComoPublicado = async (lanc: any) => {
    try {
      const updateData: any = {
        status: 'publicado',
      };

      if (!lanc.data_real) {
        updateData.data_real = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('lancamentos')
        .update(updateData)
        .eq('id', lanc.id);

      if (error) throw error;

      await loadLancamentos();
    } catch (error: any) {
      console.error('Erro ao marcar como publicado:', error);
      alert(`Erro ao marcar como publicado: ${error.message || 'Verifique o console para mais detalhes.'}`);
    }
  };

  const handleCancelar = async (lanc: any) => {
    if (!confirm('Tem certeza que deseja cancelar este lançamento?')) return;

    try {
      const { error } = await supabase
        .from('lancamentos')
        .update({ status: 'cancelado' })
        .eq('id', lanc.id);

      if (error) throw error;

      await loadLancamentos();
    } catch (error: any) {
      console.error('Erro ao cancelar lançamento:', error);
      alert(`Erro ao cancelar lançamento: ${error.message || 'Verifique o console para mais detalhes.'}`);
    }
  };

  const handleVisualizar = (lanc: any) => {
    setSelectedLancamento(lanc);
    setShowViewModal(true);
  };

  const handleEditar = (lanc: any) => {
    setEditingLancamento(lanc);
    setFormData({
      titulo: lanc.titulo || '',
      artista_id: lanc.artista_id || '',
      projeto_id: lanc.projeto_id || '',
      tipo: lanc.tipo || '',
      plataforma: lanc.plataforma || '',
      data_planejada: lanc.data_planejada || '',
      data_real: lanc.data_real || '',
      status: lanc.status || 'agendado',
      url: lanc.url || '',
      streams: lanc.streams ? lanc.streams.toString() : '',
      observacoes: lanc.observacoes || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      artista_id: '',
      projeto_id: '',
      tipo: '',
      plataforma: '',
      data_planejada: '',
      data_real: '',
      status: 'agendado',
      url: '',
      streams: '',
      observacoes: '',
    });
  };

  const stats = [
    { 
      label: 'Total de Lançamentos', 
      value: lancamentos.length, 
      icon: 'ri-rocket-line', 
      color: 'from-primary-teal to-primary-brown' 
    },
    { 
      label: 'Agendados', 
      value: lancamentos.filter(l => (l.status || 'agendado') === 'agendado').length, 
      icon: 'ri-calendar-line', 
      color: 'from-yellow-500 to-yellow-700' 
    },
    { 
      label: 'Publicados', 
      value: lancamentos.filter(l => (l.status || '') === 'publicado').length, 
      icon: 'ri-checkbox-circle-line', 
      color: 'from-green-500 to-green-700' 
    },
    { 
      label: 'Total de Streams', 
      value: formatStreams(
        lancamentos
          .filter(l => l.streams)
          .reduce((acc, l) => {
            const streams = typeof l.streams === 'number' ? l.streams : parseFloat(l.streams) || 0;
            return acc + streams;
          }, 0)
      ), 
      icon: 'ri-bar-chart-line', 
      color: 'from-blue-500 to-blue-700' 
    },
  ];

  const platforms = ['Spotify', 'YouTube', 'Apple Music', 'Deezer', 'TikTok'];
  const tipos = ['Single', 'EP', 'Álbum', 'Clipe', 'Remix', 'Cover', 'Outro'];

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Lançamentos</h1>
            <p className="text-gray-400">Controle completo de lançamentos musicais</p>
          </div>
          <button 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-add-line text-xl"></i>
            Novo Lançamento
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-dark-card border border-dark-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <i className={`${stat.icon} text-2xl text-white`}></i>
                </div>
                <span className="text-2xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="space-y-6">
            {/* Busca */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                <i className="ri-search-line inline-block mr-2"></i>
                Buscar
              </label>
              <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                <input
                  type="text"
                  placeholder="Buscar por título, artista ou projeto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                />
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-dark-border"></div>

            {/* Filtros por Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                <i className="ri-filter-line inline-block mr-2"></i>
                Filtrar por Status
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterStatus('todos')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap min-w-[100px] text-center ${
                    filterStatus === 'todos'
                      ? 'bg-gradient-primary text-white shadow-lg shadow-primary-teal/20'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover border border-dark-border hover:border-primary-teal/50'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterStatus('agendado')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap min-w-[100px] text-center ${
                    filterStatus === 'agendado'
                      ? 'bg-gradient-primary text-white shadow-lg shadow-primary-teal/20'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover border border-dark-border hover:border-primary-teal/50'
                  }`}
                >
                  Agendados
                </button>
                <button
                  onClick={() => setFilterStatus('publicado')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap min-w-[100px] text-center ${
                    filterStatus === 'publicado'
                      ? 'bg-gradient-primary text-white shadow-lg shadow-primary-teal/20'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover border border-dark-border hover:border-primary-teal/50'
                  }`}
                >
                  Publicados
                </button>
                <button
                  onClick={() => setFilterStatus('cancelado')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap min-w-[100px] text-center ${
                    filterStatus === 'cancelado'
                      ? 'bg-gradient-primary text-white shadow-lg shadow-primary-teal/20'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover border border-dark-border hover:border-primary-teal/50'
                  }`}
                >
                  Cancelados
                </button>
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-dark-border"></div>

            {/* Filtros por Plataforma */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                <i className="ri-apps-line inline-block mr-2"></i>
                Filtrar por Plataforma
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterPlatform('todas')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap min-w-[100px] text-center ${
                    filterPlatform === 'todas'
                      ? 'bg-gradient-primary text-white shadow-lg shadow-primary-teal/20'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover border border-dark-border hover:border-primary-teal/50'
                  }`}
                >
                  Todas
                </button>
                {platforms.map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setFilterPlatform(platform as FilterPlatform)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap min-w-[100px] text-center ${
                      filterPlatform === platform
                        ? 'bg-gradient-primary text-white shadow-lg shadow-primary-teal/20'
                        : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover border border-dark-border hover:border-primary-teal/50'
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lançamentos Table */}
        {loading ? (
          <div className="text-center py-12">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
            <p className="text-gray-400 mt-4">Carregando lançamentos...</p>
          </div>
        ) : (
          <>
            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-bg border-b border-dark-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Título</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Artista</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plataforma</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data Planejada</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Streams</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {filteredLancamentos.map((lanc) => (
                      <tr key={lanc.id} className="hover:bg-dark-hover transition-smooth">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{lanc.titulo || '-'}</div>
                          {lanc.tipo && (
                            <div className="text-xs text-gray-400">{lanc.tipo}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{lanc.artista?.nome || '-'}</div>
                          {lanc.projeto?.nome && (
                            <div className="text-xs text-gray-400">{lanc.projeto.nome}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <i className={`${getPlatformIcon(lanc.plataforma)} text-lg text-primary-teal`}></i>
                            <span className="text-sm text-white">{lanc.plataforma || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{formatDate(lanc.data_planejada)}</div>
                          {lanc.data_real && (
                            <div className="text-xs text-gray-400">Real: {formatDate(lanc.data_real)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lanc.status || 'agendado')}`}>
                            {getStatusLabel(lanc.status || 'agendado')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-primary-teal font-semibold">
                            {formatStreams(lanc.streams)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleVisualizar(lanc)}
                              className="p-2 hover:bg-primary-teal/20 text-primary-teal rounded-lg transition-smooth cursor-pointer"
                              title="Visualizar"
                            >
                              <i className="ri-eye-line text-lg"></i>
                            </button>
                            <button
                              onClick={() => handleEditar(lanc)}
                              className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-smooth cursor-pointer"
                              title="Editar"
                            >
                              <i className="ri-edit-line text-lg"></i>
                            </button>
                            {(lanc.status || 'agendado') === 'agendado' && isAdmin && (
                              <button
                                onClick={() => handleMarcarComoPublicado(lanc)}
                                className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-smooth cursor-pointer"
                                title="Marcar como publicado"
                              >
                                <i className="ri-check-line text-lg"></i>
                              </button>
                            )}
                            {(lanc.status || 'agendado') !== 'cancelado' && isAdmin && (
                              <button
                                onClick={() => handleCancelar(lanc)}
                                className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-smooth cursor-pointer"
                                title="Cancelar"
                              >
                                <i className="ri-close-line text-lg"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredLancamentos.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-rocket-line text-6xl text-gray-600 mb-4"></i>
                <p className="text-gray-400">Nenhum lançamento encontrado</p>
              </div>
            )}
          </>
        )}

        {/* Modal Novo Lançamento */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Novo Lançamento</h2>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Título *</label>
                      <input
                        type="text"
                        required
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: Single - Verão 2024"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
                      <select
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="">Selecione o tipo</option>
                        {tipos.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Artista</label>
                      <select
                        value={formData.artista_id}
                        onChange={(e) => setFormData({ ...formData, artista_id: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="">Selecione o artista</option>
                        {artistas.map(artista => (
                          <option key={artista.id} value={artista.id}>{artista.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Projeto</label>
                      <select
                        value={formData.projeto_id}
                        onChange={(e) => setFormData({ ...formData, projeto_id: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="">Selecione o projeto</option>
                        {projetos.map(projeto => (
                          <option key={projeto.id} value={projeto.id}>{projeto.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Plataforma *</label>
                      <select
                        required
                        value={formData.plataforma}
                        onChange={(e) => setFormData({ ...formData, plataforma: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="">Selecione a plataforma</option>
                        {platforms.map(platform => (
                          <option key={platform} value={platform}>{platform}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="agendado">Agendado</option>
                        <option value="publicado">Publicado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Data Planejada *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.data_planejada}
                        onChange={(e) => setFormData({ ...formData, data_planejada: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        max="2099-12-31"
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth [color-scheme:dark]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Data Real
                      </label>
                      <input
                        type="date"
                        value={formData.data_real || ''}
                        onChange={(e) => setFormData({ ...formData, data_real: e.target.value })}
                        min={formData.data_planejada || new Date().toISOString().split('T')[0]}
                        max="2099-12-31"
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Informações Adicionais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">URL</label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Streams</label>
                      <input
                        type="text"
                        value={formData.streams}
                        onChange={(e) => setFormData({ ...formData, streams: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: 125.4K ou 125400"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Observações</label>
                      <textarea
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                        placeholder="Observações sobre o lançamento..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Criar Lançamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Visualizar Lançamento */}
        {showViewModal && selectedLancamento && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Detalhes do Lançamento</h2>
                <button 
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedLancamento(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Título</label>
                    <p className="text-white">{selectedLancamento.titulo || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
                    <p className="text-white">{selectedLancamento.tipo || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Artista</label>
                    <p className="text-white">{selectedLancamento.artista?.nome || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Projeto</label>
                    <p className="text-white">{selectedLancamento.projeto?.nome || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Plataforma</label>
                    <div className="flex items-center gap-2">
                      <i className={`${getPlatformIcon(selectedLancamento.plataforma)} text-lg text-primary-teal`}></i>
                      <p className="text-white">{selectedLancamento.plataforma || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLancamento.status || 'agendado')}`}>
                      {getStatusLabel(selectedLancamento.status || 'agendado')}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Data Planejada</label>
                    <p className="text-white">{formatDate(selectedLancamento.data_planejada)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Data Real</label>
                    <p className="text-white">{formatDate(selectedLancamento.data_real)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Streams</label>
                    <p className="text-primary-teal font-semibold">{formatStreams(selectedLancamento.streams)}</p>
                  </div>
                  {selectedLancamento.url && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">URL</label>
                      <a 
                        href={selectedLancamento.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-teal hover:underline break-all"
                      >
                        {selectedLancamento.url}
                      </a>
                    </div>
                  )}
                  {selectedLancamento.observacoes && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Observações</label>
                      <p className="text-white whitespace-pre-wrap">{selectedLancamento.observacoes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-dark-border">
                <button
                  onClick={() => {
                    handleEditar(selectedLancamento);
                    setShowViewModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedLancamento(null);
                  }}
                  className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Lançamento */}
        {showEditModal && editingLancamento && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Editar Lançamento</h2>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingLancamento(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                {/* Informações Básicas */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Título *</label>
                      <input
                        type="text"
                        required
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: Single - Verão 2024"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
                      <select
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="">Selecione o tipo</option>
                        {tipos.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Artista</label>
                      <select
                        value={formData.artista_id}
                        onChange={(e) => setFormData({ ...formData, artista_id: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="">Selecione o artista</option>
                        {artistas.map(artista => (
                          <option key={artista.id} value={artista.id}>{artista.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Projeto</label>
                      <select
                        value={formData.projeto_id}
                        onChange={(e) => setFormData({ ...formData, projeto_id: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="">Selecione o projeto</option>
                        {projetos.map(projeto => (
                          <option key={projeto.id} value={projeto.id}>{projeto.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Plataforma *</label>
                      <select
                        required
                        value={formData.plataforma}
                        onChange={(e) => setFormData({ ...formData, plataforma: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="">Selecione a plataforma</option>
                        {platforms.map(platform => (
                          <option key={platform} value={platform}>{platform}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="agendado">Agendado</option>
                        <option value="publicado">Publicado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Data Planejada *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.data_planejada}
                        onChange={(e) => setFormData({ ...formData, data_planejada: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        max="2099-12-31"
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth [color-scheme:dark]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Data Real
                      </label>
                      <input
                        type="date"
                        value={formData.data_real || ''}
                        onChange={(e) => setFormData({ ...formData, data_real: e.target.value })}
                        min={formData.data_planejada || new Date().toISOString().split('T')[0]}
                        max="2099-12-31"
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Informações Adicionais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">URL</label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Streams</label>
                      <input
                        type="text"
                        value={formData.streams}
                        onChange={(e) => setFormData({ ...formData, streams: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: 125.4K ou 125400"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Observações</label>
                      <textarea
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                        placeholder="Observações sobre o lançamento..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingLancamento(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Salvar Alterações
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
