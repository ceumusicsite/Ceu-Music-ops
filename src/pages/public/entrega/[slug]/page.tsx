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
}

interface Entrega {
    id: string;
    cliente_nome: string;
    slug: string;
    items: any[];
    created_at: string;
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

            setEntrega(entregaData);

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

    const handleDownload = async (anexo: Anexo) => {
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
                                className="group bg-white/[0.02] border border-white/5 hover:border-primary-teal/30 hover:bg-white/[0.04] rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col"
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
                                <div className="mt-auto">
                                    <button
                                        onClick={() => handleDownload(anexo)}
                                        disabled={downloadingItems[anexo.id]}
                                        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${downloadingItems[anexo.id]
                                            ? 'bg-dark-bg text-primary-teal cursor-wait'
                                            : anexo.tipo === 'pasta'
                                                ? 'bg-primary-teal hover:bg-primary-teal-dark text-dark-bg shadow-lg shadow-primary-teal/10'
                                                : 'bg-primary-teal/10 text-primary-teal hover:bg-primary-teal hover:text-dark-bg hover:shadow-lg hover:shadow-primary-teal/20'
                                            }`}
                                    >
                                        {downloadingItems[anexo.id] ? (
                                            <><i className="ri-loader-4-line animate-spin text-lg"></i> Abrindo...</>
                                        ) : anexo.tipo === 'pasta' ? (
                                            <><i className="ri-folder-open-line text-lg"></i> Abrir Pasta</>
                                        ) : (
                                            <><i className="ri-download-line text-lg"></i> Download</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

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
