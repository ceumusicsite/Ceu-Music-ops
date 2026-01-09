import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface FileUploadProps {
  bucket: string;
  folder?: string;
  onUploadComplete: (url: string, fileName: string) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  className?: string;
  multiple?: boolean;
}

export default function FileUpload({
  bucket,
  folder = '',
  onUploadComplete,
  onError,
  accept = '*/*',
  maxSizeMB = 50,
  label = 'Selecionar arquivo',
  className = '',
  multiple = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validar tamanho
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      onError?.(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
      return;
    }

    // Preview para imagens
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder ? `${folder}/` : ''}${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onUploadComplete(urlData.publicUrl, file.name);
      
      // Limpar preview e input
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      onError?.(error.message || 'Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        multiple={multiple}
        disabled={uploading}
      />
      
      {preview ? (
        <div className="space-y-2">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border border-dark-border"
            />
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-smooth"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm hover:bg-dark-hover transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <i className="ri-loader-4-line animate-spin"></i>
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <i className="ri-upload-cloud-line"></i>
              <span>{label}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
