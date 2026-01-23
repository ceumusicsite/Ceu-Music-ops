import { useState, useRef } from 'react';
import { storageService, R2_BUCKETS } from '../../services/storage';

interface FileUploadProps {
  bucket: string;
  folder?: string;
  onUploadComplete: (url: string, fileName: string) => void;
  onUploadCompleteData?: (data: { url: string; fileName: string; key: string; bucket: string }) => void;
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
  onUploadCompleteData,
  onError,
  accept = '*/*',
  maxSizeMB,
  label = 'Selecionar arquivo',
  className = '',
  multiple = false,
  makePublic = false, // Por padrão, usar signed URLs (mais seguro)
  customFileName,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const originalFile = files[0];
    
    // Validar tamanho apenas se maxSizeMB for fornecido e maior que 0
    if (maxSizeMB && maxSizeMB > 0) {
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (originalFile.size > maxSizeBytes) {
        onError?.(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
        return;
      }
    }

    // LER ARQUIVO IMEDIATAMENTE para evitar problemas de permissão/OneDrive.
    // O File do input pode ficar "bloqueado" ou inválido após um tempo.
    // Criamos uma cópia em memória que não depende do arquivo original no disco.
    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await originalFile.arrayBuffer();
    } catch (e1: any) {
      // Fallback: tentar com FileReader (API diferente, às vezes funciona)
      try {
        arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(originalFile);
        });
      } catch (e2: any) {
        onError?.(`Não foi possível ler o arquivo: ${e2?.message || e1?.message || 'Erro desconhecido'}. Tente copiar o arquivo para outra pasta (fora do OneDrive) e tente novamente.`);
        return;
      }
    }

    // Criar novo File a partir do buffer em memória
    const file = new File([arrayBuffer], originalFile.name, {
      type: originalFile.type,
      lastModified: originalFile.lastModified,
    });

    // Preview para imagens
    if (file.type.startsWith('image/')) {
      const blob = new Blob([arrayBuffer], { type: file.type });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(blob);
    }

    await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);

      // Mapear bucket para R2 bucket se necessário
      let r2Bucket = bucket;
      if (bucket === 'documentos') {
        r2Bucket = R2_BUCKETS.DOCUMENTOS;
      } else if (bucket === 'projetos-anexos' || bucket === 'anexos') {
        r2Bucket = R2_BUCKETS.ANEXOS;
      } else if (bucket === 'comprovantes') {
        r2Bucket = R2_BUCKETS.COMPROVANTES;
      } else if (bucket === 'faixas-audio-video') {
        r2Bucket = R2_BUCKETS.AUDIO;
      } else if (bucket === 'projetos-referencias') {
        r2Bucket = R2_BUCKETS.ANEXOS;
      }

      // Upload usando serviço unificado (R2 por padrão)
      const result = await storageService.upload(file, {
        bucket: r2Bucket,
        folder: folder,
        contentType: file.type,
        makePublic: makePublic,
        customFileName: customFileName,
      });

      // Usar nome customizado se fornecido, senão usar o nome original do arquivo
      const finalFileName = customFileName ? `${customFileName}.${file.name.split('.').pop()}` : file.name;
      onUploadComplete(result.url, finalFileName);
      onUploadCompleteData?.({ url: result.url, fileName: finalFileName, key: result.key, bucket: r2Bucket });
      
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
              width={384}
              height={192}
              className="w-full h-48 object-cover rounded-lg border border-dark-border"
              decoding="async"
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
