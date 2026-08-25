import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import FileUpload from '../../components/projetos/FileUpload';
import FaixaFormModal, { FaixaFormData, getInitialFaixaFormData } from '../../components/projetos/FaixaFormModal';
import NovoProdutorModal from '../../components/produtores/NovoProdutorModal';

export default function NovoProjeto() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [artistas, setArtistas] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [produtores, setProdutores] = useState<any[]>([]);
  
  // Seção 1: Informações Básicas
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    artista_id: '',
    fase: 'planejamento',
    prioridade: 'media',
    prazo: '',
    data_gravacao: '',
  });

  // Seção 2: Fornecedores e Profissionais
  const [fornecedoresData, setFornecedoresData] = useState({
    fornecedor_audio_id: '',
    fornecedor_video_id: '',
    local_gravacao_id: '',
    produtor_id: '',
    maquiador_id: '',
    outros_profissionais: [] as string[]
  });

  // Dados Técnicos Gerais do Projeto
  const [dadosTecnicos, setDadosTecnicos] = useState({
    responsavel_mixagem: '',
    responsavel_master: '',
    engenheiro_audio: '',
    diretor_video: '',
    produtor_musical_geral: '',
  });

  // Seção 3: Faixas
  const [faixas, setFaixas] = useState<FaixaFormData[]>([]);
  const [showFaixaModal, setShowFaixaModal] = useState(false);
  const [editingFaixaIndex, setEditingFaixaIndex] = useState<number | null>(null);
  const [isDuplicatingFaixa, setIsDuplicatingFaixa] = useState(false);
  const [faixaInitialData, setFaixaInitialData] = useState<Partial<FaixaFormData> | null>(null);

  const [showNovoProdutorModal, setShowNovoProdutorModal] = useState(false);

  // Seção 4: Referências do Projeto
  const [referenciasProjeto, setReferenciasProjeto] = useState<Array<{ tipo: 'youtube_url' | 'arquivo'; url?: string; arquivo_url?: string; arquivo_nome?: string; titulo: string; descricao?: string }>>([]);
  const [showReferenciaModal, setShowReferenciaModal] = useState(false);

  // Seção 5: Anexos do Projeto
  const [anexosProjeto, setAnexosProjeto] = useState<Array<{ tipo: 'pre' | 'outro'; arquivo_url: string; arquivo_nome: string; descricao?: string }>>([]);
  const [showAnexoModal, setShowAnexoModal] = useState(false);
  const [anexoTipo, setAnexoTipo] = useState<'pre' | 'outro'>('pre');
  const [anexoDescricao, setAnexoDescricao] = useState('');

  // Seção 6: Participantes e Músicos
  const [participantesProjeto, setParticipantesProjeto] = useState<Array<{
    tipo_participacao: string;
    funcao_instrumento: string;
    autorizante_nome: string;
    autorizante_nome_artistico?: string;
    autorizante_cpf?: string;
    autorizante_telefone?: string;
    autorizante_email?: string;
    autorizante_pix?: string;
  }>>([]);
  const [showParticipanteModal, setShowParticipanteModal] = useState(false);
  const [participanteFormData, setParticipanteFormData] = useState({
    tipo_participacao: 'musico',
    funcao_instrumento: '',
    autorizante_nome: '',
    autorizante_nome_artistico: '',
    autorizante_cpf: '',
    autorizante_telefone: '',
    autorizante_email: '',
    autorizante_pix: '',
  });

  useEffect(() => {
    loadArtistas();
    loadFornecedores();
    loadProdutores();
  }, []);

  const loadArtistas = async () => {
    try {
      const { data, error } = await supabase
        .from('artistas')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      if (data) setArtistas(data);
    } catch (error) {
      console.error('Erro ao carregar artistas:', error);
    }
  };

  const loadFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome, categoria, tipo_servico, status')
        .order('nome', { ascending: true });

      if (error) {
        console.warn('Erro ao carregar fornecedores:', error);
        setFornecedores([]);
      } else {
        setFornecedores(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      setFornecedores([]);
    }
  };

  const loadProdutores = async () => {
    try {
      const { data, error } = await supabase
        .from('produtores')
        .select('id, nome, especialidade, status')
        .order('nome', { ascending: true });

      if (error) {
        console.warn('Erro ao carregar produtores:', error);
        setProdutores([]);
      } else {
        setProdutores(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtores:', error);
      setProdutores([]);
    }
  };

  const handleAddFaixa = () => {
    setEditingFaixaIndex(null);
    setIsDuplicatingFaixa(false);
    setFaixaInitialData(null);
    setShowFaixaModal(true);
  };

  const handleEditFaixa = (index: number) => {
    setEditingFaixaIndex(index);
    setIsDuplicatingFaixa(false);
    setFaixaInitialData(faixas[index]);
    setShowFaixaModal(true);
  };

  const handleDuplicateFaixa = (index: number) => {
    const base = faixas[index];
    setEditingFaixaIndex(null);
    setIsDuplicatingFaixa(true);
    setFaixaInitialData({
      ...base,
      nome: '',
      titulo_oficial: '',
      titulo_provisorio: '',
      duracao: '',
      isrc: '',
      status: 'pendente',
      o_que_falta_gravar: '',
      referencias: [],
      anexos: []
    });
    setShowFaixaModal(true);
  };

  const handleSaveFaixa = (faixaData: FaixaFormData) => {
    if (editingFaixaIndex !== null) {
      const newFaixas = [...faixas];
      newFaixas[editingFaixaIndex] = {
        ...newFaixas[editingFaixaIndex],
        ...faixaData,
      };
      setFaixas(newFaixas);
    } else {
      setFaixas([...faixas, faixaData]);
    }

    setShowFaixaModal(false);
    setEditingFaixaIndex(null);
    setIsDuplicatingFaixa(false);
    setFaixaInitialData(null);
  };

  const handleRemoveFaixa = (index: number) => {
    if (confirm('Tem certeza que deseja remover esta faixa?')) {
      setFaixas(faixas.filter((_, i) => i !== index));
    }
  };

  const handleSaveReferenciaProjeto = async (referencia: {
    tipo: 'youtube_url' | 'arquivo';
    url?: string;
    arquivo_url?: string;
    arquivo_nome?: string;
    titulo: string;
    descricao?: string;
  }) => {
    setReferenciasProjeto([...referenciasProjeto, referencia]);
    setShowReferenciaModal(false);
  };

  const handleSaveAnexoProjeto = (arquivoUrl: string, arquivoNome: string) => {
    setAnexosProjeto([...anexosProjeto, {
      tipo: anexoTipo,
      arquivo_url: arquivoUrl,
      arquivo_nome: arquivoNome,
      descricao: anexoDescricao || undefined
    }]);
    setAnexoTipo('pre');
    setAnexoDescricao('');
    setShowAnexoModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      alert('Por favor, preencha o nome do projeto.');
      return;
    }

    if (!formData.artista_id) {
      alert('Por favor, selecione um artista.');
      return;
    }

    if (!formData.tipo) {
      alert('Por favor, selecione o tipo do projeto.');
      return;
    }

    try {
      setLoading(true);

      // Função helper para validar e converter UUID
      const toUUID = (value: string | null | undefined): string | null => {
        if (!value || value.trim() === '' || value === '0' || value === 'null' || value === 'undefined') {
          return null;
        }
        // Validar formato UUID básico (8-4-4-4-12 caracteres hexadecimais)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(value)) {
          return value;
        }
        // Se não for um UUID válido, retornar null
        return null;
      };

      // Criar projeto
      const dadosProjeto: any = {
        nome: formData.nome.trim(),
        titulo: formData.nome.trim(),
        tipo: formData.tipo,
        artista_id: toUUID(formData.artista_id),
        fase: formData.fase,
        prioridade: formData.prioridade,
      };

      // Adicionar campos opcionais apenas se tiverem valores
      const fornecedorAudioId = toUUID(fornecedoresData.fornecedor_audio_id);
      if (fornecedorAudioId) dadosProjeto.fornecedor_audio_id = fornecedorAudioId;

      const fornecedorVideoId = toUUID(fornecedoresData.fornecedor_video_id);
      if (fornecedorVideoId) dadosProjeto.fornecedor_video_id = fornecedorVideoId;

      const localGravacaoId = toUUID(fornecedoresData.local_gravacao_id);
      if (localGravacaoId) dadosProjeto.local_gravacao_id = localGravacaoId;

      const produtorId = toUUID(fornecedoresData.produtor_id);
      if (produtorId) dadosProjeto.produtor_id = produtorId;

      const maquiadorId = toUUID(fornecedoresData.maquiador_id);
      if (maquiadorId) dadosProjeto.maquiador_id = maquiadorId;

      // Outros profissionais: enviar como array JSONB ou omitir se vazio
      if (fornecedoresData.outros_profissionais.length > 0) {
        dadosProjeto.outros_profissionais = fornecedoresData.outros_profissionais;
      }

      if (formData.prazo) {
        dadosProjeto.previsao_lancamento = formData.prazo;
      }

      if (formData.data_gravacao) {
        dadosProjeto.data_gravacao = formData.data_gravacao;
      }

      if (dadosTecnicos.responsavel_mixagem.trim()) {
        dadosProjeto.responsavel_mixagem = dadosTecnicos.responsavel_mixagem.trim();
      }
      if (dadosTecnicos.responsavel_master.trim()) {
        dadosProjeto.responsavel_master = dadosTecnicos.responsavel_master.trim();
      }
      if (dadosTecnicos.engenheiro_audio.trim()) {
        dadosProjeto.engenheiro_audio = dadosTecnicos.engenheiro_audio.trim();
      }
      if (dadosTecnicos.diretor_video.trim()) {
        dadosProjeto.diretor_video = dadosTecnicos.diretor_video.trim();
      }
      if (dadosTecnicos.produtor_musical_geral.trim()) {
        dadosProjeto.produtor_musical_geral = dadosTecnicos.produtor_musical_geral.trim();
      }

      // Gerar token de auto-cadastro para o projeto
      const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      dadosProjeto.token_cadastro_participantes = `ceu_proj_${randomHex}`;

      const { data: projetoData, error: projetoError } = await supabase
        .from('projetos')
        .insert([dadosProjeto])
        .select()
        .single();

      if (projetoError) throw projetoError;

      const projetoId = projetoData.id;

      // Criar participantes iniciais do projeto
      for (const part of participantesProjeto) {
        const partRandomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        await supabase.from('projeto_participantes').insert([{
          projeto_id: projetoId,
          tipo_participacao: part.tipo_participacao,
          funcao_instrumento: part.funcao_instrumento,
          autorizante_nome: part.autorizante_nome,
          autorizante_nome_artistico: part.autorizante_nome_artistico || null,
          autorizante_cpf: part.autorizante_cpf || null,
          autorizante_telefone: part.autorizante_telefone || null,
          autorizante_email: part.autorizante_email || null,
          autorizante_pix: part.autorizante_pix || null,
          status: 'pendente',
          token: `ceu_part_${partRandomHex}`,
          declaracao_concordancia: false,
          termo_versao: '1.0'
        }]);
      }

      // Criar faixas
      for (let i = 0; i < faixas.length; i++) {
        const faixa = faixas[i];
        const dadosFaixa: any = {
          projeto_id: projetoId,
          nome: faixa.nome,
          titulo_oficial: faixa.titulo_oficial || faixa.nome,
          titulo_provisorio: faixa.titulo_provisorio || null,
          versao_faixa: faixa.versao_faixa || 'Original',
          versao_faixa_outra: faixa.versao_faixa_outra || null,
          duracao: faixa.duracao?.trim() || null,
          status: faixa.status,
          o_que_falta_gravar: faixa.o_que_falta_gravar?.trim() || null,
          ordem: i + 1,
          isrc: faixa.isrc?.trim() || null,
          upc_ean: faixa.upc_ean?.trim() || null,
          data_prevista_lancamento: faixa.data_prevista_lancamento?.trim() || null,
          data_efetiva_lancamento: faixa.data_efetiva_lancamento?.trim() || null,
          distribuidora_digital: faixa.distribuidora_digital?.trim() || null,
          titular_fonograma: faixa.titular_fonograma?.trim() || 'Céu Music',
          produtor_fonografico: faixa.produtor_fonografico?.trim() || 'Céu Music',
          modelo_exploracao: faixa.modelo_exploracao || null,
          modelo_exploracao_outro: faixa.modelo_exploracao_outro?.trim() || null,
          documentacao_obrigatoria: faixa.documentacao_obrigatoria || [],
          credito_artista: faixa.credito_artista?.trim() || null,
          credito_producao_musical: faixa.credito_producao_musical?.trim() || null,
          credito_compositores: faixa.credito_compositores?.trim() || null,
          credito_musicos: faixa.credito_musicos?.trim() || null,
          credito_mixagem: faixa.credito_mixagem?.trim() || null,
          credito_masterizacao: faixa.credito_masterizacao?.trim() || null,
          credito_demais_obrigatorios: faixa.credito_demais_obrigatorios?.trim() || null,
        };

        let faixaId: string;
        const { data: faixaData, error: faixaError } = await supabase
          .from('faixas')
          .insert([dadosFaixa])
          .select()
          .single();

        if (faixaError) {
          console.warn('Erro ao inserir faixa completa, tentando inserção simplificada:', faixaError);
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('faixas')
            .insert([{
              projeto_id: projetoId,
              nome: faixa.nome,
              status: faixa.status,
              o_que_falta_gravar: faixa.o_que_falta_gravar || null,
              ordem: i + 1,
            }])
            .select()
            .single();

          if (fallbackError) throw fallbackError;
          faixaId = fallbackData.id;
        } else {
          faixaId = faixaData.id;
        }

        // Criar referências da faixa se houver
        if (faixa.referencias && Array.isArray(faixa.referencias)) {
          for (const ref of faixa.referencias) {
            await supabase.from('projeto_referencias').insert([{
              projeto_id: projetoId,
              faixa_id: faixaId,
              tipo: ref.tipo,
              url: ref.url || null,
              arquivo_url: ref.arquivo_url || null,
              arquivo_nome: ref.arquivo_nome || null,
              titulo: ref.titulo,
              descricao: ref.descricao || null,
            }]);
          }
        }

        // Criar anexos da faixa se houver
        if (faixa.anexos && Array.isArray(faixa.anexos)) {
          for (const anexo of faixa.anexos) {
            await supabase.from('projeto_anexos').insert([{
              projeto_id: projetoId,
              faixa_id: faixaId,
              tipo: anexo.tipo,
              arquivo_url: anexo.arquivo_url,
              arquivo_nome: anexo.arquivo_nome,
              descricao: anexo.descricao || null,
            }]);
          }
        }
      }

      // Criar referências do projeto
      for (const ref of referenciasProjeto) {
        await supabase.from('projeto_referencias').insert([{
          projeto_id: projetoId,
          faixa_id: null,
          tipo: ref.tipo,
          url: ref.url || null,
          arquivo_url: ref.arquivo_url || null,
          arquivo_nome: ref.arquivo_nome || null,
          titulo: ref.titulo,
          descricao: ref.descricao || null,
        }]);
      }

      // Criar anexos do projeto
      for (const anexo of anexosProjeto) {
        await supabase.from('projeto_anexos').insert([{
          projeto_id: projetoId,
          faixa_id: null,
          tipo: anexo.tipo,
          arquivo_url: anexo.arquivo_url,
          arquivo_nome: anexo.arquivo_nome,
          descricao: anexo.descricao || null,
        }]);
      }

      navigate(`/projetos/${projetoId}`);
    } catch (error: any) {
      console.error('Erro ao criar projeto:', error);
      const errorMessage = error.message || error.details || error.hint || 'Tente novamente.';
      alert(`Erro ao criar projeto: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fornecedoresAudio = fornecedores.filter(f => 
    f.categoria === 'estudio' || 
    f.categoria === 'equipamento' ||
    (f.tipo_servico && (
      f.tipo_servico.toLowerCase().includes('áudio') || 
      f.tipo_servico.toLowerCase().includes('audio') ||
      f.tipo_servico.toLowerCase().includes('gravação') ||
      f.tipo_servico.toLowerCase().includes('gravacao') ||
      f.tipo_servico.toLowerCase().includes('mixagem') ||
      f.tipo_servico.toLowerCase().includes('master') ||
      f.tipo_servico.toLowerCase().includes('som')
    ))
  );

  const fornecedoresVideo = fornecedores.filter(f => 
    (f.tipo_servico && (
      f.tipo_servico.toLowerCase().includes('vídeo') || 
      f.tipo_servico.toLowerCase().includes('video') || 
      f.tipo_servico.toLowerCase().includes('videoclipe') ||
      f.tipo_servico.toLowerCase().includes('audiovisual') ||
      f.tipo_servico.toLowerCase().includes('foto') ||
      f.tipo_servico.toLowerCase().includes('filme')
    ))
  );

  const locaisGravacao = fornecedores.filter(f => 
    f.categoria === 'estudio' || 
    (f.tipo_servico && (
      f.tipo_servico.toLowerCase().includes('estúdio') || 
      f.tipo_servico.toLowerCase().includes('estudio') ||
      f.tipo_servico.toLowerCase().includes('locação') ||
      f.tipo_servico.toLowerCase().includes('locacao') ||
      f.tipo_servico.toLowerCase().includes('espaço') ||
      f.tipo_servico.toLowerCase().includes('espaco')
    ))
  );

  const maquiadores = fornecedores.filter(f => 
    f.tipo_servico && (
      f.tipo_servico.toLowerCase().includes('maquiag') || 
      f.tipo_servico.toLowerCase().includes('makeup') ||
      f.tipo_servico.toLowerCase().includes('make') ||
      f.tipo_servico.toLowerCase().includes('estética') ||
      f.tipo_servico.toLowerCase().includes('estetica')
    )
  );

  const listaAudio = fornecedoresAudio.length > 0 ? fornecedoresAudio : fornecedores;
  const listaVideo = fornecedoresVideo.length > 0 ? fornecedoresVideo : fornecedores;
  const listaLocais = locaisGravacao.length > 0 ? locaisGravacao : fornecedores;
  const listaMaquiadores = maquiadores.length > 0 ? maquiadores : fornecedores;

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/projetos')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-smooth cursor-pointer"
          >
            <i className="ri-arrow-left-line"></i>
            <span>Voltar para Projetos</span>
          </button>
          <h1 className="text-3xl font-bold text-white">Novo Projeto</h1>
          <p className="text-gray-400 mt-2">Preencha todas as informações para criar um novo projeto</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Seção 1: Informações Básicas */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nome do Projeto *</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  placeholder="Ex: Novo Single - Verão 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Tipo do Projeto *</label>
                <select
                  required
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="single">Single</option>
                  <option value="ep">EP</option>
                  <option value="album">Álbum</option>
                  <option value="audiovisual">Projeto Audiovisual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Artista *</label>
                <select
                  required
                  value={formData.artista_id}
                  onChange={(e) => setFormData({ ...formData, artista_id: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                >
                  <option value="">Selecione um artista</option>
                  {artistas.map((artista) => (
                    <option key={artista.id} value={artista.id}>{artista.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Fase Inicial</label>
                <select
                  value={formData.fase}
                  onChange={(e) => setFormData({ ...formData, fase: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                >
                  <option value="planejamento">Planejamento</option>
                  <option value="gravando">Gravando</option>
                  <option value="em_edicao">Em Edição</option>
                  <option value="mixagem">Mixagem</option>
                  <option value="masterizacao">Masterização</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="em_fase_lancamento">Em fase de lançamento</option>
                  <option value="lancado">Lançado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Prioridade</label>
                <select
                  value={formData.prioridade}
                  onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Data de Gravação</label>
                <input
                  type="date"
                  value={formData.data_gravacao}
                  onChange={(e) => setFormData({ ...formData, data_gravacao: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Prazo / Previsão de Lançamento</label>
                <input
                  type="date"
                  value={formData.prazo}
                  onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Fornecedores e Profissionais */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Fornecedores e Profissionais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Fornecedor de Áudio</label>
                <select
                  value={fornecedoresData.fornecedor_audio_id}
                  onChange={(e) => setFornecedoresData({ ...fornecedoresData, fornecedor_audio_id: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                >
                  <option value="">Indefinido</option>
                  {listaAudio.map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}{fornecedor.tipo_servico ? ` - ${fornecedor.tipo_servico}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Fornecedor de Vídeo</label>
                <select
                  value={fornecedoresData.fornecedor_video_id}
                  onChange={(e) => setFornecedoresData({ ...fornecedoresData, fornecedor_video_id: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                >
                  <option value="">Indefinido</option>
                  {listaVideo.map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}{fornecedor.tipo_servico ? ` - ${fornecedor.tipo_servico}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Local de Gravação</label>
                <select
                  value={fornecedoresData.local_gravacao_id}
                  onChange={(e) => setFornecedoresData({ ...fornecedoresData, local_gravacao_id: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                >
                  <option value="">Indefinido</option>
                  {listaLocais.map((local) => (
                    <option key={local.id} value={local.id}>
                      {local.nome}{local.tipo_servico ? ` - ${local.tipo_servico}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-400">Produtor</label>
                  <button
                    type="button"
                    onClick={() => setShowNovoProdutorModal(true)}
                    className="text-xs text-primary-teal hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <i className="ri-user-add-line"></i> Cadastrar Produtor
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={fornecedoresData.produtor_id}
                    onChange={(e) => setFornecedoresData({ ...fornecedoresData, produtor_id: e.target.value })}
                    className="flex-1 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="">Indefinido</option>
                    {produtores.map((produtor) => (
                      <option key={produtor.id} value={produtor.id}>
                        {produtor.nome}{produtor.especialidade ? ` - ${produtor.especialidade}` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNovoProdutorModal(true)}
                    className="px-3 py-2 bg-dark-bg hover:bg-dark-hover border border-dark-border rounded-lg text-gray-300 hover:text-white transition-smooth flex items-center gap-1 cursor-pointer"
                    title="Cadastrar novo produtor"
                  >
                    <i className="ri-add-line text-primary-teal text-lg"></i>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Maquiador</label>
                <select
                  value={fornecedoresData.maquiador_id}
                  onChange={(e) => setFornecedoresData({ ...fornecedoresData, maquiador_id: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                >
                  <option value="">Indefinido</option>
                  {listaMaquiadores.map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}{fornecedor.tipo_servico ? ` - ${fornecedor.tipo_servico}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Outros Profissionais</label>
                <select
                  multiple
                  value={fornecedoresData.outros_profissionais}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFornecedoresData({ ...fornecedoresData, outros_profissionais: selected });
                  }}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer min-h-[100px]"
                >
                  {fornecedores.map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome} - {fornecedor.tipo_servico}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Mantenha Ctrl (Cmd no Mac) pressionado para selecionar múltiplos</p>
              </div>
            </div>

            {/* Equipe Técnica do Projeto (Mix, Master, Gravação, Vídeo) */}
            <div className="pt-6 mt-6 border-t border-dark-border/60">
              <h3 className="text-sm font-semibold text-primary-teal uppercase tracking-wider mb-4 flex items-center gap-2">
                <i className="ri-equalizer-line"></i>
                Equipe Técnica e Créditos do Projeto
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">🎧 Mixagem</label>
                  <input
                    type="text"
                    value={dadosTecnicos.responsavel_mixagem}
                    onChange={(e) => setDadosTecnicos({ ...dadosTecnicos, responsavel_mixagem: e.target.value })}
                    placeholder="Nome do profissional / estúdio"
                    className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">🎚️ Masterização</label>
                  <input
                    type="text"
                    value={dadosTecnicos.responsavel_master}
                    onChange={(e) => setDadosTecnicos({ ...dadosTecnicos, responsavel_master: e.target.value })}
                    placeholder="Nome do profissional / estúdio"
                    className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">🎙️ Engenheiro(a) de Gravação</label>
                  <input
                    type="text"
                    value={dadosTecnicos.engenheiro_audio}
                    onChange={(e) => setDadosTecnicos({ ...dadosTecnicos, engenheiro_audio: e.target.value })}
                    placeholder="Nome do engenheiro de gravação"
                    className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">🎬 Direção de Vídeo / Clipe</label>
                  <input
                    type="text"
                    value={dadosTecnicos.diretor_video}
                    onChange={(e) => setDadosTecnicos({ ...dadosTecnicos, diretor_video: e.target.value })}
                    placeholder="Nome do diretor / produtora"
                    className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">🎹 Produção Musical Geral</label>
                  <input
                    type="text"
                    value={dadosTecnicos.produtor_musical_geral}
                    onChange={(e) => setDadosTecnicos({ ...dadosTecnicos, produtor_musical_geral: e.target.value })}
                    placeholder="Nome do produtor musical"
                    className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Faixas */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Faixas</h2>
              <button
                type="button"
                onClick={handleAddFaixa}
                className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
              >
                <i className="ri-add-line"></i>
                Adicionar Faixa
              </button>
            </div>

            {faixas.length === 0 ? (
              <div className="text-center py-12">
                <i className="ri-music-2-line text-6xl text-gray-600 mb-4"></i>
                <p className="text-gray-400 mb-4">Nenhuma faixa adicionada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {faixas.map((faixa, index) => (
                  <div key={index} className="bg-dark-bg border border-dark-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">
                            {index + 1}. {faixa.titulo_oficial || faixa.nome}
                          </h3>
                          {faixa.titulo_provisorio && (
                            <span className="text-xs text-gray-400 italic">
                              (Prov: {faixa.titulo_provisorio})
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            faixa.status === 'pendente' ? 'bg-yellow-500/20 text-yellow-400' :
                            faixa.status === 'gravada' ? 'bg-blue-500/20 text-blue-400' :
                            faixa.status === 'em_mixagem' ? 'bg-purple-500/20 text-purple-400' :
                            faixa.status === 'masterizacao' ? 'bg-orange-500/20 text-orange-400' :
                            faixa.status === 'finalizada' ? 'bg-green-500/20 text-green-400' :
                            'bg-primary-teal/20 text-primary-teal'
                          }`}>
                            {faixa.status === 'pendente' ? 'Pendente' :
                             faixa.status === 'gravada' ? 'Gravada' :
                             faixa.status === 'em_mixagem' ? 'Em Mixagem' :
                             faixa.status === 'masterizacao' ? 'Masterização' :
                             faixa.status === 'finalizada' ? 'Finalizada' :
                             'Lançada'}
                          </span>

                          {faixa.versao_faixa && (
                            <span className="px-2 py-0.5 bg-dark-card border border-dark-border text-gray-300 text-xs rounded">
                              {faixa.versao_faixa === 'Outra' && faixa.versao_faixa_outra
                                ? faixa.versao_faixa_outra
                                : faixa.versao_faixa}
                            </span>
                          )}

                          {faixa.duracao && (
                            <span className="px-2 py-0.5 bg-dark-card border border-dark-border text-gray-300 text-xs rounded flex items-center gap-1">
                              <i className="ri-time-line text-primary-teal"></i>
                              {faixa.duracao}
                            </span>
                          )}

                          {faixa.isrc && (
                            <span className="px-2 py-0.5 bg-primary-teal/10 text-primary-teal text-xs rounded">
                              ISRC: {faixa.isrc}
                            </span>
                          )}

                          {faixa.referencias && faixa.referencias.length > 0 && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                              {faixa.referencias.length} ref(s)
                            </span>
                          )}
                          {faixa.anexos && faixa.anexos.length > 0 && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                              {faixa.anexos.length} anexo(s)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDuplicateFaixa(index)}
                          className="p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer"
                          title="Duplicar dados para nova faixa"
                        >
                          <i className="ri-file-copy-line text-gray-400 hover:text-primary-teal"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditFaixa(index)}
                          className="p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer"
                          title="Editar ficha da faixa"
                        >
                          <i className="ri-edit-line text-gray-400 hover:text-primary-teal"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFaixa(index)}
                          className="p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer"
                          title="Remover faixa"
                        >
                          <i className="ri-delete-bin-line text-gray-400 hover:text-red-400"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção 4: Referências do Projeto */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Referências do Projeto</h2>
              <button
                type="button"
                onClick={() => setShowReferenciaModal(true)}
                className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
              >
                <i className="ri-add-line"></i>
                Adicionar Referência
              </button>
            </div>

            {referenciasProjeto.length === 0 ? (
              <div className="text-center py-8">
                <i className="ri-links-line text-4xl text-gray-600 mb-3"></i>
                <p className="text-gray-400">Nenhuma referência adicionada</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referenciasProjeto.map((ref, index) => (
                  <div key={index} className="bg-dark-bg border border-dark-border rounded-lg p-4">
                    <h3 className="text-sm font-medium text-white mb-2">{ref.titulo}</h3>
                    {ref.tipo === 'youtube_url' && ref.url && (
                      <div className="mt-2">
                        <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-teal hover:text-primary-brown">
                          Ver no YouTube
                        </a>
                      </div>
                    )}
                    {ref.tipo === 'arquivo' && ref.arquivo_url && (
                      <div className="mt-2">
                        <a href={ref.arquivo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-teal hover:text-primary-brown">
                          {ref.arquivo_nome || 'Ver arquivo'}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção 5: Anexos do Projeto */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Anexos do Projeto</h2>
              <button
                type="button"
                onClick={() => setShowAnexoModal(true)}
                className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
              >
                <i className="ri-add-line"></i>
                Adicionar Anexo
              </button>
            </div>

            {anexosProjeto.length === 0 ? (
              <div className="text-center py-8">
                <i className="ri-attachment-line text-4xl text-gray-600 mb-3"></i>
                <p className="text-gray-400">Nenhum anexo adicionado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {anexosProjeto.map((anexo, index) => (
                  <div key={index} className="bg-dark-bg border border-dark-border rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <i className={`ri-${anexo.tipo === 'pre' ? 'file-music-line' : 'file-line'} text-primary-teal`}></i>
                      <span className="text-sm text-white">{anexo.arquivo_nome}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${anexo.tipo === 'pre' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {anexo.tipo === 'pre' ? 'PRÉ' : 'Outro'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnexosProjeto(anexosProjeto.filter((_, i) => i !== index))}
                      className="p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-gray-400 hover:text-red-400"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção 6: Participantes e Músicos do Projeto */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <i className="ri-team-line text-primary-teal"></i>
                  Participantes e Músicos (Opcional)
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Você pode pré-cadastrar os músicos conhecidos agora ou gerar o link compartilhável após criar o projeto.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setParticipanteFormData({
                    tipo_participacao: 'musico',
                    funcao_instrumento: '',
                    autorizante_nome: '',
                    autorizante_nome_artistico: '',
                    autorizante_cpf: '',
                    autorizante_telefone: '',
                    autorizante_email: '',
                    autorizante_pix: '',
                  });
                  setShowParticipanteModal(true);
                }}
                className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap text-sm font-semibold"
              >
                <i className="ri-user-add-line"></i>
                Adicionar Participante
              </button>
            </div>

            {participantesProjeto.length === 0 ? (
              <div className="text-center py-8 bg-dark-bg/40 rounded-xl border border-dashed border-dark-border">
                <i className="ri-user-star-line text-4xl text-gray-600 mb-2 block"></i>
                <p className="text-gray-400 text-xs">Nenhum participante adicionado ainda</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Ao criar o projeto, você também terá um link compartilhável para os músicos se auto-cadastrarem.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {participantesProjeto.map((p, index) => (
                  <div key={index} className="bg-dark-bg border border-dark-border rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {p.autorizante_nome_artistico || p.autorizante_nome}
                      </p>
                      <p className="text-xs text-primary-teal font-medium">
                        {p.funcao_instrumento} • {p.tipo_participacao}
                      </p>
                      {p.autorizante_cpf && (
                        <p className="text-[11px] text-gray-400 font-mono">CPF: {p.autorizante_cpf}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setParticipantesProjeto(participantesProjeto.filter((_, i) => i !== index))}
                      className="p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer text-gray-400 hover:text-red-400"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/projetos')}
              className="px-6 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <i className="ri-check-line"></i>
                  <span>Criar Projeto</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Modal Faixa */}
        <FaixaFormModal
          isOpen={showFaixaModal}
          onClose={() => {
            setShowFaixaModal(false);
            setEditingFaixaIndex(null);
            setIsDuplicatingFaixa(false);
            setFaixaInitialData(null);
          }}
          onSave={handleSaveFaixa}
          initialData={editingFaixaIndex !== null ? faixas[editingFaixaIndex] : faixaInitialData}
          isEditing={editingFaixaIndex !== null}
          isDuplicating={isDuplicatingFaixa}
          duplicateSourceFaixas={faixas.map((f, idx) => ({
            id: String(idx),
            nome: f.titulo_oficial || f.nome,
            data: f
          }))}
        />

        {/* Modal Cadastrar Produtor */}
        <NovoProdutorModal
          isOpen={showNovoProdutorModal}
          onClose={() => setShowNovoProdutorModal(false)}
          onSuccess={(newProdutor) => {
            setProdutores(prev => [...prev, newProdutor]);
            setFornecedoresData(prev => ({ ...prev, produtor_id: newProdutor.id }));
          }}
        />

        {/* Modal Referência do Projeto */}
        {showReferenciaModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Adicionar Referência do Projeto</h2>
                <button
                  onClick={() => setShowReferenciaModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tipo de Referência</label>
                  <select
                    id="tipo-ref-projeto"
                    onChange={(e) => {
                      const tipo = e.target.value;
                      const urlContainer = document.getElementById('url-ref-container');
                      const arquivoContainer = document.getElementById('arquivo-ref-container');
                      if (tipo === 'youtube_url') {
                        urlContainer?.classList.remove('hidden');
                        arquivoContainer?.classList.add('hidden');
                      } else {
                        urlContainer?.classList.add('hidden');
                        arquivoContainer?.classList.remove('hidden');
                      }
                    }}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="youtube_url">URL do YouTube</option>
                    <option value="arquivo">Upload de Arquivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Título *</label>
                  <input
                    type="text"
                    id="titulo-ref-projeto"
                    required
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Referência de vídeo clipe"
                  />
                </div>

                <div id="url-ref-container">
                  <label className="block text-sm font-medium text-gray-400 mb-2">URL do YouTube *</label>
                  <input
                    type="url"
                    id="url-ref-projeto"
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                <div id="arquivo-ref-container" className="hidden">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo *</label>
                  <FileUpload
                    bucket="projetos-referencias"
                    folder={`temp/${Date.now()}`}
                    onUploadComplete={(url, fileName) => {
                      const urlInput = document.getElementById('url-ref-projeto') as HTMLInputElement;
                      if (urlInput) urlInput.value = url;
                    }}
                    onError={(error) => toast.error(`Erro: ${error}`)}
                    accept="*/*"
                    label="Selecionar arquivo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Descrição</label>
                  <textarea
                    id="descricao-ref-projeto"
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Descrição opcional da referência..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReferenciaModal(false)}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tipoSelect = document.getElementById('tipo-ref-projeto') as HTMLSelectElement;
                      const tituloInput = document.getElementById('titulo-ref-projeto') as HTMLInputElement;
                      const urlInput = document.getElementById('url-ref-projeto') as HTMLInputElement;
                      const descricaoInput = document.getElementById('descricao-ref-projeto') as HTMLTextAreaElement;
                      const tipo = tipoSelect?.value as 'youtube_url' | 'arquivo';
                      const titulo = tituloInput?.value.trim();
                      const url = urlInput?.value.trim();

                      if (!titulo) {
                        alert('Por favor, preencha o título da referência.');
                        return;
                      }

                      if (tipo === 'youtube_url' && !url) {
                        alert('Por favor, informe a URL do YouTube.');
                        return;
                      }

                      if (tipo === 'arquivo' && !url) {
                        alert('Por favor, faça o upload do arquivo.');
                        return;
                      }

                      handleSaveReferenciaProjeto({
                        tipo,
                        url: tipo === 'youtube_url' ? url : undefined,
                        arquivo_url: tipo === 'arquivo' ? url : undefined,
                        arquivo_nome: tipo === 'arquivo' ? url.split('/').pop() || 'arquivo' : undefined,
                        titulo,
                        descricao: descricaoInput?.value.trim() || undefined,
                      });
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Adicionar Referência
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Anexo do Projeto */}
        {showAnexoModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Adicionar Anexo do Projeto</h2>
                <button
                  onClick={() => {
                    setShowAnexoModal(false);
                    setAnexoTipo('pre');
                    setAnexoDescricao('');
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tipo de Anexo</label>
                  <select
                    value={anexoTipo}
                    onChange={(e) => setAnexoTipo(e.target.value as 'pre' | 'outro')}
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
                    folder={`temp/${Date.now()}`}
                    onUploadComplete={(url, fileName) => handleSaveAnexoProjeto(url, fileName)}
                    onError={(error) => toast.error(`Erro: ${error}`)}
                    accept="*/*"
                    label="Selecionar arquivo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Descrição (opcional)</label>
                  <textarea
                    value={anexoDescricao}
                    onChange={(e) => setAnexoDescricao(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Descrição do anexo..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Participante do Projeto */}
        {showParticipanteModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Adicionar Participante / Músico</h2>
                <button
                  onClick={() => setShowParticipanteModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Tipo de Participação <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={participanteFormData.tipo_participacao}
                    onChange={(e) =>
                      setParticipanteFormData({
                        ...participanteFormData,
                        tipo_participacao: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="musico">Músico(a) / Instrumentista</option>
                    <option value="produtor_musical">Produtor(a) Musical</option>
                    <option value="arranjador">Arranjador(a)</option>
                    <option value="compositor">Compositor(a)</option>
                    <option value="letrista">Letrista</option>
                    <option value="engenheiro_audio">Engenheiro(a) de Áudio</option>
                    <option value="cantor_convidado">Cantor(a) Convidado(a)</option>
                    <option value="backing_vocal">Backing Vocal</option>
                    <option value="coral">Coral</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Instrumento / Função <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={participanteFormData.funcao_instrumento}
                    onChange={(e) =>
                      setParticipanteFormData({
                        ...participanteFormData,
                        funcao_instrumento: e.target.value,
                      })
                    }
                    placeholder="Ex: Bateria, Violão de Aço, Teclados..."
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Nome Completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={participanteFormData.autorizante_nome}
                    onChange={(e) =>
                      setParticipanteFormData({
                        ...participanteFormData,
                        autorizante_nome: e.target.value,
                      })
                    }
                    placeholder="Nome completo do participante"
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Nome Artístico (opcional)
                  </label>
                  <input
                    type="text"
                    value={participanteFormData.autorizante_nome_artistico}
                    onChange={(e) =>
                      setParticipanteFormData({
                        ...participanteFormData,
                        autorizante_nome_artistico: e.target.value,
                      })
                    }
                    placeholder="Como deseja ser creditado"
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">CPF</label>
                    <input
                      type="text"
                      value={participanteFormData.autorizante_cpf}
                      onChange={(e) =>
                        setParticipanteFormData({
                          ...participanteFormData,
                          autorizante_cpf: e.target.value,
                        })
                      }
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">WhatsApp</label>
                    <input
                      type="tel"
                      value={participanteFormData.autorizante_telefone}
                      onChange={(e) =>
                        setParticipanteFormData({
                          ...participanteFormData,
                          autorizante_telefone: e.target.value,
                        })
                      }
                      placeholder="(21) 99999-9999"
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowParticipanteModal(false)}
                    className="px-4 py-2 bg-transparent text-gray-400 hover:text-white rounded-lg text-sm transition-smooth"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!participanteFormData.autorizante_nome.trim()) {
                        alert('Informe o nome do participante.');
                        return;
                      }
                      if (!participanteFormData.funcao_instrumento.trim()) {
                        alert('Informe o instrumento ou função.');
                        return;
                      }
                      setParticipantesProjeto([...participantesProjeto, participanteFormData]);
                      setShowParticipanteModal(false);
                    }}
                    className="px-5 py-2 bg-gradient-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-smooth"
                  >
                    Adicionar à Lista
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
