# R2: Acesso público

O sistema usa **URLs assinadas** ao abrir/copiar links (funciona com bucket privado). Se o acesso público **já está habilitado** no bucket e os links ainda falham, confira o .env abaixo.

---

## Se o acesso público já está habilitado e ainda dá 401

1. No dashboard do R2, na aba **Configurações** do bucket (ex.: **anexos**), copie a **URL de desenvolvimento público** (ex.: `https://pub-a6e0c29efc16457baad633f22cf9ffb6.r2.dev`).
2. No seu **`.env`** ou **`.env.local`** defina exatamente essa URL e o nome do bucket:

```env
VITE_R2_PUBLIC_URL=https://pub-a6e0c29efc16457baad633f22cf9ffb6.r2.dev
VITE_R2_BUCKET_ANEXOS=anexos
```

(O nome do bucket deve ser o mesmo que aparece no R2, ex.: `anexos`.)
3. Reinicie o servidor (`npm run dev`) e teste de novo.

---

## Como ativar acesso público no bucket (se ainda não estiver)

1. Acesse o **Dashboard da Cloudflare**: https://dash.cloudflare.com  
2. Vá em **R2** (Armazenamento e bancos de dados → R2).  
3. Clique no **bucket** que você usa para anexos (ex.: `ceu-music-anexos` ou o que estiver em `VITE_R2_PUBLIC_URL`).  
4. Aba **Configurações** (Settings).  
5. Em **Public access** (Acesso público): clique em **Allow Access** / **Permitir acesso**.  
6. Associe o subdomínio **r2.dev** se ainda não estiver (o mesmo que está em `VITE_R2_PUBLIC_URL` no seu `.env`).

Depois disso, os links públicos passam a abrir sem 401 (formato `https://pub-xxx.r2.dev/<key>` para o bucket).

**Observação:** Com acesso público, qualquer pessoa que tiver o link poderá ver o arquivo. Com URLs assinadas (comportamento atual), o link expira em 1 hora e o bucket pode ficar privado.
