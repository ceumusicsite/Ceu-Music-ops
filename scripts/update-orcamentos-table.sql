-- Script para adicionar os novos campos na tabela orcamentos
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. Adicionar novos campos
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS recuperavel BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS artista_id UUID REFERENCES artistas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS projeto_id UUID REFERENCES projetos(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS data_vencimento DATE,
ADD COLUMN IF NOT EXISTS status_pagamento TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS comprovante_url TEXT;

-- 2. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_orcamentos_artista_id ON orcamentos(artista_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_projeto_id ON orcamentos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status_pagamento ON orcamentos(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_orcamentos_data_vencimento ON orcamentos(data_vencimento);

-- 3. Adicionar comentários para documentação
COMMENT ON COLUMN orcamentos.recuperavel IS 'Indica se o valor será descontado do artista';
COMMENT ON COLUMN orcamentos.artista_id IS 'Vínculo com artista específico';
COMMENT ON COLUMN orcamentos.projeto_id IS 'Vínculo com projeto específico';
COMMENT ON COLUMN orcamentos.data_vencimento IS 'Data de vencimento ou competência do orçamento';
COMMENT ON COLUMN orcamentos.status_pagamento IS 'Status do pagamento: pendente, pago, parcial, atrasado';
COMMENT ON COLUMN orcamentos.comprovante_url IS 'URL do comprovante armazenado no Supabase Storage';

-- 4. Verificar a estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orcamentos'
ORDER BY ordinal_position;



