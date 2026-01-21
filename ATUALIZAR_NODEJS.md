# 🚀 Atualizar Node.js para v22.12.0+

## 📋 Situação Atual

- **Versão instalada:** v22.11.0
- **Versão requerida pelo Vite:** ^20.19.0 || >=22.12.0
- **npm instalado:** v11.5.2

---

## ⚡ Solução Rápida - Usando Winget (Recomendado)

### **Método 1: Atualizar via Winget**

```powershell
# 1. Verificar se há atualizações disponíveis
winget upgrade --id OpenJS.NodeJS

# 2. Atualizar para a versão mais recente
winget upgrade --id OpenJS.NodeJS --accept-source-agreements --accept-package-agreements

# 3. Verificar a nova versão (fechar e reabrir o terminal)
node --version
```

---

## 🔧 Método 2: Usar Node Version Manager (nvm-windows)

### **Instalar nvm-windows**

1. **Download:**
   - Acesse: https://github.com/coreybutler/nvm-windows/releases
   - Baixe: `nvm-setup.exe` (latest release)

2. **Instalar:**
   - Execute o instalador
   - Siga as instruções

3. **Usar nvm:**

```powershell
# Listar versões disponíveis
nvm list available

# Instalar a versão mais recente (LTS ou Current)
nvm install 22.12.0

# Ou instalar a LTS mais recente
nvm install lts

# Usar a versão instalada
nvm use 22.12.0

# Verificar versão
node --version
```

---

## 📦 Método 3: Download Direto (Tradicional)

### **Baixar e Instalar Manualmente**

1. **Acesse o site oficial:**
   - https://nodejs.org/

2. **Escolha uma versão:**
   - **LTS (Recomendado):** Versão estável
   - **Current:** Versão mais recente com novos recursos

3. **Download:**
   - Clique em "Download" para Windows (.msi)

4. **Instalar:**
   - Execute o instalador
   - Siga as instruções
   - Marque "Automatically install necessary tools"

5. **Verificar instalação:**

```powershell
# Fechar e reabrir o terminal
node --version
npm --version
```

---

## 🎯 Comandos Resumidos

### **Script PowerShell Automático**

```powershell
# Atualizar Node.js via Winget
Write-Host "Atualizando Node.js..." -ForegroundColor Cyan
winget upgrade --id OpenJS.NodeJS --accept-source-agreements --accept-package-agreements

Write-Host ""
Write-Host "Reinicie o terminal e execute:" -ForegroundColor Yellow
Write-Host "  node --version" -ForegroundColor White
Write-Host ""
```

---

## ✅ Após Atualizar

### **1. Verificar versões:**

```powershell
node --version
npm --version
```

### **2. Limpar cache (opcional):**

```powershell
npm cache clean --force
```

### **3. Reinstalar dependências (opcional):**

```powershell
# Remover node_modules
Remove-Item -Recurse -Force node_modules

# Reinstalar
npm install
```

### **4. Reiniciar servidor:**

```powershell
npm run dev
```

---

## 🔍 Verificar Compatibilidade

### **Vite requer:**
- Node.js ^20.19.0 (LTS)
- Node.js >=22.12.0 (Current)

### **Versões recomendadas:**
- Node.js 22.12.0+ (para usar Vite 7.x)
- Node.js 20.19.0+ (LTS, mais estável)

---

## 📝 Notas Importantes

1. **Feche e reabra o terminal** após atualizar
2. **Reinicie o VS Code/Cursor** se necessário
3. **Limpe o cache** se houver problemas
4. **Reinstale dependências** se houver erros

---

## 🆘 Solução de Problemas

### **Erro: "node não é reconhecido"**

1. Feche e reabra o terminal
2. Verifique as variáveis de ambiente:
   - Windows + R → `sysdm.cpl`
   - Avançado → Variáveis de Ambiente
   - Verifique se `C:\Program Files\nodejs` está no PATH

### **Erro: "Permission denied"**

Execute o PowerShell como Administrador:
- Clique com botão direito → "Executar como administrador"

### **Múltiplas versões instaladas**

Use nvm-windows para gerenciar:

```powershell
nvm list
nvm use 22.12.0
```

---

## 🚀 Comando Único (Recomendado)

Copie e execute no PowerShell:

```powershell
winget upgrade --id OpenJS.NodeJS --accept-source-agreements --accept-package-agreements; Write-Host "`nReinicie o terminal e execute: node --version" -ForegroundColor Green
```

---

## 📊 Comparação de Versões

| Versão | Status | Recomendação |
|--------|--------|--------------|
| v22.11.0 | ⚠️ Atual | Atualizar |
| v22.12.0+ | ✅ Compatível | OK |
| v20.19.0+ | ✅ LTS | Recomendado |

---

**Escolha o método mais conveniente e atualize o Node.js!**
