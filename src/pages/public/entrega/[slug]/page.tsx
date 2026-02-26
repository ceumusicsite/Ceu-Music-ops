import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import { getSignedUrlR2 } from '../../../../lib/r2';
import { R2_BUCKETS } from '../../../../services/storage';

interface Anexo {
    id: string;
    tipo: 'pasta' | 'arquivo';
    nome: string;
    pasta_pai_id?: string | null;
    arquivo_key?: string;
    arquivo_tamanho?: number;
    arquivo_extensao?: string;
    arquivo_tipo?: string;
    stream_uid?: string;
    stream_iframe_url?: string;
}

interface Entrega {
    id: string;
    cliente_nome: string;
    slug: string;
    items: any[];
    created_at: string;
    expira_em?: string | null;
    visualizacoes: number;
}

export default function EntregaPublicaPage() {
    const { slug } = useParams<{ slug: string }>();
    const [entrega, setEntrega] = useState<Entrega | null>(null);
    const [anexos, setAnexos] = useState<Anexo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloadingItems, setDownloadingItems] = useState<Record<string, boolean>>({});
    const [currentPastaId, setCurrentPastaId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null; nome: string }>>([]);

    // Estados para Preview
    const [previewArquivo, setPreviewArquivo] = useState<Anexo | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [iosDownloadHint, setIosDownloadHint] = useState(false);


    useEffect(() => {
        if (slug) {
            loadEntrega(slug);
        }
    }, [slug]);

    const loadEntrega = async (slugId: string) => {
        try {
            setLoading(true);
            setError(null);

            // Carregar dados da entrega
            const { data: entregaData, error: entregaError } = await supabase
                .from('covers_entregas')
                .select('*')
                .eq('slug', slugId)
                .single();

            if (entregaError || !entregaData) {
                throw new Error('Entrega não encontrada ou expirada.');
            }

            // Verificar expiração
            if (entregaData.expira_em && new Date(entregaData.expira_em) < new Date()) {
                throw new Error('Este link de entrega expirou.');
            }

            setEntrega(entregaData);

            // Incrementar visualizações (fire and forget)
            supabase.rpc('increment_view_count_covers', { delivery_slug: slugId })
                .then(({ error: rpcError }) => {
                    if (rpcError) {
                        // Se a função RPC não existir, tentar um update direto
                        supabase
                            .from('covers_entregas')
                            .update({ visualizacoes: (entregaData.visualizacoes || 0) + 1 })
                            .eq('slug', slugId)
                            .then(() => { });
                    }
                });

            // Carregar os anexos originais diretamente do snapshot
            if (entregaData.items && Array.isArray(entregaData.items) && entregaData.items.length > 0) {
                // Verificar se é o formato antigo (array de strings/IDs) ou novo (array de objetos)
                if (typeof entregaData.items[0] === 'string') {
                    // Legado: Tentar buscar (pode falhar por RLS, mas tentamos)
                    const { data: anexosData } = await supabase
                        .from('covers_anexos')
                        .select('*')
                        .in('id', entregaData.items);
                    setAnexos(anexosData || []);
                } else {
                    // Novo formato: Snapshot completo
                    setAnexos(entregaData.items as Anexo[]);
                }
            } else {
                setAnexos([]);
            }

        } catch (err: any) {
            console.error('Erro ao carregar entrega:', err);
            setError(err.message || 'Ocorreu um erro ao carregar o material.');
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytes?: number) => {
        if (!bytes || bytes <= 0) return '—';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
        const value = bytes / Math.pow(1024, i);
        return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
    };

    const getIconeArquivo = (ext?: string, tipo?: string) => {
        if (tipo === 'pasta') return 'ri-folder-fill text-primary-teal';
        if (!ext) return 'ri-file-line text-gray-400';
        const e = ext.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(e)) return 'ri-image-2-fill text-blue-400';
        if (['mp3', 'wav', 'ogg', 'm4a'].includes(e)) return 'ri-music-2-fill text-purple-400';
        if (['mp4', 'mov', 'webm', 'avi'].includes(e)) return 'ri-video-fill text-red-400';
        if (e === 'pdf') return 'ri-file-pdf-2-fill text-red-500';
        if (['zip', 'rar', '7z'].includes(e)) return 'ri-folder-zip-fill text-yellow-400';
        return 'ri-file-3-fill text-gray-400';
    };

    const isArquivoImagem = (arquivo: Anexo) => arquivo.arquivo_tipo?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(arquivo.arquivo_extensao || '');
    const isArquivoVideo = (arquivo: Anexo) => arquivo.arquivo_tipo?.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(arquivo.arquivo_extensao || '');
    const isArquivoAudio = (arquivo: Anexo) => arquivo.arquivo_tipo?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(arquivo.arquivo_extensao || '');

    // Filtra os anexos mostrados com base na pasta atual
    const anexosExibidos = anexos.filter(a => {
        // Se estamos em uma pasta, mostramos apenas os filhos dela
        if (currentPastaId) return a.pasta_pai_id === currentPastaId;

        // Se estamos na raiz do compartilhamento, mostramos itens que NÃO têm seu pai presente na lista total
        // (Isso identifica os itens que foram selecionados para compartilhamento ou são raiz do projeto compartilhado)
        const IDsPresentes = new Set(anexos.map(item => item.id));
        return !a.pasta_pai_id || !IDsPresentes.has(a.pasta_pai_id as string);
    });

    const handleOpenFolder = (pasta: Anexo) => {
        setCurrentPastaId(pasta.id);
        setBreadcrumbs(prev => [...prev, { id: pasta.id, nome: pasta.nome }]);
    };

    const navigateToBreadcrumb = (index: number) => {
        if (index === -1) {
            setCurrentPastaId(null);
            setBreadcrumbs([]);
        } else {
            const item = breadcrumbs[index];
            setCurrentPastaId(item.id);
            setBreadcrumbs(breadcrumbs.slice(0, index + 1));
        }
    };

    const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

    const handlePreview = async (anexo: Anexo) => {
        if (anexo.tipo === 'pasta') {
            handleOpenFolder(anexo);
            return;
        }

        if (!anexo.arquivo_key) return;

        setPreviewArquivo(anexo);
        setPreviewLoading(true);
        setPreviewUrl(null);

        try {
            const url = await getSignedUrlR2(R2_BUCKETS.ANEXOS, anexo.arquivo_key, 3600);
            setPreviewUrl(url);
        } catch (error) {
            console.error('Erro ao gerar URL de preview:', error);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleDownload = async (anexo: Anexo, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        if (anexo.tipo === 'pasta') {
            handleOpenFolder(anexo);
            return;
        }

        if (!anexo.arquivo_key) {
            alert('Este arquivo não está disponível para download.');
            return;
        }

        setDownloadingItems(prev => ({ ...prev, [anexo.id]: true }));
        try {
            const fileName = anexo.nome || 'download';
            const safeName = fileName.replace(/[\\"]/g, '');

            if (isMobile()) {
                // Safari bloqueia window.open() após await. Precisamos abrir a janela
                // ANTES do await (sincronamente com o toque), e depois redirecionar.
                const newTab = window.open('', '_blank');

                const openUrl = await getSignedUrlR2(R2_BUCKETS.ANEXOS, anexo.arquivo_key, 3600);

                if (newTab) {
                    newTab.location.href = openUrl;
                } else {
                    // Fallback caso popup seja bloqueado mesmo assim
                    window.location.href = openUrl;
                }

                if (isIOS()) {
                    setIosDownloadHint(true);
                    setTimeout(() => setIosDownloadHint(false), 8000);
                }
            } else {
                // Desktop: download programático normal
                const disposition = `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
                const downloadUrl = await getSignedUrlR2(R2_BUCKETS.ANEXOS, anexo.arquivo_key, 86400, {
                    responseContentDisposition: disposition,
                });

                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = fileName;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Erro no download:', error);
            alert('Falha ao iniciar o download. Tente novamente mais tarde.');
        } finally {
            setDownloadingItems(prev => ({ ...prev, [anexo.id]: false }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 border-4 border-primary-teal/20 border-t-primary-teal rounded-full animate-spin mb-6"></div>
                <p className="text-gray-400 font-medium animate-pulse">Preparando seu material...</p>
            </div>
        );
    }

    if (error || !entrega) {
        return (
            <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4">
                <div className="bg-dark-card border border-dark-border rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="ri-error-warning-fill text-4xl text-red-500"></i>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Link Inválido</h1>
                    <p className="text-gray-400">{error || 'Esta página não existe ou o link expirou.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-dark-bg via-[#0A0A0A] to-primary-teal/5 text-white font-sans selection:bg-primary-teal/30 flex flex-col items-center py-12 px-4 sm:px-6">

            {/* Cabecalho Personalizado Céu Music */}
            <header className="mb-12 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div className="w-24 h-24 mb-6 flex items-center justify-center">
                    <img
                        src="https://static.readdy.ai/image/016995f7e8292e3ea703f912413c6e1c/af9e13ed434ed318d1a9a4df0aa3c822.png"
                        alt="Céu Music"
                        className="w-full h-full object-contain filter drop-shadow-lg"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
                    Olá, <span className="text-primary-teal">{entrega.cliente_nome}</span>!
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">
                    A Céu Music preparou este material exclusivamente para você. Agradecemos imensamente a confiança em nosso trabalho.
                </p>
            </header>

            {/* Container Principal */}
            <main className="w-full max-w-4xl bg-dark-card/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 ease-out">

                <div className="flex flex-col mb-8 border-b border-white/5 pb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1"><i className="ri-folder-music-fill text-primary-teal mr-2"></i>Seus Arquivos</h2>
                            <p className="text-sm text-gray-400">{anexos.length} total de itens disponíveis</p>
                        </div>
                    </div>

                    {/* Navegação Breadcrumbs */}
                    <div className="flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap py-2 scrollbar-none">
                        <button
                            onClick={() => navigateToBreadcrumb(-1)}
                            className={`flex items-center gap-1 transition-colors ${currentPastaId === null ? 'text-primary-teal font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <i className="ri-home-4-line"></i> Início
                        </button>
                        {breadcrumbs.map((crumb, idx) => (
                            <React.Fragment key={crumb.id}>
                                <i className="ri-arrow-right-s-line text-gray-700"></i>
                                <button
                                    onClick={() => navigateToBreadcrumb(idx)}
                                    className={`transition-colors ${idx === breadcrumbs.length - 1 ? 'text-primary-teal font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    {crumb.nome}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {anexosExibidos.length === 0 ? (
                    <div className="text-center py-12">
                        <i className="ri-folder-open-line text-6xl text-gray-700 mb-4 inline-block"></i>
                        <h3 className="text-xl font-semibold text-gray-300">Nenhum arquivo nesta pasta</h3>
                        <p className="text-gray-500 mt-2">Navegue pelas outras pastas ou volte ao início.</p>
                        {currentPastaId && (
                            <button
                                onClick={() => navigateToBreadcrumb(-1)}
                                className="mt-6 px-6 py-2 bg-primary-teal/10 text-primary-teal rounded-xl font-bold hover:bg-primary-teal/20 transition-all"
                            >
                                Voltar ao Início
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {anexosExibidos.map((anexo, idx) => (
                            <div
                                key={anexo.id}
                                onClick={() => handlePreview(anexo)}
                                className="group bg-white/[0.02] border border-white/5 hover:border-primary-teal/30 hover:bg-white/[0.04] rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col cursor-pointer"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-dark-bg border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                        <i className={`${getIconeArquivo(anexo.arquivo_extensao, anexo.tipo)} text-2xl`}></i>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-bold text-gray-200 truncate group-hover:text-white transition-colors" title={anexo.nome}>
                                            {anexo.nome}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 uppercase font-semibold flex items-center gap-2">
                                            {anexo.tipo === 'pasta' ? 'Pasta' : anexo.arquivo_extensao || 'Arquivo'}
                                            {anexo.arquivo_tamanho && anexo.tipo === 'arquivo' && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                                    {formatBytes(anexo.arquivo_tamanho)}
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-auto flex items-center gap-2">
                                    {anexo.tipo === 'pasta' ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenFolder(anexo); }}
                                            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-primary-teal hover:bg-primary-teal-dark text-dark-bg shadow-lg shadow-primary-teal/10"
                                        >
                                            <i className="ri-folder-open-line text-lg"></i> Abrir Pasta
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePreview(anexo); }}
                                                className="flex-1 py-2.5 bg-primary-teal/10 text-primary-teal hover:bg-primary-teal hover:text-dark-bg rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                                            >
                                                <i className={isArquivoVideo(anexo) ? "ri-play-circle-line text-lg" : isArquivoAudio(anexo) ? "ri-headphone-line text-lg" : "ri-eye-line text-lg"}></i>
                                                {isArquivoVideo(anexo) ? 'Assistir' : isArquivoAudio(anexo) ? 'Ouvir' : 'Ver'}
                                            </button>
                                            <button
                                                onClick={(e) => handleDownload(anexo, e)}
                                                disabled={downloadingItems[anexo.id]}
                                                className={`p-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-dark-bg border border-white/5 text-gray-400 hover:text-white hover:border-white/10 ${downloadingItems[anexo.id] ? 'cursor-wait opacity-50' : ''}`}
                                                title="Baixar arquivo"
                                            >
                                                {downloadingItems[anexo.id] ? (
                                                    <i className="ri-loader-4-line animate-spin text-lg"></i>
                                                ) : (
                                                    <i className="ri-download-line text-lg"></i>
                                                )}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal de Preview */}
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
                                <button onClick={() => handleDownload(previewArquivo)} className="px-5 py-2.5 bg-primary-teal hover:bg-primary-teal/90 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-primary-teal/20">
                                    <i className="ri-download-cloud-2-line"></i>
                                    <span className="hidden sm:inline">Baixar</span>
                                </button>
                                <button onClick={() => setPreviewArquivo(null)} className="p-2.5 text-gray-400 hover:text-white bg-dark-bg hover:bg-dark-hover rounded-xl transition-all border border-dark-border">
                                    <i className="ri-close-line text-2xl"></i>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto bg-black/40 flex items-center justify-center p-6 min-h-[300px]">
                            {previewLoading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-primary-teal/20 border-t-primary-teal rounded-full animate-spin"></div>
                                    <p className="text-gray-500 text-sm animate-pulse">Carregando visualização...</p>
                                </div>
                            ) : isArquivoImagem(previewArquivo) && previewUrl ? (
                                <img src={previewUrl} alt={previewArquivo.nome} className="max-h-[60vh] md:max-h-[70vh] object-contain rounded-lg shadow-2xl" />
                            ) : isArquivoVideo(previewArquivo) && (previewUrl || previewArquivo.stream_iframe_url) ? (
                                <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-dark-border">
                                    {previewArquivo.stream_iframe_url ? (
                                        <iframe src={previewArquivo.stream_iframe_url} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
                                    ) : (
                                        <video controls autoPlay src={previewUrl || undefined} className="w-full h-full" />
                                    )}
                                </div>
                            ) : isArquivoAudio(previewArquivo) && previewUrl ? (
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
                                            <source src={previewUrl} type={previewArquivo.arquivo_tipo} />
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
                                            onClick={() => handleDownload(previewArquivo)}
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

            {/* Banner de instrução iOS */}
            {iosDownloadHint && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-dark-card border border-primary-teal/30 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                            <i className="ri-share-box-line text-xl text-primary-teal"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-bold mb-0.5">Salvando no seu iPhone</p>
                            <p className="text-gray-400 text-xs leading-relaxed">
                                O arquivo abriu em uma nova aba. Toque no ícone <strong className="text-gray-200">Compartilhar</strong> (<i className="ri-share-box-line"></i>) e selecione <strong className="text-gray-200">"Salvar no Dispositivo"</strong>.
                            </p>
                        </div>
                        <button onClick={() => setIosDownloadHint(false)} className="text-gray-600 hover:text-gray-400 shrink-0 p-1">
                            <i className="ri-close-line"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* Rodapé */}
            <footer className="mt-16 text-center text-gray-500 text-sm flex flex-col items-center animate-in fade-in duration-1000 delay-500">
                <p>Com carinho,</p>
                <div className="font-bold text-gray-400 text-base mt-1 flex items-center justify-center gap-2">
                    Equipe Céu Music
                    <i className="ri-heart-fill text-red-500/80 animate-pulse"></i>
                </div>
            </footer>
        </div>
    );
}
