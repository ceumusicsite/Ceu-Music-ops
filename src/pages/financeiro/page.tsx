import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type FilterTab = 'todos' | 'pendente' | 'pago' | 'atrasado';
type ViewMode = 'pagamentos' | 'orcado-realizado' | 'fluxo-caixa' | 'extrato-artista';

export default function Financeiro() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [viewMode, setViewMode] = useState<ViewMode>('pagamentos');
  const [activeTab, setActiveTab] = useState<FilterTab>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtistaId, setSelectedArtistaId] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState<any>(null);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [artistas, setArtistas] = useState<any[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    description: '',
    value: '',
    dueDate: '',
    budget: '',
    installment: '1/1',
    categoria: '',
    fornecedor: '',
    metodoPagamento: 'pix',
    observacoes: '',
    valorOrcado: '',
    artistaId: '',
    projetoId: '',
    orcamentoId: '',
    tipoMovimentacao: 'saida',
    categoriaFluxoCaixa: '',
    descricaoDetalhada: '',
    categoriaFinanceira: '',
    dataPrevistaPagamento: '',
  });

  useEffect(() => {
    loadPagamentos();
    loadOrcamentos();
    loadArtistas();
    loadProjetos();

    // Verificar se veio da página de orçamentos
    const state = location.state as any;
    if (state?.fromOrcamento && state?.orcamentoData) {
      const data = state.orcamentoData;
      setFormData({
        description: data.description || '',
        value: data.value || '',
        dueDate: '',
        budget: data.budget || '',
        installment: '1/1',
        categoria: data.categoriaFinanceira || '',
        fornecedor: '',
        metodoPagamento: 'pix',
        observacoes: '',
        valorOrcado: data.valorOrcado || '',
        artistaId: data.artistaId || '',
        projetoId: '',
        orcamentoId: data.orcamentoId || '',
        tipoMovimentacao: 'saida',
        categoriaFluxoCaixa: data.categoriaFinanceira || '',
        descricaoDetalhada: data.descricaoDetalhada || '',
        categoriaFinanceira: data.categoriaFinanceira || '',
        dataPrevistaPagamento: '',
      });
      setShowModal(true);
      // Limpar o state para não reabrir o modal ao recarregar
      window.history.replaceState({}, document.title);
    }

    // Filtrar por orçamento se especificado
    if (state?.filterByOrcamento) {
      // Você pode adicionar lógica para filtrar aqui se desejar
      const orcamentoId = state.filterByOrcamento;
      setSearchTerm(`ORÇ-${String(orcamentoId).substring(0, 8)}`);
    }
  }, [location.state]);

  const loadPagamentos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pagamentos')
        .select(`
          *,
          artista:artista_id(id, nome),
          projeto:projeto_id(id, nome),
          orcamento_rel:orcamento_id(id, descricao, valor)
        `)
        .order('data_vencimento', { ascending: false });

      if (error) throw error;

      if (data) {
        setPagamentos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      // Se a tabela não existir, usar dados mockados
      setPagamentos([
    { 
      id: 1, 
          descricao: 'Produção Musical - Artista A', 
          valor: 15000, 
      status: 'pago',
          data_vencimento: '2024-01-20',
          data_pagamento: '2024-01-18',
          orcamento: 'ORÇ-001',
          parcela: '1/1',
          comprovante_url: 'https://example.com/receipt1.pdf'
    },
    { 
      id: 2, 
          descricao: 'Clipe Oficial - Artista B', 
          valor: 17500, 
      status: 'pendente',
          data_vencimento: '2024-01-25',
          data_pagamento: null,
          orcamento: 'ORÇ-002',
          parcela: '1/2',
          comprovante_url: null
    },
    { 
      id: 3, 
          descricao: 'Clipe Oficial - Artista B', 
          valor: 17500, 
      status: 'pendente',
          data_vencimento: '2024-02-25',
          data_pagamento: null,
          orcamento: 'ORÇ-002',
          parcela: '2/2',
          comprovante_url: null
    },
    { 
      id: 4, 
          descricao: 'Masterização - Artista C', 
          valor: 8000, 
      status: 'pago',
          data_vencimento: '2024-01-15',
          data_pagamento: '2024-01-14',
          orcamento: 'ORÇ-003',
          parcela: '1/1',
          comprovante_url: 'https://example.com/receipt2.pdf'
    },
    { 
      id: 5, 
          descricao: 'Arte de Capa - Artista D', 
          valor: 3500, 
      status: 'atrasado',
          data_vencimento: '2024-01-10',
          data_pagamento: null,
          orcamento: 'ORÇ-004',
          parcela: '1/1',
          comprovante_url: null
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrcamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('id, descricao, tipo, valor')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setOrcamentos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
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

  const filteredPagamentos = pagamentos.filter(pag => {
    const descricao = pag.descricao || pag.description || '';
    const orcamento = pag.orcamento || pag.budget || '';
    const matchesSearch = descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         orcamento.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Verificar se está atrasado
    let status = pag.status || 'pendente';
    if (status === 'pendente') {
      const vencimento = pag.data_vencimento || pag.dueDate;
      if (vencimento) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataVenc = new Date(vencimento);
        if (dataVenc < hoje) {
          status = 'atrasado';
        }
      }
    }
    
    const matchesTab = activeTab === 'todos' || status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pendente': 'bg-yellow-500/20 text-yellow-400',
      'pago': 'bg-green-500/20 text-green-400',
      'atrasado': 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pendente': 'Pendente',
      'pago': 'Pago',
      'atrasado': 'Atrasado',
    };
    return labels[status] || status;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const valor = parseFloat(formData.value);
      if (isNaN(valor) || valor <= 0) {
        alert('Por favor, insira um valor válido.');
        return;
      }

      const pagamentoData: any = {
        descricao: formData.description.trim(),
        valor: valor,
        data_vencimento: formData.dueDate,
        orcamento: formData.budget.trim(),
        parcela: formData.installment.trim(),
        status: 'pendente',
        tipo_movimentacao: formData.tipoMovimentacao || 'saida',
      };

      // Campos opcionais básicos
      if (formData.categoria) pagamentoData.categoria = formData.categoria.trim();
      if (formData.fornecedor) pagamentoData.fornecedor = formData.fornecedor.trim();
      if (formData.metodoPagamento) pagamentoData.metodo_pagamento = formData.metodoPagamento;
      if (formData.observacoes) pagamentoData.observacoes = formData.observacoes.trim();

      // Novos campos - Orçado vs Realizado
      if (formData.valorOrcado) {
        const valorOrcado = parseFloat(formData.valorOrcado);
        if (!isNaN(valorOrcado)) {
          pagamentoData.valor_orcado = valorOrcado;
          pagamentoData.valor_realizado = valor; // Valor inserido é o realizado
        }
      }
      if (formData.orcamentoId) pagamentoData.orcamento_id = formData.orcamentoId;

      // Novos campos - Fluxo de Caixa
      if (formData.dataPrevistaPagamento) pagamentoData.data_prevista_pagamento = formData.dataPrevistaPagamento;
      if (formData.categoriaFluxoCaixa) pagamentoData.categoria_fluxo_caixa = formData.categoriaFluxoCaixa.trim();

      // Novos campos - Extrato do Artista
      if (formData.artistaId) pagamentoData.artista_id = formData.artistaId;
      if (formData.projetoId) pagamentoData.projeto_id = formData.projetoId;
      if (formData.descricaoDetalhada) pagamentoData.descricao_detalhada = formData.descricaoDetalhada.trim();
      if (formData.categoriaFinanceira) pagamentoData.categoria_financeira = formData.categoriaFinanceira.trim();

      const { error } = await supabase
        .from('pagamentos')
        .insert([pagamentoData]);

      if (error) throw error;

      await loadPagamentos();
      
      setShowModal(false);
      setFormData({
        description: '',
        value: '',
        dueDate: '',
        budget: '',
        installment: '1/1',
        categoria: '',
        fornecedor: '',
        metodoPagamento: 'pix',
        observacoes: '',
        valorOrcado: '',
        artistaId: '',
        projetoId: '',
        orcamentoId: '',
        tipoMovimentacao: 'saida',
        categoriaFluxoCaixa: '',
        descricaoDetalhada: '',
        categoriaFinanceira: '',
        dataPrevistaPagamento: '',
      });
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      alert(`Erro ao criar pagamento: ${error.message || 'Verifique o console para mais detalhes.'}`);
    }
  };

  const handleMarcarComoPago = async (pagamento: any) => {
    if (!confirm('Deseja marcar este pagamento como pago?')) return;

    try {
      const hoje = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('pagamentos')
        .update({ 
          status: 'pago',
          data_pagamento: hoje
        })
        .eq('id', pagamento.id);

      if (error) throw error;

      await loadPagamentos();
    } catch (error: any) {
      console.error('Erro ao marcar como pago:', error);
      alert(`Erro ao marcar como pago: ${error.message || 'Verifique o console para mais detalhes.'}`);
    }
  };

  const handleVisualizar = (pagamento: any) => {
    setSelectedPagamento(pagamento);
    setShowViewModal(true);
  };

  const handleUploadComprovante = (pagamento: any) => {
    setSelectedPagamento(pagamento);
    setShowUploadModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPagamento) return;

    try {
      setUploading(true);
      
      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `comprovantes/${selectedPagamento.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(fileName);

      // Atualizar pagamento com URL do comprovante
      const { error: updateError } = await supabase
        .from('pagamentos')
        .update({ comprovante_url: data.publicUrl })
        .eq('id', selectedPagamento.id);

      if (updateError) throw updateError;

      await loadPagamentos();
      setShowUploadModal(false);
      setSelectedPagamento(null);
      alert('Comprovante enviado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      alert(`Erro ao fazer upload: ${error.message || 'Verifique o console para mais detalhes.'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleExportarRelatorio = () => {
    const csvContent = [
      ['Orçamento', 'Descrição', 'Parcela', 'Valor', 'Vencimento', 'Pagamento', 'Status', 'Categoria', 'Fornecedor', 'Método'].join(','),
      ...filteredPagamentos.map(pag => {
        const descricao = (pag.descricao || pag.description || '').replace(/"/g, '""');
        const orcamento = (pag.orcamento || pag.budget || '').replace(/"/g, '""');
        const parcela = (pag.parcela || pag.installment || '').replace(/"/g, '""');
        const valor = (pag.valor || pag.value || 0).toFixed(2);
        const vencimento = pag.data_vencimento || pag.dueDate || '';
        const pagamento = pag.data_pagamento || pag.paidDate || '';
        const status = pag.status || '';
        const categoria = (pag.categoria || '').replace(/"/g, '""');
        const fornecedor = (pag.fornecedor || '').replace(/"/g, '""');
        const metodo = (pag.metodo_pagamento || '').replace(/"/g, '""');
        return `"${orcamento}","${descricao}","${parcela}","${valor}","${vencimento}","${pagamento}","${status}","${categoria}","${fornecedor}","${metodo}"`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPendente = pagamentos
    .filter(p => {
      const status = p.status || 'pendente';
      if (status === 'pendente') {
        const vencimento = p.data_vencimento || p.dueDate;
        if (vencimento) {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const dataVenc = new Date(vencimento);
          return dataVenc >= hoje;
        }
      }
      return status === 'pendente';
    })
    .reduce((sum, p) => sum + (p.valor || p.value || 0), 0);
  
  const totalPago = pagamentos
    .filter(p => (p.status === 'pago' || p.status === 'Pago'))
    .reduce((sum, p) => sum + (p.valor || p.value || 0), 0);
  
  const totalAtrasado = pagamentos
    .filter(p => {
      const status = p.status || 'pendente';
      if (status === 'pendente') {
        const vencimento = p.data_vencimento || p.dueDate;
        if (vencimento) {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const dataVenc = new Date(vencimento);
          return dataVenc < hoje;
        }
      }
      return status === 'atrasado' || p.status === 'Atrasado';
    })
    .reduce((sum, p) => sum + (p.valor || p.value || 0), 0);

  // Cálculos para Orçado vs Realizado
  const totalOrcado = pagamentos.reduce((sum, p) => sum + (p.valor_orcado || 0), 0);
  const totalRealizado = pagamentos.reduce((sum, p) => sum + (p.valor_realizado || p.valor || 0), 0);
  const diferencaOrcadoRealizado = totalRealizado - totalOrcado;

  // Cálculos para Fluxo de Caixa
  const entradas = pagamentos
    .filter(p => (p.tipo_movimentacao === 'entrada' || p.tipo_movimentacao === 'Entrada') && p.status === 'pago')
    .reduce((sum, p) => sum + (p.valor || 0), 0);
  const saidas = pagamentos
    .filter(p => (p.tipo_movimentacao === 'saida' || p.tipo_movimentacao === 'Saida' || !p.tipo_movimentacao) && p.status === 'pago')
    .reduce((sum, p) => sum + (p.valor || 0), 0);
  const saldoFluxoCaixa = entradas - saidas;

  // Filtrar pagamentos por artista para extrato
  const pagamentosArtista = selectedArtistaId 
    ? pagamentos.filter(p => p.artista_id === selectedArtistaId)
    : [];

  const stats = [
    { label: 'Total Pago', value: `R$ ${totalPago.toLocaleString('pt-BR')}`, icon: 'ri-check-double-line', color: 'from-green-500 to-green-700' },
    { label: 'Total Pendente', value: `R$ ${totalPendente.toLocaleString('pt-BR')}`, icon: 'ri-time-line', color: 'from-yellow-500 to-yellow-700' },
    { label: 'Total Atrasado', value: `R$ ${totalAtrasado.toLocaleString('pt-BR')}`, icon: 'ri-alert-line', color: 'from-red-500 to-red-700' },
  ];

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Financeiro</h1>
            <p className="text-gray-400">Controle de pagamentos e comprovantes</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <i className="ri-add-line text-xl"></i>
              Novo Pagamento
            </button>
            <button 
              onClick={handleExportarRelatorio}
              className="px-6 py-3 bg-dark-bg border border-dark-border text-white font-medium rounded-lg hover:bg-dark-hover transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
            <i className="ri-download-line text-xl"></i>
            Exportar Relatório
          </button>
          </div>
        </div>

        {/* Abas de Visualização */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-2 mb-6">
          <div className="flex gap-2">
            {[
              { id: 'pagamentos', label: 'Pagamentos', icon: 'ri-money-dollar-circle-line' },
              { id: 'orcado-realizado', label: 'Orçado vs Realizado', icon: 'ri-bar-chart-line' },
              { id: 'fluxo-caixa', label: 'Fluxo de Caixa', icon: 'ri-flow-chart-line' },
              { id: 'extrato-artista', label: 'Extrato do Artista', icon: 'ri-file-list-3-line' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as ViewMode)}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer flex items-center justify-center gap-2 ${
                  viewMode === tab.id
                    ? 'bg-gradient-primary text-white'
                    : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover'
                }`}
              >
                <i className={`${tab.icon} text-lg`}></i>
                {tab.label}
              </button>
            ))}
          </div>
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

        {/* Visualização: Pagamentos */}
        {viewMode === 'pagamentos' && (
          <>
        {/* Filters */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="text"
                placeholder="Buscar pagamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2">
              {(['todos', 'pendente', 'pago', 'atrasado'] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-gradient-primary text-white'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pagamentos List */}
        {loading ? (
          <div className="bg-dark-card border border-dark-border rounded-xl p-12 text-center">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin mb-4"></i>
            <p className="text-gray-400">Carregando pagamentos...</p>
          </div>
        ) : (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Orçamento</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Descrição</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Parcela</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Valor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Vencimento</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Pagamento</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                  {filteredPagamentos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <i className="ri-money-dollar-circle-line text-6xl text-gray-600 mb-4"></i>
                        <p className="text-gray-400">Nenhum pagamento encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPagamentos.map((pag) => {
                  const status = pag.status || 'pendente';
                  const descricao = pag.descricao || pag.description || '';
                  const orcamento = pag.orcamento || pag.budget || '';
                  const parcela = pag.parcela || pag.installment || '';
                  const valor = pag.valor || pag.value || 0;
                  const vencimento = pag.data_vencimento || pag.dueDate || '';
                  const pagamento = pag.data_pagamento || pag.paidDate || '';
                  const comprovante = pag.comprovante_url || null;
                  
                  // Verificar se está atrasado
                  let statusFinal = status;
                  if (status === 'pendente' && vencimento) {
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    const dataVenc = new Date(vencimento);
                    if (dataVenc < hoje) {
                      statusFinal = 'atrasado';
                    }
                  }

                  const formatDate = (dateStr: string) => {
                    if (!dateStr) return '-';
                    try {
                      const date = new Date(dateStr);
                      return date.toLocaleDateString('pt-BR');
                    } catch {
                      return dateStr;
                    }
                  };

                  return (
                  <tr key={pag.id} className="border-b border-dark-border hover:bg-dark-hover transition-smooth">
                    <td className="px-6 py-4">
                        <span className="text-sm font-medium text-primary-teal">{orcamento}</span>
                    </td>
                      <td className="px-6 py-4 text-sm text-white">{descricao}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-dark-bg text-gray-400 text-xs rounded-full whitespace-nowrap">
                          {parcela}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white whitespace-nowrap">
                        R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                      <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">{formatDate(vencimento)}</td>
                      <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">{formatDate(pagamento)}</td>
                    <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(statusFinal)}`}>
                          {getStatusLabel(statusFinal)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVisualizar(pag)}
                            className="p-2 hover:bg-primary-teal/20 text-primary-teal rounded-lg transition-smooth cursor-pointer"
                            title="Ver detalhes"
                          >
                            <i className="ri-eye-line text-lg"></i>
                          </button>
                          {statusFinal !== 'pago' && isAdmin && (
                            <button
                              onClick={() => handleMarcarComoPago(pag)}
                              className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-smooth cursor-pointer"
                              title="Marcar como pago"
                            >
                            <i className="ri-check-line text-lg"></i>
                            </button>
                          )}
                          {comprovante && (
                            <button
                              onClick={() => window.open(comprovante, '_blank')}
                              className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-smooth cursor-pointer"
                              title="Ver comprovante"
                            >
                            <i className="ri-file-text-line text-lg"></i>
                          </button>
                        )}
                          {!comprovante && statusFinal === 'pago' && (
                            <button
                              onClick={() => handleUploadComprovante(pag)}
                              className="p-2 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-smooth cursor-pointer"
                              title="Upload comprovante"
                            >
                            <i className="ri-upload-line text-lg"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </>
        )}

        {/* Visualização: Orçado vs Realizado */}
        {viewMode === 'orcado-realizado' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <i className="ri-file-list-3-line text-2xl text-white"></i>
                  </div>
                  <span className="text-2xl font-bold text-white">R$ {totalOrcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <p className="text-sm text-gray-400">Total Orçado</p>
              </div>
              <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                    <i className="ri-check-double-line text-2xl text-white"></i>
                  </div>
                  <span className="text-2xl font-bold text-white">R$ {totalRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <p className="text-sm text-gray-400">Total Realizado</p>
              </div>
              <div className={`bg-dark-card border border-dark-border rounded-xl p-6 ${diferencaOrcadoRealizado >= 0 ? 'border-green-500/50' : 'border-red-500/50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${diferencaOrcadoRealizado >= 0 ? 'from-green-500 to-green-700' : 'from-red-500 to-red-700'} flex items-center justify-center`}>
                    <i className={`ri-${diferencaOrcadoRealizado >= 0 ? 'arrow-up' : 'arrow-down'}-line text-2xl text-white`}></i>
                  </div>
                  <span className={`text-2xl font-bold ${diferencaOrcadoRealizado >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {Math.abs(diferencaOrcadoRealizado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-sm text-gray-400">Diferença</p>
              </div>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-bg border-b border-dark-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Descrição</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Orçado</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Realizado</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Diferença</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos.filter(p => p.valor_orcado || p.valor_realizado).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <i className="ri-bar-chart-line text-6xl text-gray-600 mb-4"></i>
                          <p className="text-gray-400">Nenhum pagamento com controle orçado vs realizado</p>
                        </td>
                      </tr>
                    ) : (
                      pagamentos
                        .filter(p => p.valor_orcado || p.valor_realizado)
                        .map((pag) => {
                          const orcado = pag.valor_orcado || 0;
                          const realizado = pag.valor_realizado || pag.valor || 0;
                          const diferenca = realizado - orcado;
                          return (
                            <tr key={pag.id} className="border-b border-dark-border hover:bg-dark-hover transition-smooth">
                              <td className="px-6 py-4 text-sm text-white">{pag.descricao || pag.description || '-'}</td>
                              <td className="px-6 py-4 text-sm text-white">R$ {orcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className="px-6 py-4 text-sm text-white">R$ {realizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className={`px-6 py-4 text-sm font-semibold ${diferenca >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                R$ {Math.abs(diferenca).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pag.status || 'pendente')}`}>
                                  {getStatusLabel(pag.status || 'pendente')}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Visualização: Fluxo de Caixa */}
        {viewMode === 'fluxo-caixa' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                    <i className="ri-arrow-down-line text-2xl text-white"></i>
                  </div>
                  <span className="text-2xl font-bold text-green-400">R$ {entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <p className="text-sm text-gray-400">Entradas</p>
              </div>
              <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                    <i className="ri-arrow-up-line text-2xl text-white"></i>
                  </div>
                  <span className="text-2xl font-bold text-red-400">R$ {saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <p className="text-sm text-gray-400">Saídas</p>
              </div>
              <div className={`bg-dark-card border border-dark-border rounded-xl p-6 ${saldoFluxoCaixa >= 0 ? 'border-green-500/50' : 'border-red-500/50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${saldoFluxoCaixa >= 0 ? 'from-green-500 to-green-700' : 'from-red-500 to-red-700'} flex items-center justify-center`}>
                    <i className="ri-wallet-line text-2xl text-white"></i>
                  </div>
                  <span className={`text-2xl font-bold ${saldoFluxoCaixa >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {Math.abs(saldoFluxoCaixa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-sm text-gray-400">Saldo</p>
              </div>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-bg border-b border-dark-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Data</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Tipo</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Descrição</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Categoria</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Valor</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <i className="ri-flow-chart-line text-6xl text-gray-600 mb-4"></i>
                          <p className="text-gray-400">Nenhum movimento encontrado</p>
                        </td>
                      </tr>
                    ) : (
                      pagamentos
                        .sort((a, b) => {
                          const dataA = a.data_prevista_pagamento || a.data_vencimento || a.data_pagamento || '';
                          const dataB = b.data_prevista_pagamento || b.data_vencimento || b.data_pagamento || '';
                          return new Date(dataB).getTime() - new Date(dataA).getTime();
                        })
                        .map((pag) => {
                          const tipo = pag.tipo_movimentacao || 'saida';
                          const isEntrada = tipo === 'entrada' || tipo === 'Entrada';
                          const data = pag.data_prevista_pagamento || pag.data_pagamento || pag.data_vencimento || '';
                          return (
                            <tr key={pag.id} className="border-b border-dark-border hover:bg-dark-hover transition-smooth">
                              <td className="px-6 py-4 text-sm text-gray-400">
                                {data ? new Date(data).toLocaleDateString('pt-BR') : '-'}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  isEntrada ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {isEntrada ? 'Entrada' : 'Saída'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-white">{pag.descricao || pag.description || '-'}</td>
                              <td className="px-6 py-4 text-sm text-gray-400">{pag.categoria_fluxo_caixa || pag.categoria || '-'}</td>
                              <td className={`px-6 py-4 text-sm font-semibold ${isEntrada ? 'text-green-400' : 'text-red-400'}`}>
                                {isEntrada ? '+' : '-'} R$ {(pag.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pag.status || 'pendente')}`}>
                                  {getStatusLabel(pag.status || 'pendente')}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Visualização: Extrato do Artista */}
        {viewMode === 'extrato-artista' && (
          <div className="space-y-6">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Selecione o Artista</label>
              <select
                value={selectedArtistaId}
                onChange={(e) => setSelectedArtistaId(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              >
                <option value="">Todos os artistas</option>
                {artistas.map((artista) => (
                  <option key={artista.id} value={artista.id}>{artista.nome}</option>
                ))}
              </select>
            </div>

            {selectedArtistaId && (
              <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Extrato: {artistas.find(a => a.id === selectedArtistaId)?.nome || 'Artista'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total de Receitas</p>
                    <p className="text-2xl font-bold text-green-400">
                      R$ {pagamentosArtista
                        .filter(p => (p.tipo_movimentacao === 'entrada' || p.tipo_movimentacao === 'Entrada') && p.status === 'pago')
                        .reduce((sum, p) => sum + (p.valor || 0), 0)
                        .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total de Despesas</p>
                    <p className="text-2xl font-bold text-red-400">
                      R$ {pagamentosArtista
                        .filter(p => (p.tipo_movimentacao === 'saida' || p.tipo_movimentacao === 'Saida' || !p.tipo_movimentacao) && p.status === 'pago')
                        .reduce((sum, p) => sum + (p.valor || 0), 0)
                        .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dark-bg border-b border-dark-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Data</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Descrição</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Categoria</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Tipo</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Valor</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagamentosArtista.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <i className="ri-file-list-3-line text-6xl text-gray-600 mb-4"></i>
                            <p className="text-gray-400">Nenhum pagamento encontrado para este artista</p>
                          </td>
                        </tr>
                      ) : (
                        pagamentosArtista
                          .sort((a, b) => {
                            const dataA = a.data_pagamento || a.data_vencimento || '';
                            const dataB = b.data_pagamento || b.data_vencimento || '';
                            return new Date(dataB).getTime() - new Date(dataA).getTime();
                          })
                          .map((pag) => {
                            const tipo = pag.tipo_movimentacao || 'saida';
                            const isEntrada = tipo === 'entrada' || tipo === 'Entrada';
                            const data = pag.data_pagamento || pag.data_vencimento || '';
                            return (
                              <tr key={pag.id} className="border-b border-dark-border hover:bg-dark-hover transition-smooth">
                                <td className="px-6 py-4 text-sm text-gray-400">
                                  {data ? new Date(data).toLocaleDateString('pt-BR') : '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-white">
                                  {pag.descricao_detalhada || pag.descricao || pag.description || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400">
                                  {pag.categoria_financeira || pag.categoria || '-'}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    isEntrada ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {isEntrada ? 'Receita' : 'Despesa'}
                                  </span>
                                </td>
                                <td className={`px-6 py-4 text-sm font-semibold ${isEntrada ? 'text-green-400' : 'text-red-400'}`}>
                                  {isEntrada ? '+' : '-'} R$ {(pag.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pag.status || 'pendente')}`}>
                                    {getStatusLabel(pag.status || 'pendente')}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                      )}
              </tbody>
            </table>
          </div>
        </div>
            )}

            {!selectedArtistaId && (
              <div className="bg-dark-card border border-dark-border rounded-xl p-12 text-center">
                <i className="ri-user-star-line text-6xl text-gray-600 mb-4"></i>
                <p className="text-gray-400">Selecione um artista para visualizar o extrato</p>
              </div>
            )}
          </div>
        )}

        {/* Modal Novo Pagamento */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-4xl my-8 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">Novo Pagamento</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Descrição *</label>
                    <input
                      type="text"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: Produção Musical - Artista A"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Valor (R$) *</label>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Data de Vencimento *</label>
                    <input
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Orçamento *</label>
                    <input
                      type="text"
                      list="orcamentos-list"
                      required
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: ORÇ-001"
                    />
                    <datalist id="orcamentos-list">
                      {orcamentos.map((orc) => (
                        <option key={orc.id} value={orc.descricao || orc.tipo || ''} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Parcela *</label>
                    <input
                      type="text"
                      required
                      value={formData.installment}
                      onChange={(e) => setFormData({ ...formData, installment: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: 1/1 ou 1/3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Categoria</label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    >
                      <option value="">Selecione...</option>
                      <option value="Produção">Produção</option>
                      <option value="Clipe">Clipe</option>
                      <option value="Masterização">Masterização</option>
                      <option value="Arte">Arte</option>
                      <option value="Mídia">Mídia</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Fornecedor</label>
                    <input
                      type="text"
                      value={formData.fornecedor}
                      onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Nome do fornecedor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Método de Pagamento</label>
                    <select
                      value={formData.metodoPagamento}
                      onChange={(e) => setFormData({ ...formData, metodoPagamento: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    >
                      <option value="pix">PIX</option>
                      <option value="ted">TED</option>
                      <option value="doc">DOC</option>
                      <option value="boleto">Boleto</option>
                      <option value="transferencia">Transferência</option>
                      <option value="dinheiro">Dinheiro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Observações adicionais sobre o pagamento..."
                  />
                </div>

                {/* Seção: Orçado vs Realizado */}
                <div className="border-t border-dark-border pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Orçado vs Realizado</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Valor Orçado (R$)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.valorOrcado}
                        onChange={(e) => setFormData({ ...formData, valorOrcado: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Orçamento (ID)</label>
                      <select
                        value={formData.orcamentoId}
                        onChange={(e) => setFormData({ ...formData, orcamentoId: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      >
                        <option value="">Selecione um orçamento...</option>
                        {orcamentos.map((orc) => (
                          <option key={orc.id} value={orc.id}>
                            {orc.descricao || orc.tipo || `Orçamento ${orc.id.substring(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Seção: Fluxo de Caixa */}
                <div className="border-t border-dark-border pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Fluxo de Caixa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Tipo de Movimentação</label>
                      <select
                        value={formData.tipoMovimentacao}
                        onChange={(e) => setFormData({ ...formData, tipoMovimentacao: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      >
                        <option value="saida">Saída</option>
                        <option value="entrada">Entrada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Data Prevista de Pagamento</label>
                      <input
                        type="date"
                        value={formData.dataPrevistaPagamento}
                        onChange={(e) => setFormData({ ...formData, dataPrevistaPagamento: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Categoria Fluxo de Caixa</label>
                      <input
                        type="text"
                        value={formData.categoriaFluxoCaixa}
                        onChange={(e) => setFormData({ ...formData, categoriaFluxoCaixa: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: Produção, Marketing, Operacional..."
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Extrato do Artista */}
                <div className="border-t border-dark-border pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Extrato do Artista</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Artista</label>
                      <select
                        value={formData.artistaId}
                        onChange={(e) => setFormData({ ...formData, artistaId: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      >
                        <option value="">Selecione um artista...</option>
                        {artistas.map((artista) => (
                          <option key={artista.id} value={artista.id}>{artista.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Projeto</label>
                      <select
                        value={formData.projetoId}
                        onChange={(e) => setFormData({ ...formData, projetoId: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      >
                        <option value="">Selecione um projeto...</option>
                        {projetos
                          .filter(p => !formData.artistaId || p.artista_id === formData.artistaId)
                          .map((projeto) => (
                            <option key={projeto.id} value={projeto.id}>{projeto.nome}</option>
                          ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Descrição Detalhada</label>
                      <textarea
                        value={formData.descricaoDetalhada}
                        onChange={(e) => setFormData({ ...formData, descricaoDetalhada: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                        placeholder="Descrição detalhada para o extrato do artista..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Categoria Financeira</label>
                      <input
                        type="text"
                        value={formData.categoriaFinanceira}
                        onChange={(e) => setFormData({ ...formData, categoriaFinanceira: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: Receita, Despesa Operacional, Investimento..."
                      />
                    </div>
                  </div>
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
                    Criar Pagamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Visualizar Pagamento */}
        {showViewModal && selectedPagamento && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">Detalhes do Pagamento</h2>
                <button 
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedPagamento(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Descrição</p>
                    <p className="text-white font-medium">{selectedPagamento.descricao || selectedPagamento.description || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Valor</p>
                    <p className="text-white font-semibold text-lg">
                      R$ {(selectedPagamento.valor || selectedPagamento.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Orçamento</p>
                    <p className="text-primary-teal font-medium">{selectedPagamento.orcamento || selectedPagamento.budget || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Parcela</p>
                    <p className="text-white">{selectedPagamento.parcela || selectedPagamento.installment || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Data de Vencimento</p>
                    <p className="text-white">
                      {selectedPagamento.data_vencimento || selectedPagamento.dueDate 
                        ? new Date(selectedPagamento.data_vencimento || selectedPagamento.dueDate).toLocaleDateString('pt-BR')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Data de Pagamento</p>
                    <p className="text-white">
                      {selectedPagamento.data_pagamento || selectedPagamento.paidDate
                        ? new Date(selectedPagamento.data_pagamento || selectedPagamento.paidDate).toLocaleDateString('pt-BR')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPagamento.status || 'pendente')}`}>
                      {getStatusLabel(selectedPagamento.status || 'pendente')}
                    </span>
                  </div>
                  {selectedPagamento.categoria && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Categoria</p>
                      <p className="text-white">{selectedPagamento.categoria}</p>
                    </div>
                  )}
                  {selectedPagamento.fornecedor && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Fornecedor</p>
                      <p className="text-white">{selectedPagamento.fornecedor}</p>
                    </div>
                  )}
                  {selectedPagamento.metodo_pagamento && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Método de Pagamento</p>
                      <p className="text-white capitalize">{selectedPagamento.metodo_pagamento}</p>
                    </div>
                  )}
                </div>
                {selectedPagamento.observacoes && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Observações</p>
                    <p className="text-white">{selectedPagamento.observacoes}</p>
                  </div>
                )}
                {selectedPagamento.comprovante_url && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Comprovante</p>
                    <a
                      href={selectedPagamento.comprovante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-teal/20 text-primary-teal rounded-lg hover:bg-primary-teal/30 transition-smooth"
                    >
                      <i className="ri-file-text-line"></i>
                      Ver Comprovante
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Upload Comprovante */}
        {showUploadModal && selectedPagamento && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Upload de Comprovante</h2>
                <button 
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedPagamento(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">
                    Pagamento: <span className="text-white">{selectedPagamento.descricao || selectedPagamento.description}</span>
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Valor: <span className="text-white font-semibold">
                      R$ {(selectedPagamento.valor || selectedPagamento.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Selecione o arquivo</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-teal file:text-white hover:file:bg-primary-brown cursor-pointer disabled:opacity-50"
                  />
                  <p className="text-xs text-gray-500 mt-2">Formatos aceitos: PDF, JPG, PNG</p>
                </div>

                {uploading && (
                  <div className="text-center py-4">
                    <i className="ri-loader-4-line text-2xl text-primary-teal animate-spin"></i>
                    <p className="text-sm text-gray-400 mt-2">Enviando comprovante...</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedPagamento(null);
                    }}
                    disabled={uploading}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    Cancelar
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