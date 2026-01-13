# Plano de Implementação - Cloudflare R2 Storage

## Objetivo
Migrar o armazenamento de arquivos (anexos de áudio, documentos, comprovantes) do Supabase Storage para Cloudflare R2, aproveitando os benefícios de custo zero de egress e melhor performance.

## Benefícios do Cloudflare R2
- ✅ **Sem taxas de egress**: Diferente de outros serviços de storage
- ✅ **Compatível com S3**: Usa API S3-compatible, fácil integração
- ✅ **Alta performance**: Rede global da Cloudflare
- ✅ **Custo-efetivo**: Preços competitivos para armazenamento

## Estrutura de Implementação

### 1. Configuração do Cloudflare R2

#### Passo 1: Criar Bucket no R2
1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em **R2** > **Create bucket**
3. Crie buckets separados para:
   - `ceu-music-documentos` - Documentos gerais
   - `ceu-music-anexos` - Anexos de projetos e faixas
   - `ceu-music-comprovantes` - Comprovantes financeiros
   - `ceu-music-audio` - Arquivos de áudio

#### Passo 2: Criar API Token
1. Vá em **Manage R2 API Tokens**
2. Clique em **Create API token**
3. Configure permissões:
   - **Object Read & Write** para os buckets criados
4. Salve as credenciais:
   - `Account ID`
   - `Access Key ID`
   - `Secret Access Key`

#### Passo 3: Configurar CORS (se necessário)
Para acesso direto do navegador:
1. Vá em **R2** > Seu bucket > **Settings** > **CORS**
2. Configure CORS para permitir uploads do seu domínio

### 2. Variáveis de Ambiente

Adicione ao arquivo `.env.local`:

```env
# Cloudflare R2 Configuration
VITE_R2_ACCOUNT_ID=seu_account_id
VITE_R2_ACCESS_KEY_ID=seu_access_key_id
VITE_R2_SECRET_ACCESS_KEY=seu_secret_access_key
VITE_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
VITE_R2_PUBLIC_URL=https://pub-<account_id>.r2.dev

# Buckets
VITE_R2_BUCKET_DOCUMENTOS=ceu-music-documentos
VITE_R2_BUCKET_ANEXOS=ceu-music-anexos
VITE_R2_BUCKET_COMPROVANTES=ceu-music-comprovantes
VITE_R2_BUCKET_AUDIO=ceu-music-audio
```

### 3. Estrutura de Arquivos

```
src/
├── lib/
│   ├── supabase.ts (existente)
│   └── r2.ts (novo - cliente R2)
├── services/
│   └── storage.ts (novo - serviço unificado de storage)
└── components/
    └── projetos/
        └── FileUpload.tsx (atualizar para usar R2)
```

### 4. Componentes a Atualizar

1. **FileUpload.tsx** - Componente genérico de upload
2. **documentos/page.tsx** - Upload de documentos
3. **financeiro/page.tsx** - Upload de comprovantes
4. **projetos/Novo.tsx** - Upload de anexos de projeto
5. **projetos/Detalhes.tsx** - Upload de anexos de faixa

### 5. Migração de Dados Existentes

Para arquivos já armazenados no Supabase:
1. Script de migração para copiar arquivos do Supabase para R2
2. Atualizar URLs no banco de dados
3. Manter compatibilidade durante período de transição

## Implementação Técnica

### Cliente R2 (S3-compatible)
- Usar `@aws-sdk/client-s3` para interagir com R2
- Implementar métodos: upload, download, delete, getUrl
- Tratamento de erros robusto
- Suporte a uploads grandes (multipart)

### Serviço de Storage Unificado
- Abstração que permite trocar entre Supabase e R2
- Interface comum para todas as operações
- Facilita migração futura se necessário

## Testes

1. ✅ Upload de documentos
2. ✅ Upload de anexos de projeto
3. ✅ Upload de comprovantes
4. ✅ Download de arquivos
5. ✅ Exclusão de arquivos
6. ✅ URLs públicas funcionando

## Rollout

1. **Fase 1**: Implementar cliente R2 e serviço
2. **Fase 2**: Atualizar FileUpload component
3. **Fase 3**: Atualizar páginas individuais
4. **Fase 4**: Testes em ambiente de desenvolvimento
5. **Fase 5**: Deploy em produção
6. **Fase 6**: Migração de arquivos existentes (opcional)

## Referências

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)


