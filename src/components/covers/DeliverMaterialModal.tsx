import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface DeliverMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItems: any[];
    isSelectionManual: boolean;
    folderName?: string;
}

export default function DeliverMaterialModal({ isOpen, onClose, selectedItems, isSelectionManual, folderName }: DeliverMaterialModalProps) {
    const [clienteNome, setClienteNome] = useState('');
    const [prazoExpira, setPrazoExpira] = useState('7');
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const toast = useToast();

    // Resetar estado quando o modal abrir
    React.useEffect(() => {
        if (isOpen) {
            setClienteNome('');
            setPrazoExpira('7');
            setGeneratedLink('');
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const generateSlug = () => {
        return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
    };

    const handleCreateDelivery = async () => {
        if (!clienteNome.trim()) {
            toast.error('Informe o nome do cliente.');
            return;
        }

        setLoading(true);
        try {
            const slug = generateSlug();

            // Calcular data de expiração
            let expiraEm = null;
            if (prazoExpira !== 'never') {
                const data = new Date();
                data.setDate(data.getDate() + parseInt(prazoExpira));
                expiraEm = data.toISOString();
            }

            // 1. Iniciar com os itens selecionados manualmente
            let allItemsToSnapshot: any[] = [...selectedItems];

            // 2. Resolver recursivamente os filhos das pastas selecionadas
            const fetchRecursive = async (folderIds: string[]) => {
                if (folderIds.length === 0) return;

                const { data: children, error: fetchError } = await supabase
                    .from('covers_anexos')
                    .select('*')
                    .in('pasta_pai_id', folderIds);

                if (fetchError) throw fetchError;

                if (children && children.length > 0) {
                    allItemsToSnapshot = [...allItemsToSnapshot, ...children];
                    const nextFolderIds = children.filter(i => i.tipo === 'pasta').map(i => i.id);
                    if (nextFolderIds.length > 0) {
                        await fetchRecursive(nextFolderIds);
                    }
                }
            };

            const initialFolderIds = selectedItems.filter(i => i.tipo === 'pasta').map(i => i.id);
            if (initialFolderIds.length > 0) {
                await fetchRecursive(initialFolderIds);
            }

            // Remover duplicatas por ID
            const uniqueItemsMap = new Map();
            allItemsToSnapshot.forEach(item => uniqueItemsMap.set(item.id, item));
            const uniqueItems = Array.from(uniqueItemsMap.values());

            if (uniqueItems.length === 0) {
                throw new Error('Nenhum arquivo encontrado para entrega. Se selecionou pastas, verifique se elas contêm arquivos.');
            }

            // Converter para snapshot (incluindo pasta_pai_id para reconstrução da árvore)
            const itemsSnapshot = uniqueItems.map(item => ({
                id: item.id,
                tipo: item.tipo,
                nome: item.nome,
                pasta_pai_id: item.pasta_pai_id,
                arquivo_key: item.arquivo_key,
                arquivo_tamanho: item.arquivo_tamanho,
                arquivo_extensao: item.arquivo_extensao,
                arquivo_tipo: item.arquivo_tipo,
                stream_uid: item.stream_uid,
                stream_iframe_url: item.stream_iframe_url
            }));

            const { error } = await supabase
                .from('covers_entregas')
                .insert({
                    cliente_nome: clienteNome.trim(),
                    slug,
                    items: itemsSnapshot,
                    expira_em: expiraEm
                });

            if (error) throw error;

            const publicUrl = `${window.location.origin}/public/entrega/${slug}`;
            setGeneratedLink(publicUrl);
            toast.success('Link gerado com sucesso!');
        } catch (error: any) {
            toast.error(`Erro ao gerar entrega: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        toast.success('Link copiado para a área de transferência!');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-dark-card border border-dark-border rounded-2xl p-8 w-full max-w-md shadow-2xl scale-in-center animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary-teal/10 flex items-center justify-center">
                        <i className="ri-send-plane-fill text-2xl text-primary-teal"></i>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">Entregar Material</h3>
                        <p className="text-sm text-gray-400">
                            {isSelectionManual
                                ? `${selectedItems.length} ${selectedItems.length === 1 ? 'item selecionado' : 'itens selecionados'}`
                                : `Todos os itens de: ${folderName || 'Pasta Atual'}`}
                        </p>
                    </div>
                </div>

                {!generatedLink ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Nome do Cliente</label>
                            <input
                                type="text"
                                value={clienteNome}
                                onChange={e => setClienteNome(e.target.value)}
                                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:outline-none focus:border-primary-teal/50 focus:ring-4 focus:ring-primary-teal/5 transition-all text-lg"
                                placeholder="Ex: João Silva"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Prazo de Expiração</label>
                            <div className="relative group">
                                <select
                                    value={prazoExpira}
                                    onChange={e => setPrazoExpira(e.target.value)}
                                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white focus:outline-none focus:border-primary-teal/50 focus:ring-4 focus:ring-primary-teal/5 transition-all text-base appearance-none cursor-pointer group-hover:border-dark-hover"
                                >
                                    <option value="7">Expira em 7 dias</option>
                                    <option value="15">Expira em 15 dias</option>
                                    <option value="30">Expira em 30 dias</option>
                                    <option value="90">Expira em 90 dias</option>
                                    <option value="never">Nunca expira</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <i className="ri-arrow-down-s-line text-xl"></i>
                                </div>
                            </div>
                        </div>


                        <div className="bg-primary-teal/10 border border-primary-teal/20 rounded-xl p-4 text-sm text-gray-300 mt-4">
                            <i className="ri-information-line text-primary-teal mr-2"></i>
                            Um link público será gerado com o material selecionado, e o cliente não precisará fazer login para acessar.
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={onClose} className="flex-1 py-3 bg-dark-bg hover:bg-dark-hover text-white font-bold rounded-xl transition-all">Cancelar</button>
                            <button
                                onClick={handleCreateDelivery}
                                disabled={loading || !clienteNome.trim()}
                                className="flex-1 py-3 bg-gradient-primary text-white font-bold rounded-xl shadow-lg shadow-primary-teal/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Gerando...' : 'Gerar Link'}
                            </button>
                        </div>
                    </div>

                ) : (
                    <div className="space-y-4">
                        <div className="text-center py-4">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4">
                                <i className="ri-check-line text-3xl font-bold"></i>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">Pronto para Enviar!</h4>
                            <p className="text-gray-400 text-sm">O link foi gerado com sucesso. Envie para o cliente.</p>
                        </div>

                        <div className="flex bg-dark-bg border border-dark-border rounded-xl overflow-hidden">
                            <input
                                type="text"
                                value={generatedLink}
                                readOnly
                                className="flex-1 bg-transparent px-4 text-gray-300 text-sm focus:outline-none"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="px-4 py-3 bg-dark-hover text-white hover:text-primary-teal transition-colors border-l border-dark-border"
                            >
                                <i className="ri-file-copy-line text-lg"></i>
                            </button>
                        </div>

                        <div className="pt-4">
                            <button onClick={onClose} className="w-full py-3 bg-dark-bg hover:bg-dark-hover text-white font-bold rounded-xl border border-dark-border transition-all">Fechar</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
