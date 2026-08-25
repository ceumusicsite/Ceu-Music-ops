import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import AnimatedEventCard, { CalendarEventItem } from '../../components/agenda/AnimatedEventCard';
import ArtistaEventModal, { AgendaArtistaEventoData } from '../../components/agenda/ArtistaEventModal';
import EventDetailsModal from '../../components/agenda/EventDetailsModal';
import { getEventTypeColor } from '../../utils/eventTypeColors';
import { Link } from 'react-router-dom';

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const ARTISTAS_LEGEND_TYPES = [
  'Show / Apresentação',
  'Culto / Igreja',
  'Evento',
  'Conferência / Congresso',
  'Turnê / Viagem',
  'Entrevista / Podcast / TV',
  'Ensaio Geral',
];

export default function AgendaArtistas() {
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'mes' | 'semana' | 'lista'>('mes');
  const [events, setEvents] = useState<AgendaArtistaEventoData[]>([]);
  const [artistas, setArtistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArtistaId, setFilterArtistaId] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');

  // Modais
  const [showModal, setShowModal] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<Partial<AgendaArtistaEventoData> | null>(null);
  const [selectedDateForNew, setSelectedDateForNew] = useState<string | undefined>(undefined);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeEventDetails, setActiveEventDetails] = useState<CalendarEventItem | null>(null);

  useEffect(() => {
    loadArtistas();
    loadEvents();
  }, []);

  const loadArtistas = async () => {
    try {
      const { data } = await supabase.from('artistas').select('id, nome').order('nome');
      if (data) setArtistas(data);
    } catch (err) {
      console.error('Erro ao carregar artistas:', err);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agenda_artistas_eventos')
        .select('*')
        .order('data_inicio', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar agenda dos artistas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Navegação de Datas
  const nextPeriod = () => {
    if (viewMode === 'mes') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'semana') {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 7);
      setCurrentDate(next);
    }
  };

  const prevPeriod = () => {
    if (viewMode === 'mes') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'semana') {
      const prev = new Date(currentDate);
      prev.setDate(prev.getDate() - 7);
      setCurrentDate(prev);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Extrair tipos únicos
  const uniqueTipos = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      if (e.tipo_evento) set.add(e.tipo_evento);
    });
    return Array.from(set);
  }, [events]);

  // Converter itens para CalendarEventItem
  const calendarEventItems: CalendarEventItem[] = useMemo(() => {
    return events
      .filter(e => {
        if (filterArtistaId !== 'todos' && e.artista_id !== filterArtistaId) return false;
        if (filterTipo !== 'todos' && e.tipo_evento.toLowerCase() !== filterTipo.toLowerCase()) return false;
        if (filterStatus !== 'todos' && e.status_booking?.toLowerCase() !== filterStatus.toLowerCase()) return false;
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTitulo = e.titulo_evento.toLowerCase().includes(term);
          const matchArtista = e.artista_nome?.toLowerCase().includes(term);
          const matchCidade = e.cidade?.toLowerCase().includes(term);
          const matchLocal = e.local_nome?.toLowerCase().includes(term);
          if (!matchTitulo && !matchArtista && !matchCidade && !matchLocal) return false;
        }
        return true;
      })
      .map(e => ({
        id: e.id || '',
        titulo: e.titulo_evento,
        tipo: e.tipo_evento,
        cor: getEventTypeColor(e.tipo_evento),
        data_inicio: e.data_inicio,
        hora_inicio: e.hora_apresentacao || e.hora_passagem_som || e.hora_chegada,
        data_fim: e.data_fim,
        hora_fim: null,
        dia_inteiro: e.dia_inteiro,
        subtitulo: `🎤 ${e.artista_nome}`,
        local: e.cidade ? `${e.cidade}/${e.estado || ''} - ${e.local_nome || ''}` : e.local_nome,
        status: e.status_booking,
        originalData: e,
      }));
  }, [events, filterArtistaId, filterTipo, filterStatus, searchTerm]);

  // Estrutura do Mês (Grades)
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Dias do mês anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const date = new Date(year, month - 1, d);
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date, dateStr, isCurrentMonth: false, isToday: false });
    }

    // Dias do mês atual
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

    // Dias do próximo mês
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

  // Estrutura da Semana (Week View)
  const currentWeekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay(); // 0-6
    const diff = curr.getDate() - day;
    const sunday = new Date(curr.setDate(diff));

    const days = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayNum}`;

      days.push({
        date: d,
        dateStr,
        dayName: DAYS_OF_WEEK[i],
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [currentDate]);

  const handleDeleteEvent = async (event: CalendarEventItem) => {
    if (!confirm(`Tem certeza que deseja excluir o evento "${event.titulo}"?`)) return;
    try {
      const { error } = await supabase
        .from('agenda_artistas_eventos')
        .delete()
        .eq('id', event.id);

      if (error) throw error;
      toast.success('Evento excluído com sucesso!');
      setShowDetailsModal(false);
      loadEvents();
    } catch (err: any) {
      console.error('Erro ao excluir evento:', err);
      alert('Erro ao excluir evento.');
    }
  };

  const handleOpenEdit = (event: CalendarEventItem) => {
    setSelectedEventForEdit(event.originalData);
    setShowDetailsModal(false);
    setShowModal(true);
  };

  const handleOpenDetails = (event: CalendarEventItem) => {
    setActiveEventDetails(event);
    setShowDetailsModal(true);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDateForNew(dateStr);
    setSelectedEventForEdit(null);
    setShowModal(true);
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <i className="ri-mic-line text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Agenda dos Artistas
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded-full">
                    Shows & Eventos
                  </span>
                </h1>
                <p className="text-xs text-gray-400">
                  Apresentações, cultos, congressos, viagens, turnês e entrevistas dos artistas Céu
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/agenda/institucional"
              className="px-3.5 py-2 bg-dark-card hover:bg-dark-hover border border-primary-teal/30 text-primary-teal hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-smooth"
            >
              <i className="ri-building-2-line"></i>
              Ver Agenda Institucional (Estúdio & Céu) →
            </Link>

            <button
              onClick={() => {
                setSelectedEventForEdit(null);
                setSelectedDateForNew(undefined);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-gradient-primary text-white font-medium rounded-lg text-sm hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 shadow-lg shadow-primary-teal/10"
            >
              <i className="ri-add-line text-lg"></i>
              <span>Novo Evento / Show</span>
            </button>
          </div>
        </div>

        {/* Barra de Controles & Filtros */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Navegação de Mês / Semana */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-dark-bg border border-dark-border rounded-lg p-1">
              <button
                onClick={prevPeriod}
                className="p-1.5 hover:bg-dark-hover text-gray-400 hover:text-white rounded transition-smooth cursor-pointer"
                title="Período anterior"
              >
                <i className="ri-arrow-left-s-line text-lg"></i>
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-xs font-medium text-gray-300 hover:text-white hover:bg-dark-hover rounded transition-smooth cursor-pointer"
              >
                Hoje
              </button>
              <button
                onClick={nextPeriod}
                className="p-1.5 hover:bg-dark-hover text-gray-400 hover:text-white rounded transition-smooth cursor-pointer"
                title="Próximo período"
              >
                <i className="ri-arrow-right-s-line text-lg"></i>
              </button>
            </div>

            <h2 className="text-base md:text-lg font-bold text-white tracking-wide">
              {viewMode === 'semana'
                ? `Semana de ${currentWeekDays[0].date.getDate()} ${MONTHS_NAMES[currentWeekDays[0].date.getMonth()].slice(0, 3)} - ${currentWeekDays[6].date.getDate()} ${MONTHS_NAMES[currentWeekDays[6].date.getMonth()].slice(0, 3)} ${currentWeekDays[6].date.getFullYear()}`
                : `${MONTHS_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            </h2>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Busca */}
            <div className="relative min-w-[170px]">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar show, cidade..."
                className="w-full pl-8 pr-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>

            {/* Filtro por Artista */}
            <select
              value={filterArtistaId}
              onChange={(e) => setFilterArtistaId(e.target.value)}
              className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-gray-300 text-xs focus:outline-none focus:border-primary-teal cursor-pointer"
            >
              <option value="todos">Todos os Artistas</option>
              {artistas.map((art) => (
                <option key={art.id} value={art.id}>{art.nome}</option>
              ))}
            </select>

            {/* Filtro por Tipo */}
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-gray-300 text-xs focus:outline-none focus:border-primary-teal cursor-pointer"
            >
              <option value="todos">Todos os Tipos</option>
              {uniqueTipos.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>

            {/* Filtro por Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-gray-300 text-xs focus:outline-none focus:border-primary-teal cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="confirmado">Confirmado</option>
              <option value="contrato_assinado">Contrato Assinado</option>
              <option value="sondagem">Sondagem</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>

            {/* Alternador de Visualização */}
            <div className="flex items-center bg-dark-bg border border-dark-border rounded-lg p-1">
              <button
                onClick={() => setViewMode('mes')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-smooth cursor-pointer flex items-center gap-1 ${
                  viewMode === 'mes'
                    ? 'bg-purple-500 text-white font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <i className="ri-calendar-grid-line"></i> Mês
              </button>
              <button
                onClick={() => setViewMode('semana')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-smooth cursor-pointer flex items-center gap-1 ${
                  viewMode === 'semana'
                    ? 'bg-purple-500 text-white font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <i className="ri-calendar-2-line"></i> Semana
              </button>
              <button
                onClick={() => setViewMode('lista')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-smooth cursor-pointer flex items-center gap-1 ${
                  viewMode === 'lista'
                    ? 'bg-purple-500 text-white font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <i className="ri-list-check"></i> Lista
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Legenda de Cores Compacta e Discreta em Linha Única */}
        <div className="bg-dark-card/40 border border-dark-border/60 rounded-lg px-3 py-1.5 flex items-center gap-2 overflow-x-auto text-[11px]">
          <div className="flex items-center gap-1 text-gray-500 text-[10px] font-semibold uppercase tracking-wider shrink-0 select-none">
            <i className="ri-palette-line text-xs text-purple-400"></i>
            <span>Legenda:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto py-0.5">
            {ARTISTAS_LEGEND_TYPES.map((tipo) => {
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

        {/* Visualização: Grade Mensal */}
        {viewMode === 'mes' && (
          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-2xl">
            {/* Dias da Semana (Header) */}
            <div className="grid grid-cols-7 border-b border-dark-border bg-dark-bg/80 text-center">
              {DAYS_OF_WEEK.map((day, idx) => (
                <div
                  key={day}
                  className={`py-3 text-xs font-bold uppercase tracking-wider ${
                    idx === 0 || idx === 6 ? 'text-gray-500' : 'text-gray-300'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grade de Dias */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-dark-border/60 bg-dark-card">
              {monthGridDays.map((dayObj, index) => {
                const dayEvents = calendarEventItems.filter(
                  e => e.data_inicio === dayObj.dateStr
                );

                return (
                  <div
                    key={index}
                    onClick={() => handleDayClick(dayObj.dateStr)}
                    className={`min-h-[110px] md:min-h-[130px] p-2 flex flex-col transition-colors duration-150 cursor-pointer ${
                      dayObj.isCurrentMonth ? 'bg-dark-card hover:bg-dark-hover/40' : 'bg-dark-bg/40 opacity-40 hover:opacity-70'
                    }`}
                  >
                    {/* Número do Dia */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          dayObj.isToday
                            ? 'bg-purple-500 text-white ring-2 ring-purple-500/40'
                            : dayObj.isCurrentMonth
                            ? 'text-gray-300'
                            : 'text-gray-600'
                        }`}
                      >
                        {dayObj.date.getDate()}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[10px] text-purple-400 font-mono font-medium">
                          {dayEvents.length} show(s)
                        </span>
                      )}
                    </div>

                    {/* Lista de Cards Compactos */}
                    <div className="space-y-1 flex-1">
                      {dayEvents.map((evt) => (
                        <AnimatedEventCard
                          key={evt.id}
                          event={evt}
                          onOpenDetails={handleOpenDetails}
                          onEdit={handleOpenEdit}
                          onDelete={handleDeleteEvent}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Visualização: Semana (Week View) */}
        {viewMode === 'semana' && (
          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-2xl">
            {/* Header da Semana */}
            <div className="grid grid-cols-7 border-b border-dark-border bg-dark-bg/80 text-center divide-x divide-dark-border/60">
              {currentWeekDays.map((dayObj) => (
                <div
                  key={dayObj.dateStr}
                  onClick={() => handleDayClick(dayObj.dateStr)}
                  className={`py-3 px-2 cursor-pointer transition-colors ${
                    dayObj.isToday ? 'bg-purple-500/10' : 'hover:bg-dark-hover/50'
                  }`}
                >
                  <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">
                    {dayObj.dayName}
                  </span>
                  <span
                    className={`text-base font-extrabold inline-flex items-center justify-center w-8 h-8 rounded-full mt-1 ${
                      dayObj.isToday
                        ? 'bg-purple-500 text-white ring-2 ring-purple-500/40'
                        : 'text-white'
                    }`}
                  >
                    {dayObj.date.getDate()}
                  </span>
                </div>
              ))}
            </div>

            {/* Colunas dos 7 Dias da Semana */}
            <div className="grid grid-cols-7 divide-x divide-dark-border/60 min-h-[450px] bg-dark-card">
              {currentWeekDays.map((dayObj) => {
                const dayEvents = calendarEventItems.filter(
                  e => e.data_inicio === dayObj.dateStr
                );

                return (
                  <div
                    key={dayObj.dateStr}
                    onClick={() => handleDayClick(dayObj.dateStr)}
                    className={`p-2.5 space-y-2 flex flex-col cursor-pointer transition-colors ${
                      dayObj.isToday ? 'bg-purple-500/[0.03]' : 'hover:bg-dark-hover/30'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      {dayEvents.map((evt) => (
                        <AnimatedEventCard
                          key={evt.id}
                          event={evt}
                          onOpenDetails={handleOpenDetails}
                          onEdit={handleOpenEdit}
                          onDelete={handleDeleteEvent}
                        />
                      ))}

                      {dayEvents.length === 0 && (
                        <div className="h-full flex items-center justify-center text-center py-10 opacity-30 text-gray-500 text-xs">
                          <span>+ Adicionar Show</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Visualização: Lista Cronológica */}
        {viewMode === 'lista' && (
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-xl">
            {calendarEventItems.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <i className="ri-calendar-close-line text-5xl mb-3 text-gray-600 block"></i>
                <p className="text-base font-medium text-gray-300">Nenhum evento de artista encontrado</p>
                <p className="text-xs text-gray-500 mt-1">Cadastre um novo show ou ajuste os filtros acima.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {calendarEventItems.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 bg-dark-bg border border-dark-border hover:border-purple-500/50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-smooth"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="w-3 h-12 rounded-full shrink-0"
                        style={{ backgroundColor: evt.cor }}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-0.5 text-[10px] font-bold rounded"
                            style={{ backgroundColor: `${evt.cor}25`, color: evt.cor }}
                          >
                            {evt.tipo}
                          </span>
                          <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                            <i className="ri-calendar-line"></i>
                            {evt.data_inicio.split('-').reverse().join('/')}
                          </span>
                          {evt.hora_inicio && (
                            <span className="text-xs text-primary-teal font-bold font-mono">
                              🎤 {evt.hora_inicio.slice(0, 5)}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-white">{evt.titulo}</h3>
                        <p className="text-xs text-purple-300 font-semibold">{evt.subtitulo}</p>
                        {evt.local && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <i className="ri-map-pin-line text-purple-400"></i> {evt.local}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenDetails(evt)}
                        className="px-3 py-1.5 bg-dark-card hover:bg-dark-hover border border-dark-border text-purple-400 hover:text-white rounded-lg text-xs font-medium transition-smooth"
                      >
                        Ver Detalhes
                      </button>
                      <button
                        onClick={() => handleOpenEdit(evt)}
                        className="p-2 hover:bg-dark-hover text-gray-400 hover:text-purple-400 rounded-lg transition-smooth"
                        title="Editar"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(evt)}
                        className="p-2 hover:bg-dark-hover text-gray-400 hover:text-red-400 rounded-lg transition-smooth"
                        title="Excluir"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal de Criação / Edição */}
        <ArtistaEventModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={loadEvents}
          initialData={selectedEventForEdit}
          defaultDate={selectedDateForNew}
          defaultArtistaId={filterArtistaId !== 'todos' ? filterArtistaId : undefined}
        />

        {/* Modal de Detalhes Expandidos */}
        <EventDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          event={activeEventDetails}
          mode="artistas"
          onEdit={handleOpenEdit}
          onDelete={handleDeleteEvent}
        />
      </div>
    </MainLayout>
  );
}
