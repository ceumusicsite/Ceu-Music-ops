import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import SignaturePad from '../estudio/SignaturePad';
import TermoParticipanteContent, {
  ProjetoParticipanteData,
  TIPOS_PARTICIPACAO_LABELS,
} from './TermoParticipanteContent';

interface FaixaOption {
  id: string;
  nome: string;
  ordem?: number;
}

interface TermoParticipanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  projetoId: string;
  projetoNome: string;
  artistaNome: string;
  faixas: FaixaOption[];
  participanteId?: string | null;
  initialData?: Partial<ProjetoParticipanteData> | null;
  mode?: 'create' | 'edit' | 'view' | 'sign';
}

const INSTRUMENTOS_SUGESTOES = [
  'Bateria',
  'Baixo Elétrico',
  'Baixo Acústico',
  'Guitarra Elétrica',
  'Violão de Aço',
  'Violão de Nylon',
  'Teclados / Sintetizadores',
  'Piano Acústico',
  'Órgão Hammond',
  'Percussão Geral',
  'Metais / Sopros',
  'Saxofone',
  'Trompete',
  'Trombone',
  'Cordas / Violino',
  'Cello',
  'Voz Principal',
  'Backing Vocal',
  'Coral',
  'Produção Musical',
  'Arranjos',
  'Programação de Bateria',
  'Mixagem',
  'Masterização',
  'Engenharia de Gravação',
];

