import type { CrmSubItem } from './CrmLayout';

export const CRM_SUBITENS_CONTATOS: CrmSubItem[] = [
  { path: '/crm/contatos/pessoas', label: 'Pessoas', icon: 'ri-user-line' },
  { path: '/crm/contatos/organizacoes', label: 'Organizações', icon: 'ri-building-line' },
];

export const CRM_SUBITENS_NEGOCIOS: CrmSubItem[] = [
  { path: '/crm/negocios/funil', label: 'Funil', icon: 'ri-layout-column-line' },
  { path: '/crm/negocios/lista', label: 'Lista', icon: 'ri-list-check-2' },
];

export const CRM_SUBITENS_ATIVIDADES: CrmSubItem[] = [
  { path: '/crm/atividades/lista', label: 'Lista', icon: 'ri-list-check-2' },
  { path: '/crm/atividades/calendario', label: 'Calendário', icon: 'ri-calendar-line' },
];

export const CRM_SUBITENS_LEADS: CrmSubItem[] = [
  { path: '/crm/leads', label: 'Caixa de entrada', icon: 'ri-inbox-line' },
];

export const CRM_SUBITENS_INSIGHTS: CrmSubItem[] = [
  { path: '/crm/insights', label: 'Painel', icon: 'ri-line-chart-line' },
];

export const CRM_SUBITENS_CONFIGURACOES: CrmSubItem[] = [
  { path: '/crm/configuracoes/funis', label: 'Funis e etapas', icon: 'ri-layout-column-line' },
  { path: '/crm/configuracoes/produtos', label: 'Produtos', icon: 'ri-price-tag-3-line' },
  { path: '/crm/configuracoes/campos', label: 'Campos personalizados', icon: 'ri-input-field' },
];
