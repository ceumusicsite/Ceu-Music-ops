import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';

export default function Lancamentos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    platform: '',
    plannedDate: '',
  });

  useEffect(() => {
    loadLancamentos();
  }, []);

  const loadLancamentos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .order('planned_date', { ascending: false });

      if (error) throw error;

      if (data) {
        setLancamentos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
      // Se a tabela não existir, usar dados mockados
      setLancamentos([
        { 
          id: 1, 
          title: 'Single - Verão 2024', 
          artist: 'Artista A', 
          platform: 'Spotify',
          plannedDate: '2024-02-01',
          actualDate: '2024-02-01',
          status: 'publicado',
          url: 'https://open.spotify.com/track/example',
          streams: '125.4K'
        },
        { 
          id: 2, 
          title: 'EP Acústico', 
          artist: 'Artista B', 
          platform: 'YouTube',
          plannedDate: '2024-02-15',
          actualDate: null,
          status: 'agendado',
          url: null,
          streams: null
        },
        { 
          id: 3, 
          title: 'Clipe Oficial', 
          artist: 'Artista C', 
          platform: 'YouTube',
          plannedDate: '2024-02-10',
          actualDate: '2024-02-10',
          status: 'publicado',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          streams: '89.2K'
        },
        { 
          id: 4, 
          title: 'Álbum Completo 2024', 
          artist: 'Artista D', 
          platform: 'Apple Music',
          plannedDate: '2024-03-01',
          actualDate: null,
          status: 'agendado',
          url: null,
          streams: null
        },
        { 
          id: 5, 
          title: 'Remix Oficial', 
          artist: 'Artista E', 
          platform: 'Spotify',
          plannedDate: '2024-02-25',
          actualDate: null,
          status: 'agendado',
          url: null,
          streams: null
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const lancamentosMock = [
    { 
      id: 1, 
      title: 'Single - Verão 2024', 
      artist: 'Artista A', 
      platform: 'Spotify',
      plannedDate: '2024-02-01',
      actualDate: '2024-02-01',
      status: 'publicado',
      url: 'https://open.spotify.com/track/example',
      streams: '125.4K'
    },
    { 
      id: 2, 
      title: 'EP Acústico', 
      artist: 'Artista B', 
      platform: 'YouTube',
      plannedDate: '2024-02-15',
      actualDate: null,
      status: 'agendado',
      url: null,
      streams: null
    },
    { 
      id: 3, 
      title: 'Clipe Oficial', 
      artist: 'Artista C', 
      platform: 'YouTube',
      plannedDate: '2024-02-10',
      actualDate: '2024-02-10',
      status: 'publicado',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      streams: '89.2K'
    },
    { 
      id: 4, 
      title: 'Álbum Completo 2024', 
      artist: 'Artista D', 
      platform: 'Apple Music',
      plannedDate: '2024-03-01',
      actualDate: null,
      status: 'agendado',
      url: null,
      streams: null
    },
    { 
      id: 5, 
      title: 'Remix Oficial', 
      artist: 'Artista E', 
      platform: 'Spotify',
      plannedDate: '2024-02-25',
      actualDate: null,
      status: 'agendado',
      url: null,
      streams: null
    },
  ];

  const lancamentosToDisplay = lancamentos.length > 0 ? lancamentos : lancamentosMock;

  const platforms = ['Spotify', 'YouTube', 'Apple Music', 'Deezer', 'TikTok'];

  const filteredLancamentos = lancamentosToDisplay.filter(lanc => {
    const matchesSearch = lanc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lanc.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = filterPlatform === 'todas' || lanc.platform === filterPlatform;
    return matchesSearch && matchesPlatform;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const lancamentoData = {
        titulo: formData.title,
        artista: formData.artist,
        plataforma: formData.platform,
        data_planejada: formData.plannedDate,
        status: 'agendado',
      };

      const { error } = await supabase
        .from('lancamentos')
        .insert([lancamentoData]);

      if (error) throw error;

      await loadLancamentos();
      
      setShowModal(false);
      setFormData({
        title: '',
        artist: '',
        platform: '',
        plannedDate: '',
      });
    } catch (error: any) {
      console.error('Erro ao criar lançamento:', error);
      alert('Erro ao criar lançamento. Verifique o console para mais detalhes.');
    }
  };

  const stats = [
    { label: 'Lançamentos Este Mês', value: '12', icon: 'ri-rocket-line', color: 'from-primary-teal to-primary-brown' },
    { label: 'Agendados', value: lancamentosToDisplay.filter(l => (l.status === 'agendado' || l.status === 'Agendado')).length, icon: 'ri-calendar-line', color: 'from-yellow-500 to-yellow-700' },
    { label: 'Total de Streams', value: '214.6K', icon: 'ri-bar-chart-line', color: 'from-green-500 to-green-700' },
  ];

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Lançamentos</h1>
            <p className="text-gray-400">Controle de lançamentos por plataforma</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-add-line text-xl"></i>
            Novo Lançamento
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="text"
                placeholder="Buscar lançamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setFilterPlatform('todas')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer whitespace-nowrap ${
                  filterPlatform === 'todas'
                    ? 'bg-gradient-primary text-white'
                    : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover'
                }`}
              >
                Todas
              </button>
              {platforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() => setFilterPlatform(platform)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer whitespace-nowrap ${
                    filterPlatform === platform
                      ? 'bg-gradient-primary text-white'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lançamentos Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredLancamentos.map((lanc) => (
            <div key={lanc.id} className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-primary-teal transition-smooth">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <i className={`${getPlatformIcon(lanc.platform)} text-2xl text-white`}></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{lanc.title}</h3>
                    <p className="text-sm text-gray-400">{lanc.artist}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(lanc.status)}`}>
                  {getStatusLabel(lanc.status)}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Plataforma:</span>
                  <span className="text-white font-medium">{lanc.platform}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Data Planejada:</span>
                  <span className="text-white">{lanc.plannedDate}</span>
                </div>
                {lanc.actualDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Data Real:</span>
                    <span className="text-white">{lanc.actualDate}</span>
                  </div>
                )}
                {lanc.streams && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Streams:</span>
                    <span className="text-primary-teal font-semibold">{lanc.streams}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {lanc.url && (
                  <a 
                    href={lanc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-gradient-primary text-white text-sm text-center rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Abrir Link
                  </a>
                )}
                <button className="px-4 py-2 bg-dark-bg hover:bg-dark-hover text-white text-sm rounded-lg transition-smooth cursor-pointer whitespace-nowrap">
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredLancamentos.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-rocket-line text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhum lançamento encontrado</p>
          </div>
        )}

        {/* Modal Novo Lançamento */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Novo Lançamento</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Título</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Single - Verão 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Artista</label>
                  <input
                    type="text"
                    required
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Nome do artista"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Plataforma</label>
                  <select
                    required
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="">Selecione a plataforma</option>
                    <option value="Spotify">Spotify</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Apple Music">Apple Music</option>
                    <option value="Deezer">Deezer</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Data Planejada</label>
                  <input
                    type="date"
                    required
                    value={formData.plannedDate}
                    onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
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
                    Criar Lançamento
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