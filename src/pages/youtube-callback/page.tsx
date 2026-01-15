import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAccessTokenFromCode, saveYouTubeAccessToken } from '../../services/youtube';
import MainLayout from '../../components/layout/MainLayout';

export default function YouTubeCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Autenticando com YouTube...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setStatus('error');
      setMessage(errorDescription || 'Erro na autenticação com YouTube');
      setTimeout(() => {
        navigate('/projetos');
      }, 3000);
      return;
    }

    if (code) {
      getAccessTokenFromCode(code)
        .then(({ accessToken, refreshToken }) => {
          saveYouTubeAccessToken(accessToken, refreshToken);
          setStatus('success');
          setMessage('Autenticação realizada com sucesso! Redirecionando...');
          
          setTimeout(() => {
            navigate('/projetos');
          }, 2000);
        })
        .catch((err) => {
          console.error('Erro ao obter token:', err);
          setStatus('error');
          setMessage(err.message || 'Erro ao autenticar com YouTube');
          
          setTimeout(() => {
            navigate('/projetos');
          }, 3000);
        });
    } else {
      setStatus('error');
      setMessage('Código de autorização não encontrado');
      setTimeout(() => {
        navigate('/projetos');
      }, 3000);
    }
  }, [searchParams, navigate]);

  return (
    <MainLayout>
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          {status === 'loading' && (
            <>
              <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
              <p className="text-gray-400 mt-4">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-checkbox-circle-line text-3xl text-green-400"></i>
              </div>
              <p className="text-white font-medium mb-2">Sucesso!</p>
              <p className="text-gray-400">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-error-warning-line text-3xl text-red-400"></i>
              </div>
              <p className="text-white font-medium mb-2">Erro na Autenticação</p>
              <p className="text-gray-400">{message}</p>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
