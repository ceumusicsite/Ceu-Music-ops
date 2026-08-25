import React, { useState, useEffect, useRef } from 'react';

export interface DocumentoObrigatorioItem {
  documento: string;
  recebido: boolean;
  aprovado: boolean;
  arquivado: boolean;
}

export const DOCUMENTOS_OBRIGATORIOS_PADRAO = [
  'Contrato do artista',
  'Contratos/autorizações dos compositores',
  'Autorização de versão/adaptação',
  'Contratos de produtores',
  'Autorizações de músicos/intérpretes',
  'Letra final',
  'Master WAV final',
  'Capa aprovada',
  'Ficha técnica final',
  'Documentação para ISRC',
  'Autorização de uso de imagem, se aplicável',
  'Outros',
];

export interface FaixaFormData {
  nome: string;
  titulo_oficial?: string;
  titulo_provisorio?: string;
  versao_faixa: string;
  versao_faixa_outra?: string;
  duracao?: string;
  status: 'pendente' | 'gravada' | 'em_mixagem' | 'masterizacao' | 'finalizada' | 'lancada';
  o_que_falta_gravar?: string;

  // Seção 5: Identificação Fonográfica e Distribuição
  isrc?: string;
  upc_ean?: string;
  data_prevista_lancamento?: string;
  data_efetiva_lancamento?: string;
  distribuidora_digital?: string;

  // Seção 6: Titularidade e Direitos sobre o Master
  titular_fonograma?: string;
  produtor_fonografico?: string;
  modelo_exploracao?: string;
  modelo_exploracao_outro?: string;

  // Seção 7: Documentação Obrigatória
  documentacao_obrigatoria: DocumentoObrigatorioItem[];

  // Seção 8: Créditos Oficiais
  credito_artista?: string;
  credito_producao_musical?: string;
  credito_compositores?: string;
  credito_musicos?: string;
  credito_mixagem?: string;
  credito_masterizacao?: string;
  credito_demais_obrigatorios?: string;

  referencias?: any[];
  anexos?: any[];
}

export const getInitialFaixaFormData = (): FaixaFormData => ({
  nome: '',
  titulo_oficial: '',
  titulo_provisorio: '',
  versao_faixa: 'Original',
  versao_faixa_outra: '',
  duracao: '',
  status: 'pendente',
  o_que_falta_gravar: '',

  isrc: '',
  upc_ean: '',
  data_prevista_lancamento: '',
  data_efetiva_lancamento: '',
  distribuidora_digital: '',

  titular_fonograma: 'Céu Music',
  produtor_fonografico: 'Céu Music',
  modelo_exploracao: 'Titularidade da Céu Music',
  modelo_exploracao_outro: '',

  documentacao_obrigatoria: DOCUMENTOS_OBRIGATORIOS_PADRAO.map(doc => ({
    documento: doc,
    recebido: false,
    aprovado: false,
    arquivado: false,
  })),

  credito_artista: '',
  credito_producao_musical: '',
  credito_compositores: '',
  credito_musicos: '',
  credito_mixagem: '',
  credito_masterizacao: '',
  credito_demais_obrigatorios: '',
  referencias: [],
  anexos: [],
});

interface FaixaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FaixaFormData) => void;
  initialData?: Partial<FaixaFormData> | null;
  isEditing?: boolean;
  existingAudioUrls?: string[];
  duplicateSourceFaixas?: { id?: string; nome: string; data: Partial<FaixaFormData> }[];
  isDuplicating?: boolean;
}

