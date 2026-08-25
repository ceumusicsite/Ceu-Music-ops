import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import SignaturePad from './SignaturePad';
import TermoUsoContent, { TermoUsoData } from './TermoUsoContent';

interface TermoUsoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  gravacaoId?: string | null;
  initialData?: Partial<TermoUsoData> | null;
  termoId?: string | null;
  mode?: 'create' | 'view' | 'sign';
}

export default function TermoUsoModal({
  isOpen,
  onClose,
  onSuccess,
  gravacaoId,
  initialData,
  termoId,
  mode = 'create',
}: TermoUsoModalProps) {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [termoData, setTermoData] = useState<TermoUsoData>({
    projeto_nome: initialData?.projeto_nome || '',
    artista_principal: initialData?.artista_principal || 'Céu Music',
    data_gravacao: initialData?.data_gravacao || new Date().toISOString().split('T')[0],
    local_gravacao: initialData?.local_gravacao || 'Estúdio Céu Music - Rio de Janeiro, RJ',
    tipo_participacao: initialData?.tipo_participacao || 'Convidado',
    tipo_participacao_outro: initialData?.tipo_participacao_outro || '',
    autorizante_nome: initialData?.autorizante_nome || '',
    autorizante_nome_artistico: initialData?.autorizante_nome_artistico || '',
    autorizante_cpf: initialData?.autorizante_cpf || '',
    autorizante_rg: initialData?.autorizante_rg || '',
    autorizante_endereco: initialData?.autorizante_endereco || '',
    autorizante_email: initialData?.autorizante_email || '',
    autorizante_telefone: initialData?.autorizante_telefone || '',
    status: 'pendente',
    declaracao_concordancia: false,
    assinatura_digital: null,
  });

  const [currentTab, setCurrentTab] = useState<'dados' | 'documento' | 'assinatura'>('dados');
  const [copiedLink, setCopiedLink] = useState(false);

  // Carregar termo existente se termoId for passado
  useEffect(() => {
    if (termoId && isOpen) {
      loadTermo(termoId);
    } else if (gravacaoId && isOpen && mode === 'create') {
      loadGravacaoDetails(gravacaoId);
    }
  }, [termoId, gravacaoId, isOpen]);

  const loadTermo = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('estudio_termos_uso')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setTermoData(data);
        if (data.status === 'assinado') {
          setCurrentTab('documento');
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar termo:', err);
      toast.error('Não foi possível carregar os dados do termo.');
    } finally {
      setLoading(false);
    }
  };

  const loadGravacaoDetails = async (gId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('estudio_gravacoes')
        .select('*')
        .eq('id', gId)
        .single();

      if (error) throw error;
      if (data) {
        setTermoData((prev) => ({
          ...prev,
          projeto_nome: data.titulo || '',
          artista_principal: data.artista_nome || 'Céu Music',
          data_gravacao: data.data_gravacao || new Date().toISOString().split('T')[0],
          autorizante_nome: data.tipo_artista === 'convidado' ? data.artista_nome : '',
          autorizante_nome_artistico: data.tipo_artista === 'convidado' ? data.artista_nome : '',
        }));
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes da gravação:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateToken = () => {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `ceu_termo_${randomHex}`;
  };

  const getPublicUrl = () => {
    if (!termoData.token) return '';
    const origin = window.location.origin;
    return `${origin}/public/termo/${termoData.token}`;
  };

  const handleCopyLink = () => {
    const url = getPublicUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Link do termo copiado com sucesso!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const url = getPublicUrl();
    if (!url) return;
    const text = encodeURIComponent(
      `Olá ${termoData.autorizante_nome || ''}! Segue o link para assinatura do Termo de Autorização e Licença de Uso de Imagem para a gravação na Céu Music:\n\n${url}\n\nPor favor, preencha seus dados e assine digitalmente.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  // Salvar / Gerar Termo
  const handleSaveTermo = async (signNow = false) => {
    if (!termoData.projeto_nome.trim()) {
      toast.warning('Informe o nome do projeto ou sessão.');
      return;
    }
    if (!termoData.autorizante_nome.trim()) {
      toast.warning('Informe o nome completo do autorizante/convidado.');
      return;
    }

    if (signNow) {
      if (!termoData.declaracao_concordancia) {
        toast.warning('É necessário marcar a declaração de concordância com os termos.');
        return;
      }
      if (!termoData.assinatura_digital) {
        toast.warning('Por favor, desenhe a assinatura digital no campo indicado.');
        return;
      }
    }

    setSaving(true);
    try {
      const token = termoData.token || generateToken();
      const payload: any = {
        gravacao_id: gravacaoId || null,
        token,
        projeto_nome: termoData.projeto_nome.trim(),
        artista_principal: termoData.artista_principal?.trim() || null,
        data_gravacao: termoData.data_gravacao || null,
        local_gravacao: termoData.local_gravacao?.trim() || 'Estúdio Céu Music - Rio de Janeiro, RJ',
        tipo_participacao: termoData.tipo_participacao || 'Convidado',
        tipo_participacao_outro: termoData.tipo_participacao_outro?.trim() || null,
        autorizante_nome: termoData.autorizante_nome.trim(),
        autorizante_nome_artistico: termoData.autorizante_nome_artistico?.trim() || null,
        autorizante_cpf: termoData.autorizante_cpf?.trim() || null,
        autorizante_rg: termoData.autorizante_rg?.trim() || null,
        autorizante_endereco: termoData.autorizante_endereco?.trim() || null,
        autorizante_email: termoData.autorizante_email?.trim() || null,
        autorizante_telefone: termoData.autorizante_telefone?.trim() || null,
        declaracao_concordancia: Boolean(termoData.declaracao_concordancia),
        termo_versao: '1.0',
        updated_at: new Date().toISOString(),
      };

      if (signNow) {
        payload.status = 'assinado';
        payload.aceito_em = new Date().toISOString();
        payload.assinatura_digital = termoData.assinatura_digital;
        payload.ip_origem = 'Assinatura Presencial (Painel Céu Music)';
        payload.user_agent = navigator.userAgent;
      } else {
        payload.status = termoData.status || 'pendente';
      }

      if (termoData.id) {
        const { error } = await supabase
          .from('estudio_termos_uso')
          .update(payload)
          .eq('id', termoData.id);

        if (error) throw error;
        toast.success(signNow ? 'Termo assinado e registrado com sucesso!' : 'Termo atualizado!');
      } else {
        payload.criado_por = user?.id || null;
        const { data, error } = await supabase
          .from('estudio_termos_uso')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        setTermoData(data);
        toast.success(signNow ? 'Termo gerado e assinado com sucesso!' : 'Termo criado! Link pronto para envio.');
      }

      if (onSuccess) onSuccess();
      if (signNow) {
        setCurrentTab('documento');
      }
    } catch (err: any) {
      console.error('Erro ao salvar termo:', err);
      toast.error('Erro ao salvar dados do termo de imagem.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in print:p-0 print:bg-white print:static">
      <div
        className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Fixo */}
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between bg-dark-bg/80 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white shrink-0 shadow-md">
              <i className="ri-shield-user-line text-xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {termoData.status === 'assinado'
                    ? 'Termo de Autorização de Imagem (Assinado)'
                    : 'Termo de Autorização de Imagem Céu Music'}
                </h2>
                {termoData.status === 'assinado' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Assinado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Pendente
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Licença de uso de imagem, voz, nome e performance artística
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {termoData.token && (
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-dark-bg hover:bg-dark-hover border border-dark-border text-xs font-semibold text-teal-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copiar link público para o signatário"
              >
                <i className={copiedLink ? 'ri-check-line text-emerald-400' : 'ri-links-line'}></i>
                <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-dark-hover text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Barra de Navegação entre Abas */}
        <div className="px-6 py-2.5 bg-dark-bg/60 border-b border-dark-border flex items-center justify-between gap-2 shrink-0 print:hidden text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentTab('dados')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'dados'
                  ? 'bg-primary-teal/20 text-teal-300 border border-primary-teal/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="ri-user-settings-line"></i>
              <span>1. Dados & Projeto</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('documento')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'documento'
                  ? 'bg-primary-teal/20 text-teal-300 border border-primary-teal/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="ri-file-text-line"></i>
              <span>2. Visualizar Documento</span>
            </button>

            {termoData.status !== 'assinado' && (
              <button
                type="button"
                onClick={() => setCurrentTab('assinatura')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'assinatura'
                    ? 'bg-primary-teal/20 text-teal-300 border border-primary-teal/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <i className="ri-quill-pen-line"></i>
                <span>3. Assinar Presencialmente</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors cursor-pointer"
              title="Imprimir / Salvar PDF"
            >
              <i className="ri-printer-line text-base"></i>
            </button>
            {termoData.token && (
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                title="Compartilhar via WhatsApp"
              >
                <i className="ri-whatsapp-line text-base"></i>
              </button>
            )}
          </div>
        </div>

        {/* Link Compartilhável em Destaque (Se já gerado) */}
        {termoData.token && termoData.status !== 'assinado' && (
          <div className="px-6 py-2.5 bg-teal-950/20 border-b border-teal-500/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0 print:hidden text-xs">
            <div className="flex items-center gap-2 text-teal-300">
              <i className="ri-share-forward-line text-base"></i>
              <span>
                <strong>Link de Assinatura Online:</strong> Envie para o autorizante assinar no próprio celular
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={getPublicUrl()}
                className="px-2.5 py-1 bg-dark-bg border border-dark-border rounded text-[11px] text-gray-300 select-all outline-none w-48 sm:w-64 font-mono truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 bg-primary-teal hover:opacity-90 text-white font-bold rounded text-[11px] transition-all cursor-pointer whitespace-nowrap"
              >
                {copiedLink ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-primary-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-gray-400">Carregando dados do termo...</p>
            </div>
          ) : currentTab === 'dados' ? (
            /* Formulário de Dados */
            <div className="space-y-5">
              {/* Seção 1: Identificação do Projeto */}
              <div className="space-y-3 bg-dark-bg/60 p-4 rounded-xl border border-dark-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <i className="ri-folder-music-line"></i>
                  Identificação do Projeto / Sessão
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">
                      Projeto / Produção / Título <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Gravação Live Session - Arthur Callazans"
                      value={termoData.projeto_nome}
                      onChange={(e) => setTermoData({ ...termoData, projeto_nome: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-lg text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Artista(s) Principal</label>
                    <input
                      type="text"
                      placeholder="Ex: Céu Music / Arthur Callazans"
                      value={termoData.artista_principal || ''}
                      onChange={(e) => setTermoData({ ...termoData, artista_principal: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-lg text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Data da Gravação</label>
                    <input
                      type="date"
                      value={termoData.data_gravacao || ''}
                      onChange={(e) => setTermoData({ ...termoData, data_gravacao: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-lg text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Tipo de Participação</label>
                    <select
                      value={termoData.tipo_participacao || 'Convidado'}
                      onChange={(e) => setTermoData({ ...termoData, tipo_participacao: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-lg text-sm text-white outline-none cursor-pointer"
                    >
                      <option value="Artista principal">Artista principal</option>
                      <option value="Participação / feat.">Participação / feat.</option>
                      <option value="Músico">Músico</option>
                      <option value="Intérprete">Intérprete</option>
                      <option value="Backing vocal">Backing vocal</option>
                      <option value="Ator/Atriz">Ator/Atriz</option>
                      <option value="Modelo">Modelo</option>
                      <option value="Convidado">Convidado</option>
                      <option value="Projeto independente">Projeto independente</option>
                      <option value="Cover">Cover</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção 2: Dados do Autorizante */}
              <div className="space-y-3 bg-dark-bg/60 p-4 rounded-xl border border-dark-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <i className="ri-user-star-line"></i>
                  Dados do Autorizante (Pessoa que vai gravar)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-300">
                      Nome Civil Completo <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: João da Silva Santos"
                      value={termoData.autorizante_nome}
                      onChange={(e) => setTermoData({ ...termoData, autorizante_nome: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-lg text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Nome Artístico (se houver)</label>
                    <input
                      type="text"
                      placeholder="Ex: Pr. Lucas"
                      value={termoData.autorizante_nome_artistico || ''}
                      onChange={(e) => setTermoData({ ...termoData, autorizante_nome_artistico: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-lg text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">CPF</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={termoData.autorizante_cpf || ''}
                      onChange={(e) => setTermoData({ ...termoData, autorizante_cpf: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-lg text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">RG</label>
                    <input
                      type="text"
                      placeholder="00.000.000-0"
                      value={termoData.autorizante_rg || ''}
                      onChange={(e) => setTermoData({ ...termoData, autorizante_rg: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-lg text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(21) 99999-9999"
                      value={termoData.autorizante_telefone || ''}
                      onChange={(e) => setTermoData({ ...termoData, autorizante_telefone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-lg text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-300">E-mail</label>
                    <input
                      type="email"
                      placeholder="email@dominio.com"
                      value={termoData.autorizante_email || ''}
                      onChange={(e) => setTermoData({ ...termoData, autorizante_email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-lg text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-300">Endereço Residencial</label>
                    <input
                      type="text"
                      placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
                      value={termoData.autorizante_endereco || ''}
                      onChange={(e) => setTermoData({ ...termoData, autorizante_endereco: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-lg text-sm text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : currentTab === 'documento' ? (
            /* Visualização do Documento Completo */
            <div className="bg-dark-card border border-dark-border p-6 rounded-2xl shadow-inner">
              <TermoUsoContent data={termoData} />
            </div>
          ) : (
            /* Assinatura Presencial */
            <div className="space-y-6">
              <div className="bg-teal-950/20 border border-teal-500/30 rounded-xl p-4 text-xs text-teal-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <i className="ri-information-line text-sm"></i>
                  <span>Assinatura Digital no Estúdio</span>
                </div>
                <p className="text-gray-300">
                  O autorizante <strong>{termoData.autorizante_nome || '(Nome não informado)'}</strong> deve assinar abaixo para formalizar a autorização de uso de imagem.
                </p>
              </div>

              {/* Canvas de Assinatura */}
              <SignaturePad
                initialSignature={termoData.assinatura_digital}
                onSave={(sig) => setTermoData({ ...termoData, assinatura_digital: sig })}
              />

              {/* Checkbox de Aceite Legal */}
              <label className="flex items-start gap-3 p-4 rounded-xl bg-dark-bg/80 border border-dark-border cursor-pointer hover:border-teal-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(termoData.declaracao_concordancia)}
                  onChange={(e) => setTermoData({ ...termoData, declaracao_concordancia: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded border-gray-600 bg-dark-bg text-primary-teal focus:ring-primary-teal cursor-pointer"
                />
                <span className="text-xs text-gray-300 leading-relaxed">
                  Declaro que li, compreendi e concordo integralmente com todos os termos e condições do presente <strong>Termo de Autorização e Licença de Uso de Imagem, Voz, Nome e Performance Artística</strong> da Céu Music, tendo capacidade plena para firmar este instrumento.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Rodapé Fixo */}
        <div className="px-6 py-4 border-t border-dark-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-dark-bg/80 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            {termoData.token && (
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <i className="ri-whatsapp-line text-sm"></i>
                <span>Enviar p/ WhatsApp</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-dark-hover hover:bg-dark-border text-gray-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Fechar
            </button>

            {currentTab === 'dados' && (
              <button
                type="button"
                onClick={() => handleSaveTermo(false)}
                disabled={saving}
                className="px-5 py-2 bg-gradient-primary hover:opacity-95 text-white rounded-lg text-xs font-bold shadow-lg shadow-primary-teal/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving && <i className="ri-loader-4-line animate-spin"></i>}
                <span>Salvar & Gerar Link</span>
              </button>
            )}

            {currentTab === 'documento' && termoData.status !== 'assinado' && (
              <button
                type="button"
                onClick={() => setCurrentTab('assinatura')}
                className="px-5 py-2 bg-gradient-primary hover:opacity-95 text-white rounded-lg text-xs font-bold shadow-lg shadow-primary-teal/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <i className="ri-quill-pen-line"></i>
                <span>Prosseguir para Assinatura</span>
              </button>
            )}

            {currentTab === 'assinatura' && termoData.status !== 'assinado' && (
              <button
                type="button"
                onClick={() => handleSaveTermo(true)}
                disabled={saving}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving && <i className="ri-loader-4-line animate-spin"></i>}
                <i className="ri-check-double-line"></i>
                <span>Assinar e Concluir Termo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
