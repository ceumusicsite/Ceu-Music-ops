import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { getEventTypeColor } from '../../utils/eventTypeColors';

export interface AgendaInstitucionalData {
  id?: string;
  titulo: string;
  tipo: string;
  cor?: string;
  data_inicio: string;
  hora_inicio?: string | null;
  data_fim?: string | null;
  hora_fim?: string | null;
  dia_inteiro: boolean;
  local_sala?: string | null;
  artista_id?: string | null;
  artista_nome?: string | null;
  convidados?: string | null;
  projeto_id?: string | null;
  responsaveis?: string | null;
  status: string;
  link_anexo?: string | null;
  observacoes?: string | null;
}

interface InstitucionalEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<AgendaInstitucionalData> | null;
  defaultDate?: string;
}

const TIPO_SUGESTOES = [
  'Gravação no Estúdio',
  'Lançamento Oficial',
  'Gravação Artista Céu',
  'Gravação Externa',
  'Sessão de Fotos / Vídeo',
  'Reunião / A&R',
  'Produção Musical',
  'Podcast / Entrevista',
];

const SALAS_SUGESTOES = [
  'Estúdio Céu Principal (A)',
  'Estúdio B (Voz / Acústico)',
  'Sala de Podcast / Gravação',
  'Locação Externa',
  'Sala de Reuniões Céu',
];

