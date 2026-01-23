# 📍 Onde Testar o Upload de Vídeo com Cloudflare Stream

Este guia mostra exatamente onde encontrar e testar a funcionalidade de upload de vídeo com Cloudflare Stream no sistema.

---

## 🎯 Localização da Funcionalidade

A funcionalidade de upload de vídeo com Cloudflare Stream está disponível na **página de detalhes de um projeto**, especificamente ao anexar vídeos às **faixas** do projeto.

---

## 📋 Passo a Passo para Testar

### 1. Acessar um Projeto

1. **Faça login no sistema**
2. No menu lateral, clique em **"Projetos"**
3. Clique em qualquer projeto existente (ou crie um novo)

### 2. Navegar até as Faixas

Na página de detalhes do projeto:

1. Role a página até a seção **"Faixas"**
2. Você verá uma lista de faixas do projeto
3. Cada faixa tem um botão **"Anexar Áudio/Vídeo"** (ícone de anexo 📎)

### 3. Abrir o Modal de Upload

1. Clique no botão **"Anexar Áudio/Vídeo"** de qualquer faixa
2. Um modal será aberto com o título: **"Adicionar Áudio/Vídeo - [Nome da Faixa]"**

### 4. Configurar o Upload

No modal que abriu:

1. **Selecione o Formato:**
   - No dropdown "Formato", escolha: **"Arquivo (R2)"**
   - ⚠️ **IMPORTANTE:** Deve ser "Arquivo (R2)", não "Link"

2. **Selecione o Tipo:**
   - No dropdown "Tipo", escolha: **"Vídeo"**
   - ⚠️ **IMPORTANTE:** Deve ser "Vídeo" para ativar o Cloudflare Stream

3. **Faça o Upload:**
   - Clique em **"Selecionar arquivo"**
   - Escolha um arquivo de vídeo do seu computador
   - Aguarde o upload para o R2 completar

### 5. Processamento no Stream

Após o upload para o R2:

1. O sistema **automaticamente**:
   - Gera uma URL assinada do vídeo no R2
   - Chama a Edge Function `stream-copy`
   - Envia o vídeo para o Cloudflare Stream
   - Processa o vídeo no Stream

2. Você verá a mensagem: **"Enviando para Stream..."** no botão de salvar

3. Aguarde alguns segundos/minutos (dependendo do tamanho do vídeo)

### 6. Verificar o Resultado

Após o processamento:

1. O vídeo será salvo com:
   - URL no R2 (backup)
   - UID no Cloudflare Stream (playback)
   - URL do iframe do Stream

2. Para **visualizar o vídeo**:
   - Clique no vídeo anexado na faixa
   - O player do Cloudflare Stream será exibido automaticamente
   - O vídeo será reproduzido usando o player otimizado do Stream

---

## 🎬 Onde o Vídeo Aparece

### Na Lista de Faixas

Após anexar o vídeo, você verá:

- Um **badge verde** indicando que há áudio/vídeo anexado
- O nome do arquivo ou descrição do vídeo
- Um botão para **reproduzir/visualizar** o vídeo

### Ao Clicar no Vídeo

Quando você clicar para visualizar:

1. Um **modal de reprodução** será aberto
2. O vídeo será exibido usando o **StreamPreview** component
3. O player do Cloudflare Stream será carregado em um iframe
4. Você poderá assistir o vídeo com qualidade otimizada

---

## 🔍 Verificação Técnica

### No Banco de Dados

Para verificar se o vídeo foi processado corretamente, execute no Supabase SQL Editor:

