import { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';

type FilterType = 'todos' | 'contrato' | 'licenca' | 'certificado' | 'outro';

interface Documento {
  id: number;
  nome: string;
  tipo: FilterType;
  descricao: string;
  artista?: string;
  projeto?: string;
  dataUpload: string;
  tamanho: string;
  status: 'ativo' | 'vencido' | 'pendente';
}

export default function Documentos() {
  const [filterType, setFilterType] = useState<FilterType>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const documentos: Documento[] = [
    {
      id: 1,
      nome: 'Contrato de Exclusividade - Artista A',
      tipo: 'contrato',
      descricao: 'Contrato de exclusividade por 3 anos',
      artista: 'Artista A',
      dataUpload: '2024-01-15',
      tamanho: '2.4 MB',
      status: 'ativo'
    },
    {
      id: 2,
      nome: 'Licença de Uso - Single Verão',
      tipo: 'licenca',
      descricao: 'Licença para uso comercial',
      projeto: 'Single Verão 2024',
      dataUpload: '2024-01-10',
      tamanho: '1.8 MB',
      status: 'ativo'
    },
    {
      id: 3,
      nome: 'Certificado ISRC - EP Acústico',
      tipo: 'certificado',
      descricao: 'Certificado ISRC para distribuição',
      projeto: 'EP Acústico',
      dataUpload: '2024-01-08',
      tamanho: '456 KB',
      status: 'ativo'
    },
    {
      id: 4,
      nome: 'Contrato de Colaboração - Artista B',
      tipo: 'contrato',
      descricao: 'Contrato temporário de colaboração',
      artista: 'Artista B',
      dataUpload: '2023-12-20',
      tamanho: '3.1 MB',
      status: 'vencido'
    },
    {
      id: 5,
      nome: 'Autorização de Lançamento',
      tipo: 'outro',
      descricao: 'Autorização para lançamento em plataformas',
      projeto: 'Single Colaboração',
      dataUpload: '2024-01-12',
      tamanho: '892 KB',
      status: 'pendente'
    }
  ];

  const filteredDocumentos = documentos.filter(doc => {
    const matchesType = filterType === 'todos' || doc.tipo === filterType;
    const matchesSearch = doc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.artista && doc.artista.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (doc.projeto && doc.projeto.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-500/20 text-green-400';
      case 'vencido':
        return 'bg-red-500/20 text-red-400';
      case 'pendente':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeIcon = (tipo: FilterType) => {
    switch (tipo) {
      case 'contrato':
        return 'ri-file-paper-2-line';
      case 'licenca':
        return 'ri-file-shield-line';
      case 'certificado':
        return 'ri-award-line';
      case 'outro':
        return 'ri-file-line';
      default:
        return 'ri-file-line';
    }
  };

  const stats = [
    { label: 'Total de Documentos', value: documentos.length, icon: 'ri-file-line', color: 'from-primary-teal to-primary-brown' },
    { label: 'Contratos Ativos', value: documentos.filter(d => d.tipo === 'contrato' && d.status === 'ativo').length, icon: 'ri-file-paper-2-line', color: 'from-primary-brown to-primary-dark' },
    { label: 'Vencidos', value: documentos.filter(d => d.status === 'vencido').length, icon: 'ri-alert-line', color: 'from-red-500 to-red-700' },
    { label: 'Pendentes', value: documentos.filter(d => d.status === 'pendente').length, icon: 'ri-time-line', color: 'from-yellow-500 to-yellow-700' },
  ];

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Documentos</h1>
            <p className="text-gray-400">Gerencie contratos, licenças e certificados</p>
          </div>
          <button className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap">
            <i className="ri-upload-line text-xl"></i>
            Upload Documento
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-primary-teal transition-smooth">
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
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['todos', 'contrato', 'licenca', 'certificado', 'outro'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth cursor-pointer ${
                    filterType === type
                      ? 'bg-gradient-primary text-white'
                      : 'bg-dark-bg text-gray-400 hover:bg-dark-hover hover:text-white border border-dark-border'
                  }`}
                >
                  {type === 'todos' ? 'Todos' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Documento</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Relacionado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tamanho</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filteredDocumentos.length > 0 ? (
                  filteredDocumentos.map((doc) => (
                    <tr key={doc.id} className="hover:bg-dark-hover transition-smooth">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-white">{doc.nome}</p>
                          <p className="text-xs text-gray-500 mt-1">{doc.descricao}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <i className={`${getTypeIcon(doc.tipo)} text-primary-teal`}></i>
                          <span className="text-sm text-gray-300 capitalize">{doc.tipo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {doc.artista && (
                            <div className="flex items-center gap-1">
                              <i className="ri-user-star-line text-xs"></i>
                              <span>{doc.artista}</span>
                            </div>
                          )}
                          {doc.projeto && (
                            <div className="flex items-center gap-1">
                              <i className="ri-music-2-line text-xs"></i>
                              <span>{doc.projeto}</span>
                            </div>
                          )}
                          {!doc.artista && !doc.projeto && (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(doc.dataUpload).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {doc.tamanho}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                          {doc.status === 'ativo' ? 'Ativo' : doc.status === 'vencido' ? 'Vencido' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <button className="text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer" title="Visualizar">
                            <i className="ri-eye-line text-lg"></i>
                          </button>
                          <button className="text-gray-400 hover:text-white transition-smooth cursor-pointer" title="Download">
                            <i className="ri-download-line text-lg"></i>
                          </button>
                          <button className="text-gray-400 hover:text-red-400 transition-smooth cursor-pointer" title="Excluir">
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <i className="ri-file-line text-4xl mb-2"></i>
                        <p className="text-sm">Nenhum documento encontrado</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}


