import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
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
import ProjetoParticiparPublicoPage from "../pages/public/projeto-participar/[token]/page";
import ParticipanteTermoIndividualPublicoPage from "../pages/public/participante-termo/[token]/page";
import EmailsPage from "../pages/emails/page";
import AgendaInstitucional from "../pages/agenda/Institucional";
import AgendaArtistas from "../pages/agenda/Artistas";
import CrmPessoas from "../pages/crm/contatos/Pessoas";
import CrmOrganizacoes from "../pages/crm/contatos/Organizacoes";
import CrmFunil from "../pages/crm/negocios/Funil";
import CrmNegociosLista from "../pages/crm/negocios/Lista";
import CrmNegocioDetalhe from "../pages/crm/negocios/Detalhe";
import CrmFunis from "../pages/crm/configuracoes/Funis";
import CrmProdutos from "../pages/crm/configuracoes/Produtos";
import CrmCamposPersonalizados from "../pages/crm/configuracoes/CamposPersonalizados";
import CrmAtividades from "../pages/crm/atividades/Lista";
import CrmCalendario from "../pages/crm/atividades/Calendario";
import CrmLeads from "../pages/crm/leads/Caixa";
import CrmInsights from "../pages/crm/insights/Painel";

const routes: RouteObject[] = [
  {
    path: "/public/projeto/:token/participar",
    element: <ProjetoParticiparPublicoPage />,
  },
  {
    path: "/participar/:token",
    element: <ProjetoParticiparPublicoPage />,
  },
  {
    path: "/public/participante/:token",
    element: <ParticipanteTermoIndividualPublicoPage />,
  },
  {
    path: "/participante/:token",
    element: <ParticipanteTermoIndividualPublicoPage />,
  },
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
    path: "/agenda",
    element: <AgendaInstitucional />,
  },
  {
    path: "/agenda/institucional",
    element: <AgendaInstitucional />,
  },
  {
    path: "/agenda/artistas",
    element: <AgendaArtistas />,
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
    path: "/crm",
    element: <Navigate to="/crm/negocios/funil" replace />,
  },
  {
    path: "/crm/negocios",
    element: <Navigate to="/crm/negocios/funil" replace />,
  },
  {
    path: "/crm/negocios/funil",
    element: <CrmFunil />,
  },
  {
    path: "/crm/negocios/lista",
    element: <CrmNegociosLista />,
  },
  {
    path: "/crm/negocios/:id",
    element: <CrmNegocioDetalhe />,
  },
  {
    path: "/crm/atividades",
    element: <Navigate to="/crm/atividades/lista" replace />,
  },
  {
    path: "/crm/atividades/lista",
    element: <CrmAtividades />,
  },
  {
    path: "/crm/atividades/calendario",
    element: <CrmCalendario />,
  },
  {
    path: "/crm/leads",
    element: <CrmLeads />,
  },
  {
    path: "/crm/insights",
    element: <CrmInsights />,
  },
  {
    path: "/crm/configuracoes/funis",
    element: <CrmFunis />,
  },
  {
    path: "/crm/configuracoes/produtos",
    element: <CrmProdutos />,
  },
  {
    path: "/crm/configuracoes/campos",
    element: <CrmCamposPersonalizados />,
  },
  {
    path: "/crm/contatos",
    element: <Navigate to="/crm/contatos/pessoas" replace />,
  },
  {
    path: "/crm/contatos/pessoas",
    element: <CrmPessoas />,
  },
  {
    path: "/crm/contatos/organizacoes",
    element: <CrmOrganizacoes />,
  },

  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
