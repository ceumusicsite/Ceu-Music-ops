import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type FilterStatus = 'todos' | 'pendente' | 'aprovado' | 'recusado';

interface Orcamento {
  id: string;
  titulo: string;
  tipo: string;
  descricao: string;
  valor: number;
  status: string;
  recuperavel?: boolean;
  artista_id?: string;
  projeto_id?: string;
  data_vencimento?: string;
  status_pagamento?: string;
  comprovante_url?: string;
  created_at: string;
}

interface Artista {
  id: string;
  nome: string;
}

interface Projeto {
  id: string;
  nome: string;
}

export default function Orcamentos() {
  const { user, hasPermission } = useAuth();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: '',
    descricao: '',
    valor: '',
    recuperavel: false,
    artista_id: '',
    projeto_id: '',
    data_vencimento: '',
    status_pagamento: 'pendente',
    comprovante: null as File | null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orcamentosRes, artistasRes] = await Promise.all([
        supabase
          .from('orcamentos')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('artistas')
          .select('id, nome')
          .eq('status', 'ativo')
          .order('nome')
      ]);

      if (orcamentosRes.data) setOrcamentos(orcamentosRes.data);
      if (artistasRes.data) setArtistas(artistasRes.data);

      // Carregar projetos (verificar estrutura da tabela primeiro)
      try {
        const { data: projetosData, error: projetosError } = await supabase
          .from('projetos')
          .select('*')
          .limit(100);

        if (!projetosError && projetosData) {
          // Adaptar para usar o campo correto (pode ser 'titulo' ou 'nome')
          const projetosAdaptados = projetosData.map((p: any) => ({
            id: p.id,
            nome: p.titulo || p.nome || p.name || 'Projeto sem nome'
          }));
          setProjetos(projetosAdaptados);
        }
      } catch (projError) {
        console.log('Projetos não disponíveis:', projError);
        setProjetos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrcamentos = orcamentos.filter(orc => {
    const matchesSearch = orc.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         orc.tipo.toLowerCase().includes(searchTerm.toLowerCase());
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

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'producao': 'Produção',
      'clipe': 'Clipe',
      'capa': 'Capa',
      'midia': 'Mídia',
      'outro': 'Outro',
    };
    return labels[tipo] || tipo;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, comprovante: e.target.files[0] });
    }
  };

  const uploadComprovante = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `comprovantes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('orcamentos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('orcamentos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do comprovante:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      // Upload do comprovante se houver
      let comprovanteUrl = null;
      if (formData.comprovante) {
        comprovanteUrl = await uploadComprovante(formData.comprovante);
      }

      // Preparar dados para inserção
      const dadosInsercao: any = {
        titulo: formData.titulo,
        tipo: formData.tipo,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        status: 'pendente',
        recuperavel: formData.recuperavel,
        status_pagamento: formData.status_pagamento
      };

      // Adicionar campos opcionais apenas se preenchidos
      if (formData.artista_id) dadosInsercao.artista_id = formData.artista_id;
      if (formData.projeto_id) dadosInsercao.projeto_id = formData.projeto_id;
      if (formData.data_vencimento) dadosInsercao.data_vencimento = formData.data_vencimento;
      if (comprovanteUrl) dadosInsercao.comprovante_url = comprovanteUrl;

      const { error } = await supabase
        .from('orcamentos')
        .insert([dadosInsercao]);

      if (error) {
        console.error('Erro detalhado:', error);
        throw error;
      }

      setShowModal(false);
      setFormData({
        titulo: '',
        tipo: '',
        descricao: '',
        valor: '',
        recuperavel: false,
        artista_id: '',
        projeto_id: '',
        data_vencimento: '',
        status_pagamento: 'pendente',
        comprovante: null
      });
      loadData();
    } catch (error: any) {
      console.error('Erro ao criar orçamento:', error);
      const errorMessage = error?.message || 'Erro desconhecido ao criar orçamento';
      alert(`Erro ao criar orçamento: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAprovar = async (id: string) => {
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

  const handleRecusar = async (id: string) => {
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

  const handleVisualizarDetalhes = async (orcamento: Orcamento) => {
    setOrcamentoSelecionado(orcamento);
    setShowDetalhesModal(true);
  };

  const stats = [
    { label: 'Total Pendente', value: `R$ ${orcamentos.filter(o => o.status === 'pendente').reduce((sum, o) => sum + (o.valor || 0), 0).toLocaleString('pt-BR')}`, icon: 'ri-time-line', color: 'from-yellow-500 to-yellow-700' },
    { label: 'Total Aprovado', value: `R$ ${orcamentos.filter(o => o.status === 'aprovado').reduce((sum, o) => sum + (o.valor || 0), 0).toLocaleString('pt-BR')}`, icon: 'ri-check-line', color: 'from-green-500 to-green-700' },
    { label: 'Aguardando Aprovação', value: orcamentos.filter(o => o.status === 'pendente').length, icon: 'ri-file-list-3-line', color: 'from-primary-teal to-primary-brown' },
  ];

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
            <p className="text-gray-400">Gerencie orçamentos e aprovações</p>
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
                        {getTipoLabel(orc.tipo)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-medium">{orc.descricao}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white whitespace-nowrap">
                      R$ {orc.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(orc.status)}`}>
                        {getStatusLabel(orc.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(orc.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {orc.status === 'pendente' && hasPermission(['admin']) && (
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
                          onClick={() => handleVisualizarDetalhes(orc)}
                          className="p-2 hover:bg-dark-bg rounded-lg transition-smooth cursor-pointer"
                          title="Ver detalhes"
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
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">Novo Orçamento</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Título</label>
                  <input
                    type="text"
                    required
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Produção Single - Alex Lucio"
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
                  <select
                    required
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="producao">Produção</option>
                    <option value="clipe">Clipe / Vídeo</option>
                    <option value="capa">Capa / Design</option>
                    <option value="midia">Mídia / Marketing</option>
                    <option value="outro">Outro</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Para Mixagem ou Masterização, use "Produção" ou "Outro"
                  </p>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Descrição</label>
                  <textarea
                    required
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Descreva o orçamento detalhadamente"
                    rows={3}
                  />
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="0.00"
                  />
                </div>

                {/* Recuperabilidade */}
                <div className="flex items-center gap-3 p-4 bg-dark-bg rounded-lg border border-dark-border">
                  <input
                    type="checkbox"
                    id="recuperavel"
                    checked={formData.recuperavel}
                    onChange={(e) => setFormData({ ...formData, recuperavel: e.target.checked })}
                    className="w-5 h-5 rounded border-dark-border bg-dark-hover text-primary-teal focus:ring-primary-teal focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="recuperavel" className="text-sm text-white cursor-pointer">
                    Valor Recuperável <span className="text-gray-500 text-xs">(será descontado do artista)</span>
                  </label>
                </div>

                {/* Vínculo com Artista */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Vínculo com Artista (opcional)</label>
                  <select
                    value={formData.artista_id}
                    onChange={(e) => setFormData({ ...formData, artista_id: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="">Nenhum artista</option>
                    {artistas.map((artista) => (
                      <option key={artista.id} value={artista.id}>{artista.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Vínculo com Projeto */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Vínculo com Projeto (opcional)</label>
                  <select
                    value={formData.projeto_id}
                    onChange={(e) => setFormData({ ...formData, projeto_id: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="">Nenhum projeto</option>
                    {projetos.map((projeto) => (
                      <option key={projeto.id} value={projeto.id}>{projeto.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Data de Vencimento */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Data de Vencimento (opcional)</label>
                  <input
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  />
                </div>

                {/* Status de Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Status de Pagamento</label>
                  <select
                    value={formData.status_pagamento}
                    onChange={(e) => setFormData({ ...formData, status_pagamento: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                    <option value="parcial">Parcialmente Pago</option>
                    <option value="atrasado">Atrasado</option>
                  </select>
                </div>

                {/* Anexo de Comprovante */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Anexar Comprovante (opcional)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                      id="comprovante-upload"
                    />
                    <label
                      htmlFor="comprovante-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-gray-400 hover:text-white hover:border-primary-teal transition-smooth cursor-pointer"
                    >
                      <i className="ri-upload-2-line text-xl"></i>
                      <span className="text-sm">
                        {formData.comprovante ? formData.comprovante.name : 'Selecione um arquivo'}
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Formatos aceitos: PDF, JPG, PNG (máx. 10MB)</p>
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
                    disabled={uploading}
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Salvando...' : 'Criar Orçamento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Detalhes do Orçamento */}
        {showDetalhesModal && orcamentoSelecionado && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">Detalhes do Orçamento</h2>
                <button 
                  onClick={() => setShowDetalhesModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-6">
                {/* Status e Tipo */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                    <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(orcamentoSelecionado.status)}`}>
                      {getStatusLabel(orcamentoSelecionado.status)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
                    <span className="inline-block px-4 py-2 bg-primary-teal/20 text-primary-teal rounded-lg text-sm font-medium">
                      {getTipoLabel(orcamentoSelecionado.tipo)}
                    </span>
                  </div>
                </div>

                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Título</label>
                  <p className="text-white text-lg font-semibold">{orcamentoSelecionado.titulo}</p>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Descrição</label>
                  <p className="text-white bg-dark-bg p-4 rounded-lg">{orcamentoSelecionado.descricao}</p>
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Valor</label>
                  <p className="text-2xl font-bold text-white">
                    R$ {orcamentoSelecionado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Recuperabilidade */}
                {orcamentoSelecionado.recuperavel && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <i className="ri-alert-line text-yellow-400 text-xl"></i>
                      <span className="text-yellow-400 font-medium">Valor Recuperável</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">Este valor será descontado do artista</p>
                  </div>
                )}

                {/* Artista */}
                {orcamentoSelecionado.artista_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Artista Vinculado</label>
                    <p className="text-white">
                      {artistas.find(a => a.id === orcamentoSelecionado.artista_id)?.nome || 'Não encontrado'}
                    </p>
                  </div>
                )}

                {/* Projeto */}
                {orcamentoSelecionado.projeto_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Projeto Vinculado</label>
                    <p className="text-white">
                      {projetos.find(p => p.id === orcamentoSelecionado.projeto_id)?.nome || 'Não encontrado'}
                    </p>
                  </div>
                )}

                {/* Data de Vencimento */}
                {orcamentoSelecionado.data_vencimento && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Data de Vencimento</label>
                    <p className="text-white">
                      {new Date(orcamentoSelecionado.data_vencimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}

                {/* Status de Pagamento */}
                {orcamentoSelecionado.status_pagamento && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Status de Pagamento</label>
                    <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${
                      orcamentoSelecionado.status_pagamento === 'pago' ? 'bg-green-500/20 text-green-400' :
                      orcamentoSelecionado.status_pagamento === 'parcial' ? 'bg-yellow-500/20 text-yellow-400' :
                      orcamentoSelecionado.status_pagamento === 'atrasado' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {orcamentoSelecionado.status_pagamento === 'pago' ? 'Pago' :
                       orcamentoSelecionado.status_pagamento === 'parcial' ? 'Parcialmente Pago' :
                       orcamentoSelecionado.status_pagamento === 'atrasado' ? 'Atrasado' :
                       'Pendente'}
                    </span>
                  </div>
                )}

                {/* Comprovante */}
                {orcamentoSelecionado.comprovante_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Comprovante</label>
                    <a
                      href={orcamentoSelecionado.comprovante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-teal/20 text-primary-teal rounded-lg hover:bg-primary-teal/30 transition-smooth"
                    >
                      <i className="ri-file-line text-lg"></i>
                      <span>Ver Comprovante</span>
                    </a>
                  </div>
                )}

                {/* Data de Criação */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Criado em</label>
                  <p className="text-white">
                    {new Date(orcamentoSelecionado.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>

                {/* Ações do Modal */}
                <div className="flex gap-3 pt-6 border-t border-dark-border">
                  {orcamentoSelecionado.status === 'pendente' && hasPermission(['admin']) && (
                    <>
                      <button
                        onClick={() => {
                          handleAprovar(orcamentoSelecionado.id);
                          setShowDetalhesModal(false);
                        }}
                        className="flex-1 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-smooth cursor-pointer whitespace-nowrap font-medium"
                      >
                        <i className="ri-check-line mr-2"></i>
                        Aprovar
                      </button>
                      <button
                        onClick={() => {
                          handleRecusar(orcamentoSelecionado.id);
                          setShowDetalhesModal(false);
                        }}
                        className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-smooth cursor-pointer whitespace-nowrap font-medium"
                      >
                        <i className="ri-close-line mr-2"></i>
                        Recusar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowDetalhesModal(false)}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Fechar
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