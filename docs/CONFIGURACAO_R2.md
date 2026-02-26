# Configuração do Cloudflare R2

## Pré-requisitos

1. Conta no Cloudflare
2. Acesso ao dashboard do Cloudflare
3. R2 habilitado na sua conta

## Passo a Passo

### 1. Criar Buckets no R2

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em **R2** no menu lateral
3. Clique em **Create bucket** para cada bucket necessário:

#### Buckets Necessários:
- **ceu-music-documentos** - Para documentos gerais
- **ceu-music-anexos** - Para anexos de projetos e faixas
- **ceu-music-comprovantes** - Para comprovantes financeiros
- **ceu-music-audio** - Para arquivos de áudio (opcional)

Para cada bucket:
- Escolha um nome (ex: `ceu-music-documentos`)
- Selecione **Location Hint** (opcional, recomendado: mais próximo dos usuários)
- Clique em **Create bucket**

### 2. Criar API Token

1. No dashboard do R2, vá em **Manage R2 API Tokens**
2. Clique em **Create API token**
3. Configure:
   - **Token name**: `ceu-music-api-token`
   - **Permissions**: 
     - **Object Read & Write** para todos os buckets criados
   - **TTL**: Deixe em branco para token permanente (ou defina expiração)
4. Clique em **Create API Token**
5. **IMPORTANTE**: Copie e salve as credenciais:
   - **Account ID**
   - **Access Key ID**
   - **Secret Access Key** (só aparece uma vez!)

### 3. Configurar Variáveis de Ambiente

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
# Cloudflare R2 Configuration
VITE_R2_ACCOUNT_ID=seu_account_id_aqui
VITE_R2_ACCESS_KEY_ID=seu_access_key_id_aqui
VITE_R2_SECRET_ACCESS_KEY=seu_secret_access_key_aqui
VITE_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
VITE_R2_PUBLIC_URL=https://pub-<account_id>.r2.dev

# Buckets
VITE_R2_BUCKET_DOCUMENTOS=ceu-music-documentos
VITE_R2_BUCKET_ANEXOS=ceu-music-anexos
VITE_R2_BUCKET_COMPROVANTES=ceu-music-comprovantes
VITE_R2_BUCKET_AUDIO=ceu-music-audio

# Provider de Storage (r2 ou supabase)
VITE_STORAGE_PROVIDER=r2
```

**Substitua:**
- `<account_id>` pelo seu Account ID do Cloudflare
- Os valores das credenciais pelos valores reais do token criado

### 4. Habilitar Acesso Público (para links compartilháveis)

Para que os links externos (copiar link / abrir em nova aba) funcionem e não retornem **Error 401**, é preciso habilitar a URL pública do bucket no R2:

1. No dashboard da Cloudflare, vá em **R2** → **Object Storage**.
2. Clique no bucket que você usa para anexos (ex.: **ceu-music-anexos**).
3. Abra a aba **Settings** do bucket.
4. Na seção **Public Development URL**, clique em **Enable**.
5. No diálogo **Allow Public Access?**, digite **allow** para confirmar e clique em **Allow**.
6. Confira se em **Public URL Access** aparece **Allowed**.

Depois disso, URLs no formato `https://pub-<account_id>.r2.dev/ceu-music-anexos/...` passam a abrir no navegador.

**Repita para cada bucket** que precisar de link público (ex.: ceu-music-anexos, ceu-music-audio se usar para áudio/vídeo).

**Nota**: A URL r2.dev é rate limited e indicada para desenvolvimento. Para produção com mais controle, use [domínio customizado](https://developers.cloudflare.com/r2/buckets/public-buckets/#connect-a-bucket-to-a-custom-domain).

### 5. Verificar Instalação

1. Instale as dependências (se ainda não fez):
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

3. Teste fazendo upload de um arquivo na aplicação

## Troubleshooting

### Erro: "Configuração do R2 não encontrada"
- Verifique se todas as variáveis de ambiente estão definidas no `.env.local`
- Certifique-se de que o arquivo `.env.local` está na raiz do projeto
- Reinicie o servidor de desenvolvimento após adicionar variáveis

### Erro: "Access Denied"
- Verifique se o token tem permissões corretas
- Confirme que o Account ID está correto
- Verifique se o bucket existe e o nome está correto

### Erro: "Network Error"
- Verifique se o endpoint está correto
- Confirme que não há bloqueios de firewall
- Teste a conectividade com o R2

### URLs não funcionam
- Se usando buckets públicos, verifique se o Public Access está habilitado
- Se usando signed URLs, verifique se o token não expirou
- Confirme que o formato da URL pública está correto

### Error 401 - "This bucket cannot be viewed"
- O bucket não está com acesso público habilitado. Siga o **passo 4** acima (Habilitar Acesso Público): em R2 → bucket → **Settings** → **Public Development URL** → **Enable** → digite `allow` e confirme.

## Segurança

⚠️ **IMPORTANTE**: 
- Nunca commite o arquivo `.env.local` no Git
- Adicione `.env.local` ao `.gitignore`
- Use variáveis de ambiente diferentes para desenvolvimento e produção
- Para produção, configure as variáveis no seu provedor de hospedagem (Vercel, Netlify, etc.)

## Migração de Arquivos Existentes

Se você já tem arquivos no Supabase Storage e quer migrar para R2:

1. Use o script de migração (a ser criado)
2. Ou migre manualmente usando a API do R2
3. Atualize as URLs no banco de dados

## Suporte

Para mais informações:
- [Documentação do Cloudflare R2](https://developers.cloudflare.com/r2/)
- [R2 S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/api/)


