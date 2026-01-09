import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';
import YouTubePreview from '../../components/projetos/YouTubePreview';
import ReferenciaForm from '../../components/projetos/ReferenciaForm';
import FileUpload from '../../components/projetos/FileUpload';
import { fornecedoresMock } from '../../data/fornecedores-mock';
import { produtoresMock } from '../../data/produtores-mock';

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
  fornecedor_audio_id?: string;
  fornecedor_video_id?: string;
  local_gravacao_id?: string;
  produtor_id?: string;
  maquiador_id?: string;
  outros_profissionais?: string[];
}

interface Faixa {
  id: string;
  projeto_id: string;
  nome: string;
  status: 'pendente' | 'gravada' | 'em_mixagem' | 'masterizacao' | 'finalizada' | 'lancada';
  o_que_falta_gravar?: string;
  ordem: number;
  // Lançamento
  data_lancamento?: string;
  plataformas_lancamento?: string[];
  link_spotify?: string;
  link_youtube?: string;
  link_apple_music?: string;
  link_deezer?: string;
  link_outros?: string[];
  // Ficha técnica
  compositores?: string[];
  letristas?: string[];
  arranjadores?: string[];
  produtores_musicais?: string[];
  engenheiros_audio?: string[];
  mixagem?: string;
  masterizacao?: string;
  gravacao_local?: string;
  gravacao_data?: string;
  genero?: string;
  duracao?: string;
  bpm?: number;
  tonalidade?: string;
  observacoes_ficha_tecnica?: string;
  // Áudio/Vídeo
  audio_video?: FaixaAudioVideo[];
}

interface FaixaAudioVideo {
  id: string;
  faixa_id: string;
  tipo: 'audio' | 'video';
  formato: 'arquivo' | 'link';
  arquivo_url?: string;
  arquivo_nome?: string;
  link_url?: string;
  descricao?: string;
  versao?: string;
  created_at: string;
}

interface Orcamento {
  id: string;
  projeto_id: string;
  valor_total: number;
  valor_realizado: number;
  status: string;
}

interface Referencia {
  id: string;
  projeto_id: string;
  faixa_id?: string;
  tipo: 'youtube_url' | 'arquivo';
  url?: string;
  arquivo_url?: string;
  arquivo_nome?: string;
  titulo: string;
  descricao?: string;
  created_at: string;
}

interface Anexo {
  id: string;
  projeto_id: string;
  faixa_id?: string;
  tipo: 'pre' | 'outro';
  arquivo_url: string;
  arquivo_nome: string;
  descricao?: string;
  created_at: string;
}

