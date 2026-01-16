# 🎮 MODO DEMO - Testar sem Supabase

## ⚠️ Atenção
Este modo é APENAS para demonstração e testes locais.
Para usar o sistema completo, você DEVE configurar o Supabase.

## Como ativar

1. Abra o arquivo `.env.local`

2. Adicione esta linha no INÍCIO do arquivo:
   ```env
   VITE_DEMO_MODE=true
   ```

3. Comente as linhas do Supabase (adicione # no início):
   ```env
   # VITE_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
   # VITE_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
   ```

4. Reinicie o servidor:
   ```powershell
   # Ctrl+C para parar
   npm run dev
   ```

## ⚠️ Limitações do Modo Demo

- ❌ Login não funciona (usa usuário fake)
- ❌ Dados não são salvos
- ❌ Upload de arquivos não funciona
- ❌ Apenas para visualizar a interface

## Voltar ao modo normal

1. Remova a linha `VITE_DEMO_MODE=true`
2. Configure o Supabase corretamente
3. Reinicie o servidor
