import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Login from "../pages/login/page";
import Registro from "../pages/registro/page";
import RecuperarSenha from "../pages/recuperar-senha/page";
import RedefinirSenha from "../pages/redefinir-senha/page";
import Dashboard from "../pages/dashboard/page";
import Artistas from "../pages/artistas/page";
import ArtistaDetalhes from "../pages/artistas/Detalhes";
import Projetos from "../pages/projetos/page";
import ProjetoDetalhes from "../pages/projetos/Detalhes";
import NovoProjeto from "../pages/projetos/Novo";
import EstudioPage from "../pages/estudio/page";
import Produtores from "../pages/produtores/page";
import Fornecedores from "../pages/fornecedores/page";
import Documentos from "../pages/documentos/page";
import Orcamentos from "../pages/orcamentos/page";
import Financeiro from "../pages/financeiro/page";
import Lancamentos from "../pages/lancamentos/page";
import Configuracoes from "../pages/configuracoes/page";
import CoversPage from "../pages/covers/page";
import EntregaPublicaPage from "../pages/public/entrega/[slug]/page";
import TermoPublicoPage from "../pages/public/termo/[token]/page";
import EmailsPage from "../pages/emails/page";

const routes: RouteObject[] = [
  {
    path: "/public/termo/:token",
    element: <TermoPublicoPage />,
  },
  {
    path: "/termo/:token",
    element: <TermoPublicoPage />,
  },
  {
    path: "/public/entrega/:slug",
    element: <EntregaPublicaPage />,
  },
  {
    path: "/emails",
    element: <EmailsPage />,
  },
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/registro",
    element: <Registro />,
  },
  {
    path: "/registro/:token",
    element: <Registro />,
  },
  {
    path: "/recuperar-senha",
    element: <RecuperarSenha />,
  },
  {
    path: "/redefinir-senha",
    element: <RedefinirSenha />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/artistas",
    element: <Artistas />,
  },
  {
    path: "/artistas/:id",
    element: <ArtistaDetalhes />,
  },
  {
    path: "/projetos",
    element: <Projetos />,
  },
  {
    path: "/projetos/novo",
    element: <NovoProjeto />,
  },
  {
    path: "/projetos/:id",
    element: <ProjetoDetalhes />,
  },
  {
    path: "/estudio",
    element: <EstudioPage />,
  },
  {
    path: "/produtores",
    element: <Produtores />,
  },
  {
    path: "/fornecedores",
    element: <Fornecedores />,
  },
  {
    path: "/documentos",
    element: <Documentos />,
  },
  {
    path: "/orcamentos",
    element: <Orcamentos />,
  },
  {
    path: "/financeiro",
    element: <Financeiro />,
  },
  {
    path: "/lancamentos",
    element: <Lancamentos />,
  },
  {
    path: "/configuracoes",
    element: <Configuracoes />,
  },
  {
    path: "/covers",
    element: <CoversPage />,
  },

  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
