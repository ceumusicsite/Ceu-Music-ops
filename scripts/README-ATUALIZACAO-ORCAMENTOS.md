# Atualização da Tabela de Orçamentos

## Problema

O sistema está retornando erro 400 ao tentar criar orçamentos porque a tabela no Supabase não possui os novos campos adicionados no código.

## Solução

Execute o SQL abaixo no **SQL Editor** do Supabase:

### Passo a Passo

1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `update-orcamentos-table.sql`
6. Clique em **Run** (ou pressione Ctrl+Enter)

### Campos que serão adicionados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `recuperavel` | BOOLEAN | Indica se o valor será descontado do artista |
| `artista_id` | UUID | Vínculo com artista específico (FK) |
| `projeto_id` | UUID | Vínculo com projeto específico (FK) |
| `data_vencimento` | DATE | Data de vencimento ou competência |
| `status_pagamento` | TEXT | Status: pendente, pago, parcial, atrasado |
| `comprovante_url` | TEXT | URL do comprovante no Storage |

### Verificação

Após executar o SQL, você verá uma tabela com todos os campos da tabela `orcamentos`, incluindo os novos campos.

### Configuração do Storage

Para que o upload de comprovantes funcione, você também precisa:

1. Criar um bucket chamado **orcamentos** no Supabase Storage
2. Configurar as políticas de acesso:

```sql
-- Permitir upload para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'orcamentos');

-- Permitir leitura para usuários autenticados
CREATE POLICY "Usuários autenticados podem ver comprovantes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'orcamentos');
```

### Testando

Após executar o SQL e configurar o storage, tente criar um novo orçamento no sistema. O erro 400 não deve mais aparecer.



