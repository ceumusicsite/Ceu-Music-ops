import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
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

export default function CalendarioLancamentos() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedLancamentos, setSelectedLancamentos] = useState<Lancamento[]>([]);
  const [viewMode, setViewMode] = useState<'calendario' | 'lista'>('calendario');

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
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Adicionar dias vazios no início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Adicionar dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

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
    const lancs = getLancamentosForDate(date);
    setSelectedLancamentos(lancs);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
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

  const sortedLancamentos = useMemo(() => {
    return [...lancamentos].sort((a, b) => {
      const dateA = new Date(a.data_planejada).getTime();
      const dateB = new Date(b.data_planejada).getTime();
      return dateA - dateB;
    });
  }, [lancamentos]);

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
            <p className="text-gray-400 mt-4">Carregando calendário...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Calendário de Lançamentos</h1>
            <p className="text-gray-400 text-sm md:text-base">Visualize todos os lançamentos agendados</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'calendario' ? 'lista' : 'calendario')}
              className="px-4 py-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer flex items-center gap-2"
            >
              <i className={viewMode === 'calendario' ? 'ri-list-check' : 'ri-calendar-line'}></i>
              <span>{viewMode === 'calendario' ? 'Ver Lista' : 'Ver Calendário'}</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer flex items-center gap-2"
            >
              <i className="ri-arrow-left-line"></i>
              <span>Voltar</span>
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        {viewMode === 'calendario' ? (
          <>
        {/* Calendar Controls */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
              >
                <i className="ri-arrow-left-s-line text-xl"></i>
              </button>
              <h2 className="text-xl font-semibold text-white">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
              >
                <i className="ri-arrow-right-s-line text-xl"></i>
              </button>
            </div>
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
            >
              Hoje
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Week Days Header */}
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {days.map((date, index) => {
              const lancsForDate = date ? getLancamentosForDate(date) : [];
              const hasLancamentos = lancsForDate.length > 0;
              const isTodayDate = isToday(date);
              const isCurrentMonthDate = isCurrentMonth(date);

              return (
                <div
                  key={index}
                  className={`
                    min-h-[100px] p-2 border border-dark-border rounded-lg
                    ${!isCurrentMonthDate ? 'opacity-30' : ''}
                    ${isTodayDate ? 'border-primary-teal border-2' : ''}
                    ${hasLancamentos ? 'bg-primary-teal/10 hover:bg-primary-teal/20' : 'hover:bg-dark-hover'}
                    transition-smooth cursor-pointer
                  `}
                  onClick={() => date && handleDateClick(date)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isCurrentMonthDate ? 'text-white' : 'text-gray-500'}`}>
                      {date ? date.getDate() : ''}
                    </span>
                    {hasLancamentos && (
                      <span className="text-xs text-primary-teal font-semibold">
                        {lancsForDate.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {lancsForDate.slice(0, 2).map((lanc) => (
                      <div
                        key={lanc.id}
                        className={`text-xs px-1.5 py-0.5 rounded border truncate ${getStatusColor(lanc.status)}`}
                        title={lanc.titulo}
                      >
                        {lanc.titulo}
                      </div>
                    ))}
                    {lancsForDate.length > 2 && (
                      <div className="text-xs text-gray-400 px-1.5">
                        +{lancsForDate.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          </>
        ) : (
          /* List View */
          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden mb-6">
            <div className="p-6 border-b border-dark-border">
              <h2 className="text-xl font-semibold text-white mb-2">Todos os Lançamentos</h2>
              <p className="text-sm text-gray-400">Lista completa de lançamentos ordenados por data</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-bg border-b border-dark-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Título</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Artista</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plataforma</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {sortedLancamentos.length > 0 ? (
                    sortedLancamentos.map((lanc) => (
                      <tr 
                        key={lanc.id} 
                        className="hover:bg-dark-hover transition-smooth cursor-pointer"
                        onClick={() => navigate('/lancamentos')}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white font-medium">{formatDate(lanc.data_planejada)}</div>
                          {lanc.data_real && lanc.data_real !== lanc.data_planejada && (
                            <div className="text-xs text-gray-400">Real: {formatDate(lanc.data_real)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">{lanc.titulo || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{lanc.artista?.nome || lanc.projeto?.nome || '-'}</div>
                          {lanc.projeto?.nome && lanc.artista?.nome && (
                            <div className="text-xs text-gray-400">{lanc.projeto.nome}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <i className={`${getPlatformIcon(lanc.plataforma)} text-lg text-primary-teal`}></i>
                            <span className="text-sm text-white">{lanc.plataforma || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-400">{lanc.tipo || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lanc.status)}`}>
                            {lanc.status === 'agendado' ? 'Agendado' :
                             lanc.status === 'publicado' ? 'Publicado' :
                             lanc.status === 'cancelado' ? 'Cancelado' : lanc.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <i className="ri-rocket-line text-4xl mb-2"></i>
                          <p className="text-sm">Nenhum lançamento encontrado</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Lançamentos em {selectedDate.toLocaleDateString('pt-BR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedLancamentos([]);
                }}
                className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {selectedLancamentos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedLancamentos.map((lanc) => (
                  <div
                    key={lanc.id}
                    className="p-4 bg-dark-bg rounded-lg border border-dark-border hover:border-primary-teal transition-smooth cursor-pointer"
                    onClick={() => navigate(`/lancamentos`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white mb-1">{lanc.titulo}</h4>
                        {lanc.tipo && (
                          <p className="text-xs text-gray-400 mb-1">{lanc.tipo}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {lanc.artista?.nome || lanc.projeto?.nome || 'Sem artista'}
                        </p>
                      </div>
                      <i className={`${getPlatformIcon(lanc.plataforma)} text-lg text-primary-teal`}></i>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(lanc.status)}`}>
                        {lanc.status === 'agendado' ? 'Agendado' :
                         lanc.status === 'publicado' ? 'Publicado' :
                         lanc.status === 'cancelado' ? 'Cancelado' : lanc.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {lanc.plataforma}
                      </span>
                    </div>
                    {lanc.data_real && lanc.data_real !== lanc.data_planejada && (
                      <div className="mt-2 text-xs text-gray-500">
                        Real: {new Date(lanc.data_real).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="ri-calendar-line text-4xl mb-2"></i>
                <p className="text-sm">Nenhum lançamento nesta data</p>
              </div>
            )}
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total de Lançamentos</p>
                <p className="text-2xl font-bold text-white">{lancamentos.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-teal to-primary-brown flex items-center justify-center">
                <i className="ri-rocket-line text-2xl text-white"></i>
              </div>
            </div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Agendados</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {lancamentos.filter(l => l.status === 'agendado').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center">
                <i className="ri-calendar-line text-2xl text-white"></i>
              </div>
            </div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Publicados</p>
                <p className="text-2xl font-bold text-green-400">
                  {lancamentos.filter(l => l.status === 'publicado').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-2xl text-white"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

