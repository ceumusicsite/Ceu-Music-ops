import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';

type FilterTab = 'todos' | 'pendente' | 'pago' | 'atrasado';

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState<FilterTab>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    description: '',
    value: '',
    dueDate: '',
    budget: '',
    installment: '1/1',
  });

  useEffect(() => {
    loadPagamentos();
  }, []);

  const loadPagamentos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .order('due_date', { ascending: false });

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
          description: 'Produção Musical - Artista A', 
          value: 15000, 
          status: 'pago',
          dueDate: '2024-01-20',
          paidDate: '2024-01-18',
          budget: 'ORÇ-001',
          installment: '1/1',
          receipt: true
        },
        { 
          id: 2, 
          description: 'Clipe Oficial - Artista B', 
          value: 17500, 
          status: 'pendente',
          dueDate: '2024-01-25',
          paidDate: null,
          budget: 'ORÇ-002',
          installment: '1/2',
          receipt: false
        },
        { 
          id: 3, 
          description: 'Clipe Oficial - Artista B', 
          value: 17500, 
          status: 'pendente',
          dueDate: '2024-02-25',
          paidDate: null,
          budget: 'ORÇ-002',
          installment: '2/2',
          receipt: false
        },
        { 
          id: 4, 
          description: 'Masterização - Artista C', 
          value: 8000, 
          status: 'pago',
          dueDate: '2024-01-15',
          paidDate: '2024-01-14',
          budget: 'ORÇ-003',
          installment: '1/1',
          receipt: true
        },
        { 
          id: 5, 
          description: 'Arte de Capa - Artista D', 
          value: 3500, 
          status: 'atrasado',
          dueDate: '2024-01-10',
          paidDate: null,
          budget: 'ORÇ-004',
          installment: '1/1',
          receipt: false
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const pagamentosMock = [
    { 
      id: 1, 
      description: 'Produção Musical - Artista A', 
      value: 15000, 
      status: 'pago',
      dueDate: '2024-01-20',
      paidDate: '2024-01-18',
      budget: 'ORÇ-001',
      installment: '1/1',
      receipt: true
    },
    { 
      id: 2, 
      description: 'Clipe Oficial - Artista B', 
      value: 17500, 
      status: 'pendente',
      dueDate: '2024-01-25',
      paidDate: null,
      budget: 'ORÇ-002',
      installment: '1/2',
      receipt: false
    },
    { 
      id: 3, 
      description: 'Clipe Oficial - Artista B', 
      value: 17500, 
      status: 'pendente',
      dueDate: '2024-02-25',
      paidDate: null,
      budget: 'ORÇ-002',
      installment: '2/2',
      receipt: false
    },
    { 
      id: 4, 
      description: 'Masterização - Artista C', 
      value: 8000, 
      status: 'pago',
      dueDate: '2024-01-15',
      paidDate: '2024-01-14',
      budget: 'ORÇ-003',
      installment: '1/1',
      receipt: true
    },
    { 
      id: 5, 
      description: 'Arte de Capa - Artista D', 
      value: 3500, 
      status: 'atrasado',
      dueDate: '2024-01-10',
      paidDate: null,
      budget: 'ORÇ-004',
      installment: '1/1',
      receipt: false
    },
  ];

  const pagamentosToDisplay = pagamentos.length > 0 ? pagamentos : pagamentosMock;

  const filteredPagamentos = pagamentosToDisplay.filter(pag => {
    const matchesSearch = pag.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pag.budget.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'todos' || pag.status === activeTab;
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
      const pagamentoData = {
        descricao: formData.description,
        valor: parseFloat(formData.value),
        data_vencimento: formData.dueDate,
        orcamento: formData.budget,
        parcela: formData.installment,
        status: 'pendente',
      };

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
      });
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      alert('Erro ao criar pagamento. Verifique o console para mais detalhes.');
    }
  };

  const totalPendente = pagamentosToDisplay.filter(p => (p.status === 'pendente' || p.status === 'Pendente')).reduce((sum, p) => sum + (p.value || p.valor || 0), 0);
  const totalPago = pagamentosToDisplay.filter(p => (p.status === 'pago' || p.status === 'Pago')).reduce((sum, p) => sum + (p.value || p.valor || 0), 0);
  const totalAtrasado = pagamentosToDisplay.filter(p => (p.status === 'atrasado' || p.status === 'Atrasado')).reduce((sum, p) => sum + (p.value || p.valor || 0), 0);

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
            <button className="px-6 py-3 bg-dark-bg border border-dark-border text-white font-medium rounded-lg hover:bg-dark-hover transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap">
              <i className="ri-download-line text-xl"></i>
              Exportar Relatório
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
                {filteredPagamentos.map((pag) => (
                  <tr key={pag.id} className="border-b border-dark-border hover:bg-dark-hover transition-smooth">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-primary-teal">{pag.budget}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">{pag.description}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-dark-bg text-gray-400 text-xs rounded-full whitespace-nowrap">
                        {pag.installment}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white whitespace-nowrap">
                      R$ {pag.value.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">{pag.dueDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {pag.paidDate || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(pag.status)}`}>
                        {getStatusLabel(pag.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {pag.status !== 'pago' && (
                          <button className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-smooth cursor-pointer" title="Marcar como pago">
                            <i className="ri-check-line text-lg"></i>
                          </button>
                        )}
                        {pag.receipt && (
                          <button className="p-2 hover:bg-primary-teal/20 text-primary-teal rounded-lg transition-smooth cursor-pointer" title="Ver comprovante">
                            <i className="ri-file-text-line text-lg"></i>
                          </button>
                        )}
                        {!pag.receipt && pag.status === 'pago' && (
                          <button className="p-2 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-smooth cursor-pointer" title="Upload comprovante">
                            <i className="ri-upload-line text-lg"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
                  <label className="block text-sm font-medium text-gray-400 mb-2">Descrição</label>
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
                  <label className="block text-sm font-medium text-gray-400 mb-2">Valor (R$)</label>
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
                  <label className="block text-sm font-medium text-gray-400 mb-2">Data de Vencimento</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Orçamento</label>
                  <input
                    type="text"
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: ORÇ-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Parcela</label>
                  <input
                    type="text"
                    required
                    value={formData.installment}
                    onChange={(e) => setFormData({ ...formData, installment: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: 1/1 ou 1/3"
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