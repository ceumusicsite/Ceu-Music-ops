const CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_YOUTUBE_REDIRECT_URI || `${window.location.origin}/youtube-callback`;

export interface YouTubeUploadOptions {
  title: string;
  description?: string;
  tags?: string[];
  privacyStatus?: 'private' | 'unlisted' | 'public';
  categoryId?: string; // '10' para música
  videoFile: File | Blob;
}

/**
 * Gera URL de autenticação OAuth 2.0 do YouTube
 */
export function getYouTubeAuthUrl(): string {
  const scopes = ['https://www.googleapis.com/auth/youtube.upload'];
  const params = new URLSearchParams({
    client_id: CLIENT_ID || '',
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Obtém token de acesso a partir do código de autorização
 */
export async function getAccessTokenFromCode(code: string): Promise<{ accessToken: string; refreshToken?: string }> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID || '',
        client_secret: CLIENT_SECRET || '',
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.error || 'Falha ao obter token de acesso');
    }

    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('Falha ao obter token de acesso');
    }
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  } catch (error: any) {
    console.error('Erro ao obter token:', error);
    throw new Error(error.message || 'Erro ao autenticar com YouTube');
  }
}

/**
 * Faz upload de um vídeo para o YouTube usando a API REST (método resumable)
 */
export async function uploadVideoToYouTube(
  accessToken: string,
  options: YouTubeUploadOptions,
  onProgress?: (progress: number) => void
): Promise<{ videoId: string; url: string }> {
  if (!accessToken) {
    throw new Error('Token de acesso não fornecido');
  }

  // Preparar metadados do vídeo
  const videoMetadata = {
    snippet: {
      title: options.title,
      description: options.description || '',
      tags: options.tags || [],
      categoryId: options.categoryId || '10', // 10 = Música
    },
    status: {
      privacyStatus: options.privacyStatus || 'private',
    },
  };

  try {
    // Etapa 1: Iniciar upload resumable e obter URL de upload
    const initResponse = await fetch(
      `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': options.videoFile.type || 'video/*',
          'X-Upload-Content-Length': options.videoFile.size.toString(),
        },
        body: JSON.stringify(videoMetadata),
      }
    );

    if (!initResponse.ok) {
      const error = await initResponse.json();
      throw new Error(error.error?.message || 'Falha ao iniciar upload do vídeo');
    }

    // Obter URL de upload do header Location
    const uploadUrl = initResponse.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('Falha ao obter URL de upload');
    }

    // Etapa 2: Fazer upload do vídeo
    const fileSize = options.videoFile.size;
    const chunkSize = 256 * 1024; // 256KB por chunk
    const file = options.videoFile instanceof File ? options.videoFile : new File([options.videoFile], 'video.mp4', { type: options.videoFile.type });
    
    // Para arquivos pequenos (menos que 1 chunk), fazer upload direto
    if (fileSize <= chunkSize) {
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': options.videoFile.type || 'video/*',
          'Content-Length': fileSize.toString(),
        },
        body: options.videoFile,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: { message: 'Falha ao fazer upload do vídeo' } };
        }
        throw new Error(error.error?.message || 'Falha ao fazer upload do vídeo');
      }

      const data = await uploadResponse.json();
      const videoId = data.id;
      
      if (!videoId) {
        throw new Error('Falha ao fazer upload do vídeo');
      }

      if (onProgress) {
        onProgress(100);
      }

      return {
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    }

    // Para arquivos grandes, fazer upload em chunks
    let uploadedBytes = 0;
    
    while (uploadedBytes < fileSize) {
      const end = Math.min(uploadedBytes + chunkSize, fileSize);
      const chunk = file.slice(uploadedBytes, end);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': options.videoFile.type || 'video/*',
          'Content-Length': (end - uploadedBytes).toString(),
          'Content-Range': `bytes ${uploadedBytes}-${end - 1}/${fileSize}`,
        },
        body: chunk,
      });

      if (uploadResponse.status === 308) {
        // Upload parcial bem-sucedido, continuar
        const rangeHeader = uploadResponse.headers.get('Range');
        if (rangeHeader) {
          // Range header format: "bytes=0-123456"
          const match = rangeHeader.match(/bytes=0-(\d+)/);
          if (match) {
            uploadedBytes = parseInt(match[1]) + 1;
          } else {
            uploadedBytes = end;
          }
        } else {
          uploadedBytes = end;
        }
      } else if (uploadResponse.ok) {
        // Upload completo
        const data = await uploadResponse.json();
        const videoId = data.id;
        
        if (!videoId) {
          throw new Error('Falha ao fazer upload do vídeo');
        }

        if (onProgress) {
          onProgress(100);
        }

        return {
          videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      } else {
        const errorText = await uploadResponse.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: { message: 'Falha ao fazer upload do vídeo' } };
        }
        throw new Error(error.error?.message || 'Falha ao fazer upload do vídeo');
      }

      if (onProgress) {
        onProgress(Math.min((uploadedBytes / fileSize) * 100, 99));
      }
    }

    throw new Error('Upload não foi concluído');
  } catch (error: any) {
    console.error('Erro ao fazer upload para YouTube:', error);
    throw new Error(error.message || 'Erro ao fazer upload do vídeo para o YouTube');
  }
}

/**
 * Verifica se o usuário está autenticado
 */
export function isYouTubeAuthenticated(): boolean {
  return !!localStorage.getItem('youtube_access_token');
}

/**
 * Obtém o token de acesso salvo
 */
export function getYouTubeAccessToken(): string | null {
  return localStorage.getItem('youtube_access_token');
}

/**
 * Salva o token de acesso
 */
export function saveYouTubeAccessToken(token: string, refreshToken?: string): void {
  localStorage.setItem('youtube_access_token', token);
  if (refreshToken) {
    localStorage.setItem('youtube_refresh_token', refreshToken);
  }
}

/**
 * Remove tokens salvos
 */
export function clearYouTubeTokens(): void {
  localStorage.removeItem('youtube_access_token');
  localStorage.removeItem('youtube_refresh_token');
}
