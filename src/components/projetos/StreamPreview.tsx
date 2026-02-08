import { useState, useEffect, useRef } from 'react';

interface StreamPreviewProps {
  uid: string;
  title?: string;
  className?: string;
  iframeUrl?: string | null;
  aspectRatio?: 'auto' | '16:9' | '9:16' | '4:3' | '1:1';
}

/**
 * Preview de vídeo via Cloudflare Stream (iframe).
 * Para Stream público, basta usar o UID.
 */
export default function StreamPreview({ uid, title, className = '', iframeUrl, aspectRatio = 'auto' }: StreamPreviewProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeLoadedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const src = iframeUrl || '';

  useEffect(() => {
    // Resetar estados quando o UID ou src mudar
    setHasError(false);
    setIsLoading(true);
    iframeLoadedRef.current = false;
    
    // Limpar timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Timeout aumentado para 5 minutos - vídeos podem levar tempo para processar
    // Só mostrar erro se o iframe nunca carregou
    timeoutRef.current = setTimeout(() => {
      if (!iframeLoadedRef.current) {
        setHasError(true);
        setIsLoading(false);
      }
    }, 300000); // 5 minutos

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [uid, src]);

  if (!src) {
    return (
      <div className={`bg-dark-bg border border-dark-border rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3 text-gray-400">
          <i className="ri-error-warning-line text-xl"></i>
          <div>
            <p className="text-sm font-medium">Cloudflare Stream não configurado</p>
            <p className="text-xs text-gray-500 mt-1">
              Defina <code>VITE_STREAM_CUSTOMER_BASE_URL</code> para renderizar o vídeo (UID: {uid})
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`bg-dark-bg border border-dark-border rounded-lg p-4 sm:p-6 md:p-8 text-center w-full ${className}`}>
        <i className="ri-loader-4-line text-3xl sm:text-4xl text-primary-teal animate-spin mb-4 block" />
        <p className="text-white font-medium mb-2 text-sm sm:text-base">Vídeo ainda está processando</p>
        <p className="text-xs sm:text-sm text-gray-400 mb-4">
          O Cloudflare Stream está processando este vídeo. Isso pode levar alguns minutos, especialmente para vídeos grandes ou recém-copiados.
        </p>
        <p className="text-xs text-gray-500 break-all px-2 mb-4">
          UID: {uid}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              iframeLoadedRef.current = false;
              // Recarregar o iframe
              const iframe = document.querySelector(`iframe[data-stream-uid="${uid}"]`) as HTMLIFrameElement;
              if (iframe) {
                iframe.src = iframe.src;
              }
            }}
            className="px-4 py-2 bg-primary-teal text-white rounded-lg hover:bg-primary-teal/80 transition-colors text-xs sm:text-sm"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => {
              // Recarregar a página após 2 segundos para dar tempo do Stream processar
              setTimeout(() => window.location.reload(), 2000);
            }}
            className="px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg hover:bg-dark-hover transition-colors text-xs sm:text-sm"
          >
            Aguardar e recarregar página
          </button>
        </div>
      </div>
    );
  }

  // Calcular padding-bottom baseado no aspect ratio
  // padding-bottom é calculado em relação à largura do container
  const getAspectRatioPadding = () => {
    switch (aspectRatio) {
      case '9:16': // Vertical (portrait) - altura é maior que largura
        return '177.78%'; // (16/9) * 100 = altura em relação à largura
      case '4:3':
        return '75%'; // (3/4) * 100
      case '1:1':
        return '100%';
      case '16:9': // Horizontal (landscape) - largura é maior que altura
      default:
        return '56.25%'; // (9/16) * 100 = altura em relação à largura
    }
  };

  // Para mobile, vídeos verticais devem ter largura máxima menor para não ficar muito alto
  const isVertical = aspectRatio === '9:16';
  const paddingBottom = aspectRatio === 'auto' ? '56.25%' : getAspectRatioPadding();

  return (
    <div className={`bg-dark-bg border border-dark-border rounded-lg overflow-hidden w-full ${className}`}>
      {title && (
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-dark-border">
          <h4 className="text-xs sm:text-sm font-medium text-white truncate">{title}</h4>
        </div>
      )}
      <div 
        className={`relative w-full ${isVertical ? 'max-w-[280px] sm:max-w-md md:max-w-lg mx-auto' : ''}`}
        style={{ paddingBottom }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-bg z-10">
            <div className="text-center">
              <i className="ri-loader-4-line text-2xl sm:text-3xl text-primary-teal animate-spin mb-2 block" />
              <p className="text-xs sm:text-sm text-gray-400">Carregando vídeo...</p>
            </div>
          </div>
        )}
        <iframe
          data-stream-uid={uid}
          src={src}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title={title || 'Vídeo (Cloudflare Stream)'}
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
            iframeLoadedRef.current = true;
            // Limpar timeout quando iframe carregar com sucesso
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
          }}
          onError={() => {
            setIsLoading(false);
            // Só mostrar erro se o iframe realmente falhou ao carregar
            // Não mostrar erro se já estava reproduzindo
            if (!iframeLoadedRef.current) {
              setHasError(true);
            }
          }}
        />
      </div>
    </div>
  );
}

