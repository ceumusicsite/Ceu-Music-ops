# Adicionar Campo Projetos na Tabela Produtores

## Descrição

Este script adiciona o campo `projetos` na tabela `produtores` do Supabase, permitindo armazenar os projetos realizados por cada produtor.

## Como Executar

### Passo 1: Acesse o Supabase SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New query**

### Passo 2: Execute o SQL

Cole e execute o conteúdo do arquivo `scripts/add-projetos-field-produtores.sql`:

```sql
-- O conteúdo completo do arquivo add-projetos-field-produtores.sql
```

### Passo 3: Verificar

Após executar, você pode verificar se funcionou executando:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'produtores' 
  AND column_name = 'projetos';
```

## Estrutura do Campo

O campo `projetos` é do tipo `TEXT` e armazena um array JSON com a seguinte estrutura:

```json
[
  {
    "id": "uuid-do-projeto",
    "nome": "Nome do Projeto",
    "artista": "Nome do Artista",
    "tipo": "single|ep|album",
    "ano": 2024
  }
]
```

## Valor Padrão

O campo é criado com valor padrão `'[]'` (array vazio), então produtores existentes que não tiverem projetos terão um array vazio.

## Segurança

- ✅ O script é **idempotente** - pode ser executado múltiplas vezes sem causar erros
- ✅ Usa `IF NOT EXISTS` para evitar erros se a coluna já existir
- ✅ Não modifica dados existentes
- ✅ Inclui verificação automática após a execução

## Nota

Se a tabela `produtores` ainda não existir, execute primeiro o script `create-produtores-table.sql` para criar a tabela completa.

