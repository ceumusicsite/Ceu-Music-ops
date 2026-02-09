import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configuração do R2
const accountId = import.meta.env.VITE_R2_ACCOUNT_ID;
const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID;
const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
const endpoint = import.meta.env.VITE_R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;
// URL pública opcional - se não definida, sempre usará signed URLs
const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL;

// Buckets padrão
export const R2_BUCKETS = {
  DOCUMENTOS: import.meta.env.VITE_R2_BUCKET_DOCUMENTOS || 'ceu-music-documentos',
  ANEXOS: import.meta.env.VITE_R2_BUCKET_ANEXOS || 'ceu-music-anexos',
  COMPROVANTES: import.meta.env.VITE_R2_BUCKET_COMPROVANTES || 'ceu-music-comprovantes',
  AUDIO: import.meta.env.VITE_R2_BUCKET_AUDIO || 'audio',
};

// Cliente S3 configurado para R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});

export interface UploadOptions {
  bucket?: string;
  folder?: string;
  contentType?: string;
  makePublic?: boolean;
  customFileName?: string; // Nome customizado para o arquivo (sem extensão, será adicionada automaticamente)
  /** Callback chamado com o progresso do upload (0-100) */
  onProgress?: (percent: number) => void;
}

export interface UploadResult {
  url: string;
  key: string;
  publicUrl?: string;
}

/**
 * Faz upload para o R2 usando presigned URL com XMLHttpRequest (para suportar barra de progresso)
 */
async function uploadViaPresignedUrl(
  arrayBuffer: ArrayBuffer,
  bucket: string,
  key: string,
  contentType: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  const presignedUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 300 });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const total = arrayBuffer.byteLength;

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && total > 0) {
        const percent = Math.round((e.loaded / total) * 100);
        onProgress?.(Math.min(percent, 99));
      }
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`Upload falhou: ${xhr.status} ${xhr.statusText}`));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Upload falhou: erro de rede')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelado')));

    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(arrayBuffer);
  });
}

/**
 * Faz upload de um arquivo para o Cloudflare R2
 */
export async function uploadToR2(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Configuração do R2 não encontrada. Verifique as variáveis de ambiente.');
  }

  const bucket = options.bucket || R2_BUCKETS.ANEXOS;
  
  // Gerar nome único para o arquivo
  const fileExt = file.name.split('.').pop();
  let key: string;
  
  if (options.customFileName) {
    // Usar nome customizado se fornecido
    const sanitizedCustomName = options.customFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    key = options.folder 
      ? `${options.folder}/${sanitizedCustomName}.${fileExt}`
      : `${sanitizedCustomName}.${fileExt}`;
  } else {
    // Gerar nome único com timestamp
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    key = options.folder 
      ? `${options.folder}/${timestamp}_${sanitizedName}`
      : `${timestamp}_${sanitizedName}`;
  }

  const contentType = options.contentType || file.type || 'application/octet-stream';

  // Ler o arquivo UMA VEZ só. Segunda leitura do mesmo File pode falhar com
  // "permission problems" (ex.: Windows, OneDrive). Fallback: slice() às vezes evita o bloqueio.
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch (e1: any) {
    try {
      arrayBuffer = await file.slice(0, file.size, file.type || undefined).arrayBuffer();
    } catch (e2: any) {
      throw new Error(`Erro ao ler arquivo: ${(e2?.message || e1?.message) || 'Não foi possível ler o arquivo. Verifique se o arquivo não está sendo usado por outro programa.'}`);
    }
  }

  try {
    try {
      await uploadViaPresignedUrl(arrayBuffer, bucket, key, contentType, options.onProgress);
    } catch (presignedError: any) {
      console.warn('Upload via presigned URL falhou, tentando método direto:', presignedError);
      options.onProgress?.(0);
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: contentType,
      });
      await s3Client.send(command);
      options.onProgress?.(100);
    }

    // Gerar URL pública ou signed URL
    let publicUrlFinal: string;
    
    if (options.makePublic && publicUrl) {
      // Se o bucket for público e a URL pública estiver configurada, usar URL pública direta
      publicUrlFinal = `${publicUrl}/${bucket}/${key}`;
    } else {
      // Gerar URL assinada (válida por 1 hora) - mais seguro
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      publicUrlFinal = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
    }

    return {
      url: publicUrlFinal,
      key: key,
      publicUrl: publicUrlFinal,
    };
  } catch (error: any) {
    console.error('Erro ao fazer upload para R2:', error);
    
    // Mensagem de erro mais detalhada
    let errorMessage = 'Erro ao fazer upload';
    if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
      errorMessage = `Erro de CORS: O bucket "${bucket}" precisa ter CORS configurado no Cloudflare R2 para permitir uploads de http://localhost:3000. Verifique a configuração de CORS no bucket.`;
    } else {
      errorMessage = `Erro ao fazer upload: ${error.message || 'Erro desconhecido'}`;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Gera uma URL assinada para download de um arquivo
 */
export interface SignedUrlR2Options {
  responseContentDisposition?: string;
  responseContentType?: string;
  responseCacheControl?: string;
  responseContentLanguage?: string;
  responseExpires?: string;
  responseContentEncoding?: string;
}

export async function getSignedUrlR2(
  bucket: string,
  key: string,
  expiresIn: number = 3600,
  options: SignedUrlR2Options = {}
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: options.responseContentDisposition,
    ResponseContentType: options.responseContentType,
    ResponseCacheControl: options.responseCacheControl,
    ResponseContentLanguage: options.responseContentLanguage,
    ResponseExpires: options.responseExpires,
    ResponseContentEncoding: options.responseContentEncoding,
  });

  try {
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error: any) {
    console.error('Erro ao gerar URL assinada:', error);
    throw new Error(`Erro ao gerar URL: ${error.message || 'Erro desconhecido'}`);
  }
}

