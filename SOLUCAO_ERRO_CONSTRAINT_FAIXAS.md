# 🔧 Solução: Erro de Constraint ao Adicionar Faixa

## Problema

O erro `violates check constraint "check_status_faixa"` significa que a constraint no banco de dados ainda só permite os status antigos (`pendente` e `gravada`), mas o código agora tenta usar todos os status.

## Solução Rápida

Execute este script SQL no **projeto CORRETO** do Supabase:

### Passo 1: Acesse o Supabase

1. Acesse: https://app.supabase.com
2. Selecione o **projeto CORRETO** (não o errado!)
3. Vá em **SQL Editor**
4. Clique em **New query**

### Passo 2: Execute o Script

Abra o arquivo: `scripts/atualizar-constraint-status-faixas.sql`

Copie e cole este SQL:

```sql
-- Remover constraint antiga
ALTER TABLE faixas
DROP CONSTRAINT IF EXISTS check_status_faixa;

-- Adicionar nova constraint com TODOS os status permitidos
ALTER TABLE faixas
ADD CONSTRAINT check_status_faixa CHECK (status IN ('pendente', 'gravada', 'em_mixagem', 'masterizacao', 'finalizada', 'lancada'));
```

### Passo 3: Verificar

Após executar, teste novamente:
1. Recarregue a página
2. Tente adicionar uma nova faixa
3. Deve funcionar agora! ✅

## Status Permitidos Após a Correção

- ✅ Pendente
- ✅ Gravada
- ✅ Em Mixagem
- ✅ Masterização
- ✅ Finalizada
- ✅ Lançada

## Importante

- ⚠️ Execute no projeto **CORRETO** (não no errado!)
- ✅ O script é seguro e pode ser executado múltiplas vezes
- ✅ Não vai quebrar nada que já existe

