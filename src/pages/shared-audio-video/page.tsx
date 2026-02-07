import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import FileUpload from '../../components/projetos/FileUpload';
import { createStreamVideoFromUrl, getStreamIframeUrl } from '../../services/stream';

export default function SharedAudioVideoForm() {
  const toast = useToast();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [linkData, setLinkData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    tipo: '',
    formato: 'link',
    link_url: '',
    descricao: '',
    versao: '',
    nome_anexador: '',
  });
  const [uploadedFile, setUploadedFile] = useState<{ url: string; fileName: string } | null>(null);

  useEffect(() => {
    loadLinkData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadLinkData = async () => {
    if (!token) {
      setError('Token não fornecido');
      setLoading(false);
      return;
    }

    try {
      console.log('[SharedLink] Iniciando carregamento do link com token:', token);
      
      // Buscar o link compartilhável - usar array ao invés de single para evitar erro "cannot coerce"
      const { data: linkDataArray, error: fetchError } = await supabase
        .from('shared_audio_video_links')
        .select('*')
        .eq('token', token)
        .limit(1); // Limitar a 1 resultado para garantir performance

      if (fetchError) {
        console.error('[SharedLink] Erro ao buscar link:', fetchError);
        // Verificar se é o erro específico "cannot coerce"
        if (fetchError.message && fetchError.message.includes('coerce')) {
          throw new Error('Erro ao processar dados do link. Por favor, tente novamente.');
        }
        throw fetchError;
      }

      console.log('[SharedLink] Resultado da busca:', linkDataArray ? `${linkDataArray.length} resultado(s)` : 'null');

      // Verificar se encontrou exatamente um resultado
      if (!linkDataArray || linkDataArray.length === 0) {
        console.warn('[SharedLink] Nenhum link encontrado com o token fornecido');
        setError('Link não encontrado ou expirado');
        setLoading(false);
        return;
      }

      if (linkDataArray.length > 1) {
        console.warn('[SharedLink] Múltiplos links encontrados com o mesmo token, usando o primeiro');
      }

      const linkData = linkDataArray[0];
      console.log('[SharedLink] Link encontrado:', { id: linkData.id, faixa_id: linkData.faixa_id, projeto_id: linkData.projeto_id });

      if (!linkData) {
        setError('Link não encontrado');
        setLoading(false);
        return;
      }

      // Buscar dados da faixa - usar array ao invés de single
      const { data: faixaDataArray, error: faixaError } = await supabase
        .from('faixas')
        .select('id, nome, projeto_id')
        .eq('id', linkData.faixa_id)
        .limit(1);

      if (faixaError) {
        console.error('[SharedLink] Erro ao buscar faixa:', faixaError);
        if (faixaError.message && faixaError.message.includes('coerce')) {
          throw new Error('Erro ao processar dados da faixa. Por favor, tente novamente.');
        }
        throw faixaError;
      }

      if (!faixaDataArray || faixaDataArray.length === 0) {
        console.error('[SharedLink] Faixa não encontrada:', linkData.faixa_id);
        setError('Faixa não encontrada');
        setLoading(false);
        return;
      }

      const faixaData = faixaDataArray[0];
      console.log('[SharedLink] Faixa encontrada:', faixaData.nome);

      // Buscar dados do projeto - usar array ao invés de single
      const { data: projetoDataArray, error: projetoError } = await supabase
        .from('projetos')
        .select('id, nome, artista_id')
        .eq('id', linkData.projeto_id)
        .limit(1);

      if (projetoError) {
        console.error('[SharedLink] Erro ao buscar projeto:', projetoError);
        if (projetoError.message && projetoError.message.includes('coerce')) {
          throw new Error('Erro ao processar dados do projeto. Por favor, tente novamente.');
        }
        throw projetoError;
      }

      if (!projetoDataArray || projetoDataArray.length === 0) {
        console.error('[SharedLink] Projeto não encontrado:', linkData.projeto_id);
        setError('Projeto não encontrado');
        setLoading(false);
        return;
      }

      const projetoData = projetoDataArray[0];
      console.log('[SharedLink] Projeto encontrado:', projetoData.nome);

      // Buscar dados do artista - usar array ao invés de single
      let artistaData = null;
      if (projetoData.artista_id) {
        const { data: artistaArray, error: artistaError } = await supabase
          .from('artistas')
          .select('nome')
          .eq('id', projetoData.artista_id)
          .limit(1);
        
        if (artistaError) {
          console.warn('[SharedLink] Erro ao buscar artista (não crítico):', artistaError);
        } else if (artistaArray && artistaArray.length > 0) {
          artistaData = artistaArray[0];
          console.log('[SharedLink] Artista encontrado:', artistaData.nome);
        }
      }

      // Combinar todos os dados
      const data = {
        ...linkData,
        faixa: faixaData,
        projeto: projetoData,
        artista: artistaData,
      };

      if (!data) {
        setError('Link não encontrado');
        setLoading(false);
        return;
      }

      if (data.usado) {
        setError('Este link já foi utilizado');
        setLoading(false);
        return;
      }

      if (data.expira_em && new Date(data.expira_em) < new Date()) {
        setError('Este link expirou');
        setLoading(false);
        return;
      }

      setLinkData(data);
      // Se o tipo foi definido no link, pré-selecionar no formulário, mas permitir alteração
      if (data.tipo) {
        setFormData(prev => ({
          ...prev,
          tipo: data.tipo,
        }));
      } else {
        // Se não tiver tipo, garantir que o campo esteja vazio
        setFormData(prev => ({
          ...prev,
          tipo: '',
        }));
      }
    } catch (err: any) {
      console.error('[SharedLink] Erro ao carregar link:', err);
      console.error('[SharedLink] Detalhes do erro:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
      });
      
      // Tratar especificamente o erro "cannot coerce"
      if (err.message && (err.message.includes('coerce') || err.message.includes('single json object'))) {
        setError('Erro ao processar dados. Por favor, tente novamente ou entre em contato com o suporte.');
      } else if (err.code === 'PGRST116') {
        // Erro específico do PostgREST quando não encontra resultado
        setError('Link não encontrado ou expirado');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Erro ao carregar link. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkData) return;

    setSubmitting(true);
    try {
      // Validar campos obrigatórios
      // O tipo sempre deve ser escolhido no formulário (mesmo que tenha sido sugerido pelo link)
      if (!formData.tipo) {
        alert('Por favor, selecione o tipo (Áudio ou Vídeo)');
        setSubmitting(false);
        return;
      }

      if (!formData.versao) {
        alert('Por favor, selecione a classificação');
        setSubmitting(false);
        return;
      }

      if (formData.formato === 'link' && !formData.link_url) {
        alert('Por favor, informe a URL do link');
        setSubmitting(false);
        return;
      }

      if (formData.formato === 'arquivo' && !uploadedFile) {
        alert('Por favor, faça o upload do arquivo');
        setSubmitting(false);
        return;
      }

      if (!formData.nome_anexador || !formData.nome_anexador.trim()) {
        alert('Por favor, informe seu nome');
        setSubmitting(false);
        return;
      }

      // Preparar dados para salvar
      // Usar o tipo do link se existir, senão usar o tipo escolhido no formulário
      const tipoFinal = linkData?.tipo || formData.tipo;
      const dadosParaSalvar: any = {
        tipo: tipoFinal,
        formato: formData.formato,
        versao: formData.versao,
        descricao: formData.descricao || undefined,
        nome_anexador: formData.nome_anexador.trim(),
      };

      if (formData.formato === 'link') {
        dadosParaSalvar.link_url = formData.link_url;
      } else if (formData.formato === 'arquivo' && uploadedFile) {
        dadosParaSalvar.arquivo_url = uploadedFile.url;
        dadosParaSalvar.arquivo_nome = uploadedFile.fileName;
        // Para vídeo: enviar também para Cloudflare Stream para reprodução otimizada
        if (tipoFinal === 'video') {
          try {
            const result = await createStreamVideoFromUrl({
              sourceUrl: uploadedFile.url,
              name: uploadedFile.fileName,
            });
            dadosParaSalvar.stream_uid = result.uid;
            dadosParaSalvar.stream_iframe_url = getStreamIframeUrl(result.uid) || undefined;
          } catch (e: any) {
            console.warn('Stream não disponível, vídeo será reproduzido direto:', e?.message);
            toast?.info('Vídeo salvo; a reprodução pode usar transmissão otimizada depois.');
          }
        }
      }

      // Salvar na tabela faixa_audio_video
      const { error: saveError } = await supabase
        .from('faixa_audio_video')
        .insert({
          faixa_id: linkData.faixa_id,
          ...dadosParaSalvar,
        });

      if (saveError) throw saveError;

      // Marcar link como usado
      const { error: updateError } = await supabase
        .from('shared_audio_video_links')
        .update({
          usado: true,
          usado_em: new Date().toISOString(),
          dados_preenchidos: dadosParaSalvar,
        })
        .eq('id', linkData.id);

      if (updateError) throw updateError;

      // Marcar como sucesso e não redirecionar
      setSuccess(true);
    } catch (err: any) {
      console.error('Erro ao enviar formulário:', err);
      alert(`Erro ao enviar formulário: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin mb-4"></i>
          <p className="text-white">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="bg-dark-card border border-green-500/50 rounded-xl p-8 max-w-md w-full text-center">
          <i className="ri-checkbox-circle-line text-6xl text-green-500 mb-4"></i>
          <h1 className="text-2xl font-bold text-white mb-2">Formulário enviado com sucesso!</h1>
          <p className="text-gray-400 mb-6">
            Seus dados foram salvos com sucesso. Obrigado!
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="bg-dark-card border border-red-500/50 rounded-xl p-8 max-w-md w-full text-center">
          <i className="ri-error-warning-line text-6xl text-red-500 mb-4"></i>
          <h1 className="text-2xl font-bold text-white mb-2">Erro</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const faixa = linkData?.faixa;
  const projeto = linkData?.projeto;
  const artista = linkData?.artista;

  return (
    <div className="min-h-screen bg-dark-bg py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Adicionar {linkData?.tipo === 'audio' ? 'Áudio' : linkData?.tipo === 'video' ? 'Vídeo' : 'Áudio/Vídeo'}
          </h1>
          <p className="text-gray-400">
            {artista?.nome && `${artista.nome} - `}
            {projeto?.nome && `${projeto.nome} - `}
            {faixa?.nome && `Faixa: ${faixa.nome}`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Formato</label>
            <select
              value={formData.formato}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, formato: e.target.value as 'link' | 'arquivo', tipo: prev.tipo }));
                setUploadedFile(null);
              }}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
            >
              <option value="link">Link</option>
              <option value="arquivo">Arquivo</option>
            </select>
          </div>

          {formData.formato === 'link' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Tipo *</label>
                <select
                  value={formData.tipo || linkData?.tipo || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="audio">Áudio</option>
                  <option value="video">Vídeo</option>
                </select>
                {linkData?.tipo && (
                  <p className="text-xs text-gray-500 mt-1">
                    <i className="ri-information-line"></i> Tipo sugerido: {linkData.tipo === 'audio' ? 'Áudio' : 'Vídeo'} (você pode alterar se necessário)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">URL do Link *</label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  placeholder="https://..."
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Tipo *</label>
                <select
                  value={formData.tipo || linkData?.tipo || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, tipo: e.target.value }));
                    setUploadedFile(null);
                  }}
                  required
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="audio">Áudio</option>
                  <option value="video">Vídeo</option>
                </select>
                {linkData?.tipo && (
                  <p className="text-xs text-gray-500 mt-1">
                    <i className="ri-information-line"></i> Tipo sugerido: {linkData.tipo === 'audio' ? 'Áudio' : 'Vídeo'} (você pode alterar se necessário)
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Selecione se é um arquivo de áudio ou vídeo
                </p>
              </div>
              {formData.tipo && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo *</label>
                  <FileUpload
                    bucket="faixas-audio-video"
                    folder={`faixa-${linkData?.faixa_id}`}
                    onUploadComplete={(url, fileName) => {
                      setUploadedFile({ url, fileName });
                    }}
                    onError={(error) => toast.error(`Erro: ${error}`)}
                    accept={formData.tipo === 'audio' ? 'audio/*' : formData.tipo === 'video' ? 'video/*' : 'audio/*,video/*'}
                    label="Selecionar arquivo"
                  />
                  {uploadedFile && (
                    <p className="text-sm text-green-400 mt-2">
                      <i className="ri-check-line"></i> Arquivo enviado: {uploadedFile.fileName}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Classificação *</label>
            <select
              value={formData.versao}
              onChange={(e) => setFormData(prev => ({ ...prev, versao: e.target.value }))}
              required
              disabled={!formData.tipo}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{formData.tipo ? 'Selecione a classificação' : 'Selecione o tipo primeiro'}</option>
              {formData.tipo === 'audio' ? (
                <>
                  <option value="pre-producao">Pré-Produção</option>
                  <option value="pos-gravacao">Pós-Gravação</option>
                  <option value="masterizado">Masterizado</option>
                </>
              ) : formData.tipo === 'video' ? (
                <>
                  <option value="pre-producao">Pré-Produção</option>
                  <option value="pos-producao">Pós-Produção</option>
                  <option value="mixagem">Mixagem</option>
                  <option value="masterizado">Masterizado</option>
                </>
              ) : null}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.tipo === 'audio' 
                ? 'Pré-Produção: Antes da gravação | Pós-Gravação: Depois da gravação | Masterizado: Versão final'
                : formData.tipo === 'video'
                ? 'Pré-Produção: Antes da gravação | Pós-Produção: Depois da gravação | Mixagem/Masterizado: Depois da pós'
                : 'Selecione o tipo primeiro para ver as opções de classificação'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Seu Nome <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.nome_anexador}
              onChange={(e) => setFormData(prev => ({ ...prev, nome_anexador: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              placeholder="Digite seu nome completo"
            />
            <p className="text-xs text-gray-500 mt-1">
              <i className="ri-information-line"></i> Informe seu nome para identificarmos quem anexou este áudio/vídeo
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Descrição (opcional)</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
              rows={3}
              placeholder="Descrição opcional..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin inline-block mr-2"></i>
                  Enviando...
                </>
              ) : (
                'Enviar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

