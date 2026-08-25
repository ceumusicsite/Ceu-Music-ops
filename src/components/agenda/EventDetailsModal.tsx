import React from 'react';
import { CalendarEventItem } from './AnimatedEventCard';
import { getEventTypeColor } from '../../utils/eventTypeColors';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEventItem | null;
  mode: 'institucional' | 'artistas';
  onEdit?: (event: CalendarEventItem) => void;
  onDelete?: (event: CalendarEventItem) => void;
}

export default function EventDetailsModal({
  isOpen,
  onClose,
  event,
  mode,
  onEdit,
  onDelete,
}: EventDetailsModalProps) {
  if (!isOpen || !event) return null;

  const raw = event.originalData || {};
  const cor = getEventTypeColor(event.tipo);

  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-dark-card border border-dark-border rounded-xl w-full max-w-xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Colorido */}
        <div
          className="p-6 text-white relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${cor}33 0%, #171a21 100%)`,
            borderBottom: `2px solid ${cor}`,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider shadow-sm"
                  style={{ backgroundColor: cor, color: '#0f1117' }}
                >
                  {event.tipo}
                </span>

                {event.status && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-dark-card/80 border border-dark-border text-gray-300 capitalize">
                    {event.status}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold text-white leading-snug">{event.titulo}</h2>

              {event.subtitulo && (
                <p className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                  <i className="ri-user-star-line text-primary-teal"></i>
                  {event.subtitulo}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-dark-card/50 transition-smooth cursor-pointer shrink-0"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Data & Horários */}
          <div className="bg-dark-bg/60 border border-dark-border rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-calendar-event-line text-primary-teal"></i> Data & Cronograma
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-gray-400 block">Data Principal:</span>
                <span className="text-sm font-semibold text-white">
                  {formatFullDate(event.data_inicio)}
                  {event.data_fim && event.data_fim !== event.data_inicio && ` até ${formatFullDate(event.data_fim)}`}
                </span>
              </div>

              {event.dia_inteiro ? (
                <div>
                  <span className="text-xs text-gray-400 block">Horário:</span>
                  <span className="text-sm font-medium text-purple-300">Dia Inteiro</span>
                </div>
              ) : mode === 'institucional' ? (
                <div>
                  <span className="text-xs text-gray-400 block">Horário da Sessão:</span>
                  <span className="text-sm font-medium text-white">
                    {event.hora_inicio ? formatTime(event.hora_inicio) : '--:--'}
                    {event.hora_fim ? ` às ${formatTime(event.hora_fim)}` : ''}
                  </span>
                </div>
              ) : (
                <div className="sm:col-span-2 grid grid-cols-3 gap-2 pt-1 border-t border-dark-border/40">
                  {raw.hora_chegada && (
                    <div>
                      <span className="text-[11px] text-gray-400 block">🚗 Chegada:</span>
                      <span className="text-xs font-bold text-gray-200">{formatTime(raw.hora_chegada)}</span>
                    </div>
                  )}
                  {raw.hora_passagem_som && (
                    <div>
                      <span className="text-[11px] text-gray-400 block">🔊 Passagem:</span>
                      <span className="text-xs font-bold text-gray-200">{formatTime(raw.hora_passagem_som)}</span>
                    </div>
                  )}
                  {raw.hora_apresentacao && (
                    <div>
                      <span className="text-[11px] text-primary-teal block font-semibold">🎤 Showtime:</span>
                      <span className="text-xs font-black text-primary-teal">{formatTime(raw.hora_apresentacao)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Local / Endereço */}
          {(event.local || raw.local_sala || raw.endereco_completo) && (
            <div className="bg-dark-bg/60 border border-dark-border rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ri-map-pin-2-line text-primary-teal"></i> Localização & Espaço
              </h4>
              <p className="text-white font-medium">
                {event.local || raw.local_sala || raw.local_nome || 'Local não informado'}
              </p>
              {raw.endereco_completo && (
                <p className="text-xs text-gray-400">{raw.endereco_completo}</p>
              )}
              {raw.cidade && (
                <div className="pt-2 flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${raw.local_nome || ''} ${raw.endereco_completo || ''} ${raw.cidade || ''} ${raw.estado || ''}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-dark-card hover:bg-dark-hover border border-dark-border rounded text-xs text-primary-teal transition-smooth"
                  >
                    <i className="ri-external-link-line"></i> Abrir no Google Maps
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Detalhes Específicos por Modo */}
          {mode === 'institucional' ? (
            <>
              {/* Convidados & Equipe Técnica */}
              {(raw.convidados || raw.responsaveis) && (
                <div className="bg-dark-bg/60 border border-dark-border rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="ri-team-line text-primary-teal"></i> Pessoas & Equipe Técnica
                  </h4>

                  {raw.convidados && (
                    <div>
                      <span className="text-xs text-gray-400 block">Convidados / Músicos:</span>
                      <span className="text-sm text-white font-medium">{raw.convidados}</span>
                    </div>
                  )}

                  {raw.responsaveis && (
                    <div>
                      <span className="text-xs text-gray-400 block">Equipe Técnica Responsável:</span>
                      <span className="text-sm text-white font-medium">{raw.responsaveis}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Link de Anexo */}
              {raw.link_anexo && (
                <div className="bg-dark-bg/60 border border-dark-border rounded-xl p-4">
                  <span className="text-xs text-gray-400 block mb-1">Arquivos & Roteiro:</span>
                  <a
                    href={raw.link_anexo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary-teal hover:underline text-sm font-medium break-all"
                  >
                    <i className="ri-folder-open-line"></i> {raw.link_anexo}
                  </a>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Contratante & Produtor de Estrada */}
              {(raw.contratante_nome || raw.contratante_contato || raw.produtor_estrada) && (
                <div className="bg-dark-bg/60 border border-dark-border rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="ri-contacts-line text-purple-400"></i> Contato & Produção de Estrada
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {raw.contratante_nome && (
                      <div>
                        <span className="text-xs text-gray-400 block">Contratante:</span>
                        <span className="text-sm text-white font-medium">{raw.contratante_nome}</span>
                      </div>
                    )}

                    {raw.contratante_contato && (
                      <div>
                        <span className="text-xs text-gray-400 block">Telefone / Contato:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white font-medium">{raw.contratante_contato}</span>
                          <a
                            href={`https://wa.me/55${raw.contratante_contato.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition-smooth"
                            title="Conversar no WhatsApp"
                          >
                            <i className="ri-whatsapp-line text-base"></i>
                          </a>
                        </div>
                      </div>
                    )}

                    {raw.produtor_estrada && (
                      <div className="sm:col-span-2">
                        <span className="text-xs text-gray-400 block">Produtor de Estrada Céu:</span>
                        <span className="text-sm text-white font-medium">{raw.produtor_estrada}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Logística */}
              {raw.logistica_detalhes && (
                <div className="bg-dark-bg/60 border border-dark-border rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <i className="ri-flight-takeoff-line text-purple-400"></i> Logística & Transporte
                  </h4>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">{raw.logistica_detalhes}</p>
                </div>
              )}
            </>
          )}

          {/* Observações Gerais */}
          {raw.observacoes && (
            <div className="bg-dark-bg/60 border border-dark-border rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <i className="ri-file-text-line text-gray-400"></i> Observações & Notas
              </h4>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{raw.observacoes}</p>
            </div>
          )}
        </div>

        {/* Footer com Ações */}
        <div className="p-4 border-t border-dark-border bg-dark-bg/40 flex items-center justify-between gap-3">
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(event)}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-smooth cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-delete-bin-line"></i>
              Excluir
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-dark-card hover:bg-dark-hover text-gray-300 hover:text-white border border-dark-border rounded-lg text-sm transition-smooth cursor-pointer"
            >
              Fechar
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="px-5 py-2 bg-gradient-primary text-white font-medium rounded-lg text-sm hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-1.5"
              >
                <i className="ri-edit-line"></i>
                Editar Agendamento
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
