# Como Executar o Script para Adicionar Campo nome_anexador

## ⚠️ Erro Atual

O erro indica que a coluna `nome_anexador` não existe na tabela `faixa_audio_video`. Isso acontece porque o script SQL ainda não foi executado no Supabase.

## ✅ Solução: Executar Script SQL no Supabase

### Passo 1: Acessar o Supabase SQL Editor

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New query** (Nova consulta)

### Passo 2: Executar o Script

1. Abra o arquivo `scripts/add-faixa-audio-video-nome-anexador.sql` no seu projeto
2. **Copie todo o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 3: Verificar se Funcionou

Após executar, você pode verificar se a coluna foi adicionada executando:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'faixa_audio_video' 
AND column_name = 'nome_anexador';
```

Se retornar uma linha, a coluna foi criada com sucesso!

## 📋 Conteúdo do Script

O script que você precisa executar é:

```sql
-- Script para adicionar campo de nome do anexador na tabela faixa_audio_video
-- Execute este SQL no Supabase SQL Editor

-- Adicionar coluna nome_anexador
ALTER TABLE faixa_audio_video
ADD COLUMN IF NOT EXISTS nome_anexador TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN faixa_audio_video.nome_anexador IS 'Nome da pessoa que anexou o áudio/vídeo através do link compartilhável';
```

## ✅ Após Executar

1. Recarregue a página do sistema (F5)
2. Tente preencher o formulário novamente
3. O erro deve desaparecer