/**
 * Verifica se um arquivo existe no R2
 */
export async function fileExistsR2(bucket: string, key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Deleta um arquivo do R2
 */
export async function deleteFromR2(bucket: string, key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await s3Client.send(command);
  } catch (error: any) {
    console.error('Erro ao deletar arquivo do R2:', error);
    throw new Error(`Erro ao deletar arquivo: ${error.message || 'Erro desconhecido'}`);
  }
}

/**
 * Obtém a URL pública de um arquivo (se o bucket for público)
 * Se a URL pública não estiver configurada, retorna null
 */
export function getPublicUrlR2(bucket: string, key: string): string | null {
  if (!publicUrl) {
    return null;
  }
  return `${publicUrl}/${bucket}/${key}`;
}

/**
 * Lista objetos em um bucket (útil para encontrar keys)
 */
export async function listObjectsR2(
  bucket: string,
  prefix?: string,
  maxKeys: number = 1000
): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await s3Client.send(command);
    
    if (!response.Contents) {
      return [];
    }

    return response.Contents.map(item => ({
      key: item.Key || '',
      size: item.Size || 0,
      lastModified: item.LastModified || new Date(),
    }));
  } catch (error: any) {
    console.error('Erro ao listar objetos do R2:', error);
    throw new Error(`Erro ao listar objetos: ${error.message || 'Erro desconhecido'}`);
  }
}

/**
 * Encontra o key de um arquivo pelo nome no bucket
 */
export async function findKeyByFileName(
  bucket: string,
  fileName: string,
  folder?: string
): Promise<string | null> {
  try {
    const prefix = folder ? `${folder}/` : '';
    const objects = await listObjectsR2(bucket, prefix);
    
    // Procurar por arquivo que contenha o nome
    const found = objects.find(obj => 
      obj.key.includes(fileName) || obj.key.endsWith(fileName)
    );
    
    return found ? found.key : null;
  } catch (error: any) {
    console.error('Erro ao buscar key por nome:', error);
    return null;
  }
}

/**
 * Deleta múltiplos arquivos do R2
 */
export async function deleteMultipleFromR2(
  bucket: string,
  keys: string[]
): Promise<{ success: number; failed: number; errors: Array<{ key: string; error: string }> }> {
  let success = 0;
  let failed = 0;
  const errors: Array<{ key: string; error: string }> = [];

  for (const key of keys) {
    try {
      await deleteFromR2(bucket, key);
      success++;
    } catch (error: any) {
      failed++;
      errors.push({ key, error: error.message || 'Erro desconhecido' });
    }
  }

  return { success, failed, errors };
}


