import { useEffect, type ReactNode } from 'react';

interface CrmModalProps {
  titulo: string;
  aberto: boolean;
  onFechar: () => void;
  children: ReactNode;
  rodape?: ReactNode;
  largura?: string;
}

export default function CrmModal({
  titulo,
  aberto,
  onFechar,
  children,
  rodape,
  largura = 'max-w-2xl',
}: CrmModalProps) {
  useEffect(() => {
    if (!aberto) return;
    const aoPressionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', aoPressionar);
    return () => document.removeEventListener('keydown', aoPressionar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-4 md:p-8">
      <div
        className={`w-full ${largura} rounded-xl border border-dark-border bg-dark-card shadow-2xl`}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <header className="flex items-center justify-between border-b border-dark-border px-5 py-4">
          <h2 className="text-lg font-semibold text-white">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded p-1 text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </header>

        <div className="px-5 py-4">{children}</div>

        {rodape && (
          <footer className="flex items-center justify-end gap-2 border-t border-dark-border px-5 py-4">
            {rodape}
          </footer>
        )}
      </div>
    </div>
  );
}
