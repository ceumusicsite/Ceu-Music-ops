import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configuração do R2
const accountId = import.meta.env.VITE_R2_ACCOUNT_ID;
const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID;
const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
const endpoint = import.meta.env.VITE_R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;
const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL || `https://pub-${accountId}.r2.dev`;

// Buckets padrão
export const R2_BUCKETS = {
  DOCUMENTOS: import.meta.env.VITE_R2_BUCKET_DOCUMENTOS || 'ceu-music-documentos',
  ANEXOS: import.meta.env.VITE_R2_BUCKET_ANEXOS || 'ceu-music-anexos',
  COMPROVANTES: import.meta.env.VITE_R2_BUCKET_COMPROVANTES || 'ceu-music-comprovantes',
  AUDIO: import.meta.env.VITE_R2_BUCKET_AUDIO || 'ceu-music-audio',
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
}

export interface UploadResult {
  url: string;
  key: string;
  publicUrl?: string;
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
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = options.folder 
    ? `${options.folder}/${timestamp}_${sanitizedName}`
    : `${timestamp}_${sanitizedName}`;

  // Preparar comando de upload
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: options.contentType || file.type || 'application/octet-stream',
    // Se makePublic for true, adicionar ACL (se o bucket permitir)
    // Nota: R2 não suporta ACL da mesma forma que S3, então usamos URLs públicas
  });

  try {
    // Fazer upload
    await s3Client.send(command);

    // Gerar URL pública ou signed URL
    let publicUrlFinal: string | undefined;
    
    if (options.makePublic) {
      // Se o bucket for público, usar URL pública direta
      publicUrlFinal = `${publicUrl}/${bucket}/${key}`;
    } else {
      // Gerar URL assinada (válida por 1 hora)
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      publicUrlFinal = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
    }

    return {
      url: publicUrlFinal || `${publicUrl}/${bucket}/${key}`,
      key: key,
      publicUrl: publicUrlFinal,
    };
  } catch (error: any) {
    console.error('Erro ao fazer upload para R2:', error);
    throw new Error(`Erro ao fazer upload: ${error.message || 'Erro desconhecido'}`);
  }
}

/**
 * Gera uma URL assinada para download de um arquivo
 */
export async function getSignedUrlR2(
  bucket: string,
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
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
 */
export function getPublicUrlR2(bucket: string, key: string): string {
  return `${publicUrl}/${bucket}/${key}`;
}

