import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

export interface ProfissionalCustomItem {
  id?: string;
  papel: string;
  nome: string;
  contato?: string;
}

interface FornecedorItem {
  id: string;
  nome: string;
  tipo_servico?: string;
}

interface ProdutorItem {
  id: string;
  nome: string;
  especialidade?: string;
}

interface ProjetoEquipeData {
  id: string;
  engenheiro_audio?: string;
  diretor_video?: string;
  captacao_video?: string;
  fotografo?: string;
  maquiador_id?: string;
  maquiador_nome?: string;
  fonoaudiologo_nome?: string;
  produtor_id?: string;
  produtor_musical_geral?: string;
  local_gravacao_id?: string;
  estudio?: string;
  fornecedor_audio_id?: string;
  fornecedor_video_id?: string;
  outros_profissionais?: string[];
  outros_profissionais_custom?: ProfissionalCustomItem[];
}

interface EquipeFornecedoresManagerProps {
  projeto: ProjetoEquipeData;
  fornecedores?: FornecedorItem[];
  produtores?: ProdutorItem[];
  locais?: FornecedorItem[];
  onUpdate: () => void;
}

export default function EquipeFornecedoresManager({
  projeto,
  fornecedores = [],
  produtores = [],
  locais = [],
  onUpdate,
}: EquipeFornecedoresManagerProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  // Estados dos campos estruturados
  const [engenheiroAudio, setEngenheiroAudio] = useState(projeto.engenheiro_audio || '');
  const [diretorVideo, setDiretorVideo] = useState(projeto.diretor_video || '');
  const [captacaoVideo, setCaptacaoVideo] = useState(projeto.captacao_video || '');
  const [fotografo, setFotografo] = useState(projeto.fotografo || '');
  const [maquiadorNome, setMaquiadorNome] = useState(projeto.maquiador_nome || '');
  const [maquiadorId, setMaquiadorId] = useState(projeto.maquiador_id || '');
  const [fonoaudiologoNome, setFonoaudiologoNome] = useState(projeto.fonoaudiologo_nome || '');
  const [produtorMusical, setProdutorMusical] = useState(
    projeto.produtor_musical_geral || ''
  );
  const [produtorId, setProdutorId] = useState(projeto.produtor_id || '');
  const [localGravacaoId, setLocalGravacaoId] = useState(projeto.local_gravacao_id || '');
  const [estudio, setEstudio] = useState(projeto.estudio || '');
  const [fornecedorAudioId, setFornecedorAudioId] = useState(projeto.fornecedor_audio_id || '');
  const [fornecedorVideoId, setFornecedorVideoId] = useState(projeto.fornecedor_video_id || '');

  // Outros profissionais dinâmicos (papel + nome)
  const [outrosCustom, setOutrosCustom] = useState<ProfissionalCustomItem[]>(() => {
    if (Array.isArray(projeto.outros_profissionais_custom)) {
      return projeto.outros_profissionais_custom;
    }
    return [];
  });

  // Novo profissional a ser adicionado
  const [novoPapel, setNovoPapel] = useState('');
  const [novoNome, setNovoNome] = useState('');

  useEffect(() => {
    setEngenheiroAudio(projeto.engenheiro_audio || '');
    setDiretorVideo(projeto.diretor_video || '');
    setCaptacaoVideo(projeto.captacao_video || '');
    setFotografo(projeto.fotografo || '');
    setMaquiadorNome(projeto.maquiador_nome || '');
    setMaquiadorId(projeto.maquiador_id || '');
    setFonoaudiologoNome(projeto.fonoaudiologo_nome || '');
    setProdutorMusical(projeto.produtor_musical_geral || '');
    setProdutorId(projeto.produtor_id || '');
    setLocalGravacaoId(projeto.local_gravacao_id || '');
    setEstudio(projeto.estudio || '');
    setFornecedorAudioId(projeto.fornecedor_audio_id || '');
    setFornecedorVideoId(projeto.fornecedor_video_id || '');
    if (Array.isArray(projeto.outros_profissionais_custom)) {
      setOutrosCustom(projeto.outros_profissionais_custom);
    }
  }, [projeto]);

  const handleAddOutro = () => {
    if (!novoPapel.trim() || !novoNome.trim()) {
      showToast('Preencha a função e o nome do profissional.', 'warning');
      return;
    }

    const item: ProfissionalCustomItem = {
      id: `prof_${Date.now()}`,
      papel: novoPapel.trim(),
      nome: novoNome.trim(),
    };

    setOutrosCustom([...outrosCustom, item]);
    setNovoPapel('');
    setNovoNome('');
  };

  const handleRemoveOutro = (index: number) => {
    setOutrosCustom(outrosCustom.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const toUUID = (val?: string) => (val && val.trim() !== '' ? val.trim() : null);

      const payload = {
        engenheiro_audio: engenheiroAudio.trim() || null,
        diretor_video: diretorVideo.trim() || null,
        captacao_video: captacaoVideo.trim() || null,
        fotografo: fotografo.trim() || null,
        maquiador_nome: maquiadorNome.trim() || null,
        maquiador_id: toUUID(maquiadorId),
        fonoaudiologo_nome: fonoaudiologoNome.trim() || null,
        local_gravacao_id: toUUID(localGravacaoId),
        estudio: estudio.trim() || null,
        fornecedor_audio_id: toUUID(fornecedorAudioId),
        fornecedor_video_id: toUUID(fornecedorVideoId),
        outros_profissionais_custom: outrosCustom,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('projetos')
        .update(payload)
        .eq('id', projeto.id);

      if (error) throw error;

      showToast('Fornecedores e profissionais salvos com sucesso!', 'success');
      onUpdate();
    } catch (err: any) {
      console.error('Erro ao salvar equipe e fornecedores:', err);
      showToast('Erro ao salvar fornecedores e equipe.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Sugestões rápidas de funções para outros profissionais
  const papeisSugeridos = [
    'Fonoaudiólogo(a)',
    'Maquiador(a)',
    'Figurinista / Stylist',
    'Roadie',
    'Cenógrafo(a)',
    'Iluminador(a)',
    'Operador(a) de Câmera',
    'Assistente de Produção',
    'Segurança',
    'Catering / Alimentação',
  ];

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-6">
      {/* Header do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border/60 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-teal/10 text-primary-teal border border-primary-teal/20 text-xs font-bold uppercase tracking-wider mb-2">
            <i className="ri-team-line text-sm"></i>
            Equipe Técnica & Fornecedores
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Fornecedores e Profissionais do Projeto
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Cadastre quem vai fazer a captação de áudio, direção e captação de vídeo, maquiador, fono e outros profissionais especializados.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-primary-teal hover:bg-primary-teal/90 text-dark-bg rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <i className="ri-save-line text-sm"></i>
          <span>{saving ? 'Salvando...' : 'Salvar Fornecedores & Equipe'}</span>
        </button>
      </div>

      {/* Grade de Profissionais Estruturados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Áudio & Captação */}
        <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border space-y-3">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2 border-b border-dark-border/50 pb-2">
            <i className="ri-mic-line text-primary-teal"></i>
            Áudio & Captação
          </h3>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1">
              🎙️ Engenheiro(a) de Captação / Gravação
            </label>
            <input
              type="text"
              value={engenheiroAudio}
              onChange={(e) => setEngenheiroAudio(e.target.value)}
              placeholder="Nome do engenheiro de captação"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1">
              🏢 Estúdio / Local de Gravação
            </label>
            <input
              type="text"
              value={estudio}
              onChange={(e) => setEstudio(e.target.value)}
              placeholder="Nome do estúdio / local"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
            />
          </div>
        </div>

        {/* 2. Audiovisual & Imagem */}
        <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border space-y-3">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2 border-b border-dark-border/50 pb-2">
            <i className="ri-video-line text-primary-teal"></i>
            Vídeo & Imagem
          </h3>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1">
              🎬 Direção de Vídeo / Clipe
            </label>
            <input
              type="text"
              value={diretorVideo}
              onChange={(e) => setDiretorVideo(e.target.value)}
              placeholder="Nome do diretor / produtora"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1">
              🎥 Captação de Vídeo / Câmera
            </label>
            <input
              type="text"
              value={captacaoVideo}
              onChange={(e) => setCaptacaoVideo(e.target.value)}
              placeholder="Nome do profissional / equipe de captação"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1">
              📸 Fotógrafo(a) / Still
            </label>
            <input
              type="text"
              value={fotografo}
              onChange={(e) => setFotografo(e.target.value)}
              placeholder="Nome do fotógrafo"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
            />
          </div>
        </div>

        {/* 3. Beleza, Voz & Preparação */}
        <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border space-y-3">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2 border-b border-dark-border/50 pb-2">
            <i className="ri-palette-line text-primary-teal"></i>
            Beleza & Voz
          </h3>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1">
              💄 Maquiador(a) / Make & Hair
            </label>
            <input
              type="text"
              value={maquiadorNome}
              onChange={(e) => setMaquiadorNome(e.target.value)}
              placeholder="Nome do maquiador(a)"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 mb-1">
              🗣️ Fonoaudiólogo(a) / Fono
            </label>
            <input
              type="text"
              value={fonoaudiologoNome}
              onChange={(e) => setFonoaudiologoNome(e.target.value)}
              placeholder="Nome do fonoaudiólogo(a)"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
            />
          </div>

          {fornecedores.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                Ou vincular Fornecedor Cadastrado
              </label>
              <select
                value={maquiadorId}
                onChange={(e) => {
                  setMaquiadorId(e.target.value);
                  const found = fornecedores.find((f) => f.id === e.target.value);
                  if (found && !maquiadorNome) {
                    setMaquiadorNome(found.nome);
                  }
                }}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-gray-300 text-xs focus:outline-none focus:border-primary-teal cursor-pointer"
              >
                <option value="">Selecionar fornecedor da lista...</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome} {f.tipo_servico ? `(${f.tipo_servico})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO: OUTROS PROFISSIONAIS E FUNÇÕES CUSTOMIZADAS */}
      <div className="bg-dark-bg/80 border border-dark-border p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <i className="ri-user-add-line text-primary-teal"></i>
              Outros Profissionais & Funções Especiais
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Adicione qualquer outro profissional definindo sua função e nome (ex: Fono, Roadie, Cenógrafo, Stylist, etc.).
            </p>
          </div>
        </div>

        {/* Formulário para Adicionar Novo */}
        <div className="bg-dark-card/70 border border-dark-border/80 p-4 rounded-xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                Qual a função / papel?
              </label>
              <input
                type="text"
                value={novoPapel}
                onChange={(e) => setNovoPapel(e.target.value)}
                placeholder="Ex: Fono, Stylist, Roadie, Iluminação..."
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                Quem é a pessoa / profissional?
              </label>
              <input
                type="text"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Nome do profissional"
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddOutro}
                className="w-full px-4 py-2 bg-primary-teal hover:bg-primary-teal/90 text-dark-bg font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <i className="ri-add-line text-sm"></i>
                <span>Adicionar</span>
              </button>
            </div>
          </div>

          {/* Sugestões Rápidas de Papel */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-dark-border/40">
            <span className="text-[10px] text-gray-500 font-medium mr-1">Sugestões rápidas:</span>
            {papeisSugeridos.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setNovoPapel(sug)}
                className="text-[10px] px-2 py-0.5 bg-dark-bg border border-dark-border rounded text-gray-400 hover:text-white hover:border-primary-teal/40 transition-colors cursor-pointer"
              >
                + {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Outros Profissionais Adicionados */}
        {outrosCustom.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {outrosCustom.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3 bg-dark-card border border-dark-border rounded-lg flex items-center justify-between gap-2 group hover:border-primary-teal/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-primary-teal uppercase tracking-wider block truncate">
                    {item.papel}
                  </span>
                  <p className="text-xs font-bold text-white truncate">{item.nome}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveOutro(idx)}
                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                  title="Remover profissional"
                >
                  <i className="ri-delete-bin-line text-sm"></i>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic py-1">
            Nenhum outro profissional customizado adicionado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
