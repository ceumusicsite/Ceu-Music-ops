# Valores Permitidos para Orçamentos

## Campo: `tipo`

A tabela `orcamentos` possui um **CHECK CONSTRAINT** que limita os valores aceitos para o campo `tipo`.

### ✅ Valores ACEITOS (case-sensitive)

| Valor no Banco | Label no Frontend | Descrição |
|----------------|-------------------|-----------|
| `producao` | Produção | Produção musical, mixagem, masterização |
| `clipe` | Clipe | Videoclipes, vídeos promocionais |
| `capa` | Capa | Design de capa, artes gráficas |
| `midia` | Mídia | Marketing, divulgação, anúncios |
| `outro` | Outro | Outros tipos de despesas |

### ❌ Valores NÃO aceitos

- ❌ `Produção` (com maiúscula)
- ❌ `Mixagem` (não existe na lista)
- ❌ `Masterização` (não existe na lista)
- ❌ `Mídia` (com acento)
- ❌ Qualquer valor com maiúsculas ou acentos

## Regras Importantes

1. **Case-sensitive**: Os valores devem ser exatamente em minúsculas
2. **Sem acentos**: Use `midia` ao invés de `mídia`
3. **Lista fechada**: Apenas os 5 valores acima são aceitos
4. **Obrigatório**: O campo `tipo` é NOT NULL

## Mapeamento no Código

```typescript
// Frontend envia (valor do <select>)
formData.tipo = "producao"  // ✅ correto

// Backend valida com CHECK CONSTRAINT
CHECK (tipo IN ('producao', 'clipe', 'capa', 'midia', 'outro'))

// Frontend exibe (para o usuário)
getTipoLabel("producao") // retorna "Produção"
```

## Como Adicionar Novos Tipos

Se precisar adicionar novos tipos no futuro, execute este SQL no Supabase:

```sql
-- 1. Remover o constraint antigo
ALTER TABLE orcamentos 
DROP CONSTRAINT IF EXISTS orcamentos_tipo_check;

-- 2. Criar novo constraint com os valores atualizados
ALTER TABLE orcamentos
ADD CONSTRAINT orcamentos_tipo_check
CHECK (tipo IN ('producao', 'clipe', 'capa', 'midia', 'mixagem', 'masterizacao', 'outro'));
```

⚠️ **Atenção**: Sempre use valores em minúsculas e sem acentos!

## Histórico de Erros Resolvidos

- ✅ Campo `titulo` obrigatório adicionado
- ✅ Valores de `tipo` corrigidos para minúsculas
- ✅ Carregamento de projetos tornado resiliente
- ✅ Função `getTipoLabel()` criada para exibição