export default function FaixaFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isEditing = false,
  existingAudioUrls = [],
  duplicateSourceFaixas = [],
  isDuplicating = false,
}: FaixaFormModalProps) {
  const [activeTab, setActiveTab] = useState<'identificacao' | 'distribuicao' | 'documentacao' | 'creditos'>('identificacao');
  const [formData, setFormData] = useState<FaixaFormData>(getInitialFaixaFormData());
  const [detectingDuration, setDetectingDuration] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const base = getInitialFaixaFormData();
        // Garantir que documentacao_obrigatoria tenha todos os itens
        let docs = base.documentacao_obrigatoria;
        if (initialData.documentacao_obrigatoria && Array.isArray(initialData.documentacao_obrigatoria)) {
          docs = DOCUMENTOS_OBRIGATORIOS_PADRAO.map(nomeDoc => {
            const found = initialData.documentacao_obrigatoria?.find((d: any) => d.documento === nomeDoc);
            return found || { documento: nomeDoc, recebido: false, aprovado: false, arquivado: false };
          });
        }

        setFormData({
          ...base,
          ...initialData,
          nome: initialData.nome || initialData.titulo_oficial || '',
          titulo_oficial: initialData.titulo_oficial || initialData.nome || '',
          versao_faixa: initialData.versao_faixa || 'Original',
          titular_fonograma: initialData.titular_fonograma || 'Céu Music',
          produtor_fonografico: initialData.produtor_fonografico || 'Céu Music',
          modelo_exploracao: initialData.modelo_exploracao || 'Titularidade da Céu Music',
          documentacao_obrigatoria: docs,
        });

        if (isDuplicating) {
          setCopiedNotice('Dados de Distribuição, Master, Documentação e Créditos duplicados com sucesso! Preencha as informações individuais desta faixa (Título Oficial, ISRC, Duração).');
        } else {
          setCopiedNotice(null);
        }
      } else {
        setFormData(getInitialFaixaFormData());
        setCopiedNotice(null);
      }
      setActiveTab('identificacao');
    }
  }, [isOpen, initialData, isDuplicating]);

  // Função para copiar dados compartilhados de outra faixa (mantendo dados individuais limpos/livres)
  const handleCopyFromFaixa = (sourceData: Partial<FaixaFormData>, sourceNome?: string) => {
    if (!sourceData) return;

    let docs = formData.documentacao_obrigatoria;
    if (sourceData.documentacao_obrigatoria && Array.isArray(sourceData.documentacao_obrigatoria)) {
      docs = DOCUMENTOS_OBRIGATORIOS_PADRAO.map(nomeDoc => {
        const found = sourceData.documentacao_obrigatoria?.find((d: any) => d.documento === nomeDoc);
        return found || { documento: nomeDoc, recebido: false, aprovado: false, arquivado: false };
      });
    }

    setFormData(prev => ({
      ...prev,
      // Compartilhados
      distribuidora_digital: sourceData.distribuidora_digital ?? prev.distribuidora_digital,
      data_prevista_lancamento: sourceData.data_prevista_lancamento ?? prev.data_prevista_lancamento,
      data_efetiva_lancamento: sourceData.data_efetiva_lancamento ?? prev.data_efetiva_lancamento,
      upc_ean: sourceData.upc_ean ?? prev.upc_ean,
      titular_fonograma: sourceData.titular_fonograma || prev.titular_fonograma || 'Céu Music',
      produtor_fonografico: sourceData.produtor_fonografico || prev.produtor_fonografico || 'Céu Music',
      modelo_exploracao: sourceData.modelo_exploracao || prev.modelo_exploracao || 'Titularidade da Céu Music',
      modelo_exploracao_outro: sourceData.modelo_exploracao_outro ?? prev.modelo_exploracao_outro,
      versao_faixa: sourceData.versao_faixa || prev.versao_faixa,
      versao_faixa_outra: sourceData.versao_faixa_outra ?? prev.versao_faixa_outra,

      // Seção 7: Documentação Obrigatória
      documentacao_obrigatoria: docs,

      // Seção 8: Créditos Oficiais
      credito_artista: sourceData.credito_artista ?? prev.credito_artista,
      credito_producao_musical: sourceData.credito_producao_musical ?? prev.credito_producao_musical,
      credito_compositores: sourceData.credito_compositores ?? prev.credito_compositores,
      credito_musicos: sourceData.credito_musicos ?? prev.credito_musicos,
      credito_mixagem: sourceData.credito_mixagem ?? prev.credito_mixagem,
      credito_masterizacao: sourceData.credito_masterizacao ?? prev.credito_masterizacao,
      credito_demais_obrigatorios: sourceData.credito_demais_obrigatorios ?? prev.credito_demais_obrigatorios,
    }));

    setCopiedNotice(`Ficha e créditos copiados de "${sourceNome || 'faixa selecionada'}"! Preencha o Título Oficial, ISRC e Duração desta música.`);
  };

  // Função para formatar duração em MM:SS
  const formatSecondsToMMSS = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Detectar duração a partir de arquivo local
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDetectingDuration(true);
    try {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          const formatted = formatSecondsToMMSS(audio.duration);
          setFormData(prev => ({ ...prev, duracao: formatted }));
        }
        URL.revokeObjectURL(objectUrl);
        setDetectingDuration(false);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setDetectingDuration(false);
      };
    } catch (err) {
      console.error('Erro ao detectar duração do áudio:', err);
      setDetectingDuration(false);
    }
  };

  // Detectar duração de URL remota existente
  const detectDurationFromUrl = (url: string) => {
    if (!url) return;
    setDetectingDuration(true);
    const audio = new Audio();
    audio.src = url;
    audio.crossOrigin = 'anonymous';

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        const formatted = formatSecondsToMMSS(audio.duration);
        setFormData(prev => ({ ...prev, duracao: formatted }));
      }
      setDetectingDuration(false);
    };

    audio.onerror = () => {
      setDetectingDuration(false);
    };
  };

  // Toggle documento obrigatório
  const handleToggleDoc = (index: number, field: 'recebido' | 'aprovado' | 'arquivado') => {
    setFormData(prev => {
      const newDocs = [...prev.documentacao_obrigatoria];
      newDocs[index] = {
        ...newDocs[index],
        [field]: !newDocs[index][field],
      };
      return { ...prev, documentacao_obrigatoria: newDocs };
    });
  };

  const handleMarcarTodos = (field: 'recebido' | 'aprovado' | 'arquivado', valor: boolean) => {
    setFormData(prev => ({
      ...prev,
      documentacao_obrigatoria: prev.documentacao_obrigatoria.map(d => ({
        ...d,
        [field]: valor,
      })),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nomeFinal = formData.titulo_oficial?.trim() || formData.nome.trim();
    if (!nomeFinal) {
      alert('Por favor, preencha o Título Oficial da faixa.');
      setActiveTab('identificacao');
      return;
    }

    onSave({
      ...formData,
      nome: nomeFinal,
      titulo_oficial: nomeFinal,
    });
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
        className="bg-dark-card border border-dark-border rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-bg/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="ri-music-2-line text-primary-teal"></i>
                {isEditing ? 'Editar Ficha da Faixa' : isDuplicating ? 'Nova Faixa (Duplicada)' : 'Nova Faixa - Ficha Técnica'}
              </h2>
              {isDuplicating && (
                <span className="px-2 py-0.5 bg-primary-teal/20 text-primary-teal text-xs font-semibold rounded-full flex items-center gap-1">
                  <i className="ri-file-copy-line"></i> Duplicada
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Controle Artístico, Fonográfico, Distribuição e Créditos Oficiais (Céu Music)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Seletor rápido para copiar dados de outra faixa existente */}
            {!isEditing && duplicateSourceFaixas && duplicateSourceFaixas.length > 0 && (
              <div className="relative">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const selected = duplicateSourceFaixas.find(f => (f.id || f.nome) === e.target.value);
                    if (selected) {
                      handleCopyFromFaixa(selected.data, selected.nome);
                    }
                    e.target.value = '';
                  }}
                  className="px-3 py-1.5 bg-dark-bg hover:bg-dark-hover border border-primary-teal/40 rounded-lg text-primary-teal text-xs font-medium focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                >
                  <option value="" disabled>⚡ Duplicar dados de outra faixa...</option>
                  {duplicateSourceFaixas.map((f, idx) => (
                    <option key={f.id || idx} value={f.id || f.nome} className="bg-dark-card text-white">
                      Copiar de: {f.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-dark-hover transition-smooth cursor-pointer"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>

        {/* Banner informativo de duplicação */}
        {copiedNotice && (
          <div className="px-6 py-2.5 bg-primary-teal/10 border-b border-primary-teal/20 flex items-center justify-between gap-2 text-xs text-primary-teal animate-in fade-in duration-200">
            <span className="flex items-center gap-1.5 font-medium">
              <i className="ri-magic-line text-sm"></i>
              {copiedNotice}
            </span>
            <button
              type="button"
              onClick={() => setCopiedNotice(null)}
              className="text-primary-teal/70 hover:text-primary-teal p-1"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
        )}

        {/* Abas / Navegação */}
        <div className="flex border-b border-dark-border bg-dark-bg overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('identificacao')}
            className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-smooth cursor-pointer ${
              activeTab === 'identificacao'
                ? 'border-primary-teal text-primary-teal bg-primary-teal/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <i className="ri-information-line"></i>
            1. Identificação
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('distribuicao')}
            className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-smooth cursor-pointer ${
              activeTab === 'distribuicao'
                ? 'border-primary-teal text-primary-teal bg-primary-teal/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <i className="ri-broadcast-line"></i>
            5 & 6. Distribuição & Master
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documentacao')}
            className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-smooth cursor-pointer ${
              activeTab === 'documentacao'
                ? 'border-primary-teal text-primary-teal bg-primary-teal/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <i className="ri-file-list-3-line"></i>
            7. Documentação
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('creditos')}
            className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-smooth cursor-pointer ${
              activeTab === 'creditos'
                ? 'border-primary-teal text-primary-teal bg-primary-teal/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <i className="ri-award-line"></i>
            8. Créditos Oficiais
          </button>
        </div>

        {/* Formulário com scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: IDENTIFICAÇÃO */}
          {activeTab === 'identificacao' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Título Oficial da Faixa <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titulo_oficial || formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value, titulo_oficial: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Teu Amor Não Falha"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Título Provisório (se houver)
                  </label>
                  <input
                    type="text"
                    value={formData.titulo_provisorio || ''}
                    onChange={(e) => setFormData({ ...formData, titulo_provisorio: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Guia 01 / Demo Acústica"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Versão da Faixa
                  </label>
                  <select
                    value={formData.versao_faixa || 'Original'}
                    onChange={(e) => setFormData({ ...formData, versao_faixa: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="Original">Original</option>
                    <option value="Ao vivo">Ao vivo</option>
                    <option value="Acústica">Acústica</option>
                    <option value="Remix">Remix</option>
                    <option value="Versão">Versão</option>
                    <option value="Outra">Outra</option>
                  </select>
                </div>

                {formData.versao_faixa === 'Outra' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Especifique a Versão
                    </label>
                    <input
                      type="text"
                      value={formData.versao_faixa_outra || ''}
                      onChange={(e) => setFormData({ ...formData, versao_faixa_outra: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: Instrumental / Extended"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center justify-between">
                    <span>Duração da Faixa (MM:SS)</span>
                    {detectingDuration && (
                      <span className="text-xs text-primary-teal animate-pulse flex items-center gap-1">
                        <i className="ri-loader-4-line ri-spin"></i> Identificando...
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.duracao || ''}
                      onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
                      className="flex-1 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: 03:45"
                    />
                    
                    {/* Botão para carregar áudio e auto-detectar */}
                    <input
                      type="file"
                      ref={audioInputRef}
                      onChange={handleAudioFileChange}
                      accept="audio/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="px-3 py-2 bg-dark-bg hover:bg-dark-hover border border-dark-border rounded-lg text-xs text-gray-300 hover:text-white transition-smooth flex items-center gap-1 cursor-pointer"
                      title="Selecionar arquivo de áudio para detectar duração automaticamente"
                    >
                      <i className="ri-sound-module-line text-primary-teal"></i>
                      <span>Auto-detectar</span>
                    </button>
                  </div>
                  {existingAudioUrls && existingAudioUrls.length > 0 && (
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() => detectDurationFromUrl(existingAudioUrls[0])}
                        className="text-xs text-primary-teal hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <i className="ri-magic-line"></i>
                        Detectar do áudio anexado na faixa
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status da Produção</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as FaixaFormData['status'] })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="gravada">Gravada</option>
                    <option value="em_mixagem">Em Mixagem</option>
                    <option value="masterizacao">Masterização</option>
                    <option value="finalizada">Finalizada</option>
                    <option value="lancada">Lançada</option>
                  </select>
                </div>

                {formData.status === 'pendente' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">O que falta gravar</label>
                    <input
                      type="text"
                      value={formData.o_que_falta_gravar || ''}
                      onChange={(e) => setFormData({ ...formData, o_que_falta_gravar: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: Vocais, backing vocals, guitarras..."
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DISTRIBUIÇÃO & MASTER (SEÇÕES 5 & 6) */}
          {activeTab === 'distribuicao' && (
            <div className="space-y-6">
              {/* Seção 5: Identificação Fonográfica e Distribuição */}
              <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border space-y-4">
                <h3 className="text-sm font-semibold text-primary-teal flex items-center gap-2">
                  <i className="ri-barcode-line"></i>
                  5. IDENTIFICAÇÃO FONOGRÁFICA E DISTRIBUIÇÃO
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">ISRC</label>
                    <input
                      type="text"
                      value={formData.isrc || ''}
                      onChange={(e) => setFormData({ ...formData, isrc: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2.5 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: BR-CEU-24-00001"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">UPC / EAN</label>
                    <input
                      type="text"
                      value={formData.upc_ean || ''}
                      onChange={(e) => setFormData({ ...formData, upc_ean: e.target.value })}
                      className="w-full px-3 py-2.5 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: 7891234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Data prevista de lançamento</label>
                    <input
                      type="date"
                      value={formData.data_prevista_lancamento || ''}
                      onChange={(e) => setFormData({ ...formData, data_prevista_lancamento: e.target.value })}
                      className="w-full px-3 py-2.5 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Data efetiva de lançamento</label>
                    <input
                      type="date"
                      value={formData.data_efetiva_lancamento || ''}
                      onChange={(e) => setFormData({ ...formData, data_efetiva_lancamento: e.target.value })}
                      className="w-full px-3 py-2.5 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Distribuidora Digital</label>
                    <input
                      type="text"
                      value={formData.distribuidora_digital || ''}
                      onChange={(e) => setFormData({ ...formData, distribuidora_digital: e.target.value })}
                      className="w-full px-3 py-2.5 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: Believe / Altafonte / ONErpm / The Orchard"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 6: Titularidade e Direitos sobre o Master */}
              <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border space-y-4">
                <h3 className="text-sm font-semibold text-primary-teal flex items-center gap-2">
                  <i className="ri-shield-keyhole-line"></i>
                  6. TITULARIDADE E DIREITOS SOBRE O MASTER
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Titular do Fonograma (Master)</label>
                    <input
                      type="text"
                      value={formData.titular_fonograma || 'Céu Music'}
                      onChange={(e) => setFormData({ ...formData, titular_fonograma: e.target.value })}
                      className="w-full px-3 py-2.5 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: Céu Music"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Produtor Fonográfico</label>
                    <input
                      type="text"
                      value={formData.produtor_fonografico || 'Céu Music'}
                      onChange={(e) => setFormData({ ...formData, produtor_fonografico: e.target.value })}
                      className="w-full px-3 py-2.5 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: Céu Music"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    Modelo de Exploração (assinale):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Titularidade da Céu Music',
                      'Licenciamento',
                      'Cessão de direitos',
                      'Parceria / Divisão de receitas',
                      'Outro',
                    ].map((opcao) => (
                      <label
                        key={opcao}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-smooth text-sm ${
                          formData.modelo_exploracao === opcao
                            ? 'bg-primary-teal/10 border-primary-teal text-white'
                            : 'bg-dark-card border-dark-border text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="modelo_exploracao"
                          value={opcao}
                          checked={formData.modelo_exploracao === opcao}
                          onChange={(e) => setFormData({ ...formData, modelo_exploracao: e.target.value })}
                          className="text-primary-teal focus:ring-primary-teal"
                        />
                        <span>{opcao}</span>
                      </label>
                    ))}
                  </div>

                  {formData.modelo_exploracao === 'Outro' && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-400 mb-1">Especifique o modelo de exploração</label>
                      <input
                        type="text"
                        value={formData.modelo_exploracao_outro || ''}
                        onChange={(e) => setFormData({ ...formData, modelo_exploracao_outro: e.target.value })}
                        className="w-full px-3 py-2.5 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        placeholder="Especifique..."
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTAÇÃO OBRIGATÓRIA (SEÇÃO 7) */}
          {activeTab === 'documentacao' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-primary-teal flex items-center gap-2">
                    <i className="ri-checkbox-multiple-line"></i>
                    7. DOCUMENTAÇÃO OBRIGATÓRIA
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Controle de recebimento, aprovação e arquivamento dos documentos da faixa
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarcarTodos('recebido', true)}
                    className="px-2.5 py-1 bg-dark-bg hover:bg-dark-hover border border-dark-border text-gray-300 text-xs rounded transition-smooth cursor-pointer"
                  >
                    Todos Recebidos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarcarTodos('aprovado', true)}
                    className="px-2.5 py-1 bg-dark-bg hover:bg-dark-hover border border-dark-border text-gray-300 text-xs rounded transition-smooth cursor-pointer"
                  >
                    Todos Aprovados
                  </button>
                </div>
              </div>

              <div className="border border-dark-border rounded-xl overflow-hidden bg-dark-bg/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-dark-bg border-b border-dark-border text-gray-400">
                      <tr>
                        <th className="p-3 font-medium">Documento</th>
                        <th className="p-3 font-medium text-center w-28">Recebido</th>
                        <th className="p-3 font-medium text-center w-28">Aprovado</th>
                        <th className="p-3 font-medium text-center w-28">Arquivado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border/50">
                      {formData.documentacao_obrigatoria.map((item, idx) => (
                        <tr key={item.documento} className="hover:bg-dark-card/50 transition-smooth">
                          <td className="p-3 text-white font-medium flex items-center gap-2">
                            <span className="text-gray-500 text-[10px] w-4">{idx + 1}.</span>
                            {item.documento}
                          </td>
                          <td className="p-3 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-1">
                              <input
                                type="checkbox"
                                checked={item.recebido}
                                onChange={() => handleToggleDoc(idx, 'recebido')}
                                className="w-4 h-4 rounded bg-dark-bg border-dark-border text-primary-teal focus:ring-primary-teal cursor-pointer"
                              />
                            </label>
                          </td>
                          <td className="p-3 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-1">
                              <input
                                type="checkbox"
                                checked={item.aprovado}
                                onChange={() => handleToggleDoc(idx, 'aprovado')}
                                className="w-4 h-4 rounded bg-dark-bg border-dark-border text-green-500 focus:ring-green-500 cursor-pointer"
                              />
                            </label>
                          </td>
                          <td className="p-3 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-1">
                              <input
                                type="checkbox"
                                checked={item.arquivado}
                                onChange={() => handleToggleDoc(idx, 'arquivado')}
                                className="w-4 h-4 rounded bg-dark-bg border-dark-border text-blue-500 focus:ring-blue-500 cursor-pointer"
                              />
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CRÉDITOS OFICIAIS (SEÇÃO 8) */}
          {activeTab === 'creditos' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-primary-teal flex items-center gap-2">
                  <i className="ri-award-line"></i>
                  8. CRÉDITOS OFICIAIS
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Créditos oficiais e formatação para encartes, YouTube, Spotify e plataformas digitais
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Crédito do Artista
                  </label>
                  <input
                    type="text"
                    value={formData.credito_artista || ''}
                    onChange={(e) => setFormData({ ...formData, credito_artista: e.target.value })}
                    className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Voz: Nome do Artista"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Crédito de Produção Musical
                  </label>
                  <input
                    type="text"
                    value={formData.credito_producao_musical || ''}
                    onChange={(e) => setFormData({ ...formData, credito_producao_musical: e.target.value })}
                    className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Produzido por..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Crédito de Compositores
                  </label>
                  <input
                    type="text"
                    value={formData.credito_compositores || ''}
                    onChange={(e) => setFormData({ ...formData, credito_compositores: e.target.value })}
                    className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Composição: Nome dos compositores"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Crédito de Músicos
                  </label>
                  <input
                    type="text"
                    value={formData.credito_musicos || ''}
                    onChange={(e) => setFormData({ ...formData, credito_musicos: e.target.value })}
                    className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Bateria: ..., Teclado: ..., Guitarras: ..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Crédito de Mixagem
                  </label>
                  <input
                    type="text"
                    value={formData.credito_mixagem || ''}
                    onChange={(e) => setFormData({ ...formData, credito_mixagem: e.target.value })}
                    className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Mixado por..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Crédito de Masterização
                  </label>
                  <input
                    type="text"
                    value={formData.credito_masterizacao || ''}
                    onChange={(e) => setFormData({ ...formData, credito_masterizacao: e.target.value })}
                    className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Masterizado por..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Demais Créditos Obrigatórios
                  </label>
                  <textarea
                    rows={2}
                    value={formData.credito_demais_obrigatorios || ''}
                    onChange={(e) => setFormData({ ...formData, credito_demais_obrigatorios: e.target.value })}
                    className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Ex: Gravado no Estúdio Céu Music / Engenharia de Áudio: ..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer / Botões de Ação */}
          <div className="border-t border-dark-border pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {activeTab === 'identificacao' && 'Passo 1 de 4: Identificação'}
                {activeTab === 'distribuicao' && 'Passo 2 de 4: Distribuição & Master'}
                {activeTab === 'documentacao' && 'Passo 3 de 4: Documentação'}
                {activeTab === 'creditos' && 'Passo 4 de 4: Créditos Oficiais'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-dark-bg hover:bg-dark-hover text-gray-300 hover:text-white rounded-lg text-sm transition-smooth cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-primary text-white font-medium rounded-lg text-sm hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2"
              >
                <i className="ri-save-line"></i>
                {isEditing ? 'Salvar Faixa' : 'Adicionar Faixa'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
