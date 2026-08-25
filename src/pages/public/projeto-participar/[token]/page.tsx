import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import SignaturePad from '../../../../components/estudio/SignaturePad';
import TermoParticipanteContent, {
  ProjetoParticipanteData,
  TIPOS_PARTICIPACAO_LABELS,
} from '../../../../components/projetos/TermoParticipanteContent';

interface FaixaItem {
  id: string;
  nome: string;
  ordem?: number;
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
  'Percussão Geral',
  'Metais / Sopros',
  'Saxofone',
  'Trompete',
  'Trombone',
  'Cordas / Violino',
  'Voz Principal',
  'Backing Vocal',
  'Coral',
  'Produção Musical',
  'Arranjos',
  'Mixagem',
  'Masterização',
];

export default function ProjetoParticiparPublicoPage() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [projeto, setProjeto] = useState<any>(null);
  const [faixas, setFaixas] = useState<FaixaItem[]>([]);
  const [signedRecord, setSignedRecord] = useState<ProjetoParticipanteData | null>(null);

  // Form state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [escopoFaixas, setEscopoFaixas] = useState<'todas' | 'especificas'>('todas');
  const [faixasCustomTexto, setFaixasCustomTexto] = useState('');
  const [formData, setFormData] = useState({
    tipo_participacao: 'musico',
    tipo_participacao_outro: '',
    funcao_instrumento: '',
    faixas_ids: [] as string[],
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
    declaracao_concordancia: false,
    assinatura_digital: '',
  });

  useEffect(() => {
    if (token) {
      loadProjeto(token);
    }
  }, [token]);

  const loadProjeto = async (tok: string) => {
    try {
      setLoading(true);
      setError(null);

      // Buscar projeto pelo token de cadastro
      const { data: projData, error: projError } = await supabase
        .from('projetos')
        .select(`
          id,
          nome,
          tipo,
          artista_id,
          artista:artista_id(id, nome)
        `)
        .eq('token_cadastro_participantes', tok)
        .single();

      if (projError || !projData) {
        throw new Error('Link de cadastro inválido ou projeto não encontrado.');
      }

      setProjeto(projData);

      // Buscar faixas do projeto
      const { data: faixasData } = await supabase
        .from('faixas')
        .select('id, nome, ordem')
        .eq('projeto_id', projData.id)
        .order('ordem', { ascending: true });

      if (faixasData && faixasData.length > 0) {
        setFaixas(faixasData);
        // Por padrão, selecionar todas as faixas
        setFormData((prev) => ({
          ...prev,
          faixas_ids: faixasData.map((f) => f.id),
        }));
      }
    } catch (err: any) {
      console.error('Erro ao carregar projeto pelo token:', err);
      setError(err.message || 'Erro ao carregar dados do projeto.');
    } finally {
      setLoading(false);
    }
  };

  const handleTipoParticipacaoChange = (novoTipo: string) => {
    let newEscopo: 'todas' | 'especificas' = escopoFaixas;
    let newFuncao = formData.funcao_instrumento;

    // Se for compositor, letrista ou cantor convidado, sugerir faixas específicas por padrão
    if (novoTipo === 'compositor' || novoTipo === 'letrista' || novoTipo === 'cantor_convidado') {
      newEscopo = 'especificas';
      if (!newFuncao || newFuncao === 'Bateria' || newFuncao === 'Baixo Elétrico') {
        if (novoTipo === 'compositor') newFuncao = 'Compositor(a)';
        if (novoTipo === 'letrista') newFuncao = 'Letrista';
        if (novoTipo === 'cantor_convidado') newFuncao = 'Voz / Participação Especial';
      }
    } else {
      newEscopo = 'todas';
      if (novoTipo === 'produtor_musical' && (!newFuncao || newFuncao.includes('Compositor'))) {
        newFuncao = 'Produção Musical';
      } else if (novoTipo === 'arranjador' && (!newFuncao || newFuncao.includes('Compositor'))) {
        newFuncao = 'Arranjos';
      } else if (novoTipo === 'mixador') {
        newFuncao = 'Mixagem';
      } else if (novoTipo === 'masterizador') {
        newFuncao = 'Masterização';
      }
    }

    setEscopoFaixas(newEscopo);
    setFormData({
      ...formData,
      tipo_participacao: novoTipo,
      funcao_instrumento: newFuncao,
      faixas_ids:
        newEscopo === 'todas' && faixas.length > 0
          ? faixas.map((f) => f.id)
          : newEscopo === 'especificas'
          ? formData.faixas_ids
          : [],
    });
  };

  const handleFaixaToggle = (faixaId: string) => {
    const current = formData.faixas_ids;
    const exists = current.includes(faixaId);
    setFormData({
      ...formData,
      faixas_ids: exists ? current.filter((id) => id !== faixaId) : [...current, faixaId],
    });
  };

  const handleSelectAllFaixas = () => {
    setFormData({
      ...formData,
      faixas_ids: faixas.map((f) => f.id),
    });
  };

  const handleClearFaixas = () => {
    setFormData({
      ...formData,
      faixas_ids: [],
    });
  };

  const validateStep1 = () => {
    if (!formData.autorizante_nome.trim()) {
      alert('Por favor, informe seu nome civil completo.');
      return false;
    }
    if (!formData.autorizante_cpf.trim()) {
      alert('Por favor, informe seu CPF para validação jurídica do termo.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.funcao_instrumento.trim()) {
      alert('Por favor, informe seu instrumento ou função no projeto.');
      return false;
    }
    if (escopoFaixas === 'especificas') {
      if (faixas.length > 0 && formData.faixas_ids.length === 0) {
        alert('Por favor, selecione pelo menos uma faixa em que você participou.');
        return false;
      }
      if (faixas.length === 0 && !faixasCustomTexto.trim()) {
        alert('Por favor, informe o nome da(s) faixa(s) em que você participou.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const partToken = `ceu_part_${randomHex}`;

      let finalFaixasIds: string[] = [];
      let finalFaixasNomes: string[] = [];
      let obsAdicional = '';

      if (escopoFaixas === 'todas') {
        finalFaixasIds = faixas.map((f) => f.id);
        finalFaixasNomes = ['Todas as faixas do projeto'];
      } else {
        if (faixas.length > 0) {
          finalFaixasIds = formData.faixas_ids;
          finalFaixasNomes = (formData.faixas_ids || [])
            .map((fId) => faixas.find((f) => f.id === fId)?.nome)
            .filter(Boolean) as string[];
        } else {
          finalFaixasIds = [];
          finalFaixasNomes = faixasCustomTexto
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          obsAdicional = `Faixas informadas: ${faixasCustomTexto}`;
        }
      }

      const payload: any = {
        projeto_id: projeto.id,
        faixas_ids: finalFaixasIds,
        tipo_participacao: formData.tipo_participacao,
        tipo_participacao_outro: formData.tipo_participacao_outro || null,
        funcao_instrumento: formData.funcao_instrumento.trim(),
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
        observacoes: obsAdicional || null,
        status: 'assinado',
        token: partToken,
        declaracao_concordancia: true,
        assinatura_digital: formData.assinatura_digital,
        aceito_em: now,
        ip_origem: 'Acesso Online (Web Signer Céu Music)',
        user_agent: userAgent,
        termo_versao: '1.0',
        created_at: now,
        updated_at: now,
      };

      const { data, error: insertError } = await supabase
        .from('projeto_participantes')
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;

      setSignedRecord({
        ...data,
        projeto_nome: projeto.nome,
        artista_nome: projeto.artista?.nome || 'Céu Music',
        faixas_nomes: finalFaixasNomes.length > 0 ? finalFaixasNomes : ['Todas as faixas do projeto'],
      });

      setSuccess(true);
    } catch (err: any) {
      console.error('Erro ao cadastrar participante e assinar termo:', err);
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
          <p className="text-gray-400 text-sm font-medium">Carregando Ficha Técnica do Projeto...</p>
        </div>
      </div>
    );
  }

  if (error || !projeto) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 text-2xl">
            <i className="ri-error-warning-line"></i>
          </div>
          <h2 className="text-lg font-bold text-white">Link Indisponível ou Inválido</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            {error || 'Não foi possível encontrar as informações do projeto com este link.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Institucional */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold uppercase tracking-wider">
            <i className="ri-shield-check-line"></i>
            Portal Oficial de Ficha Técnica & Contratos
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Cadastro de Participante e Assinatura de Termo
          </h1>
          <div className="pt-2 border-t border-[#30363d] flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-gray-400">
            <span>
              Projeto: <strong className="text-white">{projeto.nome}</strong>
            </span>
            <span>•</span>
            <span>
              Artista: <strong className="text-teal-400">{projeto.artista?.nome || 'Céu Music'}</strong>
            </span>
          </div>
        </div>

        {/* TELA DE SUCESSO / DOCUMENTO ASSINADO */}
        {success && signedRecord ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-3 bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <div className="w-14 h-14 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto text-3xl">
                <i className="ri-checkbox-circle-line"></i>
              </div>
              <h2 className="text-xl font-bold text-white">Cadastro e Assinatura Concluídos com Sucesso!</h2>
              <p className="text-xs text-gray-300 max-w-lg mx-auto">
                Seus dados foram integrados à ficha técnica oficial do projeto na Céu Music e o termo de cessão e autorização foi registrado digitalmente com validade jurídica.
              </p>
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
                >
                  <i className="ri-printer-line"></i>
                  Imprimir / Baixar Comprovante em PDF
                </button>
              </div>
            </div>

            {/* Visualização do Termo Assinado */}
            <div className="bg-[#0d1117] p-6 rounded-xl border border-[#30363d]">
              <TermoParticipanteContent data={signedRecord} isPrintable />
            </div>
          </div>
        ) : (
          /* FORMULÁRIO DE CADASTRO E ASSINATURA */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Indicador de Passos */}
            <div className="grid grid-cols-3 gap-2 bg-[#161b22] p-2 rounded-xl border border-[#30363d]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                  step === 1 ? 'bg-teal-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                1. Seus Dados
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                  step === 2 ? 'bg-teal-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                2. Instrumento & Faixas
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep1() && validateStep2()) setStep(3);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                  step === 3 ? 'bg-teal-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                3. Termos & Assinatura
              </button>
            </div>

            {/* PASSO 1: DADOS PESSOAIS */}
            {step === 1 && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#30363d] pb-3">
                  <i className="ri-user-smile-line text-teal-400"></i>
                  Informações Pessoais e de Contato
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Nome Civil Completo <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.autorizante_nome}
                      onChange={(e) => setFormData({ ...formData, autorizante_nome: e.target.value })}
                      placeholder="Seu nome completo para o contrato"
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
                      placeholder="Ex: Joãozinho do Baixo (ou deixe vazio se for o mesmo)"
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
                      onChange={(e) => setFormData({ ...formData, autorizante_cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      RG e Órgão Emissor
                    </label>
                    <input
                      type="text"
                      value={formData.autorizante_rg}
                      onChange={(e) => setFormData({ ...formData, autorizante_rg: e.target.value })}
                      placeholder="Ex: 12.345.678-9 SSP/RJ"
                      className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      WhatsApp / Celular <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.autorizante_telefone}
                      onChange={(e) =>
                        setFormData({ ...formData, autorizante_telefone: e.target.value })
                      }
                      placeholder="(21) 99999-9999"
                      className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={formData.autorizante_email}
                      onChange={(e) => setFormData({ ...formData, autorizante_email: e.target.value })}
                      placeholder="seu@email.com"
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
                      placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                      className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Chave PIX / Dados Bancários (para cachê / pagamentos futuros)
                    </label>
                    <input
                      type="text"
                      value={formData.autorizante_pix}
                      onChange={(e) => setFormData({ ...formData, autorizante_pix: e.target.value })}
                      placeholder="Chave PIX (CPF, E-mail, Celular ou Aleatória)"
                      className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep1()) setStep(2);
                    }}
                    className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
                  >
                    <span>Avançar para Instrumento & Faixas</span>
                    <i className="ri-arrow-right-line"></i>
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 2: INSTRUMENTO E FAIXAS */}
            {step === 2 && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-5 shadow-xl">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#30363d] pb-3">
                  <i className="ri-music-2-line text-teal-400"></i>
                  Sua Atuação no Projeto Musical
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Qual sua função principal? <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.tipo_participacao}
                      onChange={(e) => handleTipoParticipacaoChange(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400"
                    >
                      {Object.entries(TIPOS_PARTICIPACAO_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Instrumento(s) ou Execução Técnica <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.funcao_instrumento}
                      onChange={(e) =>
                        setFormData({ ...formData, funcao_instrumento: e.target.value })
                      }
                      placeholder="Ex: Bateria, Violão de Aço, Backing Vocal, Teclados..."
                      className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400"
                    />

                    {/* Sugestões Rápidas */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {INSTRUMENTOS_SUGESTOES.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setFormData({ ...formData, funcao_instrumento: sug })}
                          className="text-[11px] px-2.5 py-1 bg-[#0d1117] border border-[#30363d] rounded-lg text-gray-300 hover:text-white hover:border-teal-400/50 transition-colors"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Escopo de Participação nas Faixas */}
                  <div className="pt-4 border-t border-[#30363d] space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300">
                        Em quais faixas você participou ou vai participar? <span className="text-red-400">*</span>
                      </label>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Defina se sua atuação é válida para todo o projeto ou para faixas específicas.
                      </p>
                    </div>

                    {/* Seletor de Escopo: Todas vs Específicas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEscopoFaixas('todas');
                          if (faixas.length > 0) {
                            setFormData({ ...formData, faixas_ids: faixas.map((f) => f.id) });
                          }
                        }}
                        className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          escopoFaixas === 'todas'
                            ? 'bg-teal-500/10 border-teal-500/60 text-white shadow-sm'
                            : 'bg-[#0d1117] border-[#30363d] text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <i
                          className={`text-lg mt-0.5 ${
                            escopoFaixas === 'todas'
                              ? 'ri-radio-button-fill text-teal-400'
                              : 'ri-checkbox-blank-circle-line text-gray-600'
                          }`}
                        ></i>
                        <div>
                          <p className="text-xs font-bold">Todas as faixas do projeto</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Padrão para músicos, arranjadores, produtores, mixagem e masterização.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEscopoFaixas('especificas');
                        }}
                        className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          escopoFaixas === 'especificas'
                            ? 'bg-teal-500/10 border-teal-500/60 text-white shadow-sm'
                            : 'bg-[#0d1117] border-[#30363d] text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <i
                          className={`text-lg mt-0.5 ${
                            escopoFaixas === 'especificas'
                              ? 'ri-radio-button-fill text-teal-400'
                              : 'ri-checkbox-blank-circle-line text-gray-600'
                          }`}
                        ></i>
                        <div>
                          <p className="text-xs font-bold">Faixas específicas / Selecionar</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Ideal para compositores, letristas, feats ou participações pontuais.
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Exibição condicional quando escopo for específico */}
                    {escopoFaixas === 'especificas' && (
                      <div className="bg-[#0d1117] p-4 rounded-xl border border-[#30363d] space-y-3 animate-in fade-in duration-200">
                        {faixas.length > 0 ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-300 font-semibold">
                                Marque as faixas em que você participou:
                              </span>
                              <div className="flex gap-2 text-[11px]">
                                <button
                                  type="button"
                                  onClick={handleSelectAllFaixas}
                                  className="text-teal-400 hover:underline cursor-pointer"
                                >
                                  Marcar todas
                                </button>
                                <span className="text-gray-500">•</span>
                                <button
                                  type="button"
                                  onClick={handleClearFaixas}
                                  className="text-gray-400 hover:underline cursor-pointer"
                                >
                                  Desmarcar todas
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {faixas.map((fx) => {
                                const isSelected = formData.faixas_ids.includes(fx.id);
                                return (
                                  <button
                                    key={fx.id}
                                    type="button"
                                    onClick={() => handleFaixaToggle(fx.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-teal-500/15 border-teal-500/60 text-teal-300 shadow-sm'
                                        : 'bg-[#161b22] border-[#30363d] text-gray-400 hover:text-gray-200'
                                    }`}
                                  >
                                    <i
                                      className={`text-base ${
                                        isSelected
                                          ? 'ri-checkbox-circle-fill text-teal-400'
                                          : 'ri-checkbox-blank-circle-line text-gray-600'
                                      }`}
                                    ></i>
                                    <span className="truncate font-medium">{fx.nome}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-300">
                              Informe os nomes das faixas em que você participou: <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={faixasCustomTexto}
                              onChange={(e) => setFaixasCustomTexto(e.target.value)}
                              placeholder="Ex: Faixa 1, Nome da Música..."
                              className="w-full px-4 py-3 bg-[#161b22] border border-[#30363d] rounded-xl text-white text-sm focus:outline-none focus:border-teal-400"
                            />
                            <p className="text-[11px] text-gray-500">
                              Separe por vírgula se tiver participado de mais de uma faixa.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {escopoFaixas === 'todas' && (
                      <div className="flex items-center gap-2.5 p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs text-teal-300 animate-in fade-in duration-150">
                        <i className="ri-checkbox-circle-line text-base text-teal-400 shrink-0"></i>
                        <span>
                          Sua participação técnica e cessão de direitos serão válidas para <strong>todas as faixas</strong> do projeto.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep2()) setStep(3);
                    }}
                    className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
                  >
                    <span>Avançar para Termo & Assinatura</span>
                    <i className="ri-arrow-right-line"></i>
                  </button>
                </div>
              </div>
            )}

            {/* PASSO 3: LEITURA DO TERMO E ASSINATURA */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Termo Formatado */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#30363d] pb-3">
                    <i className="ri-file-shield-line text-teal-400"></i>
                    Instrumento Jurídico de Autorização e Cessão de Direitos
                  </h3>

                  <div className="max-h-[360px] overflow-y-auto bg-[#0d1117] p-5 rounded-xl border border-[#30363d]">
                    <TermoParticipanteContent
                      data={{
                        projeto_id: projeto.id,
                        projeto_nome: projeto.nome,
                        artista_nome: projeto.artista?.nome || 'Céu Music',
                        tipo_participacao: formData.tipo_participacao,
                        tipo_participacao_outro: formData.tipo_participacao_outro,
                        funcao_instrumento: formData.funcao_instrumento,
                        autorizante_nome: formData.autorizante_nome,
                        autorizante_nome_artistico: formData.autorizante_nome_artistico,
                        autorizante_cpf: formData.autorizante_cpf,
                        autorizante_rg: formData.autorizante_rg,
                        autorizante_endereco: formData.autorizante_endereco,
                        autorizante_email: formData.autorizante_email,
                        autorizante_telefone: formData.autorizante_telefone,
                        autorizante_pix: formData.autorizante_pix,
                        status: 'pendente',
                        faixas_nomes: (formData.faixas_ids || [])
                          .map((fId) => faixas.find((f) => f.id === fId)?.nome)
                          .filter(Boolean) as string[],
                      }}
                    />
                  </div>

                  {/* Declaração de Concordância */}
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
                      Declaro que li e concordo integralmente com todas as cláusulas do presente Instrumento Particular de Autorização, Licença de Imagem/Voz e Cessão de Direitos Conexos da Céu Music, autorizando o uso dos meus dados para fins de Ficha Técnica e créditos oficiais.
                    </span>
                  </label>
                </div>

                {/* Pad de Assinatura Digital */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#30363d] pb-3">
                    <i className="ri-edit-2-line text-teal-400"></i>
                    Assinatura Digital
                  </h3>
                  <p className="text-xs text-gray-400">
                    Desenhe sua assinatura no quadro abaixo usando o dedo (no celular/tablet) ou o mouse:
                  </p>

                  <div className="bg-[#0d1117] p-4 rounded-xl border border-[#30363d]">
                    <SignaturePad
                      onSave={(sig) => setFormData({ ...formData, assinatura_digital: sig })}
                      initialSignature={formData.assinatura_digital}
                    />
                  </div>
                </div>

                {/* Botões Finais de Submissão */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-3 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Voltar
                  </button>

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
                        <span>Confirmar e Assinar Termo Digital</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
