# Sistema de Usuários e Acessos - Implementação Completa

## ✅ O que foi implementado

### 1. Níveis de Acesso
- ✅ **Administrador** (`admin`) - Acesso completo
- ✅ **Produção** (`producao`) - Gestão de projetos e artistas
- ✅ **Financeiro** (`financeiro`) - Gestão financeira e aprovação de orçamentos

### 2. Página de Gerenciamento de Usuários (`/usuarios`)
- ✅ Listagem de usuários com filtros
- ✅ Estatísticas por perfil
- ✅ Busca por nome/email
- ✅ Edição de usuários (nome, perfil)
- ✅ Exclusão de usuários
- ✅ Acesso restrito apenas para Admin

### 3. Controle de Permissões
- ✅ Menu lateral filtra opções por perfil
- ✅ Páginas bloqueiam acesso não autorizado
- ✅ Botões e ações são ocultados conforme permissões
- ✅ Verificação em:
  - Financeiro (admin, financeiro)
  - Orçamentos (admin, producao, financeiro)
  - Usuários (apenas admin)

### 4. Scripts de Administração
- ✅ `npm run create-user` - Criar usuário com qualquer perfil
- ✅ `npm run create-admin` - Criar usuário administrador
- ✅ Scripts interativos com validação

### 5. Documentação
- ✅ `docs/PERMISSOES.md` - Guia completo de permissões
- ✅ `docs/MATRIZ-PERMISSOES.md` - Matriz detalhada por módulo
- ✅ `docs/SISTEMA-USUARIOS.md` - Este arquivo

---

## 🚀 Como usar

### Criar um Novo Usuário

#### Opção 1: Via Script (Recomendado)
```bash
npm run create-user
```
O script solicitará:
- Nome completo
- E-mail
- Senha
- Perfil (1=Admin, 2=Produção, 3=Financeiro)

#### Opção 2: Via Interface
1. Faça login como Admin
2. Acesse `/usuarios`
3. Clique em "Novo Usuário"
4. ⚠️ **Nota**: A criação via interface mostra instruções. Use o script para criar usuário completo.

#### Opção 3: Auto-registro
- Usuário acessa `/registro`
- Cria conta própria
- Perfil padrão: **Produção**
- Admin pode alterar o perfil depois em `/usuarios`

---

## 🔐 Permissões por Perfil

### Administrador
**Acesso a tudo:**
- Dashboard
- Artistas (completo)
- Projetos (completo)
- Orçamentos (criar, aprovar, recusar)
- Financeiro (completo)
- Lançamentos (completo)
- Documentos (completo)
- **Usuários** (criar, editar, deletar)

### Produção
**Foco em projetos:**
- Dashboard
- Artistas
- Projetos
- Orçamentos (criar, visualizar - **não pode aprovar**)
- Lançamentos
- Documentos
- ❌ Financeiro (sem acesso)
- ❌ Usuários (sem acesso)

### Financeiro
**Foco financeiro:**
- Dashboard
- Orçamentos (visualizar, aprovar, recusar - **não pode criar**)
- Financeiro (completo)
- ❌ Artistas (sem acesso)
- ❌ Projetos (sem acesso)
- ❌ Lançamentos (sem acesso)
- ❌ Documentos (sem acesso)
- ❌ Usuários (sem acesso)

---

## 📝 Configuração Necessária

### Variáveis de Ambiente
No arquivo `.env.local`:
```env
VITE_PUBLIC_SUPABASE_URL=sua_url
VITE_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key  # Para scripts de criação
```

⚠️ **IMPORTANTE**: A `SUPABASE_SERVICE_ROLE_KEY` é muito sensível. Nunca a exponha em repositórios públicos!

---

## 🔄 Fluxo de Trabalho

### Exemplo: Novo Projeto
1. **Produção** cria artista
2. **Produção** cria projeto
3. **Produção** cria orçamento
4. **Financeiro** (ou Admin) aprova orçamento
5. **Financeiro** cria pagamentos
6. **Produção** gerencia faixas e documentos

### Exemplo: Gestão de Usuários
1. **Admin** acessa `/usuarios`
2. **Admin** usa script ou interface para criar usuário
3. Usuário recebe credenciais
4. Usuário faz login
5. Sistema aplica permissões automaticamente

---

## 🛠️ Arquivos Modificados/Criados

### Páginas
- ✅ `src/pages/usuarios/page.tsx` (novo)
- ✅ `src/pages/financeiro/page.tsx` (adicionada verificação)
- ✅ `src/pages/orcamentos/page.tsx` (adicionada verificação)

### Componentes
- ✅ `src/components/layout/Sidebar.tsx` (atualizado menu e permissões)

### Contexto
- ✅ `src/contexts/AuthContext.tsx` (roles atualizados)

### Rotas
- ✅ `src/router/config.tsx` (nova rota `/usuarios`)

### Scripts
- ✅ `scripts/create-user.js` (novo)
- ✅ `package.json` (novo script adicionado)

### Documentação
- ✅ `docs/PERMISSOES.md`
- ✅ `docs/MATRIZ-PERMISSOES.md`
- ✅ `docs/SISTEMA-USUARIOS.md`

---

## 🎯 Próximos Passos (Opcional)

### Melhorias Futuras
- [ ] Edge Function para criar usuários via interface
- [ ] Histórico de ações do usuário
- [ ] Notificações por perfil
- [ ] Permissões granulares (ex: produção pode aprovar orçamentos até X valor)
- [ ] Integração com logs de auditoria

---

## ❓ FAQ

**P: Como alterar o perfil de um usuário?**
R: Admin acessa `/usuarios`, clica em "Editar" no usuário e altera o perfil.

**P: Posso ter mais de um admin?**
R: Sim, quantos quiser. Use `npm run create-user` e escolha perfil Admin.

**P: O que acontece se um usuário tenta acessar página sem permissão?**
R: Vê uma mensagem "Acesso Negado" e não pode acessar o conteúdo.

**P: Preciso da service_role key para funcionar?**
R: Apenas para criar usuários via script. A aplicação funciona sem ela, mas usuários precisam se registrar manualmente.

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique `docs/PERMISSOES.md` para permissões detalhadas
2. Consulte `docs/MATRIZ-PERMISSOES.md` para matriz completa
3. Verifique logs do console no navegador

