# Matriz de Permissões Detalhada - CEU Music Ops

## 📋 Visão Geral

| Módulo | Admin | Produção | Financeiro |
|--------|:-----:|:--------:|:----------:|
| **Dashboard** | ✅ Completo | ✅ Completo | ✅ Completo |
| **Artistas** | ✅ Completo | ✅ Completo | ❌ Sem acesso |
| **Projetos** | ✅ Completo | ✅ Completo | ❌ Sem acesso |
| **Orçamentos** | ✅ Completo | ✅ Criar/Ver | ✅ Aprovar/Ver |
| **Financeiro** | ✅ Completo | ❌ Sem acesso | ✅ Completo |
| **Lançamentos** | ✅ Completo | ✅ Completo | ❌ Sem acesso |
| **Documentos** | ✅ Completo | ✅ Completo | ❌ Sem acesso |
| **Usuários** | ✅ Completo | ❌ Sem acesso | ❌ Sem acesso |

---

## 🔐 Permissões Detalhadas por Módulo

### Dashboard
**Todos os perfis** podem:
- Visualizar estatísticas gerais
- Ver projetos recentes
- Ver orçamentos pendentes
- Ver próximos lançamentos
- Visualizar resumo financeiro

---

### Artistas
**Admin e Produção** podem:
- ✅ Listar artistas
- ✅ Visualizar detalhes
- ✅ Criar artista
- ✅ Editar artista
- ✅ Deletar artista
- ✅ Importar artistas (CSV/JSON)
- ✅ Visualizar projetos do artista

**Financeiro**: ❌ Sem acesso

---

### Projetos
**Admin e Produção** podem:
- ✅ Listar projetos
- ✅ Visualizar detalhes do projeto
- ✅ Criar projeto
- ✅ Editar projeto
- ✅ Deletar projeto
- ✅ Gerenciar faixas (adicionar, editar, deletar)
- ✅ Atualizar status das faixas
- ✅ Configurar gravação (estúdio, produtor, observações)
- ✅ Visualizar orçamento do projeto

**Financeiro**: ❌ Sem acesso

---

### Orçamentos
**Admin** pode:
- ✅ Listar todos os orçamentos
- ✅ Criar orçamento
- ✅ Aprovar orçamento
- ✅ Recusar orçamento
- ✅ Visualizar orçamentos

**Produção** pode:
- ✅ Listar orçamentos
- ✅ Criar orçamento
- ✅ Visualizar orçamentos
- ❌ Aprovar/Recusar orçamentos

**Financeiro** pode:
- ✅ Listar orçamentos
- ✅ Aprovar orçamento
- ✅ Recusar orçamento
- ✅ Visualizar orçamentos
- ❌ Criar orçamento

---

### Financeiro
**Admin e Financeiro** podem:
- ✅ Listar pagamentos
- ✅ Criar pagamento
- ✅ Editar pagamento
- ✅ Deletar pagamento
- ✅ Marcar como pago/pendente
- ✅ Filtrar por categoria (Estúdio, Produtor, Mixagem, Masterização)
- ✅ Filtrar por status
- ✅ Visualizar resumo financeiro

**Produção**: ❌ Sem acesso

---

### Lançamentos
**Admin e Produção** podem:
- ✅ Listar lançamentos
- ✅ Criar lançamento
- ✅ Editar lançamento
- ✅ Agendar lançamentos
- ✅ Visualizar calendário

**Financeiro**: ❌ Sem acesso

---

### Documentos
**Admin e Produção** podem:
- ✅ Listar documentos
- ✅ Fazer upload
- ✅ Deletar documentos
- ✅ Download documentos
- ✅ Associar a artistas ou projetos
- ✅ Filtrar por categoria

**Financeiro**: ❌ Sem acesso

---

### Usuários
**Apenas Admin** pode:
- ✅ Listar usuários
- ✅ Criar usuário (via script recomendado)
- ✅ Editar usuário (nome, perfil)
- ✅ Deletar usuário
- ✅ Visualizar estatísticas de usuários

**Produção e Financeiro**: ❌ Sem acesso

---

## 🎯 Fluxo de Trabalho Recomendado

### Criação de Projeto (Produção)
1. Cria artista (se necessário)
2. Cria projeto vinculado ao artista
3. Define orçamento inicial
4. Cria faixas do projeto
5. Faz upload de documentos relacionados

### Aprovação Financeira (Financeiro)
1. Visualiza orçamentos pendentes
2. Analisa valores e detalhes
3. Aprova ou recusa orçamento
4. Cria pagamentos para orçamento aprovado
5. Acompanha status dos pagamentos

### Gestão Completa (Admin)
- Acesso a todas as funcionalidades
- Pode criar e gerenciar usuários
- Supervisiona todos os processos

---

## 📝 Notas de Implementação

- As permissões são verificadas em duas camadas:
  1. **Menu lateral**: Filtra itens baseado no perfil
  2. **Páginas**: Verificam permissão no carregamento

- Para adicionar nova permissão:
  1. Atualize `menuItems` em `Sidebar.tsx`
  2. Adicione verificação na página correspondente
  3. Atualize esta documentação

