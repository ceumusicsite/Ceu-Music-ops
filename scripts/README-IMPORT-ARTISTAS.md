# Importação de Artistas

Este script permite importar artistas de um arquivo JSON para o banco de dados Supabase.

## Como usar

1. **Prepare o arquivo JSON** com os dados dos artistas
   - Coloque o arquivo na raiz do projeto como `artistas.json`
   - Ou especifique o caminho ao executar o script

2. **Estrutura do JSON**

O arquivo deve ser um array de objetos, onde cada objeto representa um artista:

```json
[
  {
    "nome": "Nome do Artista",
    "genero": "Pop",
    "status": "ativo",
    "contato_email": "artista@email.com",
    "contato_telefone": "(11) 99999-9999",
    "biografia": "Biografia do artista...",
    "redes_sociais": {
      "instagram": "https://instagram.com/artista",
      "spotify": "https://open.spotify.com/artist/...",
      "youtube": "https://youtube.com/@artista"
    },
    "seguidores": {
      "instagram": 50000,
      "spotify": 30000,
      "youtube": 20000
    }
  }
]
```

**Campos obrigatórios:**
- `nome` (ou `name`)
- `genero` (ou `genre` ou `genero_musical`)
- `contato_email` (ou `email` ou `contato.email`)

**Campos opcionais:**
- `status` (padrão: "ativo")
- `contato_telefone` (ou `telefone` ou `contato.telefone`)
- `biografia`
- `redes_sociais` (objeto com instagram, spotify, youtube)
- `seguidores` (objeto com contadores)

3. **Execute o script**

```bash
# Se o arquivo estiver na raiz como artistas.json
npm run import-artistas

# Ou especificando o caminho
node scripts/import-artistas.js caminho/para/artistas.json
```

## Funcionalidades

- ✅ Valida campos obrigatórios
- ✅ Verifica se o artista já existe (por nome ou email) e ignora duplicatas
- ✅ Mapeia diferentes formatos de campos (nome/name, genero/genre, etc.)
- ✅ Adiciona informações extras (biografia, redes sociais) nas observações internas
- ✅ Mostra progresso e resumo da importação
- ✅ Trata erros individualmente sem parar a importação

## Exemplo de saída

```
🎵 Importando Artistas da CEU Music

📂 Lendo arquivo: C:\...\artistas.json

✅ Encontrados 10 artista(s) no arquivo

✅ [1/10] Artista 1: Importado com sucesso
✅ [2/10] Artista 2: Importado com sucesso
⏭️  [3/10] Artista 3: Já existe no banco
...

==================================================
📊 Resumo da Importação:
   ✅ Sucesso: 8
   ❌ Erros: 0
   ⏭️  Ignorados (já existem): 2
==================================================

🎉 Importação concluída! Os artistas estão disponíveis no sistema.
```




