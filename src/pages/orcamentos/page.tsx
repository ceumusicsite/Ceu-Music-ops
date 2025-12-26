import { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';

type FilterStatus = 'todos' | 'pendente' | 'aprovado' | 'recusado';

export default function Orcamentos() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const orcamentos = [
    { 
      id: 1, 
      type: 'Produção', 
      description: 'Produção Single - Artista A', 
      value: 15000, 
      status: 'pendente', 
      requestedBy: 'A&R João',
      date: '2024-01-15',
      project: 'Novo Single - Verão 2024'
    },
    { 
      id: 2, 
      type: 'Clipe', 
      description: 'Clipe Oficial - Artista B', 
      value: 35000, 
      status: 'pendente', 
      requestedBy: 'A&R Maria',
      date: '2024-01-14',
      project: 'EP Acústico'
    },
    { 
      id: 3, 
      type: 'Masterização', 
      description: 'Master Final - Artista C', 
      value: 8000, 
      status: 'aprovado', 
      requestedBy: 'A&R Pedro',
      date: '2024-01-10',
      project: 'Single Colaboração'
    },
    { 
      id: 4, 
      type: 'Capa', 
      description: 'Arte de Capa - Artista D', 
      value: 3500, 
      status: 'aprovado', 
      requestedBy: 'A&R João',
      date: '2024-01-08',
      project: 'Álbum Completo'
    },
    { 
      id: 5, 
      type: 'Mídia', 
      description: 'Campanha Digital - Artista E', 
      value: 12000, 
      status: 'recusado', 
      requestedBy: 'A&R Maria',
      date: '2024-01-05',
      project: 'Remix Oficial'
    },
  ];

  const filteredOrcamentos = orcamentos.filter(orc => {
    const matchesSearch = orc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         orc.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || orc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pendente': 'bg-yellow-500/20 text-yellow-400',
      'aprovado': 'bg-green-500/20 text-green-400',
      'recusado': 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pendente': 'Pendente',
      'aprovado': 'Aprovado',
      'recusado': 'Recusado',
    };
    return labels[status] || status;
  };

  const stats = [
    { label: 'Total Pendente', value: `R$ ${orcamentos.filter(o => o.status === 'pendente').reduce((sum, o) => sum + o.value, 0).toLocaleString('pt-BR')}`, icon: 'ri-time-line', color: 'from-yellow-500 to-yellow-700' },
    { label: 'Total Aprovado', value: `R$ ${orcamentos.filter(o => o.status === 'aprovado').reduce((sum, o) => sum + o.value, 0).toLocaleString('pt-BR')}`, icon: 'ri-check-line', color: 'from-green-500 to-green-700' },
    { label: 'Aguardando Aprovação', value: orcamentos.filter(o => o.status === 'pendente').length, icon: 'ri-file-list-3-line', color: 'from-primary-teal to-primary-brown' },
  ];

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Orçamentos</h1>
            <p className="text-gray-400">Gerencie orçamentos e aprovações</p>
          </div>
          <button className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap">
            <i className="ri-add-line text-xl"></i>
            Novo Orçamento
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-dark-card border border-dark-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <i className={`${stat.icon} text-2xl text-white`}></i>
                </div>
                <span className="text-2xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="text"
                placeholder="Buscar orçamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2">
              {(['todos', 'pendente', 'aprovado', 'recusado'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-gradient-primary text-white'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orçamentos List */}
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Descrição</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Projeto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Solicitante</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Valor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Data</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrcamentos.map((orc) => (
                  <tr key={orc.id} className="border-b border-dark-border hover:bg-dark-hover transition-smooth">
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-primary-teal/20 text-primary-teal text-xs rounded-full font-medium whitespace-nowrap">
                        {orc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-medium">{orc.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{orc.project}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{orc.requestedBy}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white whitespace-nowrap">
                      R$ {orc.value.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(orc.status)}`}>
                        {getStatusLabel(orc.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">{orc.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {orc.status === 'pendente' && (
                          <>
                            <button className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-smooth cursor-pointer" title="Aprovar">
                              <i className="ri-check-line text-lg"></i>
                            </button>
                            <button className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-smooth cursor-pointer" title="Recusar">
                              <i className="ri-close-line text-lg"></i>
                            </button>
                          </>
                        )}
                        <button className="p-2 hover:bg-dark-bg rounded-lg transition-smooth cursor-pointer">
                          <i className="ri-eye-line text-gray-400 text-lg"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOrcamentos.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-file-list-3-line text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhum orçamento encontrado</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}