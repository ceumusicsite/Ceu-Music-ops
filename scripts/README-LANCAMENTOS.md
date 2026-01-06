# 🚀 Configuração da Tabela de Lançamentos

## 📋 Passo a Passo

### 1️⃣ Criar/Corrigir a Tabela no Supabase

**Escolha uma das opções abaixo:**

#### **Opção A: Se a tabela NÃO existe ainda** (Primeira vez)
1. Acesse o **Supabase Dashboard**: https://app.supabase.com
2. Selecione seu projeto **Ceu-Music-ops**
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `scripts/create-lancamentos-table.sql`
6. Cole no editor SQL
7. Clique em **RUN** (ou pressione Ctrl+Enter)

#### **Opção B: Se a tabela existe mas está com erro** (Recomendado)
1. Acesse o **Supabase Dashboard**: https://app.supabase.com
2. Selecione seu projeto **Ceu-Music-ops**
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `scripts/fix-lancamentos-table.sql`
6. Cole no editor SQL
7. Clique em **RUN** (ou pressione Ctrl+Enter)
   - Este script verifica e adiciona colunas faltantes automaticamente

#### **Opção C: Recriar do zero** (⚠️ APAGA TODOS OS DADOS!)
1. Acesse o **Supabase Dashboard**: https://app.supabase.com
2. Selecione seu projeto **Ceu-Music-ops**
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `scripts/recreate-lancamentos-table.sql`
6. Cole no editor SQL
7. Clique em **RUN** (ou pressione Ctrl+Enter)
   - ⚠️ **ATENÇÃO**: Isso vai excluir todos os lançamentos existentes!

### 2️⃣ Criar Bucket de Storage para Capas

1. No menu lateral do Supabase, clique em **Storage**
2. Clique em **Create a new bucket**
3. Configure o bucket:
   - **Name**: `lancamentos`
   - **Public bucket**: ✅ Marque como público
   - Clique em **Create bucket**

### 3️⃣ Configurar Políticas do Bucket

1. Clique no bucket `lancamentos` que você acabou de criar
2. Vá em **Policies**
3. Clique em **New Policy**

#### Policy 1: Permitir Upload
- **Policy Name**: `Permitir upload de capas`
- **Allowed operation**: INSERT
- **Target roles**: authenticated
- **Policy definition**: `true`
- Clique em **Save**

#### Policy 2: Permitir Leitura Pública
- **Policy Name**: `Permitir leitura pública`
- **Allowed operation**: SELECT
- **Target roles**: public
- **Policy definition**: `true`
- Clique em **Save**

#### Policy 3: Permitir Atualização
- **Policy Name**: `Permitir atualização de capas`
- **Allowed operation**: UPDATE
- **Target roles**: authenticated
- **Policy definition**: `true`
- Clique em **Save**

#### Policy 4: Permitir Exclusão
- **Policy Name**: `Permitir exclusão de capas`
- **Allowed operation**: DELETE
- **Target roles**: authenticated
- **Policy definition**: `true`
- Clique em **Save**

## ✅ Verificação

Após executar o script SQL, você deve ver:
- ✅ Tabela `lancamentos` criada
- ✅ 14 colunas criadas
- ✅ 5 índices criados
- ✅ 1 trigger criado
- ✅ 4 RLS policies criadas
- ✅ Bucket `lancamentos` criado no Storage

## 📊 Estrutura da Tabela

### Campos Principais:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `titulo` | VARCHAR | Título do lançamento |
| `tipo` | VARCHAR | Tipo: single, ep, album, clipe, etc. |
| `artista_id` | UUID | Referência ao artista |
| `projeto_id` | UUID | Referência ao projeto |
| `data_planejada` | DATE | Data planejada para lançamento |
| `data_publicacao` | DATE | Data real de publicação |
| `status` | VARCHAR | agendado, publicado, cancelado, adiado |
| `capa_url` | TEXT | URL da capa no Storage |
| `isrc` | VARCHAR | Código ISRC |
| `upc` | VARCHAR | Código UPC |
| `distribuidor` | VARCHAR | Nome do distribuidor |
| `plataformas` | JSONB | Array de plataformas com URLs e métricas |
| `descricao` | TEXT | Descrição do lançamento |
| `observacoes` | TEXT | Observações internas |
| `total_streams` | BIGINT | Total de streams consolidado |
| `total_visualizacoes` | BIGINT | Total de visualizações |

### Exemplo de Plataformas (JSONB):

```json
[
  {
    "plataforma": "Spotify",
    "url": "https://open.spotify.com/track/...",
    "streams": 125400
  },
  {
    "plataforma": "YouTube",
    "url": "https://youtube.com/watch?v=...",
    "streams": 89200
  }
]
```

## 🎯 Próximos Passos

Após configurar a tabela e o bucket:
1. A página de Lançamentos será automaticamente conectada ao Supabase
2. Você poderá criar novos lançamentos com upload de capa
3. Editar e atualizar métricas
4. Exportar relatórios de performance

## ❓ Problemas Comuns

### Erro: "relation already exists"
- A tabela já foi criada anteriormente
- Você pode pular a criação ou excluir a tabela primeiro: `DROP TABLE IF EXISTS public.lancamentos CASCADE;`

### Erro: "permission denied"
- Verifique se você está usando o usuário correto no Supabase
- Certifique-se de ter permissões de administrador no projeto

### Bucket não aparece
- Aguarde alguns segundos e recarregue a página
- Verifique se o nome está correto: `lancamentos` (tudo minúsculo)

---

**Criado por**: Assistente IA  
**Data**: Janeiro 2026  
**Projeto**: Céu Music Ops

