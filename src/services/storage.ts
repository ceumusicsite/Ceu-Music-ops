import { uploadToR2, getSignedUrlR2, deleteFromR2, fileExistsR2, getPublicUrlR2, R2_BUCKETS, UploadOptions, UploadResult } from '../lib/r2';
import { supabase } from '../lib/supabase';

export type StorageProvider = 'r2' | 'supabase';

// Configuração: usar R2 por padrão, mas permitir fallback para Supabase
const DEFAULT_STORAGE_PROVIDER: StorageProvider = (import.meta.env.VITE_STORAGE_PROVIDER as StorageProvider) || 'r2';

export interface StorageUploadOptions extends UploadOptions {
  provider?: StorageProvider;
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
    return uploadToR2(file, {
      bucket: options.bucket,
      folder: options.folder,
      contentType: options.contentType,
      makePublic: options.makePublic,
    });
  }

  /**
   * Upload para Supabase Storage (fallback)
   */
  private async uploadToSupabase(file: File, options: StorageUploadOptions): Promise<UploadResult> {
    const bucket = options.bucket || 'anexos';
    
    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = options.folder 
      ? `${options.folder}/${timestamp}_${sanitizedName}`
      : `${timestamp}_${sanitizedName}`;

    try {
      // Upload para Supabase
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
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

