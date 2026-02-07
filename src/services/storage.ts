import { uploadToR2 as uploadToR2Storage, getSignedUrlR2, deleteFromR2, fileExistsR2, getPublicUrlR2, R2_BUCKETS, UploadOptions, UploadResult } from '../lib/r2';
import { supabase } from '../lib/supabase';

export type StorageProvider = 'r2' | 'supabase';

// Configuração: usar R2 por padrão, mas permitir fallback para Supabase
const DEFAULT_STORAGE_PROVIDER: StorageProvider = (import.meta.env.VITE_STORAGE_PROVIDER as StorageProvider) || 'r2';

export interface StorageUploadOptions extends UploadOptions {
  provider?: StorageProvider;
  customFileName?: string; // Nome customizado para o arquivo
  onProgress?: (percent: number) => void;
}

/**
 * Serviço unificado de storage que abstrai R2 e Supabase
 */
export class StorageService {
  private provider: StorageProvider;

  constructor(provider: StorageProvider = DEFAULT_STORAGE_PROVIDER) {
    this.provider = provider;
  }

  /**
   * Faz upload de um arquivo
   */
  async upload(file: File, options: StorageUploadOptions = {}): Promise<UploadResult> {
    const provider = options.provider || this.provider;

    if (provider === 'r2') {
      return this.uploadToR2(file, options);
    } else {
      return this.uploadToSupabase(file, options);
    }
  }

  /**
   * Upload para Cloudflare R2
   */
  private async uploadToR2(file: File, options: StorageUploadOptions): Promise<UploadResult> {
    try {
      return await uploadToR2Storage(file, {
        bucket: options.bucket,
        folder: options.folder,
        contentType: options.contentType,
        makePublic: options.makePublic,
        customFileName: options.customFileName,
        onProgress: options.onProgress,
      });
    } catch (error: any) {
      // Se R2 não estiver configurado ou houver erro de autenticação, fazer fallback para Supabase
      const errorMessage = error.message || '';
      if (
        errorMessage.includes('Configuração do R2 não encontrada') ||
        errorMessage.includes('InvalidAccessKeyId') ||
        errorMessage.includes('SignatureDoesNotMatch') ||
        errorMessage.includes('403') ||
        errorMessage.includes('Access Denied')
      ) {
        console.warn('R2 não configurado ou com erro de autenticação, usando Supabase Storage como fallback');
        return this.uploadToSupabase(file, options);
      }
      throw error;
    }
  }

  /**
   * Upload para Supabase Storage (fallback)
   */
  private async uploadToSupabase(file: File, options: StorageUploadOptions): Promise<UploadResult> {
    // Mapear buckets do R2 para buckets do Supabase
    const bucketMapping: Record<string, string> = {
      'ceu-music-documentos': 'documentos',
      'ceu-music-anexos': 'anexos',
      'ceu-music-comprovantes': 'comprovantes',
      'ceu-music-audio': 'audio',
      'faixas-audio-video': 'audio',
      'projetos-anexos': 'anexos',
      'projetos-referencias': 'anexos',
    };
    
    // Usar bucket mapeado ou o bucket original, ou 'anexos' como padrão
    const r2Bucket = options.bucket || 'anexos';
    const supabaseBucket = bucketMapping[r2Bucket] || r2Bucket || 'anexos';
    
    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    let fileName: string;
    
    if (options.customFileName) {
      // Usar nome customizado se fornecido
      const sanitizedCustomName = options.customFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      fileName = options.folder 
        ? `${options.folder}/${sanitizedCustomName}.${fileExt}`
        : `${sanitizedCustomName}.${fileExt}`;
    } else {
      // Gerar nome único com timestamp
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      fileName = options.folder 
        ? `${options.folder}/${timestamp}_${sanitizedName}`
        : `${timestamp}_${sanitizedName}`;
    }

    try {
      // Ler o arquivo de forma segura antes de fazer upload
      // Isso evita problemas de permissão quando o arquivo é lido múltiplas vezes
      let fileBlob: Blob;
      try {
        // Criar uma cópia do arquivo como Blob para evitar problemas de referência
        fileBlob = file.slice(0, file.size, file.type);
      } catch (readError: any) {
        throw new Error(`Erro ao ler arquivo: ${readError.message || 'Não foi possível ler o arquivo. Verifique se o arquivo não está sendo usado por outro programa.'}`);
      }
      
      // Supabase não expõe progresso nativo - simulamos para feedback visual
      let progressInterval: ReturnType<typeof setInterval> | null = null;
      if (options.onProgress) {
        let p = 0;
        options.onProgress(0);
        progressInterval = setInterval(() => {
          p = Math.min(p + 5, 90);
          options.onProgress?.(p);
        }, 150);
      }
      
      // Upload para Supabase
      const { error: uploadError } = await supabase.storage
        .from(supabaseBucket)
        .upload(fileName, fileBlob, {
          contentType: options.contentType || file.type,
          upsert: false,
        });
      
      if (progressInterval) {
        clearInterval(progressInterval);
        options.onProgress?.(100);
      }

      if (uploadError) {
        // Se o bucket não existir, tentar criar ou usar bucket padrão
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          console.warn(`Bucket "${supabaseBucket}" não encontrado, tentando usar "anexos"`);
          const fallbackBucket = 'anexos';
          // Criar cópia do arquivo para evitar problemas de referência
          const fallbackFileBlob = file.slice(0, file.size, file.type);
          const { error: fallbackError } = await supabase.storage
            .from(fallbackBucket)
            .upload(fileName, fallbackFileBlob, {
              contentType: options.contentType || file.type,
              upsert: false,
            });
          
          if (fallbackError) throw fallbackError;
          
          const { data: urlData } = supabase.storage
            .from(fallbackBucket)
            .getPublicUrl(fileName);
          
          return {
            url: urlData.publicUrl,
            key: fileName,
            publicUrl: urlData.publicUrl,
          };
        }
        throw uploadError;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(supabaseBucket)
        .getPublicUrl(fileName);

      return {
        url: urlData.publicUrl,
        key: fileName,
        publicUrl: urlData.publicUrl,
      };
    } catch (error: any) {
      console.error('Erro ao fazer upload para Supabase:', error);
      throw new Error(`Erro ao fazer upload: ${error.message || 'Erro desconhecido'}`);
    }
  }

  /**
   * Obtém URL de download (assinada ou pública)
   */
  async getDownloadUrl(bucket: string, key: string, expiresIn: number = 3600): Promise<string> {
    if (this.provider === 'r2') {
      return getSignedUrlR2(bucket, key, expiresIn);
    } else {
      // Para Supabase, retornar URL pública
      const { data } = supabase.storage.from(bucket).getPublicUrl(key);
      return data.publicUrl;
    }
  }

  /**
   * Deleta um arquivo
   */
  async delete(bucket: string, key: string): Promise<void> {
    if (this.provider === 'r2') {
      return deleteFromR2(bucket, key);
    } else {
      const { error } = await supabase.storage.from(bucket).remove([key]);
      if (error) throw error;
    }
  }

  /**
   * Verifica se um arquivo existe
   */
  async exists(bucket: string, key: string): Promise<boolean> {
    if (this.provider === 'r2') {
      return fileExistsR2(bucket, key);
    } else {
      const { data } = await supabase.storage.from(bucket).list(key.split('/')[0] || '');
      return data ? data.some(item => item.name === key.split('/').pop()) : false;
    }
  }
}

// Instância singleton do serviço
export const storageService = new StorageService();

// Exportar buckets para uso fácil
export { R2_BUCKETS };


