import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { storageService, R2_BUCKETS } from '../../services/storage';
import { uploadToR2 } from '../../lib/r2';

interface Anexo {
  id: string;
  artista_id: string;
  tipo: 'pasta' | 'arquivo';
  nome: string;
  pasta_pai_id: string | null;
  arquivo_key?: string;
  arquivo_url?: string;
  arquivo_tamanho?: number;
  arquivo_tipo?: string;
  arquivo_extensao?: string;
  descricao?: string;
  tags?: string[];
  ordem: number;
  created_at: string;
  updated_at: string;
}

interface FileManagerProps {
  artistaId: string;
  artistaNome: string;
}

export default function FileManager({ artistaId, artistaNome }: FileManagerProps) {
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(true);
  const [pastaAtual, setPastaAtual] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null; nome: string }>>([
    { id: null, nome: 'Raiz' }
  ]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [showEditFileModal, setShowEditFileModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<Anexo | null>(null);
  const [editingFile, setEditingFile] = useState<Anexo | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFileName, setEditFileName] = useState('');
  const [editFileReplacement, setEditFileReplacement] = useState<File | null>(null);
  const [replacingFile, setReplacingFile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabelaNaoExiste, setTabelaNaoExiste] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [previewArquivo, setPreviewArquivo] = useState<Anexo | null>(null);

  useEffect(() => {
    loadAnexos();
  }, [artistaId, pastaAtual]);

  // Resetar breadcrumbs quando mudar de artista
  useEffect(() => {
    setPastaAtual(null);
    setBreadcrumbs([{ id: null, nome: 'Raiz' }]);
  }, [artistaId]);

  const loadAnexos = async () => {
    try {
      setLoading(true);
      
      // Construir query com tratamento correto para NULL
      let query = supabase
        .from('artistas_anexos')
        .select('*')
        .eq('artista_id', artistaId);

      // Se pastaAtual é null, buscar itens onde pasta_pai_id é NULL
      // Se pastaAtual tem valor, buscar itens onde pasta_pai_id é igual ao valor
      if (pastaAtual === null) {
        query = query.is('pasta_pai_id', null);
      } else {
        query = query.eq('pasta_pai_id', pastaAtual);
      }

      const { data, error } = await query
        .order('tipo', { ascending: true }) // Pastas primeiro
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro na query:', error);
        
        // Verificar se é erro de tabela não encontrada
        if (
          error.code === 'PGRST116' || 
          error.code === '42P01' ||
          error.message?.includes('does not exist') || 
          error.message?.includes('relation') ||
          error.message?.includes('Could not find the table')
        ) {
          console.warn('Tabela artistas_anexos não encontrada. Execute o SQL: scripts/create-artistas-anexos-table.sql');
          setTabelaNaoExiste(true);
          setAnexos([]);
          return;
        }
        
        // Verificar se é erro de RLS (Row Level Security)
        if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          console.error('Erro de permissão (RLS). Verifique as políticas de segurança da tabela.');
          setAnexos([]);
          return;
        }
        
        throw error;
      }
      
      setTabelaNaoExiste(false);
      setAnexos(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar anexos:', error);
      
      // Se for erro de tabela não encontrada, não mostrar erro crítico
      if (
        error.code === 'PGRST116' || 
        error.code === '42P01' ||
        error.message?.includes('does not exist') || 
        error.message?.includes('relation') ||
        error.message?.includes('Could not find the table')
      ) {
        setTabelaNaoExiste(true);
        setAnexos([]);
      } else {
        // Outros erros - mostrar no console mas não quebrar a UI
        console.error('Erro detalhado:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        setErroCarregamento(error.message || 'Erro desconhecido ao carregar anexos');
        setAnexos([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const normalizeNome = (nome: string): string => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  const criarPasta = async () => {
    if (!newFolderName.trim()) {
      alert('Digite um nome para a pasta');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('artistas_anexos')
        .insert({
          artista_id: artistaId,
          tipo: 'pasta',
          nome: newFolderName.trim(),
          pasta_pai_id: pastaAtual || null, // Garantir que seja null se pastaAtual for null
          ordem: anexos.filter(a => a.tipo === 'pasta').length,
        })
        .select()
        .single();

      if (error) {
        // Verificar se é erro de tabela não encontrada
        if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
          alert('A tabela de anexos ainda não foi criada. Execute o SQL: scripts/create-artistas-anexos-table.sql no Supabase Dashboard > SQL Editor');
          return;
        }
        throw error;
      }

      // Criar pasta no R2 (apenas estrutura de metadados, R2 não tem pastas reais)
      // Mas podemos criar um arquivo marcador se necessário
      const pastaKey = `artistas/${normalizeNome(artistaNome)}/${data.id}/.pasta`;
      
      setNewFolderName('');
      setShowCreateFolderModal(false);
      loadAnexos();
    } catch (error: any) {
      console.error('Erro ao criar pasta:', error);
      const errorMessage = error.message || 'Tente novamente';
      
      if (error.code === 'PGRST116' || errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
        alert('❌ A tabela de anexos não foi criada ainda.\n\n📝 Execute o SQL no Supabase:\n1. Acesse Supabase Dashboard > SQL Editor\n2. Execute: scripts/create-artistas-anexos-table.sql');
      } else {
        alert(`Erro ao criar pasta: ${errorMessage}`);
      }
    }
  };

  const fazerUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Selecione pelo menos um arquivo');
      return;
    }

    try {
      setUploading(true);
      const pastaNormalizada = normalizeNome(artistaNome);
      // Construir caminho da pasta
      let pastaPath = pastaNormalizada;
      if (pastaAtual) {
        const caminhoCompleto = await getCaminhoPastaCompleto(pastaAtual);
        pastaPath = caminhoCompleto;
      }

      const uploads = selectedFiles.map(async (file) => {
        // Upload para R2
        const result = await uploadToR2(file, {
          bucket: R2_BUCKETS.ANEXOS,
          folder: `artistas/${pastaPath}`,
          makePublic: false, // URLs assinadas são mais seguras
        });

        // Salvar metadados no banco
        const { data, error } = await supabase
          .from('artistas_anexos')
          .insert({
            artista_id: artistaId,
            tipo: 'arquivo',
            nome: file.name,
            pasta_pai_id: pastaAtual,
            arquivo_key: result.key,
            arquivo_url: result.url,
            arquivo_tamanho: file.size,
            arquivo_tipo: file.type,
            arquivo_extensao: file.name.split('.').pop()?.toLowerCase(),
            ordem: anexos.filter(a => a.tipo === 'arquivo').length,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      await Promise.all(uploads);
      
      setSelectedFiles([]);
      setShowUploadModal(false);
      loadAnexos();
      alert('Arquivos enviados com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      alert(`Erro ao fazer upload: ${error.message || 'Tente novamente'}`);
    } finally {
      setUploading(false);
    }
  };

  const getCaminhoPastaCompleto = async (pastaId: string): Promise<string> => {
    const caminho: string[] = [];
    let currentId: string | null = pastaId;

    while (currentId) {
      const { data } = await supabase
        .from('artistas_anexos')
        .select('id, nome, pasta_pai_id')
        .eq('id', currentId)
        .single();

      if (data) {
        caminho.unshift(normalizeNome(data.nome));
        currentId = data.pasta_pai_id;
      } else {
        break;
      }
    }

    return `${normalizeNome(artistaNome)}/${caminho.join('/')}`;
  };

  const entrarNaPasta = (pastaId: string, nomePasta: string) => {
    setPastaAtual(pastaId);
    setBreadcrumbs([...breadcrumbs, { id: pastaId, nome: nomePasta }]);
  };

  const voltarPasta = (index: number) => {
    const novoBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(novoBreadcrumbs);
    const pastaId = novoBreadcrumbs[novoBreadcrumbs.length - 1].id;
    setPastaAtual(pastaId);
  };

  const editarPasta = async () => {
    if (!editingFolder || !editFolderName.trim()) {
      alert('Digite um nome para a pasta');
      return;
    }

    try {
      const { error } = await supabase
        .from('artistas_anexos')
        .update({ nome: editFolderName.trim() })
        .eq('id', editingFolder.id);

      if (error) throw error;

      // Atualizar breadcrumbs se a pasta editada estiver no caminho atual
      const breadcrumbIndex = breadcrumbs.findIndex(b => b.id === editingFolder.id);
      if (breadcrumbIndex !== -1) {
        const novosBreadcrumbs = [...breadcrumbs];
        novosBreadcrumbs[breadcrumbIndex].nome = editFolderName.trim();
        setBreadcrumbs(novosBreadcrumbs);
      }

      setShowEditFolderModal(false);
      setEditingFolder(null);
      setEditFolderName('');
      loadAnexos();
    } catch (error: any) {
      console.error('Erro ao editar pasta:', error);
      alert(`Erro ao editar pasta: ${error.message || 'Tente novamente'}`);
    }
  };

  const editarArquivo = async () => {
    if (!editingFile || !editFileName.trim()) {
      alert('Digite um nome para o arquivo');
      return;
    }

    try {
      setReplacingFile(true);
      const pastaNormalizada = normalizeNome(artistaNome);
      let pastaPath = pastaNormalizada;
      
      if (pastaAtual) {
        const caminhoCompleto = await getCaminhoPastaCompleto(pastaAtual);
        pastaPath = caminhoCompleto;
      }

      let arquivoKey = editingFile.arquivo_key;
      let arquivoUrl = editingFile.arquivo_url;
      let arquivoTamanho = editingFile.arquivo_tamanho;
      let arquivoTipo = editingFile.arquivo_tipo;
      let arquivoExtensao = editingFile.arquivo_extensao;

      // Se um novo arquivo foi selecionado, fazer upload
      if (editFileReplacement) {
        // Deletar arquivo antigo do R2 se existir
        if (editingFile.arquivo_key) {
          try {
            await storageService.delete(R2_BUCKETS.ANEXOS, editingFile.arquivo_key);
          } catch (error) {
            console.warn('Erro ao deletar arquivo antigo (pode não existir):', error);
          }
        }

        // Fazer upload do novo arquivo
        const result = await uploadToR2(editFileReplacement, {
          bucket: R2_BUCKETS.ANEXOS,
          folder: `artistas/${pastaPath}`,
          makePublic: false,
        });

        arquivoKey = result.key;
        arquivoUrl = result.url;
        arquivoTamanho = editFileReplacement.size;
        arquivoTipo = editFileReplacement.type;
        arquivoExtensao = editFileReplacement.name.split('.').pop()?.toLowerCase();
      }

      // Atualizar no banco de dados
      const { error } = await supabase
        .from('artistas_anexos')
        .update({
          nome: editFileName.trim(),
          arquivo_key: arquivoKey,
          arquivo_url: arquivoUrl,
          arquivo_tamanho: arquivoTamanho,
          arquivo_tipo: arquivoTipo,
          arquivo_extensao: arquivoExtensao,
        })
        .eq('id', editingFile.id);

      if (error) throw error;

      setShowEditFileModal(false);
      setEditingFile(null);
      setEditFileName('');
      setEditFileReplacement(null);
      loadAnexos();
      alert('Arquivo atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao editar arquivo:', error);
      alert(`Erro ao editar arquivo: ${error.message || 'Tente novamente'}`);
    } finally {
      setReplacingFile(false);
    }
  };

  const abrirModalEditar = (item: Anexo) => {
    if (item.tipo === 'pasta') {
      setEditingFolder(item);
      setEditFolderName(item.nome);
      setShowEditFolderModal(true);
    } else {
      setEditingFile(item);
      setEditFileName(item.nome);
      setEditFileReplacement(null);
      setShowEditFileModal(true);
    }
  };

  const deletarItem = async (item: Anexo) => {
    if (!confirm(`Tem certeza que deseja deletar "${item.nome}"?`)) {
      return;
    }

    try {
      if (item.tipo === 'arquivo' && item.arquivo_key) {
        // Deletar do R2
        await storageService.delete(R2_BUCKETS.ANEXOS, item.arquivo_key);
      } else if (item.tipo === 'pasta') {
        // Verificar se a pasta tem conteúdo
        const { data: filhos } = await supabase
          .from('artistas_anexos')
          .select('id')
          .eq('pasta_pai_id', item.id);

        if (filhos && filhos.length > 0) {
          alert('Não é possível deletar uma pasta que contém arquivos ou outras pastas. Delete o conteúdo primeiro.');
          return;
        }
      }

      // Deletar do banco
      const { error } = await supabase
        .from('artistas_anexos')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      loadAnexos();
    } catch (error: any) {
      console.error('Erro ao deletar:', error);
      alert(`Erro ao deletar: ${error.message || 'Tente novamente'}`);
    }
  };

  const formatarTamanho = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isArquivoImagem = (arquivo: Anexo): boolean => {
    const ext = arquivo.arquivo_extensao?.toLowerCase() || arquivo.arquivo_tipo?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].some(e => ext.includes(e)) ||
      (arquivo.arquivo_tipo || '').startsWith('image/');
  };

  const isArquivoPdf = (arquivo: Anexo): boolean => {
    const ext = arquivo.arquivo_extensao?.toLowerCase() || '';
    return ext === 'pdf' || (arquivo.arquivo_tipo || '').includes('pdf');
  };

  const getIconeArquivo = (extensao?: string): string => {
    const ext = extensao?.toLowerCase() || '';
    const icones: Record<string, string> = {
      'pdf': 'ri-file-pdf-line',
      'doc': 'ri-file-word-line',
      'docx': 'ri-file-word-line',
      'xls': 'ri-file-excel-line',
      'xlsx': 'ri-file-excel-line',
      'jpg': 'ri-image-line',
      'jpeg': 'ri-image-line',
      'png': 'ri-image-line',
      'gif': 'ri-image-line',
      'mp3': 'ri-music-line',
      'wav': 'ri-music-line',
      'mp4': 'ri-video-line',
      'mov': 'ri-video-line',
      'zip': 'ri-file-zip-line',
      'rar': 'ri-file-zip-line',
    };
    return icones[ext] || 'ri-file-line';
  };

  const anexosFiltrados = anexos.filter(anexo =>
    anexo.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pastas = anexosFiltrados.filter(a => a.tipo === 'pasta');
  const arquivos = anexosFiltrados.filter(a => a.tipo === 'arquivo');

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
      {/* Aviso se tabela não existe */}
      {tabelaNaoExiste && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <i className="ri-alert-line text-yellow-400 text-xl mt-0.5"></i>
            <div className="flex-1">
              <h3 className="text-yellow-400 font-medium mb-1">Tabela de Anexos Não Encontrada</h3>
              <p className="text-sm text-yellow-300/80 mb-3">
                A tabela <code className="bg-black/30 px-1 rounded">artistas_anexos</code> precisa ser criada no Supabase antes de usar o armazenamento.
              </p>
              <div className="text-sm text-yellow-300/80 space-y-1 mb-3">
                <p><strong>Passos:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Acesse o Supabase Dashboard</li>
                  <li>Vá em <strong>SQL Editor</strong></li>
                  <li>Execute o arquivo: <code className="bg-black/30 px-1 rounded">scripts/create-artistas-anexos-table.sql</code></li>
                  <li>Aguarde 10-30 segundos (cache do PostgREST)</li>
                  <li>Recarregue esta página</li>
                </ol>
              </div>
              <button
                onClick={() => {
                  setTabelaNaoExiste(false);
                  loadAnexos();
                }}
                className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg transition-smooth cursor-pointer text-sm flex items-center gap-2"
              >
                <i className="ri-refresh-line"></i>
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Erro de carregamento */}
      {erroCarregamento && !tabelaNaoExiste && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <i className="ri-error-warning-line text-red-400 text-xl mt-0.5"></i>
            <div className="flex-1">
              <h3 className="text-red-400 font-medium mb-1">Erro ao Carregar Anexos</h3>
              <p className="text-sm text-red-300/80 mb-3">{erroCarregamento}</p>
              <button
                onClick={() => {
                  setErroCarregamento(null);
                  loadAnexos();
                }}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-smooth cursor-pointer text-sm flex items-center gap-2"
              >
                <i className="ri-refresh-line"></i>
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Armazenamento</h2>
          <p className="text-sm text-gray-400">Gerencie pastas e arquivos do artista</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-3 py-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
            title={viewMode === 'grid' ? 'Visualização em lista' : 'Visualização em grade'}
          >
            <i className={viewMode === 'grid' ? 'ri-list-check' : 'ri-grid-line'}></i>
          </button>
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="px-4 py-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer flex items-center gap-2"
          >
            <i className="ri-folder-add-line"></i>
            <span>Nova Pasta</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2"
          >
            <i className="ri-upload-line"></i>
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            <button
              onClick={() => voltarPasta(index)}
              className={`text-sm transition-smooth cursor-pointer ${
                index === breadcrumbs.length - 1
                  ? 'text-white font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {crumb.nome}
            </button>
            {index < breadcrumbs.length - 1 && (
              <i className="ri-arrow-right-s-line text-gray-500"></i>
            )}
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="mb-4">
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Buscar arquivos e pastas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
          />
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
        </div>
      ) : anexosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <i className="ri-folder-open-line text-6xl text-gray-600 mb-4"></i>
          <p className="text-gray-400 mb-2">
            {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum arquivo ou pasta ainda'}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            {searchTerm ? 'Tente buscar com outros termos' : 'Comece criando uma pasta ou fazendo upload de arquivos'}
          </p>
          {!searchTerm && (
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="px-4 py-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
              >
                Criar Pasta
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
              >
                Fazer Upload
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
          {/* Pastas */}
          {pastas.map((pasta) => (
            <div
              key={pasta.id}
              className={`bg-dark-bg border border-dark-border rounded-lg p-4 hover:border-primary-teal transition-smooth cursor-pointer group ${
                viewMode === 'list' ? 'flex items-center gap-4' : ''
              }`}
              onClick={() => entrarNaPasta(pasta.id, pasta.nome)}
            >
              <div className={`flex items-center gap-3 ${viewMode === 'list' ? 'flex-1' : 'flex-col'}`}>
                <div className="w-12 h-12 rounded-lg bg-primary-teal/20 flex items-center justify-center text-primary-teal text-2xl">
                  <i className="ri-folder-line"></i>
                </div>
                <div className={`flex-1 ${viewMode === 'list' ? '' : 'text-center'}`}>
                  <h3 className="text-white font-medium text-sm truncate">{pasta.nome}</h3>
                  <p className="text-xs text-gray-500 mt-1">Pasta</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirModalEditar(pasta);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-primary-teal hover:text-primary-brown transition-opacity cursor-pointer"
                    title="Editar pasta"
                  >
                    <i className="ri-edit-line"></i>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletarItem(pasta);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity cursor-pointer"
                    title="Deletar pasta"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Arquivos */}
          {arquivos.map((arquivo) => {
            const ehImagem = isArquivoImagem(arquivo) && arquivo.arquivo_url;
            return (
              <div
                key={arquivo.id}
                onClick={() => arquivo.arquivo_url && setPreviewArquivo(arquivo)}
                className={`bg-dark-bg border border-dark-border rounded-lg hover:border-primary-teal transition-smooth group cursor-pointer overflow-hidden ${
                  viewMode === 'list' 
                    ? 'flex items-center gap-4 p-2' 
                    : ehImagem 
                      ? 'flex flex-col p-0' 
                      : 'p-3'
                }`}
              >
                {viewMode === 'list' ? (
                  /* Layout lista */
                  <>
                    <div className="relative w-12 h-12 rounded-lg bg-primary-teal/20 overflow-hidden flex-shrink-0">
                      {ehImagem ? (
                        <img src={arquivo.arquivo_url!} alt={arquivo.nome} className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; e.currentTarget.parentElement?.querySelector('.thumb-fallback')?.classList.remove('hidden'); }} />
                      ) : null}
                      <span className={`thumb-fallback absolute inset-0 flex items-center justify-center ${ehImagem ? 'hidden' : ''}`}>
                        <i className={`${getIconeArquivo(arquivo.arquivo_extensao)} text-primary-teal text-xl`}></i>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-sm truncate">{arquivo.nome}</h3>
                      <p className="text-xs text-gray-500">{arquivo.arquivo_tamanho ? formatarTamanho(arquivo.arquivo_tamanho) : '—'}</p>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {arquivo.arquivo_url && <a href={arquivo.arquivo_url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 text-primary-teal hover:text-primary-brown transition-opacity" title="Abrir em nova aba"><i className="ri-external-link-line"></i></a>}
                      <button onClick={(e) => { e.stopPropagation(); abrirModalEditar(arquivo); }} className="opacity-0 group-hover:opacity-100 text-primary-teal hover:text-primary-brown transition-opacity" title="Editar"><i className="ri-edit-line"></i></button>
                      <button onClick={(e) => { e.stopPropagation(); deletarItem(arquivo); }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity" title="Deletar"><i className="ri-delete-bin-line"></i></button>
                    </div>
                  </>
                ) : ehImagem ? (
                  /* Layout grade - imagem em destaque */
                  <>
                    <div className="relative aspect-[4/3] w-full min-h-[100px] bg-dark-border overflow-hidden">
                      <img
                        src={arquivo.arquivo_url!}
                        alt={arquivo.nome}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement?.querySelector('.thumb-fallback')?.classList.remove('hidden');
                        }}
                      />
                      <span className={`thumb-fallback absolute inset-0 flex items-center justify-center bg-primary-teal/20 hidden`}>
                        <i className={`${getIconeArquivo(arquivo.arquivo_extensao)} text-primary-teal text-3xl`}></i>
                      </span>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex items-center justify-between">
                        <h3 className="text-white font-medium text-xs truncate flex-1 mr-2">{arquivo.nome}</h3>
                        <span className="text-gray-300 text-xs flex-shrink-0">{arquivo.arquivo_tamanho ? formatarTamanho(arquivo.arquivo_tamanho) : ''}</span>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        {arquivo.arquivo_url && <a href={arquivo.arquivo_url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-black/60 rounded text-primary-teal hover:bg-black/80" title="Abrir"><i className="ri-external-link-line text-sm"></i></a>}
                        <button onClick={(e) => { e.stopPropagation(); abrirModalEditar(arquivo); }} className="p-1.5 bg-black/60 rounded text-primary-teal hover:bg-black/80" title="Editar"><i className="ri-edit-line text-sm"></i></button>
                        <button onClick={(e) => { e.stopPropagation(); deletarItem(arquivo); }} className="p-1.5 bg-black/60 rounded text-red-400 hover:bg-black/80" title="Deletar"><i className="ri-delete-bin-line text-sm"></i></button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Layout grade - arquivo não-imagem */
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg bg-primary-teal/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <i className={`${getIconeArquivo(arquivo.arquivo_extensao)} text-primary-teal text-2xl`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-sm truncate">{arquivo.nome}</h3>
                      <p className="text-xs text-gray-500">{arquivo.arquivo_tamanho ? formatarTamanho(arquivo.arquivo_tamanho) : '—'}</p>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {arquivo.arquivo_url && <a href={arquivo.arquivo_url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 text-primary-teal" title="Abrir"><i className="ri-external-link-line"></i></a>}
                      <button onClick={(e) => { e.stopPropagation(); abrirModalEditar(arquivo); }} className="opacity-0 group-hover:opacity-100 text-primary-teal" title="Editar"><i className="ri-edit-line"></i></button>
                      <button onClick={(e) => { e.stopPropagation(); deletarItem(arquivo); }} className="opacity-0 group-hover:opacity-100 text-red-400" title="Deletar"><i className="ri-delete-bin-line"></i></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Preview do Arquivo */}
      {previewArquivo && previewArquivo.arquivo_url && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewArquivo(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium truncate flex-1 mr-4">{previewArquivo.nome}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewArquivo.arquivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-primary-teal hover:bg-primary-brown text-white rounded-lg transition-smooth cursor-pointer flex items-center gap-2 text-sm"
                >
                  <i className="ri-external-link-line"></i>
                  Abrir em nova aba
                </a>
                <button
                  onClick={() => setPreviewArquivo(null)}
                  className="p-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
                  title="Fechar"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-dark-bg rounded-xl p-4 flex items-center justify-center min-h-[400px]">
              {isArquivoImagem(previewArquivo) ? (
                <img
                  src={previewArquivo.arquivo_url}
                  alt={previewArquivo.nome}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              ) : isArquivoPdf(previewArquivo) ? (
                <iframe
                  src={previewArquivo.arquivo_url}
                  title={previewArquivo.nome}
                  className="w-full h-[80vh] rounded-lg border-0"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <i className="ri-file-line text-6xl mb-4"></i>
                  <p className="mb-4">Pré-visualização não disponível para este tipo de arquivo</p>
                  <a
                    href={previewArquivo.arquivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-teal hover:text-primary-brown"
                  >
                    Abrir arquivo em nova aba
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Pasta */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Nova Pasta</h3>
              <button
                onClick={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName('');
                }}
                className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nome da Pasta</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && criarPasta()}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  placeholder="Digite o nome da pasta"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateFolderModal(false);
                    setNewFolderName('');
                  }}
                  className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={criarPasta}
                  className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Pasta */}
      {showEditFolderModal && editingFolder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Editar Pasta</h3>
              <button
                onClick={() => {
                  setShowEditFolderModal(false);
                  setEditingFolder(null);
                  setEditFolderName('');
                }}
                className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nome da Pasta</label>
                <input
                  type="text"
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && editarPasta()}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  placeholder="Digite o nome da pasta"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditFolderModal(false);
                    setEditingFolder(null);
                    setEditFolderName('');
                  }}
                  className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={editarPasta}
                  className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Arquivo */}
      {showEditFileModal && editingFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Editar Arquivo</h3>
              <button
                onClick={() => {
                  setShowEditFileModal(false);
                  setEditingFile(null);
                  setEditFileName('');
                  setEditFileReplacement(null);
                }}
                className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nome do Arquivo</label>
                <input
                  type="text"
                  value={editFileName}
                  onChange={(e) => setEditFileName(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  placeholder="Digite o nome do arquivo"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Substituir Arquivo (opcional)
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setEditFileReplacement(file || null);
                  }}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-teal file:text-white hover:file:bg-primary-brown cursor-pointer"
                />
                {editFileReplacement && (
                  <div className="mt-2 p-3 bg-primary-teal/10 border border-primary-teal/30 rounded-lg">
                    <p className="text-sm text-primary-teal">
                      <i className="ri-file-line mr-2"></i>
                      Novo arquivo: {editFileReplacement.name} ({(editFileReplacement.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}
                {editingFile.arquivo_tamanho && !editFileReplacement && (
                  <p className="mt-2 text-xs text-gray-500">
                    Arquivo atual: {formatarTamanho(editingFile.arquivo_tamanho)}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditFileModal(false);
                    setEditingFile(null);
                    setEditFileName('');
                    setEditFileReplacement(null);
                  }}
                  disabled={replacingFile}
                  className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={editarArquivo}
                  disabled={replacingFile || !editFileName.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {replacingFile ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line"></i>
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Fazer Upload</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles([]);
                }}
                className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Selecionar Arquivos</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSelectedFiles(files);
                  }}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-teal file:text-white hover:file:bg-primary-brown cursor-pointer"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="text-sm text-gray-400 flex items-center justify-between">
                        <span className="truncate">{file.name}</span>
                        <span className="text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFiles([]);
                  }}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={fazerUpload}
                  disabled={uploading || selectedFiles.length === 0}
                  className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <i className="ri-upload-line"></i>
                      Enviar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
