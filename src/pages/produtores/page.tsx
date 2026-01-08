import { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { produtoresMock, type Produtor } from '../../data/produtores-mock';

export default function ProdutoresPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [produtores] = useState<Produtor[]>(produtoresMock);
  const [showModal, setShowModal] = useState(false);
  const [selectedProdutor, setSelectedProdutor] = useState<Produtor | null>(null);

  const filteredProdutores = produtores.filter(produtor => {
    const matchesSearch = 
      produtor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produtor.especialidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produtor.artistas_trabalhados.some(artista => 
        artista.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus = filterStatus === 'todos' || produtor.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'disponivel': return 'bg-green-500/20 text-green-400';
      case 'ativo': return 'bg-blue-500/20 text-blue-400';
      case 'ocupado': return 'bg-yellow-500/20 text-yellow-400';
      case 'inativo': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'disponivel': return 'Disponível';
      case 'ativo': return 'Ativo';
      case 'ocupado': return 'Ocupado';
      case 'inativo': return 'Inativo';
      default: return status;
    }
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Produtores</h1>
            <p className="text-gray-400">Gerencie os produtores musicais da gravadora</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-add-line text-xl"></i>
            Novo Produtor
          </button>
        </div>

        {/* Filters */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="text"
                placeholder="Buscar por nome, especialidade ou artista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['todos', 'disponivel', 'ativo', 'ocupado', 'inativo'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-gradient-primary text-white'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  {status === 'todos' ? 'Todos' : getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Produtores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProdutores.map((produtor) => (
            <div 
              key={produtor.id} 
              className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-primary-teal transition-smooth cursor-pointer"
              onClick={() => setSelectedProdutor(produtor)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{getInitials(produtor.nome)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{produtor.nome}</h3>
                    <p className="text-sm text-gray-400">{produtor.especialidade}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(produtor.status)}`}>
                  {getStatusLabel(produtor.status)}
                </span>
                <span className="text-xs text-gray-500">
                  {produtor.anos_experiencia} anos de experiência
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <i className="ri-mail-line text-primary-teal"></i>
                  <span className="truncate">{produtor.contato_email}</span>
                </div>
                {produtor.contato_telefone && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <i className="ri-phone-line text-primary-teal"></i>
                    <span>{produtor.contato_telefone}</span>
                  </div>
                )}
                {produtor.instagram && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <i className="ri-instagram-line text-primary-teal"></i>
                    <span>{produtor.instagram}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dark-border pt-4">
                <p className="text-xs text-gray-500 mb-2">Trabalhou com:</p>
                <div className="flex flex-wrap gap-1">
                  {produtor.artistas_trabalhados.slice(0, 3).map((artista, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 bg-dark-bg text-xs text-gray-400 rounded"
                    >
                      {artista}
                    </span>
                  ))}
                  {produtor.artistas_trabalhados.length > 3 && (
                    <span className="px-2 py-1 bg-dark-bg text-xs text-gray-400 rounded">
                      +{produtor.artistas_trabalhados.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    <i className="ri-music-2-line mr-1"></i>
                    {produtor.projetos.length} projetos
                  </span>
                  <button className="text-primary-teal hover:text-primary-brown transition-smooth">
                    Ver mais <i className="ri-arrow-right-line"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProdutores.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-headphone-line text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhum produtor encontrado</p>
          </div>
        )}

        {/* Modal Detalhes do Produtor */}
        {selectedProdutor && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{getInitials(selectedProdutor.nome)}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedProdutor.nome}</h2>
                    <p className="text-gray-400">{selectedProdutor.especialidade}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedProdutor(null)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Informações de Contato</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white">
                      <i className="ri-mail-line text-primary-teal"></i>
                      <span>{selectedProdutor.contato_email}</span>
                    </div>
                    {selectedProdutor.contato_telefone && (
                      <div className="flex items-center gap-2 text-sm text-white">
                        <i className="ri-phone-line text-primary-teal"></i>
                        <span>{selectedProdutor.contato_telefone}</span>
                      </div>
                    )}
                    {selectedProdutor.instagram && (
                      <div className="flex items-center gap-2 text-sm text-white">
                        <i className="ri-instagram-line text-primary-teal"></i>
                        <span>{selectedProdutor.instagram}</span>
                      </div>
                    )}
                    {selectedProdutor.portfolio && (
                      <div className="flex items-center gap-2 text-sm text-white">
                        <i className="ri-global-line text-primary-teal"></i>
                        <span>{selectedProdutor.portfolio}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Status e Experiência</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProdutor.status)}`}>
                        {getStatusLabel(selectedProdutor.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Experiência:</span>
                      <span className="text-sm text-white font-medium">{selectedProdutor.anos_experiencia} anos</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Projetos:</span>
                      <span className="text-sm text-white font-medium">{selectedProdutor.projetos.length} realizados</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedProdutor.observacoes && (
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Observações</h3>
                  <p className="text-sm text-white">{selectedProdutor.observacoes}</p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Artistas Trabalhados</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProdutor.artistas_trabalhados.map((artista, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-2 bg-dark-bg border border-dark-border text-sm text-white rounded-lg"
                    >
                      {artista}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Projetos Realizados</h3>
                <div className="space-y-3">
                  {selectedProdutor.projetos.map((projeto) => (
                    <div 
                      key={projeto.id}
                      className="bg-dark-bg border border-dark-border rounded-lg p-4 hover:border-primary-teal transition-smooth"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{projeto.nome}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span><i className="ri-user-star-line mr-1"></i>{projeto.artista}</span>
                            <span><i className="ri-music-2-line mr-1"></i>{projeto.tipo}</span>
                            <span><i className="ri-calendar-line mr-1"></i>{projeto.ano}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Novo Produtor */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Novo Produtor</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              <div className="text-center py-12">
                <i className="ri-headphone-line text-6xl text-gray-600 mb-4"></i>
                <p className="text-gray-400">Formulário em desenvolvimento</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

