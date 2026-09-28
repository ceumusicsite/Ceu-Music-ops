import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';

export interface CrmSubItem {
  path: string;
  label: string;
  icon: string;
}

interface CrmLayoutProps {
  /** Módulo atual, exibido no caminho do topo: "Contatos / Pessoas". */
  modulo: string;
  titulo: string;
  subItens: CrmSubItem[];
  /** Botões do canto direito do cabeçalho (criar, filtrar, menu "..."). */
  acoes?: ReactNode;
  /** Texto abaixo do caminho, como a contagem de registros. */
  resumo?: ReactNode;
  children: ReactNode;
}

/**
 * Estrutura de duas colunas do Pipedrive: uma navegação secundária fixa à
 * esquerda do conteúdo, com o cabeçalho do módulo acima da área de trabalho.
 */
export default function CrmLayout({
  modulo,
  titulo,
  subItens,
  acoes,
  resumo,
  children,
}: CrmLayoutProps) {
  const location = useLocation();

  return (
    <MainLayout>
      <div className="flex min-h-screen">
        {/* Navegação secundária do módulo */}
        <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-dark-border bg-dark-card/60 py-4 px-3 gap-1">
          {subItens.map((item) => {
            const ativo = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-smooth ${
                  ativo
                    ? 'bg-primary-teal/15 font-semibold text-primary-teal'
                    : 'text-gray-400 hover:bg-dark-hover hover:text-white'
                }`}
              >
                <i className={`${item.icon} text-lg w-5 flex items-center justify-center`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Cabeçalho do módulo */}
          <header className="border-b border-dark-border bg-dark-card/40 px-4 md:px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <nav className="flex items-center gap-2 text-lg font-semibold">
                  <span className="text-gray-500">{modulo}</span>
                  <span className="text-gray-600">/</span>
                  <span className="text-white">{titulo}</span>
                </nav>
                {resumo && <div className="mt-1 text-sm text-gray-500">{resumo}</div>}
              </div>
              {acoes && <div className="flex items-center gap-2">{acoes}</div>}
            </div>

            {/* Abas do módulo em telas pequenas, onde a coluna lateral some */}
            <div className="md:hidden mt-4 flex gap-1 overflow-x-auto">
              {subItens.map((item) => {
                const ativo = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-smooth ${
                      ativo
                        ? 'bg-primary-teal/15 font-semibold text-primary-teal'
                        : 'text-gray-400 hover:bg-dark-hover hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </header>

          <div className="flex-1 min-w-0 p-4 md:p-6">{children}</div>
        </div>
      </div>
    </MainLayout>
  );
}
