# 🚨 ERRO: Tabela 'faixas' não encontrada

## ⚠️ Problema
O erro `Could not find the table 'public.faixas'` indica que a tabela `faixas` não existe no banco de dados.

## ✅ Solução Rápida

### Passo 1: Abrir o Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto

### Passo 2: Abrir o SQL Editor
1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique no botão **New Query** (ou use `Ctrl+N`)

### Passo 3: Executar o Script
1. Abra o arquivo `scripts/create-faixas-table.sql` neste projeto
2. **Copie TODO o conteúdo** do arquivo
3. **Cole** no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter`)

### Passo 4: Verificar
1. Você deve ver uma mensagem de sucesso
2. Recarregue a página do projeto no navegador (F5)
3. Tente adicionar uma faixa novamente

## 📋 O que o script cria:

- ✅ Tabela `faixas` com todas as colunas necessárias
- ✅ Relacionamento com a tabela `projetos`
- ✅ Políticas de segurança (RLS)
- ✅ Índices para melhor performance
- ✅ Trigger para atualizar timestamps automaticamente

## 🔍 Verificar se funcionou:

Execute no terminal:
```bash
node scripts/check-faixas-table.js
```

Se aparecer "✅ A tabela faixas existe!", está tudo certo!

## 💡 Dica

Se após executar o script ainda aparecer o erro, pode ser cache do PostgREST:
- Aguarde 10-30 segundos
- Recarregue a página (F5)
- Tente novamente

