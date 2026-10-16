-- ============================================================================
-- CRM (Marketing) - Schema base
-- Execute este SQL no Supabase SQL Editor ANTES do 02-crm-seed.sql
-- ============================================================================

-- Função compartilhada de updated_at para todas as tabelas do CRM
CREATE OR REPLACE FUNCTION crm_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- Funis e etapas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_pipelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  probabilidade INTEGER NOT NULL DEFAULT 100 CHECK (probabilidade BETWEEN 0 AND 100),
  rotting_dias INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_stages_pipeline ON crm_stages(pipeline_id, ordem);

-- ----------------------------------------------------------------------------
-- Organizações e Pessoas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  dono_id UUID REFERENCES users(id) ON DELETE SET NULL,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  pais TEXT,
  cep TEXT,
  cnpj TEXT,
  website TEXT,
  telefone TEXT,
  email TEXT,
  setor TEXT,
  observacoes TEXT,
  custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_orgs_nome ON crm_organizations(nome);
CREATE INDEX IF NOT EXISTS idx_crm_orgs_dono ON crm_organizations(dono_id);

CREATE TABLE IF NOT EXISTS crm_persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  organizacao_id UUID REFERENCES crm_organizations(id) ON DELETE SET NULL,
  dono_id UUID REFERENCES users(id) ON DELETE SET NULL,
  cargo TEXT,
  foto_url TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  aniversario DATE,
  observacoes TEXT,
  custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_persons_nome ON crm_persons(nome);
CREATE INDEX IF NOT EXISTS idx_crm_persons_org ON crm_persons(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_crm_persons_dono ON crm_persons(dono_id);

-- Pipedrive permite vários e-mails/telefones por pessoa, cada um com rótulo
CREATE TABLE IF NOT EXISTS crm_person_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES crm_persons(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  rotulo TEXT NOT NULL DEFAULT 'comercial' CHECK (rotulo IN ('comercial', 'casa', 'outro')),
  principal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_person_emails_person ON crm_person_emails(person_id);
CREATE INDEX IF NOT EXISTS idx_crm_person_emails_email ON crm_person_emails(email);

CREATE TABLE IF NOT EXISTS crm_person_phones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES crm_persons(id) ON DELETE CASCADE,
  telefone TEXT NOT NULL,
  rotulo TEXT NOT NULL DEFAULT 'trabalho' CHECK (rotulo IN ('trabalho', 'casa', 'celular', 'outro')),
  principal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_person_phones_person ON crm_person_phones(person_id);

-- ----------------------------------------------------------------------------
-- Etiquetas (labels coloridas de Pessoa/Organização/Negócio/Lead)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#10767c',
  entidade TEXT NOT NULL CHECK (entidade IN ('pessoa', 'organizacao', 'negocio', 'lead')),
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_entity_labels (
  label_id UUID NOT NULL REFERENCES crm_labels(id) ON DELETE CASCADE,
  entidade TEXT NOT NULL CHECK (entidade IN ('pessoa', 'organizacao', 'negocio', 'lead')),
  entidade_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (label_id, entidade, entidade_id)
);
CREATE INDEX IF NOT EXISTS idx_crm_entity_labels_alvo ON crm_entity_labels(entidade, entidade_id);

-- ----------------------------------------------------------------------------
-- Negócios
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  valor NUMERIC(14, 2) NOT NULL DEFAULT 0,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE RESTRICT,
  stage_id UUID NOT NULL REFERENCES crm_stages(id) ON DELETE RESTRICT,
  person_id UUID REFERENCES crm_persons(id) ON DELETE SET NULL,
  organizacao_id UUID REFERENCES crm_organizations(id) ON DELETE SET NULL,
  dono_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'ganho', 'perdido', 'arquivado')),
  motivo_perda TEXT,
  probabilidade INTEGER CHECK (probabilidade BETWEEN 0 AND 100),
  origem TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  data_prevista_fechamento DATE,
  data_fechamento TIMESTAMPTZ,
  data_entrada_etapa TIMESTAMPTZ DEFAULT NOW(),
  custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage_id, ordem);
