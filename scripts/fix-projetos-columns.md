# Correção da Estrutura da Tabela Projetos

## Problema

A tabela `projetos` no banco de dados está faltando várias colunas necessárias:
- `fase` - Status/fase do projeto
- `progresso` - Progresso do projeto (0-100)
- `prioridade` - Prioridade do projeto (alta, media, baixa)
- `tipo` - Tipo do projeto (single, ep, album)
- `artista_id` - Referência ao artista
- `data_inicio` - Data de início do projeto
- `previsao_lancamento` - Previsão de lançamento

## Solução

Execute o SQL no Supabase para adicionar as colunas faltantes:

### Passo 1: Acesse o Supabase SQL Editor

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New query**

### Passo 2: Execute o SQL

Cole e execute o conteúdo do arquivo `scripts/fix-projetos-columns.sql`:

```sql
-- Adicionar todas as colunas necessárias
ALTER TABLE projetos 
ADD COLUMN IF NOT EXISTS fase TEXT DEFAULT 'planejamento',
ADD COLUMN IF NOT EXISTS progresso INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media',
ADD COLUMN IF NOT EXISTS tipo TEXT,
ADD COLUMN IF NOT EXISTS artista_id UUID REFERENCES artistas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS previsao_lancamento DATE;

-- Adicionar constraints para validar valores
ALTER TABLE projetos 
DROP CONSTRAINT IF EXISTS check_fase,
DROP CONSTRAINT IF EXISTS check_tipo,
DROP CONSTRAINT IF EXISTS check_prioridade,
DROP CONSTRAINT IF EXISTS check_progresso;

ALTER TABLE projetos 
ADD CONSTRAINT check_fase CHECK (fase IN ('planejamento', 'gravando', 'em_edicao', 'mixagem', 'masterizacao', 'finalizado', 'lancado')),
ADD CONSTRAINT check_tipo CHECK (tipo IN ('single', 'ep', 'album')),
ADD CONSTRAINT check_prioridade CHECK (prioridade IN ('alta', 'media', 'baixa')),
ADD CONSTRAINT check_progresso CHECK (progresso >= 0 AND progresso <= 100);
```

### Passo 3: Verificar

Após executar, você pode verificar se funcionou executando:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projetos' 
  AND column_name IN ('fase', 'progresso', 'prioridade', 'tipo', 'artista_id', 'data_inicio', 'previsao_lancamento')
ORDER BY column_name;
```

## Resultado Esperado

Após executar o SQL:
- ✅ Todas as colunas necessárias serão criadas
- ✅ Valores padrão serão definidos (fase: 'planejamento', progresso: 0, prioridade: 'media')
- ✅ Constraints de validação serão adicionadas
- ✅ O código da aplicação funcionará corretamente

## Nota

Se a tabela `projetos` não existir, você precisará criá-la primeiro. Veja o exemplo completo em `scripts/check-projetos-structure.js`.

