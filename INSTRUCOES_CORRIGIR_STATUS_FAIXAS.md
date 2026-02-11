# 🔧 Correção Urgente: Status de Faixas

## Problema

O banco de dados está retornando erro ao criar faixas porque a constraint `check_status_faixa` só permite os status `'pendente'` e `'gravada'`, mas o sistema precisa de mais status.

## Solução Temporária (Já Implementada)

O código foi ajustado para que novas faixas sempre usem apenas `'pendente'` ou `'gravada'`. Você pode editar depois para outros status.

## Solução Definitiva

Execute o script SQL apropriado no Supabase. Escolha o script correto baseado na sua situação:

### Passo 1: Acesse o Supabase

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New query**

### Passo 2: Escolha o Script Correto

#### ⚠️ RECOMENDADO: Script Completo (Cria Tudo)

**Execute o script completo que cria todas as tabelas:**
- Arquivo: `scripts/setup-tabelas-completo.sql`
- Este script cria `projetos` e `faixas` na ordem correta
- Use este se você recebeu erros como "relation does not exist"

#### Opção A: Só criar/atualizar faixas (se projetos já existe)

**Execute o script de faixas:**
- Arquivo: `scripts/create-faixas-table-completo.sql`
- Use apenas se a tabela `projetos` já existir

#### Opção B: Só atualizar constraint (se tudo já existe)

**Execute apenas o script de atualização:**
- Arquivo: `scripts/update-faixas-status-only.sql`
- Use apenas se ambas as tabelas já existirem e só precisar atualizar a constraint

### Passo 3: Como Executar

1. Abra o arquivo SQL apropriado na pasta `scripts/`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** ou pressione `Ctrl+Enter`

### Passo 3: Verificar

Após executar, você pode verificar se funcionou executando:

```sql
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'check_status_faixa';
```

Deve mostrar todos os status permitidos.

## Após Executar

Após executar o script:
1. Recarregue a página no celular
2. Tente adicionar uma nova faixa novamente
3. Agora você poderá selecionar todos os status ao criar uma nova faixa

## Status Permitidos

Após a correção, os seguintes status estarão disponíveis:
- ✅ Pendente
- ✅ Gravada
- ✅ Em Mixagem
- ✅ Masterização
- ✅ Finalizada
- ✅ Lançada

