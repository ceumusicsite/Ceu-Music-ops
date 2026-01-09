import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';
import { fornecedoresMock } from '../../data/fornecedores-mock';
import { produtoresMock } from '../../data/produtores-mock';
import FileUpload from '../../components/projetos/FileUpload';

interface FaixaForm {
  nome: string;
  status: 'pendente' | 'gravada' | 'em_mixagem' | 'masterizacao' | 'finalizada' | 'lancada';
  o_que_falta_gravar: string;
  referencias: Array<{ tipo: 'youtube_url' | 'arquivo'; url?: string; arquivo_url?: string; arquivo_nome?: string; titulo: string; descricao?: string }>;
  anexos: Array<{ tipo: 'pre' | 'outro'; arquivo_url: string; arquivo_nome: string; descricao?: string }>;
}

export default function NovoProjeto() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [artistas, setArtistas] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState(fornecedoresMock);
  const [produtores, setProdutores] = useState(produtoresMock);
  
  // Seção 1: Informações Básicas
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    artista_id: '',
    fase: 'planejamento',
    prioridade: 'media',
    prazo: ''
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

  // Seção 3: Faixas
  const [faixas, setFaixas] = useState<FaixaForm[]>([]);
  const [showFaixaModal, setShowFaixaModal] = useState(false);
  const [editingFaixaIndex, setEditingFaixaIndex] = useState<number | null>(null);
  const [faixaFormData, setFaixaFormData] = useState<FaixaForm>({
    nome: '',
    status: 'pendente' as FaixaForm['status'],
    o_que_falta_gravar: '',
    referencias: [],
    anexos: []
  });

  // Seção 4: Referências do Projeto
  const [referenciasProjeto, setReferenciasProjeto] = useState<Array<{ tipo: 'youtube_url' | 'arquivo'; url?: string; arquivo_url?: string; arquivo_nome?: string; titulo: string; descricao?: string }>>([]);
  const [showReferenciaModal, setShowReferenciaModal] = useState(false);

  // Seção 5: Anexos do Projeto
  const [anexosProjeto, setAnexosProjeto] = useState<Array<{ tipo: 'pre' | 'outro'; arquivo_url: string; arquivo_nome: string; descricao?: string }>>([]);
  const [showAnexoModal, setShowAnexoModal] = useState(false);
  const [anexoTipo, setAnexoTipo] = useState<'pre' | 'outro'>('pre');
  const [anexoDescricao, setAnexoDescricao] = useState('');

  useEffect(() => {
    loadArtistas();
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

  const handleAddFaixa = () => {
    setFaixaFormData({
      nome: '',
      status: 'pendente',
      o_que_falta_gravar: '',
      referencias: [],
      anexos: []
    });
    setEditingFaixaIndex(null);
    setShowFaixaModal(true);
  };

  const handleEditFaixa = (index: number) => {
    setFaixaFormData(faixas[index]);
    setEditingFaixaIndex(index);
    setShowFaixaModal(true);
  };

  const handleSaveFaixa = () => {
    if (!faixaFormData.nome.trim()) {
      alert('Por favor, preencha o nome da faixa.');
      return;
    }

    if (editingFaixaIndex !== null) {
      const newFaixas = [...faixas];
      newFaixas[editingFaixaIndex] = { ...faixaFormData };
      setFaixas(newFaixas);
    } else {
      setFaixas([...faixas, { ...faixaFormData }]);
    }

    setShowFaixaModal(false);
    setEditingFaixaIndex(null);
    setFaixaFormData({
      nome: '',
      status: 'pendente' as FaixaForm['status'],
      o_que_falta_gravar: '',
      referencias: [],
      anexos: []
    });
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

      // Criar projeto
      const dadosProjeto: any = {
        nome: formData.nome.trim(),
        titulo: formData.nome.trim(),
        tipo: formData.tipo,
        artista_id: formData.artista_id,
        fase: formData.fase,
        prioridade: formData.prioridade,
        fornecedor_audio_id: fornecedoresData.fornecedor_audio_id || null,
        fornecedor_video_id: fornecedoresData.fornecedor_video_id || null,
        local_gravacao_id: fornecedoresData.local_gravacao_id || null,
        produtor_id: fornecedoresData.produtor_id || null,
        maquiador_id: fornecedoresData.maquiador_id || null,
        outros_profissionais: fornecedoresData.outros_profissionais.length > 0 ? fornecedoresData.outros_profissionais : null,
      };

      if (formData.prazo) {
        dadosProjeto.previsao_lancamento = formData.prazo;
      }

      const { data: projetoData, error: projetoError } = await supabase
        .from('projetos')
        .insert([dadosProjeto])
        .select()
        .single();

      if (projetoError) throw projetoError;

      const projetoId = projetoData.id;

      // Criar faixas
      for (let i = 0; i < faixas.length; i++) {
        const faixa = faixas[i];
        const { data: faixaData, error: faixaError } = await supabase
          .from('faixas')
          .insert([{
            projeto_id: projetoId,
            nome: faixa.nome,
            status: faixa.status,
            o_que_falta_gravar: faixa.o_que_falta_gravar || null,
            ordem: i + 1
          }])
          .select()
          .single();

        if (faixaError) throw faixaError;
        const faixaId = faixaData.id;

        // Criar referências da faixa
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

        // Criar anexos da faixa
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
      alert(`Erro ao criar projeto: ${error.message || 'Tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  const fornecedoresAudio = fornecedores.filter(f => f.categoria === 'estudio' || f.tipo_servico.toLowerCase().includes('áudio') || f.tipo_servico.toLowerCase().includes('audio'));
  const fornecedoresVideo = fornecedores.filter(f => f.tipo_servico.toLowerCase().includes('vídeo') || f.tipo_servico.toLowerCase().includes('video') || f.tipo_servico.toLowerCase().includes('videoclipe'));
  const locaisGravacao = fornecedores.filter(f => f.categoria === 'estudio');

  return (
    <MainLayout>
      <div className="p-8">
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
                  <option value="">Selecione um fornecedor</option>
                  {fornecedoresAudio.map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>
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
                  <option value="">Selecione um fornecedor</option>
                  {fornecedoresVideo.map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>
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
                  <option value="">Selecione um local</option>
                  {locaisGravacao.map((local) => (
                    <option key={local.id} value={local.id}>{local.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Produtor</label>
                <select
                  value={fornecedoresData.produtor_id}
                  onChange={(e) => setFornecedoresData({ ...fornecedoresData, produtor_id: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                >
                  <option value="">Selecione um produtor</option>
                  {produtores.map((produtor) => (
                    <option key={produtor.id} value={produtor.id}>{produtor.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Maquiador</label>
                <select
                  value={fornecedoresData.maquiador_id}
                  onChange={(e) => setFornecedoresData({ ...fornecedoresData, maquiador_id: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                >
                  <option value="">Selecione um maquiador</option>
                  {fornecedores.filter(f => f.tipo_servico.toLowerCase().includes('maquiagem') || f.tipo_servico.toLowerCase().includes('makeup')).map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>
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
                        <h3 className="text-sm font-medium text-white">{index + 1}. {faixa.nome}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs ${
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
                          {faixa.referencias.length > 0 && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                              {faixa.referencias.length} referência(s)
                            </span>
                          )}
                          {faixa.anexos.length > 0 && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                              {faixa.anexos.length} anexo(s)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditFaixa(index)}
                          className="p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer"
                        >
                          <i className="ri-edit-line text-gray-400 hover:text-primary-teal"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFaixa(index)}
                          className="p-2 hover:bg-dark-hover rounded-lg transition-smooth cursor-pointer"
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
        {showFaixaModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {editingFaixaIndex !== null ? 'Editar Faixa' : 'Nova Faixa'}
                </h2>
                <button
                  onClick={() => {
                    setShowFaixaModal(false);
                    setEditingFaixaIndex(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Nome da Faixa *</label>
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
                    onChange={(e) => setFaixaFormData({ ...faixaFormData, status: e.target.value as FaixaForm['status'] })}
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
                      setEditingFaixaIndex(null);
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFaixa}
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    {editingFaixaIndex !== null ? 'Salvar Alterações' : 'Adicionar Faixa'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    onError={(error) => alert(`Erro: ${error}`)}
                    accept="*/*"
                    maxSizeMB={100}
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
                    onError={(error) => alert(`Erro: ${error}`)}
                    accept="*/*"
                    maxSizeMB={100}
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
      </div>
    </MainLayout>
  );
}
