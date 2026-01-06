import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';

type ViewMode = 'list' | 'kanban';

interface Projeto {
  id: string;
  nome: string;
  tipo?: string;
  fase: string;
  progresso: number;
  prazo?: string;
  previsao_lancamento?: string;
  prioridade: string;
  artista?: { nome: string; id?: string };
  artista_id?: string;
}

interface Artista {
  id: string;
  nome: string;
}

export default function Projetos() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [projetoToDelete, setProjetoToDelete] = useState<Projeto | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    artista_id: '',
    fase: 'planejamento',
    progresso: 0,
    prioridade: 'media',
    prazo: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Fechar menu de ações ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Não fechar se o clique foi dentro do menu ou no botão que abre o menu
      if (showActionsMenu && !target.closest('.actions-menu-container') && !target.closest('.actions-menu-button')) {
        setShowActionsMenu(null);
      }
    };

    if (showActionsMenu) {
      // Usar um pequeno delay para não fechar imediatamente após abrir
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showActionsMenu]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projetosRes, artistasRes] = await Promise.all([
        supabase
          .from('projetos')
          .select('id, nome, tipo, fase, progresso, prioridade, data_inicio, previsao_lancamento, artista_id, artista:artista_id(id, nome)')
          .order('created_at', { ascending: false }),
        supabase
          .from('artistas')
          .select('id, nome')
          .eq('status', 'ativo')
          .order('nome')
      ]);

      if (projetosRes.error) {
        console.error('Erro ao carregar projetos:', projetosRes.error);
      } else {
        console.log('Projetos carregados:', projetosRes.data?.length || 0);
        setProjetos(projetosRes.data as any || []);
      }

      if (artistasRes.error) {
        console.error('Erro ao carregar artistas:', artistasRes.error);
      } else {
        setArtistas(artistasRes.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios com mensagens específicas
    if (!formData.nome || !formData.nome.trim()) {
      alert('Por favor, preencha o nome do projeto.');
      return;
    }
    
    if (!formData.artista_id || formData.artista_id.trim() === '') {
      alert('Por favor, selecione um artista responsável.');
      return;
    }
    
    if (!formData.tipo || formData.tipo.trim() === '') {
      alert('Por favor, selecione o tipo do projeto.');
      return;
    }
    
    if (!formData.fase || formData.fase.trim() === '') {
      alert('Por favor, selecione o status do projeto.');
      return;
    }
    
    try {
      // Preparar dados para inserção
      const dadosParaInserir: any = {
        nome: formData.nome.trim(),
        titulo: formData.nome.trim(), // A tabela também requer titulo
        tipo: formData.tipo.trim(),
        artista_id: formData.artista_id.trim(),
        fase: formData.fase.trim(),
        progresso: formData.progresso || 0,
        prioridade: formData.prioridade || 'media'
      };
      
      // Adicionar datas apenas se preenchidas e válidas
      if (formData.prazo && formData.prazo.trim()) {
        const dataLancamento = new Date(formData.prazo);
        if (!isNaN(dataLancamento.getTime())) {
          dadosParaInserir.previsao_lancamento = formData.prazo;
        }
      }
      
      // Validar que todos os campos obrigatórios estão presentes
      const camposObrigatorios = ['nome', 'tipo', 'artista_id', 'fase'];
      const camposFaltando = camposObrigatorios.filter(campo => !dadosParaInserir[campo]);
      
      if (camposFaltando.length > 0) {
        alert(`Erro: Os seguintes campos são obrigatórios e não foram preenchidos: ${camposFaltando.join(', ')}`);
        console.error('Campos faltando:', camposFaltando);
        console.error('Dados completos:', dadosParaInserir);
        return;
      }
      
      console.log('=== DEBUG: Criando Projeto ===');
      console.log('FormData completo:', formData);
      console.log('Dados sendo enviados:', dadosParaInserir);
      console.log('Validação: Todos os campos obrigatórios estão presentes');
      console.log('Nome:', dadosParaInserir.nome, '- Tipo:', typeof dadosParaInserir.nome);
      console.log('Tipo:', dadosParaInserir.tipo, '- Tipo:', typeof dadosParaInserir.tipo);
      console.log('Artista ID:', dadosParaInserir.artista_id, '- Tipo:', typeof dadosParaInserir.artista_id);
      console.log('Fase:', dadosParaInserir.fase, '- Tipo:', typeof dadosParaInserir.fase);
      
      // Verificar se artista_id é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (dadosParaInserir.artista_id && !uuidRegex.test(dadosParaInserir.artista_id)) {
        console.warn('⚠️ Artista ID não parece ser um UUID válido:', dadosParaInserir.artista_id);
      }
      
      // Forçar atualização do cache fazendo um select primeiro
      await supabase.from('projetos').select('nome, fase').limit(0);
      
      const { data, error } = await supabase
        .from('projetos')
        .insert([dadosParaInserir])
        .select();

      if (error) {
        console.error('Erro detalhado:', error);
        console.error('Dados que tentaram ser inseridos:', dadosParaInserir);
        throw error;
      }

      console.log('Projeto criado com sucesso:', data);

      setShowModal(false);
      setFormData({
        nome: '',
        tipo: '',
        artista_id: '',
        fase: 'planejamento',
        progresso: 0,
        prioridade: 'media',
        prazo: ''
      });
      
      // Recarregar dados após criar projeto
      await loadData();
    } catch (error: any) {
      console.error('Erro ao criar projeto:', error);
      console.error('Detalhes completos do erro:', JSON.stringify(error, null, 2));
      console.error('FormData atual:', formData);
      
      // Mensagem de erro mais específica
      let errorMessage = 'Erro ao criar projeto. Tente novamente.';
      
      if (error) {
        // Log completo do erro
        console.log('Código do erro:', error.code);
        console.log('Mensagem do erro:', error.message);
        console.log('Detalhes:', error.details);
        console.log('Hint:', error.hint);
        
        if (error.message) {
          if (error.message.includes('foreign key') || error.message.includes('violates foreign key')) {
            errorMessage = 'Erro: Artista selecionado não é válido. Verifique se o artista existe no banco de dados.';
          } else if (error.message.includes('check constraint') || error.message.includes('violates check constraint')) {
            errorMessage = 'Erro: Algum valor não está nos formatos permitidos.\n\nVerifique:\n- Tipo: deve ser "single", "ep" ou "album"\n- Fase: deve ser uma das fases válidas\n- Prioridade: deve ser "alta", "media" ou "baixa"';
          } else if (error.message.includes('null value') || error.message.includes('violates not-null constraint') || error.message.includes('null constraint')) {
            // Tentar identificar qual campo está faltando
            let campoFaltando = 'algum campo';
            if (error.message.includes('nome')) campoFaltando = 'nome';
            else if (error.message.includes('tipo')) campoFaltando = 'tipo';
            else if (error.message.includes('artista_id') || error.message.includes('artista')) campoFaltando = 'artista responsável';
            else if (error.message.includes('fase')) campoFaltando = 'fase/status';
            
            errorMessage = `Erro: O campo "${campoFaltando}" é obrigatório e não foi preenchido corretamente.\n\nVerifique se todos os campos foram preenchidos antes de criar o projeto.`;
          } else if (error.message.includes('PGRST204') || error.message.includes('Could not find')) {
            errorMessage = `Erro: Coluna não encontrada no banco.\n\nCache pode não ter atualizado. Aguarde alguns segundos e tente novamente.\n\nDetalhes: ${error.message}`;
          } else {
            errorMessage = `Erro: ${error.message}\n\nVerifique o console do navegador (F12) para mais detalhes.`;
          }
        } else if (error.code) {
          errorMessage = `Erro ${error.code}: ${error.message || 'Erro desconhecido'}\n\nVerifique o console do navegador (F12) para mais detalhes.`;
        }
      }
      
      alert(errorMessage);
    }
  };

  const phases = ['planejamento', 'gravando', 'em_edicao', 'mixagem', 'masterizacao', 'finalizado', 'lancado'];

  const filteredProjetos = projetos.filter(projeto =>
    projeto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    projeto.artista?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPhaseColor = (phase: string) => {
    const colors: Record<string, string> = {
      'planejamento': 'bg-gray-500/20 text-gray-400',
      'gravando': 'bg-blue-500/20 text-blue-400',
      'em_edicao': 'bg-purple-500/20 text-purple-400',
      'mixagem': 'bg-yellow-500/20 text-yellow-400',
      'masterizacao': 'bg-orange-500/20 text-orange-400',
      'finalizado': 'bg-green-500/20 text-green-400',
      'lancado': 'bg-primary-teal/20 text-primary-teal',
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
      'planejamento': 'Planejamento',
      'gravando': 'Gravando',
      'em_edicao': 'Em Edição',
      'mixagem': 'Mixagem',
      'masterizacao': 'Masterização',
      'finalizado': 'Finalizado',
      'lancado': 'Lançado'
    };
    return labels[phase] || phase;
  };

  const handleDeleteClick = (projeto: Projeto) => {
    setProjetoToDelete(projeto);
    setShowDeleteConfirm(true);
    setShowActionsMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!projetoToDelete) return;

    try {
      const { error } = await supabase
        .from('projetos')
        .delete()
        .eq('id', projetoToDelete.id);

      if (error) throw error;

      setShowDeleteConfirm(false);
      setProjetoToDelete(null);
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      alert('Erro ao deletar projeto. Tente novamente.');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setProjetoToDelete(null);
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
                    <tr 
                      key={projeto.id} 
                      className="border-b border-dark-border hover:bg-dark-hover transition-smooth"
                      onClick={() => navigate(`/projetos/${projeto.id}`)}
                    >
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
                        {projeto.previsao_lancamento ? new Date(projeto.previsao_lancamento).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="relative actions-menu-container">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const newMenuState = showActionsMenu === projeto.id ? null : projeto.id;
                              console.log('Toggle menu:', newMenuState);
                              setShowActionsMenu(newMenuState);
                            }}
                            className="actions-menu-button p-2 hover:bg-dark-bg rounded-lg transition-smooth cursor-pointer"
                            type="button"
                          >
                            <i className="ri-more-2-fill text-gray-400"></i>
                          </button>
                          
                          {showActionsMenu === projeto.id && (
                            <div 
                              className="absolute right-0 bottom-full mb-2 w-48 bg-dark-card border border-dark-border rounded-lg shadow-lg z-50 actions-menu-container"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  console.log('Ver detalhes:', projeto.id);
                                  setShowActionsMenu(null);
                                  navigate(`/projetos/${projeto.id}`);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-hover transition-smooth cursor-pointer flex items-center gap-2 rounded-t-lg"
                              >
                                <i className="ri-eye-line"></i>
                                Ver Detalhes
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  console.log('Editar:', projeto.id);
                                  setShowActionsMenu(null);
                                  navigate(`/projetos/${projeto.id}`);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-hover transition-smooth cursor-pointer flex items-center gap-2"
                              >
                                <i className="ri-edit-line"></i>
                                Editar
                              </button>
                              <div className="border-t border-dark-border"></div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  console.log('Excluir:', projeto.id);
                                  handleDeleteClick(projeto);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-smooth cursor-pointer flex items-center gap-2 rounded-b-lg"
                              >
                                <i className="ri-delete-bin-line"></i>
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
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
                                {projeto.previsao_lancamento ? new Date(projeto.previsao_lancamento).toLocaleDateString('pt-BR') : '-'}
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
                  <label htmlFor="nome-projeto-input" className="block text-sm font-medium text-gray-400 mb-2">Nome do Projeto</label>
                  <input
                    id="nome-projeto-input"
                    type="text"
                    required
                    autoFocus
                    value={formData.nome}
                    onChange={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, nome: e.target.value });
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Novo Single - Verão 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tipo do Projeto</label>
                  <select
                    required
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="single">Single</option>
                    <option value="ep">EP</option>
                    <option value="album">Álbum</option>
                  </select>
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

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteConfirm && projetoToDelete && (
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
                Tem certeza que deseja excluir o projeto <strong>"{projetoToDelete.nome}"</strong>?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border text-white font-medium rounded-lg hover:bg-dark-hover transition-smooth"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-smooth"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}