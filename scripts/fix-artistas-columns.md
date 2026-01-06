# Correção da Estrutura da Tabela Artistas

## Problema

A tabela `artistas` no banco de dados tem uma estrutura diferente da esperada pelo código:
- **Tabela atual:** `email`, `telefone`
- **Código espera:** `contato_email`, `contato_telefone`, `observacoes_internas`

## Solução

Execute o SQL no Supabase para adicionar as colunas faltantes e migrar os dados:

### Passo 1: Acesse o Supabase SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New query**

### Passo 2: Execute o SQL

Cole e execute o conteúdo do arquivo `scripts/fix-artistas-columns.sql`:

```sql
-- Adicionar as colunas faltantes
ALTER TABLE artistas 
ADD COLUMN IF NOT EXISTS contato_email TEXT,
ADD COLUMN IF NOT EXISTS contato_telefone TEXT,
ADD COLUMN IF NOT EXISTS observacoes_internas TEXT;

-- Migrar dados das colunas antigas para as novas
UPDATE artistas 
SET contato_email = email 
WHERE contato_email IS NULL AND email IS NOT NULL;

UPDATE artistas 
SET contato_telefone = telefone 
WHERE contato_telefone IS NULL AND telefone IS NOT NULL;
```

### Passo 3: Verificar

Após executar, você pode verificar se funcionou executando:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'artistas' 
  AND column_name IN ('contato_email', 'contato_telefone', 'observacoes_internas')
ORDER BY column_name;
```

## Resultado Esperado

Após executar o SQL:
- ✅ As colunas `contato_email`, `contato_telefone` e `observacoes_internas` serão criadas
- ✅ Os dados existentes em `email` serão copiados para `contato_email`
- ✅ Os dados existentes em `telefone` serão copiados para `contato_telefone`
- ✅ O código da aplicação funcionará corretamente

## Nota

As colunas antigas (`email`, `telefone`) permanecerão na tabela. Você pode removê-las depois se quiser, mas não é necessário para o funcionamento do sistema.

