import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface NovoProdutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProdutor: { id: string; nome: string; especialidade?: string }) => void;
}

export default function NovoProdutorModal({
  isOpen,
  onClose,
  onSuccess,
}: NovoProdutorModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    especialidade: 'Produtor Musical',
    contato_email: '',
    contato_telefone: '',
    instagram: '',
    observacoes: '',
  });

  if (!isOpen) return null;

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 11);
    if (limitedNumbers.length <= 2) {
      return limitedNumbers ? `(${limitedNumbers}` : '';
    } else if (limitedNumbers.length <= 6) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    } else if (limitedNumbers.length <= 10) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`;
    } else {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, contato_telefone: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      alert('Por favor, preencha o nome do produtor.');
      return;
    }

    setLoading(true);
    try {
      const produtorData: any = {
        nome: formData.nome.trim(),
        especialidade: formData.especialidade.trim() || 'Produtor Musical',
        contato_email: formData.contato_email.trim() || null,
        contato_telefone: formData.contato_telefone.trim() || null,
        instagram: formData.instagram.trim() || null,
        observacoes: formData.observacoes.trim() || null,
        status: 'disponivel',
        anos_experiencia: 0,
        artistas_trabalhados: '[]',
        projetos: '[]',
      };

      const { data, error } = await supabase
        .from('produtores')
        .insert([produtorData])
        .select('id, nome, especialidade')
        .single();

      if (error) throw error;

      toast.success('Produtor cadastrado com sucesso!');
      onSuccess(data);
      onClose();
      setFormData({
        nome: '',
        especialidade: 'Produtor Musical',
        contato_email: '',
        contato_telefone: '',
        instagram: '',
        observacoes: '',
      });
    } catch (error: any) {
      console.error('Erro ao cadastrar produtor:', error);
      alert(`Erro ao cadastrar produtor: ${error?.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-dark-border flex items-center justify-between bg-dark-bg/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-teal/10 border border-primary-teal/20 flex items-center justify-center text-primary-teal">
              <i className="ri-user-add-line text-lg"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cadastrar Produtor</h2>
              <p className="text-xs text-gray-400">Adicionar novo produtor musical ao sistema</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-dark-hover transition-smooth cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Nome do Produtor <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome do produtor..."
              className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Especialidade / Função
            </label>
            <input
              type="text"
              value={formData.especialidade}
              onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
              placeholder="Ex: Produtor Musical, Arranjador, Mixador"
              className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={formData.contato_telefone}
                onChange={handlePhoneChange}
                placeholder="(83) 99999-9999"
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Instagram
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@produtor"
                className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={formData.contato_email}
              onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
              placeholder="produtor@email.com"
              className="w-full px-3.5 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-dark-bg hover:bg-dark-hover text-gray-300 hover:text-white rounded-lg text-sm transition-smooth cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-primary text-white font-medium rounded-lg text-sm hover:opacity-90 transition-smooth cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Salvando...
                </>
              ) : (
                <>
                  <i className="ri-save-line"></i>
                  Cadastrar Produtor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
