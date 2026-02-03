# Criar Tabela de Anexos dos Artistas

Este script cria a tabela `artistas_anexos` no Supabase para armazenar metadados de pastas e arquivos dos artistas.

## Como executar

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `create-artistas-anexos-table.sql`
4. Execute o script

## Estrutura da Tabela

A tabela `artistas_anexos` armazena:

- **Pastas**: Metadados de pastas criadas pelo usuário
- **Arquivos**: Metadados de arquivos enviados, incluindo referências ao Cloudflare R2

## Campos Principais

- `tipo`: 'pasta' ou 'arquivo'
- `nome`: Nome da pasta ou arquivo
- `pasta_pai_id`: ID da pasta pai (NULL para raiz)
- `arquivo_key`: Key do arquivo no R2 (apenas para arquivos)
- `arquivo_url`: URL do arquivo (apenas para arquivos)
- `arquivo_tamanho`: Tamanho em bytes (apenas para arquivos)

## Segurança (RLS)

A tabela usa Row Level Security (RLS) para garantir que apenas usuários autenticados possam:
- Ver anexos
- Criar anexos
- Atualizar anexos
- Deletar anexos

## Índices

A tabela possui índices otimizados para:
- Busca por artista
- Busca por pasta pai
- Busca por tipo
- Busca por nome
- Busca por tags (GIN index)
