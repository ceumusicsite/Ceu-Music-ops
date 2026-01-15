import { useState, useEffect } from 'react';
import { uploadVideoToYouTube, getYouTubeAuthUrl, isYouTubeAuthenticated, getYouTubeAccessToken, saveYouTubeAccessToken } from '../../services/youtube';

interface YouTubeUploadProps {
  onUploadComplete: (videoUrl: string, videoId: string) => void;
  onError?: (error: string) => void;
  projetoNome?: string;
  artistaNome?: string;
  onCancel?: () => void;
}

export default function YouTubeUpload({
  onUploadComplete,
  onError,
  projetoNome,
  artistaNome,
  onCancel,
}: YouTubeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacyStatus, setPrivacyStatus] = useState<'private' | 'unlisted' | 'public'>('private');
  const [authenticated, setAuthenticated] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    setAuthenticated(isYouTubeAuthenticated());
    
    // Preencher título automaticamente se vazio
    if (!title && projetoNome) {
      setTitle(projetoNome);
    }
  }, [projetoNome, title]);

  const handleAuthenticate = () => {
    const authUrl = getYouTubeAuthUrl();
    // Salvar URL de retorno para depois da autenticação
    sessionStorage.setItem('youtube_upload_return', 'true');
    window.location.href = authUrl;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (máximo 2GB para YouTube)
      const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
      if (file.size > maxSize) {
        onError?.('Arquivo muito grande. Máximo: 2GB');
        return;
      }
      
      // Validar tipo
      if (!file.type.startsWith('video/')) {
        onError?.('Por favor, selecione um arquivo de vídeo');
        return;
      }
      
      setSelectedFile(file);
      
      // Preencher título automaticamente se vazio
      if (!title && projetoNome) {
        setTitle(projetoNome);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      onError?.('Por favor, selecione um arquivo e informe o título');
      return;
    }

    const accessToken = getYouTubeAccessToken();
    if (!accessToken) {
      onError?.('Autenticação necessária. Por favor, autentique-se primeiro.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const result = await uploadVideoToYouTube(
        accessToken,
        {
          title,
          description: description || undefined,
          privacyStatus,
          categoryId: '10', // Música
          videoFile: selectedFile,
        },
        (progress) => {
          setUploadProgress(progress);
        }
      );

      setUploadProgress(100);

      onUploadComplete(result.url, result.videoId);
      
      // Limpar formulário
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      onError?.(error.message || 'Erro ao fazer upload do vídeo');
    } finally {
      setUploading(false);
    }
  };

  // Verificar se voltou da autenticação
  useEffect(() => {
    const returnedFromAuth = sessionStorage.getItem('youtube_upload_return');
    if (returnedFromAuth) {
      sessionStorage.removeItem('youtube_upload_return');
      setAuthenticated(isYouTubeAuthenticated());
    }
  }, []);

  return (
    <div className="space-y-4">
      {!authenticated ? (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-3 mb-3">
            <i className="ri-youtube-line text-2xl text-red-400"></i>
            <div>
              <p className="text-sm font-medium text-yellow-400 mb-1">
                Autenticação necessária
              </p>
              <p className="text-xs text-gray-400">
                Você precisa autenticar com sua conta do YouTube para fazer upload de vídeos.
              </p>
            </div>
          </div>
          <button
            onClick={handleAuthenticate}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-smooth flex items-center justify-center gap-2"
          >
            <i className="ri-youtube-line"></i>
            Autenticar com YouTube
          </button>
        </div>
      ) : (
        <>
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400 flex items-center gap-2">
              <i className="ri-checkbox-circle-line"></i>
              Autenticado com YouTube
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Selecionar Vídeo *
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
              disabled={uploading}
            />
            {selectedFile && (
              <div className="mt-2 p-2 bg-dark-bg rounded-lg">
                <p className="text-xs text-gray-400">
                  <i className="ri-file-video-line mr-1"></i>
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do vídeo"
              maxLength={100}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              disabled={uploading}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do vídeo..."
              rows={4}
              maxLength={5000}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
              disabled={uploading}
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/5000 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Privacidade
            </label>
            <select
              value={privacyStatus}
              onChange={(e) => setPrivacyStatus(e.target.value as any)}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
              disabled={uploading}
            >
              <option value="private">Privado (apenas você pode ver)</option>
              <option value="unlisted">Não listado (quem tem o link pode ver)</option>
              <option value="public">Público (todos podem ver)</option>
            </select>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Fazendo upload...</span>
                <span className="text-gray-400">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-dark-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                Isso pode levar alguns minutos dependendo do tamanho do vídeo...
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                disabled={uploading}
                className="flex-1 px-4 py-3 bg-dark-bg border border-dark-border text-white rounded-lg hover:bg-dark-hover transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !title.trim() || uploading}
              className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Fazendo upload...
                </>
              ) : (
                <>
                  <i className="ri-upload-cloud-line"></i>
                  Fazer Upload para YouTube
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
