import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import SignaturePad from '../../../../components/estudio/SignaturePad';
import TermoUsoContent, { TermoUsoData } from '../../../../components/estudio/TermoUsoContent';

export default function TermoPublicoPage() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [termo, setTermo] = useState<TermoUsoData | null>(null);
  const [formData, setFormData] = useState({
    autorizante_nome: '',
    autorizante_nome_artistico: '',
    autorizante_cpf: '',
    autorizante_rg: '',
    autorizante_endereco: '',
    autorizante_email: '',
    autorizante_telefone: '',
    declaracao_concordancia: false,
    assinatura_digital: '',
  });

  const [activeView, setActiveView] = useState<'formulario' | 'documento'>('formulario');

  useEffect(() => {
    if (token) {
      loadTermo(token);
    }
  }, [token]);

  const loadTermo = async (tok: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('estudio_termos_uso')
        .select('*')
        .eq('token', tok)
        .single();

      if (fetchErr || !data) {
        throw new Error('Termo de autorização não encontrado ou link inválido.');
      }

      setTermo(data);
      setFormData({
        autorizante_nome: data.autorizante_nome || '',
        autorizante_nome_artistico: data.autorizante_nome_artistico || '',
        autorizante_cpf: data.autorizante_cpf || '',
        autorizante_rg: data.autorizante_rg || '',
        autorizante_endereco: data.autorizante_endereco || '',
        autorizante_email: data.autorizante_email || '',
        autorizante_telefone: data.autorizante_telefone || '',
        declaracao_concordancia: Boolean(data.declaracao_concordancia),
        assinatura_digital: data.assinatura_digital || '',
      });

      if (data.status === 'assinado') {
        setSuccess(true);
        setActiveView('documento');
      }
    } catch (err: any) {
      console.error('Erro ao carregar termo:', err);
      setError(err.message || 'Erro ao carregar o termo de autorização.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.autorizante_nome.trim()) {
      alert('Por favor, informe seu nome civil completo.');
      return;
    }
    if (!formData.autorizante_cpf.trim()) {
      alert('Por favor, informe seu CPF para validação jurídica do termo.');
      return;
    }
    if (!formData.declaracao_concordancia) {
      alert('É obrigatório concordar com os termos de uso para prosseguir.');
      return;
    }
    if (!formData.assinatura_digital) {
      alert('Por favor, desenhe sua assinatura digital no campo correspondente.');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const userAgent = navigator.userAgent;

      const { data, error: updateErr } = await supabase
        .from('estudio_termos_uso')
        .update({
          autorizante_nome: formData.autorizante_nome.trim(),
          autorizante_nome_artistico: formData.autorizante_nome_artistico.trim() || null,
          autorizante_cpf: formData.autorizante_cpf.trim(),
          autorizante_rg: formData.autorizante_rg.trim() || null,
          autorizante_endereco: formData.autorizante_endereco.trim() || null,
          autorizante_email: formData.autorizante_email.trim() || null,
          autorizante_telefone: formData.autorizante_telefone.trim() || null,
          declaracao_concordancia: true,
          assinatura_digital: formData.assinatura_digital,
          status: 'assinado',
          aceito_em: now,
          user_agent: userAgent,
          ip_origem: 'Acesso Online (Web Signer)',
          updated_at: now,
        })
        .eq('token', token)
        .select()
        .single();

      if (updateErr) throw updateErr;

      setTermo(data);
      setSuccess(true);
      setActiveView('documento');
    } catch (err: any) {
      console.error('Erro ao assinar termo:', err);
      alert('Erro ao registrar assinatura. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-primary-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 text-sm font-medium">Carregando Termo de Autorização...</p>
        </div>
      </div>
    );
  }

  if (error || !termo) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto text-2xl">
            <i className="ri-error-warning-line"></i>
          </div>
          <h2 className="text-xl font-bold text-white">Termo Não Encontrado</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            {error || 'O link acessado é inválido ou expirou. Por favor, entre em contato com a equipe da Céu Music.'}
          </p>
        </div>
      </div>
    );
  }

  const combinedData: TermoUsoData = {
    ...termo,
    ...formData,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-gray-200 py-6 sm:py-10 px-3 sm:px-6 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Institucional Céu Music */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-dark-card/90 border border-dark-border/80 p-5 rounded-2xl shadow-xl backdrop-blur-sm print:hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary-teal/20 shrink-0">
              <i className="ri-quill-pen-line text-2xl text-white"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white">Céu Music Ops</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 uppercase">
                  Assinatura Digital
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Termo de Autorização e Licença de Uso de Imagem e Performance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-dark-bg hover:bg-dark-hover border border-dark-border text-xs font-semibold text-gray-300 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Imprimir / Salvar PDF"
            >
              <i className="ri-printer-line text-sm"></i>
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Banner de Sucesso / Termo Assinado */}
        {success && (
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-3 animate-fade-in print:hidden">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <i className="ri-checkbox-circle-fill text-2xl"></i>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Termo Assinado e Registrado com Sucesso!</h2>
                <p className="text-xs text-emerald-300">
                  Obrigado, <strong>{combinedData.autorizante_nome}</strong>! Sua autorização de uso de imagem foi validada juridicamente.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-300">
              <span>
                <strong>Projeto:</strong> {combinedData.projeto_nome} • <strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <i className="ri-download-2-line"></i>
                <span>Baixar Comprovante Assinado (PDF)</span>
              </button>
            </div>
          </div>
        )}

        {/* Abas para alternar no Mobile (Formulário vs Documento Completo) */}
        {!success && (
          <div className="flex items-center justify-center gap-2 bg-dark-card border border-dark-border p-1.5 rounded-xl print:hidden">
            <button
              type="button"
              onClick={() => setActiveView('formulario')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeView === 'formulario'
                  ? 'bg-primary-teal text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="ri-edit-line"></i>
              <span>Preencher Dados & Assinar</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('documento')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeView === 'documento'
                  ? 'bg-primary-teal text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="ri-file-text-line"></i>
              <span>Ler Documento Completo</span>
            </button>
          </div>
        )}

        {/* Área Principal de Conteúdo */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Se estiver no modo visualização de documento ou já assinado */}
          {activeView === 'documento' || success ? (
            <div className="space-y-6">
              <TermoUsoContent data={combinedData} isPrintable />
              {!success && (
                <div className="pt-4 border-t border-dark-border flex justify-end print:hidden">
                  <button
                    type="button"
                    onClick={() => setActiveView('formulario')}
                    className="px-6 py-2.5 bg-gradient-primary hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-teal/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Prosseguir para Assinatura</span>
                    <i className="ri-arrow-right-line"></i>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Formulário de Assinatura Online */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Banner Informativo */}
              <div className="bg-teal-950/20 border border-teal-500/30 rounded-xl p-4 text-xs text-teal-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-teal-300">
                  <i className="ri-shield-star-line text-base"></i>
                  <span>Autorização para a Gravação: {termo.projeto_nome}</span>
                </div>
                <p className="text-gray-300">
                  Por favor, confirme seus dados pessoais abaixo, leia as cláusulas contratuais e assine com o dedo ou mouse no campo indicado.
                </p>
              </div>

              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 border-b border-dark-border pb-2">
                  <i className="ri-user-settings-line text-primary-teal"></i>
                  1. Seus Dados Pessoais (Autorizante)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-300">
                      Nome Civil Completo <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva Santos"
                      value={formData.autorizante_nome}
                      onChange={(e) => setFormData({ ...formData, autorizante_nome: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Nome Artístico (se houver)</label>
                    <input
                      type="text"
                      placeholder="Ex: Pr. Lucas"
                      value={formData.autorizante_nome_artistico}
                      onChange={(e) => setFormData({ ...formData, autorizante_nome_artistico: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">
                      CPF <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={formData.autorizante_cpf}
                      onChange={(e) => setFormData({ ...formData, autorizante_cpf: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">RG</label>
                    <input
                      type="text"
                      placeholder="00.000.000-0"
                      value={formData.autorizante_rg}
                      onChange={(e) => setFormData({ ...formData, autorizante_rg: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(21) 99999-9999"
                      value={formData.autorizante_telefone}
                      onChange={(e) => setFormData({ ...formData, autorizante_telefone: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-300">E-mail</label>
                    <input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={formData.autorizante_email}
                      onChange={(e) => setFormData({ ...formData, autorizante_email: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-300">Endereço Residencial</label>
                    <input
                      type="text"
                      placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
                      value={formData.autorizante_endereco}
                      onChange={(e) => setFormData({ ...formData, autorizante_endereco: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border focus:border-primary-teal rounded-xl text-sm text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Resumo do Termo */}
              <div className="space-y-3 bg-dark-bg/60 p-4 rounded-xl border border-dark-border text-xs text-gray-300 leading-relaxed">
                <div className="flex items-center justify-between border-b border-dark-border/60 pb-2">
                  <span className="font-bold text-white text-sm">2. Principais Cláusulas do Termo</span>
                  <button
                    type="button"
                    onClick={() => setActiveView('documento')}
                    className="text-primary-teal hover:underline font-bold text-xs cursor-pointer"
                  >
                    Ver texto na íntegra (10 cláusulas) →
                  </button>
                </div>
                <p>
                  • <strong>Objeto:</strong> Autorização expressa à CÉU MUSIC para captação, fixação, edição e veiculação de sua imagem, voz, nome e performance na gravação do projeto <strong>{termo.projeto_nome}</strong>.
                </p>
                <p>
                  • <strong>Finalidade:</strong> Divulgação institucional, promocional, redes sociais (Instagram, TikTok, YouTube), streaming, portfólio e plataformas digitais.
                </p>
                <p>
                  • <strong>Prazo:</strong> 10 (dez) anos contados desta assinatura, com manutenção histórica de acervo.
                </p>
                <p>
                  • <strong>LGPD:</strong> Tratamento de dados para fins de identificação e conformidade legal com a Lei nº 13.709/2018.
                </p>
              </div>

              {/* Assinatura Digital */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 border-b border-dark-border pb-2">
                  <i className="ri-quill-pen-line text-primary-teal"></i>
                  3. Assinatura Digital
                </h3>

                <SignaturePad
                  initialSignature={formData.assinatura_digital}
                  onSave={(sig) => setFormData({ ...formData, assinatura_digital: sig })}
                />

                {/* Checkbox Obrigatório */}
                <label className="flex items-start gap-3 p-4 rounded-xl bg-dark-bg border border-dark-border cursor-pointer hover:border-teal-500/50 transition-colors">
                  <input
                    type="checkbox"
                    required
                    checked={formData.declaracao_concordancia}
                    onChange={(e) => setFormData({ ...formData, declaracao_concordancia: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-gray-600 bg-dark-bg text-primary-teal focus:ring-primary-teal cursor-pointer"
                  />
                  <span className="text-xs text-gray-300 leading-relaxed">
                    Declaro sob as penas da lei que li, compreendi e concordo integralmente com todas as disposições do <strong>Termo de Autorização e Licença de Uso de Imagem, Voz, Nome e Performance Artística</strong> da Céu Music, reconhecendo a plena validade jurídica desta assinatura eletrônica.
                  </span>
                </label>
              </div>

              {/* Botão de Envio */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-gradient-primary hover:opacity-95 text-white font-extrabold text-base rounded-xl shadow-xl shadow-primary-teal/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin text-xl"></i>
                      <span>Registrando Assinatura...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-check-double-line text-xl"></i>
                      <span>Concordar e Assinar Termo de Imagem</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-gray-500 mt-2">
                  Ambiente seguro Céu Music • Conforme MP 2.200-2/2001 e Lei 14.063/2020
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
