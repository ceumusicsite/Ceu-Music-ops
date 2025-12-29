import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type FilterTab = 'todos' | 'pendente' | 'pago' | 'atrasado';

interface Pagamento {
  id: string;
  orcamento_id: string;
  categoria: 'estudio' | 'produtor' | 'mixagem' | 'masterizacao';
  descricao?: string;
  valor: number;
  status: 'pago' | 'pendente';
  data_vencimento?: string;
  data_pagamento?: string;
  created_at: string;
  orcamento?: {
    projeto?: { nome: string };
  };
}

interface Orcamento {
  id: string;
  projeto_id: string;
  valor_total: number;
  projeto?: { nome: string };
}

const categoriasLabels: Record<string, string> = {
  'estudio': 'Estúdio',
  'produtor': 'Produtor',
  'mixagem': 'Mixagem',
  'masterizacao': 'Masterização'
};

export default function Financeiro() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const orcamentoIdParam = searchParams.get('orcamento_id');
  
  // Verificar permissão
  if (!user || !['admin', 'financeiro'].includes(user.role)) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-error-warning-line text-6xl text-red-400 mb-4"></i>
            <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
            <p className="text-gray-400">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  const [activeTab, setActiveTab] = useState<FilterTab>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    orcamento_id: orcamentoIdParam || '',
    categoria: 'estudio' as 'estudio' | 'produtor' | 'mixagem' | 'masterizacao',
    descricao: '',
    valor: '',
    data_vencimento: '',
    status: 'pendente' as 'pago' | 'pendente',
    data_pagamento: ''
  });

  useEffect(() => {
    loadData();
  }, [orcamentoIdParam]);

  const loadData = async () => {
    try {
      let query = supabase
        .from('pagamentos')
        .select('*, orcamento:orcamento_id(projeto:projeto_id(nome))')
        .order('created_at', { ascending: false });

      if (orcamentoIdParam) {
        query = query.eq('orcamento_id', orcamentoIdParam);
      }

      const { data: pagamentosData, error: pagamentosError } = await query;

      if (pagamentosError && pagamentosError.code !== 'PGRST116') {
        throw pagamentosError;
      }

      if (pagamentosData) {
        // Verificar pagamentos atrasados
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const pagamentosComStatus = pagamentosData.map((pag: any) => {
          if (pag.status === 'pendente' && pag.data_vencimento) {
            const vencimento = new Date(pag.data_vencimento);
            vencimento.setHours(0, 0, 0, 0);
            if (vencimento < hoje) {
              return { ...pag, status_temporario: 'atrasado' };
            }
          }
          return { ...pag, status_temporario: pag.status };
        });

        setPagamentos(pagamentosComStatus as any);
      }

      // Carregar orçamentos para o select
      const { data: orcamentosData } = await supabase
        .from('orcamentos')
        .select('id, projeto_id, valor_total, projeto:projeto_id(nome)')
        .order('created_at', { ascending: false });

      if (orcamentosData) setOrcamentos(orcamentosData as any);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pagamentoData: any = {
        orcamento_id: formData.orcamento_id,
        categoria: formData.categoria,
        descricao: formData.descricao || null,
        valor: parseFloat(formData.valor),
        status: formData.status,
        data_vencimento: formData.data_vencimento || null
      };

      if (formData.status === 'pago') {
        pagamentoData.data_pagamento = formData.data_pagamento || new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('pagamentos')
        .insert([pagamentoData]);

      if (error) throw error;

      setShowModal(false);
      setFormData({
        orcamento_id: orcamentoIdParam || '',
        categoria: 'estudio',
        descricao: '',
        valor: '',
        data_vencimento: '',
        status: 'pendente',
        data_pagamento: ''
      });
      loadData();
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      alert('Erro ao criar pagamento. Tente novamente.');
    }
  };

  const handleToggleStatus = async (pagamento: Pagamento) => {
    try {
      const novoStatus = pagamento.status === 'pago' ? 'pendente' : 'pago';
      const updateData: any = {
        status: novoStatus
      };

      if (novoStatus === 'pago' && !pagamento.data_pagamento) {
        updateData.data_pagamento = new Date().toISOString().split('T')[0];
      } else if (novoStatus === 'pendente') {
        updateData.data_pagamento = null;
      }

      const { error } = await supabase
        .from('pagamentos')
        .update(updateData)
        .eq('id', pagamento.id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status. Tente novamente.');
    }
  };

  const filteredPagamentos = pagamentos.filter(pag => {
    const statusParaFiltro = (pag as any).status_temporario || pag.status;
    const matchesSearch = pag.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pag.orcamento?.projeto?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         categoriasLabels[pag.categoria].toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'todos' || statusParaFiltro === activeTab;
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

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      'estudio': 'bg-purple-500/20 text-purple-400',
      'produtor': 'bg-blue-500/20 text-blue-400',
      'mixagem': 'bg-orange-500/20 text-orange-400',
      'masterizacao': 'bg-pink-500/20 text-pink-400',
    };
    return colors[categoria] || 'bg-gray-500/20 text-gray-400';
  };

  const totalPendente = pagamentos.filter(p => (p as any).status_temporario === 'pendente' || (p.status === 'pendente' && !(p as any).status_temporario)).reduce((sum, p) => sum + p.valor, 0);
  const totalPago = pagamentos.filter(p => p.status === 'pago').reduce((sum, p) => sum + p.valor, 0);
  const totalAtrasado = pagamentos.filter(p => (p as any).status_temporario === 'atrasado').reduce((sum, p) => sum + p.valor, 0);

  const stats = [
    { label: 'Total Pago', value: `R$ ${totalPago.toLocaleString('pt-BR')}`, icon: 'ri-check-double-line', color: 'from-green-500 to-green-700' },
    { label: 'Total Pendente', value: `R$ ${totalPendente.toLocaleString('pt-BR')}`, icon: 'ri-time-line', color: 'from-yellow-500 to-yellow-700' },
    { label: 'Total Atrasado', value: `R$ ${totalAtrasado.toLocaleString('pt-BR')}`, icon: 'ri-alert-line', color: 'from-red-500 to-red-700' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
            <p className="text-gray-400 mt-4">Carregando pagamentos...</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Financeiro</h1>
            <p className="text-gray-400">Controle de pagamentos por categoria</p>
            {orcamentoIdParam && (
              <p className="text-sm text-primary-teal mt-1">Filtrando por orçamento selecionado</p>
            )}
          </div>
          <div className="flex gap-3">
            {orcamentoIdParam && (
              <button
                onClick={() => window.location.href = '/financeiro'}
                className="px-4 py-2 bg-dark-card border border-dark-border text-white rounded-lg hover:bg-dark-hover transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
              >
                <i className="ri-close-line"></i>
                Remover Filtro
              </button>
            )}
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <i className="ri-add-line text-xl"></i>
              Novo Pagamento
            </button>
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

        {/* Filters */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="text"
                placeholder="Buscar por categoria, descrição ou projeto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
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
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Projeto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Categoria</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Descrição</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Valor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Vencimento</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Pagamento</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPagamentos.map((pag) => {
                  const statusParaExibicao = (pag as any).status_temporario || pag.status;
                  return (
                    <tr key={pag.id} className="border-b border-dark-border hover:bg-dark-hover transition-smooth">
                      <td className="px-6 py-4 text-sm text-white">
                        {pag.orcamento?.projeto?.nome || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getCategoriaColor(pag.categoria)}`}>
                          {categoriasLabels[pag.categoria]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{pag.descricao || '-'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-white whitespace-nowrap">
                        {formatCurrency(pag.valor)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                        {pag.data_vencimento ? new Date(pag.data_vencimento).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                        {pag.data_pagamento ? new Date(pag.data_pagamento).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(statusParaExibicao)}`}>
                          {getStatusLabel(statusParaExibicao)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(pag)}
                          className={`p-2 rounded-lg transition-smooth cursor-pointer ${
                            pag.status === 'pago'
                              ? 'hover:bg-yellow-500/20 text-yellow-400'
                              : 'hover:bg-green-500/20 text-green-400'
                          }`}
                          title={pag.status === 'pago' ? 'Marcar como pendente' : 'Marcar como pago'}
                        >
                          <i className={`ri-${pag.status === 'pago' ? 'arrow-go-back' : 'check'}-line text-lg`}></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPagamentos.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-money-dollar-circle-line text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhum pagamento encontrado</p>
          </div>
        )}

        {/* Modal Novo Pagamento */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Novo Pagamento</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Orçamento</label>
                  <select
                    required
                    value={formData.orcamento_id}
                    onChange={(e) => setFormData({ ...formData, orcamento_id: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="">Selecione um orçamento</option>
                    {orcamentos.map((orc) => (
                      <option key={orc.id} value={orc.id}>
                        {orc.projeto?.nome || 'Orçamento'} - {formatCurrency(orc.valor_total)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Categoria</label>
                  <select
                    required
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="estudio">Estúdio</option>
                    <option value="produtor">Produtor</option>
                    <option value="mixagem">Mixagem</option>
                    <option value="masterizacao">Masterização</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Descrição (opcional)</label>
                  <input
                    type="text"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Pagamento sessão de gravação"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Data de Vencimento</label>
                  <input
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pago' | 'pendente' })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>

                {formData.status === 'pago' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Data de Pagamento</label>
                    <input
                      type="date"
                      value={formData.data_pagamento}
                      onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                    />
                  </div>
                )}

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
      </div>
    </MainLayout>
  );
}
