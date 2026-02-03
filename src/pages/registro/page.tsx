import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function Registro() {
  const { token } = useParams<{ token?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(!!token);
  const [tokenValid, setTokenValid] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const navigate = useNavigate();

  // Validar token quando a página carregar
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidatingToken(false);
        return;
      }

      try {
        const { data, error: inviteError } = await supabase
          .from('user_invites')
          .select('*')
          .eq('token', token)
          .is('used_at', null)
          .single();

        if (inviteError || !data) {
          setError('Link de convite inválido ou já utilizado.');
          setTokenValid(false);
        } else {
          // Verificar se expirou
          if (data.expires_at && new Date(data.expires_at) < new Date()) {
            setError('Este link de convite expirou.');
            setTokenValid(false);
          } else if (data.current_uses >= data.max_uses) {
            setError('Este link de convite já foi utilizado o número máximo de vezes.');
            setTokenValid(false);
          } else {
            setTokenValid(true);
            setInviteData(data);
          }
        }
      } catch (err: any) {
        console.error('Erro ao validar token:', err);
        setError('Erro ao validar link de convite.');
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Se houver token, validar novamente antes de criar
      if (token && !tokenValid) {
        setError('Link de convite inválido.');
        setLoading(false);
        return;
      }

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
        // Determinar status e role baseado no token
        const userStatus = token ? 'pending' : 'approved';
        const userRole = token ? 'operador' : 'admin'; // Usuários via convite começam como operador

        // Criar perfil do usuário na tabela users usando upsert para evitar conflitos
        const { error: profileError } = await supabase
          .from('users')
          .upsert([{
            id: data.user.id,
            name: nome || email.split('@')[0],
            email: email,
            role: userRole,
            status: userStatus,
            avatar: null
          }], {
            onConflict: 'id'
          });

        if (profileError) {
          throw profileError;
        }

        // Se houver token, marcar como usado
        if (token && inviteData) {
          const { error: inviteUpdateError } = await supabase
            .from('user_invites')
            .update({
              used_at: new Date().toISOString(),
              used_by: data.user.id,
              current_uses: inviteData.current_uses + 1
            })
            .eq('token', token);

          if (inviteUpdateError) {
            console.error('Erro ao atualizar convite:', inviteUpdateError);
            // Não bloquear o cadastro se houver erro ao atualizar o convite
          }
        }

        if (token) {
          setSuccess(true);
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setSuccess(true);
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
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
            width={96}
            height={96}
            className="w-24 h-24 mx-auto mb-4 object-contain"
            fetchPriority="high"
            decoding="async"
          />
          <h1 className="text-3xl font-bold text-white mb-2">CEU Music Ops</h1>
          <p className="text-gray-400">
            {token ? 'Cadastro via convite' : 'Criar conta de administrador'}
          </p>
        </div>

        {/* Registro Form */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-8">
          {validatingToken ? (
            <div className="text-center py-8">
              <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin mb-4"></i>
              <p className="text-gray-400">Validando link de convite...</p>
            </div>
          ) : token && !tokenValid ? (
            <div className="text-center py-8">
              <i className="ri-error-warning-line text-6xl text-red-400 mb-4"></i>
              <h2 className="text-xl font-semibold text-white mb-2">Link Inválido</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer"
              >
                Ir para Login
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">
                {token ? 'Complete seu cadastro' : 'Criar Primeiro Usuário'}
              </h2>
          
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
                disabled={loading || success || (token && !tokenValid)}
                className="w-full py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? 'Criando usuário...' : success ? (token ? 'Cadastro realizado! Aguardando aprovação...' : 'Usuário criado!') : token ? 'Criar Conta' : 'Criar Usuário Admin'}
              </button>
            </form>

            {token && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-400">
                  <i className="ri-information-line mr-1"></i>
                  Seu cadastro será revisado por um administrador. Você receberá um e-mail quando for aprovado.
                </p>
              </div>
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
                Já tem uma conta? Faça login
              </a>
            </div>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          © 2024 CEU Music. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

