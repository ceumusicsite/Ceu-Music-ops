# Guia de Testes - Cloudflare R2

Este guia ajuda você a verificar se a implementação e configuração do Cloudflare R2 está funcionando corretamente.

## ✅ Pré-requisitos

1. ✅ Servidor de desenvolvimento rodando (`npm run dev`)
2. ✅ Variáveis de ambiente configuradas no `.env.local`
3. ✅ Buckets criados no Cloudflare R2
4. ✅ API Token criado e configurado

## 🧪 Testes a Realizar

### 1. Verificar Configuração das Variáveis de Ambiente

**Teste no Console do Navegador:**

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Execute:
```javascript
console.log('R2 Account ID:', import.meta.env.VITE_R2_ACCOUNT_ID);
console.log('R2 Access Key:', import.meta.env.VITE_R2_ACCESS_KEY_ID ? 'Configurado' : 'Não configurado');
console.log('R2 Endpoint:', import.meta.env.VITE_R2_ENDPOINT);
console.log('Storage Provider:', import.meta.env.VITE_STORAGE_PROVIDER);
```

**Resultado esperado:**
- Account ID deve aparecer
- Access Key deve mostrar "Configurado"
- Endpoint deve estar correto
- Storage Provider deve ser "r2"

---

### 2. Teste de Upload de Documento

**Passos:**
1. Acesse a página **Documentos** no sistema
2. Clique em **Novo Documento** ou botão de adicionar
3. Preencha os campos obrigatórios:
   - Título: "Teste R2"
   - Tipo: Selecione qualquer tipo
   - Arquivo: Selecione um arquivo de teste (PDF, DOC, etc.)
4. Clique em **Salvar** ou **Criar**

**Resultado esperado:**
- ✅ Upload deve ser concluído sem erros
- ✅ Documento deve aparecer na lista
- ✅ URL do arquivo deve estar salva no banco de dados
- ✅ Não deve aparecer erros no console

**Verificar no Console:**
- Abra DevTools (F12) → Console
- Não deve haver erros relacionados a R2 ou upload

---

### 3. Teste de Upload de Comprovante (Financeiro)

**Passos:**
1. Acesse a página **Financeiro**
2. Encontre um pagamento existente
3. Clique no ícone de upload de comprovante
4. Selecione um arquivo (imagem ou PDF)
5. Faça o upload

**Resultado esperado:**
- ✅ Upload deve ser concluído
- ✅ Comprovante deve ser associado ao pagamento
- ✅ Mensagem de sucesso deve aparecer
- ✅ Não deve haver erros

---

### 4. Teste de Upload de Anexo em Projeto

**Passos:**
1. Acesse a página **Projetos**
2. Abra um projeto existente ou crie um novo
3. Vá na seção de **Anexos**
4. Clique em **Adicionar Anexo**
5. Selecione um arquivo
6. Faça o upload

**Resultado esperado:**
- ✅ Upload deve funcionar
- ✅ Anexo deve aparecer na lista
- ✅ URL deve ser gerada corretamente

---

### 5. Verificar no Cloudflare R2 Dashboard

**Passos:**
1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em **R2**
3. Abra o bucket correspondente (ex: `anexos`, `documentos`, `comprovantes`)
4. Verifique se os arquivos aparecem lá

**Resultado esperado:**
- ✅ Arquivos devem aparecer nos buckets corretos
- ✅ Nomes dos arquivos devem seguir o padrão: `timestamp_nome_arquivo`
- ✅ Pastas devem estar organizadas conforme configurado

---

### 6. Teste de Download/Acesso ao Arquivo

**Passos:**
1. Após fazer upload, tente acessar o arquivo
2. Clique em "Baixar" ou "Ver arquivo" no sistema
3. Verifique se o arquivo abre ou baixa corretamente

**Resultado esperado:**
- ✅ Arquivo deve abrir/baixar corretamente
- ✅ URL deve ser uma signed URL (começa com o endpoint do R2)
- ✅ Arquivo deve estar acessível

**Verificar URL:**
- A URL deve começar com algo como: `https://1db437b87dac2f428ee5ec949a1ad9ce.r2.cloudflarestorage.com/...`
- Deve conter parâmetros de assinatura (query parameters)

---

### 7. Teste de Erros Comuns

#### Teste 1: Upload sem credenciais
**Simulação:** Remova temporariamente uma variável de ambiente
**Resultado esperado:** Deve mostrar erro claro sobre configuração faltando

#### Teste 2: Upload de arquivo muito grande
**Simulação:** Tente fazer upload de arquivo maior que o limite
**Resultado esperado:** Deve mostrar mensagem de erro apropriada

#### Teste 3: Bucket inexistente
**Simulação:** Mude o nome do bucket no `.env.local` para um que não existe
**Resultado esperado:** Deve mostrar erro sobre bucket não encontrado

---

## 🔍 Verificações no Console do Navegador

Durante os testes, monitore o console (F12 → Console):

**✅ Sinais de sucesso:**
- Nenhum erro vermelho
- Mensagens de upload concluído
- URLs sendo geradas

**❌ Sinais de problema:**
- Erros relacionados a "R2", "S3", "AWS SDK"
- Erros de "Access Denied" ou "Forbidden"
- Erros de "Bucket not found"
- Erros de "Invalid credentials"

---

## 📋 Checklist de Validação

Marque cada item conforme testar:

- [ ] Variáveis de ambiente estão configuradas
- [ ] Upload de documento funciona
- [ ] Upload de comprovante funciona
- [ ] Upload de anexo funciona
- [ ] Arquivos aparecem no dashboard do Cloudflare R2
- [ ] URLs são geradas corretamente (signed URLs)
- [ ] Download/acesso aos arquivos funciona
- [ ] Não há erros no console
- [ ] Arquivos estão organizados nos buckets corretos

---

## 🐛 Troubleshooting

### Erro: "Configuração do R2 não encontrada"
**Solução:** Verifique se todas as variáveis estão no `.env.local` e reinicie o servidor

### Erro: "Access Denied"
**Solução:** Verifique se o API Token tem permissões corretas no Cloudflare

### Erro: "Bucket not found"
**Solução:** Verifique se os nomes dos buckets no `.env.local` correspondem aos criados no Cloudflare

### Upload funciona mas arquivo não aparece no R2
**Solução:** Verifique se está usando o bucket correto e se as permissões estão corretas

### URLs não funcionam
**Solução:** Verifique se está usando signed URLs (padrão) ou se precisa configurar buckets públicos

---

## 📝 Logs Úteis

Durante os testes, você pode adicionar logs temporários no código para debug:

```javascript
// Em src/lib/r2.ts, adicione antes do upload:
console.log('Fazendo upload para bucket:', bucket);
console.log('Key do arquivo:', key);
```

---

## ✅ Teste Completo Bem-Sucedido

Se todos os testes passarem:
- ✅ Sistema está usando Cloudflare R2 corretamente
- ✅ Uploads estão funcionando
- ✅ Arquivos estão sendo armazenados no R2
- ✅ URLs estão sendo geradas corretamente
- ✅ Sistema está pronto para produção

---

**Próximo passo:** Após validar todos os testes, você pode remover os logs de debug e fazer commit das alterações.

