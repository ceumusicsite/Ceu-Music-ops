import { useState, useRef } from 'react';
import { storageService, R2_BUCKETS } from '../../services/storage';

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
  makePublic?: boolean;
  customFileName?: string; // Nome customizado para o arquivo
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
  makePublic = false, // Por padrão, usar signed URLs (mais seguro)
  customFileName,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
      setUploadProgress(0);

      // Mapear bucket para R2 bucket se necessário
      let r2Bucket = bucket;
      if (bucket === 'documentos') {
        r2Bucket = R2_BUCKETS.DOCUMENTOS;
      } else if (bucket === 'projetos-anexos' || bucket === 'anexos') {
        r2Bucket = R2_BUCKETS.ANEXOS;
      } else if (bucket === 'comprovantes') {
        r2Bucket = R2_BUCKETS.COMPROVANTES;
      } else if (bucket === 'faixas-audio-video') {
        // Mapear faixas-audio-video para o bucket de áudio do R2
        r2Bucket = R2_BUCKETS.AUDIO;
      }

      // Upload usando serviço unificado (R2 por padrão)
      const result = await storageService.upload(file, {
        bucket: r2Bucket,
        folder: folder,
        contentType: file.type,
        makePublic: makePublic,
        customFileName: customFileName,
        onProgress: (percent) => setUploadProgress(percent),
      });

      // Usar nome customizado se fornecido, senão usar o nome original do arquivo
      const finalFileName = customFileName ? `${customFileName}.${file.name.split('.').pop()}` : file.name;
      onUploadComplete(result.url, finalFileName);
      
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
      setUploadProgress(0);
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
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm hover:bg-dark-hover transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <i className="ri-loader-4-line animate-spin"></i>
                <span>Enviando... {uploadProgress}%</span>
              </>
            ) : (
              <>
                <i className="ri-upload-cloud-line"></i>
                <span>{label}</span>
              </>
            )}
          </button>
          {uploading && (
            <div className="w-full h-1.5 bg-dark-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-teal transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
