import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function Registro() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
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
      // Criar usuário no Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: nome
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Criar perfil do usuário na tabela users usando upsert para evitar conflitos
        const { error: profileError } = await supabase
          .from('users')
          .upsert([{
            id: data.user.id,
            name: nome || email.split('@')[0],
            email: email,
            role: 'admin',
            avatar: null
          }], {
            onConflict: 'id'
          });

        if (profileError) {
          throw profileError;
        }

        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      setError(err.message || 'Erro ao criar usuário. Tente novamente.');
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
          <p className="text-gray-400">Criar conta de administrador</p>
        </div>

        {/* Registro Form */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Criar Primeiro Usuário</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              Usuário criado com sucesso! Redirecionando para login...
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                placeholder="Seu nome"
                required
              />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">A senha deve ter pelo menos 6 caracteres</p>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Criando usuário...' : success ? 'Usuário criado!' : 'Criar Usuário Admin'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a 
              href="/login" 
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
              className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer"
            >
              Já tem uma conta? Faça login
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

