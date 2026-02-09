import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { storageService, R2_BUCKETS } from '../../services/storage';
import { getSignedUrlR2, uploadToR2 } from '../../lib/r2';
import { useToast } from '../../contexts/ToastContext';
import { getBrowserViewableUrl } from '../../utils/storageUrl';
import StreamPreview from '../projetos/StreamPreview';
import { createStreamVideoFromUrl, getStreamIframeUrl } from '../../services/stream';

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
  stream_uid?: string;
  stream_iframe_url?: string;
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
  const downloadBlobRef = useRef<Blob | null>(null);
  const downloadMimeRef = useRef<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabelaNaoExiste, setTabelaNaoExiste] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [previewArquivo, setPreviewArquivo] = useState<Anexo | null>(null);
  const [streamPlaybackLoading, setStreamPlaybackLoading] = useState(false);
  const [streamPlaybackError, setStreamPlaybackError] = useState<string | null>(null);
  const [streamProcessing, setStreamProcessing] = useState(false);
  // Clipboard para copiar/cortar/colar
  const [clipboard, setClipboard] = useState<{ items: Anexo[]; action: 'copy' | 'cut' } | null>(null);
  // Menu de contexto (clique direito)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: Anexo | null; targetFolderId: string | null } | null>(null);
  // Drag and drop
  const [dragState, setDragState] = useState<{ item: Anexo; dragOverFolderId: string | null; dragOverArea: boolean } | null>(null);
  const [colando, setColando] = useState(false);
  // Menu de ações (três pontinhos) para mobile/touch
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [openActionMenuAnchor, setOpenActionMenuAnchor] = useState<DOMRect | null>(null);
  const [openActionMenuArquivo, setOpenActionMenuArquivo] = useState<Anexo | null>(null);
  const [openActionMenuPasta, setOpenActionMenuPasta] = useState<Anexo | null>(null);
  // Modo Organizar (mobile): ativado pelo botão "Organizar"; toque seleciona item, toque no destino move
  const [modoOrganizar, setModoOrganizar] = useState(false);
  const [itemSelecionadoParaMover, setItemSelecionadoParaMover] = useState<Anexo | null>(null);
  // URLs renovadas para miniaturas de vídeo (evita thumbnail quebrado por URL expirada)
  const [videoThumbUrls, setVideoThumbUrls] = useState<Record<string, string>>({});
  // Modal de download (estilo Google Drive: mostra "Fazendo download" + progresso, depois salvar no iPhone)
  const [downloadModal, setDownloadModal] = useState<{
    show: boolean;
    progress: number;
    indeterminate: boolean;
    receivedBytes: number;
    totalBytes: number;
    fileName: string;
    status: 'loading' | 'done' | 'error';
    directUrl?: string;
    errorMessage?: string;
  }>({ show: false, progress: 0, indeterminate: false, receivedBytes: 0, totalBytes: 0, fileName: '', status: 'loading', directUrl: undefined });

  // Modal/fluxo "Drive-like" só em tela pequena (mobile). Em desktop/web: download direto e imediato.
  const shouldUseMobileDownloadFlow =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 768px)').matches;

  const isIOSDevice =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1));

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
  };

  useEffect(() => {
    loadAnexos();
  }, [artistaId, pastaAtual]);

  const requestedVideoIdsRef = useRef<Set<string>>(new Set());

  // Limpar URLs de vídeo ao mudar pasta/artista
  useEffect(() => {
    setVideoThumbUrls({});
    requestedVideoIdsRef.current = new Set();
  }, [artistaId, pastaAtual]);

  // Fechar menu de ações ao clicar fora
  useEffect(() => {
    if (!openActionMenuId) return;
    const close = () => {
      setOpenActionMenuId(null);
      setOpenActionMenuAnchor(null);
      setOpenActionMenuArquivo(null);
      setOpenActionMenuPasta(null);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openActionMenuId]);

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
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Não fechar se clicar dentro do menu
      if (target.closest('[role="menu"]')) return;
      setContextMenu(null);
    };
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('contextmenu', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('contextmenu', close);
    };
  }, [contextMenu]);

  // Criar vídeo no Cloudflare Stream sob demanda quando abrir preview de vídeo que ainda não tem stream_uid
  useEffect(() => {
    const arquivo = previewArquivo;
    if (
      !arquivo ||
      arquivo.tipo !== 'arquivo' ||
      !isArquivoVideo(arquivo) ||
      !arquivo.arquivo_url ||
      !arquivo.arquivo_key ||
      arquivo.stream_uid
    ) {
      setStreamPlaybackError(null);
      setStreamProcessing(false);
      return;
    }
    let cancelled = false;
    setStreamPlaybackError(null);
    setStreamPlaybackLoading(true);
    (async () => {
      try {
        console.log('[Stream] Criando Stream para arquivo copiado:', arquivo.nome, 'key:', arquivo.arquivo_key);
        const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL as string | undefined;
        let sourceUrl: string;
        if (publicUrl) {
          sourceUrl = `${publicUrl.replace(/\/$/, '')}/${arquivo.arquivo_key}`;
          console.log('[Stream] Usando URL pública:', sourceUrl);
        } else {
          sourceUrl = await getSignedUrlR2(R2_BUCKETS.ANEXOS, arquivo.arquivo_key, 24 * 3600);
          console.log('[Stream] Usando URL assinada (expira em 24h)');
        }
        console.log('[Stream] Chamando createStreamVideoFromUrl com sourceUrl:', sourceUrl);
        const result = await createStreamVideoFromUrl({
          sourceUrl,
          name: arquivo.nome,
          meta: { artistaAnexoId: arquivo.id },
        });
        console.log('[Stream] Resposta do createStreamVideoFromUrl:', result);
        const streamIframeUrl = getStreamIframeUrl(result.uid) || undefined;
        if (cancelled) return;
        await supabase
          .from('artistas_anexos')
          .update({ stream_uid: result.uid, stream_iframe_url: streamIframeUrl })
          .eq('id', arquivo.id);
        if (cancelled) return;
        setPreviewArquivo((prev) =>
          prev?.id === arquivo.id
            ? { ...prev, stream_uid: result.uid, stream_iframe_url: streamIframeUrl }
            : prev
        );
        // Atualizar também na lista de anexos para manter consistência
        setAnexos((prev) =>
          prev.map((item) =>
            item.id === arquivo.id
              ? { ...item, stream_uid: result.uid, stream_iframe_url: streamIframeUrl }
              : item
          )
        );
        
        // Se o vídeo não está pronto para streaming, aguardar processamento
        if (!result.readyToStream) {
          setStreamProcessing(true);
          console.log('[Stream] Vídeo criado mas ainda processando, UID:', result.uid);
          // Aguardar alguns segundos antes de tentar mostrar o player
          // O Cloudflare Stream geralmente processa vídeos em 1-3 minutos
          await new Promise(resolve => setTimeout(resolve, 10000)); // Aumentado para 10 segundos
          if (cancelled) return;
          setStreamProcessing(false);
          console.log('[Stream] Aguardou processamento, tentando reproduzir agora');
        } else {
          console.log('[Stream] Vídeo pronto para streaming imediatamente, UID:', result.uid);
        }
      } catch (e: any) {
        if (!cancelled) {
          setStreamPlaybackError(e?.message || 'Falha ao preparar transmissão.');
        }
      } finally {
        if (!cancelled) setStreamPlaybackLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewArquivo?.id, previewArquivo?.tipo, previewArquivo?.arquivo_url, previewArquivo?.arquivo_key, previewArquivo?.stream_uid]);

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

  // Função para gerar URL válida para visualização
  // Prioriza URL pública (r2.dev) quando disponível para evitar ERR_SSL_VERSION_OR_CIPHER_MISMATCH
  const getValidUrl = async (anexo: Anexo): Promise<string> => {
    // Se temos arquivo_key e PUBLIC_URL configurado, usar URL pública (r2.dev)
    const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL as string | undefined;
    if (anexo.arquivo_key && publicUrl) {
      const base = publicUrl.replace(/\/$/, '');
      return `${base}/${anexo.arquivo_key}`;
    }
    
    // Se temos arquivo_key mas não temos PUBLIC_URL, tentar URL assinada (pode falhar no navegador)
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
  // Usa URL pública (r2.dev) quando disponível para evitar ERR_SSL_VERSION_OR_CIPHER_MISMATCH
  const handleOpenFile = async (anexo: Anexo, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    try {
      const url = await getValidUrl(anexo);
      // getValidUrl já retorna URL pública (r2.dev) se PUBLIC_URL estiver configurado
      // Se retornar URL do S3 (r2.cloudflarestorage.com), converter para r2.dev
      const urlToOpen = url.includes('r2.cloudflarestorage.com')
        ? getBrowserViewableUrl(url, R2_BUCKETS.ANEXOS, anexo.arquivo_key)
        : url;
      window.open(urlToOpen, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      console.error('Erro ao abrir arquivo:', error);
      alert(`Erro ao abrir arquivo: ${error.message || 'Não foi possível gerar URL válida'}`);
    }
  };

  const handleDownloadFile = async (anexo: Anexo, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    // Download: sempre arquivo original (R2); vídeos em Stream também têm arquivo_url
    if (anexo.tipo !== 'arquivo' || (!anexo.arquivo_key && !anexo.arquivo_url)) return;
    const fileName = anexo.nome || 'download';
    downloadBlobRef.current = null;
    downloadMimeRef.current = anexo.arquivo_tipo || '';
    try {
      // Para iPhone, precisamos forçar "download de arquivo" (não abrir no player).
      // Quando temos key, geramos signed URL com Content-Disposition: attachment.
      let downloadUrl: string;
      if (anexo.arquivo_key) {
        const safeName = (fileName || 'download').replace(/[\\"]/g, '');
        const disposition = `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
        downloadUrl = await getSignedUrlR2(R2_BUCKETS.ANEXOS, anexo.arquivo_key, 86400, {
          responseContentDisposition: disposition,
          responseContentType: anexo.arquivo_tipo || undefined,
        });
      } else {
        const url = await getValidUrl(anexo);
        // Fallback: sem key não conseguimos setar attachment, então usamos a URL existente.
        downloadUrl = url.includes('r2.cloudflarestorage.com')
          ? getBrowserViewableUrl(url, R2_BUCKETS.ANEXOS, anexo.arquivo_key)
          : url;
      }

      // Web/desktop: iniciar rápido via link direto (sem "baixar invisível" e sem modal)
      if (!shouldUseMobileDownloadFlow) {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Download iniciado');
        return;
      }

      // iPhone + arquivo grande: evitar Blob (Safari recarrega a página por memória). Baixar pelo navegador.
      const IOS_MAX_IN_MEMORY_BYTES = 40 * 1024 * 1024; // 40MB (conservador)
      const tamanho = anexo.arquivo_tamanho || 0;
      if (isIOSDevice && tamanho > IOS_MAX_IN_MEMORY_BYTES) {
        setDownloadModal({
          show: true,
          progress: 100,
          indeterminate: false,
          receivedBytes: 0,
          totalBytes: tamanho,
          fileName,
          status: 'done',
          directUrl: downloadUrl,
        });
        return;
      }

      // Mobile: comportamento estilo Drive (carrega internamente + modal de progresso, depois salvar)
      setDownloadModal({
        show: true,
        progress: 0,
        indeterminate: true,
        receivedBytes: 0,
        totalBytes: 0,
        fileName,
        status: 'loading',
        directUrl: undefined,
      });

      const res = await fetch(downloadUrl, { mode: 'cors' });
      if (!res.ok) throw new Error(`Falha ao baixar: ${res.status}`);
      const contentLength = res.headers.get('Content-Length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = res.body?.getReader();
      if (!reader) {
        const blob = await res.blob();
        downloadBlobRef.current = blob;
        downloadMimeRef.current = blob.type || downloadMimeRef.current;
        setDownloadModal((m) => ({
          ...m,
          indeterminate: false,
          totalBytes: total || blob.size || 0,
          receivedBytes: blob.size || 0,
          progress: 100,
          status: 'done',
          directUrl: undefined,
        }));
        return;
      }
      const chunks: Uint8Array[] = [];
      let received = 0;
      setDownloadModal((m) => ({
        ...m,
        indeterminate: !(total > 0),
        totalBytes: total,
      }));
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          setDownloadModal((m) => ({
            ...m,
            receivedBytes: received,
            progress: total > 0 ? Math.min(99, Math.round((received / total) * 100)) : m.progress,
          }));
        }
      }
      const blob = new Blob(chunks);
      downloadBlobRef.current = blob;
      downloadMimeRef.current = blob.type || downloadMimeRef.current;
      setDownloadModal((m) => ({
        ...m,
        indeterminate: false,
        receivedBytes: blob.size || received,
        totalBytes: total || blob.size || 0,
        progress: 100,
        status: 'done',
        directUrl: undefined,
      }));
    } catch (error: any) {
      console.error('Erro ao baixar arquivo:', error);
      const msg = error.message || 'Não foi possível baixar o arquivo';
      setDownloadModal((m) => ({ ...m, status: 'error', errorMessage: msg }));
      toast.error(msg);
    }
  };

  const handleSaveDownloadedFile = useCallback(async () => {
    // Se for caso "arquivo grande no iPhone", a gente não cria Blob: abre o download no navegador
    if (downloadModal.directUrl) {
      window.open(downloadModal.directUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const blob = downloadBlobRef.current;
    if (!blob) return;
    const fileName = downloadModal.fileName || 'download';
    const mime = downloadMimeRef.current || blob.type || 'application/octet-stream';

    // iPhone/iPad: preferir Share Sheet (parecido com Drive: "Salvar em Arquivos")
    if (isIOSDevice) {
      try {
        const file = new File([blob], fileName, { type: mime });
        // @ts-expect-error - Safari define canShare/share em navegadores compatíveis
        if (navigator?.canShare?.({ files: [file] }) && navigator?.share) {
          // @ts-expect-error - Web Share API
          await navigator.share({ files: [file], title: fileName });
          return;
        }
      } catch (e) {
        // fallback abaixo
      }
      // Fallback: abrir para o usuário usar "Compartilhar" -> "Salvar em Arquivos"
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      // revogar depois (tempo para abrir a aba)
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      return;
    }

    // Outros móveis: tentar download direto pelo blob
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
  }, [downloadModal.directUrl, downloadModal.fileName, isIOSDevice]);

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
    console.log('[copiarItem] Copiando item:', item.nome);
    setClipboard({ items: [item], action: 'copy' });
    setContextMenu(null);
    toast.success(`"${item.nome}" copiado. Clique com botão direito em uma pasta e selecione "Colar" ou use Ctrl+V.`);
  };

  const cortarItem = (item: Anexo) => {
    console.log('[cortarItem] Cortando item:', item.nome);
    setClipboard({ items: [item], action: 'cut' });
    setContextMenu(null);
    toast.success(`"${item.nome}" cortado. Clique com botão direito em uma pasta e selecione "Colar" ou use Ctrl+V.`);
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
          // NÃO copiar stream_uid - o arquivo copiado precisa ter seu próprio Stream criado
          stream_uid: null,
          stream_iframe_url: null,
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
    console.log('[colarItem] Colando na pasta:', destPastaId, 'clipboard:', clipboard);
    if (!clipboard || clipboard.items.length === 0) {
      console.warn('[colarItem] Clipboard vazio');
      return;
    }
    setColando(true);
    setContextMenu(null);
    try {
      for (const item of clipboard.items) {
        console.log('[colarItem] Processando item:', item.nome, 'ação:', clipboard.action);
        const seriaCiclo = item.tipo === 'pasta' && (await ehDescendenteOuProprio(item.id, destPastaId));
        if (seriaCiclo) {
          toast.error(`Não é possível colar "${item.nome}" dentro de si mesma.`);
          continue;
        }
        if (clipboard.action === 'cut') {
          const ordem = await obterProximaOrdem(destPastaId);
          console.log('[colarItem] Movendo item, nova ordem:', ordem);
          const { error } = await supabase
            .from('artistas_anexos')
            .update({ pasta_pai_id: destPastaId, ordem })
            .eq('id', item.id);
          if (error) {
            console.error('[colarItem] Erro ao mover:', error);
            throw error;
          }
          toast.success(`"${item.nome}" movido com sucesso.`);
        } else {
          console.log('[colarItem] Duplicando item');
          if (item.tipo === 'arquivo') {
            await duplicarArquivo(item, destPastaId);
            toast.success(`"${item.nome}" copiado com sucesso.`);
          } else {
            await duplicarPasta(item, destPastaId);
            toast.success(`"${item.nome}" copiado com sucesso.`);
          }
        }
      }
      if (clipboard.action === 'cut') setClipboard(null);
      loadAnexos();
    } catch (e: any) {
      console.error('Erro ao colar:', e);
      toast.error(`Erro ao colar: ${e.message || 'Tente novamente'}`);
    } finally {
      setColando(false);
    }
  };

  const moverItemParaPasta = async (item: Anexo, destPastaId: string | null) => {
    console.log('[moverItemParaPasta] Movendo item:', item.nome, 'para pasta:', destPastaId);
    if (item.pasta_pai_id === destPastaId) {
      console.log('[moverItemParaPasta] Item já está na pasta de destino');
      return;
    }
    const seriaCiclo = item.tipo === 'pasta' && (await ehDescendenteOuProprio(item.id, destPastaId));
    if (seriaCiclo) {
      alert('Não é possível mover uma pasta para dentro de si mesma.');
      return;
    }
    try {
      const ordem = await obterProximaOrdem(destPastaId);
      console.log('[moverItemParaPasta] Nova ordem:', ordem);
      const { error } = await supabase
        .from('artistas_anexos')
        .update({ pasta_pai_id: destPastaId, ordem })
        .eq('id', item.id);
      if (error) {
        console.error('[moverItemParaPasta] Erro do Supabase:', error);
        throw error;
      }
      console.log('[moverItemParaPasta] Item movido com sucesso');
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

  // Detectar se o vídeo é vertical (portrait) baseado no nome do arquivo
  const isVideoVertical = (arquivo: Anexo): boolean => {
    if (!isArquivoVideo(arquivo)) return false;
    const nomeLower = arquivo.nome.toLowerCase();
    // Palavras-chave que indicam vídeo vertical
    const verticalKeywords = [
      'reels', 'reel', 'stories', 'story', 'vertical', 'portrait', 
      'tiktok', 'shorts', 'ig', 'instagram', 'stories', 'story',
      'vertical', 'portrait', 'mobile', 'celular'
    ];
    return verticalKeywords.some(keyword => nomeLower.includes(keyword));
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

  // Renovar URL dos vídeos para a miniatura carregar (signed URL pode estar expirada)
  useEffect(() => {
    const videos = arquivos.filter(a => isArquivoVideo(a) && a.arquivo_url);
    videos.forEach(arquivo => {
      if (requestedVideoIdsRef.current.has(arquivo.id)) return;
      requestedVideoIdsRef.current.add(arquivo.id);
      getValidUrl(arquivo).then(url => {
        setVideoThumbUrls(prev => (prev[arquivo.id] ? prev : { ...prev, [arquivo.id]: url }));
      }).catch(() => {});
    });
  }, [arquivos]);

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-3 sm:p-4 md:p-6 relative overflow-x-hidden min-w-0">
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
              {contextMenu.item.tipo === 'arquivo' && contextMenu.item.arquivo_url && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { contextMenu.item && contextMenu.item.tipo === 'arquivo' && handleDownloadFile(contextMenu.item); setContextMenu(null); }}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-dark-hover flex items-center gap-2 cursor-pointer"
                >
                  <i className="ri-download-line"></i>
                  Download
                </button>
              )}
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
          {/* Botão "Colar nesta pasta" - aparece quando clica com direito em uma pasta E tem algo copiado */}
          {contextMenu.item && contextMenu.item.tipo === 'pasta' && contextMenu.targetFolderId && clipboard && (
            <>
              <div className="border-t border-dark-border my-1"></div>
              <button
                type="button"
                role="menuitem"
                onClick={() => { colarItem(contextMenu.targetFolderId); setContextMenu(null); }}
                disabled={colando}
                className="w-full px-4 py-2 text-left text-sm text-primary-teal hover:bg-dark-hover flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="ri-file-copy-line"></i>
                Colar nesta pasta {clipboard.action === 'cut' ? '(mover)' : '(copiar)'}
              </button>
            </>
          )}
          {/* Botão "Colar aqui" - aparece quando clica com direito na área vazia E tem algo copiado */}
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
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Armazenamento</h2>
          <p className="text-sm text-gray-400">Gerencie pastas e arquivos do artista</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {clipboard && clipboard.items.length > 0 && (
            <>
              <span className="text-xs text-gray-400 w-full sm:w-auto">
                {clipboard.action === 'cut' ? '1 item para mover' : '1 item copiado'}
              </span>
              <button
                onClick={() => clipboard && colarItem(pastaAtual)}
                disabled={colando}
                className="px-3 py-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm shrink-0"
                title="Colar aqui (Ctrl+V)"
              >
                {colando ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-file-copy-line"></i>}
                <span className="whitespace-nowrap">Colar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setClipboard(null);
                  toast.success('Colagem cancelada.');
                }}
                className="p-2 bg-dark-bg hover:bg-red-500/20 text-gray-400 hover:text-red-300 rounded-lg transition-smooth cursor-pointer shrink-0"
                title="Cancelar colagem (descartar item do clipboard)"
                aria-label="Cancelar colagem"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </>
          )}
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer shrink-0"
            title={viewMode === 'grid' ? 'Visualização em lista' : 'Visualização em grade'}
          >
            <i className={viewMode === 'grid' ? 'ri-list-check' : 'ri-grid-line'}></i>
          </button>
          {/* Organizar: só mobile; ativa modo toque-para-mover */}
          <button
            onClick={() => {
              setModoOrganizar((prev) => !prev);
              setItemSelecionadoParaMover(null);
            }}
            className={`lg:hidden px-3 py-2 rounded-lg transition-smooth cursor-pointer flex items-center gap-2 text-sm shrink-0 ${
              modoOrganizar ? 'bg-primary-teal text-white' : 'bg-dark-bg hover:bg-dark-hover text-white'
            }`}
            title={modoOrganizar ? 'Concluir e sair do modo organizar' : 'Organizar: toque em um item e depois na pasta de destino'}
          >
            <i className={modoOrganizar ? 'ri-check-line' : 'ri-draggable'}></i>
            <span className="whitespace-nowrap">{modoOrganizar ? 'Concluir' : 'Organizar'}</span>
          </button>
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="px-3 py-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer flex items-center gap-2 text-sm shrink-0"
          >
            <i className="ri-folder-add-line"></i>
            <span className="whitespace-nowrap">Nova Pasta</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 text-sm shrink-0"
          >
            <i className="ri-upload-line"></i>
            <span className="whitespace-nowrap">Upload</span>
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

      {/* Aviso modo Organizar (mobile) */}
      {modoOrganizar && (
        <div className="mb-4 p-3 bg-primary-teal/15 border border-primary-teal/40 rounded-lg flex items-center justify-between gap-2 lg:hidden">
          <p className="text-sm text-primary-teal">
            {itemSelecionadoParaMover ? (
              <>Toque na pasta de destino ou na área vazia para mover &quot;{itemSelecionadoParaMover.nome}&quot;</>
            ) : (
              <>Toque em um item para selecionar e depois na pasta de destino</>
            )}
          </p>
          <button
            type="button"
            onClick={() => { setModoOrganizar(false); setItemSelecionadoParaMover(null); }}
            className="shrink-0 p-1.5 rounded-lg bg-primary-teal/30 hover:bg-primary-teal/50 text-white"
            aria-label="Fechar"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>
      )}

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
          className={`${viewMode === 'grid' ? 'grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 min-w-0 w-full' : 'space-y-2'} rounded-lg min-h-[100px] transition-colors ${
            dragState?.dragOverArea ? 'bg-primary-teal/10 border-2 border-dashed border-primary-teal' : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault();
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
            console.log('[onDrop] Soltando na área da pasta atual:', pastaAtual, 'item:', dragState?.item?.nome);
            if (dragState?.item) {
              moverItemParaPasta(dragState.item, pastaAtual);
            }
            setDragState(null);
          }}
          onContextMenu={(e) => {
            if ((e.target as HTMLElement).closest('[data-file-manager-item]')) return;
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, item: null, targetFolderId: null });
          }}
          onClick={(e) => {
            if (!modoOrganizar || !itemSelecionadoParaMover) return;
            if ((e.target as HTMLElement).closest('[data-file-manager-item]')) return;
            e.preventDefault();
            e.stopPropagation();
            moverItemParaPasta(itemSelecionadoParaMover, pastaAtual);
            toast.success(`"${itemSelecionadoParaMover.nome}" movido para ${pastaAtual ? 'a pasta atual' : 'a raiz'}.`);
            setItemSelecionadoParaMover(null);
          }}
        >
          {/* Pastas */}
          {pastas.map((pasta) => (
            <div
              key={pasta.id}
              data-file-manager-item
              draggable="true"
              onDragStart={(e) => {
                console.log('[onDragStart PASTA] Evento disparado!');
                console.log('[onDragStart PASTA] Target:', e.target);
                console.log('[onDragStart PASTA] CurrentTarget:', e.currentTarget);
                
                // Não iniciar drag se estiver clicando em botões ou elementos interativos
                const target = e.target as HTMLElement;
                const interactiveElement = target.closest('button, [role="button"], input, a');
                if (interactiveElement) {
                  console.log('[onDragStart PASTA] BLOQUEADO - elemento interativo:', interactiveElement);
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
                console.log('[onDragStart PASTA] ✓ Drag iniciado!', pasta.nome);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', pasta.id);
                e.dataTransfer.setData('application/json', JSON.stringify({ id: pasta.id, tipo: pasta.tipo }));
                setDragState({ item: pasta, dragOverFolderId: null, dragOverArea: false });
              }}
              onDragEnd={(e) => {
                console.log('[onDragEnd] Finalizando drag');
                setDragState(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                if (dragState && dragState.item.id !== pasta.id) {
                  setDragState(s => s ? { ...s, dragOverFolderId: pasta.id, dragOverArea: false } : null);
                }
              }}
              onDragLeave={(e) => {
                const related = e.relatedTarget as Node | null;
                if (!related || !e.currentTarget.contains(related)) {
                  setDragState(s => s ? { ...s, dragOverFolderId: s.dragOverFolderId === pasta.id ? null : s.dragOverFolderId } : null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[onDrop] Soltando na pasta:', pasta.nome, 'item:', dragState?.item?.nome);
                if (dragState?.item && dragState.item.id !== pasta.id) {
                  moverItemParaPasta(dragState.item, pasta.id);
                }
                setDragState(null);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[onContextMenu] Menu de contexto para pasta:', pasta.nome, 'ID:', pasta.id);
                setContextMenu({ x: e.clientX, y: e.clientY, item: pasta, targetFolderId: pasta.id });
              }}
              onClick={async (e) => {
                const target = e.target as HTMLElement;
                if (target.closest('button, [role="button"]')) return;
                e.preventDefault();
                e.stopPropagation();
                setOpenActionMenuId(null);
                if (!modoOrganizar) {
                  entrarNaPasta(pasta.id, pasta.nome);
                  return;
                }
                if (itemSelecionadoParaMover) {
                  if (itemSelecionadoParaMover.id === pasta.id) {
                    setItemSelecionadoParaMover(null);
                    return;
                  }
                  if (itemSelecionadoParaMover.tipo === 'pasta' && (await ehDescendenteOuProprio(itemSelecionadoParaMover.id, pasta.id))) {
                    toast.error('Não é possível mover uma pasta para dentro de si mesma.');
                    return;
                  }
                  moverItemParaPasta(itemSelecionadoParaMover, pasta.id);
                  toast.success(`"${itemSelecionadoParaMover.nome}" movido para "${pasta.nome}".`);
                  setItemSelecionadoParaMover(null);
                } else {
                  setItemSelecionadoParaMover(pasta);
                }
              }}
              className={`bg-dark-bg border rounded-lg p-3 sm:p-4 hover:border-primary-teal transition-smooth cursor-move group min-w-0 overflow-hidden relative ${
                viewMode === 'list' ? 'flex items-center gap-4' : ''
              } ${
                dragState?.dragOverFolderId === pasta.id
                  ? 'border-primary-teal border-2 bg-primary-teal/10'
                  : 'border-dark-border'
              } ${modoOrganizar && itemSelecionadoParaMover?.id === pasta.id ? 'ring-2 ring-primary-teal ring-offset-2 ring-offset-dark-bg' : ''}`}
            >
              {/* Botão ações (três pontinhos) - somente mobile */}
              <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 lg:hidden pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (openActionMenuId === pasta.id) {
                      setOpenActionMenuId(null);
                      setOpenActionMenuAnchor(null);
                      setOpenActionMenuPasta(null);
                    } else {
                      setOpenActionMenuId(pasta.id);
                      setOpenActionMenuAnchor((e.currentTarget as HTMLElement).getBoundingClientRect());
                      setOpenActionMenuArquivo(null);
                      setOpenActionMenuPasta(pasta);
                    }
                  }}
                  className="p-1.5 sm:p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white cursor-pointer"
                  aria-label="Ações"
                >
                  <i className="ri-more-2-fill text-base sm:text-lg"></i>
                </button>
              </div>
              <div className={`flex items-center gap-2 sm:gap-3 pointer-events-none ${viewMode === 'list' ? 'flex-1' : 'flex-col'}`}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary-teal/20 flex items-center justify-center text-primary-teal text-xl sm:text-2xl flex-shrink-0">
                  <i className="ri-folder-line"></i>
                </div>
                <div className={`flex-1 min-w-0 overflow-hidden pointer-events-none ${viewMode === 'list' ? '' : 'text-center'}`}>
                  <h3 className="text-white font-medium text-xs sm:text-sm line-clamp-2 break-words" title={pasta.nome}>{pasta.nome}</h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Pasta</p>
                </div>
                <div className="hidden lg:flex items-center gap-2 flex-shrink-0 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                  <span
                    className="cursor-grab active:cursor-grabbing p-1 rounded text-gray-400 hover:text-primary-teal hover:bg-dark-border/50 pointer-events-none"
                    title="Arraste o card para mover"
                  >
                    <i className="ri-draggable"></i>
                  </span>
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
            const ehVideo = isArquivoVideo(arquivo) && arquivo.arquivo_url;
            return (
              <div
                key={arquivo.id}
                data-file-manager-item
                draggable="true"
                onDragStart={(e) => {
                  console.log('[onDragStart ARQUIVO] Evento disparado!');
                  console.log('[onDragStart ARQUIVO] Target:', e.target);
                  console.log('[onDragStart ARQUIVO] CurrentTarget:', e.currentTarget);
                  
                  // Não iniciar drag se estiver clicando em botões ou elementos interativos
                  const target = e.target as HTMLElement;
                  const interactiveElement = target.closest('button, [role="button"], input, a');
                  if (interactiveElement) {
                    console.log('[onDragStart ARQUIVO] BLOQUEADO - elemento interativo:', interactiveElement);
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                  console.log('[onDragStart ARQUIVO] ✓ Drag iniciado!', arquivo.nome);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', arquivo.id);
                  e.dataTransfer.setData('application/json', JSON.stringify({ id: arquivo.id, tipo: arquivo.tipo }));
                  setDragState({ item: arquivo, dragOverFolderId: null, dragOverArea: false });
                }}
                onDragEnd={(e) => {
                  console.log('[onDragEnd] Finalizando drag');
                  setDragState(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'none'; // Arquivos não podem receber drops de outros arquivos
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[onContextMenu] Menu de contexto para arquivo:', arquivo.nome);
                  setContextMenu({ x: e.clientX, y: e.clientY, item: arquivo, targetFolderId: null });
                }}
                onClick={async (e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button, [role="button"]')) return;
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenActionMenuId(null);
                  if (!modoOrganizar) {
                    if (arquivo.arquivo_url) {
                      try {
                        const url = await getValidUrl(arquivo);
                        const urlPublica = url.includes('r2.cloudflarestorage.com')
                          ? getBrowserViewableUrl(url, R2_BUCKETS.ANEXOS, arquivo.arquivo_key)
                          : url;
                        setPreviewArquivo({ ...arquivo, arquivo_url: urlPublica });
                      } catch {
                        const urlPublica = arquivo.arquivo_url.includes('r2.cloudflarestorage.com')
                          ? getBrowserViewableUrl(arquivo.arquivo_url, R2_BUCKETS.ANEXOS, arquivo.arquivo_key)
                          : arquivo.arquivo_url;
                        setPreviewArquivo({ ...arquivo, arquivo_url: urlPublica });
                      }
                    }
                    return;
                  }
                  if (itemSelecionadoParaMover) {
                    if (itemSelecionadoParaMover.id === arquivo.id) {
                      setItemSelecionadoParaMover(null);
                      return;
                    }
                    moverItemParaPasta(itemSelecionadoParaMover, pastaAtual);
                    toast.success(`"${itemSelecionadoParaMover.nome}" movido para ${pastaAtual ? 'a pasta atual' : 'a raiz'}.`);
                    setItemSelecionadoParaMover(null);
                    return;
                  }
                  setItemSelecionadoParaMover(arquivo);
                }}
                className={`bg-dark-bg border border-dark-border rounded-lg hover:border-primary-teal transition-smooth group cursor-move overflow-hidden min-w-0 relative ${
                  viewMode === 'list' 
                    ? 'flex items-center gap-4 p-2' 
                    : ehImagem 
                      ? 'flex flex-col p-0' 
                      : 'p-2 sm:p-3'
                } ${modoOrganizar && itemSelecionadoParaMover?.id === arquivo.id ? 'ring-2 ring-primary-teal ring-offset-2 ring-offset-dark-bg' : ''}`}
              >
                {/* Botão ações (três pontinhos) - somente mobile; menu renderizado fora do card via portal */}
                <div className="absolute top-2 right-2 z-10 lg:hidden pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (openActionMenuId === arquivo.id) {
                        setOpenActionMenuId(null);
                        setOpenActionMenuAnchor(null);
                        setOpenActionMenuArquivo(null);
                      } else {
                        setOpenActionMenuId(arquivo.id);
                        setOpenActionMenuAnchor((e.currentTarget as HTMLElement).getBoundingClientRect());
                        setOpenActionMenuArquivo(arquivo);
                        setOpenActionMenuPasta(null);
                      }
                    }}
                    className="p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white cursor-pointer"
                    aria-label="Ações"
                  >
                    <i className="ri-more-2-fill text-lg"></i>
                  </button>
                </div>
                {viewMode === 'list' ? (
                  /* Layout lista */
                  <>
                    <div className="relative w-12 h-12 rounded-lg bg-primary-teal/20 overflow-hidden flex-shrink-0 pointer-events-none">
                      {ehImagem ? (
                        <img draggable={false} src={arquivo.arquivo_url!} alt={arquivo.nome} className="absolute inset-0 w-full h-full object-cover pointer-events-none" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; e.currentTarget.parentElement?.querySelector('.thumb-fallback')?.classList.remove('hidden'); }} />
                      ) : null}
                      <span className={`thumb-fallback absolute inset-0 flex items-center justify-center ${ehImagem ? 'hidden' : ''}`}>
                        <i className={`${getIconeArquivo(arquivo.arquivo_extensao)} text-primary-teal text-xl`}></i>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden pointer-events-none">
                      <h3 className="text-white font-medium text-sm line-clamp-2 break-words" title={arquivo.nome}>{arquivo.nome}</h3>
                      <p className="text-xs text-gray-500">{arquivo.arquivo_tamanho ? formatarTamanho(arquivo.arquivo_tamanho) : '—'}</p>
                    </div>
                    <div className="hidden lg:flex items-center gap-2 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                      <span
                        className="cursor-grab active:cursor-grabbing p-1 rounded text-gray-400 hover:text-primary-teal transition-opacity shrink-0 pointer-events-none"
                        title="Arraste o card para mover"
                      >
                        <i className="ri-draggable"></i>
                      </span>
                      {arquivo.arquivo_url && (
                        <button onClick={(e) => handleDownloadFile(arquivo, e)} className="opacity-0 group-hover:opacity-100 text-primary-teal hover:text-primary-brown transition-opacity cursor-pointer pointer-events-auto" title="Download"><i className="ri-download-line"></i></button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); abrirModalEditar(arquivo); }} className="text-primary-teal hover:text-primary-brown transition-opacity pointer-events-auto" title="Editar"><i className="ri-edit-line"></i></button>
                      <button onClick={(e) => { e.stopPropagation(); deletarItem(arquivo); }} className="text-red-400 hover:text-red-300 transition-opacity pointer-events-auto" title="Deletar"><i className="ri-delete-bin-line"></i></button>
                    </div>
                  </>
                ) : ehImagem ? (
                  /* Layout grade - imagem em destaque */
                  <>
                    <div className="relative aspect-[4/3] w-full min-h-[70px] max-h-[160px] sm:max-h-[200px] md:max-h-[220px] bg-dark-border overflow-hidden" style={{ pointerEvents: 'none', userSelect: 'none' }}>
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
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex items-center justify-between gap-2 min-w-0" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        <h3 className="text-white font-medium text-xs line-clamp-2 break-words flex-1 min-w-0 overflow-hidden" title={arquivo.nome} style={{ pointerEvents: 'none', userSelect: 'none' }}>{arquivo.nome}</h3>
                        <span className="text-gray-300 text-xs flex-shrink-0" style={{ pointerEvents: 'none', userSelect: 'none' }}>{arquivo.arquivo_tamanho ? formatarTamanho(arquivo.arquivo_tamanho) : ''}</span>
                      </div>
                      <div className="hidden lg:flex absolute top-2 left-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <span
                          className="p-1.5 bg-black/60 rounded text-gray-300 hover:text-primary-teal hover:bg-black/80 pointer-events-none"
                          title="Arraste o card para mover"
                        >
                          <i className="ri-draggable text-sm"></i>
                        </span>
                      </div>
                      <div className="hidden lg:flex absolute top-2 right-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
                        {arquivo.arquivo_url && (
                          <button onClick={(e) => handleDownloadFile(arquivo, e)} className="p-1.5 bg-black/60 rounded text-primary-teal hover:bg-black/80 cursor-pointer" title="Download" style={{ pointerEvents: 'auto' }}><i className="ri-download-line text-sm"></i></button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); abrirModalEditar(arquivo); }} className="p-1.5 bg-black/60 rounded text-primary-teal hover:bg-black/80" title="Editar" style={{ pointerEvents: 'auto' }}><i className="ri-edit-line text-sm"></i></button>
                        <button onClick={(e) => { e.stopPropagation(); deletarItem(arquivo); }} className="p-1.5 bg-black/60 rounded text-red-400 hover:bg-black/80" title="Deletar" style={{ pointerEvents: 'auto' }}><i className="ri-delete-bin-line text-sm"></i></button>
                      </div>
                    </div>
                  </>
                ) : ehVideo ? (
                  /* Layout grade - vídeo com miniatura (primeiro frame) */
                  <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0 w-full">
                    <div className="relative aspect-video w-full max-h-[140px] sm:max-h-[180px] md:max-h-[200px] bg-dark-border rounded-lg overflow-hidden" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      <video
                        muted
                        playsInline
                        preload="metadata"
                        controls={false}
                        draggable={false}
                        src={videoThumbUrls[arquivo.id] || arquivo.arquivo_url || ''}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        onLoadedMetadata={(e) => {
                          // Tenta avançar alguns ms para "capturar" um frame não-preto.
                          // (Alguns navegadores mostram preto no t=0.)
                          try {
                            const v = e.currentTarget;
                            const t = Math.min(0.1, Math.max(0, (v.duration || 0) * 0.01));
                            v.currentTime = t;
                          } catch {
                            // ignore
                          }
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLVideoElement;
                          target.style.display = 'none';
                          target.parentElement?.querySelector('.thumb-fallback')?.classList.remove('hidden');
                        }}
                      />
                      <span className="thumb-fallback absolute inset-0 flex items-center justify-center bg-primary-teal/10 hidden">
                        <i className="ri-video-line text-primary-teal text-3xl"></i>
                      </span>

                      {/* Ações no hover - somente desktop */}
                      <div
                        className="hidden lg:flex absolute top-2 left-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          className="p-1.5 bg-black/60 rounded text-gray-300 hover:text-primary-teal hover:bg-black/80 pointer-events-none"
                          title="Arraste o card para mover"
                        >
                          <i className="ri-draggable text-sm"></i>
                        </span>
                      </div>
                      <div
                        className="hidden lg:flex absolute top-2 right-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                        style={{ pointerEvents: 'auto' }}
                      >
                        <button
                          onClick={(e) => handleDownloadFile(arquivo, e)}
                          className="p-1.5 bg-black/60 rounded text-primary-teal hover:bg-black/80 cursor-pointer"
                          title="Download"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <i className="ri-download-line text-sm"></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalEditar(arquivo);
                          }}
                          className="p-1.5 bg-black/60 rounded text-primary-teal hover:bg-black/80"
                          title="Editar"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <i className="ri-edit-line text-sm"></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletarItem(arquivo);
                          }}
                          className="p-1.5 bg-black/60 rounded text-red-400 hover:bg-black/80"
                          title="Deletar"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <i className="ri-delete-bin-line text-sm"></i>
                        </button>
                      </div>
                    </div>

                    {/* Nome e meta (igual ao card de pasta) */}
                    <div className="min-w-0 overflow-hidden" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      <h3 className="text-white font-medium text-xs sm:text-sm line-clamp-2 break-words text-center" title={arquivo.nome} style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {arquivo.nome}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 text-center" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {arquivo.arquivo_tamanho ? formatarTamanho(arquivo.arquivo_tamanho) : 'Vídeo'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Layout grade - arquivo não-imagem */
                  <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0 w-full">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="relative w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-primary-teal/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <i className={`${getIconeArquivo(arquivo.arquivo_extensao)} text-primary-teal text-lg sm:text-xl md:text-2xl`}></i>
                      </div>
                      <div className="hidden lg:flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
                        <span
                          className="cursor-grab active:cursor-grabbing p-1 rounded text-gray-400 hover:text-primary-teal transition-opacity pointer-events-none"
                          title="Arraste o card para mover"
                        >
                          <i className="ri-draggable"></i>
                        </span>
                        {arquivo.arquivo_url && (
                          <>
                            <button
                              onClick={(e) => handleDownloadFile(arquivo, e)}
                              className="opacity-0 group-hover:opacity-100 text-primary-teal cursor-pointer"
                              title="Download"
                              style={{ pointerEvents: 'auto' }}
                            >
                              <i className="ri-download-line"></i>
                            </button>
                          </>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); abrirModalEditar(arquivo); }} className="opacity-0 group-hover:opacity-100 text-primary-teal" title="Editar" style={{ pointerEvents: 'auto' }}><i className="ri-edit-line"></i></button>
                        <button onClick={(e) => { e.stopPropagation(); deletarItem(arquivo); }} className="opacity-0 group-hover:opacity-100 text-red-400" title="Deletar" style={{ pointerEvents: 'auto' }}><i className="ri-delete-bin-line"></i></button>
                      </div>
                    </div>
                    <div className="min-w-0 w-full overflow-hidden" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      <h3 className="text-white font-medium text-sm line-clamp-2 break-words block w-full" title={arquivo.nome} style={{ pointerEvents: 'none', userSelect: 'none' }}>{arquivo.nome}</h3>
                      <p className="text-xs text-gray-500" style={{ pointerEvents: 'none', userSelect: 'none' }}>{arquivo.arquivo_tamanho ? formatarTamanho(arquivo.arquivo_tamanho) : '—'}</p>
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
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-2 sm:p-4"
          onClick={() => {
            setPreviewArquivo(null);
            setStreamProcessing(false);
          }}
        >
          <div
            className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-2xl flex flex-col w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[56rem] sm:w-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-dark-border flex-shrink-0 gap-3">
              <h3 className="text-white font-medium text-sm sm:text-base break-words flex-1 min-w-0 pr-2">{previewArquivo.nome}</h3>
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto flex-wrap">
                <button
                  onClick={() => handleDownloadFile(previewArquivo)}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-primary-teal hover:bg-primary-brown text-white rounded-lg transition-smooth cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap"
                >
                  <i className="ri-download-line"></i>
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      // Sempre abrir o arquivo (R2), não o player Stream — assim no iPhone dá para segurar e salvar
                      const url = await getValidUrl(previewArquivo);
                      const urlPublica = url.includes('r2.cloudflarestorage.com')
                        ? getBrowserViewableUrl(url, R2_BUCKETS.ANEXOS, previewArquivo.arquivo_key)
                        : url;
                      window.open(urlPublica, '_blank', 'noopener,noreferrer');
                    } catch (e) {
                      const urlPublica = previewArquivo.arquivo_url?.includes('r2.cloudflarestorage.com')
                        ? getBrowserViewableUrl(previewArquivo.arquivo_url, R2_BUCKETS.ANEXOS, previewArquivo.arquivo_key)
                        : previewArquivo.arquivo_url;
                      if (urlPublica) window.open(urlPublica, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-dark-bg hover:bg-dark-hover border border-dark-border text-primary-teal rounded-lg transition-smooth cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap"
                  title="Abrir arquivo em nova aba (no iPhone: segure no vídeo e escolha Salvar no dispositivo)"
                >
                  <i className="ri-external-link-line"></i>
                  <span>Abrir em nova aba</span>
                </button>
                <button
                  onClick={() => {
                    setPreviewArquivo(null);
                    setStreamPlaybackError(null);
                    setStreamPlaybackLoading(false);
                    setStreamProcessing(false);
                  }}
                  className="p-2 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer flex-shrink-0"
                  title="Fechar"
                >
                  <i className="ri-close-line text-lg sm:text-xl"></i>
                </button>
              </div>
            </div>
            <div 
              className="bg-dark-bg flex-1 overflow-auto p-2 sm:p-4 md:p-8 min-h-[300px] sm:min-h-[400px] flex items-center justify-center"
            >
              {isArquivoImagem(previewArquivo) ? (
                <div className="flex items-center justify-center w-full h-full">
                  <img
                    src={previewArquivo.arquivo_url?.includes('r2.cloudflarestorage.com')
                      ? getBrowserViewableUrl(previewArquivo.arquivo_url, R2_BUCKETS.ANEXOS, previewArquivo.arquivo_key)
                      : (previewArquivo.arquivo_url || '')}
                    alt={previewArquivo.nome}
                    className="rounded-lg max-w-full max-h-[70vh] sm:max-h-[80vh] object-contain"
                      onError={async (e) => {
                      // Se a imagem falhar ao carregar, tentar gerar nova URL pública
                      try {
                        const novaUrl = await getValidUrl(previewArquivo);
                        const urlPublica = novaUrl.includes('r2.cloudflarestorage.com')
                          ? getBrowserViewableUrl(novaUrl, R2_BUCKETS.ANEXOS, previewArquivo.arquivo_key)
                          : novaUrl;
                        (e.target as HTMLImageElement).src = urlPublica;
                      } catch (error) {
                        console.error('Erro ao recarregar imagem:', error);
                      }
                    }}
                  />
                </div>
              ) : isArquivoAudio(previewArquivo) ? (
                <div className="flex flex-col items-center justify-center w-full p-4 sm:p-8">
                  <div className="w-full max-w-[600px]">
                    <div className="mb-6 sm:mb-8 text-center">
                      <i className="ri-music-line text-5xl sm:text-6xl md:text-7xl text-primary-teal block mb-4"></i>
                      <p className="text-gray-400 text-sm sm:text-base">{previewArquivo.nome}</p>
                    </div>
                    <audio
                      controls
                      className="w-full outline-none"
                      onError={async () => {
                        // Se o áudio falhar ao carregar, tentar gerar nova URL pública
                        try {
                          const novaUrl = await getValidUrl(previewArquivo);
                          const urlPublica = novaUrl.includes('r2.cloudflarestorage.com')
                            ? getBrowserViewableUrl(novaUrl, R2_BUCKETS.ANEXOS, previewArquivo.arquivo_key)
                            : novaUrl;
                          const audio = document.querySelector('audio') as HTMLAudioElement;
                          if (audio) {
                            audio.src = urlPublica;
                            audio.load();
                          }
                        } catch (error) {
                          console.error('Erro ao recarregar áudio:', error);
                        }
                      }}
                    >
                      <source src={previewArquivo.arquivo_url?.includes('r2.cloudflarestorage.com')
                        ? getBrowserViewableUrl(previewArquivo.arquivo_url, R2_BUCKETS.ANEXOS, previewArquivo.arquivo_key)
                        : (previewArquivo.arquivo_url || '')} type={previewArquivo.arquivo_tipo || 'audio/mpeg'} />
                      Seu navegador não suporta o elemento de áudio.
                    </audio>
                  </div>
                </div>
              ) : isArquivoVideo(previewArquivo) ? (
                <div className="flex items-center justify-center w-full h-full p-2 sm:p-4 md:p-8">
                  {previewArquivo.stream_uid ? (
                    streamProcessing ? (
                      <div className="bg-dark-bg border border-dark-border rounded-lg p-6 sm:p-8 md:p-12 text-center w-full max-w-md">
                        <i className="ri-loader-4-line text-3xl sm:text-4xl text-primary-teal animate-spin mb-4 block" />
                        <p className="text-white font-medium text-sm sm:text-base">Processando vídeo...</p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-2">O Cloudflare Stream está processando o vídeo. Isso pode levar alguns minutos.</p>
                        <p className="text-xs text-gray-500 mt-4">O vídeo será reproduzido automaticamente quando estiver pronto.</p>
                      </div>
                    ) : (
                      <StreamPreview
                        uid={previewArquivo.stream_uid}
                        iframeUrl={previewArquivo.stream_iframe_url || getStreamIframeUrl(previewArquivo.stream_uid) || undefined}
                        // Não passar title para evitar duplicidade (já está no header do modal)
                        aspectRatio={isVideoVertical(previewArquivo) ? '9:16' : '16:9'}
                        className="w-full"
                      />
                    )
                  ) : streamPlaybackLoading ? (
                    <div className="bg-dark-bg border border-dark-border rounded-lg p-6 sm:p-8 md:p-12 text-center w-full max-w-md">
                      <i className="ri-loader-4-line text-3xl sm:text-4xl text-primary-teal animate-spin mb-4 block" />
                      <p className="text-white font-medium text-sm sm:text-base">Preparando transmissão...</p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-2">O vídeo será reproduzido via Cloudflare Stream para melhor performance.</p>
                    </div>
                  ) : streamPlaybackError ? (
                    <div className="space-y-4 w-full max-w-2xl">
                      <div className="p-3 sm:p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-xs sm:text-sm">
                        Não foi possível usar transmissão otimizada: {streamPlaybackError}
                        <br />
                        <span className="text-gray-400">Reprodução direta abaixo (pode ser mais lenta em alguns dispositivos).</span>
                      </div>
                      <video
                        controls
                        className="max-w-full max-h-[60vh] sm:max-h-[70vh] rounded-lg w-full"
                        onError={async () => {
                          try {
                            const novaUrl = await getValidUrl(previewArquivo);
                            const urlPublica = novaUrl.includes('r2.cloudflarestorage.com')
                              ? getBrowserViewableUrl(novaUrl, R2_BUCKETS.ANEXOS, previewArquivo.arquivo_key)
                              : novaUrl;
                            const video = document.querySelector('video') as HTMLVideoElement;
                            if (video) {
                              video.src = urlPublica;
                              video.load();
                            }
                          } catch (error) {
                            console.error('Erro ao recarregar vídeo:', error);
                          }
                        }}
                      >
                        <source src={previewArquivo.arquivo_url?.includes('r2.cloudflarestorage.com')
                          ? getBrowserViewableUrl(previewArquivo.arquivo_url, R2_BUCKETS.ANEXOS, previewArquivo.arquivo_key)
                          : (previewArquivo.arquivo_url || '')} type={previewArquivo.arquivo_tipo || 'video/mp4'} />
                        Seu navegador não suporta o elemento de vídeo.
                      </video>
                    </div>
                  ) : (
                    <div className="bg-dark-bg border border-dark-border rounded-lg p-6 sm:p-8 md:p-12 text-center w-full max-w-md">
                      <i className="ri-loader-4-line text-3xl sm:text-4xl text-primary-teal animate-spin mb-4 block" />
                      <p className="text-white font-medium text-sm sm:text-base">Preparando transmissão...</p>
                    </div>
                  )}
                </div>
              ) : isArquivoPdf(previewArquivo) ? (
                <iframe
                  src={previewArquivo.arquivo_url || ''}
                  title={previewArquivo.nome}
                  className="w-full h-[60vh] sm:h-[70vh] border-none rounded-lg"
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
                      onClick={() => handleDownloadFile(previewArquivo)}
                      className="px-6 py-3 bg-primary-teal hover:bg-primary-brown text-white rounded-lg transition-smooth cursor-pointer"
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem'
                      }}
                    >
                      <i className="ri-download-line"></i>
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal "Fazendo download..." com progresso (estilo Google Drive; no iPhone mostra e depois salva) */}
      {downloadModal.show && shouldUseMobileDownloadFlow && (
        <div className="fixed inset-0 bg-black/80 z-[101] flex items-center justify-center p-4" onClick={() => downloadModal.status !== 'loading' && setDownloadModal((m) => ({ ...m, show: false }))}>
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {downloadModal.status === 'loading' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full border-2 border-primary-teal border-t-transparent animate-spin flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-medium">Fazendo download</h3>
                    <p className="text-gray-400 text-sm truncate" title={downloadModal.fileName}>{downloadModal.fileName}</p>
                  </div>
                </div>
                <div className="h-2 bg-dark-bg rounded-full overflow-hidden relative">
                  {downloadModal.indeterminate ? (
                    <div className="h-full w-2/3 bg-primary-teal/80 animate-pulse" />
                  ) : (
                    <div
                      className="h-full bg-primary-teal transition-all duration-300"
                      style={{ width: `${Math.max(2, Math.min(100, downloadModal.progress))}%` }}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-gray-500">
                    {downloadModal.totalBytes > 0
                      ? `${formatBytes(downloadModal.receivedBytes)} de ${formatBytes(downloadModal.totalBytes)}`
                      : `${formatBytes(downloadModal.receivedBytes)} baixados`}
                  </span>
                  {!downloadModal.indeterminate && (
                    <span className="text-gray-400 font-medium">{downloadModal.progress}%</span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-3 text-center">Aguarde terminar para aparecer a opção de salvar no iPhone.</p>
              </>
            )}
            {downloadModal.status === 'done' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-teal/20 flex items-center justify-center flex-shrink-0">
                    <i className="ri-check-line text-primary-teal text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Pronto para salvar</h3>
                    <p className="text-gray-400 text-sm truncate" title={downloadModal.fileName}>{downloadModal.fileName}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  {downloadModal.directUrl
                    ? 'Arquivo grande detectado. Para evitar reiniciar a página no iPhone, o download será feito pelo navegador. Depois, use “Compartilhar” → “Salvar em Arquivos”.'
                    : isIOSDevice
                      ? 'Toque em “Salvar no iPhone” e escolha “Salvar em Arquivos”.'
                      : 'Toque em “Salvar” para finalizar o download.'}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDownloadedFile}
                    className="flex-1 py-3 bg-primary-teal hover:bg-primary-brown text-white rounded-lg transition-smooth cursor-pointer font-medium"
                  >
                    {downloadModal.directUrl ? 'Baixar no navegador' : (isIOSDevice ? 'Salvar no iPhone' : 'Salvar')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDownloadModal((m) => ({ ...m, show: false }))}
                    className="px-5 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer font-medium"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
            {downloadModal.status === 'error' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <i className="ri-error-warning-line text-red-400 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Erro no download</h3>
                    <p className="text-gray-400 text-sm truncate" title={downloadModal.fileName}>{downloadModal.fileName}</p>
                  </div>
                </div>
                <p className="text-red-400/90 text-sm mb-4">{downloadModal.errorMessage}</p>
                <button
                  type="button"
                  onClick={() => setDownloadModal((m) => ({ ...m, show: false }))}
                  className="w-full py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer font-medium"
                >
                  Fechar
                </button>
              </>
            )}
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

      {/* Menu de 3 pontinhos renderizado fora do card (portal) para não ser cortado pelo overflow */}
      {openActionMenuAnchor && createPortal(
        <div
          className="fixed py-1 min-w-[160px] bg-dark-card border border-dark-border rounded-lg shadow-xl z-[9999]"
          style={{
            top: openActionMenuAnchor.bottom + 4,
            left: Math.max(8, Math.min(openActionMenuAnchor.right - 160, window.innerWidth - 168)),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {openActionMenuArquivo ? (
            <>
              {openActionMenuArquivo.arquivo_url && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenActionMenuId(null);
                    setOpenActionMenuAnchor(null);
                    setOpenActionMenuArquivo(null);
                    handleDownloadFile(openActionMenuArquivo, e);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-primary-teal hover:bg-dark-hover flex items-center gap-2 cursor-pointer"
                >
                  <i className="ri-download-line"></i> Download
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenActionMenuId(null);
                  setOpenActionMenuAnchor(null);
                  setOpenActionMenuArquivo(null);
                  abrirModalEditar(openActionMenuArquivo);
                }}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-dark-hover flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-edit-line"></i> Renomear
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenActionMenuId(null);
                  setOpenActionMenuAnchor(null);
                  setOpenActionMenuArquivo(null);
                  deletarItem(openActionMenuArquivo);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-dark-hover flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-delete-bin-line"></i> Excluir
              </button>
            </>
          ) : openActionMenuPasta ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenActionMenuId(null);
                  setOpenActionMenuAnchor(null);
                  setOpenActionMenuPasta(null);
                  abrirModalEditar(openActionMenuPasta);
                }}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-dark-hover flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-edit-line"></i> Renomear
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenActionMenuId(null);
                  setOpenActionMenuAnchor(null);
                  setOpenActionMenuPasta(null);
                  deletarItem(openActionMenuPasta);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-dark-hover flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-delete-bin-line"></i> Excluir
              </button>
            </>
          ) : null}
        </div>,
        document.body
      )}
    </div>
  );
}
