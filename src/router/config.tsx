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
import Produtores from "../pages/produtores/page";
import Fornecedores from "../pages/fornecedores/page";
import Orcamentos from "../pages/orcamentos/page";
import Financeiro from "../pages/financeiro/page";
import Lancamentos from "../pages/lancamentos/page";
import ProtectedRoute from "../components/ProtectedRoute";

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
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },
  {
    path: "/artistas",
    element: <ProtectedRoute><Artistas /></ProtectedRoute>,
  },
  {
    path: "/artistas/:id",
    element: <ProtectedRoute><ArtistaDetalhes /></ProtectedRoute>,
  },
  {
    path: "/projetos",
    element: <ProtectedRoute><Projetos /></ProtectedRoute>,
  },
  {
    path: "/produtores",
    element: <ProtectedRoute><Produtores /></ProtectedRoute>,
  },
  {
    path: "/fornecedores",
    element: <ProtectedRoute><Fornecedores /></ProtectedRoute>,
  },
  {
    path: "/orcamentos",
    element: <ProtectedRoute><Orcamentos /></ProtectedRoute>,
  },
  {
    path: "/financeiro",
    element: <ProtectedRoute><Financeiro /></ProtectedRoute>,
  },
  {
    path: "/lancamentos",
    element: <ProtectedRoute><Lancamentos /></ProtectedRoute>,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
