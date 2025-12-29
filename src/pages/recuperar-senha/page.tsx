import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err: any) {
      console.error('Erro ao enviar email de recuperação:', err);
      setError(err.message || 'Erro ao enviar email de recuperação. Verifique o e-mail informado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="https://static.readdy.ai/image/016995f7e8292e3ea703f912413c6e1c/af9e13ed434ed318d1a9a4df0aa3c822.png" 
            alt="CEU Music" 
            className="w-24 h-24 mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-white mb-2">CEU Music Ops</h1>
          <p className="text-gray-400">Recuperar senha</p>
        </div>

        {/* Form */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Esqueceu sua senha?</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              <p className="font-medium mb-2">Email enviado com sucesso!</p>
              <p className="text-sm">Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
            </div>
          )}
          
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                  placeholder="seu@email.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enviaremos um link para redefinir sua senha no e-mail informado.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
            >
              Voltar para login
            </button>
          )}

          <div className="mt-6 text-center">
            <a 
              href="/login" 
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
              className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer"
            >
              Lembrou sua senha? Faça login
            </a>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          © 2024 CEU Music. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

