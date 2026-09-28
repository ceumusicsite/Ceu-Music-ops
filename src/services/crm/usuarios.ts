import { supabase } from '../../lib/supabase';

export interface OpcaoUsuario {
  id: string;
  name: string;
}

/**
 * Usuários do sistema, usados como "dono" de pessoas, organizações e negócios.
 *
 * Passa por RPC porque o RLS de `users` só deixa cada um ver a própria linha
 * (admin vê todas). A função expõe apenas id e nome dos aprovados, o suficiente
 * para os selects de responsável, sem abrir o resto da tabela.
 */
export async function listarUsuarios(): Promise<OpcaoUsuario[]> {
  const { data, error } = await supabase.rpc('crm_listar_usuarios');
  if (error) throw error;
  return (data as OpcaoUsuario[]) ?? [];
}
