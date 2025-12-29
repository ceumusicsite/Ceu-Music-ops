import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';

type Categoria = 'contrato' | 'letra' | 'guia_gravacao' | 'arte';
type TipoAssociacao = 'artista' | 'projeto' | 'nenhum';

interface Documento {
  id: string;
  nome: string;
  categoria: Categoria;
  tipo_associacao: TipoAssociacao;
  artista_id?: string;
  projeto_id?: string;
  arquivo_url: string;
  arquivo_nome: string;
  tamanho?: number;
  descricao?: string;
  created_at: string;
  artista?: { nome: string };
  projeto?: { nome: string };
}

interface Artista {
  id: string;
  nome: string;
}

interface Projeto {
  id: string;
  nome: string;
}

const categoriasLabels: Record<Categoria, string> = {
  'contrato': 'Contrato',
  'letra': 'Letra',
  'guia_gravacao': 'Guia de Gravação',
  'arte': 'Arte'
};

const categoriasIcons: Record<Categoria, string> = {
  'contrato': 'ri-file-text-line',
  'letra': 'ri-music-2-line',
  'guia_gravacao': 'ri-file-list-3-line',
  'arte': 'ri-image-line'
};

const categoriasColors: Record<Categoria, string> = {
  'contrato': 'bg-blue-500/20 text-blue-400',
  'letra': 'bg-purple-500/20 text-purple-400',
  'guia_gravacao': 'bg-orange-500/20 text-orange-400',
  'arte': 'bg-pink-500/20 text-pink-400'
};

