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
  data_lancamento?: string;
  tipo_data_lancamento?: 'real' | 'prevista';
  tem_pre_producao?: boolean | null;
  prioridade: string;
  artista?: { nome: string; id?: string };
  artista_id?: string;
}

interface Faixa {
  id: string;
  projeto_id: string;
  status: 'pendente' | 'gravada' | 'em_mixagem' | 'masterizacao' | 'finalizada' | 'lancada';
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
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [projetoToDelete, setProjetoToDelete] = useState<Projeto | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [openFaseDropdown, setOpenFaseDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Fechar menu de ações e dropdown de fase ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Não fechar se o clique foi dentro do menu ou no botão que abre o menu
      if (showActionsMenu && !target.closest('.actions-menu-container') && !target.closest('.actions-menu-button')) {
        setShowActionsMenu(null);
      }
      // Não fechar se o clique foi dentro do dropdown de fase ou no botão que abre o dropdown
      if (openFaseDropdown && !target.closest('.fase-dropdown-container') && !target.closest('.fase-dropdown-button')) {
        setOpenFaseDropdown(null);
      }
    };

    if (showActionsMenu || openFaseDropdown) {
      // Usar um pequeno delay para não fechar imediatamente após abrir
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showActionsMenu, openFaseDropdown]);

  // Função para calcular o progresso baseado na fase e status das faixas
  // Cada fase tem uma porcentagem base e um intervalo para o progresso das faixas
  const calcularProgresso = (fase: string, faixas: Faixa[]): number => {
    // Define a porcentagem base e o intervalo de cada fase
    const faseConfig: Record<string, { base: number; min: number; max: number; statusValidos: Faixa['status'][] }> = {
      'planejamento': {
        base: 0,
        min: 0,
        max: 12,
        statusValidos: [] // Nenhum status conta, ainda está no planejamento
      },
      'gravando': {
        base: 12,
        min: 12,
        max: 30,
        statusValidos: ['gravada', 'em_mixagem', 'masterizacao', 'finalizada', 'lancada']
      },
      'em_edicao': {
        base: 30,
        min: 30,
        max: 50,
        statusValidos: ['gravada', 'em_mixagem', 'masterizacao', 'finalizada', 'lancada']
      },
      'mixagem': {
        base: 50,
        min: 50,
        max: 70,
        statusValidos: ['em_mixagem', 'masterizacao', 'finalizada', 'lancada']
      },
      'masterizacao': {
        base: 70,
        min: 70,
        max: 85,
        statusValidos: ['masterizacao', 'finalizada', 'lancada']
      },
      'finalizado': {
        base: 85,
        min: 85,
        max: 95,
        statusValidos: ['finalizada', 'lancada']
      },
      'em_fase_lancamento': {
        base: 95,
        min: 95,
        max: 100,
        statusValidos: ['finalizada', 'lancada']
      },
      'lancado': {
        base: 100,
        min: 100,
        max: 100,
        statusValidos: ['lancada']
      }
    };

    const config = faseConfig[fase];
    if (!config) return 0;

    // Se não há faixas, retorna a porcentagem base da fase
    if (faixas.length === 0) {
      return config.base;
    }

    // Se a fase é "lançado", sempre retorna 100%
    if (fase === 'lancado') {
      return 100;
    }

    // Calcula a porcentagem de faixas completas para essa fase
    const faixasCompletas = config.statusValidos.length > 0
      ? faixas.filter(f => config.statusValidos.includes(f.status)).length
      : 0;
    
    const porcentagemFaixas = faixasCompletas / faixas.length;

    // Calcula o progresso dentro do intervalo da fase
    // Por exemplo, se está em "gravando" (12-30%), e 50% das faixas foram gravadas:
    // progresso = 12 + (30 - 12) * 0.5 = 12 + 9 = 21%
    const intervalo = config.max - config.min;
    const progressoDentroFase = porcentagemFaixas * intervalo;
    const progressoFinal = config.min + progressoDentroFase;

    return Math.round(Math.min(100, Math.max(0, progressoFinal)));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [projetosRes, artistasRes, faixasRes] = await Promise.all([
        supabase
          .from('projetos')
          .select('id, nome, tipo, fase, progresso, prioridade, data_inicio, previsao_lancamento, data_lancamento, tipo_data_lancamento, tem_pre_producao, artista_id, artista:artista_id(id, nome)')
          .order('created_at', { ascending: false }),
        supabase
          .from('artistas')
          .select('id, nome')
          .eq('status', 'ativo')
          .order('nome'),
        supabase
          .from('faixas')
          .select('id, projeto_id, status')
      ]);

      if (projetosRes.error) {
        console.error('Erro ao carregar projetos:', projetosRes.error);
      }

      if (artistasRes.error) {
        console.error('Erro ao carregar artistas:', artistasRes.error);
      }

      if (faixasRes.error) {
        console.error('Erro ao carregar faixas:', faixasRes.error);
      }

      // Agrupar faixas por projeto
      const faixasPorProjeto = new Map<string, Faixa[]>();
      if (faixasRes.data) {
        faixasRes.data.forEach((faixa: Faixa) => {
          if (!faixasPorProjeto.has(faixa.projeto_id)) {
            faixasPorProjeto.set(faixa.projeto_id, []);
          }
          faixasPorProjeto.get(faixa.projeto_id)!.push(faixa);
        });
      }

      // Calcular progresso para cada projeto baseado na fase e faixas
      const projetosComProgresso = (projetosRes.data || []).map((projeto: Projeto) => {
        const faixasDoProjeto = faixasPorProjeto.get(projeto.id) || [];
        const progressoCalculado = calcularProgresso(projeto.fase, faixasDoProjeto);
        
        return {
          ...projeto,
          progresso: progressoCalculado
        };
      });

      setProjetos(projetosComProgresso);
      setArtistas(artistasRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };


  const phases = ['planejamento', 'gravando', 'em_edicao', 'mixagem', 'masterizacao', 'finalizado', 'em_fase_lancamento', 'lancado'];

  const fases = [
    { value: 'planejamento', label: 'Planejamento' },
    { value: 'gravando', label: 'Gravando' },
    { value: 'em_edicao', label: 'Em edição' },
    { value: 'mixagem', label: 'Mixagem' },
    { value: 'masterizacao', label: 'Masterização' },
    { value: 'finalizado', label: 'Finalizado' },
    { value: 'em_fase_lancamento', label: 'Em fase de lançamento' },
    { value: 'lancado', label: 'Lançado' }
  ];

  const handleUpdateFase = async (projetoId: string, novaFase: string) => {
    try {
      // Buscar as faixas do projeto para calcular o novo progresso
      const { data: faixasData, error: faixasError } = await supabase
        .from('faixas')
        .select('id, projeto_id, status')
        .eq('projeto_id', projetoId);

      if (faixasError && faixasError.code !== 'PGRST116') {
        throw faixasError;
      }

      // Calcular o novo progresso baseado na nova fase
      const faixasDoProjeto: Faixa[] = faixasData || [];
      const novoProgresso = calcularProgresso(novaFase, faixasDoProjeto);

      // Atualizar fase e progresso no banco de dados
      const { error } = await supabase
        .from('projetos')
        .update({
          fase: novaFase,
          progresso: novoProgresso,
          updated_at: new Date().toISOString()
        })
        .eq('id', projetoId);

      if (error) throw error;

      setOpenFaseDropdown(null);
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar fase:', error);
      alert('Erro ao atualizar fase. Tente novamente.');
    }
  };

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
      'em_fase_lancamento': 'bg-indigo-500/20 text-indigo-400',
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
      'em_fase_lancamento': 'Em fase de lançamento',
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
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Projetos</h1>
            <p className="text-gray-400 text-sm md:text-base">Gerencie todos os projetos musicais</p>
          </div>
          <button 
            onClick={() => navigate('/projetos/novo')}
            className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <i className="ri-add-line text-lg md:text-xl"></i>
            <span className="text-sm md:text-base">Novo Projeto</span>
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
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 p-4">
              {filteredProjetos.map((projeto) => (
                <div
                  key={projeto.id}
                  className="bg-dark-bg border border-dark-border rounded-lg p-4 space-y-3"
                  onClick={() => navigate(`/projetos/${projeto.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <i className="ri-music-2-line text-white"></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-white truncate">{projeto.nome}</h3>
                        <p className="text-xs text-gray-400 truncate">{projeto.artista?.nome || 'Sem artista'}</p>
                      </div>
                    </div>
                    <div className="relative fase-dropdown-container" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenFaseDropdown(openFaseDropdown === projeto.id ? null : projeto.id);
                        }}
                        className={`fase-dropdown-button px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-smooth cursor-pointer flex items-center gap-1 ${getPhaseColor(projeto.fase)}`}
                      >
                        {getPhaseLabel(projeto.fase)}
                        <i className={`ri-arrow-${openFaseDropdown === projeto.id ? 'up' : 'down'}-s-line text-xs`}></i>
                      </button>
                      {openFaseDropdown === projeto.id && (
                        <div className="absolute top-full right-0 mt-2 bg-dark-card border border-dark-border rounded-lg shadow-xl z-50 min-w-[180px]">
                          {fases.map((fase) => (
                            <button
                              key={fase.value}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateFase(projeto.id, fase.value);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition-smooth cursor-pointer first:rounded-t-lg last:rounded-b-lg ${
                                projeto.fase === fase.value
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'text-gray-300 hover:bg-dark-hover hover:text-white'
                              }`}
                            >
                              {fase.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-dark-border rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary rounded-full transition-smooth"
                        style={{ width: `${projeto.progresso}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{projeto.progresso}%</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPriorityColor(projeto.prioridade)}`}>
                      {projeto.prioridade.charAt(0).toUpperCase() + projeto.prioridade.slice(1)}
                    </span>
                    {projeto.data_lancamento && (
                      <span className="text-xs text-gray-400">
                        {new Date(projeto.data_lancamento).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {projeto.tem_pre_producao !== null && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        projeto.tem_pre_producao 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {projeto.tem_pre_producao ? 'Com Pré-Produção' : 'Sem Pré-Produção'}
                      </span>
                    )}
                  </div>
                  
                  <div className="relative actions-menu-container pt-2 border-t border-dark-border" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setShowActionsMenu(showActionsMenu === projeto.id ? null : projeto.id);
                      }}
                      className="actions-menu-button p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer"
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
                </div>
              ))}
              {filteredProjetos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <i className="ri-music-2-line text-4xl mb-2"></i>
                  <p className="text-sm">Nenhum projeto encontrado</p>
                </div>
              )}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-bg border-b border-dark-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Projeto</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Artista</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Fase</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Progresso</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Prioridade</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Data de Lançamento</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Pré-Produção</th>
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
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="relative fase-dropdown-container">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFaseDropdown(openFaseDropdown === projeto.id ? null : projeto.id);
                            }}
                            className={`fase-dropdown-button px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-smooth cursor-pointer flex items-center gap-2 ${getPhaseColor(projeto.fase)}`}
                          >
                            {getPhaseLabel(projeto.fase)}
                            <i className={`ri-arrow-${openFaseDropdown === projeto.id ? 'up' : 'down'}-s-line text-xs`}></i>
                          </button>
                          {openFaseDropdown === projeto.id && (
                            <div className="absolute top-full left-0 mt-2 bg-dark-card border border-dark-border rounded-lg shadow-xl z-50 min-w-[180px]">
                              {fases.map((fase) => (
                                <button
                                  key={fase.value}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateFase(projeto.id, fase.value);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm transition-smooth cursor-pointer first:rounded-t-lg last:rounded-b-lg ${
                                    projeto.fase === fase.value
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : 'text-gray-300 hover:bg-dark-hover hover:text-white'
                                  }`}
                                >
                                  {fase.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
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
                        {projeto.data_lancamento ? (
                          <div className="flex flex-col gap-1">
                            <span>{new Date(projeto.data_lancamento).toLocaleDateString('pt-BR')}</span>
                            <span className="text-xs text-gray-500">
                              {projeto.tipo_data_lancamento === 'real' ? 'Data de Lançamento' : 'Data Prevista'}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {projeto.tem_pre_producao !== null && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            projeto.tem_pre_producao 
                              ? 'bg-purple-500/20 text-purple-400' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {projeto.tem_pre_producao ? 'Com Pré-Produção' : 'Sem Pré-Produção'}
                          </span>
                        )}
                        {projeto.tem_pre_producao === null && (
                          <span className="text-xs text-gray-500">-</span>
                        )}
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
                          <div key={projeto.id} className="p-4 bg-dark-bg rounded-lg hover:bg-dark-hover transition-smooth">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-white">{projeto.nome}</h4>
                              <div className="relative fase-dropdown-container" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenFaseDropdown(openFaseDropdown === projeto.id ? null : projeto.id);
                                  }}
                                  className={`fase-dropdown-button px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-smooth cursor-pointer flex items-center gap-1 ${getPhaseColor(projeto.fase)}`}
                                >
                                  {getPhaseLabel(projeto.fase)}
                                  <i className={`ri-arrow-${openFaseDropdown === projeto.id ? 'up' : 'down'}-s-line text-xs`}></i>
                                </button>
                                {openFaseDropdown === projeto.id && (
                                  <div className="absolute top-full right-0 mt-2 bg-dark-card border border-dark-border rounded-lg shadow-xl z-50 min-w-[180px]">
                                    {fases.map((fase) => (
                                      <button
                                        key={fase.value}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateFase(projeto.id, fase.value);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm transition-smooth cursor-pointer first:rounded-t-lg last:rounded-b-lg ${
                                          projeto.fase === fase.value
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'text-gray-300 hover:bg-dark-hover hover:text-white'
                                        }`}
                                      >
                                        {fase.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
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
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getPriorityColor(projeto.prioridade)}`}>
                                  {projeto.prioridade.charAt(0).toUpperCase() + projeto.prioridade.slice(1)}
                                </span>
                              </div>
                              {projeto.data_lancamento && (
                                <div className="text-xs text-gray-400">
                                  <div className="flex items-center gap-1 mb-1">
                                    <i className="ri-calendar-line"></i>
                                    <span>{new Date(projeto.data_lancamento).toLocaleDateString('pt-BR')}</span>
                                  </div>
                                  <span className="text-gray-500">
                                    {projeto.tipo_data_lancamento === 'real' ? 'Lançamento' : 'Prevista'}
                                  </span>
                                </div>
                              )}
                              {projeto.tem_pre_producao !== null && (
                                <div className="text-xs">
                                  <span className={`px-2 py-0.5 rounded whitespace-nowrap ${
                                    projeto.tem_pre_producao 
                                      ? 'bg-purple-500/20 text-purple-400' 
                                      : 'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {projeto.tem_pre_producao ? 'Com Pré-Prod' : 'Sem Pré-Prod'}
                                  </span>
                                </div>
                              )}
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