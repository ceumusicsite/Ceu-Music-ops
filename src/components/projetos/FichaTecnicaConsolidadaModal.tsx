import { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { ProjetoParticipanteData, TIPOS_PARTICIPACAO_LABELS } from './TermoParticipanteContent';

interface FaixaItem {
  id: string;
  nome: string;
  titulo_oficial?: string;
  titulo_provisorio?: string;
  versao_faixa?: string;
  versao_faixa_outra?: string;
  duracao?: string;
  isrc?: string;
  upc_ean?: string;
  data_prevista_lancamento?: string;
  data_efetiva_lancamento?: string;
  distribuidora_digital?: string;
  titular_fonograma?: string;
  produtor_fonografico?: string;
  modelo_exploracao?: string;
  credito_artista?: string;
  credito_producao_musical?: string;
  credito_compositores?: string;
  credito_musicos?: string;
  credito_mixagem?: string;
  credito_masterizacao?: string;
  credito_demais_obrigatorios?: string;
  ordem?: number;
  compositores?: string[];
  letristas?: string[];
  produtores_musicais?: string[];
  mixagem?: string;
  masterizacao?: string;
  genero?: string;
  bpm?: number;
  tonalidade?: string;
}

interface FichaTecnicaConsolidadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  projetoNome: string;
  artistaNome: string;
  faixas: FaixaItem[];
  participantes: ProjetoParticipanteData[];
}

