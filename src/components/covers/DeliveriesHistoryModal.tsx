import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface DeliveryRecord {
    id: string;
    cliente_nome: string;
    slug: string;
    items: any[];
    created_at: string;
    expira_em: string | null;
    visualizacoes: number;
}

interface DeliveriesHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DeliveriesHistoryModal({ isOpen, onClose }: DeliveriesHistoryModalProps) {
    const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);
    const toast = useToast();

    useEffect(() => {
        if (isOpen) {
            loadDeliveries();
        }
    }, [isOpen]);

    const loadDeliveries = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('covers_entregas')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDeliveries(data || []);
        } catch (error: any) {
            toast.error(`Erro ao carregar histórico: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (slug: string) => {
        const url = `${window.location.origin}/public/entrega/${slug}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copiado com sucesso!');
    };

    const isExpired = (expira_em: string | null) => {
        if (!expira_em) return false;
        return new Date(expira_em) < new Date();
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date(dateStr));
        } catch (e) {
            return dateStr;
        }
    };

    const formatDateShort = (dateStr: string) => {
        try {
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            }).format(new Date(dateStr));
        } catch (e) {
            return dateStr;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden scale-in-center animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-6 border-b border-dark-border flex items-center justify-between bg-dark-bg/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-teal/10 flex items-center justify-center">
                            <i className="ri-history-line text-xl text-primary-teal"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Histórico de Entregas</h3>
                            <p className="text-xs text-gray-400">Registro de todos os links gerados para clientes</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-dark-hover rounded-lg text-gray-400 transition-colors">
                        <i className="ri-close-line text-2xl"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Lista de Entregas */}
                    <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${selectedDelivery ? 'hidden md:block' : 'block'}`}>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="w-10 h-10 border-2 border-primary-teal/20 border-t-primary-teal rounded-full animate-spin mb-4"></div>
                                <p className="text-gray-500 text-sm">Carregando histórico...</p>
                            </div>
                        ) : deliveries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <i className="ri-inbox-line text-5xl text-gray-700 mb-4"></i>
                                <h4 className="text-white font-bold">Nenhuma entrega encontrada</h4>
                                <p className="text-gray-500 text-sm max-w-[200px] mx-auto mt-1">Os links que você gerar aparecerão aqui.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {deliveries.map((delivery) => (
                                    <div
                                        key={delivery.id}
                                        onClick={() => setSelectedDelivery(delivery)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer group ${selectedDelivery?.id === delivery.id
                                                ? 'bg-primary-teal/10 border-primary-teal'
                                                : 'bg-dark-bg/40 border-dark-border hover:border-gray-700 hover:bg-dark-bg/60'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <h4 className="text-white font-bold truncate">{delivery.cliente_nome}</h4>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                        <i className="ri-calendar-line"></i>
                                                        {formatDate(delivery.created_at)}
                                                    </span>
                                                    <span className={`text-[10px] flex items-center gap-1 ${isExpired(delivery.expira_em) ? 'text-red-400' : 'text-green-400'}`}>
                                                        <i className={isExpired(delivery.expira_em) ? "ri-time-line" : "ri-shield-check-line"}></i>
                                                        {delivery.expira_em
                                                            ? (isExpired(delivery.expira_em) ? 'Expirado' : `Expira em ${formatDateShort(delivery.expira_em)}`)
                                                            : 'Nunca expira'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="px-2 py-1 bg-dark-bg rounded text-[10px] text-gray-400 flex items-center gap-1">
                                                    <i className="ri-eye-line"></i>
                                                    {delivery.visualizacoes || 0}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyToClipboard(delivery.slug);
                                                    }}
                                                    className="p-2 bg-dark-hover hover:bg-primary-teal/20 text-gray-400 hover:text-primary-teal rounded-lg transition-all"
                                                    title="Copiar Link"
                                                >
                                                    <i className="ri-file-copy-line"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detalhes da Entrega Selecionada */}
                    {selectedDelivery && (
                        <div className="w-full md:w-80 lg:w-[400px] border-l border-dark-border bg-dark-card p-6 flex flex-col animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-bold text-white flex items-center gap-2">
                                    <i className="ri-information-line text-primary-teal"></i>
                                    Detalhes da Entrega
                                </h4>
                                <button onClick={() => setSelectedDelivery(null)} className="md:hidden p-2 text-gray-400">
                                    <i className="ri-arrow-left-line"></i>
                                </button>
                            </div>

                            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">Cliente</label>
                                    <p className="text-white font-medium">{selectedDelivery.cliente_nome}</p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">Itens Incluídos ({selectedDelivery.items.length})</label>
                                    <div className="space-y-2 mt-2">
                                        {selectedDelivery.items.slice(0, 15).map((item: any, idx: number) => (
                                            <div key={item.id || idx} className="flex items-center gap-2 text-xs text-gray-400 py-1.5 px-2 bg-dark-bg/50 rounded-lg border border-dark-border/50">
                                                <i className={item.tipo === 'pasta' ? "ri-folder-fill text-primary-teal/60" : "ri-file-line"}></i>
                                                <span className="truncate">{item.nome}</span>
                                            </div>
                                        ))}
                                        {selectedDelivery.items.length > 15 && (
                                            <p className="text-[10px] text-gray-600 text-center pt-1">+ {selectedDelivery.items.length - 15} outros itens</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">Gerado em</label>
                                        <p className="text-xs text-gray-300">{formatDate(selectedDelivery.created_at)}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-1">Status</label>
                                        <p className={`text-xs font-bold ${isExpired(selectedDelivery.expira_em) ? 'text-red-400' : 'text-green-400'}`}>
                                            {isExpired(selectedDelivery.expira_em) ? 'Expirado' : 'Ativo'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-dark-border mt-auto">
                                <button
                                    onClick={() => copyToClipboard(selectedDelivery.slug)}
                                    className="w-full py-3 bg-gradient-primary text-white font-bold rounded-xl shadow-lg shadow-primary-teal/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="ri-file-copy-line"></i>
                                    Copiar Link de Entrega
                                </button>
                                <a
                                    href={`/public/entrega/${selectedDelivery.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3 bg-dark-hover text-gray-300 hover:text-white font-bold rounded-xl border border-dark-border transition-all flex items-center justify-center gap-2 mt-3 text-sm"
                                >
                                    <i className="ri-external-link-line"></i>
                                    Visualizar Página
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
