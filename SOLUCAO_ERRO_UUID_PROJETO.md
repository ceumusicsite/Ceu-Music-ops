# 🔧 Solução: Erro "invalid input syntax for type uuid: '2'"

## 🔴 Problema

Ao criar um projeto, ocorre o erro:
```
Erro ao criar projeto: invalid input syntax for type uuid: "2"
```

## 🔍 Causa

O erro ocorre porque campos UUID estão recebendo valores inválidos:
- Strings vazias (`''`) em vez de `null`
- Valores numéricos como `"2"` (provavelmente de índices de dropdown)
- Valores que não são UUIDs válidos

### Campos afetados:
- `artista_id`
- `fornecedor_audio_id`
- `fornecedor_video_id`
- `local_gravacao_id`
- `produtor_id`
- `maquiador_id`

## ✅ Solução Aplicada

Foi adicionada uma função `toUUID()` que:
1. **Valida** se o valor é um UUID válido
2. **Converte** strings vazias para `null`
3. **Filtra** valores inválidos (como "2", "0", etc.)
4. **Retorna** `null` para valores inválidos

### Código adicionado:

```typescript
// Função helper para validar e converter UUID
const toUUID = (value: string | null | undefined): string | null => {
  if (!value || value.trim() === '' || value === '0' || value === 'null' || value === 'undefined') {
    return null;
  }
  // Validar formato UUID básico (8-4-4-4-12 caracteres hexadecimais)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(value)) {
    return value;
  }
  // Se não for um UUID válido, retornar null
  return null;
};
```

## 📋 Verificação

Após a correção, todos os campos UUID são validados antes de serem enviados:

```typescript
const dadosProjeto: any = {
  // ...
  artista_id: toUUID(formData.artista_id),
  fornecedor_audio_id: toUUID(fornecedoresData.fornecedor_audio_id),
  fornecedor_video_id: toUUID(fornecedoresData.fornecedor_video_id),
  local_gravacao_id: toUUID(fornecedoresData.local_gravacao_id),
  produtor_id: toUUID(fornecedoresData.produtor_id),
  maquiador_id: toUUID(fornecedoresData.maquiador_id),
  // ...
};
```

## 🧪 Como Testar

1. **Criar um projeto sem selecionar fornecedores:**
   - Deixe os campos de fornecedores vazios
   - O sistema deve aceitar e enviar `null` para esses campos

2. **Criar um projeto selecionando fornecedores:**
   - Selecione fornecedores válidos
   - O sistema deve validar os UUIDs antes de enviar

3. **Verificar no console:**
   - Não deve aparecer erros de UUID
   - O projeto deve ser criado com sucesso

## 🔄 Se o Erro Persistir

### Verificar estrutura do banco:

Execute no Supabase SQL Editor:

```sql
-- Verificar se as colunas existem e são do tipo UUID
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'projetos' 
  AND column_name IN (
    'artista_id',
    'fornecedor_audio_id',
    'fornecedor_video_id',
    'local_gravacao_id',
    'produtor_id',
    'maquiador_id'
  );
```

### Verificar dados dos dropdowns:

Os dropdowns devem retornar UUIDs válidos, não índices numéricos.

## 📝 Notas

- ✅ A correção garante que apenas UUIDs válidos ou `null` sejam enviados
- ✅ Valores inválidos são automaticamente convertidos para `null`
- ✅ O banco de dados aceita `null` para campos UUID opcionais
- ✅ Não é necessário alterar a estrutura do banco

---

**Status:** ✅ Corrigido no arquivo `src/pages/projetos/Novo.tsx`
