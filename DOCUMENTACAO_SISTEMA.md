# CEU Music Ops - Documentação Completa do Sistema

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Funcionalidades Principais](#funcionalidades-principais)
4. [Estrutura de Dados](#estrutura-de-dados)
5. [Autenticação e Autorização](#autenticação-e-autorização)
6. [Módulos do Sistema](#módulos-do-sistema)
7. [Integrações](#integrações)
8. [Configuração e Instalação](#configuração-e-instalação)
9. [Scripts e Migrações](#scripts-e-migrações)
10. [Desenvolvimento](#desenvolvimento)

---

## 🎯 Visão Geral

**CEU Music Ops** é uma plataforma completa de gestão de produção musical desenvolvida para a gravadora CEU Music. O sistema permite gerenciar todo o ciclo de vida de projetos musicais, desde o planejamento até o lançamento, incluindo controle financeiro, gestão de artistas, produtores, fornecedores e documentação.

### Tecnologias Principais

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: Tailwind CSS + Remix Icon
- **Backend/Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Roteamento**: React Router DOM v7
- **Internacionalização**: i18next

---

## 🏗️ Arquitetura do Sistema

### Estrutura de Pastas

```
src/
├── components/          # Componentes reutilizáveis
│   ├── layout/         # Layout principal e sidebar
│   └── projetos/       # Componentes específicos de projetos
├── contexts/           # Contextos React (Auth, etc)
├── data/              # Dados mock (se necessário)
├── i18n/              # Configuração de internacionalização
├── lib/               # Bibliotecas e clientes (Supabase, R2)
├── pages/             # Páginas da aplicação
│   ├── artistas/      # Gestão de artistas
│   ├── dashboard/     # Dashboard principal
│   ├── documentos/    # Gestão de documentos
│   ├── financeiro/    # Módulo financeiro
│   ├── fornecedores/  # Gestão de fornecedores
│   ├── lancamentos/   # Gestão de lançamentos
│   ├── orcamentos/    # Gestão de orçamentos
│   ├── produtores/    # Gestão de produtores
│   └── projetos/      # Gestão de projetos
├── router/            # Configuração de rotas
└── services/          # Serviços (storage, etc)
```

### Fluxo de Dados

1. **Frontend (React)** → Faz requisições para Supabase
2. **Supabase** → Gerencia autenticação, banco de dados e storage (fallback)
3. **Cloudflare R2** → Armazena arquivos (áudio, vídeo, documentos, comprovantes)
4. **Serviço de Storage** → Abstração unificada entre R2 e Supabase

---

## ✨ Funcionalidades Principais

### 1. Gestão de Projetos

#### Visualizações
- **Lista**: Tabela com todos os projetos e suas informações
- **Kanban**: Visualização por fases (Planejamento, Gravando, Em Edição, Mixagem, Masterização, Finalizado, Em Fase de Lançamento, Lançado)

#### Recursos
- **Progresso Dinâmico**: Calculado automaticamente baseado na fase do projeto e status das faixas
- **Fases Interativas**: Dropdown para alterar fase diretamente na listagem
- **Informações de Lançamento**:
  - Data de lançamento ou data prevista
  - Tipo de data (real ou prevista)
  - Status de pré-produção (Com/Sem pré-produção)
- **Gestão de Faixas**:
  - Status: Pendente, Gravada, Em Mixagem, Masterização, Finalizada, Lançada
  - Anexos de áudio/vídeo com classificação:
    - **Áudio**: Pré-Produção, Pós-Gravação, Masterizado
    - **Vídeo**: Pré-Produção, Pós-Produção, Mixagem, Masterizado
  - Nome automático para vídeos: `video_nomeDoArtista_ColorOK`
  - Indicadores de último anexo e status de masterização
- **Referências**: Links do YouTube e outros
- **Ficha Técnica**: Informações detalhadas da faixa
- **Anexos**: Documentos e arquivos relacionados

### 2. Gestão de Artistas

- Cadastro completo de artistas
- Status (ativo/inativo)
- Detalhes e histórico
- Associação com projetos

### 3. Gestão de Produtores

- Cadastro de produtores musicais
- Associação com projetos
- Histórico de trabalhos

### 4. Gestão de Fornecedores

- Cadastro de fornecedores
- Categorização
- Histórico de serviços

### 5. Orçamentos

- Criação e gestão de orçamentos
- Associação com projetos
- Controle de valores orçados vs realizados

### 6. Módulo Financeiro

#### Visualizações
- **Pagamentos**: Lista de todos os pagamentos
- **Orçado vs Realizado**: Comparação de valores planejados e efetivos
- **Fluxo de Caixa**: Entradas e saídas
- **Extrato do Artista**: Extrato detalhado por artista

#### Recursos
- Controle de pagamentos parcelados
- Categorização de movimentações
- Centro de custo
- Notas fiscais e documentos
- Upload de comprovantes (R2)

### 7. Lançamentos

- Gestão de lançamentos musicais
- Associação com projetos
- Controle de datas e status

### 8. Documentos

- Upload e gestão de documentos
- Categorização
- Armazenamento no Cloudflare R2

---

## 🗄️ Estrutura de Dados

### Tabelas Principais

#### `projetos`
- Informações do projeto (nome, tipo, fase, progresso)
- Datas (início, lançamento, previsão)
- Status de pré-produção
- Relacionamentos (artista_id)

#### `faixas`
- Informações da faixa (nome, ordem, status)
- Relacionamento com projeto
- Status: pendente, gravada, em_mixagem, masterizacao, finalizada, lancada

#### `faixa_audio_video`
- Anexos de áudio e vídeo das faixas
- Tipo: audio/video
- Formato: arquivo/link
- Classificação: pre-producao, pos-producao, pos-gravacao, mixagem, masterizado
- URLs e nomes de arquivo

#### `artistas`
- Dados dos artistas
- Status (ativo/inativo)

#### `produtores`
- Dados dos produtores

#### `fornecedores`
- Dados dos fornecedores

#### `orcamentos`
- Orçamentos de projetos
- Valores e descrições

#### `pagamentos`
- Pagamentos e recebimentos
- Controle financeiro completo
- Relacionamentos (projeto_id, artista_id, orcamento_id)

#### `projeto_anexos`
- Anexos gerais do projeto
- Tipos: PRÉ, Outro

#### `projeto_referencias`
- Referências do projeto (YouTube, etc)

---

## 🔐 Autenticação e Autorização

### Sistema de Roles

O sistema utiliza um sistema de roles para controlar acesso:

- **admin**: Acesso total ao sistema
- **executivo**: Acesso executivo
- **ar**: A&R (Artists & Repertoire)
- **producao**: Produção
- **financeiro**: Módulo financeiro
- **operador**: Operador geral

### Rotas Protegidas

Todas as rotas (exceto login, registro, recuperar senha) são protegidas e requerem autenticação via Supabase.

### Menu por Role

O menu lateral é dinâmico e mostra apenas as opções permitidas para cada role:

- **Dashboard**: admin, executivo, ar, producao, financeiro, operador
- **Artistas**: admin, executivo, ar, producao, operador
- **Projetos**: admin, executivo, ar, producao, operador
- **Produtores**: admin, executivo, ar, producao, operador
- **Fornecedores**: admin, executivo, ar, producao, financeiro, operador
- **Orçamentos**: admin, executivo, ar, financeiro, operador
- **Financeiro**: admin, executivo, financeiro, operador
- **Lançamentos**: admin, executivo, ar, producao, operador
- **Documentos**: admin, executivo, ar, financeiro, operador

---

## 📦 Módulos do Sistema

### 1. Dashboard

Página inicial com visão geral do sistema, estatísticas e informações relevantes.

### 2. Artistas (`/artistas`)

- Listagem de artistas
- Detalhes do artista
- Criação e edição
- Status (ativo/inativo)

### 3. Projetos (`/projetos`)

#### Listagem (`/projetos`)
- Visualização em lista ou kanban
- Filtros e busca
- Alteração de fase inline
- Informações de lançamento e pré-produção

#### Detalhes (`/projetos/:id`)
- Informações completas do projeto
- Gestão de faixas
- Anexos de áudio/vídeo
- Referências
- Ficha técnica
- Anexos gerais

#### Novo Projeto (`/projetos/novo`)
- Formulário de criação
- Seleção de artista
- Configuração inicial

### 4. Produtores (`/produtores`)

- Listagem e gestão de produtores
- Associação com projetos

### 5. Fornecedores (`/fornecedores`)

- Listagem e gestão de fornecedores
- Categorização

### 6. Orçamentos (`/orcamentos`)

- Criação e gestão de orçamentos
- Associação com projetos
- Controle de valores

### 7. Financeiro (`/financeiro`)

#### Abas
- **Pagamentos**: Lista completa de pagamentos
- **Orçado vs Realizado**: Comparação
- **Fluxo de Caixa**: Entradas e saídas
- **Extrato do Artista**: Extrato por artista

### 8. Lançamentos (`/lancamentos`)

- Gestão de lançamentos
- Associação com projetos
- Controle de datas

### 9. Documentos (`/documentos`)

- Upload e gestão de documentos
- Categorização
- Download

---

## 🔌 Integrações

### Supabase

**Uso**:
- Autenticação de usuários
- Banco de dados PostgreSQL
- Row Level Security (RLS)
- Storage (fallback)

**Configuração**:
```env
VITE_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### Cloudflare R2

**Uso**:
- Armazenamento de arquivos (áudio, vídeo, documentos, comprovantes)
- Compatível com S3 API
- URLs públicas ou assinadas

**Buckets**:
- `ceu-music-documentos`
- `ceu-music-anexos`
- `ceu-music-comprovantes`
- `ceu-music-audio`

**Configuração**:
```env
VITE_R2_ACCOUNT_ID=seu-account-id
VITE_R2_ACCESS_KEY_ID=sua-access-key
VITE_R2_SECRET_ACCESS_KEY=sua-secret-key
VITE_R2_ENDPOINT=https://seu-account-id.r2.cloudflarestorage.com
VITE_R2_PUBLIC_URL=https://seu-dominio-publico.com
```

### Serviço de Storage Unificado

O sistema utiliza um serviço unificado (`src/services/storage.ts`) que abstrai R2 e Supabase, permitindo fácil migração ou uso de ambos.

---

## ⚙️ Configuração e Instalação

### Pré-requisitos

- Node.js 20.19+ ou 22.12+
- npm ou yarn
- Conta no Supabase
- Conta no Cloudflare (para R2)

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd Ceu-Music-ops
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
VITE_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon

# Cloudflare R2
VITE_R2_ACCOUNT_ID=seu-account-id
VITE_R2_ACCESS_KEY_ID=sua-access-key
VITE_R2_SECRET_ACCESS_KEY=sua-secret-key
VITE_R2_ENDPOINT=https://seu-account-id.r2.cloudflarestorage.com
VITE_R2_PUBLIC_URL=https://seu-dominio-publico.com

# Buckets R2 (opcional, valores padrão serão usados)
VITE_R2_BUCKET_DOCUMENTOS=ceu-music-documentos
VITE_R2_BUCKET_ANEXOS=ceu-music-anexos
VITE_R2_BUCKET_COMPROVANTES=ceu-music-comprovantes
VITE_R2_BUCKET_AUDIO=ceu-music-audio
```

4. **Execute os scripts SQL no Supabase**

Execute os scripts em `scripts/` no Supabase SQL Editor para criar/atualizar as tabelas necessárias.

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

### Scripts Disponíveis

- `npm run dev`: Inicia servidor de desenvolvimento
- `npm run build`: Build para produção
- `npm run preview`: Preview do build de produção
- `npm run lint`: Executa o linter
- `npm run type-check`: Verifica tipos TypeScript

---

## 📝 Scripts e Migrações

### Scripts SQL Disponíveis

Os scripts em `scripts/` devem ser executados no Supabase SQL Editor:

#### Tabelas Principais
- `create-faixas-table.sql`: Cria tabela de faixas
- `create-produtores-table.sql`: Cria tabela de produtores
- `create-fornecedores-table.sql`: Cria tabela de fornecedores
- `create-projeto-anexos-table.sql`: Cria tabela de anexos
- `create-projeto-referencias-table.sql`: Cria tabela de referências
- `create-faixa-audio-video-table.sql`: Cria tabela de áudio/vídeo

#### Atualizações
- `fix-projetos-columns.sql`: Adiciona colunas em projetos
- `fix-artistas-columns.sql`: Atualiza colunas de artistas
- `fix-faixas-table.sql`: Atualiza tabela de faixas
- `fix-pagamentos-financeiro-completo.sql`: Adiciona funcionalidades financeiras
- `add-lancamento-preproducao-columns.sql`: Adiciona colunas de lançamento e pré-produção

#### Utilitários
- `create-admin.js`: Cria usuário administrador
- `check-*.js`: Scripts de verificação

### Ordem Recomendada de Execução

1. Tabelas principais (create-*.sql)
2. Atualizações (fix-*.sql)
3. Adições de funcionalidades (add-*.sql)

---

## 💻 Desenvolvimento

### Estrutura de Componentes

#### Componentes Reutilizáveis

- **FileUpload**: Upload de arquivos para R2/Supabase
- **ReferenciaForm**: Formulário de referências (YouTube, etc)
- **YouTubePreview**: Preview de vídeos do YouTube
- **MainLayout**: Layout principal com sidebar
- **Sidebar**: Menu lateral dinâmico por role
- **ProtectedRoute**: Rota protegida por autenticação

### Padrões de Código

- **TypeScript**: Tipagem forte em todo o código
- **React Hooks**: useState, useEffect, useContext
- **Async/Await**: Para operações assíncronas
- **Error Handling**: Try/catch em todas as operações críticas

### Cálculo de Progresso

O progresso dos projetos é calculado dinamicamente baseado em:

1. **Fase do Projeto**: Cada fase tem uma porcentagem base e intervalo
2. **Status das Faixas**: Percentual de faixas com status válidos para a fase

**Fases e Intervalos**:
- Planejamento: 0-12%
- Gravando: 12-30%
- Em Edição: 30-50%
- Mixagem: 50-70%
- Masterização: 70-85%
- Finalizado: 85-95%
- Em Fase de Lançamento: 95-100%
- Lançado: 100%

### Sistema de Upload

#### Áudio/Vídeo
- **Classificação por tipo**: Opções diferentes para áudio e vídeo
- **Nome automático**: Vídeos são renomeados para `video_nomeDoArtista_ColorOK`
- **Indicadores**: Mostra último anexo e status de masterização
- **Alertas**: Indica quando falta áudio/vídeo masterizado

#### Documentos e Comprovantes
- Upload para R2
- URLs assinadas ou públicas
- Categorização

### Internacionalização

O sistema está preparado para i18next, mas atualmente focado em português brasileiro.

---

## 🚀 Deploy

### Build de Produção

```bash
npm run build
```

O build será gerado em `dist/`.

### Variáveis de Ambiente em Produção

Configure as mesmas variáveis de ambiente no seu provedor de hospedagem (Vercel, Netlify, etc).

### CORS e R2

Certifique-se de configurar CORS no Cloudflare R2 para permitir acesso do seu domínio. Veja `docs/CONFIGURAR_CORS_R2.md`.

---

## 📚 Documentação Adicional

- `docs/CONFIGURACAO_R2.md`: Guia completo de configuração do R2
- `docs/CONFIGURAR_CORS_R2.md`: Configuração de CORS no R2
- `docs/PLANO_IMPLEMENTACAO_R2.md`: Plano de implementação do R2
- `docs/RESUMO_IMPLEMENTACAO_R2.md`: Resumo da implementação
- `docs/TESTES_R2.md`: Guia de testes

---

## 🐛 Troubleshooting

### Erro de Porta em Uso

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Erro de Variáveis de Ambiente

Certifique-se de que:
1. O arquivo `.env.local` existe na raiz
2. Todas as variáveis estão configuradas
3. O servidor foi reiniciado após adicionar variáveis

### Erro de Upload

Verifique:
1. Configuração do R2
2. CORS configurado
3. Permissões do bucket
4. Tamanho do arquivo (limite: 200MB para áudio/vídeo)

---

## 📞 Suporte

Para questões e suporte, consulte a documentação ou entre em contato com a equipe de desenvolvimento.

---

**Última atualização**: Dezembro 2024
**Versão**: 1.0.0
