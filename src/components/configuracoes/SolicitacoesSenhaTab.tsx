import { useState } from 'react';
import {
  type SolicitacaoSenha,
  aprovarSolicitacaoSenha,
  rejeitarSolicitacaoSenha,
} from '../../services/passwordReset';

interface SolicitacoesSenhaTabProps {
  solicitacoes: SolicitacaoSenha[];
  loading: boolean;
  adminId: string;
  onRefresh: () => void;
}

export default function SolicitacoesSenhaTab({
  solicitacoes,
  loading,
  adminId,
  onRefresh,
}: SolicitacoesSenhaTabProps) {
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'aprovada' | 'rejeitada'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal de Rejeição
  const [rejectingItem, setRejectingItem] = useState<SolicitacaoSenha | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');

  const filteredSolicitacoes = solicitacoes.filter((item) => {
    const matchesStatus = filterStatus === 'todos' || item.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      item.email.toLowerCase().includes(term) ||
      (item.user?.name && item.user.name.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  const pendentesCount = solicitacoes.filter((s) => s.status === 'pendente').length;

  const handleAprovar = async (solicitacao: SolicitacaoSenha) => {
    const nome = solicitacao.user?.name || solicitacao.email;
    if (!confirm(`Deseja realmente APROVAR a redefinição de senha para "${nome}"? A nova senha entrará em vigor imediatamente.`)) {
      return;
    }

    setProcessingId(solicitacao.id);
    try {
      await aprovarSolicitacaoSenha(solicitacao.id, adminId);
      alert(`Senha aprovada com sucesso para ${solicitacao.email}!`);
      onRefresh();
    } catch (err: any) {
      console.error('Erro ao aprovar senha:', err);
      alert(`Erro ao aprovar solicitação: ${err.message || 'Verifique o console.'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmRejeicao = async () => {
    if (!rejectingItem) return;

    setProcessingId(rejectingItem.id);
    try {
      await rejeitarSolicitacaoSenha(rejectingItem.id, adminId, motivoRejeicao.trim());
      alert(`Solicitação de ${rejectingItem.email} rejeitada.`);
      setRejectingItem(null);
      setMotivoRejeicao('');
      onRefresh();
    } catch (err: any) {
      console.error('Erro ao rejeitar senha:', err);
      alert(`Erro ao rejeitar solicitação: ${err.message || 'Verifique o console.'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: SolicitacaoSenha['status']) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <i className="ri-time-line"></i>
            Pendente
          </span>
        );
      case 'aprovada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
            <i className="ri-checkbox-circle-line"></i>
            Aprovada
          </span>
        );
      case 'rejeitada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
            <i className="ri-close-circle-line"></i>
            Rejeitada
          </span>
        );
      case 'cancelada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
            <i className="ri-forbid-line"></i>
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Barra de Filtros e Resumo */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Buscar solicitação
            </label>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por e-mail ou nome do usuário..."
                className="w-full pl-9 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Filtrar por Status
            </label>
            <select
              value={filterStatus}
              onChange={(e: any) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
            >
              <option value="todos">Todos os status</option>
              <option value="pendente">Pendentes ({pendentesCount})</option>
              <option value="aprovada">Aprovadas</option>
              <option value="rejeitada">Rejeitadas</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-dark-border text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span>
              Total de solicitações: <strong className="text-white">{solicitacoes.length}</strong>
            </span>
            {pendentesCount > 0 && (
              <span className="text-amber-400 font-medium">
                ({pendentesCount} aguardando aprovação)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1 text-primary-teal hover:text-teal-300 transition-colors cursor-pointer"
          >
            <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i>
            <span>Atualizar lista</span>
          </button>
        </div>
      </div>

      {/* Lista de Solicitações */}
      {loading ? (
        <div className="text-center py-12">
          <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin mb-4"></i>
          <p className="text-gray-400">Carregando solicitações de senha...</p>
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-hover">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Data da Solicitação
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Avaliado por
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filteredSolicitacoes.map((item) => {
                  const isProcessing = processingId === item.id;
                  const isPendente = item.status === 'pendente';

                  return (
                    <tr key={item.id} className="hover:bg-dark-hover/60 transition-smooth">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-teal/20 text-primary-teal flex items-center justify-center font-bold text-sm">
                            {item.user?.name?.charAt(0).toUpperCase() || item.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {item.user?.name || 'Usuário'}
                            </div>
                            <div className="text-xs text-gray-400">{item.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                        {item.motivo_rejeicao && (
                          <div className="text-[11px] text-red-400 mt-1 max-w-xs truncate" title={item.motivo_rejeicao}>
                            Motivo: {item.motivo_rejeicao}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.reviewer ? (
                          <div>
                            <div className="text-sm text-gray-300">{item.reviewer.name}</div>
                            {item.reviewed_at && (
                              <div className="text-[11px] text-gray-500">
                                {new Date(item.reviewed_at).toLocaleDateString('pt-BR')} às{' '}
                                {new Date(item.reviewed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isPendente ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleAprovar(item)}
                              className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-lg text-xs font-medium transition-smooth cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                              title="Aprovar e ativar nova senha"
                            >
                              <i className={`ri-check-line text-sm ${isProcessing ? 'animate-spin' : ''}`}></i>
                              <span>Aprovar</span>
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => setRejectingItem(item)}
                              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-medium transition-smooth cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                              title="Rejeitar solicitação"
                            >
                              <i className="ri-close-line text-sm"></i>
                              <span>Rejeitar</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">Concluído</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredSolicitacoes.length === 0 && (
            <div className="text-center py-12">
              <i className="ri-key-2-line text-5xl text-gray-600 mb-3"></i>
              <p className="text-gray-400 text-sm">Nenhuma solicitação de senha encontrada.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Confirmar Rejeição com Motivo */}
      {rejectingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-dark-border">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <i className="ri-close-circle-line text-red-400"></i>
                Rejeitar Solicitação
              </h3>
              <button
                onClick={() => {
                  setRejectingItem(null);
                  setMotivoRejeicao('');
                }}
                className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <p className="text-sm text-gray-300 mb-3">
              Você está prestes a rejeitar a solicitação de redefinição de senha para{' '}
              <strong className="text-white">{rejectingItem.email}</strong>.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Motivo da rejeição (opcional)
              </label>
              <textarea
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                placeholder="Ex: Não reconhecido pela administração, solicite via canal oficial..."
                rows={3}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingItem(null);
                  setMotivoRejeicao('');
                }}
                className="px-4 py-2 bg-dark-bg hover:bg-dark-hover text-gray-300 rounded-lg text-sm transition-smooth cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={processingId === rejectingItem.id}
                onClick={handleConfirmRejeicao}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition-smooth cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {processingId === rejectingItem.id ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
