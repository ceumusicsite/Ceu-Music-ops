# Adicionar Funcionalidades Financeiras Completas na Tabela Pagamentos

## Objetivo

Este script adiciona todas as colunas necessárias para implementar:
1. **Controle de Orçado vs. Realizado**
2. **Fluxo de Caixa e Pagamentos**
3. **Transparência no Extrato do Artista**

## Solução

Execute o SQL no Supabase para adicionar todas as colunas necessárias:

### Passo 1: Acesse o Supabase SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New query**

### Passo 2: Execute o SQL

Cole e execute o conteúdo do arquivo `scripts/fix-pagamentos-financeiro-completo.sql`:

## O que o script adiciona:

### 1. Controle de Orçado vs. Realizado
- ✅ `valor_orcado` - Valor planejado no orçamento
- ✅ `valor_realizado` - Valor efetivamente pago
- ✅ `diferenca_orcado_realizado` - Diferença calculada automaticamente
- ✅ `orcamento_id` - Referência ao orçamento (com foreign key se a tabela existir)

### 2. Fluxo de Caixa e Pagamentos
- ✅ `data_prevista_pagamento` - Data prevista para o pagamento
- ✅ `tipo_movimentacao` - Tipo: entrada ou saída (padrão: 'saida')
- ✅ `categoria_fluxo_caixa` - Categoria para agrupamento
- ✅ `saldo_projetado` - Saldo projetado
- ✅ `saldo_real` - Saldo real

### 3. Transparência no Extrato do Artista
- ✅ `artista_id` - Referência ao artista (com foreign key se a tabela existir)
- ✅ `projeto_id` - Referência ao projeto (com foreign key se a tabela existir)
- ✅ `descricao_detalhada` - Descrição completa para o extrato
- ✅ `categoria_financeira` - Categoria para agrupamento
- ✅ `centro_custo` - Centro de custo
- ✅ `nota_fiscal` - Número da nota fiscal
- ✅ `numero_documento` - Número do documento

### 4. Otimizações
- ✅ **Índices** criados para melhor performance em consultas frequentes
- ✅ **Trigger automático** para calcular diferença orçado vs realizado
- ✅ **Constraints** para validar tipo_movimentacao
- ✅ **Comentários** nas colunas para documentação

## Características do Script

- ✅ **Idempotente** - Pode ser executado múltiplas vezes sem causar erros
- ✅ **Seguro** - Não modifica colunas existentes, apenas adiciona as que faltam
- ✅ **Inteligente** - Verifica se tabelas relacionadas existem antes de criar foreign keys
- ✅ **Performance** - Cria índices para otimizar consultas
- ✅ **Automático** - Trigger calcula diferença orçado vs realizado automaticamente

## Verificação

Após executar, você pode verificar se funcionou executando:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pagamentos' 
ORDER BY column_name;
```

## Uso das Novas Funcionalidades

### Orçado vs. Realizado
```sql
-- Exemplo de uso
SELECT 
  descricao,
  valor_orcado,
  valor_realizado,
  diferenca_orcado_realizado
FROM pagamentos
WHERE orcamento_id = 'uuid-do-orcamento';
```

### Fluxo de Caixa
```sql
-- Exemplo de consulta de fluxo de caixa
SELECT 
  data_prevista_pagamento,
  tipo_movimentacao,
  categoria_fluxo_caixa,
  valor,
  status
FROM pagamentos
WHERE data_prevista_pagamento BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY data_prevista_pagamento;
```

### Extrato do Artista
```sql
-- Exemplo de extrato por artista
SELECT 
  data_pagamento,
  descricao_detalhada,
  categoria_financeira,
  tipo_movimentacao,
  valor
FROM pagamentos
WHERE artista_id = 'uuid-do-artista'
ORDER BY data_pagamento DESC;
```

## Nota Importante

- ✅ O script **NÃO cria a tabela** - ele assume que a tabela `pagamentos` já existe
- ✅ O script usa `ADD COLUMN IF NOT EXISTS` para adicionar apenas as colunas que faltam
- ✅ Se uma coluna já existir, ela não será modificada
- ✅ As foreign keys só são criadas se as tabelas relacionadas (`artistas`, `projetos`, `orcamentos`) existirem
- ✅ O script é **idempotente** - pode ser executado múltiplas vezes sem causar erros

