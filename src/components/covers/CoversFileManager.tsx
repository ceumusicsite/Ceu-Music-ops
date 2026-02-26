import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { storageService, R2_BUCKETS } from '../../services/storage';
import { getSignedUrlR2, uploadToR2 } from '../../lib/r2';
import { useToast } from '../../contexts/ToastContext';
import { getBrowserViewableUrl } from '../../utils/storageUrl';
import StreamPreview from '../projetos/StreamPreview';
import { createStreamVideoFromUrl, getStreamIframeUrl } from '../../services/stream';
import DeliverMaterialModal from './DeliverMaterialModal';

interface Anexo {
    id: string;
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

export default function CoversFileManager() {
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

    // Modo Seleção para Entrega
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [showDeliverModal, setShowDeliverModal] = useState(false);

    const [clipboard, setClipboard] = useState<{ items: Anexo[]; action: 'copy' | 'cut' } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: Anexo | null; targetFolderId: string | null } | null>(null);
    const [dragState, setDragState] = useState<{ item: Anexo; dragOverFolderId: string | null; dragOverArea: boolean } | null>(null);
    const [colando, setColando] = useState(false);
    const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
    const [modoOrganizar, setModoOrganizar] = useState(false);
    const [itemSelecionadoParaMover, setItemSelecionadoParaMover] = useState<Anexo | null>(null);
    const [videoThumbUrls, setVideoThumbUrls] = useState<Record<string, string>>({});
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
    }, [pastaAtual]);

    const requestedVideoIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        setVideoThumbUrls({});
        requestedVideoIdsRef.current = new Set();
    }, [pastaAtual]);

    useEffect(() => {
        if (!openActionMenuId) return;
        const close = () => {
            setOpenActionMenuId(null);
        };
        window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    }, [openActionMenuId]);

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

    useEffect(() => {
        if (!contextMenu) return;
        const close = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
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
                const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL as string | undefined;
                let sourceUrl: string;
                if (publicUrl) {
                    sourceUrl = `${publicUrl.replace(/\/$/, '')}/${arquivo.arquivo_key}`;
                } else {
                    sourceUrl = await getSignedUrlR2(R2_BUCKETS.ANEXOS, arquivo.arquivo_key, 24 * 3600);
                }
                const result = await createStreamVideoFromUrl({
                    sourceUrl,
                    name: arquivo.nome,
                    meta: { coversAnexoId: arquivo.id },
                });
                const streamIframeUrl = getStreamIframeUrl(result.uid) || undefined;
                if (cancelled) return;
                await supabase
                    .from('covers_anexos')
                    .update({ stream_uid: result.uid, stream_iframe_url: streamIframeUrl })
                    .eq('id', arquivo.id);
                if (cancelled) return;
                setPreviewArquivo((prev) =>
                    prev?.id === arquivo.id
                        ? { ...prev, stream_uid: result.uid, stream_iframe_url: streamIframeUrl }
                        : prev
                );
                setAnexos((prev) =>
                    prev.map((item) =>
                        item.id === arquivo.id
                            ? { ...item, stream_uid: result.uid, stream_iframe_url: streamIframeUrl }
                            : item
                    )
                );

                if (!result.readyToStream) {
                    setStreamProcessing(true);
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    if (cancelled) return;
                    setStreamProcessing(false);
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
    }, [previewArquivo?.id]);

    const loadAnexos = async () => {
        try {
            setLoading(true);
            let query = supabase.from('covers_anexos').select('*');

            if (pastaAtual === null) {
                query = query.is('pasta_pai_id', null);
            } else {
                query = query.eq('pasta_pai_id', pastaAtual);
            }

            const { data, error } = await query
                .order('tipo', { ascending: true })
                .order('ordem', { ascending: true })
                .order('nome', { ascending: true });

            if (error) {
                if (error.code === '42P01') {
                    setTabelaNaoExiste(true);
                    setAnexos([]);
                    return;
                }
                throw error;
            }

            setTabelaNaoExiste(false);
            setAnexos(data || []);
        } catch (error: any) {
            console.error('Erro ao carregar anexos:', error);
            setErroCarregamento(error.message || 'Erro desconhecido');
            setAnexos([]);
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

    const getValidUrl = async (anexo: Anexo): Promise<string> => {
        const publicUrl = import.meta.env.VITE_R2_PUBLIC_URL as string | undefined;
        if (anexo.arquivo_key && publicUrl) {
            const base = publicUrl.replace(/\/$/, '');
            return `${base}/${anexo.arquivo_key}`;
        }
        if (anexo.arquivo_key) {
            try {
                const novaUrl = await getSignedUrlR2(R2_BUCKETS.ANEXOS, anexo.arquivo_key, 86400);
                try {
                    await supabase.from('covers_anexos').update({ arquivo_url: novaUrl }).eq('id', anexo.id);
                } catch (e) { }
                return novaUrl;
            } catch (error: any) {
                if (anexo.arquivo_url) return anexo.arquivo_url;
                throw error;
            }
        }
        if (anexo.arquivo_url) return anexo.arquivo_url;
        throw new Error('Arquivo inválido');
    };

    const handleDownloadFile = async (anexo: Anexo, event?: React.MouseEvent) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (anexo.tipo !== 'arquivo' || (!anexo.arquivo_key && !anexo.arquivo_url)) return;
        const fileName = anexo.nome || 'download';
        downloadBlobRef.current = null;
        downloadMimeRef.current = anexo.arquivo_tipo || '';
        try {
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
                downloadUrl = url.includes('r2.cloudflarestorage.com')
                    ? getBrowserViewableUrl(url, R2_BUCKETS.ANEXOS, anexo.arquivo_key)
                    : url;
            }

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

            const IOS_MAX_IN_MEMORY_BYTES = 40 * 1024 * 1024;
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
            const contentLength = res.headers.get('Content-Length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            const reader = res.body?.getReader();
            if (!reader) {
                const blob = await res.blob();
                downloadBlobRef.current = blob;
                setDownloadModal((m) => ({ ...m, indeterminate: false, progress: 100, status: 'done' }));
                return;
            }
            const chunks: any[] = [];
            let received = 0;

            setDownloadModal((m) => ({ ...m, indeterminate: !(total > 0), totalBytes: total }));
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    chunks.push(value);
                    received += value.length;
                    setDownloadModal((m) => ({ ...m, receivedBytes: received, progress: total > 0 ? Math.round((received / total) * 100) : 0 }));
                }
            }
            downloadBlobRef.current = new Blob(chunks);
            setDownloadModal((m) => ({ ...m, indeterminate: false, progress: 100, status: 'done' }));
        } catch (error: any) {
            setDownloadModal((m) => ({ ...m, status: 'error', errorMessage: error.message }));
        }
    };

    const handleSaveDownloadedFile = useCallback(async () => {
        if (downloadModal.directUrl) {
            window.open(downloadModal.directUrl, '_blank', 'noopener,noreferrer');
            return;
        }
        const blob = downloadBlobRef.current;
        if (!blob) return;
        const fileName = downloadModal.fileName || 'download';

        if (isIOSDevice) {
            try {
                const file = new File([blob], fileName, { type: downloadMimeRef.current });
                if (navigator?.canShare?.({ files: [file] }) && navigator?.share) {
                    await navigator.share({ files: [file], title: fileName });
                    return;
                }
            } catch (e) { }
            const objectUrl = URL.createObjectURL(blob);
            window.open(objectUrl, '_blank');
            return;
        }

        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl; a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }, [downloadModal.directUrl, downloadModal.fileName, isIOSDevice]);

    const criarPasta = async () => {
        if (!newFolderName.trim()) return;
        try {
            const { error } = await supabase
                .from('covers_anexos')
                .insert({
                    tipo: 'pasta',
                    nome: newFolderName.trim(),
                    pasta_pai_id: pastaAtual,
                    ordem: anexos.filter(a => a.tipo === 'pasta').length,
                });
            if (error) throw error;
            setNewFolderName(''); setShowCreateFolderModal(false); loadAnexos();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        }
    };

    const fazerUpload = async () => {
        if (selectedFiles.length === 0) return;
        try {
            setUploading(true);
            let pastaPath = 'covers';
            if (pastaAtual) {
                const { data } = await supabase.from('covers_anexos').select('nome').eq('id', pastaAtual).single();
                if (data) pastaPath = `covers/${normalizeNome(data.nome)}`;
            }

            for (const file of selectedFiles) {
                const result = await uploadToR2(file, { bucket: R2_BUCKETS.ANEXOS, folder: pastaPath });
                const { error } = await supabase
                    .from('covers_anexos')
                    .insert({
                        tipo: 'arquivo',
                        nome: file.name,
                        pasta_pai_id: pastaAtual,
                        arquivo_key: result.key,
                        arquivo_url: result.url,
                        arquivo_tamanho: file.size,
                        arquivo_tipo: file.type,
                        arquivo_extensao: file.name.split('.').pop()?.toLowerCase(),
                        ordem: anexos.filter(a => a.tipo === 'arquivo').length,
                    });
                if (error) throw error;
            }
            setSelectedFiles([]); setShowUploadModal(false); loadAnexos();
        } catch (error: any) {
            alert(`Upload falhou: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, item: Anexo) => {
        setDragState({ item, dragOverFolderId: null, dragOverArea: false });
        e.dataTransfer.setData('itemId', item.id);
        e.dataTransfer.effectAllowed = 'move';

        // Custom ghost image
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '0.4';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
        setDragState(null);
    };

    const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragState && dragState.item.id !== folderId) {
            setDragState({ ...dragState, dragOverFolderId: folderId });
        }
    };

    const handleDrop = async (e: React.DragEvent, destPastaId: string | null) => {
        e.preventDefault();
        e.stopPropagation();

        const itemId = e.dataTransfer.getData('itemId');
        if (!itemId) {
            setDragState(null);
            return;
        }

        // Evitar soltar em si mesmo ou na pasta onde já está
        const itemSendoMovido = anexos.find(a => a.id === itemId) || dragState?.item;
        if (!itemSendoMovido || itemSendoMovido.id === destPastaId || itemSendoMovido.pasta_pai_id === destPastaId) {
            setDragState(null);
            return;
        }

        try {
            const { error } = await supabase
                .from('covers_anexos')
                .update({ pasta_pai_id: destPastaId })
                .eq('id', itemId);

            if (error) throw error;
            toast.success('Item movido com sucesso');
            loadAnexos();
        } catch (error: any) {
            toast.error(`Erro ao mover item: ${error.message}`);
        } finally {
            setDragState(null);
        }
    };

    const entrarNaPasta = (pastaId: string, nomePasta: string) => {
        setPastaAtual(pastaId);
        setBreadcrumbs([...breadcrumbs, { id: pastaId, nome: nomePasta }]);
    };

    const voltarPasta = (index: number) => {
        const novoBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(novoBreadcrumbs);
        setPastaAtual(novoBreadcrumbs[novoBreadcrumbs.length - 1].id);
    };

    const deletarItem = async (item: Anexo) => {
        if (!confirm(`Deseja realmente deletar "${item.nome}"?`)) return;
        try {
            if (item.tipo === 'arquivo' && item.arquivo_key) {
                await storageService.delete(R2_BUCKETS.ANEXOS, item.arquivo_key);
            }
            const { error } = await supabase.from('covers_anexos').delete().eq('id', item.id);
            if (error) throw error;
            toast.success('Item deletado');
            loadAnexos();
        } catch (e: any) {
            toast.error(`Erro ao deletar: ${e.message}`);
        }
    };

    const colarItem = async (destPastaId: string | null) => {
        if (!clipboard) return;
        setColando(true);
        try {
            for (const item of clipboard.items) {
                if (clipboard.action === 'cut') {
                    await supabase.from('covers_anexos').update({ pasta_pai_id: destPastaId }).eq('id', item.id);
                }
            }
            setClipboard(null);
            toast.success('Itens colados');
            loadAnexos();
        } finally {
            setColando(false);
        }
    };

    const moverItemParaPasta = async (item: Anexo, destPastaId: string | null) => {
        if (item.id === destPastaId) return;
        try {
            await supabase.from('covers_anexos').update({ pasta_pai_id: destPastaId }).eq('id', item.id);
            loadAnexos();
        } catch (e: any) {
            alert(`Erro ao mover: ${e.message}`);
        }
    };

    const isArquivoImagem = (arquivo: Anexo) => arquivo.arquivo_tipo?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(arquivo.arquivo_extensao || '');
    const isArquivoVideo = (arquivo: Anexo) => arquivo.arquivo_tipo?.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(arquivo.arquivo_extensao || '');
    const isArquivoAudio = (arquivo: Anexo) => arquivo.arquivo_tipo?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(arquivo.arquivo_extensao || '');
    const isArquivoPdf = (arquivo: Anexo) => arquivo.arquivo_tipo?.includes('pdf') || arquivo.arquivo_extensao === 'pdf';

    const getIconeArquivo = (ext?: string) => {
        if (!ext) return 'ri-file-line';
        const e = ext.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(e)) return 'ri-image-2-fill';
        if (['mp3', 'wav', 'ogg', 'm4a'].includes(e)) return 'ri-music-2-fill';
        if (['mp4', 'mov', 'webm', 'avi'].includes(e)) return 'ri-video-fill';
        if (e === 'pdf') return 'ri-file-pdf-2-fill';
        if (['zip', 'rar', '7z'].includes(e)) return 'ri-folder-zip-fill';
        return 'ri-file-3-fill';
    };

    const toggleSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedItemIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const anexosFiltrados = anexos.filter(a => a.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    const pastas = anexosFiltrados.filter(a => a.tipo === 'pasta');
    const arquivos = anexosFiltrados.filter(a => a.tipo === 'arquivo');

    return (
        <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden transition-all duration-300">
            {/* Header com busca e botões */}
            <div className="p-4 sm:p-5 border-b border-dark-border bg-dark-bg/50 backdrop-blur-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-teal/10 flex items-center justify-center">
                            <i className="ri-folder-music-line text-xl text-primary-teal"></i>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Drive de Covers</h2>
                            <p className="text-[11px] text-gray-400">Utilize para gerenciar todos os arquivos e materiais dos clientes da céu music</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectionMode ? (
                            <>
                                <button
                                    onClick={() => {
                                        setSelectionMode(false);
                                        setSelectedItemIds(new Set());
                                    }}
                                    className="px-4 py-2 bg-dark-bg hover:bg-dark-hover border border-dark-border text-gray-400 rounded-lg flex items-center justify-center transition-all text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        if (selectedItemIds.size === anexos.length) {
                                            setSelectedItemIds(new Set());
                                        } else {
                                            setSelectedItemIds(new Set(anexos.map(a => a.id)));
                                        }
                                    }}
                                    className="px-4 py-2 bg-dark-bg hover:bg-dark-hover border border-dark-border text-white rounded-lg flex items-center justify-center transition-all text-sm"
                                >
                                    {selectedItemIds.size === anexos.length ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
                                </button>
                                <button
                                    onClick={() => {
                                        if (selectedItemIds.size > 0) setShowDeliverModal(true);
                                    }}
                                    disabled={selectedItemIds.size === 0}
                                    className={`px-4 py-2 text-white rounded-lg flex items-center justify-center gap-2 transition-all text-sm shadow-lg ${selectedItemIds.size > 0
                                        ? 'bg-gradient-primary shadow-primary-teal/20 hover:scale-[1.02]'
                                        : 'bg-dark-hover border border-dark-border opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    <i className="ri-send-plane-fill font-bold"></i>
                                    <span className="font-bold">Gerar Entrega ({selectedItemIds.size})</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setSelectionMode(true)}
                                    className="px-4 py-2 bg-primary-teal/10 hover:bg-primary-teal/20 border border-primary-teal/30 text-primary-teal rounded-lg flex items-center justify-center gap-2 transition-smooth text-sm font-semibold"
                                >
                                    <i className="ri-send-plane-fill"></i>
                                    <span className="hidden sm:inline">Entregar Material</span>
                                </button>
                                <button
                                    onClick={() => setShowCreateFolderModal(true)}
                                    className="px-4 py-2 bg-dark-bg hover:bg-dark-hover border border-dark-border text-white rounded-lg flex items-center justify-center gap-2 transition-smooth group text-sm"
                                    title="Nova Pasta"
                                >
                                    <i className="ri-folder-add-line text-gray-400 group-hover:text-primary-teal transition-colors"></i>
                                </button>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="px-4 py-2 bg-gradient-primary text-white rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary-teal/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                                >
                                    <i className="ri-upload-cloud-line font-bold"></i>
                                    <span className="font-bold hidden sm:inline">Upload</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                    {/* Breadcrumbs com design melhorado */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={index} className="flex items-center gap-2 whitespace-nowrap">
                                <button
                                    onClick={() => voltarPasta(index)}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${index === breadcrumbs.length - 1
                                        ? 'bg-primary-teal/10 text-primary-teal font-semibold'
                                        : 'text-gray-400 hover:text-white hover:bg-dark-hover'
                                        }`}
                                >
                                    {index === 0 && <i className="ri-home-4-line mr-1.5"></i>}
                                    {crumb.nome}
                                </button>
                                {index < breadcrumbs.length - 1 && (
                                    <i className="ri-arrow-right-s-line text-gray-600"></i>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Barra de busca mais elegante */}
                    <div className="relative w-full md:w-80 group">
                        <i className="ri-search-2-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-teal transition-colors"></i>
                        <input
                            type="text"
                            placeholder="Buscar no drive..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-dark-bg/80 border border-dark-border focus:border-primary-teal/50 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-4 focus:ring-primary-teal/5 transition-all shadow-inner"
                        />
                    </div>
                </div>
            </div>

            {/* Grid de Itens */}
            <div
                className={`p-6 min-h-[500px] transition-colors duration-300 ${dragState?.dragOverArea ? 'bg-primary-teal/5' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragState(prev => prev ? { ...prev, dragOverArea: true } : null); }}
                onDragLeave={() => setDragState(prev => prev ? { ...prev, dragOverArea: false } : null)}
                onDrop={(e) => handleDrop(e, pastaAtual)}
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-primary-teal/10 border-t-primary-teal rounded-full animate-spin"></div>
                            <i className="ri-folder-music-fill absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-teal text-xl"></i>
                        </div>
                        <p className="text-gray-400 animate-pulse font-medium">Carregando seus arquivos...</p>
                    </div>
                ) : anexosFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-24 h-24 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center mb-6 shadow-xl">
                            <i className="ri-folder-open-line text-5xl text-gray-600"></i>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Nada por aqui</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">Esta pasta está vazia ou nenhum arquivo corresponde à sua busca.</p>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="mt-8 px-6 py-2 bg-dark-bg hover:bg-dark-hover border border-dark-border text-white rounded-xl transition-all"
                        >
                            Começar Upload
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 3xl:grid-cols-12 gap-4">
                        {/* Render Pastas */}
                        {pastas.map(pasta => (
                            <div
                                key={pasta.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, pasta)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleDragOver(e, pasta.id)}
                                onDrop={(e) => handleDrop(e, pasta.id)}
                                onClick={() => {
                                    entrarNaPasta(pasta.id, pasta.nome);
                                }}
                                className={`group flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer relative ${dragState?.dragOverFolderId === pasta.id
                                    ? 'bg-primary-teal/10 border-primary-teal border-dashed scale-105 shadow-2xl shadow-primary-teal/20 animate-pulse'
                                    : selectedItemIds.has(pasta.id)
                                        ? 'bg-primary-teal/20 border-primary-teal shadow-xl'
                                        : 'bg-dark-bg/40 border-transparent hover:bg-dark-bg/80 hover:border-primary-teal/30 hover:shadow-xl hover:-translate-y-1'
                                    }`}
                            >
                                {selectionMode && (
                                    <div className="absolute top-2 left-2 z-10 transition-transform hover:scale-110" onClick={(e) => toggleSelection(e, pasta.id)}>
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${selectedItemIds.has(pasta.id) ? 'bg-primary-teal border-primary-teal' : 'border-gray-500 bg-dark-bg'
                                            }`}>
                                            {selectedItemIds.has(pasta.id) && <i className="ri-check-line text-white text-xs font-bold"></i>}
                                        </div>
                                    </div>
                                )}
                                <div className="relative mb-2 mt-2">
                                    <i className="ri-folder-fill text-primary-teal text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-lg"></i>
                                </div>
                                <span className="text-white text-[13px] font-semibold text-center line-clamp-1 px-1 w-full">{pasta.nome}</span>

                                {/* Ações Rápidas */}
                                <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deletarItem(pasta); }}
                                        className="p-1 px-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md backdrop-blur-sm transition-all shadow-lg"
                                        title="Deletar pasta"
                                    >
                                        <i className="ri-delete-bin-6-line text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Render Arquivos */}
                        {arquivos.map(arquivo => (
                            <div
                                key={arquivo.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, arquivo)}
                                onDragEnd={handleDragEnd}
                                onClick={() => {
                                    if (selectionMode) {
                                        toggleSelection({ stopPropagation: () => { } } as any, arquivo.id);
                                    } else {
                                        setPreviewArquivo(arquivo);
                                    }
                                }}
                                className={`group flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer relative ${selectedItemIds.has(arquivo.id)
                                    ? 'bg-primary-teal/20 border-primary-teal shadow-xl'
                                    : 'bg-dark-bg/20 border-transparent hover:bg-dark-bg/60 hover:border-dark-border hover:shadow-xl hover:-translate-y-1'
                                    }`}
                            >
                                {selectionMode && (
                                    <div className="absolute top-2 left-2 z-10 transition-transform hover:scale-110" onClick={(e) => toggleSelection(e, arquivo.id)}>
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${selectedItemIds.has(arquivo.id) ? 'bg-primary-teal border-primary-teal' : 'border-gray-500 bg-dark-bg'
                                            }`}>
                                            {selectedItemIds.has(arquivo.id) && <i className="ri-check-line text-white text-xs font-bold"></i>}
                                        </div>
                                    </div>
                                )}
                                <div className={`relative ${selectionMode ? 'mt-2' : ''} mb-2 flex items-center justify-center w-16 h-16 bg-dark-bg rounded-lg border border-dark-border group-hover:border-primary-teal/30 transition-colors`}>
                                    <i className={`${getIconeArquivo(arquivo.arquivo_extensao)} text-gray-500 text-3xl group-hover:text-primary-teal group-hover:scale-110 transition-all duration-300`}></i>
                                    {arquivo.arquivo_extensao && (
                                        <div className="absolute -bottom-1 -right-1 px-1 py-0.5 bg-dark-card border border-dark-border rounded text-[8px] font-black text-white/50 group-hover:text-primary-teal uppercase">
                                            {arquivo.arquivo_extensao}
                                        </div>
                                    )}
                                </div>
                                <span className="text-gray-200 text-xs font-medium text-center line-clamp-1 px-1 w-full group-hover:text-white transition-colors">{arquivo.nome}</span>

                                {/* Ações Rápidas */}
                                <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deletarItem(arquivo); }}
                                        className="p-1 px-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md backdrop-blur-sm transition-all shadow-lg"
                                        title="Deletar arquivo"
                                    >
                                        <i className="ri-delete-bin-6-line text-xs"></i>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDownloadFile(arquivo); }}
                                        className="p-1 px-1.5 bg-primary-teal/10 hover:bg-primary-teal/20 text-primary-teal rounded-md backdrop-blur-sm transition-all shadow-lg"
                                        title="Baixar agora"
                                    >
                                        <i className="ri-download-2-line text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Entrega */}
            <DeliverMaterialModal
                isOpen={showDeliverModal}
                onClose={() => {
                    setShowDeliverModal(false);
                    setSelectionMode(false);
                    setSelectedItemIds(new Set());
                }}
                isSelectionManual={selectionMode && selectedItemIds.size > 0}
                folderName={breadcrumbs[breadcrumbs.length - 1].nome}
                selectedItems={selectionMode && selectedItemIds.size > 0
                    ? anexos.filter(a => selectedItemIds.has(a.id))
                    : anexos // Se nenhum selecionado, entrega tudo que está na pasta atual
                }
            />

            {/* Modais com design consistente */}
            {showCreateFolderModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300" onClick={() => setShowCreateFolderModal(false)}>
                    <div className="bg-dark-card border border-dark-border rounded-2xl p-8 w-full max-w-md shadow-2xl scale-in-center animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-primary-teal/10 flex items-center justify-center">
                                <i className="ri-folder-add-fill text-2xl text-primary-teal"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-white">Nova Pasta</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Nome da Pasta</label>
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:outline-none focus:border-primary-teal/50 focus:ring-4 focus:ring-primary-teal/5 transition-all text-lg"
                                    placeholder="Ex: Covers 2024"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setShowCreateFolderModal(false)} className="flex-1 py-3 bg-dark-bg hover:bg-dark-hover text-white font-bold rounded-xl transition-all">Cancelar</button>
                                <button onClick={criarPasta} className="flex-1 py-3 bg-gradient-primary text-white font-bold rounded-xl shadow-lg shadow-primary-teal/20 transition-all hover:scale-[1.02]">Criar Pasta</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showUploadModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300" onClick={() => setShowUploadModal(false)}>
                    <div className="bg-dark-card border border-dark-border rounded-2xl p-8 w-full max-w-xl shadow-2xl animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-primary-teal/10 flex items-center justify-center">
                                <i className="ri-upload-cloud-fill text-2xl text-primary-teal"></i>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">Upload de Arquivos</h3>
                                <p className="text-sm text-gray-400">Arraste aqui ou clique para selecionar</p>
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-dark-border rounded-2xl p-12 mb-6 flex flex-col items-center justify-center bg-dark-bg/20 hover:bg-dark-bg/40 hover:border-primary-teal/50 transition-all cursor-pointer group relative overflow-hidden">
                            <input
                                type="file"
                                multiple
                                onChange={e => setSelectedFiles(Array.from(e.target.files || []))}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <i className="ri-file-upload-line text-6xl text-gray-600 mb-4 group-hover:text-primary-teal group-hover:scale-110 transition-all duration-300"></i>
                            <div className="text-center">
                                <p className="text-white font-bold mb-1">
                                    {selectedFiles.length > 0 ? `${selectedFiles.length} arquivos selecionados` : 'Clique para navegar'}
                                </p>
                                <p className="text-xs text-gray-500">Suporta áudio, vídeo, imagem e mais</p>
                            </div>
                            {selectedFiles.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                    {selectedFiles.slice(0, 5).map((f, i) => (
                                        <div key={i} className="px-2 py-1 bg-dark-bg border border-dark-border rounded text-[10px] text-gray-400 max-w-[100px] truncate">
                                            {f.name}
                                        </div>
                                    ))}
                                    {selectedFiles.length > 5 && <span className="text-[10px] text-gray-600">+{selectedFiles.length - 5} mais</span>}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowUploadModal(false)} className="flex-1 py-3 bg-dark-bg hover:bg-dark-hover text-white font-bold rounded-xl transition-all">Cancelar</button>
                            <button
                                onClick={fazerUpload}
                                disabled={uploading || selectedFiles.length === 0}
                                className="flex-1 py-3 bg-gradient-primary text-white font-bold rounded-xl shadow-lg shadow-primary-teal/20 transition-all disabled:opacity-30 disabled:grayscale hover:scale-[1.02]"
                            >
                                {uploading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <i className="ri-loader-4-line animate-spin"></i>
                                        <span>Enviando...</span>
                                    </div>
                                ) : 'Iniciar Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {previewArquivo && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setPreviewArquivo(null)}>
                    <div className="bg-dark-card border border-dark-border rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-dark-border bg-dark-card/80">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-primary-teal/10 flex items-center justify-center">
                                    <i className={`${getIconeArquivo(previewArquivo.arquivo_extensao)} text-xl text-primary-teal`}></i>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-white font-bold truncate pr-4">{previewArquivo.nome}</h3>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{previewArquivo.arquivo_tipo} • {formatBytes(previewArquivo.arquivo_tamanho || 0)}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => handleDownloadFile(previewArquivo)} className="px-5 py-2.5 bg-primary-teal hover:bg-primary-teal/90 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-primary-teal/20">
                                    <i className="ri-download-cloud-2-line"></i>
                                    <span className="hidden sm:inline">Baixar</span>
                                </button>
                                <button onClick={() => setPreviewArquivo(null)} className="p-2.5 text-gray-400 hover:text-white bg-dark-bg hover:bg-dark-hover rounded-xl transition-all border border-dark-border">
                                    <i className="ri-close-line text-2xl"></i>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto bg-black/40 flex items-center justify-center p-6 min-h-[300px]">
                            {isArquivoImagem(previewArquivo) ? (
                                <img src={previewArquivo.arquivo_url} alt={previewArquivo.nome} className="max-h-[60vh] md:max-h-[70vh] object-contain rounded-lg shadow-2xl" />
                            ) : isArquivoVideo(previewArquivo) ? (
                                <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-dark-border">
                                    <video controls autoPlay src={previewArquivo.arquivo_url} className="w-full h-full" />
                                </div>
                            ) : isArquivoAudio(previewArquivo) ? (
                                <div className="bg-dark-card/50 backdrop-blur-md rounded-2xl p-12 border border-dark-border w-full max-w-md flex flex-col items-center gap-8 shadow-2xl">
                                    <div className="relative">
                                        <div className="w-32 h-32 rounded-full bg-primary-teal/10 flex items-center justify-center animate-pulse">
                                            <i className="ri-music-2-fill text-6xl text-primary-teal"></i>
                                        </div>
                                        <div className="absolute inset-0 bg-primary-teal/20 blur-3xl -z-10 animate-pulse"></div>
                                    </div>
                                    <div className="text-center w-full">
                                        <p className="text-white font-bold text-lg mb-4 line-clamp-2">{previewArquivo.nome}</p>
                                        <audio
                                            controls
                                            autoPlay
                                            className="w-full h-10 accent-primary-teal filter grayscale invert brightness-200"
                                        >
                                            <source src={previewArquivo.arquivo_url} type={previewArquivo.arquivo_tipo} />
                                            Seu navegador não suporta áudio.
                                        </audio>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center flex flex-col items-center gap-6 p-12 bg-dark-bg/40 rounded-3xl border border-dark-border border-dashed">
                                    <div className="w-24 h-24 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center shadow-inner">
                                        <i className="ri-file-unknow-line text-5xl text-gray-600"></i>
                                    </div>
                                    <div className="max-w-xs">
                                        <p className="text-gray-400 font-medium mb-4">Pré-visualização indisponível para este tipo de arquivo.</p>
                                        <button
                                            onClick={() => handleDownloadFile(previewArquivo)}
                                            className="w-full py-3 bg-dark-bg hover:bg-dark-hover border border-dark-border text-white font-bold rounded-xl transition-all"
                                        >
                                            Baixar para Visualizar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
