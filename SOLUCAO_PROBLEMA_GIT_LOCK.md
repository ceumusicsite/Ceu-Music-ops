# 🔧 Solução: Problema de Lock do Git com OneDrive

## 🔴 Problema Identificado

O Git está falhando ao criar o arquivo `.git/index.lock` com o erro:
```
fatal: Unable to create 'C:/Users/jonat/OneDrive/Documentos/Ceu-Music-ops-1/.git/index.lock': Permission denied
```

## 🔍 Causa Raiz

A pasta `.git` tem **regras de negação (Deny)** nas permissões que estão bloqueando a escrita de arquivos. Isso é comum quando:
1. O repositório está em uma pasta sincronizada pelo OneDrive
2. Há políticas de segurança que restringem acesso
3. Permissões foram alteradas incorretamente

## ✅ Soluções

### **Solução 1: Executar Script de Correção (Recomendado)**

1. **Feche o Cursor/VS Code** (para liberar locks)

2. **Abra o PowerShell como Administrador**:
   - Pressione `Win + X`
   - Selecione "Windows PowerShell (Admin)" ou "Terminal (Admin)"

3. **Navegue até a pasta do projeto**:
   ```powershell
   cd "C:\Users\jonat\OneDrive\Documentos\Ceu-Music-ops-1"
   ```

4. **Execute o script de correção**:
   ```powershell
   .\corrigir-permissoes-git.ps1
   ```

5. **Tente fazer o commit novamente**:
   ```powershell
   git add src/pages/shared-audio-video/page.tsx
   git commit -m "fix: corrigir erro cannot coerce em links compartilháveis em dispositivos móveis"
   ```

---

### **Solução 2: Corrigir Permissões Manualmente**

1. **Feche o Cursor/VS Code**

2. **Abra o PowerShell como Administrador**

3. **Execute os seguintes comandos**:
   ```powershell
   cd "C:\Users\jonat\OneDrive\Documentos\Ceu-Music-ops-1"
   
   # Remover regras de negação
   $acl = Get-Acl ".git"
   $denyRules = $acl.Access | Where-Object { $_.AccessControlType -eq "Deny" }
   foreach ($rule in $denyRules) {
       $acl.RemoveAccessRule($rule)
   }
   
   # Adicionar permissão total para o usuário atual
   $user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
   $permission = $user, "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow"
   $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
   $acl.SetAccessRule($accessRule)
   
   # Aplicar mudanças
   Set-Acl ".git" $acl
   
   Write-Host "Permissões corrigidas!" -ForegroundColor Green
   ```

4. **Teste se funcionou**:
   ```powershell
   git status
   ```

---

### **Solução 3: Mover Repositório para Fora do OneDrive (Alternativa)**

Se o problema persistir, considere mover o repositório para uma pasta fora do OneDrive:

1. **Crie uma nova pasta** (ex: `C:\Projetos\Ceu-Music-ops-1`)

2. **Mova o repositório**:
   ```powershell
   # Fechar Cursor/VS Code primeiro!
   Move-Item "C:\Users\jonat\OneDrive\Documentos\Ceu-Music-ops-1" "C:\Projetos\Ceu-Music-ops-1"
   ```

3. **Atualize o caminho no Cursor/VS Code**

**⚠️ Nota**: Isso pode afetar a sincronização do OneDrive. Considere usar apenas para desenvolvimento.

---

### **Solução 4: Configurar OneDrive para Ignorar Pasta .git**

1. **Abra as configurações do OneDrive**

2. **Vá em "Backup" > "Gerenciar backup"**

3. **Pause a sincronização temporariamente** para a pasta do projeto

4. **Ou configure o OneDrive para não sincronizar a pasta `.git`**:
   - Adicione `.git` à lista de exclusões do OneDrive

---

## 🔍 Verificação

Após aplicar qualquer solução, verifique:

```powershell
# Testar criação de arquivo
$testFile = ".git/test.tmp"
try {
    [System.IO.File]::Create($testFile).Close()
    Remove-Item $testFile -Force
    Write-Host "SUCESSO: Permissões OK!" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Ainda há problemas: $_" -ForegroundColor Red
}
```

## 📝 Comandos Git Após Correção

Depois de corrigir as permissões:

```powershell
# Adicionar arquivo
git add src/pages/shared-audio-video/page.tsx

# Fazer commit
git commit -m "fix: corrigir erro cannot coerce em links compartilháveis em dispositivos móveis"

# Fazer push
git push
```

## ⚠️ Prevenção

Para evitar problemas futuros:

1. **Não altere permissões da pasta `.git` manualmente**
2. **Evite executar comandos git enquanto o OneDrive está sincronizando**
3. **Considere usar um repositório fora do OneDrive para projetos grandes**
4. **Configure o OneDrive para não sincronizar pastas `.git`**

## 🆘 Ainda Não Funciona?

Se nenhuma solução funcionar:

1. **Reinicie o computador** (pode liberar locks mantidos por processos)
2. **Verifique se há processos do Git rodando**:
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -like "*git*"}
   ```
3. **Verifique se o OneDrive está sincronizando**:
   - Ícone do OneDrive na bandeja do sistema
   - Aguarde a sincronização terminar
4. **Tente fazer o commit em outro terminal** (Git Bash, CMD, etc.)

---

**Última atualização**: 23/01/2026
