import { supabase } from '../../lib/supabase';
import { deleteFromR2, getSignedUrlR2, R2_BUCKETS, uploadToR2 } from '../../lib/r2';

export interface CrmArquivo {
  id: string;
  nome: string;
  arquivo_key: string;
  tamanho?: number | null;
  tipo_mime?: string | null;
  autor_id?: string | null;
  autor_nome?: string | null;
  created_at: string;
}

const SELECT_ARQUIVO = `*, autor:users!crm_files_autor_id_fkey ( id, name )`;

export async function listarArquivosDe(
  campo: 'deal_id' | 'person_id' | 'organizacao_id',
  id: string
): Promise<CrmArquivo[]> {
  const { data, error } = await supabase
    .from('crm_files')
    .select(SELECT_ARQUIVO)
    .eq(campo, id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    nome: row.nome,
    arquivo_key: row.arquivo_key,
    tamanho: row.tamanho,
    tipo_mime: row.tipo_mime,
    autor_id: row.autor_id,
    autor_nome: row.autor?.name ?? null,
    created_at: row.created_at,
  }));
}

export async function enviarArquivo(
  arquivo: File,
  vinculo: { deal_id?: string; person_id?: string; organizacao_id?: string },
  autorId?: string | null,
  onProgress?: (percentual: number) => void
): Promise<void> {
  const resultado = await uploadToR2(arquivo, { folder: 'crm', onProgress });

  const { error } = await supabase.from('crm_files').insert({
    nome: arquivo.name,
    arquivo_key: resultado.key,
    tamanho: arquivo.size,
    tipo_mime: arquivo.type || null,
    autor_id: autorId ?? null,
    ...vinculo,
  });

  if (error) {
    // Não deixa o objeto órfão no R2 se o registro falhar.
    await deleteFromR2(R2_BUCKETS.ANEXOS, resultado.key).catch(() => undefined);
    throw error;
  }
}

/** URL temporária para baixar, já com o nome original no cabeçalho. */
export async function urlParaBaixar(arquivo: CrmArquivo): Promise<string> {
  return getSignedUrlR2(R2_BUCKETS.ANEXOS, arquivo.arquivo_key, 3600, {
    responseContentDisposition: `attachment; filename="${encodeURIComponent(arquivo.nome)}"`,
  });
}

export async function excluirArquivo(arquivo: CrmArquivo): Promise<void> {
  const { error } = await supabase.from('crm_files').delete().eq('id', arquivo.id);
  if (error) throw error;

  await deleteFromR2(R2_BUCKETS.ANEXOS, arquivo.arquivo_key).catch((e) => {
    // O registro já saiu; um objeto remanescente no R2 não deve travar a tela.
    console.warn('Arquivo removido do banco, mas não do R2:', e);
  });
}

export function formatarTamanho(bytes?: number | null): string {
  if (!bytes) return '';
  const unidades = ['B', 'KB', 'MB', 'GB'];
  let valor = bytes;
  let indice = 0;
  while (valor >= 1024 && indice < unidades.length - 1) {
    valor /= 1024;
    indice += 1;
  }
  return `${valor.toFixed(indice === 0 ? 0 : 1)} ${unidades[indice]}`;
}
