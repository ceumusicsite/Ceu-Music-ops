# Scripts de Configuração do Banco de Dados

## Setup de Documentos

### Como executar:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://app.supabase.com
   - Selecione seu projeto

2. **Execute o script SQL**
   - Clique em "SQL Editor" no menu lateral
   - Clique em "New query"
   - Cole o conteúdo do arquivo `setup-documentos.sql`
   - Clique em "Run" ou pressione Ctrl+Enter

3. **Configure o Storage**
   - No menu lateral, clique em "Storage"
   - Clique em "New bucket"
   - Configure:
     - **Name**: `arquivos`
     - **Public bucket**: ✅ SIM (marcar como público)
     - **File size limit**: 52428800 (50MB) ou o limite desejado
     - **Allowed MIME types**: (deixe vazio para aceitar todos)
   - Clique em "Create bucket"

4. **Verificar Políticas de Storage**
   - As políticas já estão incluídas no script SQL
   - Se necessário, você pode ajustá-las no SQL Editor executando apenas as seções 7 e 8 do script

### Estrutura da Tabela `documentos`:

- `id` - UUID (chave primária)
- `nome` - Nome do documento
- `categoria` - Tipo: 'contrato', 'letra', 'guia_gravacao', 'arte'
- `tipo_associacao` - 'artista', 'projeto', ou 'nenhum'
- `artista_id` - Referência ao artista (opcional)
- `projeto_id` - Referência ao projeto (opcional)
- `arquivo_url` - URL pública do arquivo no storage
- `arquivo_nome` - Nome original do arquivo
- `tamanho` - Tamanho em bytes
- `descricao` - Descrição opcional
- `created_at` - Data de criação
- `updated_at` - Data de última atualização

### Permissões (RLS):

- **Visualização**: Todos os usuários autenticados podem visualizar
- **Criação/Edição/Exclusão**: Apenas admin e executivo

### Bucket de Storage:

- **Nome**: `arquivos`
- **Público**: Sim
- **Caminho padrão**: `documentos/{timestamp}-{random}.{extensão}`

