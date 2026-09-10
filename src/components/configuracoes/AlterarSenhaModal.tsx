import { useState } from 'react';
import { alterarSenhaDiretaAdmin } from '../../services/passwordReset';

interface AlterarSenhaModalProps {
  isOpen: boolean;
  usuario: { id: string; name: string; email: string } | null;
  adminId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AlterarSenhaModal({
  isOpen,
  usuario,
  adminId,
  onClose,
  onSuccess,
}: AlterarSenhaModalProps) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !usuario) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (novaSenha.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      await alterarSenhaDiretaAdmin(usuario.id, novaSenha, adminId);
      alert(`Senha do usuário ${usuario.name} (${usuario.email}) alterada com sucesso!`);
      setNovaSenha('');
      setConfirmarSenha('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      setError(err.message || 'Erro ao alterar a senha do usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNovaSenha('');
    setConfirmarSenha('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-dark-border">
          <div className="flex items-center gap-2 text-amber-400">
            <i className="ri-key-2-line text-xl"></i>
            <h2 className="text-lg font-semibold text-white">Alterar Senha do Usuário</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="mb-4 p-3 bg-dark-bg rounded-lg border border-dark-border">
          <p className="text-xs text-gray-400">Usuário selecionado:</p>
          <p className="text-sm font-medium text-white">{usuario.name}</p>
          <p className="text-xs text-primary-teal">{usuario.email}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
            <i className="ri-error-warning-line text-lg flex-shrink-0 mt-0.5"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-300">
                Nova Senha
              </label>
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {mostrarSenha ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              required
              minLength={6}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Confirmar Nova Senha
            </label>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              placeholder="Digite novamente"
            />
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start gap-2">
            <i className="ri-information-line text-base flex-shrink-0 mt-0.5"></i>
            <span>
              A nova senha entrará em vigor imediatamente e esta alteração será registrada no log de auditoria.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-border">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-dark-bg hover:bg-dark-hover text-gray-300 rounded-lg transition-smooth cursor-pointer text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer disabled:opacity-50 text-sm flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-base"></i>
                  Salvando...
                </>
              ) : (
                <>
                  <i className="ri-save-line text-base"></i>
                  Salvar Nova Senha
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
