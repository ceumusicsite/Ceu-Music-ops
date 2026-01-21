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
}

export interface UploadResult {
  url: string;
  key: string;
  publicUrl?: string;
}

/**
 * Faz upload de um arquivo para o Cloudflare R2 usando presigned URL
 * Esta abordagem pode funcionar melhor com CORS
 */
async function uploadViaPresignedUrl(
  file: File,
  bucket: string,
  key: string,
  contentType: string
): Promise<void> {
  // Gerar presigned URL para PUT
  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  
  const presignedUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 300 }); // 5 minutos
  
  // Fazer upload usando fetch com presigned URL
  const arrayBuffer = await file.arrayBuffer();
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: arrayBuffer,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload falhou: ${response.status} ${response.statusText}`);
  }
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

  try {
    // Tentar primeiro com presigned URL (melhor para CORS)
    try {
      await uploadViaPresignedUrl(file, bucket, key, contentType);
    } catch (presignedError: any) {
      // Se presigned URL falhar, tentar método direto
      console.warn('Upload via presigned URL falhou, tentando método direto:', presignedError);
      
      // Converter File para ArrayBuffer para compatibilidade com AWS SDK no navegador
      const arrayBuffer = await file.arrayBuffer();
      
      // Preparar comando de upload
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: contentType,
      });

      // Fazer upload
      await s3Client.send(command);
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


