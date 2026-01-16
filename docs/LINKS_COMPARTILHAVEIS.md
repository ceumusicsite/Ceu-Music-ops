# Links Compartilháveis para Formulários de Áudio/Vídeo

## Descrição

Esta funcionalidade permite gerar links compartilháveis para que outras pessoas possam preencher formulários de adição de áudio/vídeo para faixas de projetos, sem precisar ter acesso ao sistema.

## Como Usar

### 1. Gerar um Link Compartilhável

1. Acesse a página de detalhes de um projeto
2. Na seção de faixas, clique em "Anexar Áudio/Vídeo" na faixa desejada
3. No campo "Formato", selecione **"Link Compartilhável"**
4. O sistema irá gerar automaticamente um link único (você pode gerar o link mesmo sem selecionar o tipo primeiro)
5. Clique no botão de copiar para copiar o link para a área de transferência
6. **Opcional**: Se você selecionar o tipo (Áudio ou Vídeo) antes de gerar o link, o tipo será pré-definido no formulário. Caso contrário, a pessoa que receber o link poderá escolher o tipo.

### 2. Compartilhar o Link

- Envie o link gerado para a pessoa que precisa preencher o formulário
- O link pode ser enviado por email, WhatsApp, ou qualquer outro meio
- O link expira automaticamente em **30 dias**

### 3. Preencher o Formulário (Pessoa Externa)

1. A pessoa acessa o link compartilhado
2. Preenche os campos do formulário:
   - **Tipo**: Se o tipo foi pré-definido, aparecerá desabilitado. Caso contrário, a pessoa pode escolher entre Áudio ou Vídeo
   - **Formato**: Pode escolher entre Link ou Arquivo
   - **URL do Link** (se formato Link): Informa a URL do áudio/vídeo
   - **Arquivo** (se formato Arquivo): Faz upload do arquivo
   - **Classificação**: Seleciona a classificação (as opções dependem do tipo escolhido):
     - **Áudio**: Pré-Produção, Pós-Gravação, Masterizado
     - **Vídeo**: Pré-Produção, Pós-Produção, Mixagem, Masterizado
   - **Descrição**: Campo opcional para descrição
3. Clica em "Enviar"
4. O formulário é salvo automaticamente na faixa do projeto

## Características

- ✅ **Seguro**: Cada link é único e só pode ser usado uma vez
- ✅ **Expiração**: Links expiram automaticamente em 30 dias
- ✅ **Rastreável**: Você pode ver quando o link foi usado e quais dados foram preenchidos
- ✅ **Público**: Não requer autenticação para preencher o formulário
- ✅ **Validação**: O sistema valida se o link ainda é válido antes de permitir o preenchimento

## Estrutura do Banco de Dados

A tabela `shared_audio_video_links` armazena:
- Token único do link
- ID da faixa e projeto associados
- Tipo (audio/video)
- Data de expiração
- Status de uso
- Dados preenchidos (quando usado)

## Script SQL

### Criar a Tabela

Execute o script `scripts/create-shared-links-table.sql` no Supabase SQL Editor para criar a tabela necessária.

### Atualizar Tabela Existente

Se você já criou a tabela anteriormente e quer permitir que o tipo seja escolhido no formulário (em vez de ser obrigatório), execute o script `scripts/update-shared-links-allow-null-tipo.sql` para atualizar a estrutura.

## Segurança

- Links só podem ser usados uma vez
- Links expirados não podem ser usados
- Apenas usuários autenticados podem gerar links
- Qualquer pessoa pode acessar e preencher um link válido (não expirado e não usado)

