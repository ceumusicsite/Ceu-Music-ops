# Instruções para Criar Bucket de Storage no Supabase

## O que é necessário

Para permitir o upload de comprovantes nos orçamentos, você precisa criar um **bucket de storage** chamado `orcamentos` no Supabase.

## Passo a Passo

### 1. Acesse o Supabase
- Vá para: https://app.supabase.com
- Faça login e selecione seu projeto

### 2. Navegue até Storage
- No menu lateral esquerdo, clique em **Storage**
- Você verá uma lista de buckets existentes (se houver)

### 3. Crie o Novo Bucket
- Clique no botão **"New bucket"** ou **"Create a new bucket"**
- Preencha as informações:
  - **Name**: `orcamentos` (exatamente assim, sem espaços)
  - **Public bucket**: ❌ **NÃO marque** (deixe desmarcado para segurança)
  - **File size limit**: `10MB` (ou conforme sua necessidade)
  - **Allowed MIME types**: deixe vazio ou adicione: `application/pdf, image/jpeg, image/png`

### 4. Clique em "Create bucket"

### 5. Configure as Políticas de Acesso

Após criar o bucket, você precisa adicionar políticas RLS (Row Level Security) para permitir que usuários autenticados façam upload e visualizem arquivos.

#### 5.1. Vá até Policies
- Na página do bucket `orcamentos`, procure a aba **"Policies"**
- Clique em **"New Policy"**

#### 5.2. Criar Política de Upload
```sql
-- Nome: "Usuários autenticados podem fazer upload"
-- Operação: INSERT

CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'orcamentos'
);
```

#### 5.3. Criar Política de Visualização
```sql
-- Nome: "Usuários autenticados podem visualizar"
-- Operação: SELECT

CREATE POLICY "Usuários autenticados podem visualizar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'orcamentos'
);
```

#### 5.4. Criar Política de Atualização (opcional)
```sql
-- Nome: "Usuários podem atualizar seus próprios arquivos"
-- Operação: UPDATE

CREATE POLICY "Usuários podem atualizar seus próprios arquivos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'orcamentos' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'orcamentos'
);
```

#### 5.5. Criar Política de Exclusão (opcional)
```sql
-- Nome: "Usuários podem excluir seus próprios arquivos"
-- Operação: DELETE

CREATE POLICY "Usuários podem excluir seus próprios arquivos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'orcamentos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Verificação

Para verificar se o bucket foi criado corretamente, você pode:

1. Voltar para a lista de buckets em **Storage**
2. Você deve ver `orcamentos` na lista
3. O bucket deve ter as políticas configuradas

## Testando

Após criar o bucket e configurar as políticas:

1. Tente criar um novo orçamento no sistema
2. Anexe um arquivo PDF ou imagem
3. O upload deve funcionar sem erros

## Troubleshooting

### Se o upload falhar:
- Verifique se o bucket foi nomeado exatamente como `orcamentos`
- Confirme que as políticas de INSERT e SELECT foram criadas
- Verifique se você está autenticado no sistema

### Se aparecer erro de permissão:
- Revise as políticas RLS
- Certifique-se de que `authenticated` está na lista de roles

### Se o arquivo não aparecer:
- Verifique se a política de SELECT foi criada
- Confirme que o `comprovante_url` está sendo salvo no banco de dados



