-- Script para tentar atualizar arquivo_key de documentos existentes
-- Este script tenta extrair o key da URL quando possível
-- Execute este SQL no Supabase SQL Editor

-- Função para extrair key da URL (aproximação)
-- Nota: Esta é uma tentativa de extrair o key, pode não funcionar para todos os casos
UPDATE documentos
SET arquivo_key = 
  CASE
    -- Se a URL contém '/documentos/', extrair o que vem depois
    WHEN arquivo_url LIKE '%/documentos/%' THEN
      SUBSTRING(arquivo_url FROM '.*/documentos/([^?]+)')
    -- Se a URL contém o nome do arquivo, usar formato padrão
    WHEN arquivo_nome IS NOT NULL THEN
      'documentos/' || arquivo_nome
    ELSE
      NULL
  END
WHERE arquivo_key IS NULL 
  AND arquivo_url IS NOT NULL
  AND (arquivo_url LIKE '%r2.cloudflarestorage.com%' OR arquivo_url LIKE '%cloudflare%');

-- Verificar quantos documentos foram atualizados
SELECT 
  COUNT(*) as total_documentos,
  COUNT(arquivo_key) as documentos_com_key,
  COUNT(*) - COUNT(arquivo_key) as documentos_sem_key
FROM documentos;










