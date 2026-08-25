-- ==============================================================================
-- TABELA: estudio_termos_uso (Aceite e Termos de Uso de Imagem Céu Music)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.estudio_termos_uso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gravacao_id UUID REFERENCES public.estudio_gravacoes(id) ON DELETE SET NULL,
    token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'assinado', 'cancelado')),
    projeto_nome TEXT NOT NULL,
    artista_principal TEXT,
    data_gravacao TEXT,
    local_gravacao TEXT DEFAULT 'Estúdio Céu Music - Rio de Janeiro, RJ',
    tipo_participacao TEXT DEFAULT 'Convidado',
    tipo_participacao_outro TEXT,
    autorizante_nome TEXT,
    autorizante_nome_artistico TEXT,
    autorizante_cpf TEXT,
    autorizante_rg TEXT,
    autorizante_endereco TEXT,
    autorizante_email TEXT,
    autorizante_telefone TEXT,
    aceito_em TIMESTAMPTZ,
    ip_origem TEXT,
    user_agent TEXT,
    assinatura_digital TEXT,
    declaracao_concordancia BOOLEAN DEFAULT false,
    termo_versao TEXT DEFAULT '1.0',
    criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_estudio_termos_token ON public.estudio_termos_uso(token);
CREATE INDEX IF NOT EXISTS idx_estudio_termos_gravacao_id ON public.estudio_termos_uso(gravacao_id);
CREATE INDEX IF NOT EXISTS idx_estudio_termos_status ON public.estudio_termos_uso(status);

-- RLS
ALTER TABLE public.estudio_termos_uso ENABLE ROW LEVEL SECURITY;

-- Políticas para Usuários Autenticados
DROP POLICY IF EXISTS "Authenticated users full access estudio_termos_uso" ON public.estudio_termos_uso;
CREATE POLICY "Authenticated users full access estudio_termos_uso"
ON public.estudio_termos_uso
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para Acesso Público (Leitura por token e Assinatura)
DROP POLICY IF EXISTS "Public select estudio_termos_uso by token" ON public.estudio_termos_uso;
CREATE POLICY "Public select estudio_termos_uso by token"
ON public.estudio_termos_uso
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Public update estudio_termos_uso to sign" ON public.estudio_termos_uso;
CREATE POLICY "Public update estudio_termos_uso to sign"
ON public.estudio_termos_uso
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
