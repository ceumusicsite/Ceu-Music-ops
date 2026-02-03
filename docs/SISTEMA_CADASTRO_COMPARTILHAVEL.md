# Sistema de Cadastro Compartilhável

## 📋 Visão Geral

Este sistema permite que administradores gerem links compartilháveis para cadastro de novos usuários. Após o cadastro, os usuários ficam com status "pendente" e precisam ser aprovados por um administrador antes de poderem acessar o sistema.

## 🚀 Como Usar

### 1. Configurar o Banco de Dados

Primeiro, execute o script SQL para criar as tabelas necessárias:

```bash
# Execute o script no Supabase SQL Editor
scripts/create-user-invites-table.sql
```

Este script irá:
- Adicionar o campo `status` na tabela `users` (pending, approved, rejected)
- Criar a tabela `user_invites` para armazenar os convites
- Configurar as políticas de segurança (RLS)

### 2. Gerar um Link Compartilhável

1. Faça login como administrador
2. Acesse **Configurações** no menu lateral
3. Clique na aba **"Links Compartilháveis"**
4. Clique em **"Gerar Novo Link"**
5. Configure:
   - **Expira em (dias)**: Quantos dias o link será válido (0 = sem expiração)
   - **Máximo de usos**: Quantas vezes o link pode ser usado
6. Clique em **"Gerar Link"**
7. Copie o link gerado e compartilhe com a pessoa que deseja cadastrar

### 3. Cadastro via Link Compartilhável

1. A pessoa recebe o link compartilhável (ex: `https://seusite.com/registro/abc123...`)
2. Acessa o link
3. Preenche o formulário de cadastro:
   - Nome completo
   - E-mail
   - Senha (mínimo 6 caracteres)
4. Clica em **"Criar Conta"**
5. O sistema cria a conta com status "pending"
6. A pessoa recebe uma mensagem informando que o cadastro será revisado

### 4. Aprovar Usuários Pendentes

1. Como administrador, acesse **Configurações**
2. Clique na aba **"Usuários Pendentes"**
3. Você verá uma lista de todos os usuários aguardando aprovação
4. Para cada usuário, você pode:
   - **Aprovar**: Clique em "Aprovar", selecione o perfil (role) e confirme
   - **Rejeitar**: Clique em "Rejeitar" para recusar o cadastro

### 5. Gerenciar Links Compartilháveis

Na aba **"Links Compartilháveis"**, você pode:
- Ver todos os links gerados
- Ver o status de cada link (Válido, Usado, Expirado, Esgotado)
- Copiar o link para compartilhar
- Excluir links que não são mais necessários

## 🔐 Segurança

- Links expiram automaticamente após o prazo configurado
- Links podem ter limite de usos
- Usuários pendentes não conseguem acessar o sistema até serem aprovados
- Apenas administradores podem gerar links e aprovar usuários
- Tokens são gerados de forma criptograficamente segura

## 📊 Status dos Usuários

- **pending**: Cadastro aguardando aprovação (não pode acessar o sistema)
- **approved**: Cadastro aprovado (pode acessar o sistema normalmente)
- **rejected**: Cadastro rejeitado (não pode acessar o sistema)

## 🎯 Perfis Disponíveis

Ao aprovar um usuário, você pode selecionar um dos seguintes perfis:

- **admin**: Administrador (acesso total)
- **executivo**: Executivo
- **ar**: A&R (Artists & Repertoire)
- **producao**: Produção
- **financeiro**: Módulo financeiro
- **operador**: Operador geral
- **viewer**: Visualizador (somente leitura)

## ⚠️ Notas Importantes

1. **Usuários criados diretamente** (sem link compartilhável) são automaticamente aprovados como administradores
2. **Usuários via link compartilhável** começam como "operador" e precisam ser aprovados
3. Se um usuário tentar fazer login enquanto está pendente, será redirecionado para a página de login com uma mensagem informativa
4. Links usados, expirados ou esgotados não podem ser reutilizados

## 🔧 Troubleshooting

### Link não funciona
- Verifique se o link não expirou
- Verifique se o link não atingiu o máximo de usos
- Verifique se o link já foi usado

### Usuário não consegue fazer login
- Verifique se o usuário foi aprovado na aba "Usuários Pendentes"
- Verifique se o e-mail foi confirmado no Supabase (se a confirmação de e-mail estiver habilitada)

### Erro ao gerar link
- Verifique se você está logado como administrador
- Verifique se a tabela `user_invites` foi criada corretamente
- Verifique os logs do console do navegador para mais detalhes
