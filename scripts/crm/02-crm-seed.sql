-- ============================================================================
-- CRM (Marketing) - Dados iniciais
-- Execute DEPOIS do 01-crm-schema.sql. Pode ser rodado mais de uma vez.
-- ============================================================================

-- Funil padrão de captação. As etapas são genéricas de propósito: servem para
-- artista, marca, parceiro ou contratante. São editáveis em /crm/configuracoes/funis.
INSERT INTO crm_pipelines (nome, ordem)
SELECT 'Funil de Marketing', 0
WHERE NOT EXISTS (SELECT 1 FROM crm_pipelines WHERE nome = 'Funil de Marketing');

WITH funil AS (
  SELECT id FROM crm_pipelines WHERE nome = 'Funil de Marketing' LIMIT 1
)
INSERT INTO crm_stages (pipeline_id, nome, ordem, probabilidade, rotting_dias)
SELECT funil.id, etapa.nome, etapa.ordem, etapa.probabilidade, etapa.rotting_dias
FROM funil
CROSS JOIN (VALUES
  ('Novo contato',      0,  10, 14),
  ('Qualificação',      1,  25, 14),
  ('Reunião realizada', 2,  40, 21),
  ('Proposta enviada',  3,  60, 21),
  ('Negociação',        4,  80, 30),
  ('Contrato assinado', 5, 100, NULL)
) AS etapa(nome, ordem, probabilidade, rotting_dias)
WHERE NOT EXISTS (
  SELECT 1 FROM crm_stages s WHERE s.pipeline_id = funil.id AND s.nome = etapa.nome
);

-- Etiquetas padrão (as mesmas cores/nomes que o Pipedrive traz de fábrica)
INSERT INTO crm_labels (nome, cor, entidade, ordem)
SELECT l.nome, l.cor, e.entidade, l.ordem
FROM (VALUES
  ('Quente', '#e74c3c', 0),
  ('Morno', '#e67e22', 1),
  ('Frio', '#3498db', 2)
) AS l(nome, cor, ordem)
CROSS JOIN (VALUES ('pessoa'), ('organizacao'), ('negocio'), ('lead')) AS e(entidade)
WHERE NOT EXISTS (
  SELECT 1 FROM crm_labels x WHERE x.nome = l.nome AND x.entidade = e.entidade
);
