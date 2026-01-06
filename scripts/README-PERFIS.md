# 👥 Sistema de Perfis e Permissões

## 📋 Visão Geral

O sistema agora suporta diferentes perfis de usuário com permissões específicas:

### **Perfis Disponíveis:**

1. **👑 Admin** - Acesso total
   - Pode criar orçamentos
   - Pode aprovar/recusar orçamentos
   - Acesso a todas as funcionalidades

2. **👤 Operador** - Acesso limitado
   - Pode criar orçamentos
   - **NÃO pode** aprovar/recusar orçamentos
   - Pode visualizar orçamentos

3. **Outros perfis existentes:**
   - Executivo
   - AR (A&R)
   - Produção
   - Financeiro
   - Viewer

---

## 🔧 Configuração no Supabase

### 1️⃣ Atualizar Constraint de Roles

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor** → **New Query**
3. Execute o script: `scripts/update-users-role.sql`
4. Isso atualiza o constraint para incluir 'operador'

### 2️⃣ Atribuir Role a um Usuário

#### Opção A: Via SQL Editor

```sql
-- Tornar um usuário Operador
UPDATE public.users 
SET role = 'operador' 
WHERE email = 'operador@exemplo.com';

-- Tornar um usuário Admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@exemplo.com';
```

#### Opção B: Via Interface do Supabase

1. Vá em **Table Editor** → **users**
2. Encontre o usuário pelo email
3. Edite a coluna `role`
4. Selecione: `admin` ou `operador`
5. Salve

---

## 🎯 Permissões por Perfil

### **Orçamentos:**

| Ação | Admin | Operador | Outros |
|------|-------|----------|--------|
| Criar orçamento | ✅ | ✅ | ✅* |
| Visualizar orçamentos | ✅ | ✅ | ✅* |
| Aprovar orçamento | ✅ | ❌ | ❌ |
| Recusar orçamento | ✅ | ❌ | ❌ |
| Editar orçamento | ✅ | ✅* | ✅* |
| Excluir orçamento | ✅ | ✅* | ✅* |

*Depende do role específico configurado no Sidebar

---

## 🔍 Como Funciona

### **No Código:**

```typescript
// Verificar se usuário pode aprovar/recusar
{orc.status === 'pendente' && hasPermission(['admin']) && (
  <button onClick={() => handleAprovar(orc.id)}>Aprovar</button>
  <button onClick={() => handleRecusar(orc.id)}>Recusar</button>
)}
```

### **Função hasPermission:**

```typescript
const { hasPermission } = useAuth();

// Verifica se o usuário tem um dos roles especificados
hasPermission(['admin']) // true apenas se role = 'admin'
hasPermission(['admin', 'executivo']) // true se role = 'admin' OU 'executivo'
```

---

## 📝 Exemplos de Uso

### **Criar um Operador:**

1. Usuário faz login no sistema
2. Sistema cria perfil automaticamente com role 'admin' (padrão)
3. Admin atualiza o role para 'operador' via SQL ou interface
4. Próximo login, o usuário terá permissões de operador

### **Verificar Role Atual:**

```sql
SELECT id, name, email, role 
FROM public.users 
WHERE email = 'seu-email@exemplo.com';
```

---

## ⚠️ Importante

- **Role padrão**: Quando um novo usuário faz login pela primeira vez, o sistema cria um perfil com role `'admin'` por padrão
- **Segurança**: Sempre atualize o role após criar novos usuários
- **Validação**: O sistema valida permissões tanto no frontend quanto deve validar no backend (RLS policies)

---

## 🔐 Recomendações de Segurança

1. **Sempre defina roles apropriados** após criar usuários
2. **Use RLS policies** no Supabase para validação no banco
3. **Não confie apenas no frontend** para segurança
4. **Monitore logs** de ações administrativas

---

## 📚 Arquivos Relacionados

- `src/contexts/AuthContext.tsx` - Sistema de autenticação e roles
- `src/pages/orcamentos/page.tsx` - Controle de permissões em orçamentos
- `src/components/layout/Sidebar.tsx` - Menu baseado em roles
- `scripts/update-users-role.sql` - Script de atualização

---

**Criado por**: Assistente IA  
**Data**: Janeiro 2026  
**Projeto**: Céu Music Ops

