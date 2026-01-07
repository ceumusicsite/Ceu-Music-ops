# Correção da Estrutura da Tabela Orçamentos

## Problema

A tabela `orcamentos` no banco de dados precisa ter todas as colunas necessárias para o modal completo de orçamentos funcionar corretamente.

## Solução

Execute o SQL no Supabase para adicionar todas as colunas necessárias:

### Passo 1: Acesse o Supabase SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New query**

### Passo 2: Execute o SQL

Cole e execute o conteúdo do arquivo `scripts/fix-orcamentos-columns.sql`:

O script irá:
- ✅ Criar a tabela `orcamentos` se ela não existir
- ✅ Adicionar todas as colunas necessárias:
  - Campos básicos: `tipo`, `descricao`, `projeto`, `valor`, `status`, `solicitado_por`, `data`
  - Campos adicionais: `solicitante`, `vinculo_artista`, `artista_id`
  - Gestão financeira: `recuperabilidade`, `centro_custo`, `divisao_verbas`
  - Análise financeira: `break_even`, `reserva_contingencia`
  - Cronograma e fluxo: `cronograma_desembolso`, `fluxo_caixa`
  - Controles: `auditabilidade`
- ✅ Configurar constraints de validação
- ✅ Habilitar Row Level Security (RLS)
- ✅ Criar políticas de acesso para usuários autenticados

### Passo 3: Verificar

Após executar, você pode verificar se funcionou executando:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'orcamentos' 
ORDER BY column_name;
```

## Resultado Esperado

Após executar o SQL:
- ✅ Todas as colunas necessárias estarão disponíveis
- ✅ O modal de orçamentos funcionará completamente
- ✅ Todos os campos poderão ser salvos no banco de dados
- ✅ As políticas RLS permitirão acesso aos usuários autenticados

## Nota

Se a tabela já existir com algumas colunas, o script usará `ADD COLUMN IF NOT EXISTS` para adicionar apenas as colunas que faltam, sem afetar os dados existentes.

