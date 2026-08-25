import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface ProjetoData {
  id: string;
  nome: string;
  tipo?: string;
  artista_id?: string;
  artista?: {
    id?: string;
    nome: string;
    instagram?: string;
    tiktok?: string;
    facebook?: string;
  };
  produtor?: string;
  estudio?: string;
  data_lancamento?: string;
  previsao_lancamento?: string;
  letra?: string;
  responsavel_mixagem?: string;
  responsavel_master?: string;
  engenheiro_audio?: string;
  direcao_tecnica_audio?: string;
  diretor_video?: string;
  captacao_video?: string;
  fotografo?: string;
  maquiador_nome?: string;
  fonoaudiologo_nome?: string;
  storymaker_filmmaker?: string;
  producao_tecnica?: string;
  producao_geral?: string;
  direcao_executiva?: string;
  produtor_musical_geral?: string;
  link_plataformas?: string;
  descricao_youtube_custom?: string;
  artista_instagram?: string;
  artista_tiktok?: string;
  artista_facebook?: string;
  outros_profissionais_custom?: Array<{ papel: string; nome: string }>;
}

interface ParticipanteItem {
  id: string;
  funcao_instrumento: string;
  tipo_participacao: string;
  autorizante_nome: string;
  autorizante_nome_artistico?: string;
  status: string;
  faixas_ids?: string[];
}

interface FaixaItem {
  id: string;
  nome: string;
  compositores?: string[];
  letristas?: string[];
  letra?: string;
  mixagem?: string;
  masterizacao?: string;
}

interface FichaTecnicaYouTubeManagerProps {
  projeto: ProjetoData;
  onUpdate: () => void;
}

