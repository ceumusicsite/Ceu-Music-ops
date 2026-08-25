import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import SignaturePad from '../../../../components/estudio/SignaturePad';
import TermoParticipanteContent, {
  ProjetoParticipanteData,
} from '../../../../components/projetos/TermoParticipanteContent';

export default function ParticipanteTermoIndividualPublicoPage() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [participante, setParticipante] = useState<ProjetoParticipanteData | null>(null);
  const [formData, setFormData] = useState({
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
    funcao_instrumento: '',
    declaracao_concordancia: false,
    assinatura_digital: '',
  });

  const [activeView, setActiveView] = useState<'formulario' | 'documento'>('formulario');

  useEffect(() => {
    if (token) {
      loadParticipante(token);
    }
  }, [token]);

  const loadParticipante = async (tok: string) => {
    try {
      setLoading(true);
      setError(null);

      // Buscar participante pelo token individual
      const { data, error: fetchErr } = await supabase
        .from('projeto_participantes')
        .select(`
          *,
          projeto:projeto_id(
            id,
            nome,
            artista:artista_id(id, nome)
          )
        `)
        .eq('token', tok)
        .single();

      if (fetchErr || !data) {
        throw new Error('Termo de participante não encontrado ou link inválido.');
      }

      // Buscar nomes das faixas se houver
      let faixasNomes: string[] = [];
      if (data.faixas_ids && data.faixas_ids.length > 0) {
        const { data: faixasData } = await supabase
          .from('faixas')
          .select('id, nome')
          .in('id', data.faixas_ids);

        if (faixasData) {
          faixasNomes = faixasData.map((f) => f.nome);
        }
      }

      const enriched: ProjetoParticipanteData = {
        ...data,
        projeto_nome: data.projeto?.nome || 'Projeto Musical Céu Music',
        artista_nome: data.projeto?.artista?.nome || 'Céu Music',
        faixas_nomes: faixasNomes,
      };

      setParticipante(enriched);
      setFormData({
        autorizante_nome: data.autorizante_nome || '',
        autorizante_nome_artistico: data.autorizante_nome_artistico || '',
        autorizante_cpf: data.autorizante_cpf || '',
        autorizante_rg: data.autorizante_rg || '',
        autorizante_nacionalidade: data.autorizante_nacionalidade || 'Brasileiro(a)',
        autorizante_estado_civil: data.autorizante_estado_civil || '',
        autorizante_profissao: data.autorizante_profissao || 'Músico(a)',
        autorizante_endereco: data.autorizante_endereco || '',
        autorizante_email: data.autorizante_email || '',
        autorizante_telefone: data.autorizante_telefone || '',
        autorizante_pix: data.autorizante_pix || '',
        funcao_instrumento: data.funcao_instrumento || '',
        declaracao_concordancia: Boolean(data.declaracao_concordancia),
        assinatura_digital: data.assinatura_digital || '',
      });

      if (data.status === 'assinado') {
        setSuccess(true);
        setActiveView('documento');
      }
    } catch (err: any) {
      console.error('Erro ao carregar participante:', err);
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
      alert('É obrigatório concordar com os termos de uso e cessão para prosseguir.');
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
        .from('projeto_participantes')
        .update({
          autorizante_nome: formData.autorizante_nome.trim(),
          autorizante_nome_artistico: formData.autorizante_nome_artistico.trim() || null,
          autorizante_cpf: formData.autorizante_cpf.trim(),
          autorizante_rg: formData.autorizante_rg.trim() || null,
          autorizante_nacionalidade: formData.autorizante_nacionalidade.trim() || 'Brasileiro(a)',
          autorizante_estado_civil: formData.autorizante_estado_civil.trim() || null,
          autorizante_profissao: formData.autorizante_profissao.trim() || 'Músico(a)',
          autorizante_endereco: formData.autorizante_endereco.trim() || null,
          autorizante_email: formData.autorizante_email.trim() || null,
          autorizante_telefone: formData.autorizante_telefone.trim() || null,
          autorizante_pix: formData.autorizante_pix.trim() || null,
          funcao_instrumento: formData.funcao_instrumento.trim(),
          declaracao_concordancia: true,
          assinatura_digital: formData.assinatura_digital,
          status: 'assinado',
          aceito_em: now,
          user_agent: userAgent,
          ip_origem: 'Acesso Online (Web Signer Céu Music)',
          updated_at: now,
        })
        .eq('token', token)
        .select()
        .single();

      if (updateErr) throw updateErr;

      setParticipante((prev) =>
        prev
          ? {
              ...prev,
              ...data,
            }
          : data
      );

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
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 text-sm font-medium">Carregando Termo de Autorização...</p>
        </div>
      </div>
    );
  }

  if (error || !participante) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 text-2xl">
            <i className="ri-error-warning-line"></i>
          </div>
          <h2 className="text-lg font-bold text-white">Link Indisponível ou Inválido</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            {error || 'Não foi possível encontrar o termo de autorização com este link.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold uppercase tracking-wider">
            <i className="ri-shield-check-line"></i>
            Portal de Assinatura Eletrônica • Céu Music
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Termo de Autorização, Ficha Técnica e Cessão de Direitos
          </h1>
          <div className="pt-2 border-t border-[#30363d] flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-gray-400">
            <span>
              Projeto: <strong className="text-white">{participante.projeto_nome}</strong>
            </span>
            <span>•</span>
            <span>
              Artista: <strong className="text-teal-400">{participante.artista_nome}</strong>
            </span>
          </div>
        </div>

        {/* Visão de Sucesso / Já Assinado */}
        {success || participante.status === 'assinado' ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto text-2xl">
                <i className="ri-checkbox-circle-line"></i>
              </div>
              <h2 className="text-lg font-bold text-white">Termo Assinado com Sucesso</h2>
              <p className="text-xs text-gray-300 max-w-md mx-auto">
                Seu termo de cessão e autorização foi registrado digitalmente na Céu Music com carimbo de autenticidade jurídica.
              </p>
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
                >
                  <i className="ri-printer-line"></i>
                  Imprimir / Baixar PDF
                </button>
              </div>
            </div>

            <div className="bg-[#0d1117] p-6 rounded-xl border border-[#30363d]">
              <TermoParticipanteContent data={participante} isPrintable />
            </div>
          </div>
        ) : (
          /* Formulário de Assinatura */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex border-b border-[#30363d] pb-4 items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <i className="ri-edit-box-line text-teal-400"></i>
                  Confira seus Dados e Assine
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveView('formulario')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeView === 'formulario'
                        ? 'bg-teal-500 text-white'
                        : 'bg-[#0d1117] text-gray-400 hover:text-white'
                    }`}
                  >
                    Formulário
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('documento')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeView === 'documento'
                        ? 'bg-teal-500 text-white'
                        : 'bg-[#0d1117] text-gray-400 hover:text-white'
                    }`}
                  >
                    Ver Contrato
                  </button>
                </div>
              </div>

              {activeView === 'formulario' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        Nome Civil Completo <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.autorizante_nome}
                        onChange={(e) =>
                          setFormData({ ...formData, autorizante_nome: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        Nome Artístico (Como quer ser creditado)
                      </label>
                      <input
                        type="text"
                        value={formData.autorizante_nome_artistico}
                        onChange={(e) =>
                          setFormData({ ...formData, autorizante_nome_artistico: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        Instrumento / Função <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.funcao_instrumento}
                        onChange={(e) =>
                          setFormData({ ...formData, funcao_instrumento: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        CPF <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.autorizante_cpf}
                        onChange={(e) =>
                          setFormData({ ...formData, autorizante_cpf: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        RG
                      </label>
                      <input
                        type="text"
                        value={formData.autorizante_rg}
                        onChange={(e) =>
                          setFormData({ ...formData, autorizante_rg: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        WhatsApp / Celular
                      </label>
                      <input
                        type="tel"
                        value={formData.autorizante_telefone}
                        onChange={(e) =>
                          setFormData({ ...formData, autorizante_telefone: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={formData.autorizante_email}
                        onChange={(e) =>
                          setFormData({ ...formData, autorizante_email: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        Endereço Completo
                      </label>
                      <input
                        type="text"
                        value={formData.autorizante_endereco}
                        onChange={(e) =>
                          setFormData({ ...formData, autorizante_endereco: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        Chave PIX / Dados Bancários (para cachê / pagamentos)
                      </label>
                      <input
                        type="text"
                        value={formData.autorizante_pix}
                        onChange={(e) =>
                          setFormData({ ...formData, autorizante_pix: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400 font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0d1117] p-5 rounded-xl border border-[#30363d] max-h-[350px] overflow-y-auto">
                  <TermoParticipanteContent
                    data={{
                      ...participante,
                      autorizante_nome: formData.autorizante_nome,
                      autorizante_nome_artistico: formData.autorizante_nome_artistico,
                      autorizante_cpf: formData.autorizante_cpf,
                      autorizante_rg: formData.autorizante_rg,
                      autorizante_endereco: formData.autorizante_endereco,
                      autorizante_email: formData.autorizante_email,
                      autorizante_telefone: formData.autorizante_telefone,
                      autorizante_pix: formData.autorizante_pix,
                      funcao_instrumento: formData.funcao_instrumento,
                    }}
                  />
                </div>
              )}

              {/* Declaração de Aceite */}
              <label className="flex items-start gap-3 p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl cursor-pointer hover:bg-teal-500/15 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={formData.declaracao_concordancia}
                  onChange={(e) =>
                    setFormData({ ...formData, declaracao_concordancia: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 rounded text-teal-400 focus:ring-teal-400 bg-[#0d1117] border-[#30363d]"
                />
                <span className="text-xs text-gray-200 leading-relaxed font-medium">
                  Declaro que li e concordo integralmente com todas as cláusulas do presente Instrumento Particular de Autorização, Licença de Imagem/Voz e Cessão de Direitos Conexos da Céu Music, validando minha assinatura eletrônica abaixo.
                </span>
              </label>

              {/* Pad de Assinatura */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Desenhe sua Assinatura Digital:
                </h4>
                <div className="bg-[#0d1117] p-4 rounded-xl border border-[#30363d]">
                  <SignaturePad
                    onSave={(sig) => setFormData({ ...formData, assinatura_digital: sig })}
                    initialSignature={formData.assinatura_digital}
                  />
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !formData.declaracao_concordancia ||
                    !formData.assinatura_digital
                  }
                  className="px-8 py-3.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-xl shadow-teal-500/25 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Registrando sua Assinatura...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-shield-check-line text-lg"></i>
                      <span>Confirmar e Assinar Digitalmente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
