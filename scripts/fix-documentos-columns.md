# Correção da Estrutura da Tabela Documentos

## Problema

A tabela `documentos` no banco de dados precisa ser criada para gerenciar contratos e documentos da gravadora, incluindo upload de arquivos, visualização e impressão.

## Campos Necessários

A tabela `documentos` precisa ter os seguintes campos:

- `id` - UUID (chave primária)
- `titulo` - TEXT (título do documento)
- `tipo` - TEXT (tipo: contrato, termo, aditivo, outro)
- `artista_id` - UUID (referência ao artista, opcional)
- `projeto_id` - UUID (referência ao projeto, opcional)
- `data_inicio` - DATE (data de início do contrato, opcional)
- `data_fim` - DATE (data de fim do contrato, opcional)
- `valor` - NUMERIC(12, 2) (valor do contrato, opcional)
- `descricao` - TEXT (descrição detalhada, opcional)
- `status` - TEXT (status: ativo, vencido, cancelado)
- `arquivo_url` - TEXT (URL do arquivo no Supabase Storage)
- `arquivo_nome` - TEXT (nome original do arquivo)
- `identificacao_partes` - TEXT (identificação das partes envolvidas - Quem?)
- `objeto_escopo` - TEXT (objeto e escopo do contrato - O quê?)
- `valores_pagamento` - TEXT (valores e condições de pagamento - Quanto e Como?)
- `vigencia_prazos` - TEXT (vigência e prazos - Quando?)
- `termos_legais` - TEXT (termos legais e cláusulas)
- `assinatura` - TEXT (assinaturas e concordância)
- `created_at` - TIMESTAMP WITH TIME ZONE (data de criação)
- `updated_at` - TIMESTAMP WITH TIME ZONE (data de atualização)

## Solução

Execute o SQL no Supabase para criar a tabela e adicionar as colunas:

### Passo 1: Acesse o Supabase SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New query**

### Passo 2: Execute o SQL

1. Abra o arquivo `scripts/fix-documentos-columns.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Passo 3: Criar bucket para documentos (obrigatório)

Para que o upload de arquivos funcione, você precisa criar um bucket no Supabase Storage:

1. Vá em **Storage** no menu lateral
2. Clique em **New bucket**
3. Nome: `documentos`
4. Marque como **Public bucket** (para acesso público aos arquivos) ou deixe privado
5. Clique em **Create bucket**

**Importante:** Se você deixar o bucket privado, precisará configurar políticas de acesso adequadas.

### Passo 4: Verificar

Após executar, você pode verificar se funcionou executando:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documentos'
ORDER BY ordinal_position;
```

Você deve ver todas as colunas listadas acima.

## Características do Script

- **Idempotente**: Pode ser executado múltiplas vezes sem causar erros
- **Seguro**: Não remove dados existentes
- **Completo**: Inclui:
  - Criação da tabela se não existir
  - Adição de todas as colunas necessárias (apenas se não existirem)
  - Foreign keys para `artistas` e `projetos`
  - Índices para melhor performance
  - Trigger para atualizar `updated_at` automaticamente
  - Políticas RLS (Row Level Security)
  - Comentários de documentação

## Notas Importantes

- O script verifica se as tabelas `artistas` e `projetos` existem antes de criar as foreign keys
- Campos opcionais podem ser NULL
- O status padrão é 'ativo'
- O campo `valor` aceita valores numéricos (pode ser convertido de strings como "R$ 1.500,00")
- O bucket `documentos` deve ser criado manualmente no Supabase Storage

## Funcionalidades da Página de Documentos

Após executar o script e criar o bucket, a página de documentos oferece:

- ✅ Upload de documentos (PDF, DOC, DOCX, TXT)
- ✅ Listagem de documentos com filtros (tipo, status, busca)
- ✅ Visualização de detalhes do documento
- ✅ Download de arquivos
- ✅ Impressão de contratos (formatação especial para impressão)
- ✅ Vinculação com artistas e projetos
- ✅ Controle de status (ativo, vencido, cancelado)
- ✅ Gestão de períodos e valores

## Após Executar

1. Recarregue a página do sistema
2. Acesse a seção "Documentos" no menu lateral
3. Tente criar um novo documento
4. Verifique o console do navegador para ver se há erros
5. Teste a funcionalidade de impressão de contratos

