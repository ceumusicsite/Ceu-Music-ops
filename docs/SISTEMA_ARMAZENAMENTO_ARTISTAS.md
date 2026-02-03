# Sistema de Armazenamento de Artistas

Sistema tipo drive para gerenciar pastas e arquivos de cada artista, integrado com Cloudflare R2.

## 📋 Visão Geral

Cada artista possui seu próprio espaço de armazenamento onde é possível:
- ✅ Criar pastas hierárquicas
- ✅ Fazer upload de arquivos
- ✅ Navegar entre pastas (breadcrumbs)
- ✅ Deletar pastas e arquivos
- ✅ Buscar arquivos e pastas
- ✅ Visualizar em grade ou lista

## 🗄️ Estrutura do Banco de Dados

### Tabela: `artistas_anexos`

Armazena metadados de pastas e arquivos:

```sql
- id: UUID (PK)
- artista_id: UUID (FK -> artistas)
- tipo: 'pasta' | 'arquivo'
- nome: VARCHAR(255)
- pasta_pai_id: UUID (FK -> artistas_anexos, NULL para raiz)
- arquivo_key: TEXT (key no R2, apenas para arquivos)
- arquivo_url: TEXT (URL do arquivo, apenas para arquivos)
- arquivo_tamanho: BIGINT (bytes, apenas para arquivos)
- arquivo_tipo: VARCHAR(100) (MIME type)
- arquivo_extensao: VARCHAR(10)
- descricao: TEXT
- tags: TEXT[]
- ordem: INTEGER
- created_at, updated_at, created_by
```

## 📁 Estrutura no Cloudflare R2

Os arquivos são organizados no R2 seguindo a estrutura:

```
ceu-music-anexos/
  └── artistas/
      └── {artista-normalizado}/
          ├── {pasta-1}/
          │   ├── arquivo1.pdf
          │   └── arquivo2.jpg
          ├── {pasta-2}/
          │   └── subpasta/
          │       └── arquivo3.mp3
          └── arquivo-raiz.pdf
```

## 🚀 Como Usar

### 1. Criar a Tabela no Supabase

Execute o script SQL:

```bash
# No Supabase Dashboard > SQL Editor
# Cole o conteúdo de: scripts/create-artistas-anexos-table.sql
```

### 2. Acessar o Sistema

1. Vá para a página de um artista específico
2. Role até a seção "Armazenamento"
3. Use os botões para:
   - **Nova Pasta**: Criar uma nova pasta
   - **Upload**: Fazer upload de arquivos

### 3. Navegar

- Clique em uma pasta para entrar nela
- Use os breadcrumbs para voltar às pastas anteriores
- Clique em "Raiz" para voltar ao início

## 🎨 Funcionalidades

### Criar Pasta

1. Clique em "Nova Pasta"
2. Digite o nome da pasta
3. Clique em "Criar"

A pasta será criada apenas no banco de dados (metadados). No R2, a estrutura será criada quando arquivos forem enviados para ela.

### Upload de Arquivos

1. Clique em "Upload"
2. Selecione um ou mais arquivos
3. Clique em "Enviar"

Os arquivos serão:
- Enviados para o Cloudflare R2 na pasta correta
- Metadados salvos no Supabase
- Organizados automaticamente pela estrutura de pastas

### Deletar

- Passe o mouse sobre um item
- Clique no ícone de deletar (aparece no hover)
- Confirme a exclusão

**Nota**: Pastas só podem ser deletadas se estiverem vazias.

### Buscar

Use a barra de busca para encontrar arquivos e pastas pelo nome.

### Visualização

Alterne entre visualização em grade e lista usando o botão no canto superior direito.

## 🔧 Componentes

### FileManager (`src/components/artistas/FileManager.tsx`)

Componente principal que gerencia:
- Listagem de pastas e arquivos
- Navegação hierárquica
- Upload de arquivos
- Criação de pastas
- Deleção de itens

### Integração com R2

O componente usa:
- `uploadToR2()` para fazer upload de arquivos
- `storageService` para operações de storage
- `R2_BUCKETS.ANEXOS` como bucket padrão

## 📝 Notas Técnicas

### Normalização de Nomes

Os nomes dos artistas são normalizados para criar caminhos seguros:
- Remove acentos
- Converte para minúsculas
- Substitui espaços por hífens
- Remove caracteres especiais

### URLs Assinadas

Por padrão, os arquivos usam URLs assinadas (válidas por 1 hora) para maior segurança. Se necessário, pode-se configurar URLs públicas no `.env`.

### Performance

- Índices otimizados no banco para buscas rápidas
- Lazy loading de arquivos (carrega apenas quando necessário)
- Cache de breadcrumbs para navegação rápida

## 🔒 Segurança

- RLS (Row Level Security) habilitado
- Apenas usuários autenticados podem acessar
- URLs assinadas por padrão (mais seguro)
- Validação de tipos de arquivo no frontend

## 🐛 Troubleshooting

### Erro ao criar pasta

- Verifique se o nome não está vazio
- Verifique se não há caracteres inválidos
- Verifique a conexão com o Supabase

### Erro ao fazer upload

- Verifique a configuração do R2 no `.env`
- Verifique se o bucket `ceu-music-anexos` existe
- Verifique as permissões do token R2
- Verifique o tamanho do arquivo (limites do R2)

### Arquivos não aparecem

- Recarregue a página
- Verifique se o upload foi concluído
- Verifique os logs do console do navegador

## 📚 Próximos Passos (Opcional)

- [ ] Adicionar drag & drop para upload
- [ ] Adicionar preview de imagens e PDFs
- [ ] Adicionar renomear arquivos/pastas
- [ ] Adicionar mover arquivos entre pastas
- [ ] Adicionar compartilhamento de arquivos
- [ ] Adicionar versionamento de arquivos
- [ ] Adicionar tags e busca avançada
