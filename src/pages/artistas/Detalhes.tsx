import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  updated_at?: string;
}

interface Projeto {
  id: string;
  nome: string;
  fase: string;
  progresso: number;
  prioridade: string;
  prazo?: string;
  created_at: string;
}

export default function ArtistaDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artista, setArtista] = useState<Artista | null>(null);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showObservacoesModal, setShowObservacoesModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    genero: '',
    status: 'ativo',
    contato_email: '',
    contato_telefone: '',
    observacoes_internas: ''
  });
  const [observacoesEdit, setObservacoesEdit] = useState('');

  useEffect(() => {
    if (id) {
      loadArtistaData();
    }
  }, [id]);

  const loadArtistaData = async () => {
    try {
      // Carregar dados do artista
      const { data: artistaData, error: artistaError } = await supabase
        .from('artistas')
        .select('*')
        .eq('id', id)
        .single();

      if (artistaError) throw artistaError;

      if (artistaData) {
        setArtista(artistaData);
        setFormData({
          nome: artistaData.nome || '',
          genero: artistaData.genero || '',
          status: artistaData.status || 'ativo',
          contato_email: artistaData.contato_email || '',
          contato_telefone: artistaData.contato_telefone || '',
          observacoes_internas: artistaData.observacoes_internas || ''
        });
        setObservacoesEdit(artistaData.observacoes_internas || '');
      }

      // Carregar projetos do artista
      const { data: projetosData, error: projetosError } = await supabase
        .from('projetos')
        .select('id, nome, fase, progresso, prioridade, prazo, created_at')
        .eq('artista_id', id)
        .order('created_at', { ascending: false });

      if (projetosError) throw projetosError;
      if (projetosData) setProjetos(projetosData);
    } catch (error) {
      console.error('Erro ao carregar dados do artista:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('artistas')
        .update({
          nome: formData.nome,
          genero: formData.genero,
          status: formData.status,
          contato_email: formData.contato_email,
          contato_telefone: formData.contato_telefone,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setEditMode(false);
      loadArtistaData();
    } catch (error) {
      console.error('Erro ao atualizar artista:', error);
      alert('Erro ao atualizar artista. Tente novamente.');
    }
  };

  const handleUpdateObservacoes = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('artistas')
        .update({
          observacoes_internas: observacoesEdit,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setShowObservacoesModal(false);
      loadArtistaData();
    } catch (error) {
      console.error('Erro ao atualizar observações:', error);
      alert('Erro ao atualizar observações. Tente novamente.');
    }
  };

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'ativo': 'bg-green-500/20 text-green-400 border-green-500/30',
      'em_producao': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'pausa': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'finalizado': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'ativo': 'Ativo',
      'em_producao': 'Em Produção',
      'pausa': 'Pausa',
      'finalizado': 'Finalizado',
    };
    return labels[status] || status;
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

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'alta': 'bg-red-500/20 text-red-400',
      'media': 'bg-yellow-500/20 text-yellow-400',
      'baixa': 'bg-green-500/20 text-green-400',
    };
    return colors[priority] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
            <p className="text-gray-400 mt-4">Carregando artista...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!artista) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-error-warning-line text-4xl text-red-400 mb-4"></i>
            <p className="text-gray-400 mb-4">Artista não encontrado</p>
            <button
              onClick={() => navigate('/artistas')}
              className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
            >
              Voltar para Artistas
            </button>
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
          <button
            onClick={() => navigate('/artistas')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-smooth cursor-pointer"
          >
            <i className="ri-arrow-left-line"></i>
            <span>Voltar para Artistas</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{getInitials(artista.nome)}</span>
              </div>
              <div>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="text-3xl font-bold text-white bg-dark-bg border border-dark-border rounded-lg px-4 py-2 mb-2 focus:outline-none focus:border-primary-teal transition-smooth"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-white mb-2">{artista.nome}</h1>
                )}
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1 rounded-full text-sm font-medium border ${getStatusColor(artista.status)}`}>
                    {getStatusLabel(artista.status)}
                  </span>
                  {editMode ? (
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="px-4 py-1 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="em_producao">Em Produção</option>
                      <option value="pausa">Pausa</option>
                      <option value="finalizado">Finalizado</option>
                    </select>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {editMode ? (
                <>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      loadArtistaData();
                    }}
                    className="px-4 py-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Salvar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
                >
                  <i className="ri-edit-line"></i>
                  Editar Artista
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Informações */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações de Contato */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Informações de Contato</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">E-mail</label>
                  {editMode ? (
                    <input
                      type="email"
                      value={formData.contato_email}
                      onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg">
                      <i className="ri-mail-line text-primary-teal"></i>
                      <span className="text-white">{artista.contato_email}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Telefone</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={formData.contato_telefone}
                      onChange={(e) => setFormData({ ...formData, contato_telefone: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="(00) 00000-0000"
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg">
                      <i className="ri-phone-line text-primary-teal"></i>
                      <span className="text-white">{artista.contato_telefone || 'Não informado'}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Gênero Musical</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.genero}
                      onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: Pop, Rock, Hip Hop"
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg">
                      <i className="ri-music-2-line text-primary-teal"></i>
                      <span className="text-white">{artista.genero}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Projetos Vinculados */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Projetos Vinculados</h2>
                <button
                  onClick={() => navigate('/projetos', { state: { artistaId: id } })}
                  className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer flex items-center gap-2"
                >
                  <i className="ri-add-line"></i>
                  Novo Projeto
                </button>
              </div>
              {projetos.length > 0 ? (
                <div className="space-y-4">
                  {projetos.map((projeto) => (
                    <div
                      key={projeto.id}
                      onClick={() => navigate(`/projetos/${projeto.id}`)}
                      className="p-4 bg-dark-bg rounded-lg hover:bg-dark-hover transition-smooth cursor-pointer border border-dark-border"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-white mb-1">{projeto.nome}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-1 bg-primary-teal/20 text-primary-teal text-xs rounded whitespace-nowrap">
                              {getPhaseLabel(projeto.fase)}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getPriorityColor(projeto.prioridade)}`}>
                              {projeto.prioridade.charAt(0).toUpperCase() + projeto.prioridade.slice(1)}
                            </span>
                          </div>
                        </div>
                        {projeto.prazo && (
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(projeto.prazo).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-dark-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-primary rounded-full transition-smooth"
                            style={{ width: `${projeto.progresso}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{projeto.progresso}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="ri-music-2-line text-4xl mb-2"></i>
                  <p className="text-sm mb-4">Nenhum projeto vinculado</p>
                  <button
                    onClick={() => navigate('/projetos', { state: { artistaId: id } })}
                    className="px-4 py-2 bg-gradient-primary text-white text-sm rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
                  >
                    Criar Primeiro Projeto
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita - Observações */}
          <div className="space-y-6">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Observações Internas</h2>
                <button
                  onClick={() => {
                    setObservacoesEdit(artista.observacoes_internas || '');
                    setShowObservacoesModal(true);
                  }}
                  className="text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer"
                >
                  <i className="ri-edit-line text-lg"></i>
                </button>
              </div>
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4 min-h-[200px]">
                {artista.observacoes_internas ? (
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{artista.observacoes_internas}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">Nenhuma observação cadastrada</p>
                )}
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Informações Adicionais</h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Cadastrado em:</span>
                  <span className="text-white">{new Date(artista.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                {artista.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Última atualização:</span>
                    <span className="text-white">{new Date(artista.updated_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Total de projetos:</span>
                  <span className="text-white font-semibold">{projetos.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Observações */}
        {showObservacoesModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Editar Observações Internas</h2>
                <button
                  onClick={() => setShowObservacoesModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              <textarea
                value={observacoesEdit}
                onChange={(e) => setObservacoesEdit(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none mb-6"
                placeholder="Adicione observações internas sobre o artista..."
                rows={10}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowObservacoesModal(false)}
                  className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateObservacoes}
                  className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                >
                  Salvar Observações
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

