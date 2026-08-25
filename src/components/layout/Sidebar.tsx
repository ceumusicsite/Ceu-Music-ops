import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SubMenuItem {
  path: string;
  label: string;
  icon: string;
  roles: string[];
}

interface MenuItem {
  path?: string;
  icon: string;
  label: string;
  roles: string[];
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', icon: 'ri-dashboard-line', label: 'Dashboard', roles: ['admin', 'executivo', 'ar', 'producao', 'financeiro', 'operador'] },
  {
    icon: 'ri-calendar-line',
    label: 'Agendas',
    roles: ['admin', 'executivo', 'ar', 'producao', 'operador'],
    subItems: [
      { path: '/agenda/institucional', icon: 'ri-calendar-event-line', label: 'Agenda Céu', roles: ['admin', 'executivo', 'ar', 'producao', 'operador'] },
      { path: '/agenda/artistas', icon: 'ri-calendar-check-line', label: 'Agenda Artistas', roles: ['admin', 'executivo', 'ar', 'producao', 'operador'] },
    ],
  },
  { path: '/artistas', icon: 'ri-user-star-line', label: 'Artistas', roles: ['admin', 'executivo', 'ar', 'producao', 'operador'] },
  { path: '/projetos', icon: 'ri-music-2-line', label: 'Projetos', roles: ['admin', 'executivo', 'ar', 'producao', 'operador'] },
  { path: '/estudio', icon: 'ri-mic-line', label: 'Estúdio', roles: ['admin', 'executivo', 'ar', 'producao', 'operador'] },
  { path: '/produtores', icon: 'ri-headphone-line', label: 'Produtores', roles: ['admin', 'executivo', 'ar', 'producao', 'operador'] },
  { path: '/fornecedores', icon: 'ri-store-line', label: 'Fornecedores', roles: ['admin', 'executivo', 'ar', 'producao', 'financeiro', 'operador'] },
  { path: '/orcamentos', icon: 'ri-file-list-3-line', label: 'Orçamentos', roles: ['admin', 'executivo', 'ar', 'financeiro', 'operador'] },
  { path: '/financeiro', icon: 'ri-money-dollar-circle-line', label: 'Financeiro', roles: ['admin', 'executivo', 'financeiro', 'operador'] },
  { path: '/lancamentos', icon: 'ri-rocket-line', label: 'Lançamentos', roles: ['admin', 'executivo', 'ar', 'producao', 'operador'] },
  { path: '/documentos', icon: 'ri-file-text-line', label: 'Documentos', roles: ['admin', 'executivo', 'ar', 'financeiro', 'operador'] },
  { path: '/covers', icon: 'ri-folder-music-line', label: 'Covers', roles: ['admin', 'executivo', 'ar', 'producao', 'operador'] },
  { path: '/emails', icon: 'ri-mail-send-line', label: 'E-mails em Massa', roles: ['admin', 'executivo', 'operador'] },
  { path: '/configuracoes', icon: 'ri-settings-3-line', label: 'Configurações', roles: ['admin'] },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Controla quais menus com subitens estão expandidos
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    return {
      Agendas: location.pathname.startsWith('/agenda'),
    };
  });

  // Abre automaticamente o submenu se a rota atual for de um dos seus subitens
  useEffect(() => {
    if (location.pathname.startsWith('/agenda')) {
      setExpandedMenus((prev) => ({ ...prev, Agendas: true }));
    }
  }, [location.pathname]);

  const toggleSubmenu = (menuLabel: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuLabel]: !prev[menuLabel],
    }));
  };

  const visibleMenuItems = menuItems.filter((item) =>
    user && item.roles.includes(user.role)
  );

  const handleLinkClick = (e: React.MouseEvent) => {
    // Fechar sidebar em mobile quando um link for clicado
    if (window.innerWidth < 1024 && onClose) {
      setTimeout(() => {
        onClose();
      }, 100);
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 bg-dark-card border-r border-dark-border flex flex-col z-[55] transform transition-transform duration-300 pointer-events-auto ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-dark-border">
        <Link to="/dashboard" onClick={handleLinkClick} className="flex flex-col items-center gap-2">
          <img
            src="https://static.readdy.ai/image/016995f7e8292e3ea703f912413c6e1c/af9e13ed434ed318d1a9a4df0aa3c822.png"
            alt="Céu Music"
            className="w-20 h-20 object-contain mb-1"
          />
          <div className="text-center">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Sistema interno</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {visibleMenuItems.map((item) => {
          // Se for item com submenus
          if (item.subItems && item.subItems.length > 0) {
            const visibleSubItems = item.subItems.filter(
              (sub) => user && sub.roles.includes(user.role)
            );
            if (visibleSubItems.length === 0) return null;

            const isSubItemActive = visibleSubItems.some(
              (sub) => location.pathname === sub.path
            );
            const isExpanded = !!expandedMenus[item.label];

            return (
              <div key={item.label} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleSubmenu(item.label)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-smooth cursor-pointer ${
                    isSubItemActive
                      ? 'text-primary-teal bg-primary-teal/10 font-semibold'
                      : 'text-gray-400 hover:bg-dark-hover hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i className={`${item.icon} text-xl w-6 h-6 flex items-center justify-center`}></i>
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  </div>
                  <i
                    className={`ri-arrow-down-s-line text-lg transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-primary-teal' : 'text-gray-500'
                    }`}
                  ></i>
                </button>

                {/* Subitens da Agenda */}
                {isExpanded && (
                  <div className="mt-1 ml-4 pl-3 border-l border-dark-border/80 space-y-1">
                    {visibleSubItems.map((sub) => {
                      const isSubActive = location.pathname === sub.path;
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          onClick={handleLinkClick}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-smooth cursor-pointer ${
                            isSubActive
                              ? 'bg-gradient-primary text-white shadow-sm'
                              : 'text-gray-400 hover:bg-dark-hover hover:text-white'
                          }`}
                        >
                          <i className={`${sub.icon} text-base w-4 h-4 flex items-center justify-center`}></i>
                          <span className="truncate">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Item de menu normal
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path!}
              onClick={handleLinkClick}
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
        })}
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