export default function FichaTecnicaYouTubeManager({
  projeto,
  onUpdate,
}: FichaTecnicaYouTubeManagerProps) {
  const { showToast } = useToast();
  const descricaoRef = useRef<HTMLDivElement>(null);

  const [participantes, setParticipantes] = useState<ParticipanteItem[]>([]);
  const [faixas, setFaixas] = useState<FaixaItem[]>([]);
  const [selectedFaixaId, setSelectedFaixaId] = useState<string>('todas');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mostrarDescricao, setMostrarDescricao] = useState(false);

  // Form State para configurações específicas de lançamento e finalização
  const [formData, setFormData] = useState({
    responsavel_mixagem: projeto.responsavel_mixagem || '',
    responsavel_master: projeto.responsavel_master || '',
    direcao_tecnica_audio: projeto.direcao_tecnica_audio || '',
    storymaker_filmmaker: projeto.storymaker_filmmaker || '',
    producao_tecnica: projeto.producao_tecnica || '',
    producao_geral: projeto.producao_geral || 'Céu Music',
    direcao_executiva: projeto.direcao_executiva || 'Céu Music',
    link_plataformas: projeto.link_plataformas || '',
    artista_instagram: projeto.artista_instagram || projeto.artista?.instagram || '',
    artista_tiktok: projeto.artista_tiktok || projeto.artista?.tiktok || '',
    artista_facebook: projeto.artista_facebook || projeto.artista?.facebook || '',
    letra: projeto.letra || '',
  });

  // Texto da descrição do YouTube (editável)
  const [textoDescricao, setTextoDescricao] = useState<string>('');

  useEffect(() => {
    setFormData({
      responsavel_mixagem: projeto.responsavel_mixagem || '',
      responsavel_master: projeto.responsavel_master || '',
      direcao_tecnica_audio: projeto.direcao_tecnica_audio || '',
      storymaker_filmmaker: projeto.storymaker_filmmaker || '',
      producao_tecnica: projeto.producao_tecnica || '',
      producao_geral: projeto.producao_geral || 'Céu Music',
      direcao_executiva: projeto.direcao_executiva || 'Céu Music',
      link_plataformas: projeto.link_plataformas || '',
      artista_instagram: projeto.artista_instagram || projeto.artista?.instagram || '',
      artista_tiktok: projeto.artista_tiktok || projeto.artista?.tiktok || '',
      artista_facebook: projeto.artista_facebook || projeto.artista?.facebook || '',
      letra: projeto.letra || '',
    });
  }, [projeto]);

  useEffect(() => {
    loadParticipantesEFaixas();
  }, [projeto.id]);

  const loadParticipantesEFaixas = async () => {
    try {
      setLoading(true);
      const [partRes, faixasRes] = await Promise.all([
        supabase
          .from('projeto_participantes')
          .select('id, funcao_instrumento, tipo_participacao, autorizante_nome, autorizante_nome_artistico, status, faixas_ids')
          .eq('projeto_id', projeto.id)
          .neq('status', 'cancelado'),
        supabase
          .from('faixas')
          .select('id, nome, compositores, letristas, letra, mixagem, masterizacao')
          .eq('projeto_id', projeto.id)
          .order('ordem', { ascending: true }),
      ]);

      if (partRes.data) setParticipantes(partRes.data);
      if (faixasRes.data) {
        setFaixas(faixasRes.data);
        if (faixasRes.data.length > 0 && selectedFaixaId === 'todas') {
          setSelectedFaixaId(faixasRes.data[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar participantes e faixas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Faixa ativa selecionada
  const faixaAtiva = useMemo(() => {
    if (selectedFaixaId === 'todas') return null;
    return faixas.find((f) => f.id === selectedFaixaId) || null;
  }, [selectedFaixaId, faixas]);

  // Músicos filtrados pela faixa selecionada
  const musicosFiltrados = useMemo(() => {
    if (!selectedFaixaId || selectedFaixaId === 'todas') {
      return participantes.filter(
        (p) =>
          p.tipo_participacao === 'musico' ||
          p.tipo_participacao === 'backing_vocal' ||
          p.tipo_participacao === 'coral' ||
          p.tipo_participacao === 'arranjador' ||
          p.tipo_participacao === 'cantor_convidado'
      );
    }
    return participantes.filter((p) => {
      const isMusico =
        p.tipo_participacao === 'musico' ||
        p.tipo_participacao === 'backing_vocal' ||
        p.tipo_participacao === 'coral' ||
        p.tipo_participacao === 'arranjador' ||
        p.tipo_participacao === 'cantor_convidado';
      if (!isMusico) return false;
      // Se não especificou faixas, participou de todas
      if (!p.faixas_ids || p.faixas_ids.length === 0) return true;
      return p.faixas_ids.includes(selectedFaixaId);
    });
  }, [participantes, selectedFaixaId]);

  // Formatação amigável do papel do músico
  const formatarPapelInstrumento = (funcao: string): string => {
    const map: Record<string, string> = {
      bateria: 'Baterista',
      baixo: 'Baixista',
      'baixo elétrico': 'Baixista',
      'baixo acústico': 'Baixista Acústico',
      guitarra: 'Guitarrista',
      'guitarra elétrica': 'Guitarrista',
      violão: 'Violonista',
      'violão de aço': 'Violão',
      'violão de nylon': 'Violão',
      teclado: 'Tecladista',
      teclados: 'Tecladista',
      'teclados / sintetizadores': 'Tecladista',
      piano: 'Pianista',
      'piano acústico': 'Pianista',
      'backing vocal': 'Backing Vocal',
      coral: 'Coral',
      coro: 'Coral',
      metais: 'Metais / Sopros',
      saxofone: 'Saxofonista',
      trompete: 'Trompetista',
      trombone: 'Trombonista',
      percussão: 'Percussionista',
      'percussão geral': 'Percussão',
      cordas: 'Cordas',
      violino: 'Violinista',
      'voz principal': 'Voz Principal',
    };

    const lower = funcao.trim().toLowerCase();
    return map[lower] || funcao.charAt(0).toUpperCase() + funcao.slice(1);
  };

  // Produtor Musical resolvido automaticamente do projeto
  const produtorMusicalNome = useMemo(() => {
    if (projeto.produtor && projeto.produtor.trim()) return projeto.produtor.trim();
    if (projeto.produtor_musical_geral && projeto.produtor_musical_geral.trim()) return projeto.produtor_musical_geral.trim();
    const partProd = participantes.find((p) => p.tipo_participacao === 'produtor_musical');
    if (partProd) return partProd.autorizante_nome_artistico || partProd.autorizante_nome;
    return 'Céu Music';
  }, [projeto, participantes]);

  // Gerador dinâmico do template oficial Céu Music para a faixa selecionada
  const gerarDescricaoYouTube = (): string => {
    const nomeArtista = projeto.artista?.nome || 'Artista Céu Music';
    const nomeMusica = faixaAtiva?.nome || projeto.nome || 'Canção';

    // Mês e Ano de lançamento
    const dataRef = projeto.data_lancamento || projeto.previsao_lancamento || new Date().toISOString();
    const dataObj = new Date(dataRef);
    const meses = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
    ];
    const mesAno = `${meses[dataObj.getMonth()]} de ${dataObj.getFullYear()}`;
    const anoAtual = dataObj.getFullYear() || new Date().getFullYear();

    // Compositores específicos da faixa selecionada ou participantes
    const compositoresSet = new Set<string>();
    if (faixaAtiva && faixaAtiva.compositores && faixaAtiva.compositores.length > 0) {
      faixaAtiva.compositores.forEach((c) => compositoresSet.add(c));
    } else {
      faixas.forEach((f) => f.compositores?.forEach((c) => compositoresSet.add(c)));
      participantes
        .filter((p) => p.tipo_participacao === 'compositor' || p.tipo_participacao === 'letrista')
        .forEach((p) => compositoresSet.add(p.autorizante_nome_artistico || p.autorizante_nome));
    }

    const compositoresLista =
      compositoresSet.size > 0 ? Array.from(compositoresSet).join(', ') : nomeArtista;

    // Músicos formatados
    const musicosItems = musicosFiltrados.map((p) => {
      const papel = formatarPapelInstrumento(p.funcao_instrumento);
      const nome = p.autorizante_nome_artistico || p.autorizante_nome;
      return `► ${papel}: ${nome}`;
    });

    // Mixagem e Masterização
    const mixagemFinal = faixaAtiva?.mixagem || formData.responsavel_mixagem || '';
    const masterFinal = faixaAtiva?.masterizacao || formData.responsavel_master || '';

    // Letra da música
    const letraTexto = faixaAtiva?.letra || formData.letra || '';

    // Hashtags
    const sanitizeTag = (txt: string) => txt.replace(/[^a-zA-Z0-9]/g, '');
    const tagArtista = `#${sanitizeTag(nomeArtista)}`;
    const tagMusica = `#${sanitizeTag(nomeMusica)}`;

    // Montagem do texto oficial da Céu Music
    const linhas: string[] = [];

    // 1. TÍTULO E INTRODUÇÃO
    linhas.push(`${nomeArtista.toUpperCase()} - ${nomeMusica.toUpperCase()} | Clipe da canção, lançado pela CÉU MUSIC ${mesAno}.`);
    linhas.push('------------------------------------------------------------');

    // 2. ESCUTE NAS PLATAFORMAS
    linhas.push(`🎧 ESCUTE ${nomeArtista.toUpperCase()} NAS PLATAFORMAS DIGITAIS`);
    linhas.push(`► ${formData.link_plataformas || 'https://ceumusic.com.br'}`);
    linhas.push('------------------------------------------------------------');

    // 3. REDES SOCIAIS DO ARTISTA
    linhas.push(`🎙️ SIGA ${nomeArtista.toUpperCase()} NAS REDES SOCIAIS`);
    if (formData.artista_instagram) linhas.push(`INSTAGRAM: ${formData.artista_instagram}`);
    if (formData.artista_tiktok) linhas.push(`-TIKTOK: ${formData.artista_tiktok}`);
    if (formData.artista_facebook) linhas.push(`FACEBOOK: ${formData.artista_facebook}`);
    if (!formData.artista_instagram && !formData.artista_tiktok && !formData.artista_facebook) {
      linhas.push(`INSTAGRAM: https://www.instagram.com/${sanitizeTag(nomeArtista).toLowerCase()}`);
    }
    linhas.push('------------------------------------------------------------');

    // 4. INSTITUCIONAL CÉU MUSIC
    linhas.push('🔊 SOMOS A CÉU MUSIC');
    linhas.push('Somos uma gravadora cristã, onde promovemos o reino de Deus através da música. Valorizamos os nossos artistas, dando a eles uma plataforma onde suas vozes são ouvidas. Assim como o Céu tem um espaço infinito para a movimentação dos astros, A Céu Music tem infinita possibilidades para os seus agenciados se moverem. Acreditamos que uma das coisas mais importantes que temos é a voz. Foi através dela que os céus e terra foram criados e tanta outras coisas mais, e por conta disso, a Céu Music é o lugar para amplificar aqueles que tem uma voz, e que só precisam ser ouvidos.');
    linhas.push('SE INSCREVA NO NOSSO CANAL DO YOUTUBE e não perca as novidades');
    linhas.push('► INSTAGRAM: https://www.instagram.com/ceumusicbr/');
    linhas.push('► FACEBOOK: https://www.facebook.com/profile.php?id=61567287383832');
    linhas.push('► TIKTOK: https://www.tiktok.com/@ceumusicbrasil');
    linhas.push('-------------------------------------------------------------------------');

    // 5. FICHA TÉCNICA (Aproveita automaticamente os dados da Equipe Técnica do projeto)
    linhas.push('🔎 FICHA TÉCNICA');
    linhas.push(`► Produção Geral: ${formData.producao_geral || 'Céu Music'}`);
    linhas.push(`► Direção Executiva: ${formData.direcao_executiva || 'Céu Music'}`);
    linhas.push(`► Cantor: ${nomeArtista}`);
    linhas.push(`► Canção: ${nomeMusica}`);
    linhas.push(`► Composição: ${compositoresLista}`);
    linhas.push(`► Produção Musical: ${produtorMusicalNome}`);
    if (projeto.diretor_video) linhas.push(`► Direção de Vídeo: ${projeto.diretor_video}`);
    if (projeto.captacao_video) linhas.push(`► Captação de Vídeo: ${projeto.captacao_video}`);
    if (projeto.fotografo) linhas.push(`► Fotos: ${projeto.fotografo}`);

    // Músicos listados
    if (musicosItems.length > 0) {
      musicosItems.forEach((m) => linhas.push(m));
    }

    if (formData.direcao_tecnica_audio) linhas.push(`► Direção técnica de Áudio: ${formData.direcao_tecnica_audio}`);
    if (projeto.engenheiro_audio) linhas.push(`► Engenheiro de Gravação: ${projeto.engenheiro_audio}`);
    if (formData.producao_tecnica) linhas.push(`► Produção Técnica: ${formData.producao_tecnica}`);
    if (mixagemFinal) linhas.push(`► Mixagem: ${mixagemFinal}`);
    if (masterFinal) linhas.push(`► Masterização: ${masterFinal}`);
    if (formData.storymaker_filmmaker) linhas.push(`► Storymaker / Filmaker: ${formData.storymaker_filmmaker}`);
    if (projeto.maquiador_nome) linhas.push(`► Maquiador(a): ${projeto.maquiador_nome}`);
    if (projeto.fonoaudiologo_nome) linhas.push(`► Fonoaudiólogo(a): ${projeto.fonoaudiologo_nome}`);

    // Outros profissionais customizados
    if (Array.isArray(projeto.outros_profissionais_custom)) {
      projeto.outros_profissionais_custom.forEach((prof) => {
        if (prof.papel && prof.nome) {
          linhas.push(`► ${prof.papel}: ${prof.nome}`);
        }
      });
    }

    linhas.push('----------------------------------------------------------------------------');

    // 6. LETRA
    if (letraTexto) {
      linhas.push(`LETRA: ${nomeMusica.toUpperCase()}`);
      linhas.push(letraTexto);
      linhas.push('_____________________________________________________________________');
    }

    // 7. HASHTAGS E COPYRIGHT
    linhas.push(`#CeuMusic ${tagArtista} ${tagMusica} #AssimNaTerraComoNoCeu #gospelmusic`);
    linhas.push(`Copyright © ${anoAtual} Céu Music. Todos os direitos reservados.`);

    return linhas.join('\n');
  };

  // Ao clicar em "Gerar Descrição"
  const handleGerarDescricao = () => {
    const texto = gerarDescricaoYouTube();
    setTextoDescricao(texto);
    setMostrarDescricao(true);
    showToast('Descrição gerada aproveitando os dados da equipe e da faixa!', 'success');

    // Rolar suavemente até o preview
    setTimeout(() => {
      descricaoRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Salvar configurações no Supabase
  const handleSaveConfig = async () => {
    try {
      setSaving(true);

      const payload = {
        responsavel_mixagem: formData.responsavel_mixagem.trim() || null,
        responsavel_master: formData.responsavel_master.trim() || null,
        direcao_tecnica_audio: formData.direcao_tecnica_audio.trim() || null,
        storymaker_filmmaker: formData.storymaker_filmmaker.trim() || null,
        producao_tecnica: formData.producao_tecnica.trim() || null,
        producao_geral: formData.producao_geral.trim() || 'Céu Music',
        direcao_executiva: formData.direcao_executiva.trim() || 'Céu Music',
        link_plataformas: formData.link_plataformas.trim() || null,
        artista_instagram: formData.artista_instagram.trim() || null,
        artista_tiktok: formData.artista_tiktok.trim() || null,
        artista_facebook: formData.artista_facebook.trim() || null,
        letra: formData.letra.trim() || null,
        descricao_youtube_custom: textoDescricao.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('projetos')
        .update(payload)
        .eq('id', projeto.id);

      if (error) throw error;

      showToast('Configurações de lançamento salvas com sucesso!', 'success');
      onUpdate();
    } catch (err: any) {
      console.error('Erro ao salvar configurações de lançamento:', err);
      showToast('Erro ao salvar alterações no projeto.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyYouTube = () => {
    navigator.clipboard.writeText(textoDescricao);
    setCopied(true);
    showToast('Descrição do YouTube copiada para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-6">
      {/* Cabeçalho do Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-border/60 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider mb-2">
            <i className="ri-youtube-fill text-sm"></i>
            Central de Lançamento & YouTube
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Ficha Técnica & Gerador Oficial de Descrição para YouTube
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Gere a descrição completa para o YouTube aproveitando automaticamente os fornecedores, produtores e músicos cadastrados no projeto.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveConfig}
          disabled={saving}
          className="px-5 py-2.5 bg-primary-teal hover:bg-primary-teal/90 text-dark-bg rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 self-start md:self-auto"
        >
          <i className="ri-save-line text-sm"></i>
          <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
        </button>
      </div>

      {/* BLOCO 1: SELETOR DA FAIXA / CANÇÃO */}
      <div className="bg-dark-bg/80 border border-dark-border p-5 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <i className="ri-music-2-line text-primary-teal"></i>
              1. Selecione a Faixa / Canção de Lançamento
            </label>
            <p className="text-[11px] text-gray-400 mt-0.5">
              A descrição será gerada com o nome, compositores e músicos vinculados a esta faixa.
            </p>
          </div>

          {faixas.length > 0 ? (
            <select
              value={selectedFaixaId}
              onChange={(e) => {
                setSelectedFaixaId(e.target.value);
                setMostrarDescricao(false);
              }}
              className="px-4 py-2.5 bg-dark-card border border-primary-teal/50 rounded-lg text-white text-sm font-semibold focus:outline-none focus:border-primary-teal cursor-pointer"
            >
              {faixas.map((fx) => (
                <option key={fx.id} value={fx.id}>
                  Faixa: {fx.nome}
                </option>
              ))}
              <option value="todas">Projeto Completo ({projeto.nome})</option>
            </select>
          ) : (
            <span className="text-xs px-3 py-1.5 bg-dark-card border border-dark-border rounded-lg text-gray-300 font-medium">
              Projeto: {projeto.nome}
            </span>
          )}
        </div>

        {/* Resumo da Faixa Selecionada */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-dark-border/50 text-xs">
          <span className="text-gray-400">Canção Selecionada:</span>
          <strong className="text-primary-teal text-sm">
            {faixaAtiva ? faixaAtiva.nome : projeto.nome}
          </strong>
          {faixaAtiva?.compositores && faixaAtiva.compositores.length > 0 && (
            <>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400">
                Compositores: <strong className="text-white">{faixaAtiva.compositores.join(', ')}</strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* BLOCO 2: FINALIZAÇÃO & LINKS DE LANÇAMENTO */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <i className="ri-equalizer-line text-primary-teal"></i>
          2. Finalização & Links de Lançamento
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Coluna A: Mixagem, Master & Detalhes Técnicos */}
          <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border space-y-3">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2 border-b border-dark-border/40 pb-2">
              <i className="ri-disc-line text-primary-teal"></i>
              Mixagem, Master & Áudio
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  🎧 Responsável pela Mixagem
                </label>
                <input
                  type="text"
                  value={formData.responsavel_mixagem}
                  onChange={(e) => setFormData({ ...formData, responsavel_mixagem: e.target.value })}
                  placeholder="Nome do profissional / estúdio"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  🎚️ Responsável pela Masterização
                </label>
                <input
                  type="text"
                  value={formData.responsavel_master}
                  onChange={(e) => setFormData({ ...formData, responsavel_master: e.target.value })}
                  placeholder="Nome do profissional / estúdio"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  🎛️ Direção Técnica de Áudio
                </label>
                <input
                  type="text"
                  value={formData.direcao_tecnica_audio}
                  onChange={(e) => setFormData({ ...formData, direcao_tecnica_audio: e.target.value })}
                  placeholder="Nome do diretor técnico de áudio"
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  🛠️ Produção Técnica
                </label>
                <input
                  type="text"
                  value={formData.producao_tecnica}
                  onChange={(e) => setFormData({ ...formData, producao_tecnica: e.target.value })}
                  placeholder="Nomes da equipe de produção técnica..."
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
                />
              </div>
            </div>
          </div>

          {/* Coluna B: Storymakers, Plataformas e Redes */}
          <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border space-y-3">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2 border-b border-dark-border/40 pb-2">
              <i className="ri-links-line text-primary-teal"></i>
              Storymakers, Plataformas & Redes
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  📱 Storymaker / Filmmaker
                </label>
                <input
                  type="text"
                  value={formData.storymaker_filmmaker}
                  onChange={(e) => setFormData({ ...formData, storymaker_filmmaker: e.target.value })}
                  placeholder="Nomes dos storymakers / filmmakers..."
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  🔗 Link Plataformas Digitais (Smartlink / Pre-save)
                </label>
                <input
                  type="text"
                  value={formData.link_plataformas}
                  onChange={(e) => setFormData({ ...formData, link_plataformas: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    📸 Instagram Artista
                  </label>
                  <input
                    type="text"
                    value={formData.artista_instagram}
                    onChange={(e) => setFormData({ ...formData, artista_instagram: e.target.value })}
                    placeholder="https://instagram.com/..."
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    🎵 TikTok Artista
                  </label>
                  <input
                    type="text"
                    value={formData.artista_tiktok}
                    onChange={(e) => setFormData({ ...formData, artista_tiktok: e.target.value })}
                    placeholder="https://tiktok.com/@..."
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  📘 Facebook Artista
                </label>
                <input
                  type="text"
                  value={formData.artista_facebook}
                  onChange={(e) => setFormData({ ...formData, artista_facebook: e.target.value })}
                  placeholder="https://facebook.com/..."
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Letra da Canção */}
        <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border space-y-2">
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <i className="ri-file-text-line text-primary-teal"></i>
            Letra da Canção ({faixaAtiva ? faixaAtiva.nome : projeto.nome})
          </label>
          <textarea
            value={formData.letra}
            onChange={(e) => setFormData({ ...formData, letra: e.target.value })}
            rows={5}
            placeholder="Cole a letra da música aqui..."
            className="w-full p-3 bg-dark-bg border border-dark-border rounded-lg text-white text-xs font-mono focus:outline-none focus:border-primary-teal"
          />
        </div>
      </div>

      {/* BLOCO 3: MÚSICOS INTEGRADOS DA FAIXA */}
      <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <i className="ri-team-line text-primary-teal"></i>
            3. Músicos Participantes Desta Faixa ({musicosFiltrados.length})
          </h3>
          <span className="text-[11px] text-gray-400">
            Puxados automaticamente do cadastro de participantes
          </span>
        </div>

        {musicosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {musicosFiltrados.map((part) => (
              <div
                key={part.id}
                className="p-3 bg-dark-bg border border-dark-border rounded-lg flex items-center justify-between gap-2"
              >
                <div>
                  <span className="text-[10px] font-bold text-primary-teal uppercase tracking-wider block">
                    ► {formatarPapelInstrumento(part.funcao_instrumento)}
                  </span>
                  <p className="text-xs font-bold text-white">
                    {part.autorizante_nome_artistico || part.autorizante_nome}
                  </p>
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    part.status === 'assinado'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                  }`}
                >
                  {part.status === 'assinado' ? 'Assinado' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">
            Nenhum músico cadastrado especificamente para esta faixa. Adicione participantes no card acima ou compartilhe o link de auto-cadastro.
          </p>
        )}
      </div>

      {/* BLOCO 4: BOTÃO DE AÇÃO PARA GERAR */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleGerarDescricao}
          className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xl shadow-red-600/25 active:scale-95"
        >
          <i className="ri-youtube-fill text-lg"></i>
          <span>Gerar Descrição Oficial para YouTube</span>
        </button>
      </div>

      {/* BLOCO 5: DESCRIÇÃO GERADA (APARECE APÓS CLICAR NO BOTÃO) */}
      {mostrarDescricao && (
        <div
          ref={descricaoRef}
          className="bg-dark-bg border border-red-500/30 rounded-xl p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-border pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
              <h4 className="text-sm font-bold text-white">
                Descrição Gerada para: <span className="text-red-400">{faixaAtiva ? faixaAtiva.nome : projeto.nome}</span>
              </h4>
              <span className="text-[11px] px-2 py-0.5 rounded bg-dark-card border border-dark-border text-gray-400 font-mono">
                {textoDescricao.length} caracteres
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyYouTube}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/20"
              >
                <i className={copied ? 'ri-check-line text-sm' : 'ri-file-copy-line text-sm'}></i>
                <span>{copied ? 'Copiado com Sucesso!' : 'Copiar Descrição'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-4 py-2 bg-dark-card hover:bg-dark-card/80 border border-dark-border text-gray-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <i className="ri-save-line text-sm"></i>
                <span>{saving ? 'Salvando...' : 'Salvar no Projeto'}</span>
              </button>
            </div>
          </div>

          <textarea
            value={textoDescricao}
            onChange={(e) => setTextoDescricao(e.target.value)}
            rows={18}
            className="w-full p-4 bg-dark-card border border-dark-border rounded-xl text-gray-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-red-500 transition-colors leading-relaxed resize-y"
            placeholder="A descrição do YouTube montada aparecerá aqui..."
          />

          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <span>
              💡 Você pode editar qualquer linha do texto acima antes de copiar para o YouTube Studio.
            </span>
            <button
              type="button"
              onClick={handleCopyYouTube}
              className="text-red-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <i className="ri-file-copy-line"></i>
              Copiar Texto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
