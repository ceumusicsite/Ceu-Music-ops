import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type FilterTipo = 'todos' | 'contrato' | 'termo' | 'aditivo' | 'outro';
type FilterStatus = 'todos' | 'ativo' | 'vencido' | 'cancelado';

export default function Documentos() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<FilterTipo>('todos');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [artistas, setArtistas] = useState<any[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocumento, setSelectedDocumento] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: '',
    artista_id: '',
    projeto_id: '',
    data_inicio: '',
    data_fim: '',
    valor: '',
    descricao: '',
    status: 'ativo',
    arquivo: null as File | null,
    // Novos campos
    identificacao_partes: '',
    objeto_escopo: '',
    valores_pagamento: '',
    vigencia_prazos: '',
    termos_legais: '',
    assinatura: '',
  });

  useEffect(() => {
    loadDocumentos();
    loadArtistas();
    loadProjetos();
  }, []);

  const loadDocumentos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documentos')
        .select(`
          *,
          artista:artista_id(id, nome),
          projeto:projeto_id(id, nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setDocumentos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      setDocumentos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadArtistas = async () => {
    try {
      const { data, error } = await supabase
        .from('artistas')
        .select('id, nome')
        .order('nome', { ascending: true });

      if (error) throw error;
      if (data) setArtistas(data);
    } catch (error) {
      console.error('Erro ao carregar artistas:', error);
      setArtistas([]);
    }
  };

  const loadProjetos = async () => {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .select('id, nome')
        .order('nome', { ascending: true });

      if (error) throw error;
      if (data) setProjetos(data);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      setProjetos([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validar campos obrigatórios
      if (!formData.titulo.trim()) {
        alert('Por favor, preencha o título.');
        return;
      }
      if (!formData.tipo) {
        alert('Por favor, selecione o tipo de documento.');
        return;
      }
      if (!formData.arquivo) {
        alert('Por favor, selecione um arquivo para upload.');
        return;
      }

      setUploading(true);

      // Upload do arquivo para Supabase Storage
      const fileExt = formData.arquivo.name.split('.').pop();
      const fileName = `documentos/${Date.now()}_${formData.arquivo.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(fileName, formData.arquivo);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(fileName);

      // Preparar dados do documento
      const documentoData: any = {
        titulo: formData.titulo.trim(),
        tipo: formData.tipo,
        status: formData.status || 'ativo',
        arquivo_url: urlData.publicUrl,
        arquivo_nome: formData.arquivo.name,
      };

      if (formData.artista_id) documentoData.artista_id = formData.artista_id;
      if (formData.projeto_id) documentoData.projeto_id = formData.projeto_id;
      if (formData.data_inicio) documentoData.data_inicio = formData.data_inicio;
      if (formData.data_fim) documentoData.data_fim = formData.data_fim;
      if (formData.valor && formData.valor.trim()) {
        const valorNum = parseFloat(formData.valor.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(valorNum) && valorNum > 0) {
          documentoData.valor = valorNum;
        }
      }
      if (formData.descricao && formData.descricao.trim()) {
        documentoData.descricao = formData.descricao.trim();
      }
      if (formData.identificacao_partes && formData.identificacao_partes.trim()) {
        documentoData.identificacao_partes = formData.identificacao_partes.trim();
      }
      if (formData.objeto_escopo && formData.objeto_escopo.trim()) {
        documentoData.objeto_escopo = formData.objeto_escopo.trim();
      }
      if (formData.valores_pagamento && formData.valores_pagamento.trim()) {
        documentoData.valores_pagamento = formData.valores_pagamento.trim();
      }
      if (formData.vigencia_prazos && formData.vigencia_prazos.trim()) {
        documentoData.vigencia_prazos = formData.vigencia_prazos.trim();
      }
      if (formData.termos_legais && formData.termos_legais.trim()) {
        documentoData.termos_legais = formData.termos_legais.trim();
      }
      if (formData.assinatura && formData.assinatura.trim()) {
        documentoData.assinatura = formData.assinatura.trim();
      }

      console.log('Dados a serem inseridos:', documentoData);

      const { error, data } = await supabase
        .from('documentos')
        .insert([documentoData])
        .select();

      if (error) {
        console.error('Erro detalhado:', error);
        console.error('Código do erro:', error.code);
        console.error('Mensagem:', error.message);
        throw error;
      }

      console.log('Documento criado com sucesso:', data);

      await loadDocumentos();
      
      setShowModal(false);
      resetForm();
      alert('Documento cadastrado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar documento:', error);
      alert(`Erro ao criar documento: ${error.message || 'Verifique o console para mais detalhes.'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleVisualizar = (documento: any) => {
    setSelectedDocumento(documento);
    setShowViewModal(true);
  };

  const handleImprimir = (documento: any) => {
    setSelectedDocumento(documento);
    setShowPrintModal(true);
  };

  const handleDownload = async (documento: any) => {
    try {
      if (documento.arquivo_url) {
        window.open(documento.arquivo_url, '_blank');
      } else {
        alert('URL do arquivo não disponível.');
      }
    } catch (error: any) {
      console.error('Erro ao baixar arquivo:', error);
      alert(`Erro ao baixar arquivo: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert('Apenas administradores podem excluir documentos.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadDocumentos();
      alert('Documento excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir documento:', error);
      alert(`Erro ao excluir documento: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      tipo: '',
      artista_id: '',
      projeto_id: '',
      data_inicio: '',
      data_fim: '',
      valor: '',
      descricao: '',
      status: 'ativo',
      arquivo: null,
      identificacao_partes: '',
      objeto_escopo: '',
      valores_pagamento: '',
      vigencia_prazos: '',
      termos_legais: '',
      assinatura: '',
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      contrato: 'Contrato',
      termo: 'Termo',
      aditivo: 'Aditivo',
      outro: 'Outro',
    };
    return tipos[tipo] || tipo;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      ativo: 'bg-green-500/20 text-green-400',
      vencido: 'bg-red-500/20 text-red-400',
      cancelado: 'bg-gray-500/20 text-gray-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const filteredDocumentos = documentos.filter((doc) => {
    const matchesSearch = 
      doc.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.artista?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.projeto?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipo === 'todos' || doc.tipo === filterTipo;
    const matchesStatus = filterStatus === 'todos' || doc.status === filterStatus;

    return matchesSearch && matchesTipo && matchesStatus;
  });

  const tipos = ['contrato', 'termo', 'aditivo', 'outro'];

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Documentos</h1>
            <p className="text-gray-400">Gerencie contratos e documentos da gravadora</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2"
          >
            <i className="ri-file-add-line text-lg"></i>
            <span>Novo Documento</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <i className="ri-search-line mr-2"></i>Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, artista, projeto..."
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>

            {/* Filtro por Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <i className="ri-file-list-line mr-2"></i>Filtrar por Tipo
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['todos', ...tipos] as FilterTipo[]).map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setFilterTipo(tipo)}
                    className={`px-3 py-1 rounded-lg text-sm transition-smooth cursor-pointer ${
                      filterTipo === tipo
                        ? 'bg-gradient-primary text-white'
                        : 'bg-dark-bg text-gray-400 hover:bg-dark-hover hover:text-white'
                    }`}
                  >
                    {tipo === 'todos' ? 'Todos' : getTipoLabel(tipo)}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por Status */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <i className="ri-checkbox-circle-line mr-2"></i>Filtrar por Status
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['todos', 'ativo', 'vencido', 'cancelado'] as FilterStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1 rounded-lg text-sm transition-smooth cursor-pointer ${
                      filterStatus === status
                        ? 'bg-gradient-primary text-white'
                        : 'bg-dark-bg text-gray-400 hover:bg-dark-hover hover:text-white'
                    }`}
                  >
                    {status === 'todos' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Documentos */}
        {loading ? (
          <div className="text-center py-12">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin mb-4"></i>
            <p className="text-gray-400">Carregando documentos...</p>
          </div>
        ) : (
          <>
            <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-hover">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Título</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Artista</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Projeto</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Período</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {filteredDocumentos.map((doc) => (
                      <tr key={doc.id} className="hover:bg-dark-hover transition-smooth">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{doc.titulo}</div>
                          {doc.descricao && (
                            <div className="text-xs text-gray-400 mt-1 line-clamp-1">{doc.descricao}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-lg bg-primary-teal/20 text-primary-teal">
                            {getTipoLabel(doc.tipo)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{doc.artista?.nome || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{doc.projeto?.nome || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {formatDate(doc.data_inicio)} {doc.data_fim && `- ${formatDate(doc.data_fim)}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-lg ${getStatusColor(doc.status)}`}>
                            {doc.status?.charAt(0).toUpperCase() + doc.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleVisualizar(doc)}
                              className="p-2 hover:bg-primary-teal/20 text-primary-teal rounded-lg transition-smooth cursor-pointer"
                              title="Visualizar"
                            >
                              <i className="ri-eye-line text-lg"></i>
                            </button>
                            {doc.tipo === 'contrato' && (
                              <button
                                onClick={() => handleImprimir(doc)}
                                className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-smooth cursor-pointer"
                                title="Imprimir"
                              >
                                <i className="ri-printer-line text-lg"></i>
                              </button>
                            )}
                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-smooth cursor-pointer"
                              title="Download"
                            >
                              <i className="ri-download-line text-lg"></i>
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-smooth cursor-pointer"
                                title="Excluir"
                              >
                                <i className="ri-delete-bin-line text-lg"></i>
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

            {filteredDocumentos.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-file-line text-6xl text-gray-600 mb-4"></i>
                <p className="text-gray-400">Nenhum documento encontrado</p>
              </div>
            )}
          </>
        )}

        {/* Modal Novo Documento */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Novo Documento</h2>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Título *</label>
                      <input
                        type="text"
                        required
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: Contrato de Gravação - Artista X"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Tipo *</label>
                      <select
                        required
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="">Selecione o tipo</option>
                        {tipos.map(tipo => (
                          <option key={tipo} value={tipo}>{getTipoLabel(tipo)}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="vencido">Vencido</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Artista</label>
                      <select
                        value={formData.artista_id}
                        onChange={(e) => setFormData({ ...formData, artista_id: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="">Selecione o artista</option>
                        {artistas.map(artista => (
                          <option key={artista.id} value={artista.id}>{artista.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Projeto</label>
                      <select
                        value={formData.projeto_id}
                        onChange={(e) => setFormData({ ...formData, projeto_id: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="">Selecione o projeto</option>
                        {projetos.map(projeto => (
                          <option key={projeto.id} value={projeto.id}>{projeto.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Datas e Valores */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Datas e Valores</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Data de Início</label>
                      <input
                        type="date"
                        value={formData.data_inicio}
                        onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth [color-scheme:dark]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Data de Fim</label>
                      <input
                        type="date"
                        value={formData.data_fim}
                        onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                        min={formData.data_inicio || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth [color-scheme:dark]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Valor</label>
                      <input
                        type="text"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>
                </div>

                {/* Identificação das Partes */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Identificação das Partes (Quem?)</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Identifique as partes envolvidas no contrato/documento
                    </label>
                    <textarea
                      value={formData.identificacao_partes}
                      onChange={(e) => setFormData({ ...formData, identificacao_partes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                      placeholder="Ex: CONTRATANTE: CEU MUSIC, CNPJ: XX.XXX.XXX/XXXX-XX. CONTRATADO: [Nome do Artista], CPF: XXX.XXX.XXX-XX..."
                    />
                  </div>
                </div>

                {/* Objeto e Escopo */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Objeto e Escopo (O quê?)</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Descreva o objeto e o escopo do contrato/documento
                    </label>
                    <textarea
                      value={formData.objeto_escopo}
                      onChange={(e) => setFormData({ ...formData, objeto_escopo: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                      placeholder="Ex: O presente contrato tem por objeto a gravação de um álbum completo, incluindo produção, mixagem e masterização..."
                    />
                  </div>
                </div>

                {/* Valores e Pagamento */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Valores e Pagamento (Quanto e Como?)</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Detalhe os valores e condições de pagamento
                    </label>
                    <textarea
                      value={formData.valores_pagamento}
                      onChange={(e) => setFormData({ ...formData, valores_pagamento: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                      placeholder="Ex: O valor total do contrato é de R$ 50.000,00 (cinquenta mil reais), a ser pago em 3 parcelas de R$ 16.666,67, sendo a primeira no ato da assinatura..."
                    />
                  </div>
                </div>

                {/* Vigência e Prazos */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Vigência e Prazos (Quando?)</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Especifique a vigência e prazos do contrato/documento
                    </label>
                    <textarea
                      value={formData.vigencia_prazos}
                      onChange={(e) => setFormData({ ...formData, vigencia_prazos: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                      placeholder="Ex: Este contrato terá vigência de 12 (doze) meses, contados a partir da data de assinatura. O prazo para entrega do material é de 90 dias..."
                    />
                  </div>
                </div>

                {/* Termos Legais e Assinatura */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Termos Legais e Assinatura (Concordância)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Termos Legais e Cláusulas
                      </label>
                      <textarea
                        value={formData.termos_legais}
                        onChange={(e) => setFormData({ ...formData, termos_legais: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                        placeholder="Ex: As partes concordam que... Foro de eleição: Comarca de São Paulo/SP..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Assinaturas e Concordância
                      </label>
                      <textarea
                        value={formData.assinatura}
                        onChange={(e) => setFormData({ ...formData, assinatura: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                        placeholder="Ex: As partes declaram estar de acordo com os termos deste contrato e o assinam em duas vias de igual teor..."
                      />
                    </div>
                  </div>
                </div>

                {/* Arquivo e Descrição */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Arquivo e Descrição</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo *</label>
                      <input
                        type="file"
                        required
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => setFormData({ ...formData, arquivo: e.target.files?.[0] || null })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      />
                      {formData.arquivo && (
                        <p className="text-xs text-gray-400 mt-1">
                          Arquivo selecionado: {formData.arquivo.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Descrição</label>
                      <textarea
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                        placeholder="Descrição do documento..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="ri-loader-4-line animate-spin"></i>
                        Enviando...
                      </span>
                    ) : (
                      'Salvar Documento'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Visualizar Documento */}
        {showViewModal && selectedDocumento && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Detalhes do Documento</h2>
                <button 
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedDocumento(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Título</label>
                    <p className="text-white">{selectedDocumento.titulo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
                    <p className="text-white">{getTipoLabel(selectedDocumento.tipo)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Artista</label>
                    <p className="text-white">{selectedDocumento.artista?.nome || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Projeto</label>
                    <p className="text-white">{selectedDocumento.projeto?.nome || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Data de Início</label>
                    <p className="text-white">{formatDate(selectedDocumento.data_inicio)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Data de Fim</label>
                    <p className="text-white">{formatDate(selectedDocumento.data_fim)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Valor</label>
                    <p className="text-primary-teal font-semibold">{formatCurrency(selectedDocumento.valor)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                    <span className={`px-2 py-1 text-xs rounded-lg ${getStatusColor(selectedDocumento.status)}`}>
                      {selectedDocumento.status?.charAt(0).toUpperCase() + selectedDocumento.status?.slice(1)}
                    </span>
                  </div>
                  {selectedDocumento.descricao && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Descrição</label>
                      <p className="text-white whitespace-pre-wrap">{selectedDocumento.descricao}</p>
                    </div>
                  )}
                </div>

                {/* Novos Campos */}
                {selectedDocumento.identificacao_partes && (
                  <div className="border-t border-dark-border pt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Identificação das Partes (Quem?)</label>
                    <p className="text-white whitespace-pre-wrap">{selectedDocumento.identificacao_partes}</p>
                  </div>
                )}

                {selectedDocumento.objeto_escopo && (
                  <div className="border-t border-dark-border pt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Objeto e Escopo (O quê?)</label>
                    <p className="text-white whitespace-pre-wrap">{selectedDocumento.objeto_escopo}</p>
                  </div>
                )}

                {selectedDocumento.valores_pagamento && (
                  <div className="border-t border-dark-border pt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Valores e Pagamento (Quanto e Como?)</label>
                    <p className="text-white whitespace-pre-wrap">{selectedDocumento.valores_pagamento}</p>
                  </div>
                )}

                {selectedDocumento.vigencia_prazos && (
                  <div className="border-t border-dark-border pt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Vigência e Prazos (Quando?)</label>
                    <p className="text-white whitespace-pre-wrap">{selectedDocumento.vigencia_prazos}</p>
                  </div>
                )}

                {selectedDocumento.termos_legais && (
                  <div className="border-t border-dark-border pt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Termos Legais</label>
                    <p className="text-white whitespace-pre-wrap">{selectedDocumento.termos_legais}</p>
                  </div>
                )}

                {selectedDocumento.assinatura && (
                  <div className="border-t border-dark-border pt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Assinatura e Concordância</label>
                    <p className="text-white whitespace-pre-wrap">{selectedDocumento.assinatura}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-dark-border">
                  <div className="flex gap-3">
                    {selectedDocumento.arquivo_url && (
                      <>
                        <button
                          onClick={() => handleDownload(selectedDocumento)}
                          className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center justify-center gap-2"
                        >
                          <i className="ri-download-line"></i>
                          <span>Baixar Arquivo</span>
                        </button>
                        {selectedDocumento.tipo === 'contrato' && (
                          <button
                            onClick={() => handleImprimir(selectedDocumento)}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center justify-center gap-2"
                          >
                            <i className="ri-printer-line"></i>
                            <span>Imprimir</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Imprimir Contrato */}
        {showPrintModal && selectedDocumento && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Imprimir Contrato</h2>
                <button 
                  onClick={() => {
                    setShowPrintModal(false);
                    setSelectedDocumento(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div id="print-content" className="space-y-6 text-gray-900">
                {/* Cabeçalho */}
                <div className="text-center border-b pb-4">
                  <h1 className="text-2xl font-bold mb-2">CEU MUSIC</h1>
                  <p className="text-gray-600">{getTipoLabel(selectedDocumento.tipo).toUpperCase()}</p>
                  <p className="text-sm text-gray-500 mt-1">{selectedDocumento.titulo}</p>
                </div>

                {/* Identificação das Partes */}
                {selectedDocumento.identificacao_partes && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 border-b pb-1">1. IDENTIFICAÇÃO DAS PARTES (QUEM?)</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedDocumento.identificacao_partes}</p>
                  </div>
                )}

                {/* Objeto e Escopo */}
                {selectedDocumento.objeto_escopo && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 border-b pb-1">2. OBJETO E ESCOPO (O QUÊ?)</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedDocumento.objeto_escopo}</p>
                  </div>
                )}

                {/* Valores e Pagamento */}
                {selectedDocumento.valores_pagamento && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 border-b pb-1">3. VALORES E PAGAMENTO (QUANTO E COMO?)</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedDocumento.valores_pagamento}</p>
                    {selectedDocumento.valor && (
                      <p className="mt-2 text-lg font-bold text-primary-teal">Valor Total: {formatCurrency(selectedDocumento.valor)}</p>
                    )}
                  </div>
                )}

                {/* Vigência e Prazos */}
                {selectedDocumento.vigencia_prazos && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 border-b pb-1">4. VIGÊNCIA E PRAZOS (QUANDO?)</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedDocumento.vigencia_prazos}</p>
                    {(selectedDocumento.data_inicio || selectedDocumento.data_fim) && (
                      <div className="mt-2 text-sm">
                        {selectedDocumento.data_inicio && (
                          <p><strong>Data de Início:</strong> {formatDate(selectedDocumento.data_inicio)}</p>
                        )}
                        {selectedDocumento.data_fim && (
                          <p><strong>Data de Fim:</strong> {formatDate(selectedDocumento.data_fim)}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Informações Adicionais */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 border-b pb-1">INFORMAÇÕES ADICIONAIS</h3>
                  <div className="text-sm space-y-1">
                    {selectedDocumento.artista?.nome && (
                      <p><strong>Artista:</strong> {selectedDocumento.artista.nome}</p>
                    )}
                    {selectedDocumento.projeto?.nome && (
                      <p><strong>Projeto:</strong> {selectedDocumento.projeto.nome}</p>
                    )}
                    {selectedDocumento.descricao && (
                      <div className="mt-2">
                        <p><strong>Descrição:</strong></p>
                        <p className="whitespace-pre-wrap">{selectedDocumento.descricao}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Termos Legais */}
                {selectedDocumento.termos_legais && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 border-b pb-1">5. TERMOS LEGAIS E CLÁUSULAS</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedDocumento.termos_legais}</p>
                  </div>
                )}

                {/* Assinatura */}
                {selectedDocumento.assinatura && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 border-b pb-1">6. ASSINATURA E CONCORDÂNCIA</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedDocumento.assinatura}</p>
                  </div>
                )}

                {/* Rodapé */}
                <div className="border-t pt-4 mt-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="font-semibold mb-2">CEU MUSIC</p>
                      <p className="text-sm text-gray-600">Gravadora</p>
                      <div className="mt-4 border-t pt-2">
                        <p className="text-xs text-gray-500">Assinatura</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold mb-2">{selectedDocumento.artista?.nome || 'Artista'}</p>
                      <p className="text-sm text-gray-600">Contratado</p>
                      <div className="mt-4 border-t pt-2">
                        <p className="text-xs text-gray-500">Assinatura</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t">
                <button
                  onClick={() => {
                    const printContent = document.getElementById('print-content');
                    if (printContent) {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Contrato - ${selectedDocumento.titulo}</title>
                              <style>
                                body { font-family: Arial, sans-serif; padding: 20px; }
                                h1 { color: #333; }
                                h3 { color: #555; margin-top: 20px; }
                                p { margin: 5px 0; }
                                .border-b { border-bottom: 1px solid #ddd; padding-bottom: 10px; }
                                .border-t { border-top: 1px solid #ddd; padding-top: 10px; }
                                .text-center { text-align: center; }
                                .text-right { text-align: right; }
                                .grid { display: grid; }
                                .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                                .gap-8 { gap: 2rem; }
                                .space-y-4 > * + * { margin-top: 1rem; }
                                .space-y-6 > * + * { margin-top: 1.5rem; }
                                .mt-8 { margin-top: 2rem; }
                                .mb-2 { margin-bottom: 0.5rem; }
                                .pt-4 { padding-top: 1rem; }
                                .whitespace-pre-wrap { white-space: pre-wrap; }
                              </style>
                            </head>
                            <body>
                              ${printContent.innerHTML}
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="ri-printer-line"></i>
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => {
                    setShowPrintModal(false);
                    setSelectedDocumento(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-smooth cursor-pointer"
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

