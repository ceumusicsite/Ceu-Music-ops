import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Lancamento {
  id: string;
  titulo: string;
  data_planejada: string;
  data_real: string | null;
  plataforma: string;
  status: string;
  tipo: string | null;
  artista: { nome: string } | null;
  projeto: { nome: string } | null;
}

interface CalendarioWidgetProps {
  compact?: boolean; // Modo compacto para dashboard
}

export default function CalendarioWidget({ compact = false }: CalendarioWidgetProps) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedLancamentos, setSelectedLancamentos] = useState<Lancamento[]>([]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  useEffect(() => {
    loadLancamentos();
  }, []);

  const loadLancamentos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lancamentos')
        .select(`
          id,
          titulo,
          data_planejada,
          data_real,
          plataforma,
          status,
          tipo,
          artista:artista_id(nome),
          projeto:projeto_id(nome)
        `)
        .order('data_planejada', { ascending: true });

      if (error) throw error;

      if (data) {
        setLancamentos(data.map((l: any) => ({
          id: l.id,
          titulo: l.titulo,
          data_planejada: l.data_planejada,
          data_real: l.data_real,
          plataforma: l.plataforma,
          status: l.status || 'agendado',
          tipo: l.tipo,
          artista: l.artista ? { nome: l.artista.nome } : null,
          projeto: l.projeto ? { nome: l.projeto.nome } : null,
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
      setLancamentos([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
    return days;
  };

  const getLancamentosForDate = (date: Date | null): Lancamento[] => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return lancamentos.filter(lanc => {
      const dataPlanejada = lanc.data_planejada?.split('T')[0];
      const dataReal = lanc.data_real?.split('T')[0];
      return dataPlanejada === dateStr || dataReal === dateStr;
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'agendado': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'publicado': 'bg-green-500/20 text-green-400 border-green-500/30',
      'cancelado': 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'agendado': 'Agendado',
      'publicado': 'Publicado',
      'cancelado': 'Cancelado',
    };
    return labels[status] || status;
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      'Spotify': 'ri-spotify-line',
      'YouTube': 'ri-youtube-line',
      'Apple Music': 'ri-apple-line',
      'Deezer': 'ri-music-line',
      'TikTok': 'ri-tiktok-line',
    };
    return icons[platform] || 'ri-music-line';
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedLancamentos(getLancamentosForDate(date));
  };

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date: Date | null) => {
    if (!date) return false;
    return date.getMonth() === currentDate.getMonth() &&
           date.getFullYear() === currentDate.getFullYear();
  };

  if (loading) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 flex items-center justify-center min-h-[300px]">
        <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
      </div>
    );
  }

  const cellMinHeight = compact ? 'min-h-[70px]' : 'min-h-[100px]';

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Calendário de Lançamentos</h2>
        <Link
          to="/lancamentos/calendario"
          className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer flex items-center gap-1"
        >
          Ver completo
          <i className="ri-arrow-right-line"></i>
        </Link>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            className="p-2 hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
          >
            <i className="ri-arrow-left-s-line text-lg"></i>
          </button>
          <h3 className="text-lg font-medium text-white min-w-[180px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            className="p-2 hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
          >
            <i className="ri-arrow-right-s-line text-lg"></i>
          </button>
        </div>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-3 py-1.5 bg-gradient-primary text-white text-sm rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
        >
          Hoje
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
            {day}
          </div>
        ))}
        {days.map((date, index) => {
          const lancsForDate = date ? getLancamentosForDate(date) : [];
          const hasLancamentos = lancsForDate.length > 0;
          const isTodayDate = isToday(date);
          const isCurrentMonthDate = isCurrentMonth(date);

          return (
            <div
              key={index}
              className={`
                ${cellMinHeight} p-1.5 border rounded-lg
                ${!isCurrentMonthDate ? 'opacity-30' : ''}
                ${isTodayDate ? 'border-primary-teal border-2' : 'border-dark-border'}
                ${hasLancamentos ? 'bg-primary-teal/10 hover:bg-primary-teal/20' : 'hover:bg-dark-hover'}
                transition-smooth cursor-pointer
              `}
              onClick={() => date && handleDateClick(date)}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-xs font-medium ${isCurrentMonthDate ? 'text-white' : 'text-gray-500'}`}>
                  {date ? date.getDate() : ''}
                </span>
                {hasLancamentos && (
                  <span className="text-[10px] text-primary-teal font-semibold">
                    {lancsForDate.length}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {lancsForDate.slice(0, compact ? 1 : 2).map((lanc) => (
                  <div
                    key={lanc.id}
                    className={`text-[10px] px-1 py-0.5 rounded border truncate ${getStatusColor(lanc.status)}`}
                    title={lanc.titulo}
                  >
                    {lanc.titulo}
                  </div>
                ))}
                {lancsForDate.length > (compact ? 1 : 2) && (
                  <div className="text-[10px] text-gray-400 px-1">
                    +{lancsForDate.length - (compact ? 1 : 2)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && selectedLancamentos.length > 0 && (
        <div className="mt-4 pt-4 border-t border-dark-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white">
              {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h4>
            <button
              onClick={() => { setSelectedDate(null); setSelectedLancamentos([]); }}
              className="text-gray-400 hover:text-white text-sm"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
          <div className="space-y-2">
            {selectedLancamentos.slice(0, 3).map((lanc) => (
              <div
                key={lanc.id}
                className="p-3 bg-dark-bg rounded-lg border border-dark-border hover:border-primary-teal transition-smooth cursor-pointer flex items-center justify-between"
                onClick={() => navigate('/lancamentos')}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{lanc.titulo}</p>
                  <p className="text-xs text-gray-400">{lanc.artista?.nome || lanc.projeto?.nome || '-'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <i className={`${getPlatformIcon(lanc.plataforma)} text-primary-teal`}></i>
                  <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(lanc.status)}`}>{getStatusLabel(lanc.status)}</span>
                </div>
              </div>
            ))}
            {selectedLancamentos.length > 3 && (
              <Link
                to="/lancamentos"
                className="block text-center text-sm text-primary-teal hover:text-primary-brown py-2"
              >
                Ver todos ({selectedLancamentos.length})
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
