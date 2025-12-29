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
import Orcamentos from "../pages/orcamentos/page";
import Financeiro from "../pages/financeiro/page";
import Lancamentos from "../pages/lancamentos/page";

const routes: RouteObject[] = [
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
    path: "/projetos/:id",
    element: <ProjetoDetalhes />,
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
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
