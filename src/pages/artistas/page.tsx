import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';

interface Artista {
  id: string;
  nome: string;
  genero: string;
  status: string;
  contato_email: string;
  contato_telefone?: string;
  observacoes_internas?: string;
  created_at: string;
}

export default function Artistas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState<'csv' | 'json' | 'supabase' | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [supabaseTableName, setSupabaseTableName] = useState('artistas');
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [artistaToDelete, setArtistaToDelete] = useState<Artista | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    genero: '',
    status: 'ativo',
    contato_email: '',
    contato_telefone: '',
    observacoes_internas: ''
  });

  useEffect(() => {
    loadArtistas();
  }, []);

  const loadArtistas = async () => {
    try {
      const { data, error } = await supabase
        .from('artistas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArtistas(data || []);
    } catch (error) {
      console.error('Erro ao carregar artistas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('artistas')
        .insert([formData]);

      if (error) throw error;

      setShowModal(false);
      setFormData({
        nome: '',
        genero: '',
        status: 'ativo',
        contato_email: '',
        contato_telefone: '',
        observacoes_internas: ''
      });
      loadArtistas();
    } catch (error) {
      console.error('Erro ao criar artista:', error);
      alert('Erro ao criar artista. Tente novamente.');
    }
  };

  const handleDeleteClick = (artista: Artista) => {
    setArtistaToDelete(artista);
    setShowDeleteConfirm(true);
    setShowActionsMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!artistaToDelete) return;

    try {
      const { error } = await supabase
        .from('artistas')
        .delete()
        .eq('id', artistaToDelete.id);

      if (error) throw error;

      setShowDeleteConfirm(false);
      setArtistaToDelete(null);
      loadArtistas();
    } catch (error) {
      console.error('Erro ao deletar artista:', error);
      alert('Erro ao deletar artista. Tente novamente.');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setArtistaToDelete(null);
  };

  const filteredArtistas = artistas.filter(artista => {
    const matchesSearch = artista.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artista.genero.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || artista.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Função para processar CSV
  const parseCSV = (text: string): Partial<Artista>[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados');
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const artistas: Partial<Artista>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const artista: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        // Mapear campos comuns
        if (header.includes('nome') || header.includes('name')) {
          artista.nome = value;
        } else if (header.includes('gênero') || header.includes('genero') || header.includes('genre')) {
          artista.genero = value;
        } else if (header.includes('email') || header.includes('e-mail')) {
          artista.contato_email = value;
        } else if (header.includes('telefone') || header.includes('phone') || header.includes('tel')) {
          artista.contato_telefone = value;
        } else if (header.includes('status')) {
          artista.status = value || 'ativo';
        } else if (header.includes('observa') || header.includes('note') || header.includes('obs')) {
          artista.observacoes_internas = value;
        }
      });
      
      if (artista.nome && artista.contato_email) {
        artistas.push(artista);
      }
    }
    
    return artistas;
  };

  // Função para processar JSON
  const parseJSON = (text: string): Partial<Artista>[] => {
    const data = JSON.parse(text);
    const artistas: Partial<Artista>[] = [];
    
    // Se for um array, processar diretamente
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        const artista: any = {
          nome: item.nome || item.name || item.artist_name || '',
          genero: item.genero || item.genero_musical || item.genre || '',
          contato_email: item.contato_email || item.email || item.contato?.email || '',
          contato_telefone: item.contato_telefone || item.telefone || item.phone || item.contato?.telefone || '',
          status: item.status || 'ativo',
          observacoes_internas: item.observacoes_internas || item.observacoes || item.notes || ''
        };
        
        if (artista.nome && artista.contato_email) {
          artistas.push(artista);
        }
      });
    } else if (data.artistas || data.artists) {
      // Se for um objeto com propriedade artistas
      const items = data.artistas || data.artists;
      items.forEach((item: any) => {
        const artista: any = {
          nome: item.nome || item.name || item.artist_name || '',
          genero: item.genero || item.genero_musical || item.genre || '',
          contato_email: item.contato_email || item.email || item.contato?.email || '',
          contato_telefone: item.contato_telefone || item.telefone || item.phone || item.contato?.telefone || '',
          status: item.status || 'ativo',
          observacoes_internas: item.observacoes_internas || item.observacoes || item.notes || ''
        };
        
        if (artista.nome && artista.contato_email) {
          artistas.push(artista);
        }
      });
    }
    
    return artistas;
  };

  // Função para importar do Supabase (outra tabela)
  const importFromSupabase = async () => {
    setImportLoading(true);
    setImportError(null);
    setImportSuccess(null);
    
    try {
      const { data, error } = await supabase
        .from(supabaseTableName)
        .select('*');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Nenhum dado encontrado na tabela especificada');
      }
      
      // Mapear os dados da tabela externa para o formato de artistas
      const artistasToImport = data.map((item: any) => ({
        nome: item.nome || item.name || item.artist_name || '',
        genero: item.genero || item.genero_musical || item.genre || '',
        contato_email: item.contato_email || item.email || item.contato?.email || '',
        contato_telefone: item.contato_telefone || item.telefone || item.phone || item.contato?.telefone || '',
        status: item.status || 'ativo',
        observacoes_internas: item.observacoes_internas || item.observacoes || item.notes || ''
      })).filter((artista: any) => artista.nome && artista.contato_email);
      
      if (artistasToImport.length === 0) {
        throw new Error('Nenhum artista válido encontrado (nome e email obrigatórios)');
      }
      
      // Importar os artistas
      await handleBulkImport(artistasToImport);
    } catch (error: any) {
      console.error('Erro ao importar do Supabase:', error);
      setImportError(error.message || 'Erro ao importar do Supabase. Verifique o nome da tabela e as permissões.');
    } finally {
      setImportLoading(false);
    }
  };

  // Função para importar em lote
  const handleBulkImport = async (artistasToImport: Partial<Artista>[]) => {
    setImportLoading(true);
    setImportError(null);
    setImportSuccess(null);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      // Verificar duplicatas por email antes de importar
      const existingEmails = new Set(artistas.map(a => a.contato_email.toLowerCase()));
      
      for (const artista of artistasToImport) {
        try {
          // Pular se já existe artista com o mesmo email
          if (existingEmails.has((artista.contato_email || '').toLowerCase())) {
            errorCount++;
            errors.push(`${artista.nome}: já existe artista com este email`);
            continue;
          }
          
          const { error } = await supabase
            .from('artistas')
            .insert([{
              nome: artista.nome,
              genero: artista.genero || 'Não especificado',
              status: artista.status || 'ativo',
              contato_email: artista.contato_email,
              contato_telefone: artista.contato_telefone || null,
              observacoes_internas: artista.observacoes_internas || null
            }]);
          
          if (error) {
            errorCount++;
            errors.push(`${artista.nome}: ${error.message}`);
          } else {
            successCount++;
            existingEmails.add((artista.contato_email || '').toLowerCase());
          }
        } catch (error: any) {
          errorCount++;
          errors.push(`${artista.nome}: ${error.message}`);
        }
      }
      
      if (successCount > 0) {
        setImportSuccess(`${successCount} artista(s) importado(s) com sucesso!${errorCount > 0 ? ` ${errorCount} erro(s).` : ''}`);
        await loadArtistas();
        
        if (errors.length > 0) {
          console.warn('Erros durante importação:', errors);
        }
      } else {
        setImportError(`Nenhum artista foi importado. Erros: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`);
      }
    } catch (error: any) {
      console.error('Erro ao importar artistas:', error);
      setImportError(error.message || 'Erro ao importar artistas. Tente novamente.');
    } finally {
      setImportLoading(false);
    }
  };

  // Função para processar arquivo
  const handleFileImport = async (file: File) => {
    setImportLoading(true);
    setImportError(null);
    setImportSuccess(null);
    
    try {
      const text = await file.text();
      let artistasToImport: Partial<Artista>[] = [];
      
      if (importType === 'csv') {
        artistasToImport = parseCSV(text);
      } else if (importType === 'json') {
        artistasToImport = parseJSON(text);
      }
      
      if (artistasToImport.length === 0) {
        throw new Error('Nenhum artista válido encontrado no arquivo');
      }
      
      await handleBulkImport(artistasToImport);
    } catch (error: any) {
      console.error('Erro ao processar arquivo:', error);
      setImportError(error.message || 'Erro ao processar arquivo. Verifique o formato.');
    } finally {
      setImportLoading(false);
    }
  };

  // Função para download de template CSV
  const downloadTemplate = () => {
    const template = 'nome,gênero,contato_email,contato_telefone,status,observacoes_internas\nJoão Silva,Pop,joao@email.com,(11) 99999-9999,ativo,Artista promissor';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template-artistas.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
            <p className="text-gray-400 mt-4">Carregando artistas...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Artistas</h1>
            <p className="text-gray-400">Gerencie todos os artistas da gravadora</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setShowImportModal(true);
                setImportType(null);
                setImportError(null);
                setImportSuccess(null);
              }}
              className="px-6 py-3 bg-dark-card border border-dark-border text-white font-medium rounded-lg hover:bg-dark-hover transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <i className="ri-upload-line text-xl"></i>
              Importar Artistas
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <i className="ri-add-line text-xl"></i>
              Novo Artista
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="text"
                placeholder="Buscar por nome ou gênero..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['todos', 'ativo', 'em_producao', 'pausa', 'finalizado'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-gradient-primary text-white'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  {status === 'todos' ? 'Todos' : 
                   status === 'em_producao' ? 'Em Produção' :
                   status === 'pausa' ? 'Pausa' :
                   status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Artists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtistas.map((artista) => (
            <div 
              key={artista.id} 
              className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-primary-teal transition-smooth"
              onClick={() => {
                // Fechar menu de ações se clicar fora dele
                if (showActionsMenu !== artista.id) {
                  setShowActionsMenu(null);
                }
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{getInitials(artista.nome)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{artista.nome}</h3>
                    <p className="text-sm text-gray-400">{artista.genero}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  artista.status === 'ativo' 
                    ? 'bg-green-500/20 text-green-400' 
                    : artista.status === 'em_producao'
                    ? 'bg-blue-500/20 text-blue-400'
                    : artista.status === 'pausa'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : artista.status === 'finalizado'
                    ? 'bg-gray-500/20 text-gray-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {artista.status === 'em_producao' ? 'Em Produção' :
                   artista.status === 'pausa' ? 'Pausa' :
                   artista.status === 'finalizado' ? 'Finalizado' :
                   artista.status.charAt(0).toUpperCase() + artista.status.slice(1)}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <i className="ri-mail-line text-primary-teal"></i>
                  <span className="truncate">{artista.contato_email}</span>
                </div>
                {artista.contato_telefone && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <i className="ri-phone-line text-primary-teal"></i>
                    <span>{artista.contato_telefone}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 relative">
                <button 
                  onClick={() => navigate(`/artistas/${artista.id}`)}
                  className="flex-1 px-4 py-2 bg-dark-bg hover:bg-dark-hover text-white text-sm rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                >
                  Ver Detalhes
                </button>
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActionsMenu(showActionsMenu === artista.id ? null : artista.id);
                    }}
                    className="px-4 py-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
                    title="Mais opções"
                  >
                    <i className="ri-more-2-fill"></i>
                  </button>
                  
                  {showActionsMenu === artista.id && (
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-dark-card border border-dark-border rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => {
                          navigate(`/artistas/${artista.id}`);
                          setShowActionsMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-hover transition-smooth cursor-pointer flex items-center gap-2 rounded-t-lg"
                      >
                        <i className="ri-eye-line"></i>
                        Ver Detalhes
                      </button>
                      <button
                        onClick={() => {
                          navigate(`/artistas/${artista.id}`);
                          setShowActionsMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-hover transition-smooth cursor-pointer flex items-center gap-2"
                      >
                        <i className="ri-edit-line"></i>
                        Editar
                      </button>
                      <div className="border-t border-dark-border"></div>
                      <button
                        onClick={() => handleDeleteClick(artista)}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-smooth cursor-pointer flex items-center gap-2 rounded-b-lg"
                      >
                        <i className="ri-delete-bin-line"></i>
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredArtistas.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-user-star-line text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhum artista encontrado</p>
          </div>
        )}

        {/* Modal Importar Artistas */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Importar Artistas</h2>
                <button 
                  onClick={() => {
                    setShowImportModal(false);
                    setImportType(null);
                    setImportError(null);
                    setImportSuccess(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              {!importType ? (
                <div className="space-y-4">
                  <p className="text-gray-400 mb-6">Escolha o método de importação:</p>
                  
                  <button
                    onClick={() => setImportType('csv')}
                    className="w-full p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-primary-teal transition-smooth cursor-pointer text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary-teal/20 flex items-center justify-center">
                      <i className="ri-file-text-line text-2xl text-primary-teal"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">Importar de CSV</h3>
                      <p className="text-sm text-gray-400">Faça upload de um arquivo CSV com os dados dos artistas</p>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 text-xl"></i>
                  </button>

                  <button
                    onClick={() => setImportType('json')}
                    className="w-full p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-primary-teal transition-smooth cursor-pointer text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary-teal/20 flex items-center justify-center">
                      <i className="ri-code-s-slash-line text-2xl text-primary-teal"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">Importar de JSON</h3>
                      <p className="text-sm text-gray-400">Faça upload de um arquivo JSON com os dados dos artistas</p>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 text-xl"></i>
                  </button>

                  <button
                    onClick={() => setImportType('supabase')}
                    className="w-full p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-primary-teal transition-smooth cursor-pointer text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary-teal/20 flex items-center justify-center">
                      <i className="ri-database-2-line text-2xl text-primary-teal"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">Importar do Supabase</h3>
                      <p className="text-sm text-gray-400">Importar de outra tabela no mesmo banco Supabase</p>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 text-xl"></i>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setImportType(null);
                      setImportError(null);
                      setImportSuccess(null);
                    }}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-smooth cursor-pointer mb-4"
                  >
                    <i className="ri-arrow-left-line"></i>
                    <span>Voltar</span>
                  </button>

                  {importType === 'csv' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo CSV</label>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileImport(file);
                          }}
                          className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        />
                      </div>
                      <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-2">Formato esperado (CSV):</p>
                        <code className="text-xs text-gray-500 block mb-3">
                          nome,gênero,contato_email,contato_telefone,status,observacoes_internas
                        </code>
                        <button
                          onClick={downloadTemplate}
                          className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer flex items-center gap-2"
                        >
                          <i className="ri-download-line"></i>
                          Baixar template CSV
                        </button>
                      </div>
                    </div>
                  )}

                  {importType === 'json' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo JSON</label>
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileImport(file);
                          }}
                          className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        />
                      </div>
                      <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-2">Formato esperado (JSON):</p>
                        <code className="text-xs text-gray-500 block">
                          {`[\n  {\n    "nome": "Nome do Artista",\n    "genero": "Pop",\n    "contato_email": "email@exemplo.com",\n    "contato_telefone": "(11) 99999-9999",\n    "status": "ativo"\n  }\n]`}
                        </code>
                      </div>
                    </div>
                  )}

                  {importType === 'supabase' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Nome da Tabela</label>
                        <input
                          type="text"
                          value={supabaseTableName}
                          onChange={(e) => setSupabaseTableName(e.target.value)}
                          placeholder="Ex: artistas, artists, performers"
                          className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Digite o nome da tabela no Supabase que contém os artistas do site da CEU Music
                        </p>
                      </div>
                      <button
                        onClick={importFromSupabase}
                        disabled={importLoading || !supabaseTableName}
                        className="w-full px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {importLoading ? (
                          <>
                            <i className="ri-loader-4-line animate-spin"></i>
                            Importando...
                          </>
                        ) : (
                          <>
                            <i className="ri-download-line"></i>
                            Importar da Tabela
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {importLoading && (
                    <div className="text-center py-4">
                      <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin mb-2"></i>
                      <p className="text-gray-400">Processando importação...</p>
                    </div>
                  )}

                  {importError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <i className="ri-error-warning-line text-red-400 text-xl"></i>
                        <div className="flex-1">
                          <p className="text-red-400 font-medium mb-1">Erro na importação</p>
                          <p className="text-sm text-red-300">{importError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {importSuccess && (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <i className="ri-checkbox-circle-line text-green-400 text-xl"></i>
                        <div className="flex-1">
                          <p className="text-green-400 font-medium mb-1">Importação concluída!</p>
                          <p className="text-sm text-green-300">{importSuccess}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteConfirm && artistaToDelete && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <i className="ri-alert-line text-2xl text-red-400"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Confirmar Exclusão</h2>
                  <p className="text-sm text-gray-400">Esta ação não pode ser desfeita</p>
                </div>
              </div>
              
              <p className="text-white mb-6">
                Tem certeza que deseja excluir o artista <strong>"{artistaToDelete.nome}"</strong>?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border text-white font-medium rounded-lg hover:bg-dark-hover transition-smooth"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-smooth"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Novo Artista */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Novo Artista</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Nome do Artista</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Digite o nome do artista"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Gênero Musical</label>
                  <input
                    type="text"
                    required
                    value={formData.genero}
                    onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Pop, Rock, Hip Hop"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">E-mail</label>
                  <input
                    type="email"
                    required
                    value={formData.contato_email}
                    onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="artista@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Telefone (opcional)</label>
                  <input
                    type="tel"
                    value={formData.contato_telefone}
                    onChange={(e) => setFormData({ ...formData, contato_telefone: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="em_producao">Em Produção</option>
                    <option value="pausa">Pausa</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Observações Internas (opcional)</label>
                  <textarea
                    value={formData.observacoes_internas}
                    onChange={(e) => setFormData({ ...formData, observacoes_internas: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Observações internas sobre o artista..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Criar Artista
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}