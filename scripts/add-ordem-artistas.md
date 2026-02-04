# Sistema de Ordenação de Artistas

## Descrição

Permite reordenar manualmente os cards dos artistas na seção de artistas.

## Como Executar o Script

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole o conteúdo de `scripts/add-ordem-artistas.sql`
5. Clique em **Run**

## Como Usar na Interface

1. Na página de Artistas, clique no botão **"Modo Ordenação"** (canto superior direito)
2. Aparecerão setas (↑ ↓) em cada card de artista
3. Use as setas para mover o artista para cima ou para baixo
4. A ordem é salva automaticamente
5. Clique em **"Sair do Modo Ordenação"** quando terminar

## Funcionalidades

- ✅ Modo de ordenação discreto (não aparece o tempo todo)
- ✅ Botões de seta para mover artistas
- ✅ Salvamento automático no banco de dados
- ✅ Ordem preservada mesmo com filtros e busca

