# Criar Tabela Faixas

Este script cria a tabela `faixas` no banco de dados Supabase.

## Como executar:

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor** (no menu lateral)
3. Clique em **New Query**
4. Cole o conteúdo do arquivo `create-faixas-table.sql`
5. Clique em **Run** ou pressione `Ctrl+Enter`

## O que o script faz:

- ✅ Cria a tabela `faixas` com todas as colunas necessárias:
  - `id` (UUID, chave primária)
  - `projeto_id` (UUID, referência ao projeto)
  - `nome` (TEXT, nome da faixa)
  - `status` ('gravada' ou 'pendente')
  - `o_que_falta_gravar` (TEXT opcional)
  - `ordem` (INTEGER, para ordenação)
  - `created_at` e `updated_at` (timestamps)

- ✅ Cria índices para melhorar performance
- ✅ Configura Row Level Security (RLS)
- ✅ Cria políticas de acesso para usuários autenticados
- ✅ Cria trigger para atualizar `updated_at` automaticamente

## Após executar:

Recarregue a página de detalhes do projeto e tente adicionar uma faixa novamente.

