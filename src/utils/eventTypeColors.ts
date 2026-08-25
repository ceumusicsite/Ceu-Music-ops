// Paleta de cores vibrantes para novos tipos personalizados
const RANDOM_PALETTE = [
  '#00d2b4', // Teal Céu
  '#8b5cf6', // Roxo Violeta
  '#3b82f6', // Azul Real
  '#ec4899', // Rosa Pink
  '#f97316', // Laranja Vivo
  '#10b981', // Verde Esmeralda
  '#eab308', // Âmbar Dourado
  '#06b6d4', // Ciano
  '#6366f1', // Índigo
  '#14b8a6', // Teal
  '#f43f5e', // Rose
  '#84cc16', // Lima
];

// Mapeamento fixo e padronizado por palavras-chave de tipos de evento
const FIXED_TYPE_COLORS: Record<string, string> = {
  // Institucional & Estúdio Céu
  'gravação no estúdio': '#00d2b4',
  'gravacao no estudio': '#00d2b4',
  'gravação': '#00d2b4',
  'gravacao': '#00d2b4',
  'estúdio': '#00d2b4',
  'estudio': '#00d2b4',
  'lançamento oficial': '#ec4899',
  'lancamento oficial': '#ec4899',
  'lançamento': '#ec4899',
  'lancamento': '#ec4899',
  'gravação artista céu': '#a855f7',
  'gravacao artista ceu': '#a855f7',
  'artista céu': '#a855f7',
  'gravação externa': '#3b82f6',
  'gravacao externa': '#3b82f6',
  'sessão de fotos / vídeo': '#f97316',
  'sessao de fotos': '#f97316',
  'fotos': '#f97316',
  'vídeo': '#f97316',
  'reunião / a&r': '#6366f1',
  'reuniao': '#6366f1',
  'a&r': '#6366f1',
  'produção musical': '#10b981',
  'producao musical': '#10b981',
  'podcast / entrevista': '#06b6d4',
  'podcast': '#06b6d4',

  // Artistas, Shows e Eventos
  'show / apresentação': '#8b5cf6',
  'show': '#8b5cf6',
  'apresentação': '#8b5cf6',
  'apresentacao': '#8b5cf6',
  'culto / igreja': '#0284c7',
  'culto': '#0284c7',
  'igreja': '#0284c7',
  'evento': '#eab308',
  'conferência / congresso': '#10b981',
  'conferência': '#10b981',
  'conferencia': '#10b981',
  'congresso': '#10b981',
  'turnê / viagem': '#f97316',
  'turnê': '#f97316',
  'turne': '#f97316',
  'viagem': '#f97316',
  'entrevista / podcast / tv': '#06b6d4',
  'entrevista': '#06b6d4',
  'ensaio geral': '#64748b',
  'ensaio': '#64748b',
  'lançamento / meet & greet': '#ec4899',
  'meet & greet': '#ec4899',
};

/**
 * Retorna a cor atrelada ao tipo do evento.
 * Se o tipo não estiver na lista predefinida, calcula uma cor consistente da paleta.
 */
export function getEventTypeColor(tipo?: string | null): string {
  if (!tipo || !tipo.trim()) return '#00d2b4';

  const normalized = tipo.trim().toLowerCase();

  // Verifica correspondência exata
  if (FIXED_TYPE_COLORS[normalized]) {
    return FIXED_TYPE_COLORS[normalized];
  }

  // Verifica se contém alguma palavra-chave
  for (const [key, color] of Object.entries(FIXED_TYPE_COLORS)) {
    if (normalized.includes(key)) {
      return color;
    }
  }

  // Gera uma cor determinística / consistente por hash do texto
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % RANDOM_PALETTE.length;
  return RANDOM_PALETTE[index];
}
