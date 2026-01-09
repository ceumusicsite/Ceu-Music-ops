import { useMemo } from 'react';

interface YouTubePreviewProps {
  url: string;
  title?: string;
  className?: string;
}

/**
 * Extrai o ID do vídeo do YouTube de diferentes formatos de URL
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export default function YouTubePreview({ url, title, className = '' }: YouTubePreviewProps) {
  const videoId = useMemo(() => extractYouTubeId(url), [url]);

  if (!videoId) {
    return (
      <div className={`bg-dark-bg border border-dark-border rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3 text-gray-400">
          <i className="ri-error-warning-line text-xl"></i>
          <div>
            <p className="text-sm font-medium">URL do YouTube inválida</p>
            <p className="text-xs text-gray-500 mt-1">{url}</p>
          </div>
        </div>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className={`bg-dark-bg border border-dark-border rounded-lg overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-dark-border">
          <h4 className="text-sm font-medium text-white">{title}</h4>
        </div>
      )}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || 'Vídeo do YouTube'}
        />
      </div>
    </div>
  );
}
