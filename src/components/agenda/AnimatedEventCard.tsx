import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getEventTypeColor } from '../../utils/eventTypeColors';

export interface CalendarEventItem {
  id: string;
  titulo: string;
  tipo: string;
  cor?: string;
  data_inicio: string;
  hora_inicio?: string | null;
  data_fim?: string | null;
  hora_fim?: string | null;
  dia_inteiro?: boolean;
  subtitulo?: string | null;
  local?: string | null;
  status?: string | null;
  originalData: any;
}

interface AnimatedEventCardProps {
  event: CalendarEventItem;
  onOpenDetails: (event: CalendarEventItem) => void;
  onEdit?: (event: CalendarEventItem) => void;
  onDelete?: (event: CalendarEventItem) => void;
}

export default function AnimatedEventCard({
  event,
  onOpenDetails,
  onEdit,
  onDelete,
}: AnimatedEventCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 320,
  });

  // Cor atrelada automaticamente ao tipo de evento
  const cor = getEventTypeColor(event.tipo);

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

  const getStatusBadge = (status?: string | null) => {
    if (!status) return null;
    const s = status.toLowerCase();
    let bg = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    let label = status;

    if (s.includes('confirm')) {
      bg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      label = 'Confirmado';
    } else if (s.includes('agend')) {
      bg = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      label = 'Agendado';
    } else if (s.includes('andamento') || s.includes('gravando')) {
      bg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      label = 'Em Andamento';
    } else if (s.includes('concl') || s.includes('entreg')) {
      bg = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      label = 'Concluído';
    } else if (s.includes('cancel')) {
      bg = 'bg-red-500/20 text-red-300 border-red-500/30';
      label = 'Cancelado';
    } else if (s.includes('sondagem')) {
      bg = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      label = 'Sondagem';
    } else if (s.includes('contrato')) {
      bg = 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      label = 'Contrato Assinado';
    }

    return (
      <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${bg}`}>
        {label}
      </span>
    );
  };

  // Calcular posição inteligente do Popover na tela (Viewport Clamped & Auto-Flip)
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const popoverWidth = Math.min(340, window.innerWidth - 24);
      const estimatedHeight = 250;

      // 1. Posição Horizontal
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 16) {
        left = rect.right - popoverWidth;
      }
      left = Math.max(12, Math.min(left, window.innerWidth - popoverWidth - 12));

      // 2. Posição Vertical (Auto-flip: Abre para cima se perto do rodapé)
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top: number;
      if (spaceBelow >= estimatedHeight + 10) {
        top = rect.bottom + 6;
      } else if (spaceAbove >= estimatedHeight + 10) {
        top = rect.top - estimatedHeight - 6;
      } else {
        top = spaceBelow > spaceAbove
          ? Math.max(12, window.innerHeight - estimatedHeight - 12)
          : 12;
      }

      top = Math.max(12, Math.min(top, window.innerHeight - estimatedHeight - 12));

      setPopoverPos({
        top: Math.round(top),
        left: Math.round(left),
        width: popoverWidth,
      });
      setIsOpen(true);
    }
  };

  // Fechar popover se clicar fora ou pressionar ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.floating-event-popover') && !target.closest('.calendar-event-card-trigger')) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', () => setIsOpen(false), { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', () => setIsOpen(false));
    };
  }, [isOpen]);

  return (
    <>
      {/* Card Colorido Inteiro com Texto Nítido e Legível */}
      <div
        ref={cardRef}
        onClick={handleCardClick}
        title={`${event.hora_inicio ? formatTime(event.hora_inicio) + ' - ' : ''}${event.titulo} (${event.tipo})`}
        className={`calendar-event-card-trigger group relative rounded-md transition-all duration-150 cursor-pointer overflow-hidden mb-1 select-none px-2 py-1 flex items-center gap-1.5 shadow-sm text-white ${
          isOpen ? 'ring-2 ring-white scale-[1.02] shadow-lg brightness-110' : 'hover:brightness-110 hover:shadow-md'
        }`}
        style={{
          backgroundColor: cor,
        }}
      >
        {/* Horário */}
        {event.hora_inicio && (
          <span className="text-[10px] font-extrabold text-white/95 font-mono shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
            {formatTime(event.hora_inicio)}
          </span>
        )}

        {/* Título */}
        <span className="text-[11px] font-bold text-white truncate flex-1 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
          {event.titulo}
        </span>
      </div>

      {/* Popover Flutuante com Expansão Completa */}
      {isOpen &&
        createPortal(
          <div
            className="floating-event-popover fixed z-50 bg-[#151821] border rounded-xl shadow-2xl overflow-hidden max-h-[calc(100vh-24px)] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
            style={{
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              width: `${popoverPos.width}px`,
              borderColor: `${cor}80`,
              boxShadow: `0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 25px -5px ${cor}40`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com a cor sólida do tipo */}
            <div
              className="p-3.5 pb-3 border-b border-dark-border/60 relative"
              style={{
                background: `linear-gradient(135deg, ${cor}35 0%, #151821 100%)`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider text-white shadow-sm"
                    style={{ backgroundColor: cor }}
                  >
                    {event.tipo}
                  </span>
                  {getStatusBadge(event.status)}
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white p-1 rounded hover:bg-dark-hover transition-smooth cursor-pointer"
                  title="Fechar"
                >
                  <i className="ri-close-line text-sm"></i>
                </button>
              </div>

              <h3 className="text-sm font-bold text-white mt-2 leading-snug break-words">
                {event.titulo}
              </h3>
            </div>

            {/* Detalhes */}
            <div className="p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-5 h-5 rounded bg-dark-bg flex items-center justify-center text-primary-teal shrink-0">
                  <i className="ri-time-line text-xs"></i>
                </div>
                <span className="font-medium">
                  {event.dia_inteiro
                    ? 'Dia Inteiro'
                    : `${formatTime(event.hora_inicio)} ${
                        event.hora_fim ? `às ${formatTime(event.hora_fim)}` : ''
                      }`}
                </span>
              </div>

              {event.subtitulo && (
                <div className="flex items-center gap-2 text-gray-200">
                  <div className="w-5 h-5 rounded bg-dark-bg flex items-center justify-center text-purple-400 shrink-0">
                    <i className="ri-user-star-line text-xs"></i>
                  </div>
                  <span className="font-medium truncate">{event.subtitulo}</span>
                </div>
              )}

              {event.local && (
                <div className="flex items-start gap-2 text-gray-300">
                  <div className="w-5 h-5 rounded bg-dark-bg flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <i className="ri-map-pin-2-line text-xs"></i>
                  </div>
                  <span className="leading-snug break-words">{event.local}</span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="p-3 border-t border-dark-border/60 bg-dark-bg/50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenDetails(event);
                }}
                className="flex-1 px-3 py-1.5 bg-gradient-primary text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-smooth cursor-pointer flex items-center justify-center gap-1.5 shadow"
              >
                <i className="ri-fullscreen-line text-xs"></i>
                <span>Ver Detalhes</span>
              </button>

              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onEdit(event);
                    }}
                    className="p-1.5 hover:bg-dark-hover text-gray-400 hover:text-primary-teal rounded-lg transition-smooth cursor-pointer border border-dark-border/50"
                    title="Editar"
                  >
                    <i className="ri-edit-line text-xs"></i>
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onDelete(event);
                    }}
                    className="p-1.5 hover:bg-dark-hover text-gray-400 hover:text-red-400 rounded-lg transition-smooth cursor-pointer border border-dark-border/50"
                    title="Excluir"
                  >
                    <i className="ri-delete-bin-line text-xs"></i>
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