```sql
SELECT 
  id,
  faixa_id,
  tipo,
  arquivo_nome,
  stream_uid,
  stream_iframe_url,
  arquivo_bucket,
  arquivo_key,
  created_at
FROM faixa_audio_video
WHERE tipo = 'video' 
  AND stream_uid IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

**Campos importantes:**
- `stream_uid`: Deve estar preenchido com o UID do vídeo no Stream
- `stream_iframe_url`: URL do iframe do Stream (opcional, pode ser gerada automaticamente)
- `arquivo_bucket` e `arquivo_key`: Informações do arquivo no R2

### Nos Logs da Edge Function

No Supabase Dashboard:

1. Vá em: **Edge Functions** → **stream-copy** → **Logs**
2. Verifique se há chamadas bem-sucedidas
3. Procure por erros se algo não funcionar

---

## ⚠️ Pré-requisitos para Funcionar

Antes de testar, certifique-se de que:

- ✅ **Variável de ambiente configurada:**
  - `VITE_STREAM_CUSTOMER_BASE_URL` no `.env.local`
  - Valor: `https://customer-jzsf7zucu5f099z5.cloudflarestream.com`

- ✅ **Secrets no Supabase:**
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_STREAM_API_TOKEN`

- ✅ **Edge Function deployada:**
  - Função `stream-copy` deve estar deployada no Supabase

- ✅ **Banco de dados configurado:**
  - Colunas `stream_uid` e `stream_iframe_url` devem existir na tabela `faixa_audio_video`

- ✅ **Servidor reiniciado:**
  - Após configurar as variáveis, reinicie o servidor (`npm run dev`)

---

## 🎯 Resumo Visual do Fluxo

```
1. Projetos → [Selecionar Projeto]
2. Página de Detalhes → Seção "Faixas"
3. Faixa → Botão "Anexar Áudio/Vídeo"
4. Modal → Formato: "Arquivo (R2)" + Tipo: "Vídeo"
5. Upload → Selecionar arquivo de vídeo
6. Processamento → "Enviando para Stream..."
7. Resultado → Vídeo disponível com player do Stream
```

---

## 🆘 Problemas Comuns

### Vídeo não aparece no player

**Causa:** `VITE_STREAM_CUSTOMER_BASE_URL` não configurada ou incorreta.

**Solução:**
1. Verifique se a variável está no `.env.local`
2. Reinicie o servidor
3. Verifique se a URL está correta (sem barra no final)

### Erro "Enviando para Stream..." não termina

**Causa:** Edge Function não configurada ou secrets incorretos.

**Solução:**
1. Verifique os secrets no Supabase
2. Verifique os logs da Edge Function
3. Verifique se a função está deployada

### Upload funciona mas Stream não processa

**Causa:** URL assinada do R2 expirada ou inválida.

**Solução:**
1. Verifique se o R2 está configurado corretamente
2. Verifique os logs da Edge Function para ver o erro específico

---

## 📸 Onde Encontrar na Interface

### Caminho Completo:

```
Menu Lateral
  └─ Projetos
      └─ [Nome do Projeto] (clique)
          └─ Página de Detalhes
              └─ Seção "Faixas"
                  └─ [Nome da Faixa]
                      └─ Botão "Anexar Áudio/Vídeo" 📎
                          └─ Modal de Upload
                              └─ Formato: "Arquivo (R2)"
                              └─ Tipo: "Vídeo"
                              └─ Upload do arquivo
```

---

## ✅ Checklist de Teste

Use este checklist ao testar:

- [ ] Acessei um projeto existente
- [ ] Naveguei até a seção "Faixas"
- [ ] Cliquei em "Anexar Áudio/Vídeo" em uma faixa
- [ ] Selecionei "Formato: Arquivo (R2)"
- [ ] Selecionei "Tipo: Vídeo"
- [ ] Fiz upload de um arquivo de vídeo
- [ ] Vi a mensagem "Enviando para Stream..."
- [ ] O vídeo foi processado com sucesso
- [ ] O vídeo aparece na lista de anexos da faixa
- [ ] Ao clicar no vídeo, o player do Stream é exibido
- [ ] O vídeo reproduz corretamente

---

**🎉 Pronto! Agora você sabe exatamente onde testar o upload de vídeo com Cloudflare Stream!**
