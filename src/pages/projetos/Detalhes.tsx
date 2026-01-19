import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';
import YouTubePreview from '../../components/projetos/YouTubePreview';
import ReferenciaForm from '../../components/projetos/ReferenciaForm';
import FileUpload from '../../components/projetos/FileUpload';
import YouTubeUpload from '../../components/projetos/YouTubeUpload';
import { fornecedoresMock } from '../../data/fornecedores-mock';
import { produtoresMock } from '../../data/produtores-mock';

// Função helper para detectar URLs do YouTube
function isYouTubeUrl(url: string | undefined): boolean {
  if (!url) return false;
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];
  return youtubePatterns.some(pattern => pattern.test(url));
}

interface Projeto {
  id: string;
  nome: string;
  tipo: string;
  fase: string;
  progresso: number;
  data_inicio?: string;
  previsao_lancamento?: string;
  data_lancamento?: string;
  tipo_data_lancamento?: 'real' | 'prevista';
  tem_pre_producao?: boolean;
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
  nome_anexador?: string;
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
  const [tipoDataLancamento, setTipoDataLancamento] = useState<'real' | 'prevista'>('prevista');
  const [dataLancamentoTemp, setDataLancamentoTemp] = useState('');
  const [temPreProducao, setTemPreProducao] = useState<boolean | null>(null);
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
  const [audioVideoFormato, setAudioVideoFormato] = useState<'link' | 'arquivo' | 'youtube' | 'compartilhavel'>('link');
  const [audioVideoTipo, setAudioVideoTipo] = useState<'audio' | 'video' | ''>('');
  const [sharedLink, setSharedLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [playingAudioVideo, setPlayingAudioVideo] = useState<FaixaAudioVideo | null>(null);
  const [uploadedFileData, setUploadedFileData] = useState<{ url: string; fileName: string } | null>(null);

  useEffect(() => {
    if (id) {
      loadProjetoData();
    }
  }, [id]);

  // Carregar link compartilhável quando o formato for selecionado
  useEffect(() => {
    if (
      showAudioVideoModal &&
      audioVideoFormato === 'compartilhavel' && 
      selectedFaixaForModal && 
      !sharedLink && 
      !generatingLink
    ) {
      // Gerar link mesmo sem tipo selecionado (tipo será escolhido no formulário público)
      handleGenerateSharedLink(selectedFaixaForModal.id, audioVideoTipo || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioVideoFormato, selectedFaixaForModal?.id, showAudioVideoModal]);

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
        setTipoDataLancamento(projetoData.tipo_data_lancamento || 'prevista');
        setDataLancamentoTemp(projetoData.data_lancamento || projetoData.previsao_lancamento || '');
        setTemPreProducao(projetoData.tem_pre_producao ?? null);
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

  const handleUpdateDataLancamento = async () => {
    if (!id) return;

    try {
      const updateData: any = {
        tipo_data_lancamento: tipoDataLancamento,
        updated_at: new Date().toISOString()
      };

      if (tipoDataLancamento === 'real') {
        updateData.data_lancamento = dataLancamentoTemp || null;
        updateData.previsao_lancamento = null;
      } else {
        updateData.previsao_lancamento = dataLancamentoTemp || null;
        updateData.data_lancamento = null;
      }

      const { error } = await supabase
        .from('projetos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      loadProjetoData();
    } catch (error) {
      console.error('Erro ao atualizar data de lançamento:', error);
      alert('Erro ao atualizar data de lançamento. Tente novamente.');
    }
  };

  const handleUpdatePreProducao = async (temPreProducao: boolean) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('projetos')
        .update({
          tem_pre_producao: temPreProducao,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setTemPreProducao(temPreProducao);
      loadProjetoData();
    } catch (error) {
      console.error('Erro ao atualizar pré-produção:', error);
      alert('Erro ao atualizar pré-produção. Tente novamente.');
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

  // Definir fases antes de usar na função
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

  const handleUpdateFase = async (novaFase: string) => {
    if (!id || !projeto) {
      console.error('handleUpdateFase: id ou projeto não definido', { id, projeto });
      return;
    }

    // Validar se a fase é válida
    const fasesValidas = fases.map(f => f.value);
    if (!fasesValidas.includes(novaFase)) {
      console.error('Fase inválida:', novaFase, 'Fases válidas:', fasesValidas);
      alert(`A fase "${novaFase}" não é válida.`);
      return;
    }

    // Não atualizar se já estiver na mesma fase
    if (projeto.fase === novaFase) {
      setShowFaseDropdown(false);
      return;
    }

    try {
      console.log('Atualizando fase:', { projetoId: id, faseAtual: projeto.fase, novaFase });
      
      const { data, error } = await supabase
        .from('projetos')
        .update({
          fase: novaFase,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Erro do Supabase ao atualizar fase:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          novaFase,
          projetoId: id,
          faseAtual: projeto.fase
        });
        
        // Mensagem de erro mais específica
        let errorMessage = 'Erro ao atualizar fase.';
        if (error.code === '23514') {
          errorMessage = `A fase "${novaFase}" não é um valor válido no banco de dados. Execute o script SQL para atualizar a constraint.`;
        } else if (error.code === '42501') {
          errorMessage = 'Você não tem permissão para atualizar este projeto. Verifique as políticas RLS.';
        } else if (error.code === 'PGRST116') {
          errorMessage = 'Nenhum registro encontrado para atualizar.';
        } else if (error.message) {
          errorMessage = `Erro: ${error.message}`;
          if (error.hint) {
            errorMessage += `\nDica: ${error.hint}`;
          }
        }
        
        alert(errorMessage);
        return;
      }

      if (data && data.length > 0) {
        console.log('Fase atualizada com sucesso:', data[0]);
        setProjeto({ ...projeto, fase: novaFase });
        setShowFaseDropdown(false);
        // Recarregar dados do projeto para garantir sincronização
        loadProjetoData();
      } else {
        console.warn('Nenhum registro retornado após atualização');
        throw new Error('Nenhum registro foi atualizado');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar fase (catch):', {
        error,
        message: error?.message,
        stack: error?.stack,
        novaFase,
        projetoId: id,
        faseAtual: projeto.fase
      });
      alert(error?.message || 'Erro ao atualizar fase. Tente novamente.');
    }
  };

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
      'pendente': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
      'gravada': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      'em_mixagem': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      'masterizacao': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      'finalizada': 'bg-green-500/15 text-green-400 border-green-500/30',
      'lancada': 'bg-primary-teal/15 text-primary-teal border-primary-teal/30',
    };
    return colors[status] || 'bg-gray-500/15 text-gray-400 border-gray-500/30';
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
    nome_anexador?: string;
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
      setAudioVideoTipo('');
      setAudioVideoFormato('link');
      setUploadedFileData(null);
      loadProjetoData();
    } catch (error) {
      console.error('Erro ao salvar áudio/vídeo:', error);
      alert('Erro ao salvar áudio/vídeo. Tente novamente.');
    }
  };

  const handleGenerateSharedLink = async (faixaId: string, tipo?: 'audio' | 'video') => {
    if (!id || !selectedFaixaForModal) return;

    setGeneratingLink(true);
    try {
      // Se o tipo não foi fornecido, buscar qualquer link válido para esta faixa
      const now = new Date().toISOString();
      let query = supabase
        .from('shared_audio_video_links')
        .select('token, usado, expira_em, tipo')
        .eq('faixa_id', faixaId)
        .eq('usado', false)
        .or(`expira_em.is.null,expira_em.gt.${now}`)
        .order('created_at', { ascending: false })
        .limit(1);

      // Se o tipo foi fornecido, filtrar por tipo também
      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      const { data: existingLink, error: searchError } = await query.maybeSingle();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      let token: string;

      if (existingLink && !existingLink.usado) {
        // Usar link existente
        token = existingLink.token;
      } else {
        // Gerar novo token único
        token = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
        
        // Criar link compartilhável (expira em 30 dias)
        // Se o tipo não foi fornecido, não definir tipo no banco (será escolhido no formulário)
        const expiraEm = new Date();
        expiraEm.setDate(expiraEm.getDate() + 30);

        // Obter o usuário atual autenticado
        const { data: { user } } = await supabase.auth.getUser();

        const linkData: any = {
          token,
          faixa_id: faixaId,
          projeto_id: id,
          expira_em: expiraEm.toISOString(),
        };

        // Só adicionar tipo se foi fornecido
        if (tipo) {
          linkData.tipo = tipo;
        }

        // Adicionar created_by se o usuário estiver autenticado
        if (user?.id) {
          linkData.created_by = user.id;
        }

        const { error: insertError } = await supabase
          .from('shared_audio_video_links')
          .insert([linkData]);

        if (insertError) throw insertError;
      }

      // Gerar URL completa
      const baseUrl = window.location.origin;
      const sharedUrl = `${baseUrl}/shared/audio-video/${token}`;
      setSharedLink(sharedUrl);

    } catch (error: any) {
      console.error('Erro ao gerar link compartilhável:', error);
      alert(`Erro ao gerar link: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setGeneratingLink(false);
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

        {/* Lista de Faixas */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
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
                                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-smooth cursor-pointer ${getStatusColor(faixa.status)}`}
                                      style={{
                                        backgroundColor: 'rgba(17, 24, 39, 0.95)'
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <option value="pendente" className="bg-dark-bg text-yellow-400">Pendente</option>
                                      <option value="gravada" className="bg-dark-bg text-blue-400">Gravada</option>
                                      <option value="em_mixagem" className="bg-dark-bg text-purple-400">Em Mixagem</option>
                                      <option value="masterizacao" className="bg-dark-bg text-orange-400">Masterização</option>
                                      <option value="finalizada" className="bg-dark-bg text-green-400">Finalizada</option>
                                      <option value="lancada" className="bg-dark-bg text-primary-teal">Lançada</option>
                                    </select>
                                  </div>
                                  {faixa.status === 'pendente' && faixa.o_que_falta_gravar && (
                                    <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">
                                      <i className="ri-alert-line mr-1"></i>
                                      {faixa.o_que_falta_gravar}
                                    </span>
                                  )}
                                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFaixaForModal(faixa);
                      setAudioVideoFormato('arquivo');
                      setShowAudioVideoModal(true);
                    }}
                    className="px-3 py-1 bg-primary-teal/20 text-primary-teal text-xs font-medium rounded hover:bg-primary-teal/30 transition-smooth cursor-pointer flex items-center gap-1.5"
                    title="Anexar áudio ou vídeo"
                  >
                    <i className="ri-attachment-line"></i>
                    Anexar Áudio/Vídeo
                  </button>
                                  {faixa.audio_video && faixa.audio_video.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {faixa.audio_video.slice(0, 3).map((av, idx) => (
                                        <span 
                                          key={av.id || idx}
                                          className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded flex items-center gap-1"
                                        >
                                          <i className={`ri-${av.tipo === 'audio' ? 'music-2-line' : 'video-line'}`}></i>
                                          {av.versao === 'pre-producao' ? 'Pré-Prod' :
                                           av.versao === 'pos-producao' ? 'Pós-Prod' :
                                           av.versao === 'pos-gravacao' ? 'Pós-Grav' :
                                           av.versao === 'mixagem' ? 'Mixagem' :
                                           av.versao === 'masterizado' ? 'Master' :
                                           av.tipo === 'audio' ? 'Áudio' : 'Vídeo'}
                                        </span>
                                      ))}
                                      {faixa.audio_video.length > 3 && (
                                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                                          +{faixa.audio_video.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedFaixaForModal(faixa);
                                  setAudioVideoFormato('arquivo');
                                  setShowAudioVideoModal(true);
                                }}
                                className="p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer"
                                title="Anexar áudio ou vídeo"
                              >
                                <i className="ri-attachment-line text-gray-400 hover:text-primary-teal"></i>
                              </button>
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
                          <div className="border-t border-dark-border p-5 space-y-5 bg-dark-card/50">
                            {/* Seção Lançamento */}
                            <div className="bg-dark-card border border-dark-border rounded-lg p-5">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-base font-semibold text-white flex items-center gap-2">
                                  <i className="ri-calendar-event-line text-primary-teal text-lg"></i>
                                  Informações de Lançamento
                                </h4>
                                <button
                                  onClick={() => {
                                    setSelectedFaixaForModal(faixa);
                                    setShowLancamentoModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-primary-teal/20 text-primary-teal text-xs font-medium rounded-lg hover:bg-primary-teal/30 transition-smooth cursor-pointer flex items-center gap-1.5"
                                >
                                  <i className="ri-edit-line"></i>
                                  Editar
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-400 mb-1">Data de Lançamento</span>
                                  <span className="text-sm text-white font-medium">
                                    {faixa.data_lancamento ? new Date(faixa.data_lancamento).toLocaleDateString('pt-BR') : 'Não informado'}
                                  </span>
                                </div>
                                {faixa.link_spotify && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 mb-1">Spotify</span>
                                    <a href={faixa.link_spotify} target="_blank" rel="noopener noreferrer" className="text-primary-teal hover:text-primary-brown transition-smooth text-sm font-medium flex items-center gap-1.5 w-fit">
                                      <i className="ri-spotify-line text-base"></i>
                                      Abrir no Spotify
                                      <i className="ri-external-link-line text-xs"></i>
                                    </a>
                                  </div>
                                )}
                                {faixa.link_youtube && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 mb-1">YouTube</span>
                                    <a href={faixa.link_youtube} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 transition-smooth text-sm font-medium flex items-center gap-1.5 w-fit">
                                      <i className="ri-youtube-line text-base"></i>
                                      Abrir no YouTube
                                      <i className="ri-external-link-line text-xs"></i>
                                    </a>
                                  </div>
                                )}
                                {faixa.link_apple_music && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 mb-1">Apple Music</span>
                                    <a href={faixa.link_apple_music} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 transition-smooth text-sm font-medium flex items-center gap-1.5 w-fit">
                                      <i className="ri-apple-line text-base"></i>
                                      Abrir no Apple Music
                                      <i className="ri-external-link-line text-xs"></i>
                                    </a>
                                  </div>
                                )}
                                {faixa.link_deezer && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 mb-1">Deezer</span>
                                    <a href={faixa.link_deezer} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-smooth text-sm font-medium flex items-center gap-1.5 w-fit">
                                      <i className="ri-music-line text-base"></i>
                                      Abrir no Deezer
                                      <i className="ri-external-link-line text-xs"></i>
                                    </a>
                                  </div>
                                )}
                                {!faixa.data_lancamento && !faixa.link_spotify && !faixa.link_youtube && !faixa.link_apple_music && !faixa.link_deezer && (
                                  <div className="col-span-2">
                                    <p className="text-xs text-gray-500 italic text-center py-2">Nenhuma informação de lançamento cadastrada</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Seção Ficha Técnica */}
                            <div className="bg-dark-card border border-dark-border rounded-lg p-5">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-base font-semibold text-white flex items-center gap-2">
                                  <i className="ri-file-text-line text-primary-teal text-lg"></i>
                                  Ficha Técnica
                                </h4>
                                <button
                                  onClick={() => {
                                    setSelectedFaixaForModal(faixa);
                                    setShowFichaTecnicaModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-primary-teal/20 text-primary-teal text-xs font-medium rounded-lg hover:bg-primary-teal/30 transition-smooth cursor-pointer flex items-center gap-1.5"
                                >
                                  <i className="ri-edit-line"></i>
                                  Editar
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {faixa.compositores && faixa.compositores.length > 0 && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 mb-1">Compositores</span>
                                    <span className="text-sm text-white">{faixa.compositores.join(', ')}</span>
                                  </div>
                                )}
                                {faixa.letristas && faixa.letristas.length > 0 && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 mb-1">Letristas</span>
                                    <span className="text-sm text-white">{faixa.letristas.join(', ')}</span>
                                  </div>
                                )}
                                {faixa.produtores_musicais && faixa.produtores_musicais.length > 0 && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 mb-1">Produtores Musicais</span>
                                    <span className="text-sm text-white">{faixa.produtores_musicais.join(', ')}</span>
                                  </div>
                                )}
                                {faixa.mixagem && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 mb-1">Mixagem</span>
                                    <span className="text-sm text-white">{faixa.mixagem}</span>
                                  </div>
                                )}
                                {faixa.masterizacao && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 mb-1">Masterização</span>
                                    <span className="text-sm text-white">{faixa.masterizacao}</span>
                                  </div>
                                )}
                                {faixa.genero && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 mb-1">Gênero</span>
                                    <span className="text-sm text-white">{faixa.genero}</span>
                                  </div>
                                )}
                                {faixa.bpm && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 mb-1">BPM</span>
                                    <span className="text-sm text-white">{faixa.bpm}</span>
                                  </div>
                                )}
                                {faixa.tonalidade && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 mb-1">Tonalidade</span>
                                    <span className="text-sm text-white">{faixa.tonalidade}</span>
                                  </div>
                                )}
                                {!faixa.compositores?.length && !faixa.letristas?.length && !faixa.produtores_musicais?.length && !faixa.mixagem && !faixa.masterizacao && !faixa.genero && !faixa.bpm && !faixa.tonalidade && (
                                  <div className="col-span-2">
                                    <p className="text-xs text-gray-500 italic text-center py-2">Nenhuma informação da ficha técnica cadastrada</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Seção Áudio e Vídeo */}
                            <div className="bg-dark-card border border-dark-border rounded-lg p-5">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-base font-semibold text-white flex items-center gap-2">
                                  <i className="ri-music-2-line text-primary-teal text-lg"></i>
                                  Áudio e Vídeo
                                </h4>
                                <button
                                  onClick={() => {
                                    setSelectedFaixaForModal(faixa);
                                    setShowAudioVideoModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-primary-teal/20 text-primary-teal text-xs font-medium rounded-lg hover:bg-primary-teal/30 transition-smooth cursor-pointer flex items-center gap-1.5"
                                >
                                  <i className="ri-add-line"></i>
                                  Adicionar
                                </button>
                              </div>
                              {(() => {
                                // Buscar último áudio e último vídeo
                                const ultimoAudio = faixa.audio_video?.filter(av => av.tipo === 'audio').sort((a, b) => 
                                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                )[0];
                                
                                const ultimoVideo = faixa.audio_video?.filter(av => av.tipo === 'video').sort((a, b) => 
                                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                )[0];

                                // Verificar se há áudio masterizado
                                const audioMasterizado = faixa.audio_video?.find(av => 
                                  av.tipo === 'audio' && 
                                  (av.versao === 'masterizado' ||
                                   av.versao?.toLowerCase().includes('master') || 
                                   av.versao?.toLowerCase().includes('masterizado') ||
                                   av.descricao?.toLowerCase().includes('master') ||
                                   av.descricao?.toLowerCase().includes('masterizado') ||
                                   (faixa.status === 'masterizacao' || faixa.status === 'finalizada' || faixa.status === 'lancada'))
                                );

                                // Verificar se há vídeo masterizado (classificação "masterizado" ou "mixagem")
                                // Considera apenas vídeos do tipo "arquivo", não links externos
                                const videoMasterizado = faixa.audio_video?.find(av => 
                                  av.tipo === 'video' && 
                                  av.formato === 'arquivo' &&
                                  (av.versao === 'masterizado' || 
                                   av.versao === 'mixagem' ||
                                   av.versao?.toLowerCase().includes('master') || 
                                   av.versao?.toLowerCase().includes('masterizado') ||
                                   av.descricao?.toLowerCase().includes('master') ||
                                   av.descricao?.toLowerCase().includes('masterizado') ||
                                   (faixa.status === 'masterizacao' || faixa.status === 'finalizada' || faixa.status === 'lancada'))
                                );

                                // Verificar se há vídeos do tipo arquivo (para saber se precisa verificar masterizado)
                                const temVideoArquivo = faixa.audio_video?.some(av => av.tipo === 'video' && av.formato === 'arquivo');
                                
                                // Verificar se há áudio
                                const temAudio = faixa.audio_video?.some(av => av.tipo === 'audio');

                                if (faixa.audio_video && faixa.audio_video.length > 0) {
                                  return (
                                    <div className="space-y-2.5">
                                      {/* Informação do último áudio */}
                                      {ultimoAudio && (
                                        <div className="p-3 bg-primary-teal/10 border border-primary-teal/30 rounded-lg">
                                          <p className="text-xs text-gray-400 mb-1">Último Áudio:</p>
                                          <p className="text-sm text-white font-medium">
                                            {ultimoAudio.versao === 'pre-producao' ? 'Pré-Produção' :
                                             ultimoAudio.versao === 'pos-gravacao' ? 'Pós-Gravação' :
                                             ultimoAudio.versao === 'masterizado' ? 'Masterizado' :
                                             ultimoAudio.versao || 'Áudio'}
                                            {ultimoAudio.arquivo_nome && ` - ${ultimoAudio.arquivo_nome}`}
                                            {ultimoAudio.formato === 'link' && ultimoAudio.link_url && ' (Link)'}
                                          </p>
                                        </div>
                                      )}
                                      
                                      {/* Informação do último vídeo */}
                                      {ultimoVideo && (
                                        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                          <p className="text-xs text-gray-400 mb-1">Último Vídeo:</p>
                                          <p className="text-sm text-white font-medium">
                                            {ultimoVideo.versao === 'pre-producao' ? 'Pré-Produção' :
                                             ultimoVideo.versao === 'pos-producao' ? 'Pós-Produção' :
                                             ultimoVideo.versao === 'mixagem' ? 'Mixagem' :
                                             ultimoVideo.versao === 'masterizado' ? 'Masterizado' :
                                             ultimoVideo.versao || 'Vídeo'}
                                            {ultimoVideo.arquivo_nome && ` - ${ultimoVideo.arquivo_nome}`}
                                            {ultimoVideo.formato === 'link' && ultimoVideo.link_url && ' (Link)'}
                                          </p>
                                        </div>
                                      )}

                                      {!audioMasterizado && (
                                        <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                          <p className="text-sm text-orange-400 flex items-center gap-2">
                                            <i className="ri-alert-line"></i>
                                            Sem áudio masterizado
                                          </p>
                                        </div>
                                      )}
                                      {temVideoArquivo && !videoMasterizado && (
                                        <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                          <p className="text-sm text-orange-400 flex items-center gap-2">
                                            <i className="ri-alert-line"></i>
                                            Sem vídeo masterizado
                                          </p>
                                        </div>
                                      )}
                                      {faixa.audio_video.map((av) => (
                                        <div key={av.id} className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded-lg hover:border-primary-teal/50 transition-smooth">
                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                              av.tipo === 'audio' ? 'bg-primary-teal/20' : 'bg-purple-500/20'
                                            }`}>
                                              <i className={`ri-${av.tipo === 'audio' ? 'music-2-line' : 'video-line'} ${
                                                av.tipo === 'audio' ? 'text-primary-teal' : 'text-purple-400'
                                              } text-lg`}></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm text-white font-medium">
                                                  {av.versao === 'pre-producao' ? 'Pré-Produção' :
                                                   av.versao === 'pos-producao' ? 'Pós-Produção' :
                                                   av.versao === 'pos-gravacao' ? 'Pós-Gravação' :
                                                   av.versao === 'mixagem' ? 'Mixagem' :
                                                   av.versao === 'masterizado' ? 'Masterizado' :
                                                   av.versao || `${av.tipo === 'audio' ? 'Áudio' : 'Vídeo'} - ${av.formato === 'arquivo' ? 'Arquivo' : 'Link'}`}
                                                </span>
                                                {av.descricao && (
                                                  <span className="text-xs text-gray-400">• {av.descricao}</span>
                                                )}
                                              </div>
                                              {av.arquivo_nome && (
                                                <p className="text-xs text-gray-500 mt-1 truncate">{av.arquivo_nome}</p>
                                              )}
                                              {av.nome_anexador && (
                                                <p className="text-xs text-primary-teal mt-1 flex items-center gap-1">
                                                  <i className="ri-user-line"></i>
                                                  Anexado por: {av.nome_anexador}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                            {/* Botão Ouvir/Assistir */}
                                            {((av.formato === 'arquivo' && av.arquivo_url) || (av.formato === 'link' && av.link_url)) && (
                                              <button
                                                onClick={() => setPlayingAudioVideo(av)}
                                                className={`p-2 rounded-lg transition-smooth ${
                                                  av.tipo === 'audio' 
                                                    ? 'text-primary-teal hover:bg-primary-teal/20' 
                                                    : 'text-purple-400 hover:bg-purple-500/20'
                                                }`}
                                                title={av.tipo === 'audio' ? 'Ouvir áudio' : 'Assistir vídeo'}
                                              >
                                                <i className={`ri-${av.tipo === 'audio' ? 'play-circle' : 'play-circle'}-line text-base`}></i>
                                              </button>
                                            )}
                                            {av.formato === 'link' && av.link_url && (
                                              <a 
                                                href={av.link_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="p-2 text-primary-teal hover:bg-primary-teal/20 rounded-lg transition-smooth"
                                                title="Abrir link"
                                              >
                                                <i className="ri-external-link-line text-base"></i>
                                              </a>
                                            )}
                                            {av.formato === 'arquivo' && av.arquivo_url && (
                                              <a 
                                                href={av.arquivo_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="p-2 text-primary-teal hover:bg-primary-teal/20 rounded-lg transition-smooth"
                                                title="Baixar arquivo"
                                                download
                                              >
                                                <i className="ri-download-line text-base"></i>
                                              </a>
                                            )}
                                            <button
                                              onClick={() => handleDeleteAudioVideo(av.id)}
                                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-smooth"
                                              title="Excluir"
                                            >
                                              <i className="ri-delete-bin-line text-base"></i>
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                } else {
                                  // Quando não há anexos, mostrar o que falta
                                  const faltaAudio = !temAudio;
                                  const faltaVideo = !faixa.audio_video?.some(av => av.tipo === 'video');
                                  
                                  return (
                                    <div className="text-center py-8 space-y-2">
                                      <p className="text-xs text-gray-500 italic mb-3">Nenhum áudio ou vídeo cadastrado</p>
                                      <div className="space-y-2">
                                        {faltaAudio && (
                                          <p className="text-sm text-orange-400 flex items-center justify-center gap-2">
                                            <i className="ri-alert-line"></i>
                                            Falta áudio
                                          </p>
                                        )}
                                        {faltaVideo && (
                                          <p className="text-sm text-orange-400 flex items-center justify-center gap-2">
                                            <i className="ri-alert-line"></i>
                                            Falta vídeo
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
        </div>

        {/* Informações de Gravação */}
        <div className="space-y-6 mb-6">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Informações de Gravação</h2>
              <div className="space-y-5">
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

                {/* Data de Lançamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Data de Lançamento</label>
                  <div className="space-y-3">
                    <select
                      value={tipoDataLancamento}
                      onChange={(e) => {
                        setTipoDataLancamento(e.target.value as 'real' | 'prevista');
                      }}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                    >
                      <option value="prevista">Data Prevista de Lançamento</option>
                      <option value="real">Data de Lançamento</option>
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dataLancamentoTemp}
                        onChange={(e) => setDataLancamentoTemp(e.target.value)}
                        className="flex-1 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      />
                      <button
                        onClick={handleUpdateDataLancamento}
                        className="px-4 py-3 bg-primary-teal text-white text-sm rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
                      >
                        Salvar
                      </button>
                    </div>
                    {(projeto.data_lancamento || projeto.previsao_lancamento) && (
                      <div className="px-4 py-2 bg-dark-bg border border-dark-border rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <i className="ri-calendar-line text-primary-teal"></i>
                          <span className="text-gray-400">
                            {projeto.tipo_data_lancamento === 'real' ? 'Data de Lançamento:' : 'Data Prevista:'}
                          </span>
                          <span className="text-white">
                            {new Date(projeto.data_lancamento || projeto.previsao_lancamento || '').toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pré-produção */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Pré-produção</label>
                  <select
                    value={temPreProducao === null ? '' : temPreProducao ? 'sim' : 'nao'}
                    onChange={(e) => {
                      if (e.target.value === 'sim') {
                        handleUpdatePreProducao(true);
                      } else if (e.target.value === 'nao') {
                        handleUpdatePreProducao(false);
                      }
                    }}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="">Selecione uma opção</option>
                    <option value="sim">Com pré-produção</option>
                    <option value="nao">Sem pré-produção</option>
                  </select>
                  {temPreProducao !== null && (
                    <div className="mt-2 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <i className={`ri-${temPreProducao ? 'check' : 'close'}-line ${temPreProducao ? 'text-green-400' : 'text-red-400'}`}></i>
                        <span className="text-white">
                          {temPreProducao ? 'Com pré-produção' : 'Sem pré-produção'}
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
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
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

        {/* Seção de Referências */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Referências do Projeto</h2>
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
            <h2 className="text-xl font-semibold text-white">Anexos do Projeto</h2>
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

        {/* Modal Player de Áudio/Vídeo */}
        {playingAudioVideo && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {playingAudioVideo.tipo === 'audio' ? 'Ouvir Áudio' : 'Assistir Vídeo'}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {faixas.find(f => f.id === playingAudioVideo.faixa_id)?.nome || 'Faixa'}
                    {playingAudioVideo.versao && ` - ${playingAudioVideo.versao === 'pre-producao' ? 'Pré-Produção' :
                      playingAudioVideo.versao === 'pos-producao' ? 'Pós-Produção' :
                      playingAudioVideo.versao === 'pos-gravacao' ? 'Pós-Gravação' :
                      playingAudioVideo.versao === 'mixagem' ? 'Mixagem' :
                      playingAudioVideo.versao === 'masterizado' ? 'Masterizado' :
                      playingAudioVideo.versao}`}
                  </p>
                </div>
                <button
                  onClick={() => setPlayingAudioVideo(null)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                {/* Detectar se é YouTube */}
                {(() => {
                  const url = playingAudioVideo.formato === 'link' ? playingAudioVideo.link_url : playingAudioVideo.arquivo_url;
                  if (!url) return null;

                  // Verificar se é URL do YouTube
                  if (isYouTubeUrl(url) && playingAudioVideo.formato === 'link') {
                    return (
                      <YouTubePreview 
                        url={url} 
                        title={playingAudioVideo.arquivo_nome || playingAudioVideo.descricao || 'Vídeo'} 
                      />
                    );
                  }

                  // Player HTML5 para áudio ou vídeo
                  if (playingAudioVideo.tipo === 'audio') {
                    return (
                      <div className="bg-dark-bg border border-dark-border rounded-lg p-6">
                        <audio 
                          controls 
                          className="w-full"
                          style={{ outline: 'none' }}
                        >
                          <source src={url || ''} type="audio/mpeg" />
                          <source src={url || ''} type="audio/wav" />
                          <source src={url || ''} type="audio/ogg" />
                          <source src={url || ''} type="audio/mp4" />
                          Seu navegador não suporta o elemento de áudio.
                        </audio>
                        {playingAudioVideo.arquivo_nome && (
                          <p className="text-sm text-gray-400 mt-4 text-center">
                            {playingAudioVideo.arquivo_nome}
                          </p>
                        )}
                        {playingAudioVideo.descricao && (
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            {playingAudioVideo.descricao}
                          </p>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-dark-bg border border-dark-border rounded-lg overflow-hidden">
                        <video 
                          controls 
                          className="w-full"
                          style={{ maxHeight: '70vh' }}
                        >
                          <source src={url || ''} type="video/mp4" />
                          <source src={url || ''} type="video/webm" />
                          <source src={url || ''} type="video/ogg" />
                          <source src={url || ''} type="video/quicktime" />
                          Seu navegador não suporta o elemento de vídeo.
                        </video>
                        {(playingAudioVideo.arquivo_nome || playingAudioVideo.descricao) && (
                          <div className="p-4 border-t border-dark-border">
                            {playingAudioVideo.arquivo_nome && (
                              <p className="text-sm text-gray-400 text-center">
                                {playingAudioVideo.arquivo_nome}
                              </p>
                            )}
                            {playingAudioVideo.descricao && (
                              <p className="text-xs text-gray-500 mt-2 text-center">
                                {playingAudioVideo.descricao}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                })()}

                {/* Informações adicionais */}
                {playingAudioVideo.nome_anexador && (
                  <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                    <p className="text-xs text-gray-400">
                      <i className="ri-user-line text-primary-teal"></i> Anexado por: <span className="text-white">{playingAudioVideo.nome_anexador}</span>
                    </p>
                  </div>
                )}
              </div>
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
                    setAudioVideoTipo('');
                    setAudioVideoFormato('link');
                    setUploadedFileData(null);
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
                    const nomeAnexador = formData.get('nome_anexador')?.toString()?.trim();
                    if (!nomeAnexador) {
                      alert('Por favor, informe seu nome');
                      return;
                    }
                    handleSaveAudioVideo(selectedFaixaForModal.id, {
                      tipo,
                      formato: 'link',
                      link_url: formData.get('link_url')?.toString() || undefined,
                      descricao: formData.get('descricao')?.toString() || undefined,
                      versao: formData.get('versao')?.toString() || undefined,
                      nome_anexador: nomeAnexador,
                    });
                  }
                  // Para arquivo, o upload é feito via FileUpload component
                }}
                className="space-y-4"
              >
                {/* Separador Visual */}
                <div className="border-t border-dark-border pt-4">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="ri-attachment-line text-primary-teal"></i>
                    Anexar Áudio/Vídeo
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Formato</label>
                  <select
                    name="formato"
                    required
                    value={audioVideoFormato}
                    onChange={(e) => {
                      const novoFormato = e.target.value as 'link' | 'arquivo' | 'youtube' | 'compartilhavel';
                      setAudioVideoFormato(novoFormato);
                      setAudioVideoTipo('');
                      setUploadedFileData(null);
                      if (novoFormato !== 'compartilhavel') {
                        setSharedLink(null);
                        setLinkCopied(false);
                      }
                    }}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="link">Link</option>
                    <option value="arquivo">Arquivo (R2)</option>
                  </select>
                </div>

                {audioVideoFormato === 'link' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
                      <select
                        name="tipo"
                        id="tipo-select"
                        required
                        onChange={(e) => {
                          const tipoSelect = e.target.value;
                          setAudioVideoTipo(tipoSelect as 'audio' | 'video' | '');
                          const versaoSelect = document.getElementById('versao-select') as HTMLSelectElement;
                          const descricaoP = document.getElementById('classificacao-descricao');
                          
                          // Limpar opções anteriores
                          if (versaoSelect) {
                            versaoSelect.innerHTML = '<option value="">Selecione a classificação</option>';
                          }
                          
                          if (tipoSelect === 'audio') {
                            // Opções para áudio
                            if (versaoSelect) {
                              versaoSelect.innerHTML += '<option value="pre-producao">Pré-Produção</option>';
                              versaoSelect.innerHTML += '<option value="pos-gravacao">Pós-Gravação</option>';
                              versaoSelect.innerHTML += '<option value="masterizado">Masterizado</option>';
                            }
                            if (descricaoP) {
                              descricaoP.textContent = 'Pré-Produção: Antes da gravação | Pós-Gravação: Depois da gravação | Masterizado: Versão final';
                            }
                          } else if (tipoSelect === 'video') {
                            // Opções para vídeo
                            if (versaoSelect) {
                              versaoSelect.innerHTML += '<option value="pre-producao">Pré-Produção</option>';
                              versaoSelect.innerHTML += '<option value="pos-producao">Pós-Produção</option>';
                              versaoSelect.innerHTML += '<option value="mixagem">Mixagem</option>';
                              versaoSelect.innerHTML += '<option value="masterizado">Masterizado</option>';
                            }
                            if (descricaoP) {
                              descricaoP.textContent = 'Pré-Produção: Antes da gravação | Pós-Produção: Depois da gravação | Mixagem/Masterizado: Depois da pós';
                            }
                          }
                        }}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="">Selecione o tipo</option>
                        <option value="audio">Áudio</option>
                        <option value="video">Vídeo</option>
                      </select>
                    </div>
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
                  </>
                ) : audioVideoFormato === 'arquivo' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Tipo *</label>
                      <select
                        name="tipo"
                        id="tipo-select"
                        required
                        value={audioVideoTipo}
                        onChange={(e) => {
                          const tipoSelect = e.target.value;
                          setAudioVideoTipo(tipoSelect as 'audio' | 'video' | '');
                          setUploadedFileData(null);
                          const versaoSelect = document.getElementById('versao-select') as HTMLSelectElement;
                          const descricaoP = document.getElementById('classificacao-descricao');
                          
                          // Limpar opções anteriores
                          if (versaoSelect) {
                            versaoSelect.innerHTML = '<option value="">Selecione a classificação</option>';
                          }
                          
                          if (tipoSelect === 'audio') {
                            // Opções para áudio
                            if (versaoSelect) {
                              versaoSelect.innerHTML += '<option value="pre-producao">Pré-Produção</option>';
                              versaoSelect.innerHTML += '<option value="pos-gravacao">Pós-Gravação</option>';
                              versaoSelect.innerHTML += '<option value="masterizado">Masterizado</option>';
                            }
                            if (descricaoP) {
                              descricaoP.textContent = 'Pré-Produção: Antes da gravação | Pós-Gravação: Depois da gravação | Masterizado: Versão final';
                            }
                          } else if (tipoSelect === 'video') {
                            // Opções para vídeo
                            if (versaoSelect) {
                              versaoSelect.innerHTML += '<option value="pre-producao">Pré-Produção</option>';
                              versaoSelect.innerHTML += '<option value="pos-producao">Pós-Produção</option>';
                              versaoSelect.innerHTML += '<option value="mixagem">Mixagem</option>';
                              versaoSelect.innerHTML += '<option value="masterizado">Masterizado</option>';
                            }
                            if (descricaoP) {
                              descricaoP.textContent = 'Pré-Produção: Antes da gravação | Pós-Produção: Depois da gravação | Mixagem/Masterizado: Depois da pós';
                            }
                          }
                        }}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      >
                        <option value="">Selecione o tipo</option>
                        <option value="audio">Áudio</option>
                        <option value="video">Vídeo</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Selecione se é um arquivo de áudio ou vídeo
                      </p>
                    </div>
                    {audioVideoTipo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo *</label>
                        <FileUpload
                          bucket="faixas-audio-video"
                          folder={`faixa-${selectedFaixaForModal.id}`}
                          onUploadComplete={(url, fileName) => {
                            // Armazenar dados do upload, mas não salvar ainda
                            setUploadedFileData({ url, fileName });
                          }}
                          onError={(error) => {
                            alert(`Erro: ${error}`);
                            setUploadedFileData(null);
                          }}
                          accept={audioVideoTipo === 'audio' ? 'audio/*' : audioVideoTipo === 'video' ? 'video/*' : 'audio/*,video/*'}
                          maxSizeMB={200}
                          label="Selecionar arquivo"
                          customFileName={audioVideoTipo === 'video' && projeto?.artista?.nome 
                            ? `video_${projeto.artista.nome.replace(/\s+/g, '_')}_ColorOK`
                            : undefined}
                        />
                        {uploadedFileData && (
                          <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <p className="text-sm text-green-400 flex items-center gap-2">
                              <i className="ri-check-line"></i>
                              Arquivo enviado: {uploadedFileData.fileName}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Clique em "Salvar" para confirmar o envio
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : null}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Classificação *</label>
                  <select
                    name="versao"
                    id="versao-select"
                    required
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="">Selecione a classificação</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1" id="classificacao-descricao">
                    Selecione o tipo primeiro
                  </p>
                </div>

                {audioVideoFormato !== 'youtube' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Nome <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="nome_anexador"
                      required
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Digite seu nome completo"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      <i className="ri-information-line"></i> Informe seu nome para identificarmos quem anexou este áudio/vídeo
                    </p>
                  </div>
                )}

                {audioVideoFormato !== 'youtube' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Descrição (opcional)</label>
                    <textarea
                      name="descricao"
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                      rows={3}
                    />
                  </div>
                )}

                {audioVideoFormato !== 'youtube' && audioVideoFormato !== 'compartilhavel' && (
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAudioVideoModal(false);
                        setSelectedFaixaForModal(null);
                        setAudioVideoTipo('');
                        setAudioVideoFormato('link');
                        setSharedLink(null);
                        setLinkCopied(false);
                        setUploadedFileData(null);
                      }}
                      className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                    >
                      Cancelar
                    </button>
                    {(audioVideoFormato === 'link' || audioVideoFormato === 'arquivo') && (
                      <button
                        type={audioVideoFormato === 'link' ? 'submit' : 'button'}
                        onClick={audioVideoFormato === 'arquivo' ? () => {
                          // Verificar se todos os campos estão preenchidos
                          const tipoSelect = document.querySelector('[name="tipo"]') as HTMLSelectElement;
                          const versaoSelect = document.querySelector('[name="versao"]') as HTMLSelectElement;
                          const nomeAnexadorInput = document.querySelector('[name="nome_anexador"]') as HTMLInputElement;
                          const descricaoInput = document.querySelector('[name="descricao"]') as HTMLTextAreaElement;
                          
                          if (!tipoSelect?.value) {
                            alert('Por favor, selecione o tipo');
                            return;
                          }
                          
                          if (!versaoSelect?.value) {
                            alert('Por favor, selecione a classificação');
                            return;
                          }
                          
                          const nomeAnexador = nomeAnexadorInput?.value?.trim();
                          if (!nomeAnexador) {
                            alert('Por favor, informe seu nome');
                            return;
                          }
                          
                          // Verificar se há arquivo enviado
                          if (!uploadedFileData) {
                            alert('Por favor, faça o upload do arquivo primeiro');
                            return;
                          }
                          
                          // Salvar os dados no sistema
                          handleSaveAudioVideo(selectedFaixaForModal.id, {
                            tipo: (tipoSelect?.value as 'audio' | 'video') || 'audio',
                            formato: 'arquivo',
                            arquivo_url: uploadedFileData.url,
                            arquivo_nome: uploadedFileData.fileName,
                            descricao: descricaoInput?.value || undefined,
                            versao: versaoSelect?.value || undefined,
                            nome_anexador: nomeAnexador,
                          });
                          
                          // Limpar dados do upload
                          setUploadedFileData(null);
                        } : undefined}
                        className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                      >
                        Salvar
                      </button>
                    )}
                  </div>
                )}

                {/* Seção Separada: Link Compartilhável */}
                <div className="border-t border-dark-border pt-6 mt-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="ri-link text-purple-400"></i>
                    Link Compartilhável
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Gere um link para compartilhar com outras pessoas, permitindo que elas preencham o formulário de áudio/vídeo.
                  </p>
                  
                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedFaixaForModal) return;
                      setAudioVideoFormato('compartilhavel');
                      if (!sharedLink && !generatingLink) {
                        await handleGenerateSharedLink(selectedFaixaForModal.id, audioVideoTipo || undefined);
                      }
                    }}
                    className="w-full px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-purple-400 text-sm font-medium transition-smooth cursor-pointer mb-4 flex items-center justify-center gap-2"
                  >
                    <i className="ri-link"></i>
                    {generatingLink ? 'Gerando Link...' : sharedLink ? 'Link Já Gerado' : 'Gerar Link Compartilhável'}
                  </button>

                  <div className="bg-dark-bg border border-purple-500/50 rounded-lg p-4 space-y-4">
                    {audioVideoFormato === 'compartilhavel' && (
                      <>
                        {generatingLink ? (
                          <div className="text-center py-4">
                            <i className="ri-loader-4-line text-2xl text-primary-teal animate-spin mb-2"></i>
                            <p className="text-gray-400">Gerando link...</p>
                          </div>
                        ) : sharedLink ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                              <i className="ri-link text-purple-400"></i> Link Compartilhável Gerado
                            </label>
                            <div className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={sharedLink}
                                readOnly
                                className="flex-1 px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-white text-sm"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-400 mb-2">O link será gerado automaticamente...</p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="border-t border-dark-border pt-4">
                      <p className="text-sm font-medium text-gray-300 mb-3">Compartilhar via:</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!sharedLink) {
                              alert('Por favor, clique em "Gerar Link Compartilhável" primeiro.');
                              return;
                            }
                            const tipoTexto = audioVideoTipo === 'audio' ? 'Áudio' : audioVideoTipo === 'video' ? 'Vídeo' : 'Áudio/Vídeo';
                            const subject = encodeURIComponent(`Formulário de ${tipoTexto} - ${selectedFaixaForModal?.nome}`);
                            const body = encodeURIComponent(`Olá,\n\nPor favor, preencha o formulário de áudio/vídeo para a faixa "${selectedFaixaForModal?.nome}" através do link abaixo:\n\n${sharedLink}\n\nObrigado!`);
                            window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                          }}
                          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-smooth ${
                            sharedLink 
                              ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 cursor-pointer' 
                              : 'bg-gray-500/10 text-gray-500 cursor-not-allowed opacity-50'
                          }`}
                          disabled={!sharedLink}
                        >
                          <i className="ri-mail-line"></i>
                          <span className="text-sm">Email</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!sharedLink) {
                              alert('Por favor, clique em "Gerar Link Compartilhável" primeiro.');
                              return;
                            }
                            const message = encodeURIComponent(`Olá! Por favor, preencha o formulário de áudio/vídeo para a faixa "${selectedFaixaForModal?.nome}" através do link:\n${sharedLink}`);
                            window.open(`https://wa.me/?text=${message}`, '_blank');
                          }}
                          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-smooth ${
                            sharedLink 
                              ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 cursor-pointer' 
                              : 'bg-gray-500/10 text-gray-500 cursor-not-allowed opacity-50'
                          }`}
                          disabled={!sharedLink}
                        >
                          <i className="ri-whatsapp-line"></i>
                          <span className="text-sm">WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!sharedLink) {
                              alert('Por favor, clique em "Gerar Link Compartilhável" primeiro.');
                              return;
                            }
                            try {
                              await navigator.clipboard.writeText(sharedLink);
                              setLinkCopied(true);
                              setTimeout(() => setLinkCopied(false), 2000);
                            } catch (err) {
                              // Fallback para navegadores antigos
                              const textArea = document.createElement('textarea');
                              textArea.value = sharedLink;
                              textArea.style.position = 'fixed';
                              textArea.style.opacity = '0';
                              document.body.appendChild(textArea);
                              textArea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textArea);
                              setLinkCopied(true);
                              setTimeout(() => setLinkCopied(false), 2000);
                            }
                          }}
                          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-smooth ${
                            linkCopied 
                              ? 'bg-green-500 text-white cursor-pointer' 
                              : sharedLink
                              ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 cursor-pointer'
                              : 'bg-gray-500/10 text-gray-500 cursor-not-allowed opacity-50'
                          }`}
                          disabled={!sharedLink}
                          title={linkCopied ? "Copiado!" : "Copiar link"}
                        >
                          {linkCopied ? (
                            <>
                              <i className="ri-check-line"></i>
                              <span className="text-sm">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <i className="ri-file-copy-line"></i>
                              <span className="text-sm">Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-dark-card/50 border border-dark-border rounded-lg p-3">
                      <p className="text-xs text-gray-400 flex items-start gap-2">
                        <i className="ri-information-line text-purple-400 mt-0.5"></i>
                        <span>
                          <strong>Instruções:</strong> Envie este link para a pessoa que precisa preencher o formulário. 
                          A pessoa poderá escolher se é áudio ou vídeo no formulário. 
                          O link expira em <strong>30 dias</strong> e só pode ser usado <strong>uma vez</strong>.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {audioVideoFormato === 'compartilhavel' && (
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAudioVideoModal(false);
                        setSelectedFaixaForModal(null);
                        setAudioVideoTipo('');
                        setAudioVideoFormato('link');
                        setSharedLink(null);
                        setLinkCopied(false);
                        setUploadedFileData(null);
                      }}
                      className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                    >
                      Fechar
                    </button>
                  </div>
                )}
              </form>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

