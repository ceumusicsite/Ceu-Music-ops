# ⚡ Adicionar R2 ao Sistema (Rápido)

Você já tem as credenciais do R2? Siga este guia rápido para adicioná-las ao sistema.

---

## 🚀 Opção 1: Script Automatizado (Recomendado)

Execute o script PowerShell:

```powershell
.\configurar-r2.ps1
```

O script vai pedir:
- Account ID
- Access Key ID
- Secret Access Key

E configurará tudo automaticamente!

---

## ✏️ Opção 2: Manual

Adicione estas variáveis no final do arquivo `.env.local`:

```env
# ============================================
# Configuração do Cloudflare R2
# ============================================
VITE_R2_ACCOUNT_ID=seu_account_id_aqui
VITE_R2_ACCESS_KEY_ID=sua_access_key_id_aqui
VITE_R2_SECRET_ACCESS_KEY=sua_secret_access_key_aqui
VITE_R2_ENDPOINT=https://seu_account_id.r2.cloudflarestorage.com
VITE_R2_PUBLIC_URL=https://pub-seu_account_id.r2.dev

# Buckets R2
VITE_R2_BUCKET_AUDIO=ceu-music-audio
VITE_R2_BUCKET_DOCUMENTOS=ceu-music-documentos
VITE_R2_BUCKET_ANEXOS=ceu-music-anexos
VITE_R2_BUCKET_COMPROVANTES=ceu-music-comprovantes

# Provider de Storage (r2 ou supabase)
VITE_STORAGE_PROVIDER=r2
```

**⚠️ IMPORTANTE:** 
- Substitua `seu_account_id` pelos valores reais
- O `ENDPOINT` e `PUBLIC_URL` usam o mesmo Account ID

---

## ✅ Depois de Adicionar

1. **Reinicie o servidor:**
   ```bash
   # Parar (Ctrl+C) e iniciar novamente
   npm run dev
   ```

2. **Teste o upload:**
   - Faça upload de um arquivo no sistema
   - Não deve aparecer erro: "Configuração do R2 não encontrada"

---

## 🔍 Onde Encontrar as Credenciais

Se você já criou o token do R2 antes, as credenciais estão em:

1. **Account ID:** Cloudflare Dashboard → Painel lateral direito
2. **Access Key ID e Secret:** Você precisa ter salvo quando criou o token
   - Se não tiver mais, crie um novo token em: R2 → Manage R2 API Tokens

---

## 📋 Checklist Rápido

- [ ] Variáveis adicionadas no `.env.local`
- [ ] Servidor reiniciado
- [ ] Teste de upload realizado
- [ ] Sem erros no console

---

**Pronto! O R2 está configurado e funcionando!** 🎉
