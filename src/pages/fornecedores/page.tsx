import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { fornecedoresMock, type Fornecedor, type ServicoFornecedor } from '../../data/fornecedores-mock';
import { supabase } from '../../lib/supabase';

export default function FornecedoresPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [fornecedorToDelete, setFornecedorToDelete] = useState<Fornecedor | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'servico' as 'estudio' | 'equipamento' | 'servico' | 'outro',
    tipo_servico: '',
    status: 'ativo' as 'ativo' | 'inativo' | 'suspenso',
    contato_email: '',
    contato_telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cnpj: '',
    responsavel: '',
    website: '',
    observacoes: ''
  });
  const [servicos, setServicos] = useState<ServicoFornecedor[]>([]);
  const [novoServico, setNovoServico] = useState({ nome: '', descricao: '', preco_base: '' });

  useEffect(() => {
    loadFornecedores();
  }, []);

  const parseJsonField = (value: any, defaultValue: any = []): any => {
    if (!value) return defaultValue;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  };

  const loadFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Se a tabela não existir, usar dados mock
        console.warn('Tabela fornecedores não encontrada, usando dados mock:', error);
        setFornecedores(fornecedoresMock);
      } else {
        // Converter dados do banco para o formato Fornecedor
        const fornecedoresFormatados: Fornecedor[] = (data || []).map((f: any) => ({
          id: f.id,
          nome: f.nome,
          categoria: f.categoria,
          tipo_servico: f.tipo_servico,
          status: f.status,
          contato_email: f.contato_email,
          contato_telefone: f.contato_telefone || undefined,
          endereco: f.endereco || undefined,
          cidade: f.cidade || undefined,
          estado: f.estado || undefined,
          cnpj: f.cnpj || undefined,
          responsavel: f.responsavel || undefined,
          website: f.website || undefined,
          observacoes: f.observacoes || undefined,
          projetos_utilizados: f.projetos_utilizados || 0,
          avaliacao: f.avaliacao ? parseFloat(f.avaliacao) : undefined,
          servicos: parseJsonField(f.servicos, []),
          created_at: f.created_at || new Date().toISOString()
        }));
        setFornecedores(fornecedoresFormatados);
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      // Em caso de erro, usar dados mock
      setFornecedores(fornecedoresMock);
    } finally {
      setLoading(false);
    }
  };

  const filteredFornecedores = fornecedores.filter(fornecedor => {
    const matchesSearch = 
      fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fornecedor.tipo_servico.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fornecedor.cidade?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria === 'todos' || fornecedor.categoria === filterCategoria;
    return matchesSearch && matchesCategoria;
  });

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ativo': return 'bg-green-500/20 text-green-400';
      case 'inativo': return 'bg-gray-500/20 text-gray-400';
      case 'suspenso': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'ativo': return 'Ativo';
      case 'inativo': return 'Inativo';
      case 'suspenso': return 'Suspenso';
      default: return status;
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    switch(categoria) {
      case 'estudio': return 'Estúdio';
      case 'equipamento': return 'Equipamento';
      case 'servico': return 'Serviço';
      case 'outro': return 'Outro';
      default: return categoria;
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch(categoria) {
      case 'estudio': return 'ri-mic-line';
      case 'equipamento': return 'ri-settings-3-line';
      case 'servico': return 'ri-service-line';
      case 'outro': return 'ri-store-line';
      default: return 'ri-store-line';
    }
  };

  const handleAddServico = () => {
    if (novoServico.nome.trim()) {
      const servico: ServicoFornecedor = {
        id: Date.now().toString(),
        nome: novoServico.nome,
        descricao: novoServico.descricao || undefined,
        preco_base: novoServico.preco_base ? parseFloat(novoServico.preco_base) : undefined
      };
      setServicos([...servicos, servico]);
      setNovoServico({ nome: '', descricao: '', preco_base: '' });
    }
  };

  const handleRemoveServico = (id: string) => {
    setServicos(servicos.filter(s => s.id !== id));
  };

  const handleEditClick = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setFormData({
      nome: fornecedor.nome,
      categoria: fornecedor.categoria,
      tipo_servico: fornecedor.tipo_servico,
      status: fornecedor.status,
      contato_email: fornecedor.contato_email,
      contato_telefone: fornecedor.contato_telefone || '',
      endereco: fornecedor.endereco || '',
      cidade: fornecedor.cidade || '',
      estado: fornecedor.estado || '',
      cnpj: fornecedor.cnpj || '',
      responsavel: fornecedor.responsavel || '',
      website: fornecedor.website || '',
      observacoes: fornecedor.observacoes || ''
    });
    setServicos(fornecedor.servicos || []);
    setShowModal(true);
    setShowActionsMenu(null);
  };

  const handleDeleteClick = (fornecedor: Fornecedor) => {
    setFornecedorToDelete(fornecedor);
    setShowDeleteConfirm(true);
    setShowActionsMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!fornecedorToDelete) return;

    try {
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', fornecedorToDelete.id);

      if (error) throw error;

      setShowDeleteConfirm(false);
      setFornecedorToDelete(null);
      loadFornecedores();
    } catch (error) {
      console.error('Erro ao deletar fornecedor:', error);
      // Se der erro (tabela não existe), remover apenas do estado local
      setFornecedores(fornecedores.filter(f => f.id !== fornecedorToDelete.id));
      setShowDeleteConfirm(false);
      setFornecedorToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setFornecedorToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fornecedorData = {
        nome: formData.nome,
        categoria: formData.categoria,
        tipo_servico: formData.tipo_servico,
        status: formData.status,
        contato_email: formData.contato_email,
        contato_telefone: formData.contato_telefone || null,
        endereco: formData.endereco || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        cnpj: formData.cnpj || null,
        responsavel: formData.responsavel || null,
        website: formData.website || null,
        observacoes: formData.observacoes || null,
        servicos: servicos.length > 0 ? JSON.stringify(servicos) : null
      };

      if (editingFornecedor) {
        // Editar fornecedor existente
        const { error } = await supabase
          .from('fornecedores')
          .update(fornecedorData)
          .eq('id', editingFornecedor.id);

        if (error) throw error;
      } else {
        // Criar novo fornecedor
        const { error } = await supabase
          .from('fornecedores')
          .insert([fornecedorData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingFornecedor(null);
      setFormData({
        nome: '',
        categoria: 'servico',
        tipo_servico: '',
        status: 'ativo',
        contato_email: '',
        contato_telefone: '',
        endereco: '',
        cidade: '',
        estado: '',
        cnpj: '',
        responsavel: '',
        website: '',
        observacoes: ''
      });
      setServicos([]);
      setNovoServico({ nome: '', descricao: '', preco_base: '' });
      loadFornecedores();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      // Se der erro (tabela não existe), atualizar apenas o estado local
      if (editingFornecedor) {
        const fornecedorAtualizado: Fornecedor = {
          ...editingFornecedor,
          ...formData,
          servicos: servicos.length > 0 ? servicos : undefined
        };
        setFornecedores(fornecedores.map(f => 
          f.id === editingFornecedor.id ? fornecedorAtualizado : f
        ));
      } else {
        const novoFornecedor: Fornecedor = {
          id: Date.now().toString(),
          ...formData,
          servicos: servicos.length > 0 ? servicos : undefined,
          projetos_utilizados: 0,
          avaliacao: undefined,
          created_at: new Date().toISOString()
        };
        setFornecedores([...fornecedores, novoFornecedor]);
      }
      setShowModal(false);
      setEditingFornecedor(null);
      setFormData({
        nome: '',
        categoria: 'servico',
        tipo_servico: '',
        status: 'ativo',
        contato_email: '',
        contato_telefone: '',
        endereco: '',
        cidade: '',
        estado: '',
        cnpj: '',
        responsavel: '',
        website: '',
        observacoes: ''
      });
      setServicos([]);
      setNovoServico({ nome: '', descricao: '', preco_base: '' });
      alert('Erro ao salvar fornecedor. Os dados foram salvos apenas localmente.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFornecedor(null);
    setFormData({
      nome: '',
      categoria: 'servico',
      tipo_servico: '',
      status: 'ativo',
      contato_email: '',
      contato_telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      cnpj: '',
      responsavel: '',
      website: '',
      observacoes: ''
    });
    setServicos([]);
    setNovoServico({ nome: '', descricao: '', preco_base: '' });
  };

  const handleNewFornecedor = () => {
    setEditingFornecedor(null);
    setFormData({
      nome: '',
      categoria: 'servico',
      tipo_servico: '',
      status: 'ativo',
      contato_email: '',
      contato_telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      cnpj: '',
      responsavel: '',
      website: '',
      observacoes: ''
    });
    setServicos([]);
    setNovoServico({ nome: '', descricao: '', preco_base: '' });
    setShowModal(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
            <p className="text-gray-400 mt-4">Carregando fornecedores...</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Fornecedores</h1>
            <p className="text-gray-400">Gerencie os fornecedores da gravadora</p>
          </div>
          <button 
            onClick={handleNewFornecedor}
            className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-add-line text-xl"></i>
            Novo Fornecedor
          </button>
        </div>

        {/* Filters */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="text"
                placeholder="Buscar por nome, categoria ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['todos', 'estudio', 'equipamento', 'servico', 'outro'].map((categoria) => (
                <button
                  key={categoria}
                  onClick={() => setFilterCategoria(categoria)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer whitespace-nowrap ${
                    filterCategoria === categoria
                      ? 'bg-gradient-primary text-white'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  {categoria === 'todos' ? 'Todos' : 
                   categoria === 'estudio' ? 'Estúdio' :
                   categoria === 'equipamento' ? 'Equipamento' :
                   categoria === 'servico' ? 'Serviço' : 'Outro'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fornecedores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFornecedores.map((fornecedor) => (
            <div 
              key={fornecedor.id} 
              className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-primary-teal transition-smooth"
              onClick={() => {
                // Fechar menu de ações se clicar fora dele
                if (showActionsMenu !== fornecedor.id) {
                  setShowActionsMenu(null);
                  setSelectedFornecedor(fornecedor);
                }
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                    <i className={`${getCategoriaIcon(fornecedor.categoria)} text-2xl text-white`}></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{fornecedor.nome}</h3>
                    <p className="text-sm text-gray-400">{fornecedor.tipo_servico}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(fornecedor.status)}`}>
                  {getStatusLabel(fornecedor.status)}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-dark-bg text-gray-400">
                  {getCategoriaLabel(fornecedor.categoria)}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <i className="ri-mail-line text-primary-teal"></i>
                  <span className="truncate">{fornecedor.contato_email}</span>
                </div>
                {fornecedor.contato_telefone && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <i className="ri-phone-line text-primary-teal"></i>
                    <span>{fornecedor.contato_telefone}</span>
                  </div>
                )}
                {fornecedor.cidade && fornecedor.estado && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <i className="ri-map-pin-line text-primary-teal"></i>
                    <span>{fornecedor.cidade}, {fornecedor.estado}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dark-border pt-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    {fornecedor.projetos_utilizados !== undefined && (
                      <span className="text-gray-500">
                        <i className="ri-folder-line mr-1"></i>
                        {fornecedor.projetos_utilizados} projetos
                      </span>
                    )}
                    {fornecedor.avaliacao !== undefined && (
                      <div className="flex items-center gap-1">
                        <i className="ri-star-fill text-yellow-400"></i>
                        <span className="text-white font-medium">{fornecedor.avaliacao}</span>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActionsMenu(showActionsMenu === fornecedor.id ? null : fornecedor.id);
                      }}
                      className="px-3 py-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
                      title="Mais opções"
                    >
                      <i className="ri-more-2-fill"></i>
                    </button>
                    
                    {showActionsMenu === fornecedor.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 bg-dark-card border border-dark-border rounded-lg shadow-lg z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFornecedor(fornecedor);
                            setShowActionsMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-hover transition-smooth cursor-pointer flex items-center gap-2 rounded-t-lg"
                        >
                          <i className="ri-eye-line"></i>
                          Ver Detalhes
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(fornecedor);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-hover transition-smooth cursor-pointer flex items-center gap-2"
                        >
                          <i className="ri-edit-line"></i>
                          Editar
                        </button>
                        <div className="border-t border-dark-border"></div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(fornecedor);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-smooth cursor-pointer flex items-center gap-2 rounded-b-lg"
                        >
                          <i className="ri-delete-bin-line"></i>
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredFornecedores.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-store-line text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhum fornecedor encontrado</p>
          </div>
        )}

        {/* Modal Detalhes do Fornecedor */}
        {selectedFornecedor && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                    <i className={`${getCategoriaIcon(selectedFornecedor.categoria)} text-2xl text-white`}></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedFornecedor.nome}</h2>
                    <p className="text-gray-400">{selectedFornecedor.tipo_servico}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedFornecedor(null)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Informações de Contato</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white">
                      <i className="ri-mail-line text-primary-teal"></i>
                      <span>{selectedFornecedor.contato_email}</span>
                    </div>
                    {selectedFornecedor.contato_telefone && (
                      <div className="flex items-center gap-2 text-sm text-white">
                        <i className="ri-phone-line text-primary-teal"></i>
                        <span>{selectedFornecedor.contato_telefone}</span>
                      </div>
                    )}
                    {selectedFornecedor.website && (
                      <div className="flex items-center gap-2 text-sm text-white">
                        <i className="ri-global-line text-primary-teal"></i>
                        <span>{selectedFornecedor.website}</span>
                      </div>
                    )}
                    {selectedFornecedor.endereco && (
                      <div className="flex items-start gap-2 text-sm text-white">
                        <i className="ri-map-pin-line text-primary-teal mt-1"></i>
                        <div>
                          <div>{selectedFornecedor.endereco}</div>
                          {selectedFornecedor.cidade && selectedFornecedor.estado && (
                            <div className="text-gray-400">{selectedFornecedor.cidade}, {selectedFornecedor.estado}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Status e Informações</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedFornecedor.status)}`}>
                        {getStatusLabel(selectedFornecedor.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Categoria:</span>
                      <span className="text-sm text-white font-medium">{getCategoriaLabel(selectedFornecedor.categoria)}</span>
                    </div>
                    {selectedFornecedor.projetos_utilizados !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Projetos:</span>
                        <span className="text-sm text-white font-medium">{selectedFornecedor.projetos_utilizados} utilizados</span>
                      </div>
                    )}
                    {selectedFornecedor.avaliacao !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Avaliação:</span>
                        <div className="flex items-center gap-1">
                          <i className="ri-star-fill text-yellow-400"></i>
                          <span className="text-sm text-white font-medium">{selectedFornecedor.avaliacao}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedFornecedor.responsavel && (
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Responsável</h3>
                  <p className="text-sm text-white">{selectedFornecedor.responsavel}</p>
                </div>
              )}

              {selectedFornecedor.cnpj && (
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">CNPJ</h3>
                  <p className="text-sm text-white">{selectedFornecedor.cnpj}</p>
                </div>
              )}

              {selectedFornecedor.observacoes && (
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Observações</h3>
                  <p className="text-sm text-white">{selectedFornecedor.observacoes}</p>
                </div>
              )}

              {selectedFornecedor.servicos && selectedFornecedor.servicos.length > 0 && (
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Serviços Oferecidos</h3>
                  <div className="space-y-3">
                    {selectedFornecedor.servicos.map((servico) => (
                      <div
                        key={servico.id}
                        className="p-3 bg-dark-card border border-dark-border rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-white font-medium text-sm mb-1">{servico.nome}</div>
                            {servico.descricao && (
                              <div className="text-gray-400 text-xs mb-2">{servico.descricao}</div>
                            )}
                            {servico.preco_base !== undefined && (
                              <div className="text-primary-teal text-sm font-medium">
                                R$ {servico.preco_base.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteConfirm && fornecedorToDelete && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <i className="ri-alert-line text-2xl text-red-400"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Confirmar Exclusão</h2>
                  <p className="text-sm text-gray-400">Esta ação não pode ser desfeita</p>
                </div>
              </div>
              
              <p className="text-white mb-6">
                Tem certeza que deseja excluir o fornecedor <strong>"{fornecedorToDelete.nome}"</strong>?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border text-white font-medium rounded-lg hover:bg-dark-hover transition-smooth cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-smooth cursor-pointer"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Novo/Editar Fornecedor */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                </h2>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Nome do Fornecedor *</label>
                      <input
                        type="text"
                        required
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: Estúdio Toca do Bandido"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Categoria *</label>
                      <select
                        required
                        value={formData.categoria}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                        className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="estudio">Estúdio</option>
                        <option value="equipamento">Equipamento</option>
                        <option value="servico">Serviço</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Tipo de Serviço *</label>
                      <input
                        type="text"
                        required
                        value={formData.tipo_servico}
                        onChange={(e) => setFormData({ ...formData, tipo_servico: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: Gravação e Mixagem"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Status *</label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                        <option value="suspenso">Suspenso</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Informações de Contato */}
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Informações de Contato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">E-mail *</label>
                      <input
                        type="email"
                        required
                        value={formData.contato_email}
                        onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="contato@fornecedor.com.br"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Telefone</label>
                      <input
                        type="tel"
                        value={formData.contato_telefone}
                        onChange={(e) => setFormData({ ...formData, contato_telefone: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Website</label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="www.fornecedor.com.br"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Responsável</label>
                      <input
                        type="text"
                        value={formData.responsavel}
                        onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Nome do responsável"
                      />
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Endereço</label>
                      <input
                        type="text"
                        value={formData.endereco}
                        onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Rua, número, complemento"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Cidade</label>
                      <input
                        type="text"
                        value={formData.cidade}
                        onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="São Paulo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Estado</label>
                      <input
                        type="text"
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">CNPJ</label>
                      <input
                        type="text"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>
                </div>

                {/* Serviços Oferecidos */}
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Serviços Oferecidos</h3>
                  
                  {/* Formulário para adicionar serviço */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Nome do Serviço</label>
                      <input
                        type="text"
                        value={novoServico.nome}
                        onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: Mixagem"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Descrição</label>
                      <input
                        type="text"
                        value={novoServico.descricao}
                        onChange={(e) => setNovoServico({ ...novoServico, descricao: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Descrição do serviço"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Preço Base (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={novoServico.preco_base}
                        onChange={(e) => setNovoServico({ ...novoServico, preco_base: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddServico}
                        className="w-full px-4 py-3 bg-primary-teal hover:bg-primary-brown text-white rounded-lg transition-smooth cursor-pointer flex items-center justify-center gap-2"
                      >
                        <i className="ri-add-line"></i>
                        Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Lista de serviços */}
                  {servicos.length > 0 && (
                    <div className="space-y-2">
                      {servicos.map((servico) => (
                        <div
                          key={servico.id}
                          className="flex items-center justify-between p-3 bg-dark-card border border-dark-border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="text-white font-medium text-sm">{servico.nome}</div>
                            {servico.descricao && (
                              <div className="text-gray-400 text-xs mt-1">{servico.descricao}</div>
                            )}
                            {servico.preco_base !== undefined && (
                              <div className="text-primary-teal text-xs mt-1">
                                R$ {servico.preco_base.toFixed(2)}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveServico(servico.id)}
                            className="text-red-400 hover:text-red-300 transition-smooth cursor-pointer ml-4"
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {servicos.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Nenhum serviço adicionado ainda
                    </div>
                  )}
                </div>

                {/* Observações */}
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">Observações</h3>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Observações sobre o fornecedor..."
                    rows={4}
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    {editingFornecedor ? 'Salvar Alterações' : 'Criar Fornecedor'}
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

