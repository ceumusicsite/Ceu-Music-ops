import type { ReactNode } from 'react';

export type CrmEntidade = 'pessoa' | 'organizacao' | 'negocio' | 'lead';

export type RotuloEmail = 'comercial' | 'casa' | 'outro';
export type RotuloTelefone = 'trabalho' | 'casa' | 'celular' | 'outro';

export interface CrmEmail {
  id?: string;
  email: string;
  rotulo: RotuloEmail;
  principal: boolean;
}

export interface CrmTelefone {
  id?: string;
  telefone: string;
  rotulo: RotuloTelefone;
  principal: boolean;
}

export interface CrmLabel {
  id: string;
  nome: string;
  cor: string;
  entidade: CrmEntidade;
  ordem: number;
}

export interface CrmOrganizacao {
  id: string;
  nome: string;
  dono_id?: string | null;
  dono_nome?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  pais?: string | null;
  cep?: string | null;
  cnpj?: string | null;
  website?: string | null;
  telefone?: string | null;
  email?: string | null;
  setor?: string | null;
  observacoes?: string | null;
  custom_fields: Record<string, unknown>;
  total_pessoas?: number;
  total_negocios?: number;
  created_at: string;
  updated_at: string;
}

export interface CrmPessoa {
  id: string;
  nome: string;
  organizacao_id?: string | null;
  organizacao_nome?: string | null;
  dono_id?: string | null;
  dono_nome?: string | null;
  cargo?: string | null;
  foto_url?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  aniversario?: string | null;
  observacoes?: string | null;
  custom_fields: Record<string, unknown>;
  emails: CrmEmail[];
  telefones: CrmTelefone[];
  labels?: CrmLabel[];
  total_atividades?: number;
  created_at: string;
  updated_at: string;
}

/** Uma regra do construtor de filtros: campo + operador + valor. */
export interface CrmRegraFiltro {
  id: string;
  campo: string;
  operador: CrmOperadorFiltro;
  valor: string;
}

export type CrmOperadorFiltro =
  | 'contem'
  | 'nao_contem'
  | 'igual'
  | 'diferente'
  | 'vazio'
  | 'preenchido'
  | 'maior_que'
  | 'menor_que';

export interface CrmCondicoesFiltro {
  operador: 'and' | 'or';
  regras: CrmRegraFiltro[];
}

export interface CrmFiltroSalvo {
  id: string;
  nome: string;
  entidade: string;
  condicoes: CrmCondicoesFiltro;
  visibilidade: 'privado' | 'compartilhado';
  dono_id?: string | null;
}

/** Definição de uma coluna da tabela, usada pelo DataTable e pelo seletor de colunas. */
export interface CrmColuna<T> {
  chave: string;
  titulo: string;
  largura?: string;
  alinhamento?: 'left' | 'right' | 'center';
  /** Colunas fixas não podem ser ocultadas pelo usuário. */
  fixa?: boolean;
  visivelPorPadrao?: boolean;
  render: (item: T) => ReactNode;
  /** Valor usado para ordenar e filtrar; cai para o texto renderizado quando ausente. */
  valor?: (item: T) => string | number | null | undefined;
}

export interface CrmPipeline {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
}

export interface CrmEtapa {
  id: string;
  pipeline_id: string;
  nome: string;
  ordem: number;
  probabilidade: number;
  rotting_dias?: number | null;
}

export type StatusNegocio = 'aberto' | 'ganho' | 'perdido' | 'arquivado';

export interface CrmNegocio {
  id: string;
  titulo: string;
  valor: number;
  moeda: string;
  pipeline_id: string;
  stage_id: string;
  person_id?: string | null;
  person_nome?: string | null;
  person_telefone?: string | null;
  person_email?: string | null;
  organizacao_id?: string | null;
  organizacao_nome?: string | null;
  dono_id?: string | null;
  dono_nome?: string | null;
  status: StatusNegocio;
  motivo_perda?: string | null;
  probabilidade?: number | null;
  origem?: string | null;
  observacoes?: string | null;
  ordem: number;
  data_prevista_fechamento?: string | null;
  data_fechamento?: string | null;
  data_entrada_etapa?: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type TipoAtividade = 'ligacao' | 'reuniao' | 'tarefa' | 'prazo' | 'email' | 'almoco';

export interface CrmAtividade {
  id: string;
  tipo: TipoAtividade;
  assunto: string;
  nota?: string | null;
  local?: string | null;
  data?: string | null;
  hora?: string | null;
  duracao_minutos?: number | null;
  concluida: boolean;
  concluida_em?: string | null;
  dono_id?: string | null;
  dono_nome?: string | null;
  deal_id?: string | null;
  deal_titulo?: string | null;
  person_id?: string | null;
  person_nome?: string | null;
  organizacao_id?: string | null;
  organizacao_nome?: string | null;
  recorrencia?: string | null;
  recorrencia_pai_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmNota {
  id: string;
  conteudo: string;
  autor_id?: string | null;
  autor_nome?: string | null;
  deal_id?: string | null;
  person_id?: string | null;
  organizacao_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type StatusLead = 'ativo' | 'arquivado' | 'convertido';

export interface CrmLead {
  id: string;
  titulo: string;
  valor: number;
  moeda: string;
  origem?: string | null;
  status: StatusLead;
  deal_id?: string | null;
  observacoes?: string | null;
  dono_id?: string | null;
  dono_nome?: string | null;
  person_id?: string | null;
  person_nome?: string | null;
  organizacao_id?: string | null;
  organizacao_nome?: string | null;
  created_at: string;
  updated_at: string;
}
