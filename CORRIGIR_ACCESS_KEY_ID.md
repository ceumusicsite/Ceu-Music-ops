# ⚠️ Correção Necessária: VITE_R2_ACCESS_KEY_ID

## 🔍 Problema Identificado

No arquivo `.env.local`, a linha 27 está **incorreta**:

```env
VITE_R2_ACCESS_KEY_ID=https://1db437b87dac2f428ee5ec949a1ad9ce.r2.cloudflarestorage.com  # ❌ ERRADO!
```

**O problema:** `VITE_R2_ACCESS_KEY_ID` não deve ser uma URL, deve ser o **Access Key ID real** (um código alfanumérico).

---

## ✅ Como Corrigir

### Opção 1: Editar Manualmente o `.env.local`

Abra o arquivo `.env.local` e corrija a linha 27:

**ANTES (ERRADO):**
```env
VITE_R2_ACCESS_KEY_ID=https://1db437b87dac2f428ee5ec949a1ad9ce.r2.cloudflarestorage.com
```

**DEPOIS (CORRETO):**
```env
VITE_R2_ACCESS_KEY_ID=seu_access_key_id_real_aqui
```

**Onde `seu_access_key_id_real_aqui` é o Access Key ID que você copiou quando criou o token do R2.**

### Opção 2: Usar o Script

Execute o script que vai pedir as credenciais corretas:

```powershell
.\configurar-r2.ps1
```

---

## 📋 O que cada variável deve conter

```env
# Account ID (já está correto)
VITE_R2_ACCOUNT_ID=1db437b87dac2f428ee5ec949a1ad9ce  ✅

# Access Key ID (PRECISA SER CORRIGIDO)
# Deve ser um código alfanumérico, NÃO uma URL
VITE_R2_ACCESS_KEY_ID=seu_access_key_id_real  ❌ Precisa corrigir

# Secret Access Key (já está correto)
VITE_R2_SECRET_ACCESS_KEY=01d10164caba487c851e815d3cc0842a  ✅

# Endpoint (já está correto)
VITE_R2_ENDPOINT=https://1db437b87dac2f428ee5ec949a1ad9ce.r2.cloudflarestorage.com  ✅

# Public URL (já está correto)
VITE_R2_PUBLIC_URL=https://pub-1db437b87dac2f428ee5ec949a1ad9ce.r2.dev  ✅
```

---

## 🔍 Como Obter o Access Key ID Correto

Se você não tem o Access Key ID salvo:

1. **Acesse:** https://dash.cloudflare.com
2. **Vá em:** R2 → Manage R2 API Tokens
3. **Crie um novo token** (ou veja tokens existentes)
4. **Copie o Access Key ID** (não é a URL, é um código alfanumérico)

**Exemplo de Access Key ID:**
```
abc123def456ghi789jkl012mno345pqr678
```

**NÃO é:**
```
https://1db437b87dac2f428ee5ec949a1ad9ce.r2.cloudflarestorage.com
```

---

## ✅ Depois de Corrigir

1. **Salve o arquivo `.env.local`**
2. **Reinicie o servidor:**
   ```bash
   # Parar (Ctrl+C) e iniciar novamente
   npm run dev
   ```
3. **Teste o upload novamente**

---

## 📋 Checklist de Verificação

- [ ] `VITE_R2_ACCOUNT_ID` está correto (código alfanumérico)
- [ ] `VITE_R2_ACCESS_KEY_ID` está correto (código alfanumérico, NÃO URL)
- [ ] `VITE_R2_SECRET_ACCESS_KEY` está correto (código alfanumérico)
- [ ] `VITE_R2_ENDPOINT` está correto (URL com https://)
- [ ] `VITE_R2_PUBLIC_URL` está correto (URL com https://pub-)
- [ ] Servidor reiniciado após correção
- [ ] Teste de upload realizado

---

**🎯 Depois de corrigir o Access Key ID, o sistema deve funcionar corretamente!**
