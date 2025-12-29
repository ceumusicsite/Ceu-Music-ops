# Sistema de Permissões - CEU Music Ops

## Níveis de Acesso

O sistema possui **3 níveis de acesso** principais:

### 1. Administrador (`admin`)
**Acesso completo ao sistema**

**Páginas e Funcionalidades:**
- ✅ Dashboard
- ✅ Artistas (visualizar, criar, editar, deletar)
- ✅ Projetos (visualizar, criar, editar, deletar)
- ✅ Orçamentos (visualizar, criar, aprovar, recusar)
- ✅ Financeiro (visualizar, criar, editar, deletar pagamentos)
- ✅ Lançamentos (visualizar, criar, editar)
- ✅ Documentos (visualizar, upload, deletar)
- ✅ **Usuários** (visualizar, criar, editar, deletar)

**Permissões Especiais:**
- Gerenciar todos os usuários do sistema
- Alterar perfil de qualquer usuário
- Deletar usuários
- Acesso a todas as funcionalidades administrativas

---

### 2. Produção (`producao`)
**Foco em gestão de projetos e artistas**

**Páginas e Funcionalidades:**
- ✅ Dashboard
- ✅ Artistas (visualizar, criar, editar)
- ✅ Projetos (visualizar, criar, editar, gerenciar faixas)
- ✅ Orçamentos (visualizar, criar)
- ❌ Financeiro (sem acesso)
- ✅ Lançamentos (visualizar, criar, editar)
- ✅ Documentos (visualizar, upload, deletar)

**Permissões:**
- Pode gerenciar artistas e projetos
- Pode criar e visualizar orçamentos (não pode aprovar)
- Pode fazer upload e gerenciar documentos
- Pode visualizar lançamentos
- **NÃO** tem acesso à área financeira

---

### 3. Financeiro (`financeiro`)
**Foco em gestão financeira**

**Páginas e Funcionalidades:**
- ✅ Dashboard
- ❌ Artistas (sem acesso)
- ❌ Projetos (sem acesso)
- ✅ Orçamentos (visualizar, aprovar, recusar)
- ✅ Financeiro (visualizar, criar, editar, deletar pagamentos)
- ❌ Lançamentos (sem acesso)
- ❌ Documentos (sem acesso)
- ❌ Usuários (sem acesso)

**Permissões:**
- Pode visualizar e aprovar/recusar orçamentos
- Pode gerenciar pagamentos (criar, editar, marcar como pago/pendente)
- Pode visualizar relatórios financeiros
- **NÃO** tem acesso a artistas, projetos e documentos

---

## Matriz de Permissões

| Funcionalidade | Admin | Produção | Financeiro |
|---------------|:-----:|:--------:|:----------:|
| Dashboard | ✅ | ✅ | ✅ |
| Artistas | ✅ | ✅ | ❌ |
| Projetos | ✅ | ✅ | ❌ |
| Orçamentos (criar) | ✅ | ✅ | ❌ |
| Orçamentos (aprovar) | ✅ | ❌ | ✅ |
| Financeiro | ✅ | ❌ | ✅ |
| Lançamentos | ✅ | ✅ | ❌ |
| Documentos | ✅ | ✅ | ❌ |
| Usuários | ✅ | ❌ | ❌ |

---

## Como Funciona

### Autenticação
- Sistema de login via email e senha (Supabase Auth)
- Sessão persistente
- Logout disponível

### Controle de Acesso
- Menu lateral filtra opções baseado no perfil do usuário
- Páginas bloqueiam acesso não autorizado
- Botões e ações são ocultados conforme permissões

### Criação de Usuários
1. **Via Script** (Recomendado para Admin):
   ```bash
   npm run create-user
   ```

2. **Via Interface** (Apenas Admin):
   - Acesse `/usuarios`
   - Clique em "Novo Usuário"
   - Preencha os dados
   - Selecione o perfil

3. **Via Registro**:
   - Usuário acessa `/registro`
   - Cria conta própria
   - Perfil padrão: Produção

---

## Notas Importantes

⚠️ **Service Role Key**: Para criar usuários via script, é necessário configurar a `SUPABASE_SERVICE_ROLE_KEY` no arquivo `.env.local`.

⚠️ **Segurança**: A service_role key é extremamente sensível e nunca deve ser exposta em código público.

✅ **Primeiro Usuário**: O primeiro usuário criado via `/registro` recebe perfil `admin` automaticamente.

---

## Alterando Permissões

Para alterar as permissões de um perfil, edite:
- `src/components/layout/Sidebar.tsx` - Menu items e roles permitidos
- Páginas individuais - Verificação de permissão no início do componente