CREATE INDEX IF NOT EXISTS idx_crm_deals_pipeline ON crm_deals(pipeline_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_deals_person ON crm_deals(person_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_org ON crm_deals(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_dono ON crm_deals(dono_id);

CREATE TABLE IF NOT EXISTS crm_deal_participants (
  deal_id UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES crm_persons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (deal_id, person_id)
);

-- ----------------------------------------------------------------------------
-- Leads (caixa de entrada de leads)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  person_id UUID REFERENCES crm_persons(id) ON DELETE SET NULL,
  organizacao_id UUID REFERENCES crm_organizations(id) ON DELETE SET NULL,
  dono_id UUID REFERENCES users(id) ON DELETE SET NULL,
  valor NUMERIC(14, 2) DEFAULT 0,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  origem TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'arquivado', 'convertido')),
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  observacoes TEXT,
  custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status, created_at DESC);

-- ----------------------------------------------------------------------------
-- Atividades, notas e arquivos (timeline)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'tarefa'
    CHECK (tipo IN ('ligacao', 'reuniao', 'tarefa', 'prazo', 'email', 'almoco')),
  assunto TEXT NOT NULL,
  nota TEXT,
  local TEXT,
  data DATE,
  hora TIME,
  duracao_minutos INTEGER,
  concluida BOOLEAN NOT NULL DEFAULT FALSE,
  concluida_em TIMESTAMPTZ,
  dono_id UUID REFERENCES users(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  person_id UUID REFERENCES crm_persons(id) ON DELETE CASCADE,
  organizacao_id UUID REFERENCES crm_organizations(id) ON DELETE CASCADE,
  recorrencia TEXT DEFAULT 'nenhuma',
  recorrencia_pai_id UUID REFERENCES crm_activities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_activities_data ON crm_activities(data, hora);
CREATE INDEX IF NOT EXISTS idx_crm_activities_pendentes ON crm_activities(dono_id, concluida, data);
CREATE INDEX IF NOT EXISTS idx_crm_activities_deal ON crm_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_person ON crm_activities(person_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_recorrencia_pai ON crm_activities(recorrencia_pai_id);

CREATE TABLE IF NOT EXISTS crm_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conteudo TEXT NOT NULL,
  autor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  person_id UUID REFERENCES crm_persons(id) ON DELETE CASCADE,
  organizacao_id UUID REFERENCES crm_organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_notes_deal ON crm_notes(deal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_notes_person ON crm_notes(person_id, created_at DESC);

CREATE TABLE IF NOT EXISTS crm_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  arquivo_key TEXT NOT NULL,
  tamanho BIGINT,
  tipo_mime TEXT,
  autor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  person_id UUID REFERENCES crm_persons(id) ON DELETE CASCADE,
  organizacao_id UUID REFERENCES crm_organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Campos personalizados, filtros salvos e preferências de coluna
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_custom_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entidade TEXT NOT NULL CHECK (entidade IN ('pessoa', 'organizacao', 'negocio', 'lead')),
  nome TEXT NOT NULL,
  chave TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'texto', 'texto_longo', 'numero', 'moeda', 'data', 'hora',
    'lista_unica', 'lista_multipla', 'usuario', 'telefone', 'endereco', 'checkbox'
  )),
  opcoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  obrigatorio BOOLEAN NOT NULL DEFAULT FALSE,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (entidade, chave)
);

CREATE TABLE IF NOT EXISTS crm_filters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  entidade TEXT NOT NULL CHECK (entidade IN ('pessoa', 'organizacao', 'negocio', 'lead', 'atividade')),
  condicoes JSONB NOT NULL DEFAULT '{"operador":"and","regras":[]}'::jsonb,
  visibilidade TEXT NOT NULL DEFAULT 'privado' CHECK (visibilidade IN ('privado', 'compartilhado')),
  dono_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_filters_entidade ON crm_filters(entidade, dono_id);

