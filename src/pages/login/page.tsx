import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
      
      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'E-mail ou senha incorretos. Verifique suas credenciais.';
        // Verificar se pode ser problema de email não confirmado
        if (err.message?.includes('Email not confirmed') || err.status === 400) {
          errorMessage = 'E-mail não confirmado. Verifique sua caixa de entrada e confirme seu e-mail antes de fazer login.';
        }
      } else if (err.message?.includes('Email not confirmed') || err.message?.includes('email_not_confirmed')) {
        errorMessage = 'E-mail não confirmado. Verifique sua caixa de entrada e clique no link de confirmação antes de fazer login.';
      } else if (err.message?.includes('User not found')) {
        errorMessage = 'Usuário não encontrado. Verifique se o e-mail está correto ou crie uma conta.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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
          <p className="text-gray-400">Gestão completa de produção musical</p>
        </div>

        {/* Login Form */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Entrar na plataforma</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <a 
              href="/registro" 
              onClick={(e) => {
                e.preventDefault();
                navigate('/registro');
              }}
              className="block text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer"
            >
              Criar primeira conta
            </a>
            <a 
              href="/recuperar-senha" 
              onClick={(e) => {
                e.preventDefault();
                navigate('/recuperar-senha');
              }}
              className="block text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer"
            >
              Esqueceu sua senha?
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