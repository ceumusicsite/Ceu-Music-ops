import { useState, useEffect, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface Campanha {
  id: string;
  assunto: string;
  conteudo: string;
  destinatarios_tipo: 'artistas' | 'produtores' | 'fornecedores' | 'todos' | 'custom' | 'list';
  total_destinatarios: number;
  status: 'pendente' | 'enviando' | 'enviado' | 'erro';
  erro_detalhes: string | null;
  created_at: string;
  criado_por?: string;
  users?: {
    name: string;
  } | null;
}

interface ListaTransmissao {
  id: string;
  nome: string;
  emails: string[];
  created_at: string;
}

interface Anexo {
  filename: string;
  content: string; // Base64
  size: number;
}

const CEU_FOOTER_HTML = `
<br><br>
<div style="border-top: 1px solid #2a2a2a; margin-top: 30px; padding-top: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #967a70; font-size: 12px; line-height: 1.5; max-width: 600px;">
  <div style="margin-bottom: 12px;">
    <div style="background-color: #0c0c0d; padding: 12px 16px; border-radius: 8px; display: inline-block; margin-bottom: 10px; border: 1px solid #1f2023;">
      <img src="https://static.readdy.ai/image/016995f7e8292e3ea703f912413c6e1c/af9e13ed434ed318d1a9a4df0aa3c822.png" alt="Céu Music" width="140" style="object-fit: contain; display: block; border: 0;" />
    </div>
    <br />
    <span style="font-size: 10px; background-color: #10767c; color: #ffffff; padding: 2px 6px; border-radius: 3px; font-weight: bold; text-transform: uppercase; display: inline-block;">COMUNICADO</span>
  </div>
  <p style="margin: 0 0 8px 0; color: #a6a6a6;">Este é um comunicado oficial enviado pela gravadora <strong>Céu Music</strong> para contatos autorizados cadastrados em nossa rede de produção musical.</p>
  <p style="margin: 0; font-size: 10px; color: #555555;">© 2026 Céu Music. Todos os direitos reservados. Rio de Janeiro - Brasil.</p>
</div>
`;

type TabType = 'enviar' | 'listas';

export default function EmailsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAuthorized = user?.role === 'admin' || user?.role === 'executivo';

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>('enviar');
  const [assunto, setAssunto] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [destinatariosTipo, setDestinatariosTipo] = useState<'artistas' | 'produtores' | 'fornecedores' | 'todos' | 'custom' | 'list'>('artistas');
  const [destinatariosCustom, setDestinatariosCustom] = useState('');
  const [selectedListaId, setSelectedListaId] = useState('');
  const [rodapeTipo, setRodapeTipo] = useState<'padrao' | 'nenhum'>('padrao');
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [remetenteNome, setRemetenteNome] = useState('Céu Music');
  const [remetenteUsuario, setRemetenteUsuario] = useState('contato');

  // Estados de listas de transmissão
  const [listas, setListas] = useState<ListaTransmissao[]>([]);
  const [loadingListas, setLoadingListas] = useState(false);
  const [novaListaNome, setNovaListaNome] = useState('');
  const [novaListaEmails, setNovaListaEmails] = useState('');
  const [savingLista, setSavingLista] = useState(false);

  // Estados de campanhas e histórico
  const [sending, setSending] = useState(false);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [counts, setCounts] = useState({
    artistas: 0,
    produtores: 0,
    fornecedores: 0,
    todos: 0,
    custom: 0,
    list: 0,
  });

  // Carregar contagem estimada de destinatários do banco
  const loadCounts = async () => {
    try {
      const [art, prod, forn] = await Promise.all([
        supabase.from('artistas').select('id', { count: 'exact', head: true }).not('contato_email', 'is', null),
        supabase.from('produtores').select('id', { count: 'exact', head: true }).not('contato_email', 'is', null),
        supabase.from('fornecedores').select('id', { count: 'exact', head: true }).not('contato_email', 'is', null)
      ]);

      const artCount = art.count || 0;
      const prodCount = prod.count || 0;
      const fornCount = forn.count || 0;

      setCounts(prev => ({
        ...prev,
        artistas: artCount,
        produtores: prodCount,
        fornecedores: fornCount,
        todos: artCount + prodCount + fornCount,
      }));
    } catch (error) {
      console.error('Erro ao buscar contagem de contatos:', error);
    }
  };

  // Carregar listas de transmissão salvas
  const loadListas = async () => {
    if (!isAuthorized) return;
    try {
      setLoadingListas(true);
      const { data, error } = await supabase
        .from('listas_transmissao')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListas(data || []);

      // Atualizar contagem da lista selecionada no momento
      if (selectedListaId) {
        const selected = data?.find(l => l.id === selectedListaId);
        setCounts(prev => ({
          ...prev,
          list: selected?.emails.length || 0,
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar listas de transmissão:', error);
    } finally {
      setLoadingListas(false);
    }
  };

  // Carregar histórico de campanhas
  const loadCampanhas = async () => {
    if (!isAuthorized) return;
    try {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('campanhas_email')
        .select(`
          *,
          users (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampanhas(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico de campanhas:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadCounts();
      loadListas();
      loadCampanhas();
    }
  }, [isAuthorized]);

  // Atualizar contagens dinâmicas de custom e list
  useEffect(() => {
    if (destinatariosTipo === 'custom') {
      const parsed = destinatariosCustom.split(',')
        .map(e => e.trim())
        .filter(e => e.includes('@'));
      setCounts(prev => ({ ...prev, custom: parsed.length }));
    }
  }, [destinatariosCustom, destinatariosTipo]);

  useEffect(() => {
    if (destinatariosTipo === 'list' && selectedListaId) {
      const selected = listas.find(l => l.id === selectedListaId);
      setCounts(prev => ({ ...prev, list: selected?.emails.length || 0 }));
    } else {
      setCounts(prev => ({ ...prev, list: 0 }));
    }
  }, [selectedListaId, destinatariosTipo, listas]);

  // Salvar nova lista de transmissão
  const handleSaveLista = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaListaNome.trim() || !novaListaEmails.trim()) {
      toast.warning('Preencha o nome da lista e pelo menos um e-mail.');
      return;
    }

    setSavingLista(true);
    try {
      // Aceita e-mails por linha ou por vírgula
      const parsedEmails = novaListaEmails
        .replace(/,/g, '\n')
        .split('\n')
        .map(e => e.trim())
        .filter(e => e.includes('@'));

      if (parsedEmails.length === 0) {
        toast.error('Nenhum e-mail válido encontrado na lista (use um por linha ou separados por vírgula).');
        setSavingLista(false);
        return;
      }

      const { error } = await supabase
        .from('listas_transmissao')
        .insert({
          nome: novaListaNome.trim(),
          emails: parsedEmails,
          criado_por: user?.id,
        });

      if (error) throw error;

      toast.success('Lista de transmissão criada com sucesso!');
      setNovaListaNome('');
      setNovaListaEmails('');
      await loadListas();
    } catch (error: any) {
      console.error('Erro ao salvar lista:', error);
      toast.error(`Falha ao salvar lista: ${error.message}`);
    } finally {
      setSavingLista(false);
    }
  };

  // Excluir lista de transmissão
  const handleDeleteLista = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta lista de transmissão?')) return;
    try {
      const { error } = await supabase
        .from('listas_transmissao')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (selectedListaId === id) {
        setSelectedListaId('');
      }
      await loadListas();
    } catch (error: any) {
      console.error('Erro ao deletar lista:', error);
      toast.error(`Erro ao deletar: ${error.message}`);
    }
  };

  // Ler arquivos de anexo e converter para Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);

      const currentTotalSize = anexos.reduce((acc, a) => acc + a.size, 0);
      const addedSize = filesArray.reduce((acc, f) => acc + f.size, 0);

      if (currentTotalSize + addedSize > 10 * 1024 * 1024) {
        toast.warning('O tamanho total dos anexos não deve ultrapassar 10MB.');
        return;
      }

      filesArray.forEach((file) => {
        if (anexos.some(a => a.filename === file.name)) return;

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          setAnexos((prev) => [
            ...prev,
            {
              filename: file.name,
              content: base64String,
              size: file.size,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeAnexo = (index: number) => {
    setAnexos(prev => prev.filter((_, i) => i !== index));
  };

  // Enviar o e-mail em massa
  const handleSendEmail = async () => {
    if (!assunto.trim() || !conteudo.trim()) {
      toast.warning('Por favor, preencha o assunto e o conteúdo do e-mail.');
      return;
    }

    if (destinatariosTipo === 'custom' && !destinatariosCustom.trim()) {
      toast.warning('Insira pelo menos um e-mail destinatário.');
      return;
    }

    if (destinatariosTipo === 'list' && !selectedListaId) {
      toast.warning('Selecione uma lista de transmissão.');
      return;
    }

    setSending(true);
    setShowConfirmModal(false);

    const conteudoFinal = rodapeTipo === 'padrao'
      ? `${conteudo}${CEU_FOOTER_HTML}`
      : conteudo;

    try {
      const fromEmail = remetenteNome.trim()
        ? `${remetenteNome.trim()} <${remetenteUsuario.trim()}@ceumusicbr.com.br>`
        : `${remetenteUsuario.trim()}@ceumusicbr.com.br`;

      const payload: any = {
        assunto,
        conteudo: conteudoFinal,
        destinatarios_tipo: destinatariosTipo,
        remetente: fromEmail,
      };

      if (destinatariosTipo === 'custom') {
        payload.destinatarios_custom = destinatariosCustom.split(',').map(e => e.trim());
      } else if (destinatariosTipo === 'list') {
        payload.lista_id = selectedListaId;
      }

      if (anexos.length > 0) {
        payload.anexos = anexos.map(a => ({
          filename: a.filename,
          content: a.content,
        }));
      }

      const { data, error } = await supabase.functions.invoke('send-bulk-emails', {
        body: payload,
      });

      if (error) throw error;

      toast.success(`Campanha enviada com sucesso para ${data?.totalSent || 0} destinatários!`);
      setAssunto('');
      setConteudo('');
      setAnexos([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadCampanhas();
    } catch (error: any) {
      console.error('Erro ao disparar campanha:', error);
      toast.error(`Falha ao disparar e-mails: ${error.message || 'Erro desconhecido.'}`);
      loadCampanhas();
    } finally {
      setSending(false);
    }
  };

  const getPreviewHtml = (htmlContent: string) => {
    let result = htmlContent || '<p class="text-gray-500 italic">O conteúdo do e-mail aparecerá aqui...</p>';
    result = result
      .replace(/\{\{\s*nome\s*\}\}/gi, '<strong>[Nome do Destinatário]</strong>')
      .replace(/\n/g, '<br />');

    if (rodapeTipo === 'padrao') {
      result += CEU_FOOTER_HTML;
    }
    return result;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isAuthorized) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <i className="ri-shield-cross-line text-6xl text-red-400 mb-4"></i>
            <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
            <p className="text-gray-400">Apenas administradores e executivos podem acessar esta página.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const currentRecipientCount = counts[destinatariosTipo];

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">E-mails em Massa</h1>
            <p className="text-gray-400">Envie comunicados oficiais, avisos de produção e gerencie listas de transmissão.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('enviar')}
              className={`px-4 py-2 rounded-lg transition-smooth cursor-pointer flex items-center gap-2 text-sm font-medium ${
                activeTab === 'enviar'
                  ? 'bg-gradient-primary text-white'
                  : 'bg-dark-bg text-gray-400 hover:bg-dark-hover hover:text-white'
              }`}
            >
              <i className="ri-send-plane-2-line"></i>
              <span>Enviar Campanha</span>
            </button>
            <button
              onClick={() => setActiveTab('listas')}
              className={`px-4 py-2 rounded-lg transition-smooth cursor-pointer flex items-center gap-2 text-sm font-medium ${
                activeTab === 'listas'
                  ? 'bg-gradient-primary text-white'
                  : 'bg-dark-bg text-gray-400 hover:bg-dark-hover hover:text-white'
              }`}
            >
              <i className="ri-contacts-book-line"></i>
              <span>Listas de Transmissão</span>
              {listas.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary-teal text-white text-3xs rounded-full">
                  {listas.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Enviar Campanha */}
        {activeTab === 'enviar' && (
          <>
            {/* Formulário e Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Card de Configuração do Envio */}
              <div className="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <i className="ri-mail-add-line text-primary-teal"></i> Configurações do Envio
                  </h2>

                  {/* Público-Alvo / Seleção */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Selecione o Público-Alvo</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(['artistas', 'produtores', 'fornecedores', 'todos', 'custom', 'list'] as const).map((tipo) => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => setDestinatariosTipo(tipo)}
                          className={`px-3 py-2 text-xs font-semibold rounded-lg capitalize border transition-smooth cursor-pointer ${
                            destinatariosTipo === tipo
                              ? 'bg-primary-teal/20 text-primary-teal border-primary-teal'
                              : 'bg-dark-bg text-gray-400 border-dark-border hover:bg-dark-hover'
                          }`}
                        >
                          {tipo === 'todos' ? 'Todos' : tipo === 'custom' ? 'Personalizado' : tipo === 'list' ? 'Lista Salva' : tipo} ({counts[tipo]})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Campo Condicional de Destinatários Personalizados */}
                  {destinatariosTipo === 'custom' && (
                    <div className="animate-pulse duration-300">
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Destinatários Personalizados</label>
                      <textarea
                        value={destinatariosCustom}
                        onChange={(e) => setDestinatariosCustom(e.target.value)}
                        placeholder="Cole os e-mails separados por vírgula (ex: artista@email.com, produtor@email.com)"
                        rows={2}
                        className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      ></textarea>
                    </div>
                  )}

                  {/* Campo Condicional de Listas de Transmissão */}
                  {destinatariosTipo === 'list' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Escolha a Lista de Transmissão</label>
                      {listas.length === 0 ? (
                        <div className="bg-dark-bg border border-dark-border rounded-lg p-3 text-xs text-yellow-500/80">
                          ⚠️ Você não possui nenhuma lista de transmissão criada.{' '}
                          <button
                            type="button"
                            onClick={() => setActiveTab('listas')}
                            className="underline hover:text-white font-semibold cursor-pointer"
                          >
                            Clique aqui para criar uma lista
                          </button>
                        </div>
                      ) : (
                        <select
                          value={selectedListaId}
                          onChange={(e) => setSelectedListaId(e.target.value)}
                          className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                        >
                          <option value="">Selecione uma lista...</option>
                          {listas.map(l => (
                            <option key={l.id} value={l.id}>{l.nome} ({l.emails.length} contatos)</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Remetente */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">
                        Nome do Remetente
                      </label>
                      <input
                        type="text"
                        value={remetenteNome}
                        onChange={(e) => setRemetenteNome(e.target.value)}
                        placeholder="Ex: CEU Music, Gabriel"
                        className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">
                        E-mail do Remetente
                      </label>
                      <div className="flex rounded-lg overflow-hidden border border-dark-border focus-within:border-primary-teal transition-smooth">
                        <input
                          type="text"
                          value={remetenteUsuario}
                          onChange={(e) => setRemetenteUsuario(e.target.value)}
                          placeholder="Ex: contato"
                          className="flex-1 min-w-0 px-4 py-2 bg-dark-bg text-white text-sm focus:outline-none"
                        />
                        <span className="inline-flex items-center px-3 bg-dark-hover text-gray-400 text-xs border-l border-dark-border select-none">
                          @ceumusicbr.com.br
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assunto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Assunto</label>
                    <input
                      type="text"
                      value={assunto}
                      onChange={(e) => setAssunto(e.target.value)}
                      placeholder="Assunto do e-mail"
                      className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    />
                  </div>

                  {/* Monospace Composer */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-sm font-medium text-gray-400">Mensagem (HTML ou Texto)</label>
                      <span className="text-xs text-gray-500">
                        Use <code className="bg-dark-bg px-1 py-0.5 rounded text-primary-teal">{"{{nome}}"}</code> para personalização
                      </span>
                    </div>
                    <textarea
                      value={conteudo}
                      onChange={(e) => setConteudo(e.target.value)}
                      rows={8}
                      placeholder="Olá {{nome}},\n\nInsira sua mensagem oficial..."
                      className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth font-mono"
                    ></textarea>
                  </div>

                  {/* Seleção do Rodapé */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Rodapé Céu Music</label>
                    <select
                      value={rodapeTipo}
                      onChange={(e) => setRodapeTipo(e.target.value as 'padrao' | 'nenhum')}
                      className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                    >
                      <option value="padrao">Rodapé Oficial CEU Music</option>
                      <option value="nenhum">Sem rodapé corporativo</option>
                    </select>
                  </div>

                  {/* Seleção de Anexos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Anexos (Máx 10MB total)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-dark-bg border border-dark-border text-gray-300 hover:text-white rounded-lg text-sm flex items-center gap-2 transition-smooth cursor-pointer"
                      >
                        <i className="ri-attachment-line text-primary-teal"></i>
                        <span>Selecionar Arquivos</span>
                      </button>
                      <span className="text-xs text-gray-500">
                        {anexos.length > 0 ? `${anexos.length} arquivos selecionados (${formatSize(anexos.reduce((a, b) => a + b.size, 0))})` : 'Nenhum arquivo anexado'}
                      </span>
                    </div>

                    {/* Lista de Anexos Anexados */}
                    {anexos.length > 0 && (
                      <div className="mt-3 bg-dark-bg border border-dark-border rounded-lg p-3 space-y-1.5 max-h-[120px] overflow-y-auto">
                        {anexos.map((anexo, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-gray-300">
                            <span className="truncate max-w-[70%] flex items-center gap-1.5">
                              <i className="ri-file-line text-primary-teal"></i>
                              {anexo.filename}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{formatSize(anexo.size)}</span>
                              <button
                                type="button"
                                onClick={() => removeAnexo(idx)}
                                className="text-red-400 hover:text-red-300 p-0.5"
                              >
                                <i className="ri-close-line"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Enviar */}
                <div className="mt-6 pt-4 border-t border-dark-border flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Total Destinatários: <strong className="text-white">{currentRecipientCount} e-mails</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={sending || !assunto.trim() || !conteudo.trim()}
                    className="px-6 py-2.5 bg-gradient-primary hover:opacity-90 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-2 transition-smooth cursor-pointer text-sm"
                  >
                    {sending ? (
                      <>
                        <i className="ri-loader-4-line animate-spin"></i>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <i className="ri-send-plane-line"></i>
                        <span>Disparar Campanha</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Card de Preview */}
              <div className="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col h-full font-sans">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <i className="ri-eye-line text-primary-teal"></i> Visualização do E-mail
                </h2>
                <div className="flex-1 bg-dark-bg border border-dark-border rounded-xl p-5 overflow-auto max-h-[580px]">
                  <div className="border-b border-dark-border pb-3 mb-4 space-y-1.5 text-xs text-gray-400">
                    <div>
                      <span className="font-semibold text-white">De:</span> {remetenteNome ? `${remetenteNome} <${remetenteUsuario}@ceumusicbr.com.br>` : `${remetenteUsuario}@ceumusicbr.com.br`}
                    </div>
                    <div>
                      <span className="font-semibold text-white">Para:</span>{' '}
                      {destinatariosTipo === 'artistas' && '[Nome do Artista] <artista@email.com>'}
                      {destinatariosTipo === 'produtores' && '[Nome do Produtor] <produtor@email.com>'}
                      {destinatariosTipo === 'fornecedores' && '[Nome do Fornecedor] <fornecedor@email.com>'}
                      {destinatariosTipo === 'todos' && '[Nome do Contato] <contato@email.com>'}
                      {destinatariosTipo === 'custom' && (destinatariosCustom ? destinatariosCustom.split(',')[0].trim() + (destinatariosCustom.split(',').length > 1 ? ` (+${destinatariosCustom.split(',').length - 1})` : '') : '[Destinatários Personalizados]')}
                      {destinatariosTipo === 'list' && (selectedListaId ? `[Lista: ${listas.find(l => l.id === selectedListaId)?.nome || 'Selecionada'}]` : '[Lista de Transmissão]')}
                    </div>
                    <div>
                      <span className="font-semibold text-white">Assunto:</span>{' '}
                      <span className="text-white font-medium">{assunto || '(Sem Assunto)'}</span>
                    </div>
                    {anexos.length > 0 && (
                      <div>
                        <span className="font-semibold text-white">Anexos:</span>{' '}
                        <span className="text-primary-teal">{anexos.map(a => a.filename).join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <div
                    className="text-gray-300 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: getPreviewHtml(conteudo) }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Histórico */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i className="ri-history-line text-primary-teal"></i> Histórico de Disparos
              </h2>

              {loadingHistory ? (
                <div className="text-center py-12">
                  <i className="ri-loader-4-line text-3xl text-primary-teal animate-spin mb-4"></i>
                  <p className="text-gray-400 text-sm">Carregando histórico...</p>
                </div>
              ) : campanhas.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <i className="ri-mail-line text-5xl mb-3 block"></i>
                  <p className="text-sm">Nenhuma campanha enviada anteriormente.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-dark-hover text-gray-400 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Assunto</th>
                        <th className="px-4 py-3">Público</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Autor</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {campanhas.map((camp) => (
                        <tr key={camp.id} className="hover:bg-dark-hover/50 transition-smooth">
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                            {new Date(camp.created_at).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 font-medium text-white truncate max-w-[200px]">
                            {camp.assunto}
                          </td>
                          <td className="px-4 py-3 capitalize text-gray-300">
                            {camp.destinatarios_tipo === 'custom' ? 'Personalizado' : camp.destinatarios_tipo === 'list' ? 'Lista Salva' : camp.destinatarios_tipo}
                          </td>
                          <td className="px-4 py-3 text-gray-300">{camp.total_destinatarios}</td>
                          <td className="px-4 py-3 text-gray-400">{camp.users?.name || 'Sistema'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                camp.status === 'enviado'
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                  : camp.status === 'enviando'
                                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse'
                                  : camp.status === 'erro'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                              }`}
                            >
                              {camp.status === 'enviado'
                                ? 'Enviado'
                                : camp.status === 'enviando'
                                ? 'Enviando'
                                : camp.status === 'erro'
                                ? 'Erro'
                                : 'Pendente'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCampanha(camp);
                                setShowDetailsModal(true);
                              }}
                              className="px-3 py-1 bg-dark-bg border border-dark-border hover:bg-dark-hover text-white rounded text-xs transition-smooth cursor-pointer"
                            >
                              Detalhes
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab 2: Gerenciar Listas de Transmissão */}
        {activeTab === 'listas' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulário de Criação (Coluna 1) */}
            <div className="lg:col-span-1 bg-dark-card border border-dark-border rounded-xl p-6 h-fit">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i className="ri-add-box-line text-primary-teal"></i> Nova Lista de Transmissão
              </h3>
              <form onSubmit={handleSaveLista} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Nome da Lista</label>
                  <input
                    type="text"
                    value={novaListaNome}
                    onChange={(e) => setNovaListaNome(e.target.value)}
                    placeholder="Ex: Artistas VIP, Contatos SP"
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    E-mails (Um por linha ou separados por vírgula)
                  </label>
                  <textarea
                    value={novaListaEmails}
                    onChange={(e) => setNovaListaEmails(e.target.value)}
                    placeholder="artista@email.com&#10;produtor@email.com, outro@email.com"
                    rows={8}
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth font-mono"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={savingLista}
                  className="w-full py-2.5 bg-gradient-primary hover:opacity-90 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-smooth cursor-pointer flex justify-center items-center gap-1.5"
                >
                  {savingLista ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line"></i>
                      <span>Criar Lista de Transmissão</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Listas Salvas (Coluna 2 e 3) */}
            <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <i className="ri-list-check-3 text-primary-teal"></i> Listas de Transmissão Salvas
              </h3>
              {loadingListas ? (
                <div className="text-center py-12">
                  <i className="ri-loader-4-line text-3xl text-primary-teal animate-spin mb-4"></i>
                  <p className="text-gray-400 text-sm">Carregando listas...</p>
                </div>
              ) : listas.length === 0 ? (
                <div className="text-center py-16 text-gray-500 border border-dashed border-dark-border rounded-xl">
                  <i className="ri-contacts-book-line text-5xl mb-3 block"></i>
                  <p className="text-sm">Nenhuma lista de transmissão criada ainda.</p>
                  <p className="text-xs text-gray-600 mt-1">Use o formulário ao lado para criar a sua primeira lista.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listas.map((l) => (
                    <div key={l.id} className="bg-dark-bg border border-dark-border rounded-xl p-5 flex justify-between items-start gap-4 hover:border-primary-teal/40 transition-smooth">
                      <div className="min-w-0">
                        <h4 className="text-base font-bold text-white truncate mb-1">{l.nome}</h4>
                        <span className="text-xs text-primary-teal font-semibold block mb-2">{l.emails.length} contatos cadastrados</span>
                        <div className="text-[10px] text-gray-500 space-y-0.5">
                          <span>Criado em: {new Date(l.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedListaId(l.id);
                            setDestinatariosTipo('list');
                            setActiveTab('enviar');
                          }}
                          className="px-3 py-1.5 bg-primary-teal/15 hover:bg-primary-teal/25 text-primary-teal text-xs font-bold rounded-lg transition-smooth cursor-pointer"
                        >
                          Usar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLista(l.id)}
                          className="p-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-lg transition-smooth cursor-pointer"
                          title="Excluir lista"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Confirmar Envio */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-dark-card border border-dark-border rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <i className="ri-error-warning-line text-yellow-500 text-2xl"></i> Confirmar Envio de E-mails
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Você está prestes a disparar o e-mail <strong>"{assunto}"</strong> para aproximadamente{' '}
              <strong className="text-white">{currentRecipientCount} destinatário(s)</strong> no público{' '}
              <strong className="text-white capitalize">{destinatariosTipo}</strong>.
            </p>
            {anexos.length > 0 && (
              <div className="mb-4 text-xs text-gray-300 bg-dark-bg border border-dark-border p-3 rounded-lg">
                <strong className="block mb-1">Anexos incluídos:</strong>
                {anexos.map((a, idx) => <span key={idx} className="block text-gray-400">• {a.filename}</span>)}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-dark-bg border border-dark-border text-gray-400 hover:text-white rounded-lg text-sm transition-smooth cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-smooth cursor-pointer"
              >
                Sim, Enviar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalhes da Campanha */}
      {showDetailsModal && selectedCampanha && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-dark-card border border-dark-border rounded-xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start border-b border-dark-border pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Detalhes do Disparo</h3>
                <p className="text-xs text-gray-400">
                  Enviado em {new Date(selectedCampanha.created_at).toLocaleString('pt-BR')} por{' '}
                  {selectedCampanha.users?.name || 'Sistema'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedCampanha(null);
                }}
                className="p-1.5 hover:bg-dark-hover rounded-lg text-gray-400 hover:text-white transition-smooth cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 font-sans">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-dark-bg p-3 border border-dark-border rounded-lg">
                  <span className="text-gray-500 block mb-1">Público-Alvo</span>
                  <span className="text-white capitalize font-medium">{selectedCampanha.destinatarios_tipo === 'custom' ? 'Personalizado' : selectedCampanha.destinatarios_tipo === 'list' ? 'Lista Salva' : selectedCampanha.destinatarios_tipo}</span>
                </div>
                <div className="bg-dark-bg p-3 border border-dark-border rounded-lg">
                  <span className="text-gray-500 block mb-1">Total Destinatários</span>
                  <span className="text-white font-medium">{selectedCampanha.total_destinatarios}</span>
                </div>
              </div>

              <div className="bg-dark-bg p-3 border border-dark-border rounded-lg text-xs">
                <span className="text-gray-500 block mb-1">Assunto</span>
                <span className="text-white font-medium text-sm">{selectedCampanha.assunto}</span>
              </div>

              {selectedCampanha.status === 'erro' && selectedCampanha.erro_detalhes && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs text-red-400">
                  <strong className="block mb-1">Erro no disparo:</strong>
                  <code className="block whitespace-pre-wrap">{selectedCampanha.erro_detalhes}</code>
                </div>
              )}

              <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-sm text-gray-300 min-h-[150px]">
                <div className="text-gray-500 text-xs border-b border-dark-border pb-2 mb-3">CONTEÚDO DO E-MAIL:</div>
                <div
                  className="leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedCampanha.conteudo }}
                ></div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-dark-border flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedCampanha(null);
                }}
                className="px-4 py-2 bg-dark-bg border border-dark-border hover:bg-dark-hover text-gray-400 hover:text-white rounded-lg text-sm transition-smooth cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
