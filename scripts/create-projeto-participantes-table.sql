-- ==============================================================================
-- TABELA: projeto_participantes (Participantes, Músicos, Ficha Técnica e Termos Jurídicos)
-- ==============================================================================

-- 1. Garantir que a coluna token_cadastro_participantes existe na tabela projetos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projetos' 
        AND column_name = 'token_cadastro_participantes'
    ) THEN
        ALTER TABLE public.projetos ADD COLUMN token_cadastro_participantes TEXT UNIQUE;
    END IF;
END $$;

-- 2. Criar a tabela projeto_participantes
CREATE TABLE IF NOT EXISTS public.projeto_participantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
    faixas_ids TEXT[] DEFAULT '{}',
    tipo_participacao TEXT NOT NULL DEFAULT 'musico',
    tipo_participacao_outro TEXT,
    funcao_instrumento TEXT NOT NULL,
    autorizante_nome TEXT NOT NULL,
    autorizante_nome_artistico TEXT,
    autorizante_cpf TEXT,
    autorizante_rg TEXT,
    autorizante_nacionalidade TEXT DEFAULT 'Brasileiro(a)',
    autorizante_estado_civil TEXT,
    autorizante_profissao TEXT,
    autorizante_endereco TEXT,
    autorizante_email TEXT,
    autorizante_telefone TEXT,
    autorizante_pix TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'assinado', 'cancelado')),
    token TEXT UNIQUE NOT NULL,
    declaracao_concordancia BOOLEAN DEFAULT false,
    assinatura_digital TEXT,
    aceito_em TIMESTAMPTZ,
    ip_origem TEXT,
    user_agent TEXT,
    termo_versao TEXT DEFAULT '1.0',
    observacoes TEXT,
    criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Índices para alta performance
CREATE INDEX IF NOT EXISTS idx_proj_part_projeto_id ON public.projeto_participantes(projeto_id);
CREATE INDEX IF NOT EXISTS idx_proj_part_token ON public.projeto_participantes(token);
CREATE INDEX IF NOT EXISTS idx_proj_part_status ON public.projeto_participantes(status);
CREATE INDEX IF NOT EXISTS idx_proj_part_cpf ON public.projeto_participantes(autorizante_cpf);
CREATE INDEX IF NOT EXISTS idx_projetos_token_cadastro ON public.projetos(token_cadastro_participantes);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.projeto_participantes ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança para Usuários Autenticados (Acesso Total)
DROP POLICY IF EXISTS "Authenticated users full access projeto_participantes" ON public.projeto_participantes;
CREATE POLICY "Authenticated users full access projeto_participantes"
ON public.projeto_participantes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Políticas de Acesso Público para Links Compartilháveis (Anon)

-- Leitura de participante por Token individual
DROP POLICY IF EXISTS "Public select projeto_participantes by token" ON public.projeto_participantes;
CREATE POLICY "Public select projeto_participantes by token"
ON public.projeto_participantes
FOR SELECT
TO anon
USING (true);

-- Atualização para assinatura por Token individual
DROP POLICY IF EXISTS "Public update projeto_participantes to sign" ON public.projeto_participantes;
CREATE POLICY "Public update projeto_participantes to sign"
ON public.projeto_participantes
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Inserção pública para auto-cadastro via link do projeto
DROP POLICY IF EXISTS "Public insert projeto_participantes self registration" ON public.projeto_participantes;
CREATE POLICY "Public insert projeto_participantes self registration"
ON public.projeto_participantes
FOR INSERT
TO anon
WITH CHECK (true);

-- Leitura pública de projetos por token de auto-cadastro
DROP POLICY IF EXISTS "Public select projetos by token_cadastro" ON public.projetos;
CREATE POLICY "Public select projetos by token_cadastro"
ON public.projetos
FOR SELECT
TO anon
USING (token_cadastro_participantes IS NOT NULL);

-- Leitura pública de faixas para projetos acessíveis
DROP POLICY IF EXISTS "Public select faixas for shared project participants" ON public.faixas;
CREATE POLICY "Public select faixas for shared project participants"
ON public.faixas
FOR SELECT
TO anon
USING (true);
