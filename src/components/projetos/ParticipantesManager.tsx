import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import TermoParticipanteModal from './TermoParticipanteModal';
import FichaTecnicaConsolidadaModal from './FichaTecnicaConsolidadaModal';
import {
  ProjetoParticipanteData,
  TIPOS_PARTICIPACAO_LABELS,
} from './TermoParticipanteContent';

interface FaixaItem {
  id: string;
  nome: string;
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

interface ParticipantesManagerProps {
  projetoId: string;
  projetoNome: string;
  artistaNome: string;
  tokenCadastroProjeto?: string | null;
  faixas: FaixaItem[];
  onTokenUpdated?: (newToken: string) => void;
}

export default function ParticipantesManager({
  projetoId,
  projetoNome,
  artistaNome,
  tokenCadastroProjeto,
  faixas,
  onTokenUpdated,
}: ParticipantesManagerProps) {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [participantes, setParticipantes] = useState<ProjetoParticipanteData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [copiedProjectLink, setCopiedProjectLink] = useState(false);
  const [copiedPartToken, setCopiedPartToken] = useState<string | null>(null);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [selectedParticipanteId, setSelectedParticipanteId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | 'sign'>('create');
  const [showConsolidadaModal, setShowConsolidadaModal] = useState(false);

  // Link do projeto
  const [currentProjectToken, setCurrentProjectToken] = useState<string>(
    tokenCadastroProjeto || ''
  );

  useEffect(() => {
    if (projetoId) {
      loadParticipantes();
      ensureProjectToken();
    }
  }, [projetoId, tokenCadastroProjeto]);

  const ensureProjectToken = async () => {
    if (currentProjectToken) return;

    try {
      // Verificar se o projeto já tem token no banco
      const { data: projData } = await supabase
        .from('projetos')
        .select('token_cadastro_participantes')
        .eq('id', projetoId)
        .single();

      if (projData?.token_cadastro_participantes) {
        setCurrentProjectToken(projData.token_cadastro_participantes);
        if (onTokenUpdated) onTokenUpdated(projData.token_cadastro_participantes);
      } else {
        // Gerar um token novo para o projeto
        const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(12)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        const newToken = `ceu_proj_${randomHex}`;

        const { error: updateErr } = await supabase
          .from('projetos')
          .update({ token_cadastro_participantes: newToken })
          .eq('id', projetoId);

        if (!updateErr) {
          setCurrentProjectToken(newToken);
          if (onTokenUpdated) onTokenUpdated(newToken);
        }
      }
    } catch (err) {
      console.warn('Não foi possível sincronizar token de cadastro do projeto:', err);
    }
  };

  const loadParticipantes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projeto_participantes')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: false });

      if (error) {
        // Se a tabela ainda não existe, não quebra a tela
        console.warn('Aviso ao carregar participantes:', error);
        setParticipantes([]);
        return;
      }

      if (data) {
        // Mapear os nomes das faixas
        const enriched = data.map((p) => {
          const fNomes = (p.faixas_ids || [])
            .map((fId: string) => faixas.find((f) => f.id === fId)?.nome)
            .filter(Boolean);
          return {
            ...p,
            projeto_nome: projetoNome,
            artista_nome: artistaNome,
            faixas_nomes: fNomes,
          };
        });
        setParticipantes(enriched);
      }
    } catch (err) {
      console.error('Erro ao carregar participantes:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProjectPublicUrl = () => {
    if (!currentProjectToken) return '';
    const origin = window.location.origin;
    return `${origin}/public/projeto/${currentProjectToken}/participar`;
  };

  const getParticipantPublicUrl = (token: string) => {
    if (!token) return '';
    const origin = window.location.origin;
    return `${origin}/public/participante/${token}`;
  };

  const handleCopyProjectLink = () => {
    const url = getProjectPublicUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedProjectLink(true);
    toast.success('Link geral de auto-cadastro do projeto copiado!');
    setTimeout(() => setCopiedProjectLink(false), 3000);
  };

  const handleShareProjectWhatsApp = () => {
    const url = getProjectPublicUrl();
    if (!url) return;
    const text = encodeURIComponent(
      `Olá, equipe e músicos do projeto "${projetoNome}" (${artistaNome})!\n\nSegue o link oficial para preenchimento da Ficha Técnica e assinatura do Termo de Autorização e Cessão de Direitos na Céu Music:\n\n${url}\n\nPor favor, preencham seus dados (CPF, instrumento e faixas) e assinem digitalmente pelo celular.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyParticipantLink = (p: ProjetoParticipanteData) => {
    if (!p.token) return;
    const url = getParticipantPublicUrl(p.token);
    navigator.clipboard.writeText(url);
    setCopiedPartToken(p.token);
    toast.success(`Link de assinatura de ${p.autorizante_nome} copiado!`);
    setTimeout(() => setCopiedPartToken(null), 3000);
  };

  const handleShareParticipantWhatsApp = (p: ProjetoParticipanteData) => {
    if (!p.token) return;
    const url = getParticipantPublicUrl(p.token);
    const nome = p.autorizante_nome || 'Músico(a)';
    const text = encodeURIComponent(
      `Olá, ${nome}! Segue seu link individual para conferir seus dados na Ficha Técnica e assinar o Termo de Cessão de Direitos para o projeto "${projetoNome}" da Céu Music:\n\n${url}\n\nBasta abrir no celular e assinar com o dedo na tela.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleDeleteParticipant = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja remover ${nome} deste projeto?`)) return;

    try {
      const { error } = await supabase
        .from('projeto_participantes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Participante removido com sucesso.');
      loadParticipantes();
    } catch (err: any) {
      console.error('Erro ao deletar participante:', err);
      toast.error('Erro ao remover participante.');
    }
  };

  // Filtragem
  const filteredParticipantes = participantes.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.autorizante_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.autorizante_nome_artistico &&
        p.autorizante_nome_artistico.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.funcao_instrumento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.autorizante_cpf && p.autorizante_cpf.includes(searchTerm));

    const matchesTipo = filterTipo === 'todos' || p.tipo_participacao === filterTipo;
    const matchesStatus = filterStatus === 'todos' || p.status === filterStatus;

    return matchesSearch && matchesTipo && matchesStatus;
  });

  const totalAssinados = participantes.filter((p) => p.status === 'assinado').length;
  const totalPendentes = participantes.filter((p) => p.status !== 'assinado').length;
  const percentualAssinados =
    participantes.length > 0 ? Math.round((totalAssinados / participantes.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Box de Acompanhamento e Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Total de Participantes</p>
              <p className="text-2xl font-bold text-white">{participantes.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <i className="ri-team-line text-lg"></i>
            </div>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Termos Assinados</p>
              <p className="text-2xl font-bold text-green-400">{totalAssinados}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
              <i className="ri-shield-check-line text-lg"></i>
            </div>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Assinaturas Pendentes</p>
              <p className="text-2xl font-bold text-amber-400">{totalPendentes}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <i className="ri-time-line text-lg"></i>
            </div>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Regularização Jurídica</p>
              <p className="text-2xl font-bold text-white">{percentualAssinados}%</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <i className="ri-award-line text-lg"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Card do Link Geral de Auto-Cadastro do Projeto */}
      <div className="bg-gradient-to-r from-teal-950/40 via-dark-card to-dark-card border border-teal-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <i className="ri-links-line"></i>
              Link Compartilhável do Projeto
            </div>
            <h3 className="text-base font-bold text-white">
              Link de Auto-Cadastro de Músicos e Ficha Técnica
            </h3>
            <p className="text-xs text-gray-300">
              Envie este link para o produtor musical ou no grupo de WhatsApp dos músicos. Cada profissional abre no celular, escolhe seu instrumento e faixas, preenche os dados cadastrais e assina digitalmente o termo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyProjectLink}
              className="px-4 py-2.5 bg-dark-bg hover:bg-dark-border border border-teal-500/40 text-teal-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <i className={copiedProjectLink ? 'ri-check-line text-green-400' : 'ri-file-copy-line'}></i>
              <span>{copiedProjectLink ? 'Link Copiado!' : 'Copiar Link Compartilhável'}</span>
            </button>

            <button
              onClick={handleShareProjectWhatsApp}
              className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-green-500/20"
            >
              <i className="ri-whatsapp-line text-sm"></i>
              <span>Compartilhar no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Ações & Filtros */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Busca e Filtros */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              placeholder="Buscar por nome, instrumento ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-teal-400"
            />
          </div>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-teal-400"
          >
            <option value="todos">Todos os Tipos</option>
            {Object.entries(TIPOS_PARTICIPACAO_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-xs focus:outline-none focus:border-teal-400"
          >
            <option value="todos">Todos os Status</option>
            <option value="assinado">Assinados</option>
            <option value="pendente">Pendentes</option>
          </select>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConsolidadaModal(true)}
            className="px-3.5 py-2 bg-dark-bg hover:bg-dark-hover border border-dark-border rounded-lg text-xs font-semibold text-gray-200 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ri-file-list-3-line text-teal-400"></i>
            <span>Ficha Técnica Consolidada</span>
          </button>

          <button
            onClick={() => {
              setSelectedParticipanteId(null);
              setModalMode('create');
              setShowModal(true);
            }}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
          >
            <i className="ri-user-add-line"></i>
            <span>+ Adicionar Participante</span>
          </button>
        </div>
      </div>

      {/* Lista de Participantes */}
      {loading ? (
        <div className="bg-dark-card border border-dark-border rounded-xl p-12 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 text-xs font-medium">Carregando participantes e termos...</p>
        </div>
      ) : filteredParticipantes.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center mx-auto text-gray-400 text-xl">
            <i className="ri-user-unfollow-line"></i>
          </div>
          <p className="text-sm font-semibold text-white">Nenhum participante encontrado</p>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Adicione manualmente ou compartilhe o link do projeto com os músicos e produtores para que eles se cadastrem e assinem os termos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredParticipantes.map((p) => {
            const isAssinado = p.status === 'assinado';
            const isCopiedThis = copiedPartToken === p.token;

            return (
              <div
                key={p.id}
                className="bg-dark-card border border-dark-border hover:border-dark-hover rounded-xl p-5 flex flex-col justify-between gap-4 transition-all"
              >
                {/* Top Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">
                          {p.autorizante_nome_artistico || p.autorizante_nome}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                            isAssinado
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          <i className={isAssinado ? 'ri-checkbox-circle-fill' : 'ri-time-line'}></i>
                          {isAssinado ? 'Termo Assinado' : 'Pendente de Assinatura'}
                        </span>
                      </div>
                      {p.autorizante_nome_artistico && (
                        <p className="text-xs text-gray-400">Nome Civil: {p.autorizante_nome}</p>
                      )}
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-semibold">
                      {TIPOS_PARTICIPACAO_LABELS[p.tipo_participacao] || p.tipo_participacao}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-dark-border/40">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Instrumento / Função:</span>
                      <strong className="text-white">{p.funcao_instrumento}</strong>
                    </div>
                    {p.autorizante_cpf && (
                      <div>
                        <span className="text-gray-400 block text-[11px]">CPF:</span>
                        <strong className="text-white font-mono">{p.autorizante_cpf}</strong>
                      </div>
                    )}
                    {p.autorizante_telefone && (
                      <div>
                        <span className="text-gray-400 block text-[11px]">WhatsApp:</span>
                        <span className="text-gray-300 font-mono">{p.autorizante_telefone}</span>
                      </div>
                    )}
                    {p.autorizante_email && (
                      <div className="truncate">
                        <span className="text-gray-400 block text-[11px]">E-mail:</span>
                        <span className="text-gray-300 truncate" title={p.autorizante_email}>
                          {p.autorizante_email}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Faixas */}
                  <div className="text-xs bg-dark-bg/60 p-2.5 rounded-lg border border-dark-border/60">
                    <span className="text-gray-400 block text-[11px] mb-1">Faixas Participadas:</span>
                    {p.faixas_nomes && p.faixas_nomes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.faixas_nomes.map((nome) => (
                          <span
                            key={nome}
                            className="px-2 py-0.5 bg-dark-card border border-dark-border rounded text-[11px] text-gray-300"
                          >
                            {nome}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-teal-400 font-medium">Todas as faixas do projeto</span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-dark-border/60 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {p.token && !isAssinado && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCopyParticipantLink(p)}
                          className="p-2 bg-dark-bg hover:bg-dark-hover border border-dark-border rounded-lg text-gray-300 hover:text-white transition-colors"
                          title="Copiar Link Individual de Assinatura"
                        >
                          <i className={isCopiedThis ? 'ri-check-line text-green-400' : 'ri-file-copy-line'}></i>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareParticipantWhatsApp(p)}
                          className="p-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 transition-colors"
                          title="Enviar Link no WhatsApp"
                        >
                          <i className="ri-whatsapp-line"></i>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedParticipanteId(p.id!);
                        setModalMode('view');
                        setShowModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-dark-bg hover:bg-dark-hover border border-dark-border rounded-lg text-xs text-teal-400 hover:text-teal-300 font-semibold transition-colors flex items-center gap-1"
                      title="Visualizar Termo e Certificado Jurídico"
                    >
                      <i className="ri-file-text-line"></i>
                      <span>{isAssinado ? 'Ver Termo' : 'Visualizar'}</span>
                    </button>

                    {!isAssinado && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedParticipanteId(p.id!);
                          setModalMode('sign');
                          setShowModal(true);
                        }}
                        className="px-2.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded-lg text-xs text-teal-300 font-semibold transition-colors flex items-center gap-1"
                        title="Assinar Presencialmente"
                      >
                        <i className="ri-edit-2-line"></i>
                        <span>Assinar Agora</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedParticipanteId(p.id!);
                        setModalMode('edit');
                        setShowModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Editar Informações"
                    >
                      <i className="ri-pencil-line"></i>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteParticipant(p.id!, p.autorizante_nome)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Remover Participante"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Participante & Termo */}
      {showModal && (
        <TermoParticipanteModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedParticipanteId(null);
          }}
          onSuccess={() => {
            loadParticipantes();
          }}
          projetoId={projetoId}
          projetoNome={projetoNome}
          artistaNome={artistaNome}
          faixas={faixas}
          participanteId={selectedParticipanteId}
          mode={modalMode}
        />
      )}

      {/* Modal de Ficha Técnica Consolidada */}
      {showConsolidadaModal && (
        <FichaTecnicaConsolidadaModal
          isOpen={showConsolidadaModal}
          onClose={() => setShowConsolidadaModal(false)}
          projetoNome={projetoNome}
          artistaNome={artistaNome}
          faixas={faixas}
          participantes={participantes}
        />
      )}
    </div>
  );
}
