/**
 * Serviço YouTube com conta compartilhada da CEU Music
 * Todos os uploads são feitos usando a conta da CEU Music
 * Os tokens são armazenados no Supabase de forma segura
 */

import { supabase } from '../lib/supabase';

// ⚠️ FUNCIONALIDADE DESATIVADA
const YOUTUBE_UPLOAD_DISABLED = true;

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_YOUTUBE_CLIENT_SECRET;

export interface YouTubeUploadOptions {
  title: string;
  description?: string;
  tags?: string[];
  privacyStatus?: 'private' | 'unlisted' | 'public';
  categoryId?: string;
  videoFile: File | Blob;
}

export interface YouTubeUploadResult {
  videoId: string;
  url: string;
}

interface YouTubeTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  token_type?: string;
  scope?: string;
}

/**
 * Obtém tokens da conta CEU Music do Supabase
 */
async function getYouTubeTokens(): Promise<YouTubeTokens | null> {
  try {
    const { data, error } = await supabase
      .from('youtube_tokens')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Erro ao buscar tokens do YouTube:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar tokens:', error);
    return null;
  }
}

/**
 * Salva tokens da conta CEU Music no Supabase
 */
async function saveYouTubeTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  scope?: string;
}): Promise<void> {
  try {
    const expiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString(); // Default: 1 hora

    const { error } = await supabase
      .from('youtube_tokens')
      .upsert({
        id: '00000000-0000-0000-0000-000000000000', // ID fixo para garantir único registro
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: expiresAt,
        token_type: 'Bearer',
        scope: tokens.scope || 'https://www.googleapis.com/auth/youtube.upload',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.error('Erro ao salvar tokens:', error);
      throw new Error('Falha ao salvar tokens do YouTube');
    }
  } catch (error: any) {
    console.error('Erro ao salvar tokens:', error);
    throw new Error(error.message || 'Falha ao salvar tokens do YouTube');
  }
}

/**
 * Renova o access token usando o refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<string> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID || '',
        client_secret: CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.error || 'Falha ao renovar token');
    }

    const data = await response.json();

    if (!data.access_token) {
      throw new Error('Falha ao renovar token de acesso');
    }

    // Salvar novo token no Supabase
    await saveYouTubeTokens({
      accessToken: data.access_token,
      refreshToken: refreshToken, // Refresh token não muda
      expiresIn: data.expires_in,
      scope: data.scope,
    });

    return data.access_token;
  } catch (error: any) {
    console.error('Erro ao renovar token:', error);
    throw new Error(error.message || 'Erro ao renovar token de acesso');
  }
}

/**
 * Obtém um access token válido (renova se necessário)
 */
async function getValidAccessToken(): Promise<string> {
  const tokens = await getYouTubeTokens();

  if (!tokens) {
    throw new Error('Conta YouTube da CEU Music não está configurada. Um administrador precisa fazer a autenticação inicial.');
  }

  // Verificar se o token expirou (com margem de 5 minutos)
  const expiresAt = new Date(tokens.expires_at);
  const now = new Date();
  const margin = 5 * 60 * 1000; // 5 minutos

  if (expiresAt.getTime() - now.getTime() < margin) {
    // Token expirado ou próximo de expirar, renovar
    console.log('Token expirado, renovando...');
    return await refreshAccessToken(tokens.refresh_token);
  }

  return tokens.access_token;
}

/**
 * Verifica se a conta YouTube da CEU Music está configurada
 */
export async function isYouTubeConfigured(): Promise<boolean> {
  const tokens = await getYouTubeTokens();
  return !!tokens;
}

/**
 * Faz upload de um vídeo para o YouTube usando a conta da CEU Music
 */
export async function uploadVideoToYouTube(
  options: YouTubeUploadOptions,
  onProgress?: (progress: number) => void
): Promise<YouTubeUploadResult> {
  // ⚠️ FUNCIONALIDADE DESATIVADA
  if (YOUTUBE_UPLOAD_DISABLED) {
    throw new Error('Upload para YouTube está temporariamente desativado. O código foi preservado e pode ser reativado no futuro.');
  }

  // Obter token válido da conta CEU Music
  const accessToken = await getValidAccessToken();

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
      
      // Se o token expirou durante o upload, tentar renovar e refazer
      if (initResponse.status === 401) {
        console.log('Token expirado durante upload, renovando...');
        const newToken = await getValidAccessToken();
        
        // Refazer a requisição com novo token
        const retryResponse = await fetch(
          `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
              'X-Upload-Content-Type': options.videoFile.type || 'video/*',
              'X-Upload-Content-Length': options.videoFile.size.toString(),
            },
            body: JSON.stringify(videoMetadata),
          }
        );

        if (!retryResponse.ok) {
          const retryError = await retryResponse.json();
          throw new Error(retryError.error?.message || 'Falha ao iniciar upload do vídeo');
        }

        const uploadUrl = retryResponse.headers.get('Location');
        if (!uploadUrl) {
          throw new Error('Falha ao obter URL de upload');
        }

        return await uploadVideoFile(uploadUrl, options.videoFile, onProgress);
      }
      
      throw new Error(error.error?.message || 'Falha ao iniciar upload do vídeo');
    }

    // Obter URL de upload do header Location
    const uploadUrl = initResponse.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('Falha ao obter URL de upload');
    }

    // Etapa 2: Fazer upload do vídeo
    return await uploadVideoFile(uploadUrl, options.videoFile, onProgress);
  } catch (error: any) {
    console.error('Erro ao fazer upload para YouTube:', error);
    throw new Error(error.message || 'Erro ao fazer upload do vídeo para o YouTube');
  }
}

/**
 * Faz upload do arquivo de vídeo
 */
async function uploadVideoFile(
  uploadUrl: string,
  videoFile: File | Blob,
  onProgress?: (progress: number) => void
): Promise<YouTubeUploadResult> {
  const fileSize = videoFile.size;
  const chunkSize = 256 * 1024; // 256KB por chunk
  const file = videoFile instanceof File ? videoFile : new File([videoFile], 'video.mp4', { type: videoFile.type });

  // Para arquivos pequenos (menos que 1 chunk), fazer upload direto
  if (fileSize <= chunkSize) {
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': videoFile.type || 'video/*',
        'Content-Length': fileSize.toString(),
      },
      body: videoFile,
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
        'Content-Type': videoFile.type || 'video/*',
        'Content-Length': (end - uploadedBytes).toString(),
        'Content-Range': `bytes ${uploadedBytes}-${end - 1}/${fileSize}`,
      },
      body: chunk,
    });

    if (uploadResponse.status === 308) {
      // Upload parcial bem-sucedido, continuar
      const rangeHeader = uploadResponse.headers.get('Range');
      if (rangeHeader) {
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
}

/**
 * Gera URL de autenticação OAuth 2.0 do YouTube para configurar a conta CEU Music
 */
export function getYouTubeAuthUrl(): string {
  // ⚠️ FUNCIONALIDADE DESATIVADA
  if (YOUTUBE_UPLOAD_DISABLED) {
    throw new Error('Upload para YouTube está temporariamente desativado. O código foi preservado e pode ser reativado no futuro.');
  }

  if (!CLIENT_ID || CLIENT_ID.trim() === '') {
    throw new Error('Client ID não configurado. Verifique VITE_GOOGLE_CLIENT_ID no arquivo .env.local');
  }

  const scopes = ['https://www.googleapis.com/auth/youtube.upload'];
  const redirectUri = import.meta.env.VITE_YOUTUBE_REDIRECT_URI || `${window.location.origin}/youtube-callback`;
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline', // Importante: obter refresh token
    prompt: 'consent', // Forçar consentimento para obter refresh token
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Obtém token de acesso a partir do código de autorização e salva no Supabase
 */
export async function getAccessTokenFromCode(code: string): Promise<void> {
  // ⚠️ FUNCIONALIDADE DESATIVADA
  if (YOUTUBE_UPLOAD_DISABLED) {
    throw new Error('Upload para YouTube está temporariamente desativado. O código foi preservado e pode ser reativado no futuro.');
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Client ID ou Client Secret não configurados');
  }

  const redirectUri = import.meta.env.VITE_YOUTUBE_REDIRECT_URI || `${window.location.origin}/youtube-callback`;

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: redirectUri,
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

    if (!data.refresh_token) {
      throw new Error('Refresh token não foi fornecido. Certifique-se de usar access_type=offline e prompt=consent');
    }

    // Salvar tokens no Supabase (conta compartilhada)
    await saveYouTubeTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    });
  } catch (error: any) {
    console.error('Erro ao obter token:', error);
    throw new Error(error.message || 'Erro ao autenticar com YouTube');
  }
}
