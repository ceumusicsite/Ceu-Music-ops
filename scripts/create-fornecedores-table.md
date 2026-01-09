# Criação da Tabela Fornecedores

## Descrição

Este script cria a tabela `fornecedores` no Supabase para armazenar os dados dos fornecedores da gravadora (estúdios, equipamentos, serviços, etc.).

## Como Executar

### Passo 1: Acesse o Supabase SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New query**

### Passo 2: Execute o SQL

Cole e execute o conteúdo do arquivo `scripts/create-fornecedores-table.sql`:

```sql
-- O conteúdo completo do arquivo create-fornecedores-table.sql
```

### Passo 3: Verificar

Após executar, você pode verificar se funcionou executando:

```sql
SELECT * FROM fornecedores LIMIT 5;
```

## Estrutura da Tabela

A tabela `fornecedores` possui os seguintes campos:

- `id` (UUID): Identificador único (chave primária)
- `nome` (TEXT): Nome do fornecedor
- `categoria` (TEXT): Categoria do fornecedor (estudio, equipamento, servico, outro)
- `tipo_servico` (TEXT): Tipo de serviço oferecido
- `status` (TEXT): Status (ativo, inativo, suspenso)
- `contato_email` (TEXT): E-mail de contato
- `contato_telefone` (TEXT): Telefone de contato (opcional)
- `endereco` (TEXT): Endereço completo (opcional)
- `cidade` (TEXT): Cidade (opcional)
- `estado` (TEXT): Estado (opcional)
- `cnpj` (TEXT): CNPJ do fornecedor (opcional)
- `responsavel` (TEXT): Nome do responsável (opcional)
- `website` (TEXT): Website do fornecedor (opcional)
- `observacoes` (TEXT): Observações sobre o fornecedor (opcional)
- `projetos_utilizados` (INTEGER): Número de projetos que utilizaram este fornecedor (padrão: 0)
- `avaliacao` (NUMERIC): Avaliação do fornecedor (opcional, formato: 4.8, 4.9, etc.)
- `servicos` (TEXT): Array JSON de serviços oferecidos (opcional)
- `created_at` (TIMESTAMP): Data de criação
- `updated_at` (TIMESTAMP): Data de última atualização

## Funcionalidades

- ✅ Criação automática de índices para melhor performance
- ✅ Validação de categoria e status através de constraints
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de acesso para usuários autenticados (SELECT, INSERT, UPDATE, DELETE)
- ✅ Trigger automático para atualizar `updated_at`

## Nota

O campo `servicos` é armazenado como string JSON no banco de dados, mas é convertido para array no código da aplicação. O formato JSON esperado é:

```json
[
  {
    "id": "1",
    "nome": "Mixagem",
    "descricao": "Mixagem profissional",
    "preco_base": 500.00
  }
]
```

## Constraints

- **categoria**: Deve ser um dos valores: 'estudio', 'equipamento', 'servico', 'outro'
- **status**: Deve ser um dos valores: 'ativo', 'inativo', 'suspenso'

## Índices Criados

- `idx_fornecedores_nome`: Para busca rápida por nome
- `idx_fornecedores_categoria`: Para filtragem por categoria
- `idx_fornecedores_status`: Para filtragem por status
- `idx_fornecedores_created_at`: Para ordenação por data de criação

