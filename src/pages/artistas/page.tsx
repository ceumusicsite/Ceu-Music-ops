import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';

interface Artista {
  id: string;
  nome: string;
  genero: string;
  status: string;
  contato_email: string;
  contato_telefone?: string;
  observacoes_internas?: string;
  created_at: string;
}

export default function Artistas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    genero: '',
    status: 'ativo',
    contato_email: '',
    contato_telefone: '',
    observacoes_internas: ''
  });

  useEffect(() => {
    loadArtistas();
  }, []);

  const loadArtistas = async () => {
    try {
      const { data, error } = await supabase
        .from('artistas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArtistas(data || []);
    } catch (error) {
      console.error('Erro ao carregar artistas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('artistas')
        .insert([formData]);

      if (error) throw error;

      setShowModal(false);
      setFormData({
        nome: '',
        genero: '',
        status: 'ativo',
        contato_email: '',
        contato_telefone: '',
        observacoes_internas: ''
      });
      loadArtistas();
    } catch (error) {
      console.error('Erro ao criar artista:', error);
      alert('Erro ao criar artista. Tente novamente.');
    }
  };

  const filteredArtistas = artistas.filter(artista => {
    const matchesSearch = artista.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artista.genero.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || artista.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
            <p className="text-gray-400 mt-4">Carregando artistas...</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Artistas</h1>
            <p className="text-gray-400">Gerencie todos os artistas da gravadora</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-add-line text-xl"></i>
            Novo Artista
          </button>
        </div>

        {/* Filters */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="text"
                placeholder="Buscar por nome ou gênero..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['todos', 'ativo', 'em_producao', 'pausa', 'finalizado'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-gradient-primary text-white'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  {status === 'todos' ? 'Todos' : 
                   status === 'em_producao' ? 'Em Produção' :
                   status === 'pausa' ? 'Pausa' :
                   status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Artists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtistas.map((artista) => (
            <div key={artista.id} className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-primary-teal transition-smooth cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{getInitials(artista.nome)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{artista.nome}</h3>
                    <p className="text-sm text-gray-400">{artista.genero}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  artista.status === 'ativo' 
                    ? 'bg-green-500/20 text-green-400' 
                    : artista.status === 'em_producao'
                    ? 'bg-blue-500/20 text-blue-400'
                    : artista.status === 'pausa'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : artista.status === 'finalizado'
                    ? 'bg-gray-500/20 text-gray-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {artista.status === 'em_producao' ? 'Em Produção' :
                   artista.status === 'pausa' ? 'Pausa' :
                   artista.status === 'finalizado' ? 'Finalizado' :
                   artista.status.charAt(0).toUpperCase() + artista.status.slice(1)}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <i className="ri-mail-line text-primary-teal"></i>
                  <span className="truncate">{artista.contato_email}</span>
                </div>
                {artista.contato_telefone && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <i className="ri-phone-line text-primary-teal"></i>
                    <span>{artista.contato_telefone}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(`/artistas/${artista.id}`)}
                  className="flex-1 px-4 py-2 bg-dark-bg hover:bg-dark-hover text-white text-sm rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                >
                  Ver Detalhes
                </button>
                <button className="px-4 py-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer">
                  <i className="ri-more-2-fill"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredArtistas.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-user-star-line text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhum artista encontrado</p>
          </div>
        )}

        {/* Modal Novo Artista */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Novo Artista</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Nome do Artista</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Digite o nome do artista"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Gênero Musical</label>
                  <input
                    type="text"
                    required
                    value={formData.genero}
                    onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Pop, Rock, Hip Hop"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">E-mail</label>
                  <input
                    type="email"
                    required
                    value={formData.contato_email}
                    onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="artista@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Telefone (opcional)</label>
                  <input
                    type="tel"
                    value={formData.contato_telefone}
                    onChange={(e) => setFormData({ ...formData, contato_telefone: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="em_producao">Em Produção</option>
                    <option value="pausa">Pausa</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Observações Internas (opcional)</label>
                  <textarea
                    value={formData.observacoes_internas}
                    onChange={(e) => setFormData({ ...formData, observacoes_internas: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Observações internas sobre o artista..."
                    rows={4}
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
                    Criar Artista
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