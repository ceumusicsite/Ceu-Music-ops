import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { storageService, R2_BUCKETS } from '../../services/storage';
import { getSignedUrlR2 } from '../../lib/r2';
import { getBrowserViewableUrl } from '../../utils/storageUrl';
import { useToast } from '../../contexts/ToastContext';

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const progressByFileRef = useRef<number[]>([]);
  const toast = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabelaNaoExiste, setTabelaNaoExiste] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [previewArquivo, setPreviewArquivo] = useState<Anexo | null>(null);
  // Clipboard para copiar/cortar/colar
  const [clipboard, setClipboard] = useState<{ items: Anexo[]; action: 'copy' | 'cut' } | null>(null);
  // Menu de contexto (clique direito)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: Anexo | null; targetFolderId: string | null } | null>(null);
  // Drag and drop
  const [dragState, setDragState] = useState<{ item: Anexo; dragOverFolderId: string | null; dragOverArea: boolean } | null>(null);
  const [colando, setColando] = useState(false);
  const justDraggedRef = useRef(false);

  useEffect(() => {
    loadAnexos();
  }, [artistaId, pastaAtual]);

  // Resetar breadcrumbs quando mudar de artista
  useEffect(() => {
    setPastaAtual(null);
    setBreadcrumbs([{ id: null, nome: 'Raiz' }]);
  }, [artistaId]);

  // Atalhos de teclado: Ctrl+V colar na pasta atual
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        if (clipboard) colarItem(pastaAtual);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clipboard, pastaAtual]);

  // Fechar menu de contexto ao clicar fora
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [contextMenu]);

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

  // Função para gerar nova URL assinada quando necessário
  const getValidUrl = async (anexo: Anexo): Promise<string> => {
    // Se temos arquivo_key, gerar nova URL assinada
    if (anexo.arquivo_key) {
      try {
        const novaUrl = await getSignedUrlR2(
          R2_BUCKETS.ANEXOS,
          anexo.arquivo_key,
          86400 // URL válida por 24 horas
        );
        
        // Atualizar a URL no banco de dados (opcional, mas útil para cache)
        try {
          await supabase
            .from('artistas_anexos')
            .update({ arquivo_url: novaUrl })
            .eq('id', anexo.id);
        } catch (updateError) {
          // Não é crítico se a atualização falhar
          console.warn('Erro ao atualizar URL no banco:', updateError);
        }
        
        return novaUrl;
      } catch (error: any) {
        console.error('Erro ao gerar nova URL assinada:', error);
        // Se falhar, tentar usar a URL existente (pode estar expirada)
        if (anexo.arquivo_url) {
          return anexo.arquivo_url;
        }
        throw error;
      }
    }
    
    // Se não temos key, usar a URL existente
    if (anexo.arquivo_url) {
      return anexo.arquivo_url;
    }
    
    throw new Error('Arquivo não possui URL ou key válida');
  };

  // Handler para abrir arquivo com URL renovada
  // Usa URL pública (r2.dev) quando disponível, pois o endpoint r2.cloudflarestorage.com
  // causa ERR_SSL_VERSION_OR_CIPHER_MISMATCH em navegadores
  const handleOpenFile = async (anexo: Anexo, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    try {
      const url = await getValidUrl(anexo);
      const urlBrowser = getBrowserViewableUrl(url, R2_BUCKETS.ANEXOS, anexo.arquivo_key);
      window.open(urlBrowser, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      console.error('Erro ao abrir arquivo:', error);
      alert(`Erro ao abrir arquivo: ${error.message || 'Não foi possível gerar URL válida'}`);
    }
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
      toast.warning('Selecione pelo menos um arquivo');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      progressByFileRef.current = selectedFiles.map(() => 0);

      const pastaNormalizada = normalizeNome(artistaNome);
      let pastaPath = pastaNormalizada;
      if (pastaAtual) {
        const caminhoCompleto = await getCaminhoPastaCompleto(pastaAtual);
        pastaPath = caminhoCompleto;
      }

      const updateOverallProgress = (index: number, percent: number) => {
        progressByFileRef.current[index] = percent;
        const total = progressByFileRef.current.reduce((a, b) => a + b, 0);
        const avg = Math.round(total / progressByFileRef.current.length);
        setUploadProgress(avg);
      };

      const uploads = selectedFiles.map(async (file, index) => {
        const result = await storageService.upload(file, {
          bucket: R2_BUCKETS.ANEXOS,
          folder: `artistas/${pastaPath}`,
          makePublic: false,
          onProgress: (percent) => updateOverallProgress(index, percent),
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
      toast.success('Arquivos enviados com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error(`Erro ao fazer upload: ${error.message || 'Tente novamente'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
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

  // Verifica se destPastaId é o próprio item ou está dentro dele (evitar ciclo)
  const ehDescendenteOuProprio = useCallback(async (itemId: string, destPastaId: string | null): Promise<boolean> => {
    if (!destPastaId || destPastaId === itemId) return true;
    let currentId: string | null = destPastaId;
    while (currentId) {
      if (currentId === itemId) return true;
      const { data } = await supabase
        .from('artistas_anexos')
        .select('pasta_pai_id')
        .eq('id', currentId)
        .single();
      currentId = data?.pasta_pai_id ?? null;
    }
    return false;
  }, []);

  const copiarItem = (item: Anexo) => {
    setClipboard({ items: [item], action: 'copy' });
    setContextMenu(null);
  };

  const cortarItem = (item: Anexo) => {
    setClipboard({ items: [item], action: 'cut' });
    setContextMenu(null);
  };

  const obterProximaOrdem = async (pastaPaiId: string | null): Promise<number> => {
    let query = supabase
      .from('artistas_anexos')
      .select('ordem')
      .eq('artista_id', artistaId);
    if (pastaPaiId === null) {
      query = query.is('pasta_pai_id', null);
    } else {
      query = query.eq('pasta_pai_id', pastaPaiId);
    }
    const { data } = await query.order('ordem', { ascending: false }).limit(1).maybeSingle();
    return (data?.ordem ?? -1) + 1;
  };

  const duplicarArquivo = async (anexo: Anexo, destPastaId: string | null): Promise<Anexo | null> => {
    if (!anexo.arquivo_key) return null;
    try {
      const url = await getSignedUrlR2(R2_BUCKETS.ANEXOS, anexo.arquivo_key, 3600);
      const res = await fetch(url);
      const blob = await res.blob();
      const baseName = anexo.nome.replace(/\.[^/.]+$/, '') || anexo.nome;
      const ext = anexo.arquivo_extensao || anexo.nome.split('.').pop() || '';
      const nomeCopia = `${baseName} (cópia)${ext ? '.' + ext : ''}`;
      const file = new File([blob], nomeCopia, { type: anexo.arquivo_tipo || blob.type });
      const pastaPath = destPastaId
        ? await getCaminhoPastaCompleto(destPastaId)
        : normalizeNome(artistaNome);
      const result = await storageService.upload(file, {
        bucket: R2_BUCKETS.ANEXOS,
        folder: `artistas/${pastaPath}`,
        makePublic: false,
      });
      const ordem = await obterProximaOrdem(destPastaId);
      const { data: newRow, error } = await supabase
        .from('artistas_anexos')
        .insert({
          artista_id: artistaId,
          tipo: 'arquivo',
          nome: nomeCopia,
          pasta_pai_id: destPastaId,
          arquivo_key: result.key,
          arquivo_url: result.url,
          arquivo_tamanho: anexo.arquivo_tamanho,
          arquivo_tipo: anexo.arquivo_tipo,
          arquivo_extensao: anexo.arquivo_extensao,
          ordem,
        })
        .select()
        .single();
      if (error) throw error;
      return newRow;
    } catch (e) {
      console.error('Erro ao duplicar arquivo:', e);
      throw e;
    }
  };

  const duplicarPasta = async (anexo: Anexo, destPastaId: string | null): Promise<Anexo | null> => {
    const ordem = await obterProximaOrdem(destPastaId);
    const { data: novaPasta, error: errPasta } = await supabase
      .from('artistas_anexos')
      .insert({
        artista_id: artistaId,
        tipo: 'pasta',
        nome: `${anexo.nome} (cópia)`,
        pasta_pai_id: destPastaId,
        ordem,
      })
      .select()
      .single();
    if (errPasta || !novaPasta) throw errPasta || new Error('Falha ao criar pasta');
    const { data: filhos } = await supabase
      .from('artistas_anexos')
      .select('*')
      .eq('pasta_pai_id', anexo.id)
      .order('ordem', { ascending: true });
    for (const filho of filhos || []) {
      if (filho.tipo === 'arquivo') {
        await duplicarArquivo(filho, novaPasta.id);
      } else {
        await duplicarPasta(filho, novaPasta.id);
      }
    }
    return novaPasta;
  };

  const colarItem = async (destPastaId: string | null) => {
    if (!clipboard || clipboard.items.length === 0) return;
    setColando(true);
    setContextMenu(null);
    try {
      for (const item of clipboard.items) {
        const seriaCiclo = item.tipo === 'pasta' && (await ehDescendenteOuProprio(item.id, destPastaId));
        if (seriaCiclo) {
          alert(`Não é possível colar "${item.nome}" dentro de si mesma.`);
          continue;
        }
        if (clipboard.action === 'cut') {
          const ordem = await obterProximaOrdem(destPastaId);
          await supabase
            .from('artistas_anexos')
            .update({ pasta_pai_id: destPastaId, ordem })
            .eq('id', item.id);
        } else {
          if (item.tipo === 'arquivo') {
            await duplicarArquivo(item, destPastaId);
          } else {
            await duplicarPasta(item, destPastaId);
          }
        }
      }
      if (clipboard.action === 'cut') setClipboard(null);
      loadAnexos();
    } catch (e: any) {
      console.error('Erro ao colar:', e);
      alert(`Erro ao colar: ${e.message || 'Tente novamente'}`);
    } finally {
      setColando(false);
    }
  };

  const moverItemParaPasta = async (item: Anexo, destPastaId: string | null) => {
    if (item.pasta_pai_id === destPastaId) return;
    const seriaCiclo = item.tipo === 'pasta' && (await ehDescendenteOuProprio(item.id, destPastaId));
    if (seriaCiclo) {
      alert('Não é possível mover uma pasta para dentro de si mesma.');
      return;
    }
    try {
      const ordem = await obterProximaOrdem(destPastaId);
      await supabase
        .from('artistas_anexos')
        .update({ pasta_pai_id: destPastaId, ordem })
        .eq('id', item.id);
      loadAnexos();
    } catch (e: any) {
      console.error('Erro ao mover:', e);
      alert(`Erro ao mover: ${e.message || 'Tente novamente'}`);
    }
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
        const result = await storageService.upload(editFileReplacement, {
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
      toast.success('Arquivo atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao editar arquivo:', error);
      toast.error(`Erro ao editar arquivo: ${error.message || 'Tente novamente'}`);
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

  const isArquivoAudio = (arquivo: Anexo): boolean => {
    const ext = arquivo.arquivo_extensao?.toLowerCase() || '';
    const tipo = arquivo.arquivo_tipo?.toLowerCase() || '';
    return ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(ext) ||
      tipo.startsWith('audio/');
  };

  const isArquivoVideo = (arquivo: Anexo): boolean => {
    const ext = arquivo.arquivo_extensao?.toLowerCase() || '';
    const tipo = arquivo.arquivo_tipo?.toLowerCase() || '';
    return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv'].includes(ext) ||
      tipo.startsWith('video/');
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
    <div className="bg-dark-card border border-dark-border rounded-xl p-6 relative">
      {/* Menu de contexto (clique direito) - use React Portal para ficar por cima de tudo */}
      {contextMenu && (
        <div
          role="menu"
          className="fixed z-[9999] min-w-[200px] py-1 bg-dark-card border border-dark-border rounded-lg shadow-2xl"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 220), top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item && (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => { contextMenu.item && copiarItem(contextMenu.item); setContextMenu(null); }}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-dark-hover flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-file-copy-line"></i>
                Copiar
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => { contextMenu.item && cortarItem(contextMenu.item); setContextMenu(null); }}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-dark-hover flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-scissors-line"></i>
                Cortar
              </button>
              <div className="border-t border-dark-border my-1"></div>
              <button
                type="button"
                role="menuitem"
                onClick={() => { contextMenu.item && abrirModalEditar(contextMenu.item); setContextMenu(null); }}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-dark-hover flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-edit-line"></i>
                Renomear
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => { contextMenu.item && deletarItem(contextMenu.item); setContextMenu(null); }}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-dark-hover flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-delete-bin-line"></i>
                Excluir
              </button>
              <div className="border-t border-dark-border my-1"></div>
            </>
          )}
          {contextMenu.targetFolderId != null && contextMenu.targetFolderId !== '' && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { colarItem(contextMenu.targetFolderId); setContextMenu(null); }}
              disabled={!clipboard || colando}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-dark-hover flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <i className="ri-file-copy-line"></i>
              Colar nesta pasta
            </button>
          )}
          {!contextMenu.item && contextMenu.targetFolderId === null && clipboard && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { colarItem(pastaAtual); setContextMenu(null); }}
              disabled={colando}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-dark-hover flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <i className="ri-file-copy-line"></i>
              Colar aqui
            </button>
          )}
        </div>
      )}

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
          {clipboard && (
            <span className="text-xs text-gray-400 mr-1">
              {clipboard.action === 'cut' ? '1 item para mover' : '1 item copiado'}
            </span>
          )}
          <button
            onClick={() => clipboard && colarItem(pastaAtual)}
            disabled={!clipboard || colando}
            className="px-4 py-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Colar aqui (Ctrl+V)"
          >
            {colando ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-file-copy-line"></i>}
            <span>Colar</span>
          </button>
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
        <div
          className={`${viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'} rounded-lg min-h-[120px] transition-colors ${
            dragState?.dragOverArea ? 'bg-primary-teal/10 border-2 border-dashed border-primary-teal' : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            if (dragState) setDragState(s => s ? { ...s, dragOverFolderId: null, dragOverArea: true } : null);
          }}
          onDragLeave={(e) => {
            const related = e.relatedTarget as Node | null;
            if (!related || !e.currentTarget.contains(related)) {
              setDragState(s => s ? { ...s, dragOverArea: false } : null);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = e.dataTransfer.getData('text/plain');
            const item = anexos.find(a => a.id === id);
            if (item) moverItemParaPasta(item, pastaAtual);
            setDragState(null);
          }}
          onContextMenu={(e) => {
            if ((e.target as HTMLElement).closest('[data-file-manager-item]')) return;
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, item: null, targetFolderId: null });
          }}
        >
          {/* Pastas */}
          {pastas.map((pasta) => (
            <div
              key={pasta.id}
              data-file-manager-item
              draggable
              onDragStart={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('[data-drag-handle]')) return;
                justDraggedRef.current = true;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', pasta.id);
                e.dataTransfer.setData('application/json', JSON.stringify({ id: pasta.id, tipo: pasta.tipo }));
                setDragState({ item: pasta, dragOverFolderId: null, dragOverArea: false });
              }}
              onDragEnd={() => {
                setDragState(null);
                setTimeout(() => { justDraggedRef.current = false; }, 0);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                if (dragState && dragState.item.id !== pasta.id) {
                  setDragState(s => s ? { ...s, dragOverFolderId: pasta.id, dragOverArea: false } : null);
                }
              }}
              onDragLeave={() => setDragState(s => s ? { ...s, dragOverFolderId: s.dragOverFolderId === pasta.id ? null : s.dragOverFolderId } : null)}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = e.dataTransfer.getData('text/plain');
                const item = anexos.find(a => a.id === id);
                if (item && item.id !== pasta.id) moverItemParaPasta(item, pasta.id);
                setDragState(null);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({ x: e.clientX, y: e.clientY, item: pasta, targetFolderId: pasta.id });
              }}
              className={`bg-dark-bg border rounded-lg p-4 hover:border-primary-teal transition-smooth cursor-pointer group select-none ${
                viewMode === 'list' ? 'flex items-center gap-4' : ''
              } ${
                dragState?.dragOverFolderId === pasta.id
                  ? 'border-primary-teal border-2 bg-primary-teal/10'
                  : 'border-dark-border'
              }`}
              onClick={() => {
                if (justDraggedRef.current) return;
                entrarNaPasta(pasta.id, pasta.nome);
              }}
            >
              <div className={`flex items-center gap-3 ${viewMode === 'list' ? 'flex-1' : 'flex-col'}`}>
                <div className="w-12 h-12 rounded-lg bg-primary-teal/20 flex items-center justify-center text-primary-teal text-2xl flex-shrink-0">
                  <i className="ri-folder-line"></i>
                </div>
                <div className={`flex-1 ${viewMode === 'list' ? '' : 'text-center'} min-w-0`}>
                  <h3 className="text-white font-medium text-sm truncate">{pasta.nome}</h3>
                  <p className="text-xs text-gray-500 mt-1">Pasta</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    data-drag-handle
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      justDraggedRef.current = true;
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', pasta.id);
                      e.dataTransfer.setData('application/json', JSON.stringify({ id: pasta.id, tipo: pasta.tipo }));
                      setDragState({ item: pasta, dragOverFolderId: null, dragOverArea: false });
                    }}
                    onDragEnd={() => {
                      setDragState(null);
                      setTimeout(() => { justDraggedRef.current = false; }, 0);
                    }}
                    className="cursor-grab active:cursor-grabbing p-1.5 rounded text-gray-400 hover:text-primary-teal hover:bg-dark-border/50 select-none touch-none min-w-[28px] min-h-[28px] flex items-center justify-center"
                    title="Arrastar para mover"
                    onClick={(e) => e.stopPropagation()}
                    role="button"
                    tabIndex={0}
                  >
                    <i className="ri-draggable pointer-events-none" aria-hidden></i>
                  </div>
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
                data-file-manager-item
                draggable
                onDragStart={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-drag-handle]')) return;
                  justDraggedRef.current = true;
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', arquivo.id);
                  e.dataTransfer.setData('application/json', JSON.stringify({ id: arquivo.id, tipo: arquivo.tipo }));
                  setDragState({ item: arquivo, dragOverFolderId: null, dragOverArea: false });
                }}
                onDragEnd={() => {
                  setDragState(null);
                  setTimeout(() => { justDraggedRef.current = false; }, 0);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({ x: e.clientX, y: e.clientY, item: arquivo, targetFolderId: null });
                }}
                onClick={async () => {
                  if (justDraggedRef.current) return;
                  if (arquivo.arquivo_url) {
                    try {
                      const url = await getValidUrl(arquivo);
                      setPreviewArquivo({ ...arquivo, arquivo_url: url });
                    } catch (error) {
                      setPreviewArquivo(arquivo);
                    }
                  }
                }}
                className={`bg-dark-bg border border-dark-border rounded-lg hover:border-primary-teal transition-smooth group cursor-pointer overflow-hidden select-none ${
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
                        <img draggable={false} src={arquivo.arquivo_url!} alt={arquivo.nome} className="absolute inset-0 w-full h-full object-cover pointer-events-none" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; e.currentTarget.parentElement?.querySelector('.thumb-fallback')?.classList.remove('hidden'); }} />
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
                      <div
                        data-drag-handle
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          justDraggedRef.current = true;
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', arquivo.id);
                          e.dataTransfer.setData('application/json', JSON.stringify({ id: arquivo.id, tipo: arquivo.tipo }));
                          setDragState({ item: arquivo, dragOverFolderId: null, dragOverArea: false });
                        }}
                        onDragEnd={() => {
                          setDragState(null);
                          setTimeout(() => { justDraggedRef.current = false; }, 0);
                        }}
                        className="cursor-grab active:cursor-grabbing p-1.5 rounded text-gray-400 hover:text-primary-teal select-none touch-none min-w-[28px] min-h-[28px] flex items-center justify-center shrink-0"
                        title="Arrastar para mover"
                        onClick={(e) => e.stopPropagation()}
                        role="button"
                      >
                        <i className="ri-draggable pointer-events-none" aria-hidden></i>
                      </div>
                      {arquivo.arquivo_url && <button onClick={(e) => handleOpenFile(arquivo, e)} className="opacity-0 group-hover:opacity-100 text-primary-teal hover:text-primary-brown transition-opacity cursor-pointer" title="Abrir em nova aba"><i className="ri-external-link-line"></i></button>}
                      <button onClick={(e) => { e.stopPropagation(); abrirModalEditar(arquivo); }} className="text-primary-teal hover:text-primary-brown transition-opacity" title="Editar"><i className="ri-edit-line"></i></button>
                      <button onClick={(e) => { e.stopPropagation(); deletarItem(arquivo); }} className="text-red-400 hover:text-red-300 transition-opacity" title="Deletar"><i className="ri-delete-bin-line"></i></button>
                    </div>
                  </>
                ) : ehImagem ? (
                  /* Layout grade - imagem em destaque */
                  <>
                    <div className="relative aspect-[4/3] w-full min-h-[100px] bg-dark-border overflow-hidden">
                      <img
                        draggable={false}
                        src={arquivo.arquivo_url!}
                        alt={arquivo.nome}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
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
                      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <div
                          data-drag-handle
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            justDraggedRef.current = true;
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', arquivo.id);
                            e.dataTransfer.setData('application/json', JSON.stringify({ id: arquivo.id, tipo: arquivo.tipo }));
                            setDragState({ item: arquivo, dragOverFolderId: null, dragOverArea: false });
                          }}
                          onDragEnd={() => {
                            setDragState(null);
                            setTimeout(() => { justDraggedRef.current = false; }, 0);
                          }}
                          className="p-1.5 bg-black/60 rounded text-gray-300 hover:text-primary-teal hover:bg-black/80 cursor-grab active:cursor-grabbing select-none touch-none min-w-[28px] min-h-[28px] inline-flex items-center justify-center"
                          title="Arrastar para mover"
                          onClick={(e) => e.stopPropagation()}
                          role="button"
                        >
                          <i className="ri-draggable text-sm pointer-events-none" aria-hidden></i>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        {arquivo.arquivo_url && <button onClick={(e) => handleOpenFile(arquivo, e)} className="p-1.5 bg-black/60 rounded text-primary-teal hover:bg-black/80 cursor-pointer" title="Abrir"><i className="ri-external-link-line text-sm"></i></button>}
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
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <div
                        data-drag-handle
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          justDraggedRef.current = true;
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', arquivo.id);
                          e.dataTransfer.setData('application/json', JSON.stringify({ id: arquivo.id, tipo: arquivo.tipo }));
                          setDragState({ item: arquivo, dragOverFolderId: null, dragOverArea: false });
                        }}
                        onDragEnd={() => {
                          setDragState(null);
                          setTimeout(() => { justDraggedRef.current = false; }, 0);
                        }}
                        className="cursor-grab active:cursor-grabbing p-1.5 rounded text-gray-400 hover:text-primary-teal select-none touch-none min-w-[28px] min-h-[28px] flex items-center justify-center shrink-0"
                        title="Arrastar para mover"
                        onClick={(e) => e.stopPropagation()}
                        role="button"
                      >
                        <i className="ri-draggable pointer-events-none" aria-hidden></i>
                      </div>
                      {arquivo.arquivo_url && <button onClick={(e) => handleOpenFile(arquivo, e)} className="opacity-0 group-hover:opacity-100 text-primary-teal cursor-pointer" title="Abrir"><i className="ri-external-link-line"></i></button>}
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
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setPreviewArquivo(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            margin: 0,
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '56rem',
              maxHeight: '90vh',
              margin: '0 auto',
              position: 'relative'
            }}
          >
            <div className="flex items-center justify-between p-4 border-b border-dark-border flex-shrink-0">
              <h3 className="text-white font-medium truncate flex-1 mr-4">{previewArquivo.nome}</h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleOpenFile(previewArquivo)}
                  className="px-4 py-2 bg-primary-teal hover:bg-primary-brown text-white rounded-lg transition-smooth cursor-pointer flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  <i className="ri-external-link-line"></i>
                  Abrir em nova aba
                </button>
                <button
                  onClick={() => setPreviewArquivo(null)}
                  className="p-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer flex-shrink-0"
                  title="Fechar"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>
            <div 
              className="bg-dark-bg flex-1 overflow-auto"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 2rem',
                minHeight: '400px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {isArquivoImagem(previewArquivo) ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  <img
                    src={previewArquivo.arquivo_url || ''}
                    alt={previewArquivo.nome}
                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                    className="rounded-lg"
                    onError={async (e) => {
                      // Se a imagem falhar ao carregar, tentar gerar nova URL
                      try {
                        const novaUrl = await getValidUrl(previewArquivo);
                        (e.target as HTMLImageElement).src = novaUrl;
                      } catch (error) {
                        console.error('Erro ao recarregar imagem:', error);
                      }
                    }}
                  />
                </div>
              ) : isArquivoAudio(previewArquivo) ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '2rem' }}>
                  <div style={{ width: '100%', maxWidth: '600px' }}>
                    <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                      <i className="ri-music-line" style={{ fontSize: '4rem', color: '#14b8a6', display: 'block', marginBottom: '1rem' }}></i>
                      <p style={{ color: '#9ca3af', fontSize: '1rem', margin: 0 }}>{previewArquivo.nome}</p>
                    </div>
                    <audio
                      controls
                      style={{ width: '100%', outline: 'none' }}
                      onError={async () => {
                        // Se o áudio falhar ao carregar, tentar gerar nova URL
                        try {
                          const novaUrl = await getValidUrl(previewArquivo);
                          const audio = document.querySelector('audio') as HTMLAudioElement;
                          if (audio) {
                            audio.src = novaUrl;
                            audio.load();
                          }
                        } catch (error) {
                          console.error('Erro ao recarregar áudio:', error);
                        }
                      }}
                    >
                      <source src={previewArquivo.arquivo_url || ''} type={previewArquivo.arquivo_tipo || 'audio/mpeg'} />
                      Seu navegador não suporta o elemento de áudio.
                    </audio>
                  </div>
                </div>
              ) : isArquivoVideo(previewArquivo) ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: '2rem' }}>
                  <video
                    controls
                    style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '0.5rem' }}
                    onError={async () => {
                      // Se o vídeo falhar ao carregar, tentar gerar nova URL
                      try {
                        const novaUrl = await getValidUrl(previewArquivo);
                        const video = document.querySelector('video') as HTMLVideoElement;
                        if (video) {
                          video.src = novaUrl;
                          video.load();
                        }
                      } catch (error) {
                        console.error('Erro ao recarregar vídeo:', error);
                      }
                    }}
                  >
                    <source src={previewArquivo.arquivo_url || ''} type={previewArquivo.arquivo_tipo || 'video/mp4'} />
                    Seu navegador não suporta o elemento de vídeo.
                  </video>
                </div>
              ) : isArquivoPdf(previewArquivo) ? (
                <iframe
                  src={previewArquivo.arquivo_url || ''}
                  title={previewArquivo.nome}
                  style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '0.5rem' }}
                  onError={async () => {
                    // Se o iframe falhar, tentar gerar nova URL
                    try {
                      const novaUrl = await getValidUrl(previewArquivo);
                      const iframe = document.querySelector('iframe[title="' + previewArquivo.nome + '"]') as HTMLIFrameElement;
                      if (iframe) {
                        iframe.src = novaUrl;
                      }
                    } catch (error) {
                      console.error('Erro ao recarregar PDF:', error);
                    }
                  }}
                />
              ) : (
                <div 
                  className="w-full"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    width: '100%',
                    minHeight: '400px',
                    color: '#9ca3af',
                    padding: '2rem'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                    <i className="ri-file-line" style={{ fontSize: '4rem', display: 'block', lineHeight: '1' }}></i>
                    <p style={{ fontSize: '1.125rem', margin: 0, lineHeight: '1.5' }}>
                      Pré-visualização não disponível para este tipo de arquivo
                    </p>
                    <button
                      onClick={() => handleOpenFile(previewArquivo)}
                      className="px-6 py-3 bg-primary-teal hover:bg-primary-brown text-white rounded-lg transition-smooth cursor-pointer"
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem'
                      }}
                    >
                      <i className="ri-external-link-line"></i>
                      Abrir arquivo em nova aba
                    </button>
                  </div>
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
              {uploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Progresso</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-dark-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-teal transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
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
