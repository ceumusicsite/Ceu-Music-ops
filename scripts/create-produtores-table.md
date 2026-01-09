# Criação da Tabela Produtores

## Descrição

Este script cria a tabela `produtores` no Supabase para armazenar os dados dos produtores musicais da gravadora.

## Como Executar

### Passo 1: Acesse o Supabase SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New query**

### Passo 2: Execute o SQL

Cole e execute o conteúdo do arquivo `scripts/create-produtores-table.sql`:

```sql
-- O conteúdo completo do arquivo create-produtores-table.sql
```

### Passo 3: Verificar

Após executar, você pode verificar se funcionou executando:

```sql
SELECT * FROM produtores LIMIT 5;
```

## Estrutura da Tabela

A tabela `produtores` possui os seguintes campos:

- `id` (UUID): Identificador único (chave primária)
- `nome` (TEXT): Nome do produtor
- `especialidade` (TEXT): Especialidade do produtor
- `status` (TEXT): Status (ativo, ocupado, disponivel, inativo)
- `contato_email` (TEXT): E-mail de contato
- `contato_telefone` (TEXT): Telefone de contato (opcional)
- `instagram` (TEXT): Instagram (opcional)
- `portfolio` (TEXT): Portfolio/website (opcional)
- `anos_experiencia` (INTEGER): Anos de experiência
- `artistas_trabalhados` (TEXT): Array JSON de artistas trabalhados
- `projetos` (TEXT): Array JSON de projetos realizados
- `observacoes` (TEXT): Observações sobre o produtor (opcional)
- `created_at` (TIMESTAMP): Data de criação
- `updated_at` (TIMESTAMP): Data de última atualização

## Funcionalidades

- ✅ Criação automática de índices para melhor performance
- ✅ Validação de status através de constraint
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de acesso para usuários autenticados
- ✅ Trigger automático para atualizar `updated_at`

## Nota

Os campos `artistas_trabalhados` e `projetos` são armazenados como strings JSON no banco de dados, mas são convertidos para arrays no código da aplicação.