export default function TermoParticipanteModal({
  isOpen,
  onClose,
  onSuccess,
  projetoId,
  projetoNome,
  artistaNome,
  faixas,
  participanteId,
  initialData,
  mode = 'create',
}: TermoParticipanteModalProps) {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentTab, setCurrentTab] = useState<'dados' | 'documento' | 'assinatura'>('dados');

  const [formData, setFormData] = useState<ProjetoParticipanteData>({
    projeto_id: projetoId,
    projeto_nome: projetoNome,
    artista_nome: artistaNome,
    faixas_ids: [],
    faixas_nomes: [],
    tipo_participacao: 'musico',
    tipo_participacao_outro: '',
    funcao_instrumento: '',
    autorizante_nome: '',
    autorizante_nome_artistico: '',
    autorizante_cpf: '',
    autorizante_rg: '',
    autorizante_nacionalidade: 'Brasileiro(a)',
    autorizante_estado_civil: '',
    autorizante_profissao: 'Músico(a)',
    autorizante_endereco: '',
    autorizante_email: '',
    autorizante_telefone: '',
    autorizante_pix: '',
    status: 'pendente',
    declaracao_concordancia: false,
    assinatura_digital: null,
    observacoes: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (participanteId) {
        loadParticipante(participanteId);
      } else if (initialData) {
        setFormData({
          ...formData,
          ...initialData,
          projeto_id: projetoId,
          projeto_nome: projetoNome,
          artista_nome: artistaNome,
        });
        if (mode === 'view' || mode === 'sign') {
          setCurrentTab(mode === 'sign' ? 'assinatura' : 'documento');
        } else {
          setCurrentTab('dados');
        }
      } else {
        // Reset novo
        setFormData({
          projeto_id: projetoId,
          projeto_nome: projetoNome,
          artista_nome: artistaNome,
          faixas_ids: [],
          faixas_nomes: [],
          tipo_participacao: 'musico',
          tipo_participacao_outro: '',
          funcao_instrumento: '',
          autorizante_nome: '',
          autorizante_nome_artistico: '',
          autorizante_cpf: '',
          autorizante_rg: '',
          autorizante_nacionalidade: 'Brasileiro(a)',
          autorizante_estado_civil: '',
          autorizante_profissao: 'Músico(a)',
          autorizante_endereco: '',
          autorizante_email: '',
          autorizante_telefone: '',
          autorizante_pix: '',
          status: 'pendente',
          declaracao_concordancia: false,
          assinatura_digital: null,
          observacoes: '',
        });
        setCurrentTab('dados');
      }
    }
  }, [isOpen, participanteId, initialData, mode]);

  const loadParticipante = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projeto_participantes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        // Mapear nomes de faixas
        const faixasNomes = (data.faixas_ids || [])
          .map((fId: string) => faixas.find((f) => f.id === fId)?.nome)
          .filter(Boolean);

        setFormData({
          ...data,
          projeto_nome: projetoNome,
          artista_nome: artistaNome,
          faixas_nomes: faixasNomes,
        });

        if (data.status === 'assinado') {
          setCurrentTab('documento');
        } else if (mode === 'sign') {
          setCurrentTab('assinatura');
        } else if (mode === 'view') {
          setCurrentTab('documento');
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar participante:', err);
      toast.error('Erro ao carregar dados do participante.');
    } finally {
      setLoading(false);
    }
  };

  const generateToken = () => {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `ceu_part_${randomHex}`;
  };

  const getPublicUrl = () => {
    if (!formData.token) return '';
    const origin = window.location.origin;
    return `${origin}/public/participante/${formData.token}`;
  };

  const handleCopyLink = () => {
    const url = getPublicUrl();
    if (!url) {
      toast.error('Gere ou salve o participante primeiro para criar o link.');
      return;
    }
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Link de assinatura copiado com sucesso!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const url = getPublicUrl();
    if (!url) {
      toast.error('Gere ou salve o participante primeiro para criar o link.');
      return;
    }
    const nome = formData.autorizante_nome || 'Músico(a)';
    const text = encodeURIComponent(
      `Olá, ${nome}! Segue o link para assinatura da Ficha Técnica e Termo de Autorização/Cessão de Direitos para o projeto "${projetoNome}" da Céu Music:\n\n${url}\n\nPor favor, confira seus dados e assine digitalmente pelo celular.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFaixaToggle = (faixaId: string) => {
    const current = formData.faixas_ids || [];
    const exists = current.includes(faixaId);
    const updated = exists ? current.filter((id) => id !== faixaId) : [...current, faixaId];
    const faixasNomes = updated
      .map((fId) => faixas.find((f) => f.id === fId)?.nome)
      .filter(Boolean) as string[];

    setFormData({
      ...formData,
      faixas_ids: updated,
      faixas_nomes: faixasNomes,
    });
  };

  const handleSelectAllFaixas = () => {
    const allIds = faixas.map((f) => f.id);
    const allNomes = faixas.map((f) => f.nome);
    setFormData({
      ...formData,
      faixas_ids: allIds,
      faixas_nomes: allNomes,
    });
  };

  const handleClearFaixas = () => {
    setFormData({
      ...formData,
      faixas_ids: [],
      faixas_nomes: [],
    });
  };

  const handleSave = async (signNow = false) => {
    if (!formData.autorizante_nome.trim()) {
      toast.error('Informe o nome completo do participante.');
      return;
    }
    if (!formData.funcao_instrumento.trim()) {
      toast.error('Informe a função ou instrumento do participante.');
      return;
    }

    if (signNow && !formData.assinatura_digital) {
      toast.error('Desenhe a assinatura no campo correspondente antes de assinar.');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const tokenToUse = formData.token || generateToken();

      const payload: any = {
        projeto_id: projetoId,
        faixas_ids: formData.faixas_ids || [],
        tipo_participacao: formData.tipo_participacao || 'musico',
        tipo_participacao_outro: formData.tipo_participacao_outro || null,
        funcao_instrumento: formData.funcao_instrumento.trim(),
        autorizante_nome: formData.autorizante_nome.trim(),
        autorizante_nome_artistico: formData.autorizante_nome_artistico?.trim() || null,
        autorizante_cpf: formData.autorizante_cpf?.trim() || null,
        autorizante_rg: formData.autorizante_rg?.trim() || null,
        autorizante_nacionalidade: formData.autorizante_nacionalidade?.trim() || 'Brasileiro(a)',
        autorizante_estado_civil: formData.autorizante_estado_civil?.trim() || null,
        autorizante_profissao: formData.autorizante_profissao?.trim() || 'Músico(a)',
        autorizante_endereco: formData.autorizante_endereco?.trim() || null,
        autorizante_email: formData.autorizante_email?.trim() || null,
        autorizante_telefone: formData.autorizante_telefone?.trim() || null,
        autorizante_pix: formData.autorizante_pix?.trim() || null,
        observacoes: formData.observacoes?.trim() || null,
        updated_at: now,
      };

      if (signNow) {
        payload.status = 'assinado';
        payload.declaracao_concordancia = true;
        payload.assinatura_digital = formData.assinatura_digital;
        payload.aceito_em = now;
        payload.ip_origem = 'Assinado no Painel Studio (Presencial)';
        payload.user_agent = navigator.userAgent;
      } else if (!formData.id) {
        payload.token = tokenToUse;
        payload.status = 'pendente';
        payload.declaracao_concordancia = false;
        payload.termo_versao = '1.0';
        payload.criado_por = user?.id || null;
      }

      let resData;
      if (formData.id) {
        const { data, error } = await supabase
          .from('projeto_participantes')
          .update(payload)
          .eq('id', formData.id)
          .select()
          .single();

        if (error) throw error;
        resData = data;
        toast.success(signNow ? 'Termo assinado com sucesso!' : 'Participante atualizado com sucesso!');
      } else {
        payload.token = tokenToUse;
        const { data, error } = await supabase
          .from('projeto_participantes')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        resData = data;
        toast.success('Participante cadastrado com sucesso!');
      }

      setFormData((prev) => ({ ...prev, ...resData }));
      if (onSuccess) onSuccess();

      if (signNow || resData.status === 'assinado') {
        setCurrentTab('documento');
      } else {
        onClose();
      }
    } catch (err: any) {
      console.error('Erro ao salvar participante:', err);
      toast.error(err.message || 'Erro ao salvar informações do participante.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between bg-dark-bg/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <i className="ri-user-star-line text-xl"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {formData.id ? (formData.status === 'assinado' ? 'Termo de Participante (Assinado)' : 'Editar Participante') : 'Novo Participante & Ficha Técnica'}
                {formData.status === 'assinado' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                    <i className="ri-checkbox-circle-fill"></i>
                    Assinado
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400">
                {projetoNome} • {artistaNome}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Tabs de Navegação */}
        <div className="flex border-b border-dark-border px-6 bg-dark-bg/30">
          <button
            onClick={() => setCurrentTab('dados')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              currentTab === 'dados'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <i className="ri-file-user-line"></i>
            Dados e Ficha Técnica
          </button>
          <button
            onClick={() => setCurrentTab('documento')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              currentTab === 'documento'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <i className="ri-file-text-line"></i>
            Visualizar Termo Jurídico
          </button>
          {formData.status !== 'assinado' && (
            <button
              onClick={() => setCurrentTab('assinatura')}
              className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                currentTab === 'assinatura'
                  ? 'border-teal-400 text-teal-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <i className="ri-edit-2-line"></i>
              Assinar Agora (Presencial)
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400 text-xs font-medium">Carregando participante...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: DADOS */}
              {currentTab === 'dados' && (
                <div className="space-y-6">
                  {/* Seção 1: Papel e Instrumento */}
                  <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <i className="ri-music-2-line text-teal-400"></i>
                      Função no Projeto & Ficha Técnica
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1.5">
                          Tipo de Participação <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={formData.tipo_participacao}
                          onChange={(e) =>
                            setFormData({ ...formData, tipo_participacao: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-teal-400"
                        >
                          {Object.entries(TIPOS_PARTICIPACAO_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formData.tipo_participacao === 'outro' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1.5">
                            Especifique o Tipo <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.tipo_participacao_outro || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, tipo_participacao_outro: e.target.value })
                            }
                            placeholder="Ex: Engenheiro de Master, Roadie, etc."
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-teal-400"
                          />
                        </div>
                      )}

                      <div className={formData.tipo_participacao === 'outro' ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-medium text-gray-300 mb-1.5">
                          Instrumento / Execução <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.funcao_instrumento}
                          onChange={(e) =>
                            setFormData({ ...formData, funcao_instrumento: e.target.value })
                          }
                          placeholder="Ex: Bateria, Violão de Aço, Backing Vocal, Teclados..."
                          className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-teal-400"
                        />
                        {/* Sugestões rápidas de instrumento */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {INSTRUMENTOS_SUGESTOES.slice(0, 8).map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => setFormData({ ...formData, funcao_instrumento: sug })}
                              className="text-[11px] px-2 py-0.5 bg-dark-card border border-dark-border rounded text-gray-400 hover:text-white hover:border-teal-400/50 transition-colors"
                            >
                              + {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Seleção de Faixas */}
                    {faixas.length > 0 ? (
                      <div className="pt-2 border-t border-dark-border/40">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-medium text-gray-300">
                            Faixas em que participou ou vai participar:
                          </label>
                          <div className="flex gap-2 text-[11px]">
                            <button
                              type="button"
                              onClick={handleSelectAllFaixas}
                              className="text-teal-400 hover:underline cursor-pointer"
                            >
                              Selecionar Todas
                            </button>
                            <span className="text-gray-500">•</span>
                            <button
                              type="button"
                              onClick={handleClearFaixas}
                              className="text-gray-400 hover:underline cursor-pointer"
                            >
                              Limpar
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {faixas.map((fx) => {
                            const isSelected = (formData.faixas_ids || []).includes(fx.id);
                            return (
                              <button
                                key={fx.id}
                                type="button"
                                onClick={() => handleFaixaToggle(fx.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-teal-500/10 border-teal-500/40 text-teal-300'
                                    : 'bg-dark-bg border-dark-border text-gray-400 hover:text-gray-200'
                                }`}
                              >
                                <i
                                  className={
                                    isSelected
                                      ? 'ri-checkbox-circle-fill text-teal-400'
                                      : 'ri-checkbox-blank-circle-line text-gray-500'
                                  }
                                ></i>
                                <span className="truncate">{fx.nome}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-dark-bg border border-dark-border/40 rounded-lg text-xs text-gray-400 flex items-center gap-2">
                        <i className="ri-information-line text-teal-400 text-base shrink-0"></i>
                        <span>Este projeto ainda não possui faixas cadastradas. A participação e autorização são válidas para o projeto como um todo.</span>
                      </div>
                    )}
                  </div>

                  {/* Seção 2: Dados Pessoais e Cadastrais */}
                  <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <i className="ri-id-card-line text-teal-400"></i>
                      Dados Pessoais e Jurídicos do Participante
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1.5">
                          Nome Civil Completo <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.autorizante_nome}
                          onChange={(e) =>
                            setFormData({ ...formData, autorizante_nome: e.target.value })
                          }
                          placeholder="Nome completo para contrato"
                          className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-teal-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1.5">
                          Nome Artístico / Como deseja ser creditado
                        </label>
                        <input
                          type="text"
                          value={formData.autorizante_nome_artistico || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, autorizante_nome_artistico: e.target.value })
                          }
                          placeholder="Ex: Beto Batera (deixe vazio se for igual ao civil)"
                          className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-teal-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1.5">
                          CPF <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.autorizante_cpf || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, autorizante_cpf: e.target.value })
                          }
                          placeholder="000.000.000-00"
                          className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-teal-400 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1.5">
                          RG / Órgão Emissor
                        </label>
                        <input
                          type="text"
                          value={formData.autorizante_rg || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, autorizante_rg: e.target.value })
                          }
                          placeholder="Ex: 12.345.678-9 SSP/RJ"
                          className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-teal-400 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1.5">
                          WhatsApp / Telefone
                        </label>
                        <input
                          type="tel"
                          value={formData.autorizante_telefone || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, autorizante_telefone: e.target.value })
                          }
                          placeholder="(21) 99999-9999"
                          className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-teal-400 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1.5">
                          E-mail
                        </label>
                        <input
                          type="email"
                          value={formData.autorizante_email || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, autorizante_email: e.target.value })
                          }
                          placeholder="musico@email.com"
                          className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-teal-400"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-300 mb-1.5">
                          Endereço Completo
                        </label>
                        <input
                          type="text"
                          value={formData.autorizante_endereco || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, autorizante_endereco: e.target.value })
                          }
                          placeholder="Rua, Número, Complemento, Bairro, Cidade - UF, CEP"
                          className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-teal-400"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-300 mb-1.5">
                          Chave PIX / Dados Bancários (para eventuais pagamentos/cachês)
                        </label>
                        <input
                          type="text"
                          value={formData.autorizante_pix || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, autorizante_pix: e.target.value })
                          }
                          placeholder="Chave PIX (CPF, E-mail, Celular ou Aleatória) e Banco"
                          className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-teal-400 font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-300 mb-1.5">
                          Observações Internas (opcional)
                        </label>
                        <textarea
                          rows={2}
                          value={formData.observacoes || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, observacoes: e.target.value })
                          }
                          placeholder="Ex: Contratado via produtor fulano, cachê acertado..."
                          className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-teal-400 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DOCUMENTO JURÍDICO */}
              {currentTab === 'documento' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-dark-bg/80 p-3 rounded-xl border border-dark-border">
                    <span className="text-xs text-gray-300">
                      Visualização formatada para conferência e impressão jurídica.
                    </span>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <i className="ri-printer-line"></i>
                      Imprimir / Salvar PDF
                    </button>
                  </div>

                  <div className="bg-dark-bg/90 p-6 rounded-2xl border border-dark-border">
                    <TermoParticipanteContent data={formData} />
                  </div>
                </div>
              )}

              {/* TAB 3: ASSINATURA ELETRÔNICA MANUAL (PRESENCIAL) */}
              {currentTab === 'assinatura' && formData.status !== 'assinado' && (
                <div className="space-y-6">
                  <div className="bg-teal-500/10 border border-teal-500/20 p-4 rounded-xl text-teal-300 text-xs flex items-start gap-3">
                    <i className="ri-information-line text-lg mt-0.5 flex-shrink-0"></i>
                    <div>
                      <p className="font-bold">Assinatura Presencial no Estúdio:</p>
                      <p className="text-teal-400/80">
                        O participante pode ler e assinar diretamente nesta tela usando o dedo no tablet/smartphone ou mouse no computador.
                      </p>
                    </div>
                  </div>

                  <div className="bg-dark-bg p-4 rounded-xl border border-dark-border space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Desenhe a Assinatura do Participante ({formData.autorizante_nome || 'Músico'}):
                    </h4>
                    <SignaturePad
                      onSave={(sig) => setFormData({ ...formData, assinatura_digital: sig })}
                      initialSignature={formData.assinatura_digital}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-dark-border flex flex-wrap items-center justify-between gap-3 bg-dark-bg/80">
          {formData.token ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 bg-dark-card hover:bg-dark-hover border border-dark-border rounded-lg text-xs font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
                title="Copiar link individual de assinatura"
              >
                <i className={copiedLink ? 'ri-check-line text-teal-400' : 'ri-file-copy-line'}></i>
                <span>{copiedLink ? 'Copiado!' : 'Copiar Link de Assinatura'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-xs font-bold text-green-400 transition-colors flex items-center gap-1.5"
              >
                <i className="ri-whatsapp-line"></i>
                <span>Enviar no WhatsApp</span>
              </button>
            </div>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>

            {currentTab === 'assinatura' && formData.status !== 'assinado' ? (
              <button
                type="button"
                disabled={saving || !formData.assinatura_digital}
                onClick={() => handleSave(true)}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Gravando Assinatura...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-checkbox-circle-line"></i>
                    <span>Confirmar Assinatura Digital</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-save-line"></i>
                    <span>{formData.id ? 'Salvar Alterações' : 'Cadastrar Participante'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
