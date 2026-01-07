import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type FilterStatus = 'todos' | 'pendente' | 'aprovado' | 'recusado';

export default function Orcamentos() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<any>(null);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [artistas, setArtistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArtistasList, setShowArtistasList] = useState(false);
  const [filteredArtistas, setFilteredArtistas] = useState<any[]>([]);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // Dados mockados para quando não houver conexão com banco
  const orcamentosMock = [
    { 
      id: 1, 
      type: 'Produção', 
      description: 'Produção Single - Artista A', 
      value: 15000, 
      status: 'pendente', 
      requestedBy: 'A&R João',
      date: '2024-01-15',
      project: 'Novo Single - Verão 2024'
    },
    { 
      id: 2, 
      type: 'Clipe', 
      description: 'Clipe Oficial - Artista B', 
      value: 35000, 
      status: 'pendente', 
      requestedBy: 'A&R Maria',
      date: '2024-01-14',
      project: 'EP Acústico'
    },
    { 
      id: 3, 
      type: 'Masterização', 
      description: 'Master Final - Artista C', 
      value: 8000, 
      status: 'aprovado', 
      requestedBy: 'A&R Pedro',
      date: '2024-01-10',
      project: 'Single Colaboração'
    },
    { 
      id: 4, 
      type: 'Capa', 
      description: 'Arte de Capa - Artista D', 
      value: 3500, 
      status: 'aprovado', 
      requestedBy: 'A&R João',
      date: '2024-01-08',
      project: 'Álbum Completo'
    },
    { 
      id: 5, 
      type: 'Mídia', 
      description: 'Campanha Digital - Artista E', 
      value: 12000, 
      status: 'recusado', 
      requestedBy: 'A&R Maria',
      date: '2024-01-05',
      project: 'Remix Oficial'
    },
  ];
  
  const [orcamentosMockState, setOrcamentosMockState] = useState(orcamentosMock);
  
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    project: '',
    value: '',
    solicitante: '',
    vinculoArtista: '',
    recuperabilidade: '',
    centroCusto: '',
    divisaoVerbas: '',
    breakEven: '',
    cronogramaDesembolso: '',
    reservaContingencia: '',
    auditabilidade: '',
    fluxoCaixa: '',
  });

  useEffect(() => {
    loadOrcamentos();
    loadArtistas();
  }, []);

  useEffect(() => {
    // Filtrar artistas baseado no texto digitado
    if (formData.vinculoArtista) {
      const filtered = artistas.filter(artista =>
        artista.nome.toLowerCase().includes(formData.vinculoArtista.toLowerCase())
      );
      setFilteredArtistas(filtered);
      setShowArtistasList(filtered.length > 0);
    } else {
      setFilteredArtistas(artistas);
      setShowArtistasList(false);
    }
  }, [formData.vinculoArtista, artistas]);

  const loadArtistas = async () => {
    try {
      const { data, error } = await supabase
        .from('artistas')
        .select('id, nome')
        .order('nome', { ascending: true });

      if (error) throw error;

      if (data) {
        setArtistas(data);
        console.log('Artistas carregados:', data.length);
      } else {
        console.log('Nenhum artista encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar artistas:', error);
    }
  };

  const loadOrcamentos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setOrcamentos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      // Se a tabela não existir, usar dados mockados
      setOrcamentos([
    { 
      id: 1, 
      type: 'Produção', 
      description: 'Produção Single - Artista A', 
      value: 15000, 
      status: 'pendente', 
      requestedBy: 'A&R João',
      date: '2024-01-15',
      project: 'Novo Single - Verão 2024'
    },
    { 
      id: 2, 
      type: 'Clipe', 
      description: 'Clipe Oficial - Artista B', 
      value: 35000, 
      status: 'pendente', 
      requestedBy: 'A&R Maria',
      date: '2024-01-14',
      project: 'EP Acústico'
    },
    { 
      id: 3, 
      type: 'Masterização', 
      description: 'Master Final - Artista C', 
      value: 8000, 
      status: 'aprovado', 
      requestedBy: 'A&R Pedro',
      date: '2024-01-10',
      project: 'Single Colaboração'
    },
    { 
      id: 4, 
      type: 'Capa', 
      description: 'Arte de Capa - Artista D', 
      value: 3500, 
      status: 'aprovado', 
      requestedBy: 'A&R João',
      date: '2024-01-08',
      project: 'Álbum Completo'
    },
    { 
      id: 5, 
      type: 'Mídia', 
      description: 'Campanha Digital - Artista E', 
      value: 12000, 
      status: 'recusado', 
      requestedBy: 'A&R Maria',
      date: '2024-01-05',
      project: 'Remix Oficial'
    },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Usar dados do estado, ou mockados se não houver dados
  const orcamentosToDisplay = orcamentos.length > 0 ? orcamentos : orcamentosMockState;

  const filteredOrcamentos = orcamentosToDisplay.filter(orc => {
    const descricao = (orc.description || orc.descricao || '').toLowerCase();
    const projeto = (orc.project || orc.projeto || '').toLowerCase();
    const status = orc.status || '';
    const matchesSearch = descricao.includes(searchTerm.toLowerCase()) ||
                         projeto.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || 
                         status.toLowerCase() === filterStatus.toLowerCase() ||
                         (filterStatus === 'pendente' && (status === 'Pendente' || status === 'pendente')) ||
                         (filterStatus === 'aprovado' && (status === 'Aprovado' || status === 'aprovado')) ||
                         (filterStatus === 'recusado' && (status === 'Recusado' || status === 'recusado'));
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pendente': 'bg-yellow-500/20 text-yellow-400',
      'aprovado': 'bg-green-500/20 text-green-400',
      'recusado': 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pendente': 'Pendente',
      'aprovado': 'Aprovado',
      'recusado': 'Recusado',
    };
    return labels[status] || status;
  };

  const handleAprovar = async (orcamentoId: number | string) => {
    if (!confirm('Tem certeza que deseja aprovar este orçamento?')) return;
    
    try {
      // Tentar atualizar no Supabase
      const { error } = await supabase
        .from('orcamentos')
        .update({ status: 'aprovado' })
        .eq('id', orcamentoId);

      if (error) throw error;

      // Se estiver usando dados mockados, atualizar localmente
      if (orcamentos.length === 0) {
        setOrcamentosMockState(prev => prev.map(orc => 
          orc.id === orcamentoId ? { ...orc, status: 'aprovado' } : orc
        ));
      } else {
        await loadOrcamentos();
      }
    } catch (error: any) {
      // Se falhar, atualizar localmente mesmo assim
      console.warn('Erro ao aprovar no banco, atualizando localmente:', error);
      if (orcamentos.length === 0) {
        setOrcamentosMockState(prev => prev.map(orc => 
          orc.id === orcamentoId ? { ...orc, status: 'aprovado' } : orc
        ));
      } else {
        setOrcamentos(prev => prev.map(orc => 
          orc.id === orcamentoId ? { ...orc, status: 'aprovado' } : orc
        ));
      }
    }
  };

  const handleRecusar = async (orcamentoId: number | string) => {
    if (!confirm('Tem certeza que deseja recusar este orçamento?')) return;
    
    try {
      // Tentar atualizar no Supabase
      const { error } = await supabase
        .from('orcamentos')
        .update({ status: 'recusado' })
        .eq('id', orcamentoId);

      if (error) throw error;

      // Se estiver usando dados mockados, atualizar localmente
      if (orcamentos.length === 0) {
        setOrcamentosMockState(prev => prev.map(orc => 
          orc.id === orcamentoId ? { ...orc, status: 'recusado' } : orc
        ));
      } else {
        await loadOrcamentos();
      }
    } catch (error: any) {
      // Se falhar, atualizar localmente mesmo assim
      console.warn('Erro ao recusar no banco, atualizando localmente:', error);
      if (orcamentos.length === 0) {
        setOrcamentosMockState(prev => prev.map(orc => 
          orc.id === orcamentoId ? { ...orc, status: 'recusado' } : orc
        ));
      } else {
        setOrcamentos(prev => prev.map(orc => 
          orc.id === orcamentoId ? { ...orc, status: 'recusado' } : orc
        ));
      }
    }
  };

  const handleVisualizar = (orcamento: any) => {
    setSelectedOrcamento(orcamento);
    setShowViewModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validar campos obrigatórios
      if (!formData.type || !formData.description || !formData.project || !formData.value) {
        alert('Por favor, preencha todos os campos obrigatórios (Tipo, Descrição, Projeto e Valor).');
        return;
      }

      // Preparar dados, removendo campos vazios e garantindo tipos corretos
      const orcamentoData: any = {
        tipo: formData.type.trim(),
        descricao: formData.description.trim(),
        titulo: formData.description.trim(), // Se a tabela tiver coluna titulo, usar descrição
        projeto: formData.project.trim(),
        valor: parseFloat(formData.value),
        status: 'pendente',
        solicitado_por: (formData.solicitante || user?.name || user?.email || 'Sistema').trim(),
        data: new Date().toISOString().split('T')[0],
      };

      // Validar valor
      if (isNaN(orcamentoData.valor) || orcamentoData.valor <= 0) {
        alert('Por favor, insira um valor válido maior que zero.');
        return;
      }

      // Adicionar campos opcionais apenas se tiverem valor
      if (formData.solicitante && formData.solicitante.trim()) {
        orcamentoData.solicitante = formData.solicitante.trim();
      }
      
      if (formData.vinculoArtista && formData.vinculoArtista.trim()) {
        orcamentoData.vinculo_artista = formData.vinculoArtista.trim();
        const artistaEncontrado = artistas.find(a => a.nome === formData.vinculoArtista);
        if (artistaEncontrado) {
          orcamentoData.artista_id = artistaEncontrado.id;
        }
      }
      
      if (formData.recuperabilidade && formData.recuperabilidade.trim()) {
        orcamentoData.recuperabilidade = formData.recuperabilidade.trim();
      }
      
      if (formData.centroCusto && formData.centroCusto.trim()) {
        orcamentoData.centro_custo = formData.centroCusto.trim();
      }
      
      if (formData.divisaoVerbas && formData.divisaoVerbas.trim()) {
        orcamentoData.divisao_verbas = formData.divisaoVerbas.trim();
      }
      
      if (formData.breakEven && formData.breakEven.trim()) {
        const breakEvenValue = parseFloat(formData.breakEven);
        if (!isNaN(breakEvenValue)) {
          orcamentoData.break_even = breakEvenValue;
        }
      }
      
      if (formData.cronogramaDesembolso && formData.cronogramaDesembolso.trim()) {
        orcamentoData.cronograma_desembolso = formData.cronogramaDesembolso.trim();
      }
      
      if (formData.reservaContingencia && formData.reservaContingencia.trim()) {
        const reservaValue = parseFloat(formData.reservaContingencia);
        if (!isNaN(reservaValue) && reservaValue >= 0 && reservaValue <= 100) {
          orcamentoData.reserva_contingencia = reservaValue;
        }
      }
      
      if (formData.auditabilidade && formData.auditabilidade.trim()) {
        orcamentoData.auditabilidade = formData.auditabilidade.trim();
      }
      
      if (formData.fluxoCaixa && formData.fluxoCaixa.trim()) {
        orcamentoData.fluxo_caixa = formData.fluxoCaixa.trim();
      }

      console.log('Dados do orçamento a serem enviados:', orcamentoData);
      console.log('JSON dos dados:', JSON.stringify(orcamentoData, null, 2));

      // Tentar inserir com todos os campos
      let { error, data } = await supabase
        .from('orcamentos')
        .insert([orcamentoData])
        .select();

      // Se der erro, tentar apenas com campos básicos para identificar o problema
      if (error) {
        console.error('Erro ao inserir com todos os campos. Tentando apenas campos básicos...');
        const camposBasicos = {
          tipo: orcamentoData.tipo,
          descricao: orcamentoData.descricao,
          projeto: orcamentoData.projeto,
          valor: orcamentoData.valor,
          status: orcamentoData.status,
          solicitado_por: orcamentoData.solicitado_por,
          data: orcamentoData.data,
        };
        
        const resultBasico = await supabase
          .from('orcamentos')
          .insert([camposBasicos])
          .select();
        
        if (resultBasico.error) {
          console.error('Erro mesmo com campos básicos:', resultBasico.error);
          console.error('Código do erro:', resultBasico.error.code);
          console.error('Mensagem do erro:', resultBasico.error.message);
          console.error('Detalhes do erro:', resultBasico.error.details);
          console.error('Hint do erro:', resultBasico.error.hint);
          throw resultBasico.error;
        } else {
          console.warn('Inserido apenas com campos básicos. Alguns campos podem não ter sido salvos.');
          data = resultBasico.data;
        }
      }

      console.log('Orçamento criado com sucesso:', data);

      // Recarregar lista de orçamentos
      await loadOrcamentos();
      
      setShowModal(false);
      setFormData({
        type: '',
        description: '',
        project: '',
        value: '',
        solicitante: '',
        vinculoArtista: '',
        recuperabilidade: '',
        centroCusto: '',
        divisaoVerbas: '',
        breakEven: '',
        cronogramaDesembolso: '',
        reservaContingencia: '',
        auditabilidade: '',
        fluxoCaixa: '',
      });
    } catch (error: any) {
      console.error('Erro ao criar orçamento:', error);
      console.error('Erro completo:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Erro ao criar orçamento.\n\n';
      
      if (error?.code) {
        errorMessage += `Código: ${error.code}\n`;
      }
      
      if (error?.message) {
        errorMessage += `Mensagem: ${error.message}\n`;
      }
      
      if (error?.details) {
        errorMessage += `\nDetalhes: ${error.details}\n`;
      }
      
      if (error?.hint) {
        errorMessage += `\nDica: ${error.hint}\n`;
      }

      // Mensagens específicas para erros comuns
      if (error?.code === '23502') {
        errorMessage += '\n⚠️ Erro: Algum campo obrigatório está faltando.';
      } else if (error?.code === '23503') {
        errorMessage += '\n⚠️ Erro: Referência inválida (ex: artista_id não existe).';
      } else if (error?.code === '23505') {
        errorMessage += '\n⚠️ Erro: Violação de constraint única.';
      } else if (error?.code === '42703') {
        errorMessage += '\n⚠️ Erro: Coluna não existe na tabela. Verifique se executou o script SQL.';
      }
      
      alert(errorMessage);
    }
  };

  const stats = [
    { label: 'Total Pendente', value: `R$ ${orcamentosToDisplay.filter(o => (o.status === 'pendente' || o.status === 'Pendente')).reduce((sum, o) => sum + (o.value || o.valor || 0), 0).toLocaleString('pt-BR')}`, icon: 'ri-time-line', color: 'from-yellow-500 to-yellow-700' },
    { label: 'Total Aprovado', value: `R$ ${orcamentosToDisplay.filter(o => (o.status === 'aprovado' || o.status === 'Aprovado')).reduce((sum, o) => sum + (o.value || o.valor || 0), 0).toLocaleString('pt-BR')}`, icon: 'ri-check-line', color: 'from-green-500 to-green-700' },
    { label: 'Aguardando Aprovação', value: orcamentosToDisplay.filter(o => (o.status === 'pendente' || o.status === 'Pendente')).length, icon: 'ri-file-list-3-line', color: 'from-primary-teal to-primary-brown' },
  ];

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Orçamentos</h1>
            <p className="text-gray-400">Gerencie orçamentos e aprovações</p>
          </div>
          <button 
            onClick={() => {
              setShowModal(true);
              // Recarregar artistas quando abrir o modal
              if (artistas.length === 0) {
                loadArtistas();
              }
            }}
            className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-add-line text-xl"></i>
            Novo Orçamento
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
                placeholder="Buscar orçamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2">
              {(['todos', 'pendente', 'aprovado', 'recusado'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-gradient-primary text-white'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orçamentos List */}
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Descrição</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Projeto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Solicitante</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Valor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Data</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrcamentos.map((orc) => (
                  <tr key={orc.id} className="border-b border-dark-border hover:bg-dark-hover transition-smooth">
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary-teal/20 text-primary-teal text-xs rounded-full font-medium whitespace-nowrap">
                        {orc.type || orc.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-medium">{orc.description || orc.descricao}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{orc.project || orc.projeto}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{orc.requestedBy || orc.solicitado_por}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white whitespace-nowrap">
                      R$ {(orc.value || orc.valor || 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(orc.status)}`}>
                        {getStatusLabel(orc.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">{orc.date || orc.data || orc.created_at?.split('T')[0]}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {(orc.status === 'pendente' || orc.status === 'Pendente') && isAdmin && (
                          <>
                            <button 
                              onClick={() => handleAprovar(orc.id)}
                              className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-smooth cursor-pointer" 
                              title="Aprovar"
                            >
                              <i className="ri-check-line text-lg"></i>
                            </button>
                            <button 
                              onClick={() => handleRecusar(orc.id)}
                              className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-smooth cursor-pointer" 
                              title="Recusar"
                            >
                              <i className="ri-close-line text-lg"></i>
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleVisualizar(orc)}
                          className="p-2 hover:bg-dark-bg rounded-lg transition-smooth cursor-pointer"
                          title="Visualizar Detalhes"
                        >
                          <i className="ri-eye-line text-gray-400 text-lg"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOrcamentos.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-file-list-3-line text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhum orçamento encontrado</p>
          </div>
        )}

        {/* Modal Novo Orçamento */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-dark-card border border-dark-border rounded-xl p-8 w-full max-w-5xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-dark-card pb-4 border-b border-dark-border">
                <h2 className="text-2xl font-semibold text-white">Novo Orçamento</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer p-2 hover:bg-dark-hover rounded-lg"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Seção: Informações Básicas */}
                <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="ri-file-text-line text-primary-teal"></i>
                    Informações Básicas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
                      <select
                        required
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="">Selecione o tipo</option>
                        <option value="Produção">Produção</option>
                        <option value="Clipe">Clipe</option>
                        <option value="Masterização">Masterização</option>
                        <option value="Capa">Capa</option>
                        <option value="Mídia">Mídia</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Valor Total (R$)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Descrição</label>
                      <input
                        type="text"
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: Produção Single - Artista A"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Projeto</label>
                      <input
                        type="text"
                        required
                        value={formData.project}
                        onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: Novo Single - Verão 2024"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Solicitante</label>
                      <input
                        type="text"
                        value={formData.solicitante}
                        onChange={(e) => setFormData({ ...formData, solicitante: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: A&R João"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Vínculo com Artista</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.vinculoArtista}
                          onChange={(e) => {
                            setFormData({ ...formData, vinculoArtista: e.target.value });
                            setShowArtistasList(true);
                          }}
                          onFocus={() => {
                            if (artistas.length > 0) {
                              setFilteredArtistas(artistas);
                              setShowArtistasList(true);
                            }
                          }}
                          onBlur={() => {
                            // Delay para permitir clique na lista
                            setTimeout(() => setShowArtistasList(false), 200);
                          }}
                          className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                          placeholder="Digite ou selecione um artista"
                          autoComplete="off"
                        />
                        {artistas.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFilteredArtistas(artistas);
                              setShowArtistasList(!showArtistasList);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-smooth cursor-pointer"
                          >
                            <i className={`ri-arrow-${showArtistasList ? 'up' : 'down'}-s-line text-lg`}></i>
                          </button>
                        )}
                        
                        {/* Lista customizada com scroll */}
                        {showArtistasList && filteredArtistas.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-dark-card border border-dark-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredArtistas.map((artista) => (
                              <button
                                key={artista.id}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, vinculoArtista: artista.nome });
                                  setShowArtistasList(false);
                                }}
                                className="w-full px-4 py-2 text-left text-white text-sm hover:bg-dark-hover transition-smooth cursor-pointer first:rounded-t-lg last:rounded-b-lg"
                              >
                                {artista.nome}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {artistas.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">Nenhum artista cadastrado</p>
                      )}
                      {artistas.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.vinculoArtista 
                            ? `${filteredArtistas.length} resultado(s) encontrado(s)` 
                            : `${artistas.length} artista(s) disponível(is)`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seção: Gestão Financeira */}
                <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="ri-money-dollar-circle-line text-primary-teal"></i>
                    Gestão Financeira
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Identificação de Recuperabilidade</label>
                      <select
                        value={formData.recuperabilidade}
                        onChange={(e) => setFormData({ ...formData, recuperabilidade: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="">Selecione</option>
                        <option value="total">Totalmente Recuperável</option>
                        <option value="parcial">Parcialmente Recuperável</option>
                        <option value="nao">Não Recuperável</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Vinculação por Centro de Custo</label>
                      <input
                        type="text"
                        value={formData.centroCusto}
                        onChange={(e) => setFormData({ ...formData, centroCusto: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: CC-001 - Produção Musical"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Divisão Estratégica de Verbas</label>
                      <textarea
                        value={formData.divisaoVerbas}
                        onChange={(e) => setFormData({ ...formData, divisaoVerbas: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                        placeholder="Descreva como as verbas serão divididas estrategicamente..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Análise Financeira */}
                <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="ri-line-chart-line text-primary-teal"></i>
                    Análise Financeira
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Cálculo de Break-even</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.breakEven}
                        onChange={(e) => setFormData({ ...formData, breakEven: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Valor em R$"
                      />
                      <p className="text-xs text-gray-500 mt-1">Ponto de equilíbrio do investimento</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Reserva de Contingência (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.reservaContingencia}
                        onChange={(e) => setFormData({ ...formData, reservaContingencia: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: 10"
                      />
                      <p className="text-xs text-gray-500 mt-1">Percentual sobre o valor total</p>
                    </div>
                  </div>
                </div>

                {/* Seção: Cronograma e Fluxo */}
                <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="ri-calendar-todo-line text-primary-teal"></i>
                    Cronograma e Fluxo de Caixa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Cronograma de Desembolso</label>
                      <textarea
                        value={formData.cronogramaDesembolso}
                        onChange={(e) => setFormData({ ...formData, cronogramaDesembolso: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                        placeholder="Ex: 30% na assinatura, 40% na entrega, 30% na finalização..."
                        rows={4}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Fluxo de Caixa</label>
                      <textarea
                        value={formData.fluxoCaixa}
                        onChange={(e) => setFormData({ ...formData, fluxoCaixa: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                        placeholder="Descreva o fluxo de caixa esperado, incluindo entradas e saídas..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Controles e Auditoria */}
                <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="ri-shield-check-line text-primary-teal"></i>
                    Controles e Auditoria
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Auditabilidade</label>
                    <textarea
                      value={formData.auditabilidade}
                      onChange={(e) => setFormData({ ...formData, auditabilidade: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                      placeholder="Descreva os controles, documentos e processos que garantem a auditabilidade do orçamento..."
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 mt-1">Documentos, comprovantes e processos de controle</p>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-3 pt-4 border-t border-dark-border">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap font-medium"
                  >
                    <i className="ri-save-line inline-block mr-2"></i>
                    Criar Orçamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Visualizar Orçamento */}
        {showViewModal && selectedOrcamento && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-dark-card border border-dark-border rounded-xl p-8 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-dark-card pb-4 border-b border-dark-border">
                <h2 className="text-2xl font-semibold text-white">Detalhes do Orçamento</h2>
                <button 
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedOrcamento(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer p-2 hover:bg-dark-hover rounded-lg"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="ri-file-text-line text-primary-teal"></i>
                    Informações Básicas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Tipo</p>
                      <p className="text-white font-medium">{selectedOrcamento.type || selectedOrcamento.tipo || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Valor Total</p>
                      <p className="text-white font-semibold text-lg">
                        R$ {(selectedOrcamento.value || selectedOrcamento.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-400 mb-1">Descrição</p>
                      <p className="text-white">{selectedOrcamento.description || selectedOrcamento.descricao || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-400 mb-1">Projeto</p>
                      <p className="text-white">{selectedOrcamento.project || selectedOrcamento.projeto || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Solicitante</p>
                      <p className="text-white">{selectedOrcamento.solicitante || selectedOrcamento.requestedBy || selectedOrcamento.solicitado_por || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Vínculo com Artista</p>
                      <p className="text-white">
                        {selectedOrcamento.vinculo_artista || selectedOrcamento.vinculoArtista || 
                         (selectedOrcamento.artista_id && artistas.find(a => a.id === selectedOrcamento.artista_id)?.nome) || 
                         '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Status</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(selectedOrcamento.status)}`}>
                        {getStatusLabel(selectedOrcamento.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Data</p>
                      <p className="text-white">{selectedOrcamento.date || selectedOrcamento.data || selectedOrcamento.created_at?.split('T')[0] || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Gestão Financeira */}
                {(selectedOrcamento.recuperabilidade || selectedOrcamento.centro_custo || selectedOrcamento.divisao_verbas) && (
                  <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <i className="ri-money-dollar-circle-line text-primary-teal"></i>
                      Gestão Financeira
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedOrcamento.recuperabilidade && (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Recuperabilidade</p>
                          <p className="text-white">
                            {selectedOrcamento.recuperabilidade === 'total' ? 'Totalmente Recuperável' :
                             selectedOrcamento.recuperabilidade === 'parcial' ? 'Parcialmente Recuperável' :
                             selectedOrcamento.recuperabilidade === 'nao' ? 'Não Recuperável' :
                             selectedOrcamento.recuperabilidade}
                          </p>
                        </div>
                      )}
                      {selectedOrcamento.centro_custo && (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Centro de Custo</p>
                          <p className="text-white">{selectedOrcamento.centro_custo}</p>
                        </div>
                      )}
                      {selectedOrcamento.divisao_verbas && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-400 mb-1">Divisão Estratégica de Verbas</p>
                          <p className="text-white whitespace-pre-wrap">{selectedOrcamento.divisao_verbas}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Análise Financeira */}
                {(selectedOrcamento.break_even || selectedOrcamento.reserva_contingencia) && (
                  <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <i className="ri-line-chart-line text-primary-teal"></i>
                      Análise Financeira
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedOrcamento.break_even && (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Break-even</p>
                          <p className="text-white font-semibold">
                            R$ {parseFloat(selectedOrcamento.break_even).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                      {selectedOrcamento.reserva_contingencia && (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Reserva de Contingência</p>
                          <p className="text-white font-semibold">{selectedOrcamento.reserva_contingencia}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cronograma e Fluxo */}
                {(selectedOrcamento.cronograma_desembolso || selectedOrcamento.fluxo_caixa) && (
                  <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <i className="ri-calendar-todo-line text-primary-teal"></i>
                      Cronograma e Fluxo de Caixa
                    </h3>
                    <div className="space-y-4">
                      {selectedOrcamento.cronograma_desembolso && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Cronograma de Desembolso</p>
                          <p className="text-white whitespace-pre-wrap">{selectedOrcamento.cronograma_desembolso}</p>
                        </div>
                      )}
                      {selectedOrcamento.fluxo_caixa && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Fluxo de Caixa</p>
                          <p className="text-white whitespace-pre-wrap">{selectedOrcamento.fluxo_caixa}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Controles e Auditoria */}
                {selectedOrcamento.auditabilidade && (
                  <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <i className="ri-shield-check-line text-primary-teal"></i>
                      Controles e Auditoria
                    </h3>
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Auditabilidade</p>
                      <p className="text-white whitespace-pre-wrap">{selectedOrcamento.auditabilidade}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-dark-border">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedOrcamento(null);
                  }}
                  className="flex-1 px-6 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}