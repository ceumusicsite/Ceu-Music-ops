import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';

interface Lancamento {
  id: string;
  titulo: string;
  tipo: string;
  artista_id: string | null;
  projeto_id: string | null;
  data_planejada: string;
  data_publicacao: string | null;
  status: string;
  capa_url: string | null;
  isrc: string | null;
  upc: string | null;
  distribuidor: string | null;
  plataformas: Plataforma[];
  descricao: string | null;
  observacoes: string | null;
  total_streams: number;
  total_visualizacoes: number;
  created_at: string;
}

interface Plataforma {
  plataforma: string;
  url: string;
  streams: number;
}

interface Artista {
  id: string;
  nome: string;
}

interface Projeto {
  id: string;
  nome: string;
}

export default function Lancamentos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('todas');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);
  const [selectedLancamento, setSelectedLancamento] = useState<Lancamento | null>(null);
  const [uploading, setUploading] = useState(false);
  const [capaFile, setCapaFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'single',
    artista_id: '',
    projeto_id: '',
    data_planejada: '',
    data_publicacao: '',
    status: 'agendado',
    isrc: '',
    upc: '',
    distribuidor: '',
    descricao: '',
    observacoes: '',
    plataformas: [] as Plataforma[]
  });

  const [newPlataforma, setNewPlataforma] = useState({
    plataforma: 'Spotify',
    url: '',
    streams: 0
  });

  const platforms = ['Spotify', 'YouTube', 'Apple Music', 'Deezer', 'TikTok', 'Amazon Music', 'SoundCloud'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [lancamentosRes, artistasRes, projetosRes] = await Promise.all([
        supabase
          .from('lancamentos')
          .select('*')
          .order('data_planejada', { ascending: false }),
        supabase
          .from('artistas')
          .select('id, nome')
          .eq('status', 'ativo'),
        supabase
          .from('projetos')
          .select('*')
      ]);

      if (lancamentosRes.error) {
        console.error('Erro ao buscar lançamentos:', lancamentosRes.error);
      } else {
        setLancamentos(lancamentosRes.data || []);
      }

      if (!artistasRes.error) setArtistas(artistasRes.data || []);
      if (!projetosRes.error) setProjetos(projetosRes.data || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar lançamentos. Verifique se a tabela foi criada no Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      
      let capaUrl = editingLancamento?.capa_url || null;
      
      // Upload da capa se houver arquivo
      if (capaFile) {
        const fileExt = capaFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `capas/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('lancamentos')
          .upload(filePath, capaFile);

        if (uploadError) {
          console.error('Erro ao fazer upload:', uploadError);
          alert('Erro ao fazer upload da capa. Continuando sem ela...');
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('lancamentos')
            .getPublicUrl(filePath);
          capaUrl = publicUrl;
        }
      }

      // Preparar dados garantindo que campos vazios sejam null
      // Garantir que plataformas seja sempre um array válido
      const plataformasArray = Array.isArray(formData.plataformas) && formData.plataformas.length > 0 
        ? formData.plataformas 
        : [];
      
      // Validar e normalizar status (deve ser um dos valores permitidos)
      const statusValido = ['agendado', 'publicado', 'cancelado', 'adiado'].includes(formData.status?.toLowerCase())
        ? formData.status.toLowerCase()
        : 'agendado'; // Valor padrão se inválido
      
      const lancamentoData: any = {
        titulo: formData.titulo.trim(),
        tipo: formData.tipo,
        status: statusValido,
        data_planejada: formData.data_planejada,
        capa_url: capaUrl,
        plataformas: plataformasArray,
        total_streams: plataformasArray.reduce((sum, p) => sum + (p.streams || 0), 0),
        total_visualizacoes: 0
      };

      // Campos opcionais - só adicionar se tiver valor
      if (formData.artista_id && formData.artista_id.trim()) {
        lancamentoData.artista_id = formData.artista_id;
      }
      
      if (formData.projeto_id && formData.projeto_id.trim()) {
        lancamentoData.projeto_id = formData.projeto_id;
      }
      
      if (formData.data_publicacao && formData.data_publicacao.trim()) {
        lancamentoData.data_publicacao = formData.data_publicacao;
      }
      
      if (formData.isrc && formData.isrc.trim()) {
        lancamentoData.isrc = formData.isrc.trim();
      }
      
      if (formData.upc && formData.upc.trim()) {
        lancamentoData.upc = formData.upc.trim();
      }
      
      if (formData.distribuidor && formData.distribuidor.trim()) {
        lancamentoData.distribuidor = formData.distribuidor.trim();
      }
      
      if (formData.descricao && formData.descricao.trim()) {
        lancamentoData.descricao = formData.descricao.trim();
      }
      
      if (formData.observacoes && formData.observacoes.trim()) {
        lancamentoData.observacoes = formData.observacoes.trim();
      }

      if (editingLancamento) {
        const { error } = await supabase
          .from('lancamentos')
          .update(lancamentoData)
          .eq('id', editingLancamento.id);

        if (error) {
          console.error('Erro detalhado:', error);
          throw new Error(error.message || 'Erro ao atualizar lançamento');
        }
        alert('Lançamento atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('lancamentos')
          .insert([lancamentoData]);

        if (error) {
          console.error('Erro detalhado:', error);
          console.error('Dados enviados:', lancamentoData);
          
          // Mensagem de erro mais específica
          if (error.code === '42P01') {
            throw new Error('Tabela "lancamentos" não existe. Execute o script SQL primeiro!');
          } else if (error.code === '23503') {
            throw new Error('Erro de referência: Verifique se o artista ou projeto existe.');
          } else if (error.code === '23502') {
            // Erro de NOT NULL constraint
            const fieldMatch = error.message.match(/column "(\w+)" of relation/);
            const fieldName = fieldMatch ? fieldMatch[1] : 'desconhecido';
            throw new Error(`Campo obrigatório "${fieldName}" está faltando ou vazio. Verifique o formulário.`);
          } else if (error.code === '23514' || error.message.includes('check constraint')) {
            // Erro de CHECK constraint (status, tipo, etc)
            if (error.message.includes('status')) {
              throw new Error('Status inválido! Use apenas: Agendado, Publicado, Adiado ou Cancelado.');
            } else if (error.message.includes('tipo')) {
              throw new Error('Tipo inválido! Use apenas: Single, EP, Álbum, Clipe, Lyric Video, Podcast ou Outro.');
            } else {
              throw new Error('Valor inválido em um dos campos. Verifique os valores selecionados.');
            }
          } else {
            throw new Error(error.message || 'Erro ao criar lançamento');
          }
        }
        alert('Lançamento criado com sucesso!');
      }

      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar lançamento:', error);
      const errorMessage = error?.message || 'Erro desconhecido ao salvar lançamento.';
      alert(`Erro: ${errorMessage}\n\nVerifique o console para mais detalhes.`);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (lancamento: Lancamento) => {
    setEditingLancamento(lancamento);
    setFormData({
      titulo: lancamento.titulo,
      tipo: lancamento.tipo,
      artista_id: lancamento.artista_id || '',
      projeto_id: lancamento.projeto_id || '',
      data_planejada: lancamento.data_planejada,
      data_publicacao: lancamento.data_publicacao || '',
      status: lancamento.status,
      isrc: lancamento.isrc || '',
      upc: lancamento.upc || '',
      distribuidor: lancamento.distribuidor || '',
      descricao: lancamento.descricao || '',
      observacoes: lancamento.observacoes || '',
      plataformas: lancamento.plataformas || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;

    try {
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('Lançamento excluído com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir lançamento.');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'publicado' && !lancamentos.find(l => l.id === id)?.data_publicacao) {
        updateData.data_publicacao = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('lancamentos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status.');
    }
  };

  const handleUpdateMetrics = async () => {
    if (!selectedLancamento) return;

    try {
      const totalStreams = formData.plataformas.reduce((sum, p) => sum + (p.streams || 0), 0);
      
      const { error } = await supabase
        .from('lancamentos')
        .update({
          plataformas: formData.plataformas,
          total_streams: totalStreams
        })
        .eq('id', selectedLancamento.id);

      if (error) throw error;
      
      alert('Métricas atualizadas com sucesso!');
      setShowMetricsModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar métricas:', error);
      alert('Erro ao atualizar métricas.');
    }
  };

  const addPlataforma = () => {
    if (!newPlataforma.plataforma) return;
    
    setFormData({
      ...formData,
      plataformas: [...formData.plataformas, { ...newPlataforma }]
    });
    
    setNewPlataforma({ plataforma: 'Spotify', url: '', streams: 0 });
  };

  const removePlataforma = (index: number) => {
    setFormData({
      ...formData,
      plataformas: formData.plataformas.filter((_, i) => i !== index)
    });
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      tipo: 'single',
      artista_id: '',
      projeto_id: '',
      data_planejada: '',
      data_publicacao: '',
      status: 'agendado',
      isrc: '',
      upc: '',
      distribuidor: '',
      descricao: '',
      observacoes: '',
      plataformas: []
    });
    setCapaFile(null);
    setEditingLancamento(null);
    setShowModal(false);
  };

  const getArtistaName = (artistaId: string | null) => {
    if (!artistaId) return '-';
    return artistas.find(a => a.id === artistaId)?.nome || '-';
  };

  const getProjetoName = (projetoId: string | null) => {
    if (!projetoId) return '-';
    return projetos.find(p => p.id === projetoId)?.nome || '-';
  };

  const filteredLancamentos = lancamentos.filter(lanc => {
    const matchesSearch = 
      lanc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getArtistaName(lanc.artista_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlatform = filterPlatform === 'todas' || 
      lanc.plataformas?.some(p => p.plataforma === filterPlatform);
    
    const matchesStatus = filterStatus === 'todos' || lanc.status === filterStatus;
    
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'agendado': 'bg-yellow-500/20 text-yellow-400',
      'publicado': 'bg-green-500/20 text-green-400',
      'cancelado': 'bg-red-500/20 text-red-400',
      'adiado': 'bg-gray-500/20 text-gray-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'agendado': 'Agendado',
      'publicado': 'Publicado',
      'cancelado': 'Cancelado',
      'adiado': 'Adiado',
    };
    return labels[status] || status;
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'single': 'Single',
      'ep': 'EP',
      'album': 'Álbum',
      'clipe': 'Clipe',
      'lyric_video': 'Lyric Video',
      'podcast': 'Podcast',
      'outro': 'Outro',
    };
    return labels[tipo] || tipo;
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      'Spotify': 'ri-spotify-line',
      'YouTube': 'ri-youtube-line',
      'Apple Music': 'ri-apple-line',
      'Deezer': 'ri-music-line',
      'TikTok': 'ri-tiktok-line',
      'Amazon Music': 'ri-amazon-line',
      'SoundCloud': 'ri-soundcloud-line',
    };
    return icons[platform] || 'ri-music-line';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleExportarRelatorio = () => {
    try {
      const dadosExportacao = filteredLancamentos.map(lanc => ({
        'Título': lanc.titulo,
        'Tipo': getTipoLabel(lanc.tipo),
        'Artista': getArtistaName(lanc.artista_id),
        'Projeto': getProjetoName(lanc.projeto_id),
        'Status': getStatusLabel(lanc.status),
        'Data Planejada': lanc.data_planejada ? new Date(lanc.data_planejada).toLocaleDateString('pt-BR') : '-',
        'Data Publicação': lanc.data_publicacao ? new Date(lanc.data_publicacao).toLocaleDateString('pt-BR') : '-',
        'Total Streams': lanc.total_streams || 0,
        'ISRC': lanc.isrc || '-',
        'UPC': lanc.upc || '-',
        'Distribuidor': lanc.distribuidor || '-',
        'Plataformas': lanc.plataformas?.map(p => p.plataforma).join(', ') || '-',
        'Descrição': lanc.descricao || '-'
      }));

      const headers = Object.keys(dadosExportacao[0] || {});
      const csvContent = [
        headers.join(';'),
        ...dadosExportacao.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            return typeof value === 'string' && (value.includes(';') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          }).join(';')
        )
      ].join('\n');

      const estatisticas = [
        'RELATÓRIO DE LANÇAMENTOS',
        `Data de Geração: ${new Date().toLocaleString('pt-BR')}`,
        '',
        'RESUMO:',
        `Total de Lançamentos: ${totalLancamentos}`,
        `Agendados: ${totalAgendados}`,
        `Publicados: ${totalPublicados}`,
        `Total de Streams: ${totalStreams.toLocaleString('pt-BR')}`,
        '',
        'DETALHAMENTO:',
        ''
      ].join('\n');

      const csvFinal = estatisticas + csvContent;
      const blob = new Blob(['\ufeff' + csvFinal], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio-lancamentos-${new Date().toISOString().split('T')[0]}.csv`);
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

  const totalLancamentos = lancamentos.length;
  const totalAgendados = lancamentos.filter(l => l.status === 'agendado').length;
  const totalPublicados = lancamentos.filter(l => l.status === 'publicado').length;
  const totalStreams = lancamentos.reduce((sum, l) => sum + (l.total_streams || 0), 0);

  const stats = [
    { label: 'Total de Lançamentos', value: totalLancamentos, icon: 'ri-rocket-line', color: 'from-primary-teal to-primary-brown' },
    { label: 'Agendados', value: totalAgendados, icon: 'ri-calendar-line', color: 'from-yellow-500 to-yellow-700' },
    { label: 'Publicados', value: totalPublicados, icon: 'ri-check-double-line', color: 'from-green-500 to-green-700' },
    { label: 'Total de Streams', value: formatNumber(totalStreams), icon: 'ri-bar-chart-line', color: 'from-purple-500 to-purple-700' },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-6xl text-primary-teal animate-spin mb-4"></i>
            <p className="text-gray-400">Carregando lançamentos...</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Lançamentos</h1>
            <p className="text-gray-400">Controle de lançamentos por plataforma</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleExportarRelatorio}
              className="px-6 py-3 bg-dark-card border border-dark-border text-white font-medium rounded-lg hover:border-primary-teal transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <i className="ri-download-line text-xl"></i>
              Exportar
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <i className="ri-add-line text-xl"></i>
              Novo Lançamento
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="text"
                placeholder="Buscar lançamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
            >
              <option value="todos">Todos os Status</option>
              <option value="agendado">Agendado</option>
              <option value="publicado">Publicado</option>
              <option value="adiado">Adiado</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
            >
              <option value="todas">Todas as Plataformas</option>
              {platforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lançamentos Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLancamentos.map((lanc) => (
            <div key={lanc.id} className="bg-dark-card border border-dark-border rounded-xl overflow-hidden hover:border-primary-teal transition-smooth">
              {/* Capa */}
              {lanc.capa_url ? (
                <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${lanc.capa_url})` }}></div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-primary-teal to-primary-brown flex items-center justify-center">
                  <i className="ri-music-line text-6xl text-white/30"></i>
                </div>
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{lanc.titulo}</h3>
                    <p className="text-sm text-gray-400">{getArtistaName(lanc.artista_id)}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-primary-teal/20 text-primary-teal text-xs rounded-full">
                      {getTipoLabel(lanc.tipo)}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(lanc.status)}`}>
                    {getStatusLabel(lanc.status)}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Data Planejada:</span>
                    <span className="text-white">{new Date(lanc.data_planejada).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {lanc.data_publicacao && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Publicado em:</span>
                      <span className="text-white">{new Date(lanc.data_publicacao).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  {lanc.total_streams > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Total Streams:</span>
                      <span className="text-primary-teal font-semibold">{formatNumber(lanc.total_streams)}</span>
                    </div>
                  )}
                </div>

                {/* Plataformas */}
                {lanc.plataformas && lanc.plataformas.length > 0 && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {lanc.plataformas.map((plat, idx) => (
                      <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-dark-bg rounded-lg">
                        <i className={`${getPlatformIcon(plat.plataforma)} text-sm text-gray-400`}></i>
                        <span className="text-xs text-gray-300">{plat.plataforma}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {lanc.status === 'agendado' && (
                    <button 
                      onClick={() => handleUpdateStatus(lanc.id, 'publicado')}
                      className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm rounded-lg transition-smooth cursor-pointer"
                    >
                      <i className="ri-check-line mr-1"></i>
                      Publicar
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedLancamento(lanc);
                      setFormData({ ...formData, plataformas: lanc.plataformas || [] });
                      setShowMetricsModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-primary-teal/20 hover:bg-primary-teal/30 text-primary-teal text-sm rounded-lg transition-smooth cursor-pointer"
                  >
                    <i className="ri-bar-chart-line mr-1"></i>
                    Métricas
                  </button>
                  <button 
                    onClick={() => handleEdit(lanc)}
                    className="px-3 py-2 bg-dark-bg hover:bg-dark-hover text-white text-sm rounded-lg transition-smooth cursor-pointer"
                  >
                    <i className="ri-edit-line"></i>
                  </button>
                  <button 
                    onClick={() => handleDelete(lanc.id)}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-lg transition-smooth cursor-pointer"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLancamentos.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-rocket-line text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhum lançamento encontrado</p>
            <button 
              onClick={() => setShowModal(true)}
              className="mt-4 px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
            >
              Criar Primeiro Lançamento
            </button>
          </div>
        )}

        {/* Modal Novo/Editar Lançamento */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-dark-card border-b border-dark-border px-8 py-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-white">
                  {editingLancamento ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h2>
                <button 
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="px-8 py-6">

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Grid de 2 colunas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Título */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: Single Verão 2024"
                    />
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Tipo *
                    </label>
                    <select
                      required
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    >
                      <option value="single">Single</option>
                      <option value="ep">EP</option>
                      <option value="album">Álbum</option>
                      <option value="clipe">Clipe</option>
                      <option value="lyric_video">Lyric Video</option>
                      <option value="podcast">Podcast</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Status *
                    </label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    >
                      <option value="agendado">Agendado</option>
                      <option value="publicado">Publicado</option>
                      <option value="adiado">Adiado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  {/* Artista */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Artista
                    </label>
                    <select
                      value={formData.artista_id}
                      onChange={(e) => setFormData({ ...formData, artista_id: e.target.value })}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    >
                      <option value="">Selecione um artista</option>
                      {artistas.map(artista => (
                        <option key={artista.id} value={artista.id}>{artista.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Projeto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Projeto
                    </label>
                    <select
                      value={formData.projeto_id}
                      onChange={(e) => setFormData({ ...formData, projeto_id: e.target.value })}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    >
                      <option value="">Selecione um projeto</option>
                      {projetos.map(projeto => (
                        <option key={projeto.id} value={projeto.id}>{getProjetoName(projeto.id)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Data Planejada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Data Planejada *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.data_planejada}
                      onChange={(e) => setFormData({ ...formData, data_planejada: e.target.value })}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    />
                  </div>

                  {/* Data Publicação */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Data de Publicação
                    </label>
                    <input
                      type="date"
                      value={formData.data_publicacao}
                      onChange={(e) => setFormData({ ...formData, data_publicacao: e.target.value })}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    />
                  </div>

                  {/* ISRC */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      ISRC
                    </label>
                    <input
                      type="text"
                      value={formData.isrc}
                      onChange={(e) => setFormData({ ...formData, isrc: e.target.value })}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: BRAB71234567"
                    />
                  </div>

                  {/* UPC */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      UPC
                    </label>
                    <input
                      type="text"
                      value={formData.upc}
                      onChange={(e) => setFormData({ ...formData, upc: e.target.value })}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: 123456789012"
                    />
                  </div>

                  {/* Distribuidor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Distribuidor
                    </label>
                    <input
                      type="text"
                      value={formData.distribuidor}
                      onChange={(e) => setFormData({ ...formData, distribuidor: e.target.value })}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: DistroKid, CD Baby, etc"
                    />
                  </div>

                  {/* Capa */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Capa do Lançamento
                    </label>
                    <input
                      type="file"
                      id="capa-upload"
                      accept="image/*"
                      onChange={(e) => setCapaFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="capa-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-4 bg-dark-bg border-2 border-dashed border-dark-border rounded-lg hover:border-primary-teal transition-smooth cursor-pointer"
                    >
                      <i className="ri-image-add-line text-xl text-gray-400"></i>
                      <span className="text-sm text-gray-300">
                        {capaFile ? capaFile.name : (editingLancamento?.capa_url ? 'Alterar capa' : 'Clique para selecionar imagem')}
                      </span>
                    </label>
                  </div>

                  {/* Descrição */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                      placeholder="Descrição do lançamento..."
                    />
                  </div>

                  {/* Observações */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Observações Internas
                    </label>
                    <textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                      placeholder="Observações internas..."
                    />
                  </div>
                </div>

                {/* Plataformas */}
                <div className="border-t border-dark-border pt-4">
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Plataformas e Links
                  </label>
                  
                  {/* Lista de plataformas adicionadas */}
                  {formData.plataformas.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {formData.plataformas.map((plat, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 bg-dark-bg rounded-lg">
                          <i className={`${getPlatformIcon(plat.plataforma)} text-lg text-gray-400`}></i>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm">{plat.plataforma}</p>
                            {plat.url && <p className="text-xs text-gray-400 truncate">{plat.url}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => removePlataforma(idx)}
                            className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-smooth flex-shrink-0"
                          >
                            <i className="ri-close-line text-lg"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Adicionar nova plataforma */}
                  <div className="flex gap-2">
                    <select
                      value={newPlataforma.plataforma}
                      onChange={(e) => setNewPlataforma({ ...newPlataforma, plataforma: e.target.value })}
                      className="w-40 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    >
                      {platforms.map(platform => (
                        <option key={platform} value={platform}>{platform}</option>
                      ))}
                    </select>
                    <input
                      type="url"
                      value={newPlataforma.url}
                      onChange={(e) => setNewPlataforma({ ...newPlataforma, url: e.target.value })}
                      placeholder="URL da plataforma (opcional)"
                      className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    />
                    <button
                      type="button"
                      onClick={addPlataforma}
                      className="px-4 py-2 bg-primary-teal/20 hover:bg-primary-teal/30 text-primary-teal rounded-lg transition-smooth text-sm font-medium whitespace-nowrap"
                    >
                      <i className="ri-add-line"></i>
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-dark-border mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {uploading ? 'Salvando...' : (editingLancamento ? 'Atualizar' : 'Criar Lançamento')}
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Atualizar Métricas */}
        {showMetricsModal && selectedLancamento && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-8 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Atualizar Métricas</h2>
                <button 
                  onClick={() => setShowMetricsModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">{selectedLancamento.titulo}</h3>
                <p className="text-sm text-gray-400">{getArtistaName(selectedLancamento.artista_id)}</p>
              </div>

              <div className="space-y-4">
                {formData.plataformas.map((plat, idx) => (
                  <div key={idx} className="p-4 bg-dark-bg rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <i className={`${getPlatformIcon(plat.plataforma)} text-2xl text-gray-400`}></i>
                      <div className="flex-1">
                        <p className="text-white font-medium">{plat.plataforma}</p>
                        {plat.url && (
                          <a 
                            href={plat.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-primary-teal hover:underline"
                          >
                            Abrir Link
                          </a>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Streams/Views</label>
                      <input
                        type="number"
                        min="0"
                        value={plat.streams || 0}
                        onChange={(e) => {
                          const newPlataformas = [...formData.plataformas];
                          newPlataformas[idx].streams = parseInt(e.target.value) || 0;
                          setFormData({ ...formData, plataformas: newPlataformas });
                        }}
                        className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-teal transition-smooth"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-6 border-t border-dark-border mt-6">
                <button
                  onClick={() => setShowMetricsModal(false)}
                  className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateMetrics}
                  className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
                >
                  Salvar Métricas
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
