import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fechar sidebar ao redimensionar para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-dark-card border border-dark-border rounded-lg text-white hover:bg-dark-hover transition-smooth"
        aria-label="Toggle menu"
      >
        <i className={`ri-${sidebarOpen ? 'close' : 'menu'}-line text-2xl`}></i>
      </button>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Overlay para mobile - cobre apenas a área à direita da sidebar */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed top-0 right-0 bottom-0 left-64 bg-black/60 z-[50]"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <main className="lg:ml-64 min-h-screen transition-all duration-300 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}