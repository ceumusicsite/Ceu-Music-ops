# Correção: Download de Vídeos em Produção

## Problema

- Vídeos não baixavam em produção (domínio real), mas funcionavam em localhost
- Em alguns casos, demorava muito para baixar
- No celular (iPhone, etc), clicar no botão não fazia nada
- Erro 401 Unauthorized ao tentar acessar arquivos no Cloudflare R2

## Causa

O problema era que as URLs dos vídeos estavam sendo usadas diretamente no elemento `<video>` sem conversão para URLs públicas ou assinadas que funcionam no navegador. URLs do formato `r2.cloudflarestorage.com` (S3 API) não funcionam diretamente no navegador e causam erros de CORS ou SSL.

## Solução Implementada

1. **Conversão automática de URLs**: Quando o modal de vídeo abre, a URL é automaticamente convertida para um formato que funciona no navegador usando `getViewableUrlAsync()`.

2. **Botão de Download funcional**: Adicionado botão "Baixar" que:
   - Mostra toast "Preparando download..." enquanto converte a URL
   - Inicia download direto via elemento `<a>` (popup aparece imediatamente)
   - Mostra feedback visual "Download iniciado" 
   - Funciona em desktop e mobile (iPhone abre em nova aba)

3. **Atributos do vídeo**: Adicionados `crossOrigin="anonymous"` e `preload="metadata"` para melhor compatibilidade.

4. **Loading state**: Mostra indicador de carregamento enquanto a URL está sendo convertida.

5. **Performance**: O popup de download aparece imediatamente (não espera baixar o arquivo inteiro).

## Verificações Necessárias

### 1. Variável de Ambiente em Produção

Certifique-se de que `VITE_R2_PUBLIC_URL` está configurada corretamente em produção:

```env
VITE_R2_PUBLIC_URL=https://pub-<seu-account-id>.r2.dev
```

### 2. Bucket Público no Cloudflare R2

O bucket precisa estar configurado como público:

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com) → R2
2. Selecione o bucket (ex: `ceu-music-audio` ou `anexos`)
3. Vá em **Settings** → **Public Access**
4. Habilite **Public Access** e configure o domínio público

### 3. CORS no Bucket

Configure CORS para permitir requisições do seu domínio:

1. No bucket, vá em **Settings** → **CORS**
2. Adicione política CORS permitindo:
   - **Allowed Origins**: Seu domínio de produção (ex: `https://seusite.com`)
   - **Allowed Methods**: `GET`, `HEAD`
   - **Allowed Headers**: `*`
   - **Max Age**: `3600`

### 4. Verificar URLs Públicas

As URLs públicas do R2 devem seguir o formato:
```
https://pub-<account-id>.r2.dev/<bucket>/<key>
```

Ou, se o bucket estiver configurado como domínio customizado:
```
https://<seu-dominio>/<key>
```

## Testes

Após as correções, teste:

1. ✅ Abrir vídeo no player (deve carregar sem erro 401)
2. ✅ Clicar em "Baixar" (deve iniciar download)
3. ✅ Testar no celular (iPhone/Android)
4. ✅ Testar em produção (domínio real)

## Debug

Se o download ainda não funcionar:

1. **Abra o Console do navegador** (F12 → Console)
2. **Clique em "Baixar"** e observe as mensagens:
   - `Botão Baixar clicado!` → Confirma que o botão foi clicado
   - `Iniciando download de: <url>` → URL original do arquivo
   - `URL convertida para download: <url>` → URL pública/assinada gerada
   - `Download iniciado via <a>` → Download foi iniciado

3. **Se não aparecer nenhuma mensagem**: O evento onClick não está sendo chamado (problema de JavaScript ou z-index)

4. **Se aparecer erro na URL**: Verificar se `VITE_R2_PUBLIC_URL` está correto

5. **Se aparecer erro 401/403**: Bucket não está público ou CORS não está configurado

6. **No iPhone/Safari**: O download pode abrir em nova aba em vez de baixar automaticamente - use "Salvar como" no navegador

## Solução Alternativa (Se nada funcionar)

Se o download via botão não funcionar, use o botão **"Abrir em nova aba"**:
1. Clique em "Abrir em nova aba"
2. O vídeo abrirá no navegador
3. Clique com botão direito → "Salvar vídeo como..." (ou equivalente no mobile)

## Arquivos Modificados

- `src/pages/projetos/Detalhes.tsx`: Adicionada conversão de URL e botão de download
