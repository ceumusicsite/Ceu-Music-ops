import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import TermoUsoModal from '../../components/estudio/TermoUsoModal';
import { TermoUsoData } from '../../components/estudio/TermoUsoContent';

export interface EstudioGravacao {
  id: string;
  titulo: string;
  tipo_conteudo: 'reels' | 'cover' | 'youtube' | 'clipes' | 'outro';
  tipo_artista: 'casting' | 'convidado';
  artista_id?: string | null;
  artista_nome: string;
  data_gravacao: string;
  prazo_entrega?: string | null;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'pendente' | 'em_edicao' | 'em_revisao' | 'entregue' | 'cancelado';
  responsavel?: string | null;
  link_arquivos?: string | null;
  observacoes?: string | null;
  criado_por?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ArtistaOption {
  id: string;
  nome: string;
}

const TIPO_CONTEUDO_MAP: Record<string, { label: string; icon: string }> = {
  reels: { label: 'Reels', icon: 'ri-smartphone-line' },
  cover: { label: 'Cover', icon: 'ri-music-2-line' },
  youtube: { label: 'YouTube', icon: 'ri-youtube-line' },
  clipes: { label: 'Clipes', icon: 'ri-movie-2-line' },
  outro: { label: 'Outro', icon: 'ri-disc-line' },
};

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; border: string; icon: string; dot: string }> = {
  pendente: { label: 'Pendente', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: 'ri-time-line', dot: 'bg-yellow-400' },
  em_edicao: { label: 'Em Edição', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', icon: 'ri-scissors-2-line', dot: 'bg-purple-400' },
  em_revisao: { label: 'Em Revisão', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', icon: 'ri-eye-line', dot: 'bg-blue-400' },
  entregue: { label: 'Entregue', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: 'ri-checkbox-circle-line', dot: 'bg-emerald-400' },
  cancelado: { label: 'Cancelado', bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30', icon: 'ri-close-circle-line', dot: 'bg-zinc-400' },
};

const PRIORIDADE_MAP: Record<string, { label: string; bg: string; text: string; border: string; icon: string; activeBg: string }> = {
  urgente: {
    label: 'Urgente',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/40',
    icon: 'ri-alarm-warning-fill',
    activeBg: 'bg-red-500/20 text-red-300 border-red-500 ring-2 ring-red-500/40'
  },
  alta: {
    label: 'Alta',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/40',
    icon: 'ri-fire-fill',
    activeBg: 'bg-orange-500/20 text-orange-300 border-orange-500 ring-2 ring-orange-500/40'
  },
  media: {
    label: 'Média',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: 'ri-equal-line',
    activeBg: 'bg-amber-500/20 text-amber-300 border-amber-500 ring-2 ring-amber-500/40'
  },
  baixa: {
    label: 'Baixa',
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
    border: 'border-teal-500/30',
    icon: 'ri-arrow-down-line',
    activeBg: 'bg-teal-500/20 text-teal-300 border-teal-500 ring-2 ring-teal-500/40'
  },
};

export default function EstudioPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [gravacoes, setGravacoes] = useState<EstudioGravacao[]>([]);
  const [artistas, setArtistas] = useState<ArtistaOption[]>([]);
  const [termos, setTermos] = useState<TermoUsoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filtros e Visualização
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterPrioridade, setFilterPrioridade] = useState<string>('todas');
  const [filterTipoArtista, setFilterTipoArtista] = useState<string>('todos');
  const [filterTipoConteudo, setFilterTipoConteudo] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modais de Gravação
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EstudioGravacao | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<EstudioGravacao | null>(null);

  // Modal de Termo de Imagem
  const [showTermoModal, setShowTermoModal] = useState(false);
  const [selectedTermoGravacaoId, setSelectedTermoGravacaoId] = useState<string | null>(null);
  const [selectedTermoId, setSelectedTermoId] = useState<string | null>(null);
  const [termoInitialData, setTermoInitialData] = useState<Partial<TermoUsoData> | null>(null);

  // Form State da Gravação
  const [formData, setFormData] = useState<{
    titulo: string;
    tipo_conteudo: 'reels' | 'cover' | 'youtube' | 'clipes' | 'outro';
    tipo_artista: 'casting' | 'convidado';
    artista_id: string;
    artista_nome: string;
    data_gravacao: string;
    prazo_entrega: string;
    prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
    status: 'pendente' | 'em_edicao' | 'em_revisao' | 'entregue' | 'cancelado';
    responsavel: string;
    link_arquivos: string;
    observacoes: string;
  }>({
    titulo: '',
    tipo_conteudo: 'reels',
    tipo_artista: 'casting',
    artista_id: '',
    artista_nome: '',
    data_gravacao: new Date().toISOString().split('T')[0],
    prazo_entrega: '',
    prioridade: 'media',
    status: 'pendente',
    responsavel: '',
    link_arquivos: '',
    observacoes: '',
  });

  // Carregar dados (gravações, artistas e termos)
  const loadData = async () => {
    try {
      setLoading(true);
      const [gravacoesRes, artistasRes, termosRes] = await Promise.all([
        supabase
          .from('estudio_gravacoes')
          .select('*')
          .order('data_gravacao', { ascending: false }),
        supabase
          .from('artistas')
          .select('id, nome')
          .order('nome', { ascending: true }),
        supabase
          .from('estudio_termos_uso')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (gravacoesRes.error) throw gravacoesRes.error;
      if (artistasRes.error) throw artistasRes.error;

      setGravacoes(gravacoesRes.data || []);
      setArtistas(artistasRes.data || []);
      setTermos((termosRes.data as TermoUsoData[]) || []);
    } catch (err: any) {
      console.error('Erro ao carregar dados do estúdio:', err);
      toast.error('Erro ao carregar gravações do estúdio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Obter termo vinculado a uma gravação
  const getTermoForGravacao = (gravacaoId: string) => {
    return termos.find((t) => (t as any).gravacao_id === gravacaoId);
  };

  // Formatação de data BR
  const formatDateBR = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      const [year, month, day] = dateString.split('-');
      if (!year || !month || !day) return dateString;
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  // Cálculo de Prazo
  const getDeadlineInfo = (prazoEntrega?: string | null, status?: string) => {
    if (status === 'entregue') {
      return {
        label: 'Entregue',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: 'ri-checkbox-circle-fill',
        isLate: false,
      };
    }
    if (status === 'cancelado') {
      return {
        label: 'Cancelado',
        badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        icon: 'ri-close-circle-line',
        isLate: false,
      };
    }
    if (!prazoEntrega) {
      return {
        label: 'Sem prazo',
        badgeClass: 'bg-dark-hover text-gray-400 border-dark-border',
        icon: 'ri-calendar-line',
        isLate: false,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [y, m, d] = prazoEntrega.split('-').map(Number);
    const deadline = new Date(y, m - 1, d);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Atrasado (${Math.abs(diffDays)}d)`,
        badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40 font-semibold animate-pulse',
        icon: 'ri-alarm-warning-line',
        isLate: true,
      };
    } else if (diffDays === 0) {
      return {
        label: 'Vence hoje!',
        badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/40 font-semibold',
        icon: 'ri-timer-flash-line',
        isLate: true,
      };
    } else if (diffDays === 1) {
      return {
        label: 'Vence amanhã',
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        icon: 'ri-time-line',
        isLate: false,
      };
    } else {
      return {
        label: `${diffDays} dias restantes`,
        badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        icon: 'ri-calendar-check-line',
        isLate: false,
      };
    }
  };

  // Toggle rápido de status (Entregue / Pendente)
  const handleToggleEntregue = async (item: EstudioGravacao, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = item.status === 'entregue' ? 'pendente' : 'entregue';
    
    setGravacoes(prev =>
      prev.map(g => (g.id === item.id ? { ...g, status: newStatus, updated_at: new Date().toISOString() } : g))
    );

    try {
      const { error } = await supabase
        .from('estudio_gravacoes')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(newStatus === 'entregue' ? 'Gravação marcada como Entregue!' : 'Status alterado para Pendente.');
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Erro ao atualizar status da gravação.');
      loadData();
    }
  };

  // Atualização rápida de prioridade
  const handleUpdatePrioridade = async (item: EstudioGravacao, newPrioridade: EstudioGravacao['prioridade'], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (item.prioridade === newPrioridade) return;

    setGravacoes(prev =>
      prev.map(g => (g.id === item.id ? { ...g, prioridade: newPrioridade, updated_at: new Date().toISOString() } : g))
    );

    try {
      const { error } = await supabase
        .from('estudio_gravacoes')
        .update({
          prioridade: newPrioridade,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(`Prioridade alterada para ${PRIORIDADE_MAP[newPrioridade].label}.`);
    } catch (err: any) {
      console.error('Erro ao atualizar prioridade:', err);
      toast.error('Erro ao atualizar prioridade.');
      loadData();
    }
  };

  // Abrir Modal de Criação de Gravação
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      titulo: '',
      tipo_conteudo: 'reels',
      tipo_artista: 'casting',
      artista_id: artistas.length > 0 ? artistas[0].id : '',
      artista_nome: artistas.length > 0 ? artistas[0].nome : '',
      data_gravacao: new Date().toISOString().split('T')[0],
      prazo_entrega: '',
      prioridade: 'media',
      status: 'pendente',
      responsavel: user?.name || '',
      link_arquivos: '',
      observacoes: '',
    });
    setShowModal(true);
  };

  // Abrir Modal de Edição de Gravação
  const handleOpenEditModal = (item: EstudioGravacao, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setFormData({
      titulo: item.titulo,
      tipo_conteudo: item.tipo_conteudo,
      tipo_artista: item.tipo_artista || 'casting',
      artista_id: item.artista_id || '',
      artista_nome: item.artista_nome,
      data_gravacao: item.data_gravacao,
      prazo_entrega: item.prazo_entrega || '',
      prioridade: item.prioridade,
      status: item.status,
      responsavel: item.responsavel || '',
      link_arquivos: item.link_arquivos || '',
      observacoes: item.observacoes || '',
    });
    setShowModal(true);
  };

  // Abrir Modal de Termo de Imagem
  const handleOpenTermoModal = (gravacao?: EstudioGravacao | null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (gravacao) {
      const existingTermo = getTermoForGravacao(gravacao.id);
      if (existingTermo) {
        setSelectedTermoId(existingTermo.id || null);
        setSelectedTermoGravacaoId(gravacao.id);
        setTermoInitialData(existingTermo);
      } else {
        setSelectedTermoId(null);
        setSelectedTermoGravacaoId(gravacao.id);
        setTermoInitialData({
          projeto_nome: gravacao.titulo,
          artista_principal: gravacao.artista_nome || 'Céu Music',
          data_gravacao: gravacao.data_gravacao,
          autorizante_nome: gravacao.tipo_artista === 'convidado' ? gravacao.artista_nome : '',
          autorizante_nome_artistico: gravacao.tipo_artista === 'convidado' ? gravacao.artista_nome : '',
          tipo_participacao: gravacao.tipo_artista === 'convidado' ? 'Convidado' : 'Artista principal',
        });
      }
    } else {
      setSelectedTermoId(null);
      setSelectedTermoGravacaoId(null);
      setTermoInitialData(null);
    }
    setShowTermoModal(true);
  };

  // Copiar link rápido do termo
  const handleCopyTermoLink = (termo: TermoUsoData, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!termo.token) return;
    const url = `${window.location.origin}/public/termo/${termo.token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link do Termo de Imagem copiado!');
  };

  // Salvar Gravação
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      toast.warning('Informe o título do conteúdo/gravação.');
      return;
    }

    if (formData.tipo_artista === 'casting') {
      if (!formData.artista_nome.trim()) {
        toast.warning('Selecione um artista da casa.');
        return;
      }
    } else {
      if (!formData.artista_nome.trim()) {
        toast.warning('Informe o nome do artista ou convidado externo.');
        return;
      }
    }

    if (!formData.data_gravacao) {
      toast.warning('Informe a data da gravação.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        titulo: formData.titulo.trim(),
        tipo_conteudo: formData.tipo_conteudo,
        tipo_artista: formData.tipo_artista,
        artista_id: formData.tipo_artista === 'casting' && formData.artista_id ? formData.artista_id : null,
        artista_nome: formData.artista_nome.trim(),
        data_gravacao: formData.data_gravacao,
        prazo_entrega: formData.prazo_entrega || null,
        prioridade: formData.prioridade,
        status: formData.status,
        responsavel: formData.responsavel.trim() || null,
        link_arquivos: formData.link_arquivos.trim() || null,
        observacoes: formData.observacoes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingItem) {
        const { error } = await supabase
          .from('estudio_gravacoes')
          .update(payload)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Gravação atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('estudio_gravacoes')
          .insert({
            ...payload,
            criado_por: user?.id || null,
          });

        if (error) throw error;
        toast.success('Nova gravação cadastrada no estúdio!');
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      console.error('Erro ao salvar gravação:', err);
      toast.error('Erro ao salvar os dados da gravação.');
    } finally {
      setSaving(false);
    }
  };

  // Abrir Modal de Exclusão
  const handleOpenDeleteModal = (item: EstudioGravacao, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // Confirmar Exclusão
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('estudio_gravacoes')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;
      toast.success('Gravação removida com sucesso.');
      setShowDeleteModal(false);
      setItemToDelete(null);
      loadData();
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      toast.error('Erro ao excluir a gravação.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtragem dos Dados
  const filteredGravacoes = useMemo(() => {
    return gravacoes.filter((item) => {
      const matchesSearch =
        item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.artista_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.responsavel && item.responsavel.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.observacoes && item.observacoes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = filterStatus === 'todos' || item.status === filterStatus;
      const matchesPrioridade = filterPrioridade === 'todas' || item.prioridade === filterPrioridade;
      const matchesTipoArtista = filterTipoArtista === 'todos' || item.tipo_artista === filterTipoArtista;
      const matchesTipoConteudo = filterTipoConteudo === 'todos' || item.tipo_conteudo === filterTipoConteudo;

      return matchesSearch && matchesStatus && matchesPrioridade && matchesTipoArtista && matchesTipoConteudo;
    });
  }, [gravacoes, searchTerm, filterStatus, filterPrioridade, filterTipoArtista, filterTipoConteudo]);

  // Métricas / KPIs
  const stats = useMemo(() => {
    const total = gravacoes.length;
    const pendentes = gravacoes.filter(g => g.status === 'pendente' || g.status === 'em_edicao' || g.status === 'em_revisao').length;
    const entregues = gravacoes.filter(g => g.status === 'entregue').length;
    const urgentes = gravacoes.filter(g => (g.prioridade === 'urgente' || g.prioridade === 'alta') && g.status !== 'entregue' && g.status !== 'cancelado').length;
    
    const atrasadas = gravacoes.filter(g => {
      if (g.status === 'entregue' || g.status === 'cancelado' || !g.prazo_entrega) return false;
      const [y, m, d] = g.prazo_entrega.split('-').map(Number);
      const deadline = new Date(y, m - 1, d);
      deadline.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return deadline.getTime() < today.getTime();
    }).length;

    const totalTermosAssinados = termos.filter(t => t.status === 'assinado').length;

    return { total, pendentes, entregues, urgentes, atrasadas, totalTermosAssinados };
  }, [gravacoes, termos]);

  // Exportar para CSV
  const handleExportCSV = () => {
    if (filteredGravacoes.length === 0) {
      toast.warning('Nenhum registro para exportar.');
      return;
    }

    const headers = ['Título', 'Artista/Convidado', 'Tipo de Artista', 'Tipo de Conteúdo', 'Data Gravação', 'Prazo Entrega', 'Prioridade', 'Status', 'Termo de Imagem', 'Responsável', 'Link Arquivos', 'Observações'];
    const rows = filteredGravacoes.map(g => {
      const termo = getTermoForGravacao(g.id);
      return [
        `"${g.titulo.replace(/"/g, '""')}"`,
        `"${g.artista_nome.replace(/"/g, '""')}"`,
        `"${g.tipo_artista === 'casting' ? 'Céu Music' : 'Convidado'}"`,
        `"${TIPO_CONTEUDO_MAP[g.tipo_conteudo]?.label || g.tipo_conteudo}"`,
        `"${formatDateBR(g.data_gravacao)}"`,
        `"${g.prazo_entrega ? formatDateBR(g.prazo_entrega) : '-'}"`,
        `"${PRIORIDADE_MAP[g.prioridade]?.label || g.prioridade}"`,
        `"${STATUS_MAP[g.status]?.label || g.status}"`,
        `"${termo ? (termo.status === 'assinado' ? 'Assinado' : 'Pendente') : 'Não gerado'}"`,
        `"${(g.responsavel || '').replace(/"/g, '""')}"`,
        `"${(g.link_arquivos || '').replace(/"/g, '""')}"`,
        `"${(g.observacoes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `estudio-gravacoes-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório CSV exportado com sucesso!');
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-xl shadow-primary-teal/20 shrink-0">
              <i className="ri-mic-line text-2xl text-white"></i>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                  Estúdio
                </h1>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Operacional
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Gerencie gravações internas, artistas convidados, prazos, entregas e termos de uso de imagem
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Botão Novo Termo de Imagem */}
            <button
              onClick={() => handleOpenTermoModal(null)}
              className="px-4 py-2.5 bg-dark-card border border-teal-500/30 hover:border-teal-400 text-teal-300 hover:text-white rounded-xl text-sm font-semibold transition-smooth flex items-center gap-2 shadow-sm cursor-pointer"
              title="Gerar novo termo de autorização de imagem"
            >
              <i className="ri-shield-user-line text-base text-teal-400"></i>
              <span>Termo de Imagem</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-dark-card border border-dark-border hover:bg-dark-hover hover:border-gray-600 text-gray-300 rounded-xl text-sm font-medium transition-smooth flex items-center gap-2 shadow-sm cursor-pointer"
              title="Exportar dados filtrados para CSV"
            >
              <i className="ri-download-2-line text-base"></i>
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-6 py-2.5 bg-gradient-primary hover:opacity-95 text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary-teal/25 transition-smooth flex items-center gap-2 cursor-pointer"
            >
              <i className="ri-add-line text-lg"></i>
              <span>Nova Gravação</span>
            </button>
          </div>
        </div>

        {/* Cards de Métricas / KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Total */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-primary-teal/40 transition-smooth">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                <i className="ri-movie-line text-lg"></i>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{loading ? '...' : stats.total}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mt-1">Total Gravado</p>
          </div>

          {/* Em Produção */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-yellow-500/40 transition-smooth">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0">
                <i className="ri-time-line text-lg"></i>
              </div>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{loading ? '...' : stats.pendentes}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mt-1">Em Produção</p>
          </div>

          {/* Entregues */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-emerald-500/40 transition-smooth">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <i className="ri-checkbox-circle-line text-lg"></i>
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{loading ? '...' : stats.entregues}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mt-1">Entregues</p>
          </div>

          {/* Urgentes / Alta */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-orange-500/40 transition-smooth">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                <i className="ri-alarm-warning-line text-lg"></i>
              </div>
            </div>
            <p className="text-2xl font-bold text-orange-400">{loading ? '...' : stats.urgentes}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mt-1">Urgentes / Alta</p>
          </div>

          {/* Atrasadas */}
          <div className={`rounded-xl p-4 transition-smooth ${
            stats.atrasadas > 0
              ? 'bg-red-950/30 border border-red-500/40 hover:border-red-500'
              : 'bg-dark-card border border-dark-border hover:border-gray-700'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                stats.atrasadas > 0
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                <i className="ri-calendar-event-line text-lg"></i>
              </div>
            </div>
            <p className={`text-2xl font-bold ${stats.atrasadas > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
              {loading ? '...' : stats.atrasadas}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mt-1">Atrasadas</p>
          </div>
        </div>

        {/* Barra de Filtros e Visualização */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Campo de Busca */}
            <div className="relative flex-1 min-w-[280px]">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none"></i>
              <input
                type="text"
                placeholder="Buscar por gravação, artista, convidado, responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal focus:ring-1 focus:ring-primary-teal rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-smooth"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-base cursor-pointer"
                >
                  <i className="ri-close-circle-fill"></i>
                </button>
              )}
            </div>

            {/* Dropdowns de Filtro */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="Filtrar por status"
                className="px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-gray-200 outline-none cursor-pointer transition-smooth"
              >
                <option value="todos">Todos Status</option>
                <option value="pendente">⏳ Pendentes</option>
                <option value="em_edicao">✂️ Em Edição</option>
                <option value="em_revisao">👁️ Em Revisão</option>
                <option value="entregue">✅ Entregues</option>
                <option value="cancelado">❌ Cancelados</option>
              </select>

              <select
                value={filterPrioridade}
                onChange={(e) => setFilterPrioridade(e.target.value)}
                aria-label="Filtrar por prioridade"
                className="px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-gray-200 outline-none cursor-pointer transition-smooth"
              >
                <option value="todas">Todas Prioridades</option>
                <option value="urgente">🚨 Urgente</option>
                <option value="alta">🔥 Alta</option>
                <option value="media">🟡 Média</option>
                <option value="baixa">🟢 Baixa</option>
              </select>

              <select
                value={filterTipoArtista}
                onChange={(e) => setFilterTipoArtista(e.target.value)}
                aria-label="Filtrar por tipo de artista"
                className="px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-gray-200 outline-none cursor-pointer transition-smooth"
              >
                <option value="todos">Todos Artistas</option>
                <option value="casting">⭐ Céu Music</option>
                <option value="convidado">🎙️ Convidados</option>
              </select>

              {/* Switcher Tabela / Cards */}
              <div className="flex items-center bg-dark-bg p-1 rounded-xl border border-dark-border shrink-0 ml-auto sm:ml-0">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-smooth cursor-pointer ${
                    viewMode === 'table' ? 'bg-dark-card text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Visualização em Tabela"
                >
                  <i className="ri-table-line"></i>
                  <span className="hidden md:inline">Tabela</span>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-smooth cursor-pointer ${
                    viewMode === 'cards' ? 'bg-dark-card text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Visualização em Cards"
                >
                  <i className="ri-grid-fill"></i>
                  <span className="hidden md:inline">Cards</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filtro Rápido de Conteúdo */}
          <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-dark-border/60 text-xs custom-scrollbar">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mr-2 shrink-0">Conteúdo:</span>
            {['todos', 'reels', 'cover', 'youtube', 'clipes'].map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFilterTipoConteudo(tipo)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-smooth whitespace-nowrap cursor-pointer shrink-0 ${
                  filterTipoConteudo === tipo
                    ? 'bg-primary-teal/20 text-teal-300 border border-primary-teal/40'
                    : 'bg-dark-bg text-gray-400 hover:text-gray-200 border border-dark-border'
                }`}
              >
                {tipo === 'todos' ? 'Todos' : TIPO_CONTEUDO_MAP[tipo]?.label || tipo}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo Principal (Tabela ou Cards) */}
        {loading ? (
          <div className="bg-dark-card border border-dark-border rounded-2xl p-16 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-12 h-12 border-3 border-primary-teal border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-400">Carregando gravações do estúdio...</p>
          </div>
        ) : filteredGravacoes.length === 0 ? (
          <div className="bg-dark-card border border-dark-border rounded-2xl p-16 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-dark-hover flex items-center justify-center text-gray-500 mb-2">
              <i className="ri-disc-line text-3xl"></i>
            </div>
            <h3 className="text-lg font-bold text-white">Nenhuma gravação encontrada</h3>
            <p className="text-sm text-gray-400 max-w-md">
              {searchTerm || filterStatus !== 'todos' || filterPrioridade !== 'todas' || filterTipoArtista !== 'todos' || filterTipoConteudo !== 'todos'
                ? 'Nenhum resultado corresponde aos filtros selecionados. Tente ajustar os parâmetros.'
                : 'Nenhuma gravação cadastrada ainda. Clique em "Nova Gravação" para registrar o primeiro conteúdo.'}
            </p>
            {(searchTerm || filterStatus !== 'todos' || filterPrioridade !== 'todas' || filterTipoArtista !== 'todos' || filterTipoConteudo !== 'todos') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('todos');
                  setFilterPrioridade('todas');
                  setFilterTipoArtista('todos');
                  setFilterTipoConteudo('todos');
                }}
                className="mt-2 text-sm text-primary-teal hover:underline cursor-pointer font-medium"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* TABELA OTIMIZADA */
          <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1150px]">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-bg/80 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-4 w-14 text-center whitespace-nowrap">Entrega</th>
                    <th className="py-4 px-4 min-w-[240px] whitespace-nowrap">Conteúdo / Título</th>
                    <th className="py-4 px-4 whitespace-nowrap">Artista / Convidado</th>
                    <th className="py-4 px-4 whitespace-nowrap">Tipo</th>
                    <th className="py-4 px-4 whitespace-nowrap">Termo de Imagem</th>
                    <th className="py-4 px-4 whitespace-nowrap">Gravado em</th>
                    <th className="py-4 px-4 whitespace-nowrap">Prazo de Entrega</th>
                    <th className="py-4 px-4 whitespace-nowrap">Prioridade</th>
                    <th className="py-4 px-4 whitespace-nowrap">Status</th>
                    <th className="py-4 px-4 text-right whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/60 text-sm">
                  {filteredGravacoes.map((item) => {
                    const deadline = getDeadlineInfo(item.prazo_entrega, item.status);
                    const statusConfig = STATUS_MAP[item.status] || STATUS_MAP.pendente;
                    const prioridadeConfig = PRIORIDADE_MAP[item.prioridade] || PRIORIDADE_MAP.media;
                    const tipoConfig = TIPO_CONTEUDO_MAP[item.tipo_conteudo] || TIPO_CONTEUDO_MAP.outro;
                    const isEntregue = item.status === 'entregue';
                    const termo = getTermoForGravacao(item.id);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenEditModal(item)}
                        className={`group hover:bg-dark-hover/50 transition-smooth cursor-pointer ${
                          isEntregue ? 'opacity-75 bg-emerald-950/5' : ''
                        }`}
                      >
                        {/* Checkbox de Entrega */}
                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleToggleEntregue(item, e)}
                            title={isEntregue ? 'Marcar como Pendente' : 'Marcar como Entregue'}
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer mx-auto ${
                              isEntregue
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                : 'border-2 border-gray-600 bg-dark-bg hover:border-primary-teal'
                            }`}
                          >
                            {isEntregue ? (
                              <i className="ri-check-line font-bold text-sm text-white"></i>
                            ) : null}
                          </button>
                        </td>

                        {/* Conteúdo / Título */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className={`text-sm font-semibold ${isEntregue ? 'line-through text-gray-400' : 'text-white group-hover:text-teal-300 transition-colors'}`}>
                              {item.titulo}
                            </span>
                            {item.responsavel && (
                              <span className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                                <i className="ri-user-line text-xs"></i>
                                {item.responsavel}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Artista / Convidado */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-200 whitespace-nowrap">{item.artista_nome}</span>
                            {item.tipo_artista === 'convidado' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                                Convidado
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 whitespace-nowrap">
                                Céu Music
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Tipo de Conteúdo */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold bg-dark-bg border border-dark-border text-gray-300">
                            <i className={`${tipoConfig.icon} text-primary-teal text-sm`}></i>
                            {tipoConfig.label}
                          </span>
                        </td>

                        {/* Coluna Termo de Imagem */}
                        <td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {termo ? (
                            termo.status === 'assinado' ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenTermoModal(item, e)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                                  title="Ver Termo Assinado"
                                >
                                  <i className="ri-shield-check-fill text-emerald-400 text-sm"></i>
                                  <span>Assinado</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyTermoLink(termo, e)}
                                  className="p-1 text-gray-400 hover:text-white rounded hover:bg-dark-hover transition-colors"
                                  title="Copiar Link do Termo"
                                >
                                  <i className="ri-links-line text-xs"></i>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenTermoModal(item, e)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                                  title="Termo pendente de assinatura. Clique para abrir ou assinar."
                                >
                                  <i className="ri-time-line text-amber-400 text-sm"></i>
                                  <span>Pendente</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyTermoLink(termo, e)}
                                  className="p-1 text-teal-400 hover:text-white rounded hover:bg-dark-hover transition-colors"
                                  title="Copiar Link para Enviar ao Convidado"
                                >
                                  <i className="ri-share-forward-line text-xs"></i>
                                </button>
                              </div>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleOpenTermoModal(item, e)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-dark-bg border border-dark-border text-gray-400 hover:text-teal-300 hover:border-teal-500/40 transition-colors cursor-pointer"
                              title="Gerar Termo de Autorização de Imagem"
                            >
                              <i className="ri-quill-pen-line text-xs"></i>
                              <span>Gerar Termo</span>
                            </button>
                          )}
                        </td>

                        {/* Gravado em */}
                        <td className="py-4 px-4 text-gray-300 whitespace-nowrap text-sm font-medium">
                          {formatDateBR(item.data_gravacao)}
                        </td>

                        {/* Prazo de Entrega */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm text-gray-300 font-medium">
                              {item.prazo_entrega ? formatDateBR(item.prazo_entrega) : '-'}
                            </span>
                            {item.prazo_entrega && (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${deadline.badgeClass}`}>
                                <i className={`${deadline.icon} text-xs`}></i>
                                {deadline.label}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Prioridade */}
                        <td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="relative group/prio inline-block">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${prioridadeConfig.bg} ${prioridadeConfig.text} ${prioridadeConfig.border}`}>
                              <i className={`${prioridadeConfig.icon} text-xs`}></i>
                              {prioridadeConfig.label}
                            </span>
                            <div className="hidden group-hover/prio:flex absolute left-0 top-full mt-1 z-30 flex-col bg-dark-card border border-dark-border rounded-xl shadow-2xl p-1.5 w-36">
                              {(['urgente', 'alta', 'media', 'baixa'] as const).map((p) => (
                                <button
                                  key={p}
                                  onClick={(e) => handleUpdatePrioridade(item, p, e)}
                                  className={`text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-dark-hover transition-colors ${
                                    item.prioridade === p ? 'text-white font-bold bg-dark-hover' : 'text-gray-400'
                                  }`}
                                >
                                  <i className={`${PRIORIDADE_MAP[p].icon} ${PRIORIDADE_MAP[p].text}`}></i>
                                  {PRIORIDADE_MAP[p].label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                            <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></span>
                            {statusConfig.label}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botão de Termo de Imagem */}
                            <button
                              onClick={(e) => handleOpenTermoModal(item, e)}
                              title={termo?.status === 'assinado' ? 'Ver Termo de Imagem (Assinado)' : 'Gerenciar Termo de Imagem'}
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-smooth cursor-pointer ${
                                termo?.status === 'assinado'
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                  : 'bg-dark-bg border-dark-border hover:bg-dark-hover hover:text-teal-300 text-gray-400'
                              }`}
                            >
                              <i className="ri-shield-user-line text-base"></i>
                            </button>

                            {item.link_arquivos && (
                              <a
                                href={item.link_arquivos}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir link dos arquivos / Drive"
                                className="w-9 h-9 rounded-xl bg-dark-bg border border-dark-border hover:bg-dark-hover hover:text-teal-400 text-gray-400 flex items-center justify-center transition-smooth"
                              >
                                <i className="ri-folder-open-line text-base"></i>
                              </a>
                            )}

                            <button
                              onClick={(e) => handleOpenEditModal(item, e)}
                              title="Editar Demanda"
                              className="w-9 h-9 rounded-xl bg-dark-bg border border-dark-border hover:bg-dark-hover hover:text-white text-gray-400 flex items-center justify-center transition-smooth cursor-pointer"
                            >
                              <i className="ri-edit-line text-base"></i>
                            </button>

                            <button
                              onClick={(e) => handleOpenDeleteModal(item, e)}
                              title="Excluir Demanda"
                              className="w-9 h-9 rounded-xl bg-dark-bg border border-dark-border hover:bg-red-500/20 hover:text-red-400 text-gray-400 flex items-center justify-center transition-smooth cursor-pointer"
                            >
                              <i className="ri-delete-bin-line text-base"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CARDS OTIMIZADOS */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGravacoes.map((item) => {
              const deadline = getDeadlineInfo(item.prazo_entrega, item.status);
              const statusConfig = STATUS_MAP[item.status] || STATUS_MAP.pendente;
              const prioridadeConfig = PRIORIDADE_MAP[item.prioridade] || PRIORIDADE_MAP.media;
              const tipoConfig = TIPO_CONTEUDO_MAP[item.tipo_conteudo] || TIPO_CONTEUDO_MAP.outro;
              const isEntregue = item.status === 'entregue';
              const termo = getTermoForGravacao(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenEditModal(item)}
                  className={`bg-dark-card border border-dark-border rounded-2xl p-6 hover:border-gray-600 transition-smooth flex flex-col justify-between cursor-pointer group shadow-xl ${
                    isEntregue ? 'opacity-75 bg-emerald-950/5' : ''
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header do Card */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold bg-dark-bg border border-dark-border text-gray-300">
                        <i className={`${tipoConfig.icon} text-primary-teal text-sm`}></i>
                        {tipoConfig.label}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${prioridadeConfig.bg} ${prioridadeConfig.text} ${prioridadeConfig.border}`}>
                        <i className={`${prioridadeConfig.icon} text-xs`}></i>
                        {prioridadeConfig.label}
                      </span>
                    </div>

                    {/* Título & Artista */}
                    <div>
                      <h3 className={`text-lg font-bold line-clamp-2 ${isEntregue ? 'line-through text-gray-400' : 'text-white group-hover:text-teal-300 transition-colors'}`}>
                        {item.titulo}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <i className="ri-user-star-line text-sm text-primary-teal"></i>
                        <span className="text-sm font-semibold text-gray-300">{item.artista_nome}</span>
                        {item.tipo_artista === 'convidado' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Convidado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            Céu Music
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Termo de Imagem Badge */}
                    <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                      {termo ? (
                        termo.status === 'assinado' ? (
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs">
                            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                              <i className="ri-shield-check-fill text-sm"></i>
                              <span>Termo Assinado</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleOpenTermoModal(item, e)}
                              className="text-[11px] text-emerald-300 hover:underline font-semibold"
                            >
                              Ver Documento
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs">
                            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                              <i className="ri-time-line text-sm"></i>
                              <span>Termo Pendente</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleCopyTermoLink(termo, e)}
                              className="text-[11px] text-teal-400 hover:underline font-bold flex items-center gap-1"
                            >
                              <i className="ri-links-line"></i>
                              <span>Copiar Link</span>
                            </button>
                          </div>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleOpenTermoModal(item, e)}
                          className="w-full py-2 px-3 rounded-xl bg-dark-bg border border-dashed border-gray-700 text-gray-400 hover:text-teal-300 hover:border-teal-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <i className="ri-shield-user-line text-sm"></i>
                          <span>Gerar Termo de Imagem</span>
                        </button>
                      )}
                    </div>

                    {/* Observações */}
                    {item.observacoes && (
                      <p className="text-xs text-gray-400 bg-dark-bg/80 p-3 rounded-xl border border-dark-border/50 line-clamp-2">
                        {item.observacoes}
                      </p>
                    )}

                    {/* Datas e Prazos */}
                    <div className="pt-3 border-t border-dark-border/60 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 font-medium block">Gravado em</span>
                        <span className="text-gray-300 font-semibold">{formatDateBR(item.data_gravacao)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium block">Prazo de Entrega</span>
                        <span className="text-gray-300 font-semibold">
                          {item.prazo_entrega ? formatDateBR(item.prazo_entrega) : 'Não definido'}
                        </span>
                      </div>
                    </div>

                    {/* Alerta de Prazo */}
                    {item.prazo_entrega && (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${deadline.badgeClass}`}>
                        <i className={`${deadline.icon} text-sm`}></i>
                        <span>{deadline.label}</span>
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Card */}
                  <div className="pt-4 mt-4 border-t border-dark-border flex items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleToggleEntregue(item, e)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-smooth cursor-pointer ${
                        isEntregue
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-dark-bg text-gray-300 border border-dark-border hover:border-primary-teal hover:text-white'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center ${isEntregue ? 'bg-emerald-500 text-white' : 'border border-gray-600'}`}>
                        {isEntregue && <i className="ri-check-line text-xs font-bold"></i>}
                      </div>
                      <span>{isEntregue ? 'Entregue' : 'Marcar Entregue'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleOpenTermoModal(item, e)}
                        title="Termo de Imagem"
                        className="w-9 h-9 rounded-xl bg-dark-bg border border-dark-border hover:bg-dark-hover hover:text-teal-400 text-gray-400 flex items-center justify-center transition-smooth cursor-pointer"
                      >
                        <i className="ri-shield-user-line text-base"></i>
                      </button>

                      {item.link_arquivos && (
                        <a
                          href={item.link_arquivos}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir arquivos"
                          className="w-9 h-9 rounded-xl bg-dark-bg border border-dark-border hover:bg-dark-hover hover:text-teal-400 text-gray-400 flex items-center justify-center transition-smooth"
                        >
                          <i className="ri-folder-open-line text-base"></i>
                        </a>
                      )}
                      <button
                        onClick={(e) => handleOpenEditModal(item, e)}
                        title="Editar"
                        className="w-9 h-9 rounded-xl bg-dark-bg border border-dark-border hover:bg-dark-hover hover:text-white text-gray-400 flex items-center justify-center transition-smooth cursor-pointer"
                      >
                        <i className="ri-edit-line text-base"></i>
                      </button>
                      <button
                        onClick={(e) => handleOpenDeleteModal(item, e)}
                        title="Excluir"
                        className="w-9 h-9 rounded-xl bg-dark-bg border border-dark-border hover:bg-red-500/20 hover:text-red-400 text-gray-400 flex items-center justify-center transition-smooth cursor-pointer"
                      >
                        <i className="ri-delete-bin-line text-base"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL DE CADASTRO / EDIÇÃO DA GRAVAÇÃO */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div
              className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Fixo do Modal */}
              <div className="px-8 py-6 border-b border-dark-border flex items-center justify-between bg-dark-bg/60 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center text-white shrink-0 shadow-md">
                    <i className={editingItem ? 'ri-edit-line text-xl' : 'ri-mic-line text-xl'}></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingItem ? 'Editar Demanda de Gravação' : 'Nova Gravação no Estúdio'}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Preencha os detalhes e prazos da sessão</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-9 h-9 rounded-xl bg-dark-hover text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              {/* Corpo com Scroll do Modal */}
              <form onSubmit={handleSubmit} id="estudio-form" className="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                {/* Origem do Artista (Casting vs Convidado) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Origem do Artista
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        const defaultArtist = artistas.length > 0 ? artistas[0] : null;
                        setFormData({
                          ...formData,
                          tipo_artista: 'casting',
                          artista_id: defaultArtist ? defaultArtist.id : '',
                          artista_nome: defaultArtist ? defaultArtist.nome : '',
                        });
                      }}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                        formData.tipo_artista === 'casting'
                          ? 'bg-primary-teal/20 border-primary-teal text-white shadow-md'
                          : 'bg-dark-bg border-dark-border text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <i className="ri-user-star-line text-teal-400 text-lg"></i>
                      <span>Artista Céu Music</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          tipo_artista: 'convidado',
                          artista_id: '',
                          artista_nome: '',
                        });
                      }}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                        formData.tipo_artista === 'convidado'
                          ? 'bg-purple-500/20 border-purple-500 text-white shadow-md'
                          : 'bg-dark-bg border-dark-border text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <i className="ri-mic-line text-purple-400 text-lg"></i>
                      <span>Convidado Externo</span>
                    </button>
                  </div>
                </div>

                {/* Seleção ou Digitação do Artista */}
                {formData.tipo_artista === 'casting' ? (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-1">
                      Artista do Casting <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.artista_id}
                      onChange={(e) => {
                        const selected = artistas.find(a => a.id === e.target.value);
                        setFormData({
                          ...formData,
                          artista_id: e.target.value,
                          artista_nome: selected ? selected.nome : '',
                        });
                      }}
                      required
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white outline-none transition-colors"
                    >
                      <option value="">Selecione um artista...</option>
                      {artistas.map((art) => (
                        <option key={art.id} value={art.id}>
                          {art.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-1">
                      Nome do Artista / Convidado <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Pr. Lucas, Sarah Farias, Coral Kemuel..."
                      value={formData.artista_nome}
                      onChange={(e) => setFormData({ ...formData, artista_nome: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors"
                    />
                  </div>
                )}

                {/* Título e Tipo de Conteúdo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-1">
                      Título do Conteúdo / Gravação <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Live Session - Deus de Promessas"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-300">Tipo de Conteúdo</label>
                    <select
                      value={formData.tipo_conteudo}
                      onChange={(e: any) => setFormData({ ...formData, tipo_conteudo: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white outline-none transition-colors"
                    >
                      <option value="reels">Reels</option>
                      <option value="cover">Cover</option>
                      <option value="youtube">YouTube</option>
                      <option value="clipes">Clipes</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>

                {/* Datas: Gravação e Prazo de Entrega */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-1">
                      Data da Gravação <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.data_gravacao}
                      onChange={(e) => setFormData({ ...formData, data_gravacao: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-300">Prazo de Entrega (Previsão)</label>
                    <input
                      type="date"
                      value={formData.prazo_entrega}
                      onChange={(e) => setFormData({ ...formData, prazo_entrega: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Prioridade em Linha Horizontal */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Nível de Prioridade</label>
                  <div className="grid grid-cols-4 gap-3">
                    {(['urgente', 'alta', 'media', 'baixa'] as const).map((p) => {
                      const cfg = PRIORIDADE_MAP[p];
                      const isSelected = formData.prioridade === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData({ ...formData, prioridade: p })}
                          className={`py-3 px-2 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? cfg.activeBg
                              : 'bg-dark-bg border-dark-border text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          <i className={`${cfg.icon} text-sm`}></i>
                          <span className="capitalize">{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status e Responsável */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-300">Status Inicial</label>
                    <select
                      value={formData.status}
                      onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white outline-none transition-colors"
                    >
                      <option value="pendente">⏳ Pendente</option>
                      <option value="em_edicao">✂️ Em Edição</option>
                      <option value="em_revisao">👁️ Em Revisão</option>
                      <option value="entregue">✅ Entregue</option>
                      <option value="cancelado">❌ Cancelado</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-300">Responsável pela Edição</label>
                    <input
                      type="text"
                      placeholder="Ex: João Silva (Editor)"
                      value={formData.responsavel}
                      onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Link dos Arquivos */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-300">Link dos Arquivos / Drive / Nuvem</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={formData.link_arquivos}
                    onChange={(e) => setFormData({ ...formData, link_arquivos: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors"
                  />
                </div>

                {/* Observações */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-300">Observações / Notas do Estúdio</label>
                  <textarea
                    rows={3}
                    placeholder="Instruções de corte, minutagens, observações técnicas..."
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-colors resize-none"
                  ></textarea>
                </div>
              </form>

              {/* Rodapé Fixo do Modal */}
              <div className="px-8 py-5 border-t border-dark-border flex items-center justify-end gap-3 bg-dark-bg/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-5 py-2.5 bg-dark-hover hover:bg-dark-border text-gray-300 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="estudio-form"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-primary hover:opacity-95 text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary-teal/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving && <i className="ri-loader-4-line animate-spin"></i>}
                  <span>{editingItem ? 'Salvar Alterações' : 'Cadastrar Demanda'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
        {showDeleteModal && itemToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <i className="ri-delete-bin-line text-2xl"></i>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-white">Excluir Demanda?</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Tem certeza que deseja remover <strong className="text-white font-medium">{itemToDelete.titulo}</strong> ({itemToDelete.artista_nome})?
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2.5 bg-dark-hover hover:bg-dark-border text-gray-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {deleting && <i className="ri-loader-4-line animate-spin"></i>}
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE TERMO DE USO DE IMAGEM */}
        {showTermoModal && (
          <TermoUsoModal
            isOpen={showTermoModal}
            onClose={() => {
              setShowTermoModal(false);
              setSelectedTermoId(null);
              setSelectedTermoGravacaoId(null);
              setTermoInitialData(null);
            }}
            onSuccess={() => {
              loadData();
            }}
            gravacaoId={selectedTermoGravacaoId}
            termoId={selectedTermoId}
            initialData={termoInitialData}
          />
        )}
      </div>
    </MainLayout>
  );
}
