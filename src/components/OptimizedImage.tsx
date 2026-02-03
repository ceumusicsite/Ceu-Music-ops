import { useState, useEffect, useRef, useMemo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  fallback?: React.ReactNode;
  onError?: () => void;
  blurDataURL?: string; // Base64 de uma imagem muito pequena para blur-up
}

// Gera uma URL de thumbnail muito pequena para blur-up
function getThumbnailUrl(src: string): string | null {
  // Se já for uma URL externa ou não for uma imagem local, retorna null
  if (src.startsWith('http') || src.startsWith('data:')) {
    return null;
  }
  
  // Tenta criar uma versão thumbnail (assumindo que existe uma pasta thumbnails)
  // Por enquanto retorna null, mas pode ser implementado depois
  return null;
}

// Gera um placeholder blur baseado no src
function generateBlurPlaceholder(src: string): string {
  // Cria um SVG muito pequeno como placeholder
  const svg = `
    <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="20" fill="#374151"/>
      <rect x="0" y="0" width="10" height="10" fill="#4B5563"/>
      <rect x="10" y="10" width="10" height="10" fill="#4B5563"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default function OptimizedImage({
  src,
  alt,
  width = 208,
  height = 256,
  className = '',
  loading = 'lazy',
  priority = false,
  fallback,
  onError,
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [blurLoaded, setBlurLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const blurRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Gera blur placeholder se não fornecido
  const defaultBlur = useMemo(() => blurDataURL || generateBlurPlaceholder(src), [blurDataURL, src]);

  // Preload para imagens prioritárias
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.fetchPriority = 'high';
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src]);

  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Aumentado para começar a carregar mais cedo
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    // Pequeno delay para garantir que a imagem está totalmente renderizada
    setTimeout(() => {
      if (blurRef.current) {
        blurRef.current.style.opacity = '0';
      }
    }, 100);
  };

  const handleBlurLoad = () => {
    setBlurLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    if (onError) {
      onError();
    }
  };

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ 
        width, 
        height, 
        contain: 'layout style paint',
        backgroundColor: '#1F2937', // Cor de fundo enquanto carrega
      }}
    >
      {/* Blur placeholder (técnica blur-up) */}
      {!isLoaded && defaultBlur && (
        <img
          ref={blurRef}
          src={defaultBlur}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm transition-opacity duration-500"
          style={{
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
            opacity: blurLoaded ? 1 : 0,
          }}
          onLoad={handleBlurLoad}
        />
      )}

      {/* Spinner de loading */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-10 h-10 border-3 border-gray-600 border-t-primary-teal rounded-full animate-spin"></div>
        </div>
      )}

      {/* Imagem real */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            willChange: isLoaded ? 'auto' : 'opacity',
            contentVisibility: 'auto',
          }}
        />
      )}
    </div>
  );
}
