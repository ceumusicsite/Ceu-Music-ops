import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';

type FilterTab = 'todos' | 'pendente' | 'pago' | 'parcial' | 'atrasado';

interface Orcamento {
  id: string;
  titulo: string;
  tipo: string;
  descricao: string;
  valor: number;
  status: string;
  recuperavel: boolean;
  artista_id: string | null;
  projeto_id: string | null;
  data_vencimento: string | null;
  status_pagamento: string | null;
  comprovante_url: string | null;
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

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState<FilterTab>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showComprovanteModal, setShowComprovanteModal] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Buscar orçamentos aprovados
      const { data: orcamentosData, error: orcamentosError } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('status', 'aprovado')
        .order('created_at', { ascending: false });

      if (orcamentosError) {
        console.error('Erro ao buscar orçamentos:', orcamentosError);
        throw orcamentosError;
      }

      // Buscar artistas (não bloqueia se falhar)
      const { data: artistasData, error: artistasError } = await supabase
        .from('artistas')
        .select('id, nome');

      if (artistasError) {
        console.error('Aviso: Erro ao buscar artistas:', artistasError);
      }

      // Buscar projetos (não bloqueia se falhar)
      const { data: projetosData, error: projetosError } = await supabase
        .from('projetos')
        .select('*')
        .limit(100);

      if (projetosError) {
        console.error('Aviso: Erro ao buscar projetos:', projetosError);
      }

      setOrcamentos(orcamentosData || []);
      setArtistas(artistasData || []);
      setProjetos(projetosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados financeiros. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarComoPago = async (id: string) => {
    try {
      const { error } = await supabase
        .from('orcamentos')
        .update({ 
          status_pagamento: 'pago'
        })
        .eq('id', id);

      if (error) throw error;
      
      alert('Pagamento marcado como pago com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      alert('Erro ao atualizar status. Tente novamente.');
    }
  };

  const handleUploadComprovante = async () => {
    if (!comprovanteFile || !selectedOrcamento) return;

    try {
      setUploading(true);
      
      // Upload do arquivo
      const fileExt = comprovanteFile.name.split('.').pop();
      const fileName = `${selectedOrcamento.id}-${Date.now()}.${fileExt}`;
      const filePath = `comprovantes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('orcamentos')
        .upload(filePath, comprovanteFile);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('orcamentos')
        .getPublicUrl(filePath);

      // Atualizar orçamento com a URL do comprovante
      const { error: updateError } = await supabase
        .from('orcamentos')
        .update({ 
          comprovante_url: publicUrl,
          status_pagamento: 'pago'
        })
        .eq('id', selectedOrcamento.id);

      if (updateError) throw updateError;

      alert('Comprovante enviado com sucesso!');
      setShowComprovanteModal(false);
      setSelectedOrcamento(null);
      setComprovanteFile(null);
      loadData();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao enviar comprovante. Verifique se o bucket "orcamentos" está configurado no Supabase Storage.');
    } finally {
      setUploading(false);
    }
  };

  const handleExportarRelatorio = () => {
    try {
      // Preparar dados para exportação
      const dadosExportacao = filteredOrcamentos.map(orc => {
        const statusAtual = isAtrasado(orc) ? 'atrasado' : (orc.status_pagamento || 'pendente');
        
        return {
          'Título': orc.titulo || '',
          'Descrição': orc.descricao || '',
          'Tipo': getTipoLabel(orc.tipo),
          'Valor': `R$ ${orc.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          'Artista': getArtistaName(orc.artista_id),
          'Projeto': getProjetoName(orc.projeto_id),
          'Vencimento': orc.data_vencimento ? new Date(orc.data_vencimento).toLocaleDateString('pt-BR') : '-',
          'Status Pagamento': getStatusLabel(statusAtual),
          'Recuperável': orc.recuperavel ? 'Sim' : 'Não',
          'Comprovante': orc.comprovante_url ? 'Sim' : 'Não',
          'Data Criação': new Date(orc.created_at).toLocaleDateString('pt-BR')
        };
      });

      // Converter para CSV
      const headers = Object.keys(dadosExportacao[0] || {});
      const csvContent = [
        headers.join(';'),
        ...dadosExportacao.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escapar valores que contenham ponto e vírgula ou aspas
            return typeof value === 'string' && (value.includes(';') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          }).join(';')
        )
      ].join('\n');

      // Adicionar estatísticas no início do arquivo
      const estatisticas = [
        'RELATÓRIO FINANCEIRO',
        `Data de Geração: ${new Date().toLocaleString('pt-BR')}`,
        '',
        'RESUMO:',
        `Total Pago: R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `Total Pendente: R$ ${totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `Total Atrasado: R$ ${totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `Total Parcial: R$ ${totalParcial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `Total Geral: R$ ${(totalPago + totalPendente + totalAtrasado + totalParcial).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        '',
        'DETALHAMENTO:',
        ''
      ].join('\n');

      const csvFinal = estatisticas + csvContent;

      // Criar blob e fazer download
      const blob = new Blob(['\ufeff' + csvFinal], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório. Tente novamente.');
    }
  };

  const getArtistaName = (artistaId: string | null) => {
    if (!artistaId) return '-';
    const artista = artistas.find(a => a.id === artistaId);
    return artista?.nome || '-';
  };

  const getProjetoName = (projetoId: string | null) => {
    if (!projetoId) return '-';
    const projeto = projetos.find(p => p.id === projetoId);
    return projeto?.nome || '-';
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'producao': 'Produção',
      'marketing': 'Marketing',
      'shows': 'Shows',
      'direitos': 'Direitos',
      'equipamentos': 'Equipamentos',
      'outros': 'Outros',
    };
    return labels[tipo] || tipo;
  };

  const getStatusColor = (status: string | null) => {
    const colors: Record<string, string> = {
      'pendente': 'bg-yellow-500/20 text-yellow-400',
      'pago': 'bg-green-500/20 text-green-400',
      'parcial': 'bg-blue-500/20 text-blue-400',
      'atrasado': 'bg-red-500/20 text-red-400',
    };
    return colors[status || 'pendente'] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusLabel = (status: string | null) => {
    const labels: Record<string, string> = {
      'pendente': 'Pendente',
      'pago': 'Pago',
      'parcial': 'Parcial',
      'atrasado': 'Atrasado',
    };
    return labels[status || 'pendente'] || 'Pendente';
  };

  const isAtrasado = (orc: Orcamento) => {
    if (!orc.data_vencimento || orc.status_pagamento === 'pago') return false;
    return new Date(orc.data_vencimento) < new Date();
  };

  const filteredOrcamentos = orcamentos.filter(orc => {
    const matchesSearch = 
      orc.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orc.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getArtistaName(orc.artista_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    let statusToCheck = orc.status_pagamento || 'pendente';
    if (isAtrasado(orc)) statusToCheck = 'atrasado';
    
    const matchesTab = activeTab === 'todos' || statusToCheck === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalPendente = orcamentos
    .filter(o => (o.status_pagamento === 'pendente' || !o.status_pagamento) && !isAtrasado(o))
    .reduce((sum, o) => sum + o.valor, 0);
  
  const totalPago = orcamentos
    .filter(o => o.status_pagamento === 'pago')
    .reduce((sum, o) => sum + o.valor, 0);
  
  const totalAtrasado = orcamentos
    .filter(o => isAtrasado(o))
    .reduce((sum, o) => sum + o.valor, 0);

  const totalParcial = orcamentos
    .filter(o => o.status_pagamento === 'parcial')
    .reduce((sum, o) => sum + o.valor, 0);

  const stats = [
    { label: 'Total Pago', value: `R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: 'ri-check-double-line', color: 'from-green-500 to-green-700' },
    { label: 'Total Pendente', value: `R$ ${totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: 'ri-time-line', color: 'from-yellow-500 to-yellow-700' },
    { label: 'Total Atrasado', value: `R$ ${totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: 'ri-alert-line', color: 'from-red-500 to-red-700' },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-6xl text-primary-teal animate-spin mb-4"></i>
            <p className="text-gray-400">Carregando dados financeiros...</p>
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
            <p className="text-gray-400">Controle de pagamentos e comprovantes</p>
          </div>
          <button 
            onClick={handleExportarRelatorio}
            className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-download-line text-xl"></i>
            Exportar Relatório
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
                placeholder="Buscar pagamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2">
              {(['todos', 'pendente', 'pago', 'parcial', 'atrasado'] as FilterTab[]).map((tab) => (
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Título</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Artista/Projeto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Valor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Vencimento</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrcamentos.map((orc) => {
                  const statusAtual = isAtrasado(orc) ? 'atrasado' : (orc.status_pagamento || 'pendente');
                  
                  return (
                    <tr key={orc.id} className="border-b border-dark-border hover:bg-dark-hover transition-smooth">
                    <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">{orc.titulo}</p>
                          <p className="text-xs text-gray-400 mt-1">{orc.descricao?.substring(0, 50)}...</p>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-primary-teal/20 text-primary-teal text-xs rounded-full whitespace-nowrap">
                          {getTipoLabel(orc.tipo)}
                      </span>
                    </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        <div>
                          {orc.artista_id && (
                            <div className="flex items-center gap-1">
                              <i className="ri-user-line text-xs"></i>
                              <span>{getArtistaName(orc.artista_id)}</span>
                            </div>
                          )}
                          {orc.projeto_id && (
                            <div className="flex items-center gap-1">
                              <i className="ri-folder-line text-xs"></i>
                              <span>{getProjetoName(orc.projeto_id)}</span>
                            </div>
                          )}
                          {!orc.artista_id && !orc.projeto_id && '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-white whitespace-nowrap">
                            R$ {orc.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          {orc.recuperavel && (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-400 mt-1">
                              <i className="ri-alert-line"></i>
                              Recuperável
                            </span>
                          )}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                        {orc.data_vencimento 
                          ? new Date(orc.data_vencimento).toLocaleDateString('pt-BR')
                          : '-'
                        }
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(statusAtual)}`}>
                          {getStatusLabel(statusAtual)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                          {statusAtual !== 'pago' && (
                            <button 
                              onClick={() => handleMarcarComoPago(orc.id)}
                              className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-smooth cursor-pointer" 
                              title="Marcar como pago"
                            >
                            <i className="ri-check-line text-lg"></i>
                          </button>
                        )}
                          {orc.comprovante_url && (
                            <a
                              href={orc.comprovante_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-primary-teal/20 text-primary-teal rounded-lg transition-smooth cursor-pointer" 
                              title="Ver comprovante"
                            >
                            <i className="ri-file-text-line text-lg"></i>
                            </a>
                          )}
                          {!orc.comprovante_url && (
                            <button 
                              onClick={() => {
                                setSelectedOrcamento(orc);
                                setShowComprovanteModal(true);
                              }}
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
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOrcamentos.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-money-dollar-circle-line text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhum pagamento encontrado</p>
          </div>
        )}

        {/* Modal Upload Comprovante */}
        {showComprovanteModal && selectedOrcamento && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-8 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Upload Comprovante</h2>
                <button 
                  onClick={() => {
                    setShowComprovanteModal(false);
                    setSelectedOrcamento(null);
                    setComprovanteFile(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Orçamento:</p>
                  <p className="text-white font-medium">{selectedOrcamento.titulo}</p>
                  <p className="text-xl font-bold text-primary-teal mt-1">
                    R$ {selectedOrcamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Selecione o Comprovante
                  </label>
                  <input
                    type="file"
                    id="comprovante-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setComprovanteFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="comprovante-upload"
                    className="flex items-center justify-center gap-3 w-full px-4 py-6 bg-dark-bg border-2 border-dashed border-dark-border rounded-lg hover:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <i className="ri-upload-2-line text-2xl"></i>
                    <span className="text-sm">
                      {comprovanteFile ? comprovanteFile.name : 'Clique para selecionar'}
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Formatos: PDF, JPG, PNG (máx. 10MB)</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowComprovanteModal(false);
                      setSelectedOrcamento(null);
                      setComprovanteFile(null);
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUploadComprovante}
                    disabled={!comprovanteFile || uploading}
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Enviando...' : 'Enviar'}
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
