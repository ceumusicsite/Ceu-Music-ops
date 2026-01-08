# Correção da Estrutura da Tabela Lancamentos

## Problema

A tabela `lancamentos` no banco de dados precisa ter todas as colunas necessárias para o sistema completo de lançamentos musicais. O erro 400 (Bad Request) indica que há campos sendo enviados que não existem na tabela ou há problemas com constraints.

## Campos Necessários

A tabela `lancamentos` precisa ter os seguintes campos:

- `id` - UUID (chave primária)
- `titulo` - TEXT (título do lançamento)
- `artista_id` - UUID (referência ao artista, opcional)
- `projeto_id` - UUID (referência ao projeto, opcional)
- `tipo` - TEXT (tipo do lançamento: Single, EP, Álbum, Clipe, etc)
- `plataforma` - TEXT (plataforma: Spotify, YouTube, Apple Music, etc)
- `data_planejada` - DATE (data planejada para o lançamento)
- `data_real` - DATE (data real do lançamento, opcional)
- `status` - TEXT (status: agendado, publicado, cancelado)
- `url` - TEXT (URL do lançamento na plataforma, opcional)
- `streams` - NUMERIC(12, 2) (número de streams/visualizações, opcional)
- `observacoes` - TEXT (observações adicionais, opcional)
- `created_at` - TIMESTAMP WITH TIME ZONE (data de criação)
- `updated_at` - TIMESTAMP WITH TIME ZONE (data de atualização)

## Solução

Execute o SQL no Supabase para adicionar as colunas faltantes:

### Passo 1: Acesse o Supabase SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New query**

### Passo 2: Execute o SQL

1. Abra o arquivo `scripts/fix-lancamentos-columns.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Passo 3: Verificar

Após executar, você pode verificar se funcionou executando:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lancamentos'
ORDER BY ordinal_position;
```

Você deve ver todas as colunas listadas acima.

## Características do Script

- **Idempotente**: Pode ser executado múltiplas vezes sem causar erros
- **Seguro**: Não remove dados existentes
- **Completo**: Inclui:
  - Adição de todas as colunas necessárias (apenas se não existirem)
  - Remoção de constraints problemáticas
  - Tornar campos opcionais (remover NOT NULL)
  - Foreign keys para `artistas` e `projetos`
  - Índices para melhor performance
  - Trigger para atualizar `updated_at` automaticamente
  - Políticas RLS (Row Level Security)
  - Comentários de documentação

## Notas Importantes

- O script verifica se as tabelas `artistas` e `projetos` existem antes de criar as foreign keys
- Campos opcionais podem ser NULL
- O script remove constraints de status para permitir flexibilidade
- Todas as colunas são adicionadas de forma segura, sem perder dados existentes

## Após Executar

1. Recarregue a página do sistema
2. Tente criar um novo lançamento
3. Verifique o console do navegador para ver se há erros
4. Se ainda houver erros, verifique a mensagem de erro no console para identificar qual campo está causando problema