export default function Documentos() {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState<Categoria | 'todas'>('todas');
  const [filterTipo, setFilterTipo] = useState<TipoAssociacao | 'todos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'contrato' as Categoria,
    tipo_associacao: 'nenhum' as TipoAssociacao,
    artista_id: '',
    projeto_id: '',
    descricao: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar documentos
      const { data: documentosData, error: documentosError } = await supabase
        .from('documentos')
        .select('*, artista:artista_id(nome), projeto:projeto_id(nome)')
        .order('created_at', { ascending: false });

      if (documentosError && documentosError.code !== 'PGRST116') {
        throw documentosError;
      }

      if (documentosData) setDocumentos(documentosData as any);

      // Carregar artistas e projetos para os selects
      const [artistasRes, projetosRes] = await Promise.all([
        supabase
          .from('artistas')
          .select('id, nome')
          .order('nome'),
        supabase
          .from('projetos')
          .select('id, nome')
          .order('nome')
      ]);

      if (artistasRes.data) setArtistas(artistasRes.data);
      if (projetosRes.data) setProjetos(projetosRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.nome) {
        setFormData({ ...formData, nome: file.name });
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Selecione um arquivo para upload');
      return;
    }

    setUploading(true);
    try {
      // Gerar nome único para o arquivo
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `documentos/${fileName}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('arquivos')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Obter URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from('arquivos')
        .getPublicUrl(filePath);

      // Salvar metadados do documento no banco
      const documentoData: any = {
        nome: formData.nome || selectedFile.name,
        categoria: formData.categoria,
        tipo_associacao: formData.tipo_associacao,
        arquivo_url: urlData.publicUrl,
        arquivo_nome: selectedFile.name,
        tamanho: selectedFile.size,
        descricao: formData.descricao || null
      };

      if (formData.tipo_associacao === 'artista' && formData.artista_id) {
        documentoData.artista_id = formData.artista_id;
      }

      if (formData.tipo_associacao === 'projeto' && formData.projeto_id) {
        documentoData.projeto_id = formData.projeto_id;
      }

      const { error: dbError } = await supabase
        .from('documentos')
        .insert([documentoData]);

      if (dbError) throw dbError;

      setShowModal(false);
      setSelectedFile(null);
      setFormData({
        nome: '',
        categoria: 'contrato',
        tipo_associacao: 'nenhum',
        artista_id: '',
        projeto_id: '',
        descricao: ''
      });
      
      // Resetar input de arquivo
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      loadData();
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      alert(`Erro ao fazer upload: ${error.message || 'Tente novamente.'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documento: Documento) => {
    if (!confirm(`Tem certeza que deseja excluir o documento "${documento.nome}"?`)) {
      return;
    }

    try {
      // Extrair caminho do arquivo da URL
      const urlParts = documento.arquivo_url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('arquivos') + 1).join('/');

      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('arquivos')
        .remove([filePath]);

      if (storageError && storageError.message !== 'Object not found') {
        console.warn('Erro ao deletar do storage:', storageError);
      }

      // Deletar do banco
      const { error: dbError } = await supabase
        .from('documentos')
        .delete()
        .eq('id', documento.id);

      if (dbError) throw dbError;

      loadData();
    } catch (error: any) {
      console.error('Erro ao deletar documento:', error);
      alert(`Erro ao deletar documento: ${error.message || 'Tente novamente.'}`);
    }
  };

  const handleDownload = (documento: Documento) => {
    window.open(documento.arquivo_url, '_blank');
  };

  const filteredDocumentos = documentos.filter(doc => {
    const matchesCategoria = filterCategoria === 'todas' || doc.categoria === filterCategoria;
    const matchesTipo = filterTipo === 'todos' || doc.tipo_associacao === filterTipo;
    const matchesSearch = doc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.artista?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.projeto?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategoria && matchesTipo && matchesSearch;
  });

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
            <p className="text-gray-400 mt-4">Carregando documentos...</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Documentos e Arquivos</h1>
            <p className="text-gray-400">Gerencie contratos, letras, guias e artes</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-upload-line text-xl"></i>
            Upload de Documento
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {(['contrato', 'letra', 'guia_gravacao', 'arte'] as Categoria[]).map((categoria) => {
            const count = documentos.filter(d => d.categoria === categoria).length;
            return (
              <div key={categoria} className="bg-dark-card border border-dark-border rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{categoriasLabels[categoria]}</p>
                    <p className="text-2xl font-bold text-white">{count}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${categoriasColors[categoria]} flex items-center justify-center`}>
                    <i className={`${categoriasIcons[categoria]} text-xl`}></i>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['todas', 'contrato', 'letra', 'guia_gravacao', 'arte'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategoria(cat)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer whitespace-nowrap ${
                    filterCategoria === cat
                      ? 'bg-gradient-primary text-white'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  {cat === 'todas' ? 'Todas' : categoriasLabels[cat]}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['todos', 'artista', 'projeto', 'nenhum'] as const).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFilterTipo(tipo)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer whitespace-nowrap ${
                    filterTipo === tipo
                      ? 'bg-gradient-primary text-white'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  {tipo === 'todos' ? 'Todos' : 
                   tipo === 'nenhum' ? 'Sem Associação' :
                   tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Documentos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocumentos.map((documento) => (
            <div key={documento.id} className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-primary-teal transition-smooth">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-lg ${categoriasColors[documento.categoria]} flex items-center justify-center flex-shrink-0`}>
                    <i className={`${categoriasIcons[documento.categoria]} text-xl`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate mb-1">{documento.nome}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${categoriasColors[documento.categoria]}`}>
                      {categoriasLabels[documento.categoria]}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(documento)}
                  className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-smooth cursor-pointer flex-shrink-0"
                  title="Excluir"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>

              {documento.descricao && (
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{documento.descricao}</p>
              )}

              <div className="space-y-2 mb-4">
                {documento.artista && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <i className="ri-user-star-line"></i>
                    <span>{documento.artista.nome}</span>
                  </div>
                )}
                {documento.projeto && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <i className="ri-music-2-line"></i>
                    <span>{documento.projeto.nome}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <i className="ri-file-line"></i>
                  <span>{formatFileSize(documento.tamanho)}</span>
                  <span className="mx-1">•</span>
                  <span>{new Date(documento.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <button
                onClick={() => handleDownload(documento)}
                className="w-full px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center justify-center gap-2"
              >
                <i className="ri-download-line"></i>
                Baixar
              </button>
            </div>
          ))}
        </div>

        {filteredDocumentos.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-file-line text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhum documento encontrado</p>
          </div>
        )}

        {/* Modal Upload */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Upload de Documento</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedFile(null);
                    setFormData({
                      nome: '',
                      categoria: 'contrato',
                      tipo_associacao: 'nenhum',
                      artista_id: '',
                      projeto_id: '',
                      descricao: ''
                    });
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo</label>
                  <div className="border-2 border-dashed border-dark-border rounded-lg p-6 text-center hover:border-primary-teal transition-smooth">
                    <input
                      id="file-input"
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-input"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      {selectedFile ? (
                        <>
                          <i className="ri-file-line text-4xl text-primary-teal"></i>
                          <div>
                            <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                            <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedFile(null);
                              const fileInput = document.getElementById('file-input') as HTMLInputElement;
                              if (fileInput) fileInput.value = '';
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remover arquivo
                          </button>
                        </>
                      ) : (
                        <>
                          <i className="ri-upload-cloud-2-line text-4xl text-gray-400"></i>
                          <div>
                            <p className="text-sm text-gray-400">Clique para selecionar um arquivo</p>
                            <p className="text-xs text-gray-500">ou arraste e solte</p>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Nome do Documento</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Ex: Contrato Artista X"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Categoria</label>
                  <select
                    required
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value as Categoria })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="contrato">Contrato</option>
                    <option value="letra">Letra</option>
                    <option value="guia_gravacao">Guia de Gravação</option>
                    <option value="arte">Arte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Associar a</label>
                  <select
                    value={formData.tipo_associacao}
                    onChange={(e) => setFormData({ ...formData, tipo_associacao: e.target.value as TipoAssociacao, artista_id: '', projeto_id: '' })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="nenhum">Sem associação</option>
                    <option value="artista">Artista</option>
                    <option value="projeto">Projeto</option>
                  </select>
                </div>

                {formData.tipo_associacao === 'artista' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Artista</label>
                    <select
                      required
                      value={formData.artista_id}
                      onChange={(e) => setFormData({ ...formData, artista_id: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                    >
                      <option value="">Selecione um artista</option>
                      {artistas.map((artista) => (
                        <option key={artista.id} value={artista.id}>{artista.nome}</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.tipo_associacao === 'projeto' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Projeto</label>
                    <select
                      required
                      value={formData.projeto_id}
                      onChange={(e) => setFormData({ ...formData, projeto_id: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                    >
                      <option value="">Selecione um projeto</option>
                      {projetos.map((projeto) => (
                        <option key={projeto.id} value={projeto.id}>{projeto.nome}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Descrição (opcional)</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Descrição do documento..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedFile(null);
                      setFormData({
                        nome: '',
                        categoria: 'contrato',
                        tipo_associacao: 'nenhum',
                        artista_id: '',
                        projeto_id: '',
                        descricao: ''
                      });
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <i className="ri-loader-4-line animate-spin"></i>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <i className="ri-upload-line"></i>
                        Fazer Upload
                      </>
                    )}
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