export default function FichaTecnicaConsolidadaModal({
  isOpen,
  onClose,
  projetoNome,
  artistaNome,
  faixas,
  participantes,
}: FichaTecnicaConsolidadaModalProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'faixas' | 'participantes' | 'texto'>('faixas');

  if (!isOpen) return null;

  // Gerar texto formatado completo para plataformas / ECAD
  const generateFormattedText = () => {
    let text = `====================================================\n`;
    text += `FICHA TÉCNICA OFICIAL - CÉU MUSIC\n`;
    text += `Projeto: ${projetoNome}\n`;
    text += `Artista: ${artistaNome}\n`;
    text += `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}\n`;
    text += `====================================================\n\n`;

    text += `--- PARTICIPANTES & MÚSICOS REGISTRADOS (${participantes.length}) ---\n`;
    participantes.forEach((p, idx) => {
      const tipo = TIPOS_PARTICIPACAO_LABELS[p.tipo_participacao] || p.tipo_participacao;
      const statusAssinatura = p.status === 'assinado' ? '[ASSINADO JURIDICAMENTE]' : '[PENDENTE DE ASSINATURA]';
      const creditName = p.autorizante_nome_artistico
        ? `${p.autorizante_nome_artistico} (${p.autorizante_nome})`
        : p.autorizante_nome;
      text += `${idx + 1}. ${creditName} - ${tipo} (${p.funcao_instrumento}) ${statusAssinatura}\n`;
      if (p.autorizante_cpf) text += `   CPF: ${p.autorizante_cpf}\n`;
      if (p.faixas_nomes && p.faixas_nomes.length > 0) {
        text += `   Faixas: ${p.faixas_nomes.join(', ')}\n`;
      } else {
        text += `   Faixas: Todas do projeto\n`;
      }
      text += `\n`;
    });

    if (faixas.length > 0) {
      text += `\n--- CRÉDITOS E DADOS POR FAIXA (${faixas.length}) ---\n`;
      faixas.forEach((faixa, fIdx) => {
        const titulo = faixa.titulo_oficial || faixa.nome;
        text += `\nFAIXA ${fIdx + 1}: "${titulo}"\n`;
        if (faixa.titulo_provisorio) text += `Título Provisório: ${faixa.titulo_provisorio}\n`;
        if (faixa.versao_faixa) text += `Versão: ${faixa.versao_faixa === 'Outra' && faixa.versao_faixa_outra ? faixa.versao_faixa_outra : faixa.versao_faixa}\n`;
        if (faixa.duracao) text += `Duração: ${faixa.duracao}\n`;
        if (faixa.isrc) text += `ISRC: ${faixa.isrc}\n`;
        if (faixa.upc_ean) text += `UPC/EAN: ${faixa.upc_ean}\n`;
        if (faixa.data_prevista_lancamento) text += `Data Prevista de Lançamento: ${faixa.data_prevista_lancamento}\n`;
        if (faixa.data_efetiva_lancamento) text += `Data Efetiva de Lançamento: ${faixa.data_efetiva_lancamento}\n`;
        if (faixa.distribuidora_digital) text += `Distribuidora Digital: ${faixa.distribuidora_digital}\n`;
        if (faixa.titular_fonograma) text += `Titular do Fonograma (Master): ${faixa.titular_fonograma}\n`;
        if (faixa.produtor_fonografico) text += `Produtor Fonográfico: ${faixa.produtor_fonografico}\n`;
        if (faixa.modelo_exploracao) text += `Modelo de Exploração: ${faixa.modelo_exploracao}\n`;

        // Créditos Oficiais (Seção 8)
        if (faixa.credito_artista) text += `Crédito do Artista: ${faixa.credito_artista}\n`;
        if (faixa.credito_producao_musical) text += `Produção Musical: ${faixa.credito_producao_musical}\n`;
        if (faixa.credito_compositores) text += `Compositores: ${faixa.credito_compositores}\n`;
        if (faixa.credito_musicos) text += `Músicos: ${faixa.credito_musicos}\n`;
        if (faixa.credito_mixagem) text += `Mixagem: ${faixa.credito_mixagem}\n`;
        if (faixa.credito_masterizacao) text += `Masterização: ${faixa.credito_masterizacao}\n`;
        if (faixa.credito_demais_obrigatorios) text += `Demais Créditos: ${faixa.credito_demais_obrigatorios}\n`;

        // Legados
        if (faixa.compositores && faixa.compositores.length > 0 && !faixa.credito_compositores) {
          text += `Compositores: ${faixa.compositores.join(', ')}\n`;
        }
        if (faixa.produtores_musicais && faixa.produtores_musicais.length > 0 && !faixa.credito_producao_musical) {
          text += `Produção Musical: ${faixa.produtores_musicais.join(', ')}\n`;
        }
        if (faixa.mixagem && !faixa.credito_mixagem) text += `Mixagem: ${faixa.mixagem}\n`;
        if (faixa.masterizacao && !faixa.credito_masterizacao) text += `Masterização: ${faixa.masterizacao}\n`;
        if (faixa.bpm) text += `BPM: ${faixa.bpm}\n`;
        if (faixa.tonalidade) text += `Tonalidade: ${faixa.tonalidade}\n`;

        // Músicos nesta faixa
        const musicosFaixa = participantes.filter(
          (p) => !p.faixas_ids || p.faixas_ids.length === 0 || p.faixas_ids.includes(faixa.id)
        );

        if (musicosFaixa.length > 0) {
          text += `Músicos / Executantes Registrados:\n`;
          musicosFaixa.forEach((m) => {
            const nome = m.autorizante_nome_artistico || m.autorizante_nome;
            text += `  • ${m.funcao_instrumento}: ${nome}\n`;
          });
        }
      });
    }

    return text;
  };

  const handleCopyText = () => {
    const text = generateFormattedText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Ficha Técnica copiada para a área de transferência!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between bg-dark-bg/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <i className="ri-file-list-3-line text-xl"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ficha Técnica Consolidada</h2>
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

        {/* Tabs de Visualização */}
        <div className="flex border-b border-dark-border px-6 bg-dark-bg/30">
          <button
            onClick={() => setActiveTab('faixas')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'faixas'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <i className="ri-music-2-line"></i>
            Por Faixa ({faixas.length})
          </button>
          <button
            onClick={() => setActiveTab('participantes')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'participantes'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <i className="ri-group-line"></i>
            Todos os Participantes ({participantes.length})
          </button>
          <button
            onClick={() => setActiveTab('texto')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'texto'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <i className="ri-code-line"></i>
            Texto Formatado para Distribuição
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: POR FAIXA */}
          {activeTab === 'faixas' && (
            <div className="space-y-4">
              {faixas.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  Nenhuma faixa cadastrada neste projeto.
                </div>
              ) : (
                faixas.map((fx, idx) => {
                  const musicosDestaFaixa = participantes.filter(
                    (p) => !p.faixas_ids || p.faixas_ids.length === 0 || p.faixas_ids.includes(fx.id)
                  );

                  return (
                    <div
                      key={fx.id}
                      className="bg-dark-bg/80 border border-dark-border rounded-xl p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-dark-border/60 pb-2">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 text-xs flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          {fx.nome}
                        </h3>
                        {(fx.bpm || fx.tonalidade) && (
                          <div className="flex gap-2 text-xs text-gray-400">
                            {fx.bpm && <span className="font-mono">{fx.bpm} BPM</span>}
                            {fx.tonalidade && <span className="font-mono">{fx.tonalidade}</span>}
                          </div>
                        )}
                      </div>

                      {/* Dados Técnicos da Faixa */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        {fx.compositores && fx.compositores.length > 0 && (
                          <div>
                            <span className="text-gray-400 block mb-0.5">Compositores:</span>
                            <span className="text-white font-medium">{fx.compositores.join(', ')}</span>
                          </div>
                        )}
                        {fx.produtores_musicais && fx.produtores_musicais.length > 0 && (
                          <div>
                            <span className="text-gray-400 block mb-0.5">Produção Musical:</span>
                            <span className="text-white font-medium">{fx.produtores_musicais.join(', ')}</span>
                          </div>
                        )}
                        {fx.mixagem && (
                          <div>
                            <span className="text-gray-400 block mb-0.5">Mixagem:</span>
                            <span className="text-white font-medium">{fx.mixagem}</span>
                          </div>
                        )}
                        {fx.masterizacao && (
                          <div>
                            <span className="text-gray-400 block mb-0.5">Masterização:</span>
                            <span className="text-white font-medium">{fx.masterizacao}</span>
                          </div>
                        )}
                      </div>

                      {/* Músicos e Instrumentos na Faixa */}
                      <div className="pt-2 border-t border-dark-border/40">
                        <p className="text-xs font-bold text-teal-400 mb-2 flex items-center gap-1">
                          <i className="ri-user-voice-line"></i>
                          Músicos e Executantes ({musicosDestaFaixa.length}):
                        </p>
                        {musicosDestaFaixa.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">
                            Nenhum músico associado diretamente a esta faixa.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {musicosDestaFaixa.map((m) => (
                              <div
                                key={m.id || m.token || m.autorizante_nome}
                                className="bg-dark-card p-2.5 rounded-lg border border-dark-border/80 text-xs flex items-center justify-between"
                              >
                                <div>
                                  <span className="text-white font-semibold block truncate">
                                    {m.autorizante_nome_artistico || m.autorizante_nome}
                                  </span>
                                  <span className="text-teal-400/90 text-[11px] block">
                                    {m.funcao_instrumento}
                                  </span>
                                </div>
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    m.status === 'assinado' ? 'bg-green-400' : 'bg-amber-400'
                                  }`}
                                  title={m.status === 'assinado' ? 'Termo Assinado' : 'Pendente de Assinatura'}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: TODOS OS PARTICIPANTES */}
          {activeTab === 'participantes' && (
            <div className="space-y-3">
              {participantes.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  Nenhum participante cadastrado neste projeto ainda.
                </div>
              ) : (
                participantes.map((p, idx) => (
                  <div
                    key={p.id || p.token || idx}
                    className="bg-dark-bg/80 border border-dark-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {p.autorizante_nome_artistico || p.autorizante_nome}
                        </span>
                        {p.autorizante_nome_artistico && (
                          <span className="text-xs text-gray-400">({p.autorizante_nome})</span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'assinado'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {p.status === 'assinado' ? 'Termo Assinado' : 'Pendente de Assinatura'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span>
                          <strong className="text-gray-300">Função:</strong>{' '}
                          {TIPOS_PARTICIPACAO_LABELS[p.tipo_participacao] || p.tipo_participacao}
                        </span>
                        <span>
                          <strong className="text-gray-300">Instrumento:</strong> {p.funcao_instrumento}
                        </span>
                        {p.autorizante_cpf && (
                          <span>
                            <strong className="text-gray-300">CPF:</strong> {p.autorizante_cpf}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-teal-400/80">
                        Faixas:{' '}
                        {p.faixas_nomes && p.faixas_nomes.length > 0
                          ? p.faixas_nomes.join(', ')
                          : 'Todas as faixas do projeto'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: TEXTO FORMATADO */}
          {activeTab === 'texto' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Formato em texto puro pronto para colar em cadastro de agregadoras, distribuidoras ou e-mails.
                </span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <i className={copied ? 'ri-check-line' : 'ri-file-copy-line'}></i>
                  <span>{copied ? 'Copiado!' : 'Copiar Texto Completo'}</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={16}
                value={generateFormattedText()}
                className="w-full p-4 bg-black/60 border border-dark-border rounded-xl text-gray-300 font-mono text-xs focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dark-border flex items-center justify-between bg-dark-bg/80">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 bg-dark-card hover:bg-dark-hover border border-dark-border rounded-lg text-xs font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <i className="ri-printer-line"></i>
            <span>Imprimir Ficha Técnica</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
