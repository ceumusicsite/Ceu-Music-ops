import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Login from "../pages/login/page";
import Dashboard from "../pages/dashboard/page";
import Artistas from "../pages/artistas/page";
import Projetos from "../pages/projetos/page";
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
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/artistas",
    element: <Artistas />,
  },
  {
    path: "/projetos",
    element: <Projetos />,
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
