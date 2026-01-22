interface StreamPreviewProps {
  uid: string;
  title?: string;
  className?: string;
  iframeUrl?: string | null;
}

/**
 * Preview de vídeo via Cloudflare Stream (iframe).
 * Para Stream público, basta usar o UID.
 */
export default function StreamPreview({ uid, title, className = '', iframeUrl }: StreamPreviewProps) {
  const src = iframeUrl || '';

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

  return (
    <div className={`bg-dark-bg border border-dark-border rounded-lg overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-dark-border">
          <h4 className="text-sm font-medium text-white">{title}</h4>
        </div>
      )}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={src}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title={title || 'Vídeo (Cloudflare Stream)'}
        />
      </div>
    </div>
  );
}

