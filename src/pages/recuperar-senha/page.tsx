import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { solicitarRedefinicaoSenha } from '../../services/passwordReset';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (novaSenha.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError('A confirmação da senha não coincide com a nova senha digitada.');
      return;
    }

    setLoading(true);

    try {
      await solicitarRedefinicaoSenha(email, novaSenha);
      setSuccess(true);
    } catch (err: any) {
      console.error('Erro ao solicitar redefinição de senha:', err);
      setError(err.message || 'Erro ao enviar solicitação de redefinição de senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://static.readdy.ai/image/016995f7e8292e3ea703f912413c6e1c/af9e13ed434ed318d1a9a4df0aa3c822.png" 
            alt="Céu Music" 
            className="w-24 h-24 mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Céu Music</h1>
          <p className="text-gray-400">Recuperação e Alteração de Senha</p>
        </div>

        {/* Card Principal */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-8 shadow-xl">
          {!success && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Esqueceu sua senha?</h2>
              <p className="text-sm text-gray-400">
                Informe seu e-mail e a nova senha desejada. A alteração será enviada para aprovação de um administrador.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
              <i className="ri-error-warning-line text-lg flex-shrink-0 mt-0.5"></i>
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-6">
              <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl text-center">
                <div className="w-12 h-12 rounded-full bg-teal-500/20 text-primary-teal flex items-center justify-center mx-auto mb-3">
                  <i className="ri-time-line text-2xl"></i>
                </div>
                <h3 className="font-semibold text-white text-base mb-1">
                  Solicitação Registrada!
                </h3>
                <p className="text-xs text-teal-300 font-medium mb-3">
                  Pendente de aprovação de um administrador
                </p>
                <p className="text-sm text-gray-300 leading-relaxed text-left">
                  Sua nova senha foi registrada de forma segura no sistema. Assim que um administrador da Céu Music aprovar a solicitação no painel de controle, seu acesso será ativado imediatamente com a nova senha digitada.
                </p>
              </div>

              <div className="bg-dark-bg p-3 rounded-lg border border-dark-border text-xs text-gray-400 flex items-center gap-2">
                <i className="ri-shield-check-line text-primary-teal text-base flex-shrink-0"></i>
                <span>Tudo fica registrado para a segurança da sua conta.</span>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
              >
                Voltar para o Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  E-mail cadastrado
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-300">
                    Nova Senha Desejada
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
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  placeholder="Repita a nova senha"
                  required
                  minLength={6}
                />
              </div>

              <div className="bg-dark-bg p-3 rounded-lg border border-dark-border text-xs text-gray-400 flex items-start gap-2">
                <i className="ri-information-line text-primary-teal text-base flex-shrink-0 mt-0.5"></i>
                <span>
                  Por motivos de segurança e autonomia interna, a senha será avaliada e liberada por um administrador da Céu Music.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer disabled:opacity-50 whitespace-nowrap mt-2"
              >
                {loading ? 'Registrando Solicitação...' : 'Solicitar Alteração de Senha'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <a 
              href="/login" 
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
              className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer inline-flex items-center gap-1"
            >
              <i className="ri-arrow-left-line"></i>
              <span>Lembrou sua senha? Fazer login</span>
            </a>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          © 2026 Céu Music. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
