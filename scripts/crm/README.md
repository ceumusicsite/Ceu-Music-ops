# CRM — scripts de banco

Rode no **SQL Editor do Supabase**, nesta ordem:

1. `01-crm-schema.sql` — cria todas as tabelas, índices, RLS e triggers de `updated_at`.
2. `02-crm-seed.sql` — cria o funil padrão, suas etapas e as etiquetas iniciais.

Ambos são idempotentes: podem ser executados novamente sem duplicar dados.

## Tabelas

| Tabela | Conteúdo |
| --- | --- |
| `crm_pipelines` / `crm_stages` | funis e etapas, com probabilidade e prazo de "apodrecimento" |
| `crm_organizations` / `crm_persons` | Organizações e Pessoas |
| `crm_person_emails` / `crm_person_phones` | múltiplos contatos por pessoa, com rótulo |
| `crm_labels` / `crm_entity_labels` | etiquetas coloridas aplicáveis a qualquer entidade |
| `crm_deals` / `crm_deal_participants` | negócios e participantes |
| `crm_leads` | caixa de leads |
| `crm_activities` / `crm_notes` / `crm_files` | timeline |
| `crm_custom_fields` | definição dos campos personalizados (valores ficam em `custom_fields jsonb`) |
| `crm_filters` / `crm_views` | filtros salvos e colunas escolhidas por usuário |
| `crm_activity_log` | histórico de alterações |