export default function ProjetoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [faixas, setFaixas] = useState<Faixa[]>([]);
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [referencias, setReferencias] = useState<Referencia[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFaixaModal, setShowFaixaModal] = useState(false);
  const [showFaseDropdown, setShowFaseDropdown] = useState(false);
  const [showReferenciaModal, setShowReferenciaModal] = useState(false);
  const [showAnexoModal, setShowAnexoModal] = useState(false);
  const [editingFaixa, setEditingFaixa] = useState<Faixa | null>(null);
  const [selectedFaixaForReferencia, setSelectedFaixaForReferencia] = useState<string | null>(null);
  const [selectedFaixaForAnexo, setSelectedFaixaForAnexo] = useState<string | null>(null);
  const [editandoEstudio, setEditandoEstudio] = useState(false);
  const [editandoObservacoes, setEditandoObservacoes] = useState(false);
  const [estudioTemp, setEstudioTemp] = useState('');
  const [observacoesTemp, setObservacoesTemp] = useState('');
  const [faixaFormData, setFaixaFormData] = useState({
    nome: '',
    status: 'pendente' as Faixa['status'],
    o_que_falta_gravar: ''
  });
  const [expandedFaixas, setExpandedFaixas] = useState<Set<string>>(new Set());
  const [showLancamentoModal, setShowLancamentoModal] = useState(false);
  const [showFichaTecnicaModal, setShowFichaTecnicaModal] = useState(false);
  const [showAudioVideoModal, setShowAudioVideoModal] = useState(false);
  const [selectedFaixaForModal, setSelectedFaixaForModal] = useState<Faixa | null>(null);
  const [audioVideoFormato, setAudioVideoFormato] = useState<'link' | 'arquivo'>('link');

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
        setEstudioTemp(projetoData.estudio || '');
        setObservacoesTemp(projetoData.observacoes_tecnicas || '');
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
      
      if (faixasData) {
        // Carregar áudio/vídeo de cada faixa
        const faixasComAudioVideo = await Promise.all(
          faixasData.map(async (faixa) => {
            const { data: audioVideoData } = await supabase
              .from('faixa_audio_video')
              .select('*')
              .eq('faixa_id', faixa.id)
              .order('created_at', { ascending: false });
            
            return {
              ...faixa,
              audio_video: audioVideoData || []
            };
          })
        );
        setFaixas(faixasComAudioVideo);
      }

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

      // Carregar referências do projeto
      const { data: referenciasData } = await supabase
        .from('projeto_referencias')
        .select('*')
        .eq('projeto_id', id)
        .order('created_at', { ascending: false });

      if (referenciasData) setReferencias(referenciasData);

      // Carregar anexos do projeto
      const { data: anexosData } = await supabase
        .from('projeto_anexos')
        .select('*')
        .eq('projeto_id', id)
        .order('created_at', { ascending: false });

      if (anexosData) setAnexos(anexosData);
    } catch (error) {
      console.error('Erro ao carregar dados do projeto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEstudio = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('projetos')
        .update({
          estudio: estudioTemp || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setEditandoEstudio(false);
      loadProjetoData();
    } catch (error) {
      console.error('Erro ao atualizar estúdio:', error);
      alert('Erro ao atualizar estúdio. Tente novamente.');
    }
  };

  const handleUpdateObservacoes = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('projetos')
        .update({
          observacoes_tecnicas: observacoesTemp || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setEditandoObservacoes(false);
      loadProjetoData();
    } catch (error) {
      console.error('Erro ao atualizar observações:', error);
      alert('Erro ao atualizar observações. Tente novamente.');
    }
  };

  const handleUpdateProdutor = async (produtorId: string | null) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('projetos')
        .update({
          produtor_id: produtorId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      loadProjetoData();
    } catch (error) {
      console.error('Erro ao atualizar produtor:', error);
      alert('Erro ao atualizar produtor. Tente novamente.');
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
    { value: 'em_fase_lancamento', label: 'Em fase de lançamento' },
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
        status: 'pendente' as Faixa['status'],
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
      'em_fase_lancamento': 'Em fase de lançamento',
      'lancado': 'Lançado'
    };
    return labels[fase] || fase;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pendente': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'gravada': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'em_mixagem': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'masterizacao': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'finalizada': 'bg-green-500/20 text-green-400 border-green-500/30',
      'lancada': 'bg-primary-teal/20 text-primary-teal border-primary-teal/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pendente': 'Pendente',
      'gravada': 'Gravada',
      'em_mixagem': 'Em Mixagem',
      'masterizacao': 'Masterização',
      'finalizada': 'Finalizada',
      'lancada': 'Lançada',
    };
    return labels[status] || status;
  };

  const handleSaveReferencia = async (referencia: {
    tipo: 'youtube_url' | 'arquivo';
    url?: string;
    arquivo_url?: string;
    arquivo_nome?: string;
    titulo: string;
    descricao?: string;
  }) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('projeto_referencias')
        .insert([{
          projeto_id: id,
          faixa_id: selectedFaixaForReferencia || null,
          tipo: referencia.tipo,
          url: referencia.url || null,
          arquivo_url: referencia.arquivo_url || null,
          arquivo_nome: referencia.arquivo_nome || null,
          titulo: referencia.titulo,
          descricao: referencia.descricao || null,
        }]);

      if (error) throw error;

      setShowReferenciaModal(false);
      setSelectedFaixaForReferencia(null);
      loadProjetoData();
    } catch (error) {
      console.error('Erro ao salvar referência:', error);
      throw error;
    }
  };

  const handleDeleteReferencia = async (referenciaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta referência?')) return;

    try {
      const { error } = await supabase
        .from('projeto_referencias')
        .delete()
        .eq('id', referenciaId);

      if (error) throw error;

      loadProjetoData();
    } catch (error) {
      console.error('Erro ao excluir referência:', error);
      alert('Erro ao excluir referência. Tente novamente.');
    }
  };

  const handleSaveAnexo = async (arquivoUrl: string, arquivoNome: string, tipo: 'pre' | 'outro', descricao?: string) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('projeto_anexos')
        .insert([{
          projeto_id: id,
          faixa_id: selectedFaixaForAnexo || null,
          tipo,
          arquivo_url: arquivoUrl,
          arquivo_nome: arquivoNome,
          descricao: descricao || null,
        }]);

      if (error) throw error;

      setShowAnexoModal(false);
      setSelectedFaixaForAnexo(null);
      loadProjetoData();
    } catch (error) {
      console.error('Erro ao salvar anexo:', error);
      alert('Erro ao salvar anexo. Tente novamente.');
    }
  };

  const handleDeleteAnexo = async (anexoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este anexo?')) return;

    try {
      const { error } = await supabase
        .from('projeto_anexos')
        .delete()
        .eq('id', anexoId);

      if (error) throw error;

      loadProjetoData();
    } catch (error) {
      console.error('Erro ao excluir anexo:', error);
      alert('Erro ao excluir anexo. Tente novamente.');
    }
  };

  const toggleFaixaExpanded = (faixaId: string) => {
    const newExpanded = new Set(expandedFaixas);
    if (newExpanded.has(faixaId)) {
      newExpanded.delete(faixaId);
    } else {
      newExpanded.add(faixaId);
    }
    setExpandedFaixas(newExpanded);
  };

  const handleSaveLancamento = async (faixaId: string, lancamentoData: any) => {
    try {
      const { error } = await supabase
        .from('faixas')
        .update(lancamentoData)
        .eq('id', faixaId);

      if (error) throw error;

      setShowLancamentoModal(false);
      setSelectedFaixaForModal(null);
      loadProjetoData();
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      alert('Erro ao salvar informações de lançamento. Tente novamente.');
    }
  };

  const handleSaveFichaTecnica = async (faixaId: string, fichaTecnicaData: any) => {
    try {
      const { error } = await supabase
        .from('faixas')
        .update(fichaTecnicaData)
        .eq('id', faixaId);

      if (error) throw error;

      setShowFichaTecnicaModal(false);
      setSelectedFaixaForModal(null);
      loadProjetoData();
    } catch (error) {
      console.error('Erro ao salvar ficha técnica:', error);
      alert('Erro ao salvar ficha técnica. Tente novamente.');
    }
  };

  const handleSaveAudioVideo = async (faixaId: string, audioVideoData: {
    tipo: 'audio' | 'video';
    formato: 'arquivo' | 'link';
    arquivo_url?: string;
    arquivo_nome?: string;
    link_url?: string;
    descricao?: string;
    versao?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('faixa_audio_video')
        .insert([{
          faixa_id: faixaId,
          ...audioVideoData
        }]);

      if (error) throw error;

      setShowAudioVideoModal(false);
      setSelectedFaixaForModal(null);
      loadProjetoData();
    } catch (error) {
      console.error('Erro ao salvar áudio/vídeo:', error);
      alert('Erro ao salvar áudio/vídeo. Tente novamente.');
    }
  };

  const handleDeleteAudioVideo = async (audioVideoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este áudio/vídeo?')) return;

    try {
      const { error } = await supabase
        .from('faixa_audio_video')
        .delete()
        .eq('id', audioVideoId);

      if (error) throw error;

      loadProjetoData();
    } catch (error) {
      console.error('Erro ao excluir áudio/vídeo:', error);
      alert('Erro ao excluir áudio/vídeo. Tente novamente.');
    }
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

  const faixasGravadas = faixas.filter(f => f.status === 'gravada' || f.status === 'em_mixagem' || f.status === 'masterizacao' || f.status === 'finalizada' || f.status === 'lancada').length;
  const faixasPendentes = faixas.filter(f => f.status === 'pendente').length;
  const faixasFinalizadas = faixas.filter(f => f.status === 'finalizada' || f.status === 'lancada').length;

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
          </div>
        </div>

        {/* Estatísticas de Faixas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
                <p className="text-sm text-gray-400 mb-1">Em Andamento</p>
                <p className="text-2xl font-bold text-blue-400">{faixasGravadas}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <i className="ri-play-circle-line text-blue-400 text-xl"></i>
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
                <p className="text-sm text-gray-400 mb-1">Finalizadas</p>
                <p className="text-2xl font-bold text-green-400">{faixasFinalizadas}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-green-400 text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Progresso</p>
                <p className="text-2xl font-bold text-white">
                  {faixas.length > 0 ? Math.round((faixasFinalizadas / faixas.length) * 100) : 0}%
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
                      status: 'pendente' as Faixa['status'],
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
                  {faixas.map((faixa, index) => {
                    const isExpanded = expandedFaixas.has(faixa.id);
                    return (
                      <div
                        key={faixa.id}
                        className="bg-dark-bg border border-dark-border rounded-lg overflow-hidden hover:border-primary-teal transition-smooth"
                      >
                        {/* Header da Faixa */}
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-8 h-8 rounded-full bg-dark-card border border-dark-border flex items-center justify-center text-sm text-gray-400 mt-0.5">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-sm font-medium text-white mb-2">{faixa.nome}</h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="relative">
                                    <select
                                      value={faixa.status}
                                      onChange={(e) => {
                                        const novoStatus = e.target.value as Faixa['status'];
                                        supabase
                                          .from('faixas')
                                          .update({ status: novoStatus })
                                          .eq('id', faixa.id)
                                          .then(() => loadProjetoData());
                                      }}
                                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-smooth cursor-pointer ${getStatusColor(faixa.status)} bg-transparent`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <option value="pendente">Pendente</option>
                                      <option value="gravada">Gravada</option>
                                      <option value="em_mixagem">Em Mixagem</option>
                                      <option value="masterizacao">Masterização</option>
                                      <option value="finalizada">Finalizada</option>
                                      <option value="lancada">Lançada</option>
                                    </select>
                                  </div>
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
                                onClick={() => toggleFaixaExpanded(faixa.id)}
                                className="p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer"
                                title={isExpanded ? 'Recolher' : 'Expandir'}
                              >
                                <i className={`ri-${isExpanded ? 'arrow-up' : 'arrow-down'}-s-line text-gray-400 hover:text-primary-teal`}></i>
                              </button>
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

                        {/* Conteúdo Expandido */}
                        {isExpanded && (
                          <div className="border-t border-dark-border p-4 space-y-4">
                            {/* Seção Lançamento */}
                            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                  <i className="ri-calendar-event-line text-primary-teal"></i>
                                  Informações de Lançamento
                                </h4>
                                <button
                                  onClick={() => {
                                    setSelectedFaixaForModal(faixa);
                                    setShowLancamentoModal(true);
                                  }}
                                  className="px-3 py-1 bg-primary-teal/20 text-primary-teal text-xs rounded-lg hover:bg-primary-teal/30 transition-smooth cursor-pointer"
                                >
                                  <i className="ri-edit-line mr-1"></i>
                                  Editar
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-400">Data de Lançamento:</span>
                                  <span className="text-white ml-2">{faixa.data_lancamento ? new Date(faixa.data_lancamento).toLocaleDateString('pt-BR') : 'Não informado'}</span>
                                </div>
                                {faixa.link_spotify && (
                                  <div>
                                    <a href={faixa.link_spotify} target="_blank" rel="noopener noreferrer" className="text-primary-teal hover:underline flex items-center gap-1">
                                      <i className="ri-spotify-line"></i>
                                      Spotify
                                    </a>
                                  </div>
                                )}
                                {faixa.link_youtube && (
                                  <div>
                                    <a href={faixa.link_youtube} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline flex items-center gap-1">
                                      <i className="ri-youtube-line"></i>
                                      YouTube
                                    </a>
                                  </div>
                                )}
                                {faixa.link_apple_music && (
                                  <div>
                                    <a href={faixa.link_apple_music} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline flex items-center gap-1">
                                      <i className="ri-apple-line"></i>
                                      Apple Music
                                    </a>
                                  </div>
                                )}
                                {faixa.link_deezer && (
                                  <div>
                                    <a href={faixa.link_deezer} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline flex items-center gap-1">
                                      <i className="ri-music-line"></i>
                                      Deezer
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Seção Ficha Técnica */}
                            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                  <i className="ri-file-text-line text-primary-teal"></i>
                                  Ficha Técnica
                                </h4>
                                <button
                                  onClick={() => {
                                    setSelectedFaixaForModal(faixa);
                                    setShowFichaTecnicaModal(true);
                                  }}
                                  className="px-3 py-1 bg-primary-teal/20 text-primary-teal text-xs rounded-lg hover:bg-primary-teal/30 transition-smooth cursor-pointer"
                                >
                                  <i className="ri-edit-line mr-1"></i>
                                  Editar
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                {faixa.compositores && faixa.compositores.length > 0 && (
                                  <div>
                                    <span className="text-gray-400">Compositores:</span>
                                    <span className="text-white ml-2">{faixa.compositores.join(', ')}</span>
                                  </div>
                                )}
                                {faixa.letristas && faixa.letristas.length > 0 && (
                                  <div>
                                    <span className="text-gray-400">Letristas:</span>
                                    <span className="text-white ml-2">{faixa.letristas.join(', ')}</span>
                                  </div>
                                )}
                                {faixa.produtores_musicais && faixa.produtores_musicais.length > 0 && (
                                  <div>
                                    <span className="text-gray-400">Produtores:</span>
                                    <span className="text-white ml-2">{faixa.produtores_musicais.join(', ')}</span>
                                  </div>
                                )}
                                {faixa.mixagem && (
                                  <div>
                                    <span className="text-gray-400">Mixagem:</span>
                                    <span className="text-white ml-2">{faixa.mixagem}</span>
                                  </div>
                                )}
                                {faixa.masterizacao && (
                                  <div>
                                    <span className="text-gray-400">Masterização:</span>
                                    <span className="text-white ml-2">{faixa.masterizacao}</span>
                                  </div>
                                )}
                                {faixa.genero && (
                                  <div>
                                    <span className="text-gray-400">Gênero:</span>
                                    <span className="text-white ml-2">{faixa.genero}</span>
                                  </div>
                                )}
                                {faixa.bpm && (
                                  <div>
                                    <span className="text-gray-400">BPM:</span>
                                    <span className="text-white ml-2">{faixa.bpm}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Seção Áudio e Vídeo */}
                            <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                  <i className="ri-music-2-line text-primary-teal"></i>
                                  Áudio e Vídeo
                                </h4>
                                <button
                                  onClick={() => {
                                    setSelectedFaixaForModal(faixa);
                                    setShowAudioVideoModal(true);
                                  }}
                                  className="px-3 py-1 bg-primary-teal/20 text-primary-teal text-xs rounded-lg hover:bg-primary-teal/30 transition-smooth cursor-pointer"
                                >
                                  <i className="ri-add-line mr-1"></i>
                                  Adicionar
                                </button>
                              </div>
                              {faixa.audio_video && faixa.audio_video.length > 0 ? (
                                <div className="space-y-2">
                                  {faixa.audio_video.map((av) => (
                                    <div key={av.id} className="flex items-center justify-between p-2 bg-dark-bg border border-dark-border rounded">
                                      <div className="flex items-center gap-2">
                                        <i className={`ri-${av.tipo === 'audio' ? 'music-2-line' : 'video-line'} text-primary-teal`}></i>
                                        <span className="text-white text-xs">{av.versao || `${av.tipo} - ${av.formato}`}</span>
                                        {av.descricao && <span className="text-gray-400 text-xs">({av.descricao})</span>}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {av.formato === 'link' && av.link_url && (
                                          <a href={av.link_url} target="_blank" rel="noopener noreferrer" className="text-primary-teal hover:underline text-xs">
                                            <i className="ri-external-link-line"></i>
                                          </a>
                                        )}
                                        {av.formato === 'arquivo' && av.arquivo_url && (
                                          <a href={av.arquivo_url} target="_blank" rel="noopener noreferrer" className="text-primary-teal hover:underline text-xs">
                                            <i className="ri-download-line"></i>
                                          </a>
                                        )}
                                        <button
                                          onClick={() => handleDeleteAudioVideo(av.id)}
                                          className="text-red-400 hover:text-red-300 text-xs"
                                        >
                                          <i className="ri-delete-bin-line"></i>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500 italic">Nenhum áudio ou vídeo cadastrado</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                  {editandoEstudio ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={estudioTemp}
                        onChange={(e) => setEstudioTemp(e.target.value)}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Ex: Estúdio XYZ"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateEstudio}
                          className="px-3 py-1.5 bg-primary-teal text-white text-sm rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => {
                            setEstudioTemp(projeto.estudio || '');
                            setEditandoEstudio(false);
                          }}
                          className="px-3 py-1.5 bg-dark-bg hover:bg-dark-hover text-white text-sm rounded-lg transition-smooth cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-3 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg flex-1">
                        <i className="ri-building-line text-primary-teal"></i>
                        <span className="text-white">{projeto.estudio || 'Não informado'}</span>
                      </div>
                      <button
                        onClick={() => setEditandoEstudio(true)}
                        className="ml-2 p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Editar estúdio"
                      >
                        <i className="ri-edit-line text-gray-400 hover:text-primary-teal"></i>
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Produtor Responsável</label>
                  <select
                    value={projeto.produtor_id || ''}
                    onChange={(e) => handleUpdateProdutor(e.target.value || null)}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="">Selecione um produtor</option>
                    {produtoresMock.map((produtor) => (
                      <option key={produtor.id} value={produtor.id}>
                        {produtor.nome}
                      </option>
                    ))}
                  </select>
                  {projeto.produtor_id && (
                    <div className="mt-2 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <i className="ri-user-line text-primary-teal"></i>
                        <span className="text-white">
                          {produtoresMock.find(p => p.id === projeto.produtor_id)?.nome}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Observações Técnicas</h2>
                {!editandoObservacoes && (
                  <button
                    onClick={() => setEditandoObservacoes(true)}
                    className="p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer"
                    title="Editar observações"
                  >
                    <i className="ri-edit-line text-gray-400 hover:text-primary-teal"></i>
                  </button>
                )}
              </div>
              {editandoObservacoes ? (
                <div className="space-y-3">
                  <textarea
                    value={observacoesTemp}
                    onChange={(e) => setObservacoesTemp(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Observações técnicas sobre a gravação..."
                    rows={6}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateObservacoes}
                      className="px-4 py-2 bg-primary-teal text-white text-sm rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setObservacoesTemp(projeto.observacoes_tecnicas || '');
                        setEditandoObservacoes(false);
                      }}
                      className="px-4 py-2 bg-dark-bg hover:bg-dark-hover text-white text-sm rounded-lg transition-smooth cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4 min-h-[200px]">
                  {projeto.observacoes_tecnicas ? (
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{projeto.observacoes_tecnicas}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Nenhuma observação técnica cadastrada</p>
                  )}
                </div>
              )}
            </div>

            {/* Fornecedores e Profissionais */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-6">Fornecedores e Profissionais</h2>
              <div className="space-y-4">
                {projeto.fornecedor_audio_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Fornecedor de Áudio</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg">
                      <i className="ri-mic-line text-primary-teal"></i>
                      <span className="text-white">
                        {fornecedoresMock.find(f => f.id === projeto.fornecedor_audio_id)?.nome || 'Não encontrado'}
                      </span>
                    </div>
                  </div>
                )}
                {projeto.fornecedor_video_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Fornecedor de Vídeo</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg">
                      <i className="ri-video-line text-primary-teal"></i>
                      <span className="text-white">
                        {fornecedoresMock.find(f => f.id === projeto.fornecedor_video_id)?.nome || 'Não encontrado'}
                      </span>
                    </div>
                  </div>
                )}
                {projeto.local_gravacao_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Local de Gravação</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg">
                      <i className="ri-building-line text-primary-teal"></i>
                      <span className="text-white">
                        {fornecedoresMock.find(f => f.id === projeto.local_gravacao_id)?.nome || 'Não encontrado'}
                      </span>
                    </div>
                  </div>
                )}
                {projeto.maquiador_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Maquiador</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg">
                      <i className="ri-palette-line text-primary-teal"></i>
                      <span className="text-white">
                        {fornecedoresMock.find(f => f.id === projeto.maquiador_id)?.nome || 'Não encontrado'}
                      </span>
                    </div>
                  </div>
                )}
                {projeto.outros_profissionais && projeto.outros_profissionais.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Outros Profissionais</label>
                    <div className="space-y-2">
                      {projeto.outros_profissionais.map((profId) => {
                        const fornecedor = fornecedoresMock.find(f => f.id === profId);
                        if (!fornecedor) return null;
                        return (
                          <div key={profId} className="flex items-center gap-3 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg">
                            <i className="ri-user-star-line text-primary-teal"></i>
                            <span className="text-white text-sm">{fornecedor.nome}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {!projeto.fornecedor_audio_id && !projeto.fornecedor_video_id && !projeto.local_gravacao_id && !projeto.produtor_id && !projeto.maquiador_id && (!projeto.outros_profissionais || projeto.outros_profissionais.length === 0) && (
                  <p className="text-sm text-gray-500 italic text-center py-4">Nenhum fornecedor ou profissional associado</p>
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

        {/* Seção de Referências */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Referências</h2>
            <button
              onClick={() => {
                setSelectedFaixaForReferencia(null);
                setShowReferenciaModal(true);
              }}
              className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <i className="ri-add-line"></i>
              Adicionar Referência
            </button>
          </div>

          {referencias.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-links-line text-6xl text-gray-600 mb-4"></i>
              <p className="text-gray-400 mb-4">Nenhuma referência cadastrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {referencias.map((referencia) => (
                <div
                  key={referencia.id}
                  className="bg-dark-bg border border-dark-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-white mb-1">{referencia.titulo}</h3>
                      {referencia.descricao && (
                        <p className="text-xs text-gray-400 mb-2">{referencia.descricao}</p>
                      )}
                      {referencia.faixa_id && (
                        <span className="inline-block px-2 py-1 bg-primary-teal/20 text-primary-teal text-xs rounded mb-2">
                          {faixas.find(f => f.id === referencia.faixa_id)?.nome || 'Faixa'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteReferencia(referencia.id)}
                      className="p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-gray-400 hover:text-red-400"></i>
                    </button>
                  </div>
                  {referencia.tipo === 'youtube_url' && referencia.url && (
                    <YouTubePreview url={referencia.url} title={referencia.titulo} />
                  )}
                  {referencia.tipo === 'arquivo' && referencia.arquivo_url && (
                    <div className="mt-2">
                      <a
                        href={referencia.arquivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-dark-card border border-dark-border rounded-lg hover:bg-dark-hover transition-smooth text-sm text-white"
                      >
                        <i className="ri-file-line text-primary-teal"></i>
                        <span>{referencia.arquivo_nome || 'Ver arquivo'}</span>
                        <i className="ri-external-link-line ml-auto"></i>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seção de Anexos */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Anexos</h2>
            <button
              onClick={() => {
                setSelectedFaixaForAnexo(null);
                setShowAnexoModal(true);
              }}
              className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <i className="ri-add-line"></i>
              Adicionar Anexo
            </button>
          </div>

          {anexos.length === 0 ? (
            <div className="text-center py-12">
              <i className="ri-attachment-line text-6xl text-gray-600 mb-4"></i>
              <p className="text-gray-400 mb-4">Nenhum anexo cadastrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {anexos.map((anexo) => (
                <div
                  key={anexo.id}
                  className="bg-dark-bg border border-dark-border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary-teal/20 flex items-center justify-center">
                      <i className={`ri-${anexo.tipo === 'pre' ? 'file-music-line' : 'file-line'} text-primary-teal`}></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-white">{anexo.arquivo_nome}</h3>
                      {anexo.descricao && (
                        <p className="text-xs text-gray-400 mt-1">{anexo.descricao}</p>
                      )}
                      {anexo.faixa_id && (
                        <span className="inline-block px-2 py-0.5 bg-primary-teal/20 text-primary-teal text-xs rounded mt-1">
                          {faixas.find(f => f.id === anexo.faixa_id)?.nome || 'Faixa'}
                        </span>
                      )}
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ml-2 mt-1 ${
                        anexo.tipo === 'pre' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {anexo.tipo === 'pre' ? 'PRÉ' : 'Outro'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={anexo.arquivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer"
                    >
                      <i className="ri-external-link-line text-gray-400 hover:text-primary-teal"></i>
                    </a>
                    <button
                      onClick={() => handleDeleteAnexo(anexo.id)}
                      className="p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-gray-400 hover:text-red-400"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                      status: 'pendente' as Faixa['status'],
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
                    onChange={(e) => setFaixaFormData({ ...faixaFormData, status: e.target.value as Faixa['status'] })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="gravada">Gravada</option>
                    <option value="em_mixagem">Em Mixagem</option>
                    <option value="masterizacao">Masterização</option>
                    <option value="finalizada">Finalizada</option>
                    <option value="lancada">Lançada</option>
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
                        status: 'pendente' as Faixa['status'],
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

        {/* Modal Adicionar Referência */}
        {showReferenciaModal && id && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Adicionar Referência</h2>
                <button
                  onClick={() => {
                    setShowReferenciaModal(false);
                    setSelectedFaixaForReferencia(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Associar a uma faixa (opcional)</label>
                <select
                  value={selectedFaixaForReferencia || ''}
                  onChange={(e) => setSelectedFaixaForReferencia(e.target.value || null)}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                >
                  <option value="">Referência do projeto inteiro</option>
                  {faixas.map((faixa) => (
                    <option key={faixa.id} value={faixa.id}>{faixa.nome}</option>
                  ))}
                </select>
              </div>

              <ReferenciaForm
                projetoId={id}
                faixaId={selectedFaixaForReferencia || undefined}
                onSave={handleSaveReferencia}
                onCancel={() => {
                  setShowReferenciaModal(false);
                  setSelectedFaixaForReferencia(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Modal Adicionar Anexo */}
        {showAnexoModal && id && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Adicionar Anexo</h2>
                <button
                  onClick={() => {
                    setShowAnexoModal(false);
                    setSelectedFaixaForAnexo(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Associar a uma faixa (opcional)</label>
                  <select
                    value={selectedFaixaForAnexo || ''}
                    onChange={(e) => setSelectedFaixaForAnexo(e.target.value || null)}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="">Anexo do projeto inteiro</option>
                    {faixas.map((faixa) => (
                      <option key={faixa.id} value={faixa.id}>{faixa.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tipo de Anexo</label>
                  <select
                    id="tipo-anexo"
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="pre">PRÉ</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo</label>
                  <FileUpload
                    bucket="projetos-anexos"
                    folder={`projeto-${id}${selectedFaixaForAnexo ? `/faixa-${selectedFaixaForAnexo}` : ''}`}
                    onUploadComplete={(url, fileName) => {
                      const tipoSelect = document.getElementById('tipo-anexo') as HTMLSelectElement;
                      const descricaoInput = document.getElementById('descricao-anexo') as HTMLTextAreaElement;
                      handleSaveAnexo(
                        url,
                        fileName,
                        (tipoSelect?.value as 'pre' | 'outro') || 'outro',
                        descricaoInput?.value || undefined
                      );
                    }}
                    onError={(error) => alert(`Erro: ${error}`)}
                    accept="*/*"
                    maxSizeMB={100}
                    label="Selecionar arquivo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Descrição (opcional)</label>
                  <textarea
                    id="descricao-anexo"
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Descrição do anexo..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Lançamento */}
        {showLancamentoModal && selectedFaixaForModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Informações de Lançamento - {selectedFaixaForModal.nome}</h2>
                <button
                  onClick={() => {
                    setShowLancamentoModal(false);
                    setSelectedFaixaForModal(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSaveLancamento(selectedFaixaForModal.id, {
                    data_lancamento: formData.get('data_lancamento')?.toString() || null,
                    link_spotify: formData.get('link_spotify')?.toString() || null,
                    link_youtube: formData.get('link_youtube')?.toString() || null,
                    link_apple_music: formData.get('link_apple_music')?.toString() || null,
                    link_deezer: formData.get('link_deezer')?.toString() || null,
                    updated_at: new Date().toISOString()
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Data de Lançamento</label>
                  <input
                    type="date"
                    name="data_lancamento"
                    defaultValue={selectedFaixaForModal.data_lancamento || ''}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Link Spotify</label>
                  <input
                    type="url"
                    name="link_spotify"
                    defaultValue={selectedFaixaForModal.link_spotify || ''}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="https://open.spotify.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Link YouTube</label>
                  <input
                    type="url"
                    name="link_youtube"
                    defaultValue={selectedFaixaForModal.link_youtube || ''}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Link Apple Music</label>
                  <input
                    type="url"
                    name="link_apple_music"
                    defaultValue={selectedFaixaForModal.link_apple_music || ''}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="https://music.apple.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Link Deezer</label>
                  <input
                    type="url"
                    name="link_deezer"
                    defaultValue={selectedFaixaForModal.link_deezer || ''}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="https://deezer.com/..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLancamentoModal(false);
                      setSelectedFaixaForModal(null);
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Editar Ficha Técnica */}
        {showFichaTecnicaModal && selectedFaixaForModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Ficha Técnica - {selectedFaixaForModal.nome}</h2>
                <button
                  onClick={() => {
                    setShowFichaTecnicaModal(false);
                    setSelectedFaixaForModal(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const compositores = formData.get('compositores')?.toString().split(',').map(s => s.trim()).filter(s => s) || [];
                  const letristas = formData.get('letristas')?.toString().split(',').map(s => s.trim()).filter(s => s) || [];
                  const produtores = formData.get('produtores_musicais')?.toString().split(',').map(s => s.trim()).filter(s => s) || [];
                  
                  handleSaveFichaTecnica(selectedFaixaForModal.id, {
                    compositores: compositores.length > 0 ? compositores : null,
                    letristas: letristas.length > 0 ? letristas : null,
                    produtores_musicais: produtores.length > 0 ? produtores : null,
                    mixagem: formData.get('mixagem')?.toString() || null,
                    masterizacao: formData.get('masterizacao')?.toString() || null,
                    genero: formData.get('genero')?.toString() || null,
                    bpm: formData.get('bpm') ? parseInt(formData.get('bpm')!.toString()) : null,
                    tonalidade: formData.get('tonalidade')?.toString() || null,
                    observacoes_ficha_tecnica: formData.get('observacoes_ficha_tecnica')?.toString() || null,
                    updated_at: new Date().toISOString()
                  });
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Compositores (separados por vírgula)</label>
                    <input
                      type="text"
                      name="compositores"
                      defaultValue={selectedFaixaForModal.compositores?.join(', ') || ''}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Nome 1, Nome 2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Letristas (separados por vírgula)</label>
                    <input
                      type="text"
                      name="letristas"
                      defaultValue={selectedFaixaForModal.letristas?.join(', ') || ''}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Nome 1, Nome 2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Produtores Musicais (separados por vírgula)</label>
                    <input
                      type="text"
                      name="produtores_musicais"
                      defaultValue={selectedFaixaForModal.produtores_musicais?.join(', ') || ''}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Nome 1, Nome 2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Mixagem</label>
                    <input
                      type="text"
                      name="mixagem"
                      defaultValue={selectedFaixaForModal.mixagem || ''}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Masterização</label>
                    <input
                      type="text"
                      name="masterizacao"
                      defaultValue={selectedFaixaForModal.masterizacao || ''}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Gênero</label>
                    <input
                      type="text"
                      name="genero"
                      defaultValue={selectedFaixaForModal.genero || ''}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">BPM</label>
                    <input
                      type="number"
                      name="bpm"
                      defaultValue={selectedFaixaForModal.bpm || ''}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Tonalidade</label>
                    <input
                      type="text"
                      name="tonalidade"
                      defaultValue={selectedFaixaForModal.tonalidade || ''}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: C maior, A menor"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Observações</label>
                  <textarea
                    name="observacoes_ficha_tecnica"
                    defaultValue={selectedFaixaForModal.observacoes_ficha_tecnica || ''}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFichaTecnicaModal(false);
                      setSelectedFaixaForModal(null);
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Adicionar Áudio/Vídeo */}
        {showAudioVideoModal && selectedFaixaForModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Adicionar Áudio/Vídeo - {selectedFaixaForModal.nome}</h2>
                <button
                  onClick={() => {
                    setShowAudioVideoModal(false);
                    setSelectedFaixaForModal(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (audioVideoFormato === 'link') {
                    const formData = new FormData(e.currentTarget);
                    const tipo = formData.get('tipo') as 'audio' | 'video';
                    handleSaveAudioVideo(selectedFaixaForModal.id, {
                      tipo,
                      formato: 'link',
                      link_url: formData.get('link_url')?.toString() || undefined,
                      descricao: formData.get('descricao')?.toString() || undefined,
                      versao: formData.get('versao')?.toString() || undefined,
                    });
                  }
                  // Para arquivo, o upload é feito via FileUpload component
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
                  <select
                    name="tipo"
                    required
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="audio">Áudio</option>
                    <option value="video">Vídeo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Formato</label>
                  <select
                    name="formato"
                    required
                    value={audioVideoFormato}
                    onChange={(e) => setAudioVideoFormato(e.target.value as 'link' | 'arquivo')}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="link">Link</option>
                    <option value="arquivo">Arquivo</option>
                  </select>
                </div>

                {audioVideoFormato === 'link' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">URL do Link</label>
                    <input
                      type="url"
                      name="link_url"
                      required
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="https://..."
                    />
                  </div>
                ) : (
                  <div>
                    <FileUpload
                      bucket="faixas-audio-video"
                      folder={`faixa-${selectedFaixaForModal.id}`}
                      onUploadComplete={(url, fileName) => {
                        const tipoSelect = document.querySelector('[name="tipo"]') as HTMLSelectElement;
                        const descricaoInput = document.querySelector('[name="descricao"]') as HTMLTextAreaElement;
                        const versaoInput = document.querySelector('[name="versao"]') as HTMLInputElement;
                        
                        handleSaveAudioVideo(selectedFaixaForModal.id, {
                          tipo: (tipoSelect?.value as 'audio' | 'video') || 'audio',
                          formato: 'arquivo',
                          arquivo_url: url,
                          arquivo_nome: fileName,
                          descricao: descricaoInput?.value || undefined,
                          versao: versaoInput?.value || undefined,
                        });
                      }}
                      onError={(error) => alert(`Erro: ${error}`)}
                      accept="audio/*,video/*"
                      maxSizeMB={200}
                      label="Selecionar arquivo"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Versão (opcional)</label>
                  <input
                    type="text"
                    name="versao"
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Master, Demo, Versão Final"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Descrição (opcional)</label>
                  <textarea
                    name="descricao"
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAudioVideoModal(false);
                      setSelectedFaixaForModal(null);
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  {audioVideoFormato === 'link' && (
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                    >
                      Salvar
                    </button>
                  )}
                </div>
              </form>

            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

