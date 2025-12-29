import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';

type FilterStatus = 'todos' | 'pendente' | 'aprovado' | 'recusado';

interface Orcamento {
  id: string;
  projeto_id: string;
  valor_total: number;
  valor_realizado: number;
  status: 'pendente' | 'aprovado' | 'recusado';
  descricao?: string;
  created_at: string;
  projeto?: { nome: string; artista?: { nome: string } };
}

interface Projeto {
  id: string;
  nome: string;
  artista?: { nome: string };
}

export default function Orcamentos() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    projeto_id: '',
    valor_total: '',
    descricao: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orcamentosRes, projetosRes] = await Promise.all([
        supabase
          .from('orcamentos')
          .select('*, projeto:projeto_id(nome, artista:artista_id(nome))')
          .order('created_at', { ascending: false }),
        supabase
          .from('projetos')
          .select('id, nome, artista:artista_id(nome)')
          .order('nome')
      ]);

      if (orcamentosRes.data) {
        // Calcular valor realizado de cada orçamento
        const orcamentosComRealizado = await Promise.all(
          orcamentosRes.data.map(async (orc: any) => {
            const { data: pagamentos } = await supabase
              .from('pagamentos')
              .select('valor')
              .eq('orcamento_id', orc.id)
              .eq('status', 'pago');

            const valorRealizado = pagamentos?.reduce((sum: number, p: any) => sum + (p.valor || 0), 0) || 0;
            
            return {
              ...orc,
              valor_realizado: valorRealizado
            };
          })
        );
        setOrcamentos(orcamentosComRealizado as any);
      }
      if (projetosRes.data) setProjetos(projetosRes.data as any);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('orcamentos')
        .insert([{
          projeto_id: formData.projeto_id,
          valor_total: parseFloat(formData.valor_total),
          descricao: formData.descricao || null,
          status: 'pendente'
        }]);

      if (error) throw error;

      setShowModal(false);
      setFormData({
        projeto_id: '',
        valor_total: '',
        descricao: ''
      });
      loadData();
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      alert('Erro ao criar orçamento. Tente novamente.');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('orcamentos')
        .update({ status: 'aprovado' })
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Erro ao aprovar orçamento:', error);
      alert('Erro ao aprovar orçamento. Tente novamente.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('orcamentos')
        .update({ status: 'recusado' })
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Erro ao recusar orçamento:', error);
      alert('Erro ao recusar orçamento. Tente novamente.');
    }
  };

  const filteredOrcamentos = orcamentos.filter(orc => {
    const matchesSearch = orc.projeto?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         orc.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || orc.status === filterStatus;
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

  const totalPendente = orcamentos.filter(o => o.status === 'pendente').reduce((sum, o) => sum + o.valor_total, 0);
  const totalAprovado = orcamentos.filter(o => o.status === 'aprovado').reduce((sum, o) => sum + o.valor_total, 0);
  const totalRealizado = orcamentos.filter(o => o.status === 'aprovado').reduce((sum, o) => sum + o.valor_realizado, 0);
  const aguardandoAprovacao = orcamentos.filter(o => o.status === 'pendente').length;

  const stats = [
    { label: 'Total Pendente', value: `R$ ${totalPendente.toLocaleString('pt-BR')}`, icon: 'ri-time-line', color: 'from-yellow-500 to-yellow-700' },
    { label: 'Total Aprovado', value: `R$ ${totalAprovado.toLocaleString('pt-BR')}`, icon: 'ri-check-line', color: 'from-green-500 to-green-700' },
    { label: 'Total Realizado', value: `R$ ${totalRealizado.toLocaleString('pt-BR')}`, icon: 'ri-money-dollar-circle-line', color: 'from-primary-teal to-primary-brown' },
    { label: 'Aguardando Aprovação', value: aguardandoAprovacao, icon: 'ri-file-list-3-line', color: 'from-blue-500 to-blue-700' },
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
            <p className="text-gray-400 mt-4">Carregando orçamentos...</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Orçamentos</h1>
            <p className="text-gray-400">Gerencie orçamentos e aprovações por projeto</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-add-line text-xl"></i>
            Novo Orçamento
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-dark-card border border-dark-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <i className={`${stat.icon} text-2xl text-white`}></i>
                </div>
                <span className="text-2xl font-bold text-white">{typeof stat.value === 'number' ? stat.value : stat.value}</span>
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
                placeholder="Buscar orçamentos por projeto ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Projeto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Artista</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Orçamento Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Valor Realizado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Diferença</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Data</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrcamentos.map((orc) => {
                  const diferenca = orc.valor_total - orc.valor_realizado;
                  const percentualRealizado = orc.valor_total > 0 ? (orc.valor_realizado / orc.valor_total) * 100 : 0;
                  
                  return (
                    <tr 
                      key={orc.id} 
                      className="border-b border-dark-border hover:bg-dark-hover transition-smooth cursor-pointer"
                      onClick={() => navigate(`/financeiro?orcamento_id=${orc.id}`)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-white">{orc.projeto?.nome || 'Projeto não encontrado'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{orc.projeto?.artista?.nome || '-'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-white whitespace-nowrap">
                        {formatCurrency(orc.valor_total)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold text-primary-teal whitespace-nowrap">
                            {formatCurrency(orc.valor_realizado)}
                          </span>
                          <div className="w-20 h-1.5 bg-dark-border rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-smooth ${
                                percentualRealizado <= 100 ? 'bg-primary-teal' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(percentualRealizado, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium whitespace-nowrap ${
                          diferenca >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatCurrency(diferenca)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(orc.status)}`}>
                          {getStatusLabel(orc.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                        {new Date(orc.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {orc.status === 'pendente' && (
                            <>
                              <button 
                                onClick={() => handleApprove(orc.id)}
                                className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-smooth cursor-pointer" 
                                title="Aprovar"
                              >
                                <i className="ri-check-line text-lg"></i>
                              </button>
                              <button 
                                onClick={() => handleReject(orc.id)}
                                className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-smooth cursor-pointer" 
                                title="Recusar"
                              >
                                <i className="ri-close-line text-lg"></i>
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => navigate(`/financeiro?orcamento_id=${orc.id}`)}
                            className="p-2 hover:bg-dark-bg rounded-lg transition-smooth cursor-pointer"
                            title="Ver pagamentos"
                          >
                            <i className="ri-eye-line text-gray-400 text-lg hover:text-primary-teal"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Novo Orçamento</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Projeto</label>
                  <select
                    required
                    value={formData.projeto_id}
                    onChange={(e) => setFormData({ ...formData, projeto_id: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="">Selecione um projeto</option>
                    {projetos.map((projeto) => (
                      <option key={projeto.id} value={projeto.id}>
                        {projeto.nome} {projeto.artista?.nome ? `- ${projeto.artista.nome}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Orçamento Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.valor_total}
                    onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Descrição (opcional)</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Descrição do orçamento..."
                    rows={3}
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
                    Criar Orçamento
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