CREATE TABLE IF NOT EXISTS crm_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entidade TEXT NOT NULL,
  colunas JSONB NOT NULL DEFAULT '[]'::jsonb,
  ordenacao JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (usuario_id, entidade)
);

-- ----------------------------------------------------------------------------
-- Histórico de alterações (feed "X mudou a etapa de A para B")
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entidade TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  campo TEXT,
  valor_anterior TEXT,
  valor_novo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_log_alvo ON crm_activity_log(entidade, entidade_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_log_acao ON crm_activity_log(entidade, acao);

-- ----------------------------------------------------------------------------
-- RLS + triggers de updated_at para todas as tabelas do CRM
-- Mesmo modelo do restante do sistema: acesso liberado a usuários autenticados
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
  tabelas TEXT[] := ARRAY[
    'crm_pipelines', 'crm_stages', 'crm_organizations', 'crm_persons',
    'crm_person_emails', 'crm_person_phones', 'crm_labels', 'crm_entity_labels',
    'crm_deals', 'crm_deal_participants', 'crm_leads', 'crm_activities',
    'crm_notes', 'crm_files', 'crm_custom_fields', 'crm_filters',
    'crm_views', 'crm_activity_log'
  ];
  com_updated_at TEXT[] := ARRAY[
    'crm_pipelines', 'crm_stages', 'crm_organizations', 'crm_persons',
    'crm_labels', 'crm_deals', 'crm_leads', 'crm_activities',
    'crm_notes', 'crm_custom_fields', 'crm_filters', 'crm_views'
  ];
BEGIN
  FOREACH t IN ARRAY tabelas LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS "crm_select_autenticados" ON %I', t);
    EXECUTE format(
      'CREATE POLICY "crm_select_autenticados" ON %I FOR SELECT TO authenticated USING (true)', t);

    EXECUTE format('DROP POLICY IF EXISTS "crm_insert_autenticados" ON %I', t);
    EXECUTE format(
      'CREATE POLICY "crm_insert_autenticados" ON %I FOR INSERT TO authenticated WITH CHECK (true)', t);

    EXECUTE format('DROP POLICY IF EXISTS "crm_update_autenticados" ON %I', t);
    EXECUTE format(
      'CREATE POLICY "crm_update_autenticados" ON %I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t);

    EXECUTE format('DROP POLICY IF EXISTS "crm_delete_autenticados" ON %I', t);
    EXECUTE format(
      'CREATE POLICY "crm_delete_autenticados" ON %I FOR DELETE TO authenticated USING (true)', t);
  END LOOP;

  FOREACH t IN ARRAY com_updated_at LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', t);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION crm_set_updated_at()', t);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- Triggers de Sincronização Unificada (Negócios <-> Leads <-> Pessoas)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_deals_sincronizar_before()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_person_id UUID;
  v_digits TEXT;
BEGIN
  IF NEW.person_id IS NULL AND NEW.titulo IS NOT NULL AND trim(NEW.titulo) <> '' THEN
    SELECT id INTO v_person_id
    FROM public.crm_persons
    WHERE lower(trim(nome)) = lower(trim(NEW.titulo))
    LIMIT 1;

    IF v_person_id IS NULL THEN
      INSERT INTO public.crm_persons (nome, organizacao_id, dono_id, observacoes)
      VALUES (
        NEW.titulo,
        NEW.organizacao_id,
        NEW.dono_id,
        COALESCE('Origem: ' || NEW.origem, 'Cadastrado via Negócios')
      )
      RETURNING id INTO v_person_id;

      v_digits := regexp_replace(NEW.titulo, '[^0-9]', '', 'g');
      IF length(v_digits) >= 8 THEN
        INSERT INTO public.crm_person_phones (person_id, telefone, rotulo, principal)
        VALUES (v_person_id, v_digits, 'celular', TRUE)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    NEW.person_id := v_person_id;
  END IF;

  RETURN NEW;
END;
$$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_crm_deals_sincronizar_before') THEN
  CREATE TRIGGER trg_crm_deals_sincronizar_before
  BEFORE INSERT OR UPDATE ON public.crm_deals
  FOR EACH ROW EXECUTE FUNCTION public.crm_deals_sincronizar_before();
END IF; END $$;

CREATE OR REPLACE FUNCTION public.crm_deals_sincronizar_after()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status_lead TEXT;
BEGIN
  v_status_lead := CASE
    WHEN NEW.status = 'aberto' THEN 'ativo'
    WHEN NEW.status = 'ganho' THEN 'convertido'
    ELSE 'arquivado'
  END;

  IF EXISTS (SELECT 1 FROM public.crm_leads WHERE deal_id = NEW.id) THEN
    UPDATE public.crm_leads SET
      titulo = NEW.titulo,
      valor = NEW.valor,
      moeda = NEW.moeda,
      origem = NEW.origem,
      status = v_status_lead,
      person_id = NEW.person_id,
      organizacao_id = NEW.organizacao_id,
      dono_id = NEW.dono_id,
      updated_at = NOW()
    WHERE deal_id = NEW.id;
  ELSE
    INSERT INTO public.crm_leads (
      titulo, valor, moeda, origem, status, deal_id, person_id, organizacao_id, dono_id, observacoes, created_at, updated_at
    ) VALUES (
      NEW.titulo,
      NEW.valor,
      NEW.moeda,
      NEW.origem,
      v_status_lead,
      NEW.id,
      NEW.person_id,
      NEW.organizacao_id,
      NEW.dono_id,
      COALESCE(NEW.origem, 'Criado em Negócios'),
      NEW.created_at,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_crm_deals_sincronizar_after') THEN
  CREATE TRIGGER trg_crm_deals_sincronizar_after
  AFTER INSERT OR UPDATE ON public.crm_deals
  FOR EACH ROW EXECUTE FUNCTION public.crm_deals_sincronizar_after();
END IF; END $$;

CREATE OR REPLACE FUNCTION public.crm_leads_sincronizar_before()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_person_id UUID;
  v_digits TEXT;
BEGIN
  IF NEW.person_id IS NULL AND NEW.titulo IS NOT NULL AND trim(NEW.titulo) <> '' THEN
    SELECT id INTO v_person_id
    FROM public.crm_persons
    WHERE lower(trim(nome)) = lower(trim(NEW.titulo))
    LIMIT 1;

    IF v_person_id IS NULL THEN
      INSERT INTO public.crm_persons (nome, organizacao_id, dono_id, observacoes)
      VALUES (
        NEW.titulo,
        NEW.organizacao_id,
        NEW.dono_id,
        COALESCE('Origem: ' || NEW.origem, 'Cadastrado via Leads')
      )
      RETURNING id INTO v_person_id;

      v_digits := regexp_replace(NEW.titulo, '[^0-9]', '', 'g');
      IF length(v_digits) >= 8 THEN
        INSERT INTO public.crm_person_phones (person_id, telefone, rotulo, principal)
        VALUES (v_person_id, v_digits, 'celular', TRUE)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    NEW.person_id := v_person_id;
  END IF;

  RETURN NEW;
END;
$$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_crm_leads_sincronizar_before') THEN
  CREATE TRIGGER trg_crm_leads_sincronizar_before
  BEFORE INSERT OR UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.crm_leads_sincronizar_before();
END IF; END $$;

CREATE OR REPLACE FUNCTION public.crm_deals_delete_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.crm_leads WHERE deal_id = OLD.id;
  RETURN OLD;
END;
$$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_crm_deals_delete_sync') THEN
  CREATE TRIGGER trg_crm_deals_delete_sync
  AFTER DELETE ON public.crm_deals
  FOR EACH ROW EXECUTE FUNCTION public.crm_deals_delete_sync();
END IF; END $$;