export default function InstitucionalEventModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultDate,
}: InstitucionalEventModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [artistas, setArtistas] = useState<any[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);

  const [formData, setFormData] = useState<AgendaInstitucionalData>({
    titulo: '',
    tipo: 'Gravação no Estúdio',
    cor: '#00d2b4',
    data_inicio: defaultDate || new Date().toISOString().split('T')[0],
    hora_inicio: '14:00',
    data_fim: defaultDate || new Date().toISOString().split('T')[0],
    hora_fim: '18:00',
    dia_inteiro: false,
    local_sala: 'Estúdio Céu Principal (A)',
    artista_id: '',
    artista_nome: '',
    convidados: '',
    projeto_id: '',
    responsaveis: '',
    status: 'agendado',
    link_anexo: '',
    observacoes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadArtistasEProjetos();
      if (initialData) {
        setFormData({
          ...initialData,
          titulo: initialData.titulo || '',
          tipo: initialData.tipo || 'Gravação no Estúdio',
          cor: initialData.cor || '#00d2b4',
          data_inicio: initialData.data_inicio || defaultDate || new Date().toISOString().split('T')[0],
          hora_inicio: initialData.hora_inicio || '14:00',
          data_fim: initialData.data_fim || initialData.data_inicio || defaultDate || new Date().toISOString().split('T')[0],
          hora_fim: initialData.hora_fim || '18:00',
          dia_inteiro: !!initialData.dia_inteiro,
          local_sala: initialData.local_sala || 'Estúdio Céu Principal (A)',
          artista_id: initialData.artista_id || '',
          artista_nome: initialData.artista_nome || '',
          convidados: initialData.convidados || '',
          projeto_id: initialData.projeto_id || '',
          responsaveis: initialData.responsaveis || '',
          status: initialData.status || 'agendado',
          link_anexo: initialData.link_anexo || '',
          observacoes: initialData.observacoes || '',
        });
      } else {
        const today = defaultDate || new Date().toISOString().split('T')[0];
        setFormData({
          titulo: '',
          tipo: 'Gravação no Estúdio',
          cor: '#00d2b4',
          data_inicio: today,
          hora_inicio: '14:00',
          data_fim: today,
          hora_fim: '18:00',
          dia_inteiro: false,
          local_sala: 'Estúdio Céu Principal (A)',
          artista_id: '',
          artista_nome: '',
          convidados: '',
          projeto_id: '',
          responsaveis: '',
          status: 'agendado',
          link_anexo: '',
          observacoes: '',
        });
      }
    }
  }, [isOpen, initialData, defaultDate]);

  const loadArtistasEProjetos = async () => {
    try {
      const [artistasRes, projetosRes] = await Promise.all([
        supabase.from('artistas').select('id, nome').order('nome'),
        supabase.from('projetos').select('id, nome, artista_id').order('created_at', { ascending: false }),
      ]);
      if (artistasRes.data) setArtistas(artistasRes.data);
      if (projetosRes.data) setProjetos(projetosRes.data);
    } catch (err) {
      console.error('Erro ao carregar artistas/projetos:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      alert('Por favor, informe o título do agendamento.');
      return;
    }
    if (!formData.data_inicio) {
      alert('Por favor, informe a data do agendamento.');
      return;
    }

    setLoading(true);
    try {
      // Obter nome do artista selecionado
      let artistaNomeFinal = formData.artista_nome?.trim() || null;
      if (formData.artista_id) {
        const art = artistas.find(a => a.id === formData.artista_id);
        if (art) artistaNomeFinal = art.nome;
      }

      const payload: any = {
        titulo: formData.titulo.trim(),
        tipo: formData.tipo.trim() || 'Gravação',
        cor: getEventTypeColor(formData.tipo),
        data_inicio: formData.data_inicio,
        hora_inicio: formData.dia_inteiro ? null : (formData.hora_inicio || null),
        data_fim: formData.data_fim || formData.data_inicio,
        hora_fim: formData.dia_inteiro ? null : (formData.hora_fim || null),
        dia_inteiro: formData.dia_inteiro,
        local_sala: formData.local_sala?.trim() || null,
        artista_id: formData.artista_id || null,
        artista_nome: artistaNomeFinal,
        convidados: formData.convidados?.trim() || null,
        projeto_id: formData.projeto_id || null,
        responsaveis: formData.responsaveis?.trim() || null,
        status: formData.status || 'agendado',
        link_anexo: formData.link_anexo?.trim() || null,
        observacoes: formData.observacoes?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from('agenda_institucional')
          .update(payload)
          .eq('id', initialData.id);
        if (error) throw error;
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('agenda_institucional')
          .insert([payload]);
        if (error) throw error;
        toast.success('Agendamento cadastrado com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
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
              style={{ backgroundColor: getEventTypeColor(formData.tipo) }}
            >
              <i className="ri-calendar-event-line text-lg"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialData?.id ? 'Editar Agendamento Institucional' : 'Novo Agendamento Institucional'}
              </h2>
              <p className="text-xs text-gray-400">
                Gravações do Estúdio, Lançamentos, Artistas Céu e Operações
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
          {/* Título do Evento */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Título do Agendamento <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Título do agendamento..."
              className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
            />
          </div>

          {/* Tipo / Categoria (100% LIVRE + Cores Automáticas) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-300">
                Tipo / Categoria
              </label>
              <span className="text-[11px] text-gray-500">Cor atribuída automaticamente por tipo</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                placeholder="Tipo do agendamento..."
                className="w-full pl-3.5 pr-28 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                <span
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: getEventTypeColor(formData.tipo) }}
                />
                <span className="text-[11px] font-bold text-gray-300">Cor do Tipo</span>
              </div>
            </div>

            {/* Chips de sugestões com suas cores padronizadas */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {TIPO_SUGESTOES.map((sug) => {
                const sugColor = getEventTypeColor(sug);
                const isSelected = formData.tipo.toLowerCase() === sug.toLowerCase();
                return (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: sug })}
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

          {/* Data e Horários */}
          <div className="bg-dark-bg/40 border border-dark-border rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                <i className="ri-time-line text-primary-teal"></i> Datas & Horários
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.dia_inteiro}
                  onChange={(e) => setFormData({ ...formData, dia_inteiro: e.target.checked })}
                  className="rounded border-dark-border text-primary-teal focus:ring-primary-teal"
                />
                Dia Inteiro
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Data de Início *</label>
                <input
                  type="date"
                  required
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
                />
              </div>

              {!formData.dia_inteiro && (
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Horário de Início</label>
                  <input
                    type="time"
                    value={formData.hora_inicio || ''}
                    onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Data de Término</label>
                <input
                  type="date"
                  value={formData.data_fim || formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
                />
              </div>

              {!formData.dia_inteiro && (
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Horário de Término</label>
                  <input
                    type="time"
                    value={formData.hora_fim || ''}
                    onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-primary-teal"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Local / Sala */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Local / Sala / Espaço do Estúdio
            </label>
            <input
              type="text"
              value={formData.local_sala || ''}
              onChange={(e) => setFormData({ ...formData, local_sala: e.target.value })}
              placeholder="Sala ou local do estúdio..."
              className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SALAS_SUGESTOES.map((sala) => (
                <button
                  key={sala}
                  type="button"
                  onClick={() => setFormData({ ...formData, local_sala: sala })}
                  className="px-2 py-0.5 text-[11px] rounded bg-dark-bg hover:bg-dark-hover text-gray-400 hover:text-white border border-dark-border transition-smooth cursor-pointer"
                >
                  {sala}
                </button>
              ))}
            </div>
          </div>

          {/* Artistas e Convidados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Artista do Casting Céu (Opcional)
              </label>
              <select
                value={formData.artista_id || ''}
                onChange={(e) => {
                  const art = artistas.find(a => a.id === e.target.value);
                  setFormData({
                    ...formData,
                    artista_id: e.target.value || null,
                    artista_nome: art ? art.nome : formData.artista_nome,
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
              >
                <option value="">Nenhum / Selecionar...</option>
                {artistas.map((art) => (
                  <option key={art.id} value={art.id}>{art.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Convidados / Participantes Extras
              </label>
              <input
                type="text"
                value={formData.convidados || ''}
                onChange={(e) => setFormData({ ...formData, convidados: e.target.value })}
                placeholder="Nomes dos convidados ou músicos extras..."
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
          </div>

          {/* Equipe Técnica & Projeto Vinculado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Equipe Técnica / Responsáveis
              </label>
              <input
                type="text"
                value={formData.responsaveis || ''}
                onChange={(e) => setFormData({ ...formData, responsaveis: e.target.value })}
                placeholder="Produtor musical, técnico de áudio, cinegrafista..."
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Projeto Vinculado (Opcional)
              </label>
              <select
                value={formData.projeto_id || ''}
                onChange={(e) => setFormData({ ...formData, projeto_id: e.target.value || null })}
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
              >
                <option value="">Sem vínculo com projeto</option>
                {projetos.map((proj) => (
                  <option key={proj.id} value={proj.id}>{proj.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Status do Agendamento
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
              >
                <option value="agendado">Agendado</option>
                <option value="confirmado">Confirmado</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Link de Arquivos / Roteiro / Drive
              </label>
              <input
                type="url"
                value={formData.link_anexo || ''}
                onChange={(e) => setFormData({ ...formData, link_anexo: e.target.value })}
                placeholder="https://drive.google.com/..."
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Observações & Detalhes Técnicos
            </label>
            <textarea
              rows={2}
              value={formData.observacoes || ''}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Instruções de equipamentos, microfonação, cronograma ou notas importantes..."
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
                  {initialData?.id ? 'Salvar Alterações' : 'Criar Agendamento'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
