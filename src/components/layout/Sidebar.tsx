import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { path: '/dashboard', icon: 'ri-dashboard-line', label: 'Dashboard', roles: ['admin', 'producao', 'financeiro'] },
  { path: '/artistas', icon: 'ri-user-star-line', label: 'Artistas', roles: ['admin', 'producao'] },
  { path: '/projetos', icon: 'ri-music-2-line', label: 'Projetos', roles: ['admin', 'producao'] },
  { path: '/orcamentos', icon: 'ri-file-list-3-line', label: 'Orçamentos', roles: ['admin', 'producao', 'financeiro'] },
  { path: '/financeiro', icon: 'ri-money-dollar-circle-line', label: 'Financeiro', roles: ['admin', 'financeiro'] },
  { path: '/lancamentos', icon: 'ri-rocket-line', label: 'Lançamentos', roles: ['admin', 'producao'] },
  { path: '/documentos', icon: 'ri-file-line', label: 'Documentos', roles: ['admin', 'producao', 'financeiro'] },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout, loading } = useAuth();

  const visibleMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  // Debug: verificar se usuário está carregado
  if (!loading && !user) {
    console.warn('Sidebar: Usuário não está logado');
  } else if (user) {
    console.log('Sidebar: Usuário logado:', { name: user.name, role: user.role, visibleItems: visibleMenuItems.length });
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-card border-r border-dark-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-dark-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img 
            src="https://static.readdy.ai/image/016995f7e8292e3ea703f912413c6e1c/af9e13ed434ed318d1a9a4df0aa3c822.png" 
            alt="CEU Music" 
            className="w-12 h-12 object-contain"
          />
          <div>
            <h1 className="text-lg font-bold text-white">CEU Music</h1>
            <p className="text-xs text-gray-400">Music Ops</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {visibleMenuItems.length > 0 ? (
          visibleMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-smooth cursor-pointer ${
                  isActive
                    ? 'bg-gradient-primary text-white'
                    : 'text-gray-400 hover:bg-dark-hover hover:text-white'
                }`}
              >
                <i className={`${item.icon} text-xl w-6 h-6 flex items-center justify-center`}></i>
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })
        ) : (
          <div className="px-4 py-3 text-gray-500 text-sm">
            {user ? `Carregando menu... (Role: ${user.role})` : 'Faça login para ver o menu'}
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-dark-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
            <span className="text-sm font-bold">{user?.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-dark-hover hover:bg-red-600/20 text-gray-400 hover:text-red-400 rounded-lg transition-smooth cursor-pointer"
        >
          <i className="ri-logout-box-line text-lg"></i>
          <span className="text-sm font-medium whitespace-nowrap">Sair</span>
        </button>
      </div>
    </aside>
  );
}