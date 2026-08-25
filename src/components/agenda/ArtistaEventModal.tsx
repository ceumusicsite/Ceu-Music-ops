import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { getEventTypeColor } from '../../utils/eventTypeColors';

export interface AgendaArtistaEventoData {
  id?: string;
  artista_id: string;
  artista_nome: string;
  titulo_evento: string;
  tipo_evento: string;
  cor?: string;
  data_inicio: string;
  hora_chegada?: string | null;
  hora_passagem_som?: string | null;
  hora_apresentacao?: string | null;
  data_fim?: string | null;
  dia_inteiro: boolean;
  cidade?: string | null;
  estado?: string | null;
  local_nome?: string | null;
  endereco_completo?: string | null;
  contratante_nome?: string | null;
  contratante_contato?: string | null;
  produtor_estrada?: string | null;
  status_booking: string;
  cache_valor?: number | null;
  logistica_detalhes?: string | null;
  observacoes?: string | null;
}

interface ArtistaEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<AgendaArtistaEventoData> | null;
  defaultDate?: string;
  defaultArtistaId?: string;
}

const TIPO_SUGESTOES_ARTISTA = [
  'Show / Apresentação',
  'Culto / Igreja',
  'Evento',
  'Conferência / Congresso',
  'Turnê / Viagem',
  'Entrevista / Podcast / TV',
  'Ensaio Geral',
  'Lançamento / Meet & Greet',
];

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function ArtistaEventModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultDate,
  defaultArtistaId,
}: ArtistaEventModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [artistas, setArtistas] = useState<any[]>([]);

  const [formData, setFormData] = useState<AgendaArtistaEventoData>({
    artista_id: defaultArtistaId || '',
    artista_nome: '',
    titulo_evento: '',
    tipo_evento: 'Show / Apresentação',
    cor: '#a855f7',
    data_inicio: defaultDate || new Date().toISOString().split('T')[0],
    hora_chegada: '16:00',
    hora_passagem_som: '17:30',
    hora_apresentacao: '20:00',
    data_fim: defaultDate || new Date().toISOString().split('T')[0],
    dia_inteiro: false,
    cidade: '',
    estado: 'PB',
    local_nome: '',
    endereco_completo: '',
    contratante_nome: '',
    contratante_contato: '',
    produtor_estrada: '',
    status_booking: 'confirmado',
    cache_valor: null,
    logistica_detalhes: '',
    observacoes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadArtistas();
      if (initialData) {
        setFormData({
          ...initialData,
          artista_id: initialData.artista_id || defaultArtistaId || '',
          artista_nome: initialData.artista_nome || '',
          titulo_evento: initialData.titulo_evento || '',
          tipo_evento: initialData.tipo_evento || 'Show / Apresentação',
          cor: initialData.cor || '#a855f7',
          data_inicio: initialData.data_inicio || defaultDate || new Date().toISOString().split('T')[0],
          hora_chegada: initialData.hora_chegada || '16:00',
          hora_passagem_som: initialData.hora_passagem_som || '17:30',
          hora_apresentacao: initialData.hora_apresentacao || '20:00',
          data_fim: initialData.data_fim || initialData.data_inicio || defaultDate || new Date().toISOString().split('T')[0],
          dia_inteiro: !!initialData.dia_inteiro,
          cidade: initialData.cidade || '',
          estado: initialData.estado || 'PB',
          local_nome: initialData.local_nome || '',
          endereco_completo: initialData.endereco_completo || '',
          contratante_nome: initialData.contratante_nome || '',
          contratante_contato: initialData.contratante_contato || '',
          produtor_estrada: initialData.produtor_estrada || '',
          status_booking: initialData.status_booking || 'confirmado',
          cache_valor: initialData.cache_valor ?? null,
          logistica_detalhes: initialData.logistica_detalhes || '',
          observacoes: initialData.observacoes || '',
        });
      } else {
        const today = defaultDate || new Date().toISOString().split('T')[0];
        setFormData({
          artista_id: defaultArtistaId || '',
          artista_nome: '',
          titulo_evento: '',
          tipo_evento: 'Show / Apresentação',
          cor: '#a855f7',
          data_inicio: today,
          hora_chegada: '16:00',
          hora_passagem_som: '17:30',
          hora_apresentacao: '20:00',
          data_fim: today,
          dia_inteiro: false,
          cidade: '',
          estado: 'PB',
          local_nome: '',
          endereco_completo: '',
          contratante_nome: '',
          contratante_contato: '',
          produtor_estrada: '',
          status_booking: 'confirmado',
          cache_valor: null,
          logistica_detalhes: '',
          observacoes: '',
        });
      }
    }
  }, [isOpen, initialData, defaultDate, defaultArtistaId]);

  const loadArtistas = async () => {
    try {
      const { data, error } = await supabase
        .from('artistas')
        .select('id, nome')
        .order('nome');
      if (error) throw error;
      setArtistas(data || []);
    } catch (err) {
      console.error('Erro ao carregar artistas:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.artista_id) {
      alert('Por favor, selecione o artista.');
      return;
    }
    if (!formData.titulo_evento.trim()) {
      alert('Por favor, informe o nome do evento.');
      return;
    }
    if (!formData.data_inicio) {
      alert('Por favor, informe a data do evento.');
      return;
    }

    const selectedArtista = artistas.find(a => a.id === formData.artista_id);
    const artistaNomeFinal = selectedArtista ? selectedArtista.nome : formData.artista_nome;

    setLoading(true);
    try {
      const payload: any = {
        artista_id: formData.artista_id,
        artista_nome: artistaNomeFinal,
        titulo_evento: formData.titulo_evento.trim(),
        tipo_evento: formData.tipo_evento.trim() || 'Show',
        cor: getEventTypeColor(formData.tipo_evento),
        data_inicio: formData.data_inicio,
        hora_chegada: formData.dia_inteiro ? null : (formData.hora_chegada || null),
        hora_passagem_som: formData.dia_inteiro ? null : (formData.hora_passagem_som || null),
        hora_apresentacao: formData.dia_inteiro ? null : (formData.hora_apresentacao || null),
        data_fim: formData.data_fim || formData.data_inicio,
        dia_inteiro: formData.dia_inteiro,
        cidade: formData.cidade?.trim() || null,
        estado: formData.estado?.trim() || null,
        local_nome: formData.local_nome?.trim() || null,
        endereco_completo: formData.endereco_completo?.trim() || null,
        contratante_nome: formData.contratante_nome?.trim() || null,
        contratante_contato: formData.contratante_contato?.trim() || null,
        produtor_estrada: formData.produtor_estrada?.trim() || null,
        status_booking: formData.status_booking || 'confirmado',
        cache_valor: formData.cache_valor ? Number(formData.cache_valor) : null,
        logistica_detalhes: formData.logistica_detalhes?.trim() || null,
        observacoes: formData.observacoes?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from('agenda_artistas_eventos')
          .update(payload)
          .eq('id', initialData.id);
        if (error) throw error;
        toast.success('Evento do artista atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('agenda_artistas_eventos')
          .insert([payload]);
        if (error) throw error;
        toast.success('Evento do artista cadastrado com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar evento:', error);
      alert(`Erro ao salvar: ${error?.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-dark-card border border-dark-border rounded-xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-dark-border flex items-center justify-between bg-dark-bg/60">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold transition-colors shadow-md"
              style={{ backgroundColor: getEventTypeColor(formData.tipo_evento) }}
            >
              <i className="ri-mic-line text-lg"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialData?.id ? 'Editar Evento do Artista' : 'Novo Evento / Show / Agenda'}
              </h2>
              <p className="text-xs text-gray-400">
                Agenda Externa, Shows, Cultos, Congressos e Turnês dos Artistas Céu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-dark-hover transition-smooth cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Seleção do Artista */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Artista Gerenciado pela Céu <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={formData.artista_id}
              onChange={(e) => {
                const art = artistas.find(a => a.id === e.target.value);
                setFormData({
                  ...formData,
                  artista_id: e.target.value,
                  artista_nome: art ? art.nome : '',
                });
              }}
              className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
            >
              <option value="" disabled>Selecione o artista...</option>
              {artistas.map((art) => (
                <option key={art.id} value={art.id}>{art.nome}</option>
              ))}
            </select>
          </div>

          {/* Nome do Evento */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Nome do Evento / Contratante <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.titulo_evento}
              onChange={(e) => setFormData({ ...formData, titulo_evento: e.target.value })}
              placeholder="Nome do evento ou show..."
              className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
            />
          </div>

          {/* Tipo de Evento (100% LIVRE + Cores Automáticas) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-300">
                Tipo de Evento
              </label>
              <span className="text-[11px] text-gray-500">Cor atribuída automaticamente por tipo</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={formData.tipo_evento}
                onChange={(e) => setFormData({ ...formData, tipo_evento: e.target.value })}
                placeholder="Tipo do evento..."
                className="w-full pl-3.5 pr-28 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                <span
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: getEventTypeColor(formData.tipo_evento) }}
                />
                <span className="text-[11px] font-bold text-gray-300">Cor do Tipo</span>
              </div>
            </div>

            {/* Chips de sugestões */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {TIPO_SUGESTOES_ARTISTA.map((sug) => {
                const sugColor = getEventTypeColor(sug);
                const isSelected = formData.tipo_evento.toLowerCase() === sug.toLowerCase();
                return (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo_evento: sug })}
                    className={`px-2.5 py-1 text-xs rounded-full transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
                      isSelected ? 'shadow-md scale-105' : 'hover:opacity-90'
                    }`}
                    style={{
                      backgroundColor: isSelected ? sugColor : `${sugColor}1a`,
                      color: isSelected ? '#ffffff' : sugColor,
                      border: `1px solid ${isSelected ? sugColor : `${sugColor}40`}`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: isSelected ? '#ffffff' : sugColor }}
                    />
                    {sug}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data e Horários de Estrada */}
          <div className="bg-dark-bg/40 border border-dark-border rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                <i className="ri-time-line text-purple-400"></i> Cronograma de Horários
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.dia_inteiro}
                  onChange={(e) => setFormData({ ...formData, dia_inteiro: e.target.checked })}
                  className="rounded border-dark-border text-purple-500 focus:ring-purple-500"
                />
                Dia Inteiro / Bloqueio
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Data do Evento *</label>
                <input
                  type="date"
                  required
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Data de Término (se multi-dia)</label>
                <input
                  type="date"
                  value={formData.data_fim || formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
                />
              </div>
            </div>

            {!formData.dia_inteiro && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">🚗 Horário de Chegada</label>
                  <input
                    type="time"
                    value={formData.hora_chegada || ''}
                    onChange={(e) => setFormData({ ...formData, hora_chegada: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-dark-bg border border-dark-border rounded text-white text-xs focus:outline-none focus:border-primary-teal"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">🔊 Passagem de Som</label>
                  <input
                    type="time"
                    value={formData.hora_passagem_som || ''}
                    onChange={(e) => setFormData({ ...formData, hora_passagem_som: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-dark-bg border border-dark-border rounded text-white text-xs focus:outline-none focus:border-primary-teal"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-primary-teal font-semibold mb-1">🎤 Showtime / Apresentação</label>
                  <input
                    type="time"
                    value={formData.hora_apresentacao || ''}
                    onChange={(e) => setFormData({ ...formData, hora_apresentacao: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-dark-bg border border-primary-teal/50 rounded text-white text-xs focus:outline-none focus:border-primary-teal font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Localização */}
          <div className="bg-dark-bg/40 border border-dark-border rounded-lg p-3.5 space-y-3">
            <span className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
              <i className="ri-map-pin-line text-purple-400"></i> Local & Endereço
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-gray-400 mb-1">Cidade</label>
                <input
                  type="text"
                  value={formData.cidade || ''}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Cidade do evento..."
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">UF (Estado)</label>
                <select
                  value={formData.estado || 'PB'}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal cursor-pointer"
                >
                  {ESTADOS_BRASIL.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Nome do Local / Igreja / Casa de Shows</label>
                <input
                  type="text"
                  value={formData.local_nome || ''}
                  onChange={(e) => setFormData({ ...formData, local_nome: e.target.value })}
                  placeholder="Nome do local, igreja ou casa de shows..."
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={formData.endereco_completo || ''}
                  onChange={(e) => setFormData({ ...formData, endereco_completo: e.target.value })}
                  placeholder="Endereço do local..."
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
                />
              </div>
            </div>
          </div>

          {/* Contato do Contratante & Produtor de Estrada */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Nome do Contratante / Responsável
              </label>
              <input
                type="text"
                value={formData.contratante_nome || ''}
                onChange={(e) => setFormData({ ...formData, contratante_nome: e.target.value })}
                placeholder="Nome do contratante ou responsável..."
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Telefone / WhatsApp Contratante
              </label>
              <input
                type="text"
                value={formData.contratante_contato || ''}
                onChange={(e) => setFormData({ ...formData, contratante_contato: e.target.value })}
                placeholder="(00) 00000-0000"
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Produtor de Estrada (Roadie/Céu)
              </label>
              <input
                type="text"
                value={formData.produtor_estrada || ''}
                onChange={(e) => setFormData({ ...formData, produtor_estrada: e.target.value })}
                placeholder="Nome do produtor de estrada responsável..."
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
          </div>

          {/* Status & Logística */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Status do Booking
              </label>
              <select
                value={formData.status_booking}
                onChange={(e) => setFormData({ ...formData, status_booking: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
              >
                <option value="confirmado">Confirmado</option>
                <option value="contrato_assinado">Contrato Assinado</option>
                <option value="sondagem">Sondagem / Em negociação</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Detalhes de Logística (Hotel / Voo / Translado)
              </label>
              <input
                type="text"
                value={formData.logistica_detalhes || ''}
                onChange={(e) => setFormData({ ...formData, logistica_detalhes: e.target.value })}
                placeholder="Detalhes de transporte, hospedagem, voos..."
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Observações, Repertório & Rider de Palco
            </label>
            <textarea
              rows={2}
              value={formData.observacoes || ''}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Relação de músicas, canais de som, microfones necessários ou notas..."
              className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-3 border-t border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-dark-bg hover:bg-dark-hover text-gray-300 hover:text-white rounded-lg text-sm transition-smooth cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-primary text-white font-medium rounded-lg text-sm hover:opacity-90 transition-smooth cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Salvando...
                </>
              ) : (
                <>
                  <i className="ri-save-line"></i>
                  {initialData?.id ? 'Salvar Alterações' : 'Criar Evento'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
