# Correção da Estrutura da Tabela Pagamentos

## Problema

A tabela `pagamentos` no banco de dados precisa ter todas as colunas necessárias para o modal completo de pagamentos funcionar corretamente.

## Solução

Execute o SQL no Supabase para adicionar todas as colunas necessárias:

### Passo 1: Acesse o Supabase SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New query**

### Passo 2: Execute o SQL

Cole e execute o conteúdo do arquivo `scripts/fix-pagamentos-columns.sql`:

O script irá:
- ✅ **NÃO criar a tabela** - assume que ela já existe
- ✅ Adicionar apenas as colunas que faltam (usando `ADD COLUMN IF NOT EXISTS`):
  - Campos obrigatórios: `descricao`, `valor`, `data_vencimento`, `orcamento`, `parcela`, `status`
  - Campos opcionais: `categoria`, `fornecedor`, `metodo_pagamento`, `observacoes`
  - Campos de controle: `data_pagamento`, `comprovante_url`
  - Timestamps: `created_at`, `updated_at`
- ✅ Configurar constraint de validação para status
- ✅ Habilitar Row Level Security (RLS)
- ✅ Criar políticas de acesso para usuários autenticados

### Passo 3: Criar bucket para comprovantes (opcional)

Se você quiser usar a funcionalidade de upload de comprovantes, você precisa criar um bucket no Supabase Storage:

1. Vá em **Storage** no menu lateral
2. Clique em **New bucket**
3. Nome: `comprovantes`
4. Marque como **Public bucket** (se quiser acesso público) ou deixe privado
5. Clique em **Create bucket**

### Passo 4: Verificar

Após executar, você pode verificar se funcionou executando:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'pagamentos' 
ORDER BY column_name;
```

## Resultado Esperado

Após executar o SQL:
- ✅ Todas as colunas necessárias estarão disponíveis
- ✅ O modal de pagamentos funcionará completamente
- ✅ Todos os campos poderão ser salvos no banco de dados
- ✅ As políticas RLS permitirão acesso aos usuários autenticados
- ✅ A funcionalidade de upload de comprovantes funcionará (se o bucket for criado)

## Nota Importante

- ✅ O script **NÃO cria a tabela** - ele assume que a tabela `pagamentos` já existe
- ✅ O script usa `ADD COLUMN IF NOT EXISTS` para adicionar apenas as colunas que faltam
- ✅ Se uma coluna já existir, ela não será modificada
- ✅ O script remove constraints antigas de status antes de adicionar novas (para evitar conflitos)
- ✅ As políticas RLS só são criadas se não existirem, mantendo as políticas existentes
- ✅ O script é **idempotente** - pode ser executado múltiplas vezes sem causar erros

