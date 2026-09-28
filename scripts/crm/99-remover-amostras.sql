-- ============================================================================
-- Remove todos os registros de amostra do CRM (os que começam com "[Amostra]")
-- Execute quando quiser começar com a base limpa.
-- ============================================================================

DELETE FROM crm_activities WHERE assunto LIKE '[Amostra]%';
DELETE FROM crm_leads      WHERE titulo  LIKE '[Amostra]%';
DELETE FROM crm_deals      WHERE titulo  LIKE '[Amostra]%';
DELETE FROM crm_persons    WHERE nome    LIKE '[Amostra]%';
DELETE FROM crm_organizations WHERE nome LIKE '[Amostra]%';

SELECT
  (SELECT count(*) FROM crm_organizations) AS organizacoes,
  (SELECT count(*) FROM crm_persons)       AS pessoas,
  (SELECT count(*) FROM crm_deals)         AS negocios,
  (SELECT count(*) FROM crm_activities)    AS atividades,
  (SELECT count(*) FROM crm_leads)         AS leads;
