import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { produtoresMock, type Produtor } from '../../data/produtores-mock';
import { supabase } from '../../lib/supabase';

interface Artista {
  id: string;
  nome: string;
}

interface Projeto {
  id: string;
  nome: string;
  tipo?: string;
  artista?: {
    nome: string;
  };
}

export default function ProdutoresPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [produtores, setProdutores] = useState<Produtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [artistasLoading, setArtistasLoading] = useState(true);
  const [artistaSearchTerm, setArtistaSearchTerm] = useState('');
  const [showArtistasList, setShowArtistasList] = useState(false);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [projetosLoading, setProjetosLoading] = useState(true);
  const [projetoSearchTerm, setProjetoSearchTerm] = useState('');
  const [showProjetosList, setShowProjetosList] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProdutor, setSelectedProdutor] = useState<Produtor | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [produtorToDelete, setProdutorToDelete] = useState<Produtor | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingProdutor, setEditingProdutor] = useState<Produtor | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    especialidade: '',
    contato_email: '',
    contato_telefone: '',
    instagram: '',
    portfolio: '',
    artistas_trabalhados: [] as string[],
    projetos_selecionados: [] as string[], // IDs dos projetos
    observacoes: ''
  });

  useEffect(() => {
    loadProdutores();
    loadArtistas();
    // Não carregar projetos automaticamente, apenas quando necessário
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.artistas-dropdown-container')) {
        setShowArtistasList(false);
      }
      if (!target.closest('.projetos-dropdown-container')) {
        setShowProjetosList(false);
      }
    };

    if (showArtistasList || showProjetosList) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showArtistasList, showProjetosList]);

  const loadArtistas = async () => {
    try {
      const { data, error } = await supabase
        .from('artistas')
        .select('id, nome')
        .order('nome', { ascending: true });

      if (error) {
        console.warn('Erro ao carregar artistas:', error);
        setArtistas([]);
      } else {
        setArtistas(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar artistas:', error);
      setArtistas([]);
    } finally {
      setArtistasLoading(false);
    }
  };

  const loadProjetos = async () => {
    // Se já carregou e tem dados, não precisa carregar novamente
    if (projetos.length > 0) {
      console.log('Projetos já carregados:', projetos.length);
      return;
    }
    
    // Se já está carregando, não inicia outro carregamento
    if (projetosLoading) {
      console.log('Projetos já estão sendo carregados...');
      return;
    }
    
    try {
      console.log('Iniciando carregamento de projetos...');
      setProjetosLoading(true);
      
      // Primeiro, tenta buscar projetos com a relação de artista
      const { data, error } = await supabase
        .from('projetos')
        .select('id, nome, tipo, artista_id, artistas!projetos_artista_id_fkey(id, nome)')
        .order('nome', { ascending: true });

      console.log('Resposta do Supabase (com artista):', { data, error });

      if (error) {
        console.warn('Erro ao carregar projetos com artista:', error);
        // Tenta buscar sem a relação de artista
        const { data: dataSimple, error: errorSimple } = await supabase
          .from('projetos')
          .select('id, nome, tipo, artista_id')
          .order('nome', { ascending: true });
        
        console.log('Resposta do Supabase (simples):', { dataSimple, errorSimple });
        
        if (errorSimple) {
          console.error('Erro ao carregar projetos (simples):', errorSimple);
          setProjetos([]);
        } else {
          console.log('Projetos carregados (sem artista):', dataSimple?.length || 0);
          const projetosFormatados: Projeto[] = (dataSimple || []).map((p: any) => ({
            id: p.id,
            nome: p.nome || 'Projeto sem nome',
            tipo: p.tipo,
            artista: undefined
          }));
          setProjetos(projetosFormatados);
        }
      } else {
        console.log('Projetos carregados com sucesso:', data?.length || 0);
        // Mapear os dados para o formato correto
        const projetosFormatados: Projeto[] = (data || []).map((p: any) => {
          let artistaNome = undefined;
          
          // Tentar diferentes formatos de resposta do Supabase
          if (p.artistas) {
            if (Array.isArray(p.artistas)) {
              artistaNome = p.artistas.length > 0 ? p.artistas[0].nome : undefined;
            } else if (typeof p.artistas === 'object' && p.artistas.nome) {
              artistaNome = p.artistas.nome;
            }
          }
          
          return {
            id: p.id,
            nome: p.nome || 'Projeto sem nome',
            tipo: p.tipo,
            artista: artistaNome ? { nome: artistaNome } : undefined
          };
        });
        console.log('Projetos formatados:', projetosFormatados);
        setProjetos(projetosFormatados);
      }
    } catch (error) {
      console.error('Erro ao carregar projetos (catch):', error);
      setProjetos([]);
    } finally {
      console.log('Finalizando carregamento de projetos');
      setProjetosLoading(false);
    }
  };

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

  const loadProdutores = async () => {
    try {
      const { data, error } = await supabase
        .from('produtores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Se a tabela não existir, usar dados mock
        console.warn('Tabela produtores não encontrada, usando dados mock:', error);
        setProdutores(produtoresMock);
      } else {
        // Converter dados do banco para o formato Produtor
        const produtoresFormatados: Produtor[] = (data || []).map((p: any) => ({
          id: p.id,
          nome: p.nome,
          especialidade: p.especialidade,
          status: p.status || 'disponivel', // Mantém para compatibilidade com tipo Produtor
          contato_email: p.contato_email,
          contato_telefone: p.contato_telefone || undefined,
          instagram: p.instagram || undefined,
          portfolio: p.portfolio || undefined,
          anos_experiencia: p.anos_experiencia || 0, // Mantém para compatibilidade com tipo Produtor
          artistas_trabalhados: parseJsonField(p.artistas_trabalhados, []),
          projetos: parseJsonField(p.projetos, []),
          observacoes: p.observacoes || undefined,
          created_at: p.created_at || new Date().toISOString()
        }));
        setProdutores(produtoresFormatados);
      }
    } catch (error) {
      console.error('Erro ao carregar produtores:', error);
      // Em caso de erro, usar dados mock
      setProdutores(produtoresMock);
    } finally {
      setLoading(false);
    }
  };

  const filteredProdutores = produtores.filter(produtor => {
    const matchesSearch = 
      produtor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produtor.especialidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produtor.artistas_trabalhados.some(artista => 
        artista.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesSearch;
  });

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };


  const formatPhoneNumber = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos (máximo para celular brasileiro)
    const limitedNumbers = numbers.slice(0, 11);
    
    // Aplica a máscara
    if (limitedNumbers.length <= 2) {
      return limitedNumbers ? `(${limitedNumbers}` : '';
    } else if (limitedNumbers.length <= 6) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    } else if (limitedNumbers.length <= 10) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`;
    } else {
      // Celular com 11 dígitos
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, contato_telefone: formatted });
  };

  const handleEditClick = (produtor: Produtor) => {
    setEditingProdutor(produtor);
    // Formatar telefone se existir
    const telefoneFormatado = produtor.contato_telefone 
      ? formatPhoneNumber(produtor.contato_telefone.replace(/\D/g, ''))
      : '';
    // Extrair IDs dos projetos
    const projetosIds = produtor.projetos.map(p => p.id);
    setFormData({
      nome: produtor.nome,
      especialidade: produtor.especialidade,
      contato_email: produtor.contato_email,
      contato_telefone: telefoneFormatado,
      instagram: produtor.instagram || '',
      portfolio: produtor.portfolio || '',
      artistas_trabalhados: produtor.artistas_trabalhados,
      projetos_selecionados: projetosIds,
      observacoes: produtor.observacoes || ''
    });
    setShowModal(true);
    setShowActionsMenu(null);
  };

  const handleDeleteClick = (produtor: Produtor) => {
    setProdutorToDelete(produtor);
    setShowDeleteConfirm(true);
    setShowActionsMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!produtorToDelete) return;

    try {
      const { error } = await supabase
        .from('produtores')
        .delete()
        .eq('id', produtorToDelete.id);

      if (error) throw error;

      setShowDeleteConfirm(false);
      setProdutorToDelete(null);
      loadProdutores();
    } catch (error) {
      console.error('Erro ao deletar produtor:', error);
      // Se der erro (tabela não existe), remover apenas do estado local
      setProdutores(produtores.filter(p => p.id !== produtorToDelete.id));
      setShowDeleteConfirm(false);
      setProdutorToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setProdutorToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const produtorData = {
        nome: formData.nome,
        especialidade: formData.especialidade,
        contato_email: formData.contato_email,
        contato_telefone: formData.contato_telefone || null,
        instagram: formData.instagram || null,
        portfolio: formData.portfolio || null,
        artistas_trabalhados: JSON.stringify(formData.artistas_trabalhados),
        projetos: (() => {
          // Converter IDs de projetos para o formato esperado
          const projetosFormatados = formData.projetos_selecionados.map(projetoId => {
            const projeto = projetos.find(p => p.id === projetoId);
            if (projeto) {
              return {
                id: projeto.id,
                nome: projeto.nome,
                artista: projeto.artista?.nome || '',
                tipo: projeto.tipo || '',
                ano: new Date().getFullYear()
              };
            }
            return null;
          }).filter(p => p !== null);
          return JSON.stringify(projetosFormatados);
        })(),
        observacoes: formData.observacoes || null
      };

      if (editingProdutor) {
        // Editar produtor existente
        const { error } = await supabase
          .from('produtores')
          .update(produtorData)
          .eq('id', editingProdutor.id);

        if (error) throw error;
      } else {
        // Criar novo produtor
        const { error } = await supabase
          .from('produtores')
          .insert([produtorData]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingProdutor(null);
      setFormData({
        nome: '',
        especialidade: '',
        contato_email: '',
        contato_telefone: '',
        instagram: '',
        portfolio: '',
        artistas_trabalhados: [],
        projetos_selecionados: [],
        observacoes: ''
      });
      loadProdutores();
    } catch (error) {
      console.error('Erro ao salvar produtor:', error);
      // Se der erro (tabela não existe), atualizar apenas o estado local
      if (editingProdutor) {
        setProdutores(produtores.map(p => 
          p.id === editingProdutor.id 
            ? {
                ...p,
                ...formData,
                projetos: editingProdutor.projetos,
                created_at: editingProdutor.created_at
              }
            : p
        ));
      } else {
        const newProdutor: Produtor = {
          id: Date.now().toString(),
          ...formData,
          status: 'disponivel', // Valor padrão para compatibilidade
          anos_experiencia: 0, // Valor padrão para compatibilidade
          projetos: [],
          created_at: new Date().toISOString()
        };
        setProdutores([...produtores, newProdutor]);
      }
      setShowModal(false);
      setEditingProdutor(null);
      setFormData({
        nome: '',
        especialidade: '',
        contato_email: '',
        contato_telefone: '',
        instagram: '',
        portfolio: '',
        artistas_trabalhados: [],
        projetos_selecionados: [],
        observacoes: ''
      });
      alert('Erro ao salvar produtor. Os dados foram salvos apenas localmente.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProdutor(null);
    setShowArtistasList(false);
    setShowProjetosList(false);
    setArtistaSearchTerm('');
    setProjetoSearchTerm('');
    setFormData({
      nome: '',
      especialidade: '',
      contato_email: '',
      contato_telefone: '',
      instagram: '',
      portfolio: '',
      artistas_trabalhados: [],
      projetos_selecionados: [],
      observacoes: ''
    });
  };

  const handleNewProdutor = () => {
    setEditingProdutor(null);
    setShowArtistasList(false);
    setShowProjetosList(false);
    setArtistaSearchTerm('');
    setProjetoSearchTerm('');
    setFormData({
      nome: '',
      especialidade: '',
      contato_email: '',
      contato_telefone: '',
      instagram: '',
      portfolio: '',
      artistas_trabalhados: [],
      projetos_selecionados: [],
      observacoes: ''
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
            <p className="text-gray-400 mt-4">Carregando produtores...</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Produtores</h1>
            <p className="text-gray-400">Gerencie os produtores musicais da gravadora</p>
          </div>
          <button 
            onClick={handleNewProdutor}
            className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-add-line text-xl"></i>
            Novo Produtor
          </button>
        </div>

        {/* Filters */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="relative">
            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
            <input
              type="text"
              placeholder="Buscar por nome, especialidade ou artista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
            />
          </div>
        </div>

        {/* Produtores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProdutores.map((produtor) => (
            <div 
              key={produtor.id} 
              className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-primary-teal transition-smooth"
              onClick={() => {
                // Fechar menu de ações se clicar fora dele
                if (showActionsMenu !== produtor.id) {
                  setShowActionsMenu(null);
                  setSelectedProdutor(produtor);
                }
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{getInitials(produtor.nome)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{produtor.nome}</h3>
                    <p className="text-sm text-gray-400">{produtor.especialidade}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <i className="ri-mail-line text-primary-teal"></i>
                  <span className="truncate">{produtor.contato_email}</span>
                </div>
                {produtor.contato_telefone && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <i className="ri-phone-line text-primary-teal"></i>
                    <span>{produtor.contato_telefone}</span>
                  </div>
                )}
                {produtor.instagram && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <i className="ri-instagram-line text-primary-teal"></i>
                    <span>{produtor.instagram}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dark-border pt-4">
                <p className="text-xs text-gray-500 mb-2">Trabalhou com:</p>
                <div className="flex flex-wrap gap-1">
                  {produtor.artistas_trabalhados.slice(0, 3).map((artista, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 bg-dark-bg text-xs text-gray-400 rounded"
                    >
                      {artista}
                    </span>
                  ))}
                  {produtor.artistas_trabalhados.length > 3 && (
                    <span className="px-2 py-1 bg-dark-bg text-xs text-gray-400 rounded">
                      +{produtor.artistas_trabalhados.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-border">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500 text-sm">
                    <i className="ri-music-2-line mr-1"></i>
                    {produtor.projetos.length} projetos
                  </span>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActionsMenu(showActionsMenu === produtor.id ? null : produtor.id);
                      }}
                      className="px-3 py-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
                      title="Mais opções"
                    >
                      <i className="ri-more-2-fill"></i>
                    </button>
                    
                    {showActionsMenu === produtor.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 bg-dark-card border border-dark-border rounded-lg shadow-lg z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProdutor(produtor);
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
                            handleEditClick(produtor);
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
                            handleDeleteClick(produtor);
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

        {filteredProdutores.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-headphone-line text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhum produtor encontrado</p>
          </div>
        )}

        {/* Modal Detalhes do Produtor */}
        {selectedProdutor && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{getInitials(selectedProdutor.nome)}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedProdutor.nome}</h2>
                    <p className="text-gray-400">{selectedProdutor.especialidade}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedProdutor(null)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="bg-dark-bg border border-dark-border rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Informações de Contato</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white">
                    <i className="ri-mail-line text-primary-teal"></i>
                    <span>{selectedProdutor.contato_email}</span>
                  </div>
                  {selectedProdutor.contato_telefone && (
                    <div className="flex items-center gap-2 text-sm text-white">
                      <i className="ri-phone-line text-primary-teal"></i>
                      <span>{selectedProdutor.contato_telefone}</span>
                    </div>
                  )}
                  {selectedProdutor.instagram && (
                    <div className="flex items-center gap-2 text-sm text-white">
                      <i className="ri-instagram-line text-primary-teal"></i>
                      <span>{selectedProdutor.instagram}</span>
                    </div>
                  )}
                  {selectedProdutor.portfolio && (
                    <div className="flex items-center gap-2 text-sm text-white">
                      <i className="ri-global-line text-primary-teal"></i>
                      <span>{selectedProdutor.portfolio}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-white mt-3 pt-3 border-t border-dark-border">
                    <i className="ri-music-2-line text-primary-teal"></i>
                    <span>{selectedProdutor.projetos.length} projetos realizados</span>
                  </div>
                </div>
              </div>

              {selectedProdutor.observacoes && (
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Observações</h3>
                  <p className="text-sm text-white">{selectedProdutor.observacoes}</p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Artistas Trabalhados</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProdutor.artistas_trabalhados.map((artista, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-2 bg-dark-bg border border-dark-border text-sm text-white rounded-lg"
                    >
                      {artista}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Projetos Realizados</h3>
                <div className="space-y-3">
                  {selectedProdutor.projetos.map((projeto) => (
                    <div 
                      key={projeto.id}
                      className="bg-dark-bg border border-dark-border rounded-lg p-4 hover:border-primary-teal transition-smooth"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{projeto.nome}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span><i className="ri-user-star-line mr-1"></i>{projeto.artista}</span>
                            <span><i className="ri-music-2-line mr-1"></i>{projeto.tipo}</span>
                            <span><i className="ri-calendar-line mr-1"></i>{projeto.ano}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteConfirm && produtorToDelete && (
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
                Tem certeza que deseja excluir o produtor <strong>"{produtorToDelete.nome}"</strong>?
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

        {/* Modal Novo/Editar Produtor */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {editingProdutor ? 'Editar Produtor' : 'Novo Produtor'}
                </h2>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Nome</label>
                    <input
                      type="text"
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Nome do produtor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Especialidade</label>
                    <input
                      type="text"
                      required
                      value={formData.especialidade}
                      onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: Produtor Musical / Mix & Master"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">E-mail</label>
                    <input
                      type="email"
                      required
                      value={formData.contato_email}
                      onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="produtor@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Telefone</label>
                    <input
                      type="tel"
                      value={formData.contato_telefone}
                      onChange={handlePhoneChange}
                      maxLength={15}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="(00) 00000-0000"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.contato_telefone.replace(/\D/g, '').length < 10 
                        ? 'Digite pelo menos 10 dígitos (telefone fixo) ou 11 dígitos (celular)'
                        : formData.contato_telefone.replace(/\D/g, '').length === 10
                        ? 'Telefone fixo: (XX) XXXX-XXXX'
                        : 'Celular: (XX) XXXXX-XXXX'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Instagram</label>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="@usuario"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Portfolio</label>
                    <input
                      type="text"
                      value={formData.portfolio}
                      onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="portfolio.com"
                    />
                  </div>
                </div>

                <div className="relative artistas-dropdown-container">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Artistas Trabalhados
                    {formData.artistas_trabalhados.length > 0 && (
                      <span className="ml-2 text-primary-teal">
                        ({formData.artistas_trabalhados.length} selecionado{formData.artistas_trabalhados.length > 1 ? 's' : ''})
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <div
                      onClick={() => setShowArtistasList(!showArtistasList)}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer flex items-center justify-between min-h-[48px]"
                    >
                      <div className="flex flex-wrap gap-2 flex-1">
                        {formData.artistas_trabalhados.length > 0 ? (
                          formData.artistas_trabalhados.map((artista, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-primary-teal/20 text-primary-teal rounded text-xs flex items-center gap-1"
                            >
                              {artista}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({
                                    ...formData,
                                    artistas_trabalhados: formData.artistas_trabalhados.filter(nome => nome !== artista)
                                  });
                                }}
                                className="hover:text-red-400 transition-smooth"
                              >
                                <i className="ri-close-line text-sm"></i>
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">Clique para selecionar artistas...</span>
                        )}
                      </div>
                      <i className={`ri-arrow-down-s-line text-gray-400 transition-transform ${showArtistasList ? 'rotate-180' : ''}`}></i>
                    </div>
                    
                    {showArtistasList && (
                      <div className="absolute z-50 w-full mt-2 bg-dark-bg border border-dark-border rounded-lg shadow-lg">
                        {artistasLoading ? (
                          <div className="p-4 text-center">
                            <i className="ri-loader-4-line text-primary-teal animate-spin text-xl"></i>
                            <p className="text-gray-400 text-sm mt-2">Carregando artistas...</p>
                          </div>
                        ) : artistas.length === 0 ? (
                          <div className="p-4 text-center">
                            <p className="text-gray-400 text-sm">Nenhum artista cadastrado</p>
                          </div>
                        ) : (
                          <>
                            <div className="p-3 border-b border-dark-border">
                              <div className="relative">
                                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                <input
                                  type="text"
                                  value={artistaSearchTerm}
                                  onChange={(e) => setArtistaSearchTerm(e.target.value)}
                                  placeholder="Buscar artista..."
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                                />
                              </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto p-2">
                              <div className="space-y-1">
                                {artistas
                                  .filter(artista => 
                                    artista.nome.toLowerCase().includes(artistaSearchTerm.toLowerCase())
                                  )
                                  .map((artista) => (
                                    <label
                                      key={artista.id}
                                      className="flex items-center gap-3 p-2 hover:bg-dark-hover rounded-lg cursor-pointer transition-smooth"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={formData.artistas_trabalhados.includes(artista.nome)}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          if (e.target.checked) {
                                            setFormData({
                                              ...formData,
                                              artistas_trabalhados: [...formData.artistas_trabalhados, artista.nome]
                                            });
                                          } else {
                                            setFormData({
                                              ...formData,
                                              artistas_trabalhados: formData.artistas_trabalhados.filter(nome => nome !== artista.nome)
                                            });
                                          }
                                        }}
                                        className="w-4 h-4 rounded border-dark-border bg-dark-bg text-primary-teal focus:ring-primary-teal focus:ring-2 cursor-pointer"
                                      />
                                      <span className="text-white text-sm flex-1">{artista.nome}</span>
                                    </label>
                                  ))}
                                {artistas.filter(artista => 
                                  artista.nome.toLowerCase().includes(artistaSearchTerm.toLowerCase())
                                ).length === 0 && (
                                  <p className="text-gray-400 text-sm text-center py-4">
                                    Nenhum artista encontrado
                                  </p>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative projetos-dropdown-container">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Projetos
                    {formData.projetos_selecionados.length > 0 && (
                      <span className="ml-2 text-primary-teal">
                        ({formData.projetos_selecionados.length} selecionado{formData.projetos_selecionados.length > 1 ? 's' : ''})
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <div
                      onClick={async () => {
                        console.log('Campo de projetos clicado, showProjetosList:', showProjetosList);
                        if (!showProjetosList) {
                          console.log('Abrindo dropdown, carregando projetos...');
                          await loadProjetos();
                        }
                        setShowProjetosList(!showProjetosList);
                      }}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer flex items-center justify-between min-h-[48px]"
                    >
                      <div className="flex flex-wrap gap-2 flex-1">
                        {formData.projetos_selecionados.length > 0 ? (
                          formData.projetos_selecionados.map((projetoId) => {
                            const projeto = projetos.find(p => p.id === projetoId);
                            return projeto ? (
                              <span
                                key={projetoId}
                                className="px-2 py-1 bg-primary-teal/20 text-primary-teal rounded text-xs flex items-center gap-1"
                              >
                                {projeto.nome}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData({
                                      ...formData,
                                      projetos_selecionados: formData.projetos_selecionados.filter(id => id !== projetoId)
                                    });
                                  }}
                                  className="hover:text-red-400 transition-smooth"
                                >
                                  <i className="ri-close-line text-sm"></i>
                                </button>
                              </span>
                            ) : null;
                          })
                        ) : (
                          <span className="text-gray-500">Clique para selecionar projetos...</span>
                        )}
                      </div>
                      <i className={`ri-arrow-down-s-line text-gray-400 transition-transform ${showProjetosList ? 'rotate-180' : ''}`}></i>
                    </div>
                    
                    {showProjetosList && (
                      <div className="absolute z-50 w-full mt-2 bg-dark-bg border border-dark-border rounded-lg shadow-lg">
                        {projetosLoading ? (
                          <div className="p-4 text-center">
                            <i className="ri-loader-4-line text-primary-teal animate-spin text-xl"></i>
                            <p className="text-gray-400 text-sm mt-2">Carregando projetos...</p>
                          </div>
                        ) : projetos.length === 0 ? (
                          <div className="p-4 text-center">
                            <p className="text-gray-400 text-sm">Nenhum projeto cadastrado</p>
                          </div>
                        ) : (
                          <>
                            <div className="p-3 border-b border-dark-border">
                              <div className="relative">
                                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                <input
                                  type="text"
                                  value={projetoSearchTerm}
                                  onChange={(e) => setProjetoSearchTerm(e.target.value)}
                                  placeholder="Buscar projeto..."
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                                />
                              </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto p-2">
                              <div className="space-y-1">
                                {projetos
                                  .filter(projeto => 
                                    projeto.nome.toLowerCase().includes(projetoSearchTerm.toLowerCase()) ||
                                    projeto.artista?.nome.toLowerCase().includes(projetoSearchTerm.toLowerCase())
                                  )
                                  .map((projeto) => (
                                    <label
                                      key={projeto.id}
                                      className="flex items-center gap-3 p-2 hover:bg-dark-hover rounded-lg cursor-pointer transition-smooth"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={formData.projetos_selecionados.includes(projeto.id)}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          if (e.target.checked) {
                                            setFormData({
                                              ...formData,
                                              projetos_selecionados: [...formData.projetos_selecionados, projeto.id]
                                            });
                                          } else {
                                            setFormData({
                                              ...formData,
                                              projetos_selecionados: formData.projetos_selecionados.filter(id => id !== projeto.id)
                                            });
                                          }
                                        }}
                                        className="w-4 h-4 rounded border-dark-border bg-dark-bg text-primary-teal focus:ring-primary-teal focus:ring-2 cursor-pointer"
                                      />
                                      <div className="flex-1">
                                        <span className="text-white text-sm block">{projeto.nome}</span>
                                        {projeto.artista?.nome && (
                                          <span className="text-gray-400 text-xs">{projeto.artista.nome}</span>
                                        )}
                                      </div>
                                    </label>
                                  ))}
                                {projetos.filter(projeto => 
                                  projeto.nome.toLowerCase().includes(projetoSearchTerm.toLowerCase()) ||
                                  projeto.artista?.nome.toLowerCase().includes(projetoSearchTerm.toLowerCase())
                                ).length === 0 && (
                                  <p className="text-gray-400 text-sm text-center py-4">
                                    Nenhum projeto encontrado
                                  </p>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Observações sobre o produtor..."
                    rows={4}
                  />
                </div>

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
                    {editingProdutor ? 'Salvar Alterações' : 'Criar Produtor'}
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

