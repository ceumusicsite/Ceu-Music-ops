# Script para Limpar Arquivos Órfãos do Cloudflare R2

## Problema

Quando documentos são excluídos do banco de dados, os arquivos no Cloudflare R2 podem não ter sido excluídos, deixando arquivos órfãos que ocupam espaço desnecessariamente.

## Solução

Este script ajuda a identificar e limpar arquivos órfãos do R2.

## Como Usar

### Opção 1: Limpeza Manual via Interface (Recomendado)

1. Acesse a seção de Documentos no sistema
2. Os arquivos agora serão excluídos automaticamente do R2 quando você excluir documentos ou anexos

### Opção 2: Script de Limpeza (Para arquivos já excluídos)

Se você já excluiu muitos documentos antes desta correção, você pode:

1. Verificar quais arquivos estão no R2 mas não têm referência no banco
2. Excluir manualmente esses arquivos do bucket R2 através do painel do Cloudflare

## Verificação de Arquivos Órfãos

Para verificar se há arquivos órfãos, você pode executar esta query no Supabase para ver todos os arquivos que estão referenciados:

```sql
-- Listar todos os arquivos referenciados no banco
SELECT 
  'documento' as tipo,
  id,
  arquivo_key as key,
  arquivo_nome as nome
FROM documentos
WHERE arquivo_key IS NOT NULL

UNION ALL

SELECT 
  'anexo' as tipo,
  id,
  arquivo_key as key,
  arquivo_nome as nome
FROM documentos_anexos
WHERE arquivo_key IS NOT NULL;
```

## Nota Importante

A partir de agora, quando você excluir documentos ou anexos:
- ✅ O registro será excluído do banco de dados
- ✅ O arquivo será excluído automaticamente do Cloudflare R2
- ✅ Todos os anexos associados também serão excluídos

## Limpeza de Arquivos Antigos

Se você precisa limpar arquivos que foram excluídos antes desta correção:

1. Acesse o painel do Cloudflare R2
2. Navegue até o bucket `ceu-music-documentos`
3. Compare os arquivos no bucket com as referências no banco (usando a query acima)
4. Exclua manualmente os arquivos que não têm referência no banco

**ATENÇÃO**: Certifique-se de que os arquivos realmente não são mais necessários antes de excluí-los!


