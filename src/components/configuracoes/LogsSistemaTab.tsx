import { useState } from 'react';
import type { LogSistema } from '../../services/passwordReset';

interface LogsSistemaTabProps {
  logs: LogSistema[];
  loading: boolean;
  onRefresh: () => void;
}

export default function LogsSistemaTab({
  logs,
  loading,
  onRefresh,
}: LogsSistemaTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('TODAS');

  const filteredLogs = logs.filter((log) => {
    const matchesAcao = filtroAcao === 'TODAS' || log.acao === filtroAcao;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (log.usuario_nome && log.usuario_nome.toLowerCase().includes(term)) ||
      (log.usuario_email && log.usuario_email.toLowerCase().includes(term)) ||
      log.detalhes.toLowerCase().includes(term) ||
      log.acao.toLowerCase().includes(term);

    return matchesAcao && matchesSearch;
  });

  const getAcaoBadge = (acao: string) => {
    switch (acao) {
      case 'SOLICITACAO_SENHA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <i className="ri-key-line"></i>
            Solicitação de Senha
          </span>
        );
      case 'APROVACAO_SENHA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
            <i className="ri-shield-check-line"></i>
            Aprovação de Senha
          </span>
        );
      case 'REJEICAO_SENHA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
            <i className="ri-close-circle-line"></i>
            Rejeição de Senha
          </span>
        );
      case 'ALTERACAO_DIRETA_SENHA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <i className="ri-admin-line"></i>
            Alteração Direta (Admin)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <i className="ri-information-line"></i>
            {acao}
          </span>
        );
    }
  };

  return (
    <>
      {/* Filtros e Controles */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Buscar nos Registros de Auditoria
            </label>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por usuário, e-mail ou detalhe da ação..."
                className="w-full pl-9 pr-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Filtrar por Ação
            </label>
            <select
              value={filtroAcao}
              onChange={(e) => setFiltroAcao(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
            >
              <option value="TODAS">Todas as ações</option>
              <option value="SOLICITACAO_SENHA">Solicitações de Senha</option>
              <option value="APROVACAO_SENHA">Aprovações de Senha</option>
              <option value="REJEICAO_SENHA">Rejeições de Senha</option>
              <option value="ALTERACAO_DIRETA_SENHA">Alterações Diretas por Admin</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-dark-border text-xs text-gray-400">
          <span>
            Total de eventos registrados: <strong className="text-white">{filteredLogs.length}</strong>
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1 text-primary-teal hover:text-teal-300 transition-colors cursor-pointer"
          >
            <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i>
            <span>Atualizar registros</span>
          </button>
        </div>
      </div>

      {/* Tabela de Logs */}
      {loading ? (
        <div className="text-center py-12">
          <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin mb-4"></i>
          <p className="text-gray-400">Carregando registros de auditoria...</p>
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-hover">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Data / Hora
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ação
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Detalhes do Evento
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-dark-hover/60 transition-smooth">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {new Date(log.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {log.usuario_nome || 'Sistema'}
                      </div>
                      {log.usuario_email && (
                        <div className="text-xs text-gray-400">{log.usuario_email}</div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAcaoBadge(log.acao)}
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {log.detalhes}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <i className="ri-shield-line text-5xl text-gray-600 mb-3"></i>
              <p className="text-gray-400 text-sm">Nenhum registro de log encontrado.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
