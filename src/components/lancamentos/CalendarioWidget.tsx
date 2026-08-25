import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AnimatedEventCard, { CalendarEventItem } from '../agenda/AnimatedEventCard';
import EventDetailsModal from '../agenda/EventDetailsModal';
import InstitucionalEventModal, { AgendaInstitucionalData } from '../agenda/InstitucionalEventModal';
import { getEventTypeColor } from '../../utils/eventTypeColors';

const INSTITUCIONAL_LEGEND_TYPES = [
  'Gravação no Estúdio',
  'Lançamento Oficial',
  'Gravação Artista Céu',
  'Gravação Externa',
  'Sessão de Fotos / Vídeo',
  'Reunião / A&R',
  'Produção Musical',
  'Podcast / Entrevista',
];

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface CalendarioWidgetProps {
  compact?: boolean;
}

export default function CalendarioWidget({ compact = false }: CalendarioWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<AgendaInstitucionalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('todos');

  // Modais de detalhes e edição
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeEventDetails, setActiveEventDetails] = useState<CalendarEventItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<Partial<AgendaInstitucionalData> | null>(null);
  const [selectedDateForNew, setSelectedDateForNew] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadAgendaEvents();
  }, []);

  const loadAgendaEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agenda_institucional')
        .select('*')
        .order('data_inicio', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar Agenda Céu no widget:', err);
    } finally {
      setLoading(false);
    }
  };

  // Navegação
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Converter itens para CalendarEventItem
  const calendarEventItems: CalendarEventItem[] = useMemo(() => {
    return events
      .filter(e => {
        if (filterTipo !== 'todos' && e.tipo.toLowerCase() !== filterTipo.toLowerCase()) return false;
        return true;
      })
      .map(e => ({
        id: e.id || '',
        titulo: e.titulo,
        tipo: e.tipo,
        cor: getEventTypeColor(e.tipo),
        data_inicio: e.data_inicio,
        hora_inicio: e.hora_inicio,
        data_fim: e.data_fim,
        hora_fim: e.hora_fim,
        dia_inteiro: e.dia_inteiro,
        subtitulo: e.artista_nome ? `Artista: ${e.artista_nome}` : e.convidados ? `Convidados: ${e.convidados}` : null,
        local: e.local_sala,
        status: e.status,
        originalData: e,
      }));
  }, [events, filterTipo]);

  // Estrutura dos dias do mês
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Mês anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const date = new Date(year, month - 1, d);
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date, dateStr, isCurrentMonth: false, isToday: false });
    }

    // Mês atual
    const todayStr = new Date().toISOString().split('T')[0];
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Próximo mês
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      const m = month === 11 ? 1 : month + 2;
      const y = month === 11 ? year + 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date, dateStr, isCurrentMonth: false, isToday: false });
    }

    return days;
  }, [currentDate]);

  const handleOpenDetails = (event: CalendarEventItem) => {
    setActiveEventDetails(event);
    setShowDetailsModal(true);
  };

  const handleOpenEdit = (event: CalendarEventItem) => {
    setSelectedEventForEdit(event.originalData);
    setShowDetailsModal(false);
    setShowEditModal(true);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDateForNew(dateStr);
    setSelectedEventForEdit(null);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl p-8 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <i className="ri-loader-4-line text-3xl text-primary-teal animate-spin"></i>
          <span className="text-xs">Carregando Agenda Céu Music...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 md:p-6 space-y-4 shadow-xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-teal/10 border border-primary-teal/20 flex items-center justify-center text-primary-teal font-bold shadow-sm">
            <i className="ri-calendar-event-line text-xl"></i>
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              Agenda Céu Music
              <span className="px-2 py-0.5 bg-primary-teal/20 text-primary-teal text-[11px] font-semibold rounded-full">
                Estúdio & Lançamentos
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Gravações internas, estúdio, convidados e lançamentos oficiais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/agenda/institucional"
            className="px-3.5 py-1.5 bg-dark-bg hover:bg-dark-hover border border-dark-border text-primary-teal hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-smooth"
          >
            Ver agenda completa
            <i className="ri-arrow-right-line"></i>
          </Link>

          <button
            type="button"
            onClick={() => {
              setSelectedEventForEdit(null);
              setSelectedDateForNew(undefined);
              setShowEditModal(true);
            }}
            className="px-3 py-1.5 bg-gradient-primary text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-1 shadow-sm"
          >
            <i className="ri-add-line text-sm"></i>
            Novo
          </button>
        </div>
      </div>

      {/* Navegação de Mês */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 hover:bg-dark-hover text-gray-400 hover:text-white rounded-lg transition-smooth cursor-pointer"
            title="Mês anterior"
          >
            <i className="ri-arrow-left-s-line text-lg"></i>
          </button>
          <h3 className="text-base font-bold text-white min-w-[160px] text-center tracking-wide">
            {MONTHS_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 hover:bg-dark-hover text-gray-400 hover:text-white rounded-lg transition-smooth cursor-pointer"
            title="Próximo mês"
          >
            <i className="ri-arrow-right-s-line text-lg"></i>
          </button>
        </div>

        <button
          type="button"
          onClick={goToToday}
          className="px-3 py-1 bg-dark-bg hover:bg-dark-hover border border-dark-border text-xs text-gray-300 hover:text-white rounded-lg transition-smooth cursor-pointer"
        >
          Hoje
        </button>
      </div>

      {/* Barra de Legenda Compacta e Discreta em Linha Única */}
      <div className="bg-dark-bg/50 border border-dark-border/60 rounded-lg px-3 py-1.5 flex items-center gap-2 overflow-x-auto text-[11px]">
        <div className="flex items-center gap-1 text-gray-500 text-[10px] font-semibold uppercase tracking-wider shrink-0 select-none">
          <i className="ri-palette-line text-xs text-primary-teal"></i>
          <span>Legenda:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-1 overflow-x-auto py-0.5">
          {INSTITUCIONAL_LEGEND_TYPES.map((tipo) => {
            const cor = getEventTypeColor(tipo);
            const isFiltered = filterTipo.toLowerCase() === tipo.toLowerCase();
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => setFilterTipo(isFiltered ? 'todos' : tipo)}
                title={`Filtrar por "${tipo}"`}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all cursor-pointer select-none shrink-0 ${
                  isFiltered
                    ? 'ring-1 ring-white shadow-sm brightness-110 font-bold'
                    : 'hover:brightness-125 opacity-85 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: isFiltered ? cor : `${cor}18`,
                  color: isFiltered ? '#ffffff' : cor,
                  border: `1px solid ${isFiltered ? cor : `${cor}35`}`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: cor }}
                />
                <span>{tipo}</span>
              </button>
            );
          })}

          {filterTipo !== 'todos' && (
            <button
              type="button"
              onClick={() => setFilterTipo('todos')}
              className="px-2 py-0.5 text-[10px] text-gray-400 hover:text-white bg-dark-bg hover:bg-dark-hover border border-dark-border rounded-full transition-smooth cursor-pointer ml-auto shrink-0 whitespace-nowrap"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Grade do Mês */}
      <div className="bg-dark-bg/60 border border-dark-border rounded-xl overflow-hidden shadow-inner">
        {/* Dias da Semana (Header) */}
        <div className="grid grid-cols-7 border-b border-dark-border bg-dark-card/90 text-center">
          {DAYS_OF_WEEK.map((day, idx) => (
            <div
              key={day}
              className={`py-2 text-[11px] font-bold uppercase tracking-wider ${
                idx === 0 || idx === 6 ? 'text-gray-500' : 'text-gray-300'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Células de Dias */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-dark-border/60 bg-dark-bg/40">
          {monthGridDays.map((dayObj, index) => {
            const dayEvents = calendarEventItems.filter(
              e => e.data_inicio === dayObj.dateStr
            );

            return (
              <div
                key={index}
                onClick={() => handleDayClick(dayObj.dateStr)}
                className={`min-h-[90px] md:min-h-[110px] p-1.5 flex flex-col transition-colors duration-150 cursor-pointer ${
                  dayObj.isCurrentMonth
                    ? 'bg-dark-card/60 hover:bg-dark-hover/50'
                    : 'bg-dark-bg/20 opacity-35 hover:opacity-60'
                }`}
              >
                {/* Número do Dia */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                      dayObj.isToday
                        ? 'bg-primary-teal text-dark-bg ring-2 ring-primary-teal/40'
                        : dayObj.isCurrentMonth
                        ? 'text-gray-300'
                        : 'text-gray-600'
                    }`}
                  >
                    {dayObj.date.getDate()}
                  </span>

                  {dayEvents.length > 0 && (
                    <span className="text-[9px] text-gray-400 font-mono">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Cards Coloridos Sólidos */}
                <div className="space-y-1 flex-1">
                  {dayEvents.slice(0, compact ? 2 : 3).map((evt) => (
                    <AnimatedEventCard
                      key={evt.id}
                      event={evt}
                      onOpenDetails={handleOpenDetails}
                      onEdit={handleOpenEdit}
                    />
                  ))}

                  {dayEvents.length > (compact ? 2 : 3) && (
                    <div className="text-[10px] text-primary-teal font-semibold px-1">
                      +{dayEvents.length - (compact ? 2 : 3)} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modais Integrados */}
      <InstitucionalEventModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadAgendaEvents}
        initialData={selectedEventForEdit}
        defaultDate={selectedDateForNew}
      />

      <EventDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        event={activeEventDetails}
        mode="institucional"
        onEdit={handleOpenEdit}
      />
    </div>
  );
}
