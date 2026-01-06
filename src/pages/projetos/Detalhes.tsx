import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';

interface Projeto {
  id: string;
  nome: string;
  tipo: string;
  fase: string;
  progresso: number;
  data_inicio?: string;
  previsao_lancamento?: string;
  artista_id: string;
  artista?: { nome: string };
  estudio?: string;
  produtor?: string;
  observacoes_tecnicas?: string;
}

interface Faixa {
  id: string;
  projeto_id: string;
  nome: string;
  status: 'gravada' | 'pendente';
  o_que_falta_gravar?: string;
  ordem: number;
}

interface Orcamento {
  id: string;
  projeto_id: string;
  valor_total: number;
  valor_realizado: number;
  status: string;
}

export default function ProjetoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [faixas, setFaixas] = useState<Faixa[]>([]);
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFaixaModal, setShowFaixaModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFaseDropdown, setShowFaseDropdown] = useState(false);
  const [editingFaixa, setEditingFaixa] = useState<Faixa | null>(null);
  const [formData, setFormData] = useState({
    estudio: '',
    produtor: '',
    observacoes_tecnicas: ''
  });
  const [faixaFormData, setFaixaFormData] = useState({
    nome: '',
    status: 'pendente' as 'gravada' | 'pendente',
    o_que_falta_gravar: ''
  });

  useEffect(() => {
    if (id) {
      loadProjetoData();
    }
  }, [id]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showFaseDropdown && !target.closest('.fase-dropdown-container')) {
        setShowFaseDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFaseDropdown]);

  const loadProjetoData = async () => {
    try {
      // Carregar dados do projeto
      const { data: projetoData, error: projetoError } = await supabase
        .from('projetos')
        .select('*, artista:artista_id(nome)')
        .eq('id', id)
        .single();

      if (projetoError) throw projetoError;

      if (projetoData) {
        setProjeto(projetoData);
        setFormData({
          estudio: projetoData.estudio || '',
          produtor: projetoData.produtor || '',
          observacoes_tecnicas: projetoData.observacoes_tecnicas || ''
        });
      }

      // Carregar faixas do projeto
      const { data: faixasData, error: faixasError } = await supabase
        .from('faixas')
        .select('*')
        .eq('projeto_id', id)
        .order('ordem', { ascending: true });

      if (faixasError && faixasError.code !== 'PGRST116') {
        throw faixasError;
      }
      
      if (faixasData) setFaixas(faixasData);

      // Carregar orçamento do projeto
      const { data: orcamentoData } = await supabase
        .from('orcamentos')
        .select('id, projeto_id, valor_total, status')
        .eq('projeto_id', id)
        .eq('status', 'aprovado')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orcamentoData) {
        // Calcular valor realizado
        const { data: pagamentosData } = await supabase
          .from('pagamentos')
          .select('valor')
          .eq('orcamento_id', orcamentoData.id)
          .eq('status', 'pago');

        const valorRealizado = pagamentosData?.reduce((sum, p) => sum + (p.valor || 0), 0) || 0;
        
        setOrcamento({
          ...orcamentoData,
          valor_realizado: valorRealizado
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do projeto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProjeto = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('projetos')
        .update({
          estudio: formData.estudio || null,
          produtor: formData.produtor || null,
          observacoes_tecnicas: formData.observacoes_tecnicas || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setShowEditModal(false);
      loadProjetoData();
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      alert('Erro ao atualizar projeto. Tente novamente.');
    }
  };

  const handleUpdateFase = async (novaFase: string) => {
    if (!id || !projeto) return;

    try {
      const { error } = await supabase
        .from('projetos')
        .update({
          fase: novaFase,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setProjeto({ ...projeto, fase: novaFase });
      setShowFaseDropdown(false);
      loadProjetoData();
    } catch (error) {
      console.error('Erro ao atualizar fase:', error);
      alert('Erro ao atualizar fase. Tente novamente.');
    }
  };

  const fases = [
    { value: 'planejamento', label: 'Planejamento' },
    { value: 'gravando', label: 'Gravando' },
    { value: 'em_edicao', label: 'Em edição' },
    { value: 'mixagem', label: 'Mixagem' },
    { value: 'masterizacao', label: 'Masterização' },
    { value: 'finalizado', label: 'Finalizado' },
    { value: 'lancado', label: 'Lançado' }
  ];

  const handleSubmitFaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const maxOrdem = faixas.length > 0 ? Math.max(...faixas.map(f => f.ordem)) : 0;

      if (editingFaixa) {
        // Editar faixa existente
        const { error } = await supabase
          .from('faixas')
          .update({
            nome: faixaFormData.nome,
            status: faixaFormData.status,
            o_que_falta_gravar: faixaFormData.o_que_falta_gravar || null
          })
          .eq('id', editingFaixa.id);

        if (error) throw error;
      } else {
        // Criar nova faixa
        const { error } = await supabase
          .from('faixas')
          .insert([{
            projeto_id: id,
            nome: faixaFormData.nome,
            status: faixaFormData.status,
            o_que_falta_gravar: faixaFormData.o_que_falta_gravar || null,
            ordem: maxOrdem + 1
          }]);

        if (error) throw error;
      }

      setShowFaixaModal(false);
      setEditingFaixa(null);
      setFaixaFormData({
        nome: '',
        status: 'pendente',
        o_que_falta_gravar: ''
      });
      loadProjetoData();
    } catch (error) {
      console.error('Erro ao salvar faixa:', error);
      alert('Erro ao salvar faixa. Tente novamente.');
    }
  };

  const handleEditFaixa = (faixa: Faixa) => {
    setEditingFaixa(faixa);
    setFaixaFormData({
      nome: faixa.nome,
      status: faixa.status,
      o_que_falta_gravar: faixa.o_que_falta_gravar || ''
    });
    setShowFaixaModal(true);
  };

  const handleDeleteFaixa = async (faixaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta faixa?')) return;

    try {
      const { error } = await supabase
        .from('faixas')
        .delete()
        .eq('id', faixaId);

      if (error) throw error;

      loadProjetoData();
    } catch (error) {
      console.error('Erro ao excluir faixa:', error);
      alert('Erro ao excluir faixa. Tente novamente.');
    }
  };

  const handleToggleStatus = async (faixa: Faixa) => {
    try {
      const novoStatus = faixa.status === 'gravada' ? 'pendente' : 'gravada';
      const { error } = await supabase
        .from('faixas')
        .update({ status: novoStatus })
        .eq('id', faixa.id);

      if (error) throw error;

      loadProjetoData();
    } catch (error) {
      console.error('Erro ao atualizar status da faixa:', error);
      alert('Erro ao atualizar status. Tente novamente.');
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'single': 'Single',
      'ep': 'EP',
      'album': 'Álbum'
    };
    return labels[tipo] || tipo;
  };

  const getFaseLabel = (fase: string) => {
    const labels: Record<string, string> = {
      'planejamento': 'Planejamento',
      'gravando': 'Gravando',
      'em_edicao': 'Em edição',
      'mixagem': 'Mixagem',
      'masterizacao': 'Masterização',
      'finalizado': 'Finalizado',
      'lancado': 'Lançado'
    };
    return labels[fase] || fase;
  };

  const getStatusColor = (status: string) => {
    return status === 'gravada' 
      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
            <p className="text-gray-400 mt-4">Carregando projeto...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!projeto) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-error-warning-line text-4xl text-red-400 mb-4"></i>
            <p className="text-gray-400 mb-4">Projeto não encontrado</p>
            <button
              onClick={() => navigate('/projetos')}
              className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
            >
              Voltar para Projetos
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const faixasGravadas = faixas.filter(f => f.status === 'gravada').length;
  const faixasPendentes = faixas.filter(f => f.status === 'pendente').length;

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/projetos')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-smooth cursor-pointer"
          >
            <i className="ri-arrow-left-line"></i>
            <span>Voltar para Projetos</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-white">{projeto.nome}</h1>
                <span className="px-3 py-1 bg-primary-teal/20 text-primary-teal text-sm font-medium rounded">
                  {getTipoLabel(projeto.tipo)}
                </span>
                <div className="relative fase-dropdown-container">
                  <button
                    onClick={() => setShowFaseDropdown(!showFaseDropdown)}
                    className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded hover:bg-blue-500/30 transition-smooth cursor-pointer flex items-center gap-2"
                  >
                    {getFaseLabel(projeto.fase)}
                    <i className={`ri-arrow-${showFaseDropdown ? 'up' : 'down'}-s-line text-xs`}></i>
                  </button>
                  {showFaseDropdown && (
                    <div className="absolute top-full left-0 mt-2 bg-dark-card border border-dark-border rounded-lg shadow-xl z-50 min-w-[180px]">
                      {fases.map((fase) => (
                        <button
                          key={fase.value}
                          onClick={() => handleUpdateFase(fase.value)}
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
              <p className="text-gray-400">{projeto.artista?.nome || 'Sem artista'}</p>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <i className="ri-settings-3-line"></i>
              Configurações de Gravação
            </button>
          </div>
        </div>

        {/* Estatísticas de Faixas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total de Faixas</p>
                <p className="text-2xl font-bold text-white">{faixas.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary-teal/20 flex items-center justify-center">
                <i className="ri-music-2-line text-primary-teal text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Gravadas</p>
                <p className="text-2xl font-bold text-green-400">{faixasGravadas}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-green-400 text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-400">{faixasPendentes}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <i className="ri-time-line text-yellow-400 text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Progresso</p>
                <p className="text-2xl font-bold text-white">
                  {faixas.length > 0 ? Math.round((faixasGravadas / faixas.length) * 100) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary-teal/20 flex items-center justify-center">
                <i className="ri-bar-chart-line text-primary-teal text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Faixas */}
          <div className="lg:col-span-2">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Controle de Gravação</h2>
                <button
                  onClick={() => {
                    setEditingFaixa(null);
                    setFaixaFormData({
                      nome: '',
                      status: 'pendente',
                      o_que_falta_gravar: ''
                    });
                    setShowFaixaModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
                >
                  <i className="ri-add-line"></i>
                  Nova Faixa
                </button>
              </div>

              {faixas.length === 0 ? (
                <div className="text-center py-12">
                  <i className="ri-music-2-line text-6xl text-gray-600 mb-4"></i>
                  <p className="text-gray-400 mb-4">Nenhuma faixa cadastrada</p>
                  <button
                    onClick={() => {
                      setEditingFaixa(null);
                      setFaixaFormData({
                        nome: '',
                        status: 'pendente',
                        o_que_falta_gravar: ''
                      });
                      setShowFaixaModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
                  >
                    Adicionar Primeira Faixa
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {faixas.map((faixa, index) => (
                    <div
                      key={faixa.id}
                      className="bg-dark-bg border border-dark-border rounded-lg p-4 hover:border-primary-teal transition-smooth"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-8 h-8 rounded-full bg-dark-card border border-dark-border flex items-center justify-center text-sm text-gray-400 mt-0.5">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-white mb-2">{faixa.nome}</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => handleToggleStatus(faixa)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-smooth cursor-pointer ${getStatusColor(faixa.status)}`}
                              >
                                {faixa.status === 'gravada' ? (
                                  <>
                                    <i className="ri-checkbox-circle-line mr-1"></i>
                                    Gravada
                                  </>
                                ) : (
                                  <>
                                    <i className="ri-time-line mr-1"></i>
                                    Pendente
                                  </>
                                )}
                              </button>
                              {faixa.status === 'pendente' && faixa.o_que_falta_gravar && (
                                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">
                                  <i className="ri-alert-line mr-1"></i>
                                  {faixa.o_que_falta_gravar}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditFaixa(faixa)}
                            className="p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer"
                          >
                            <i className="ri-edit-line text-gray-400 hover:text-primary-teal"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteFaixa(faixa.id)}
                            className="p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer"
                          >
                            <i className="ri-delete-bin-line text-gray-400 hover:text-red-400"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Informações de Gravação */}
          <div className="space-y-6">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Informações de Gravação</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Estúdio Utilizado</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg">
                    <i className="ri-building-line text-primary-teal"></i>
                    <span className="text-white">{projeto.estudio || 'Não informado'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Produtor Responsável</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg">
                    <i className="ri-user-line text-primary-teal"></i>
                    <span className="text-white">{projeto.produtor || 'Não informado'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Observações Técnicas</h2>
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4 min-h-[200px]">
                {projeto.observacoes_tecnicas ? (
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{projeto.observacoes_tecnicas}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">Nenhuma observação técnica cadastrada</p>
                )}
              </div>
            </div>

            {/* Orçamento e Financeiro */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Orçamento e Financeiro</h2>
                {orcamento && (
                  <button
                    onClick={() => navigate(`/financeiro?orcamento_id=${orcamento.id}`)}
                    className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer flex items-center gap-2"
                  >
                    Ver Pagamentos
                    <i className="ri-arrow-right-line"></i>
                  </button>
                )}
              </div>
              {orcamento ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Orçamento Total</p>
                    <p className="text-xl font-bold text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orcamento.valor_total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Valor Realizado</p>
                    <p className="text-xl font-bold text-primary-teal">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orcamento.valor_realizado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Diferença</p>
                    <p className={`text-lg font-semibold ${
                      orcamento.valor_total - orcamento.valor_realizado >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orcamento.valor_total - orcamento.valor_realizado)}
                    </p>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Progresso</span>
                      <span className="text-xs text-gray-400">
                        {orcamento.valor_total > 0 ? Math.round((orcamento.valor_realizado / orcamento.valor_total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-dark-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-smooth ${
                          orcamento.valor_realizado <= orcamento.valor_total ? 'bg-primary-teal' : 'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.min((orcamento.valor_realizado / orcamento.valor_total) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/orcamentos')}
                    className="w-full mt-4 px-4 py-2 bg-dark-bg hover:bg-dark-hover text-white text-sm rounded-lg transition-smooth cursor-pointer flex items-center justify-center gap-2"
                  >
                    <i className="ri-file-list-3-line"></i>
                    Gerenciar Orçamentos
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="ri-file-list-3-line text-4xl text-gray-600 mb-3"></i>
                  <p className="text-sm text-gray-400 mb-4">Nenhum orçamento aprovado</p>
                  <button
                    onClick={() => navigate('/orcamentos')}
                    className="px-4 py-2 bg-gradient-primary text-white text-sm rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
                  >
                    Criar Orçamento
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Nova/Editar Faixa */}
        {showFaixaModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {editingFaixa ? 'Editar Faixa' : 'Nova Faixa'}
                </h2>
                <button
                  onClick={() => {
                    setShowFaixaModal(false);
                    setEditingFaixa(null);
                    setFaixaFormData({
                      nome: '',
                      status: 'pendente',
                      o_que_falta_gravar: ''
                    });
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmitFaixa} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Nome da Faixa</label>
                  <input
                    type="text"
                    required
                    value={faixaFormData.nome}
                    onChange={(e) => setFaixaFormData({ ...faixaFormData, nome: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Música 01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                  <select
                    value={faixaFormData.status}
                    onChange={(e) => setFaixaFormData({ ...faixaFormData, status: e.target.value as 'gravada' | 'pendente' })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="gravada">Gravada</option>
                  </select>
                </div>

                {faixaFormData.status === 'pendente' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">O que falta gravar</label>
                    <input
                      type="text"
                      value={faixaFormData.o_que_falta_gravar}
                      onChange={(e) => setFaixaFormData({ ...faixaFormData, o_que_falta_gravar: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: Vocais, instrumentais, backing vocals..."
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFaixaModal(false);
                      setEditingFaixa(null);
                      setFaixaFormData({
                        nome: '',
                        status: 'pendente',
                        o_que_falta_gravar: ''
                      });
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    {editingFaixa ? 'Salvar Alterações' : 'Adicionar Faixa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Configurações de Gravação */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Configurações de Gravação</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Estúdio Utilizado</label>
                  <input
                    type="text"
                    value={formData.estudio}
                    onChange={(e) => setFormData({ ...formData, estudio: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Estúdio XYZ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Produtor Responsável</label>
                  <input
                    type="text"
                    value={formData.produtor}
                    onChange={(e) => setFormData({ ...formData, produtor: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Observações Técnicas</label>
                  <textarea
                    value={formData.observacoes_tecnicas}
                    onChange={(e) => setFormData({ ...formData, observacoes_tecnicas: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Observações técnicas sobre a gravação..."
                    rows={6}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdateProjeto}
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Salvar Configurações
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

