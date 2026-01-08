export interface ServicoFornecedor {
  id: string;
  nome: string;
  descricao?: string;
  preco_base?: number;
}

export interface Fornecedor {
  id: string;
  nome: string;
  categoria: 'estudio' | 'equipamento' | 'servico' | 'outro';
  tipo_servico: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  contato_email: string;
  contato_telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cnpj?: string;
  responsavel?: string;
  website?: string;
  observacoes?: string;
  projetos_utilizados?: number;
  avaliacao?: number;
  servicos?: ServicoFornecedor[];
  created_at: string;
}

export const fornecedoresMock: Fornecedor[] = [
  {
    id: '1',
    nome: 'Estúdio Toca do Bandido',
    categoria: 'estudio',
    tipo_servico: 'Gravação e Mixagem',
    status: 'ativo',
    contato_email: 'contato@tocadobandido.com.br',
    contato_telefone: '(11) 3456-7890',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cnpj: '12.345.678/0001-90',
    responsavel: 'João Silva',
    website: 'www.tocadobandido.com.br',
    observacoes: 'Estúdio renomado com equipamentos de alta qualidade. Especializado em gravação de música popular brasileira.',
    projetos_utilizados: 15,
    avaliacao: 4.8,
    created_at: '2022-01-10T10:00:00Z'
  },
  {
    id: '2',
    nome: 'Audio Pro Equipamentos',
    categoria: 'equipamento',
    tipo_servico: 'Aluguel de Equipamentos de Áudio',
    status: 'ativo',
    contato_email: 'vendas@audiopro.com.br',
    contato_telefone: '(21) 9876-5432',
    endereco: 'Av. Atlântica, 456',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cnpj: '23.456.789/0001-01',
    responsavel: 'Maria Santos',
    website: 'www.audiopro.com.br',
    observacoes: 'Fornece microfones, mesas de som, interfaces de áudio e equipamentos de estúdio.',
    projetos_utilizados: 28,
    avaliacao: 4.6,
    created_at: '2021-08-15T14:30:00Z'
  },
  {
    id: '3',
    nome: 'MixMaster Studio',
    categoria: 'servico',
    tipo_servico: 'Mixagem e Masterização',
    status: 'ativo',
    contato_email: 'contato@mixmaster.com.br',
    contato_telefone: '(11) 3344-5566',
    cidade: 'São Paulo',
    estado: 'SP',
    cnpj: '34.567.890/0001-12',
    responsavel: 'Carlos Mendes',
    website: 'www.mixmaster.com.br',
    observacoes: 'Especializado em mixagem e masterização digital. Trabalha com diversos gêneros musicais.',
    projetos_utilizados: 42,
    avaliacao: 4.9,
    created_at: '2020-12-05T09:15:00Z'
  },
  {
    id: '4',
    nome: 'CineMusic Produções',
    categoria: 'servico',
    tipo_servico: 'Produção de Videoclipes',
    status: 'ativo',
    contato_email: 'producao@cinemusic.com.br',
    contato_telefone: '(11) 2233-4455',
    endereco: 'Rua dos Cineastas, 789',
    cidade: 'São Paulo',
    estado: 'SP',
    cnpj: '45.678.901/0001-23',
    responsavel: 'Ana Paula',
    website: 'www.cinemusic.com.br',
    observacoes: 'Produtora de videoclipes com equipe completa. Direção, câmera, edição e pós-produção.',
    projetos_utilizados: 33,
    avaliacao: 4.7,
    created_at: '2021-03-20T11:20:00Z'
  },
  {
    id: '5',
    nome: 'Design Sound Visual',
    categoria: 'servico',
    tipo_servico: 'Design Gráfico e Visual',
    status: 'ativo',
    contato_email: 'contato@designsound.com.br',
    contato_telefone: '(21) 3456-7890',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cnpj: '56.789.012/0001-34',
    responsavel: 'Roberto Lima',
    website: 'www.designsound.com.br',
    observacoes: 'Criação de capas de álbuns, artes para redes sociais, identidade visual e materiais promocionais.',
    projetos_utilizados: 19,
    avaliacao: 4.5,
    created_at: '2022-05-12T16:45:00Z'
  },
  {
    id: '6',
    nome: 'Estúdio Música Viva',
    categoria: 'estudio',
    tipo_servico: 'Gravação, Mixagem e Masterização',
    status: 'ativo',
    contato_email: 'estudio@musicaviva.com.br',
    contato_telefone: '(11) 4455-6677',
    endereco: 'Av. Paulista, 1000',
    cidade: 'São Paulo',
    estado: 'SP',
    cnpj: '67.890.123/0001-45',
    responsavel: 'Fernanda Costa',
    website: 'www.musicaviva.com.br',
    observacoes: 'Estúdio completo com salas de gravação, mixagem e masterização. Equipamentos de última geração.',
    projetos_utilizados: 24,
    avaliacao: 4.8,
    created_at: '2021-11-08T13:00:00Z'
  },
  {
    id: '7',
    nome: 'Distribuidora Digital Music',
    categoria: 'servico',
    tipo_servico: 'Distribuição Digital',
    status: 'ativo',
    contato_email: 'contato@digitalmusic.com.br',
    contato_telefone: '(11) 5566-7788',
    cidade: 'São Paulo',
    estado: 'SP',
    cnpj: '78.901.234/0001-56',
    responsavel: 'Lucas Oliveira',
    website: 'www.digitalmusic.com.br',
    observacoes: 'Distribuição para Spotify, Apple Music, Deezer, YouTube Music e outras plataformas digitais.',
    projetos_utilizados: 67,
    avaliacao: 4.4,
    created_at: '2020-06-18T10:30:00Z'
  },
  {
    id: '8',
    nome: 'Instrumentos & Sons',
    categoria: 'equipamento',
    tipo_servico: 'Venda e Aluguel de Instrumentos',
    status: 'ativo',
    contato_email: 'vendas@instrumentosons.com.br',
    contato_telefone: '(11) 6677-8899',
    endereco: 'Rua dos Músicos, 234',
    cidade: 'São Paulo',
    estado: 'SP',
    cnpj: '89.012.345/0001-67',
    responsavel: 'Pedro Alves',
    website: 'www.instrumentosons.com.br',
    observacoes: 'Loja especializada em instrumentos musicais. Venda e aluguel de guitarras, baixos, baterias, teclados e mais.',
    projetos_utilizados: 12,
    avaliacao: 4.3,
    created_at: '2022-08-22T15:20:00Z'
  },
  {
    id: '9',
    nome: 'Marketing Music Agency',
    categoria: 'servico',
    tipo_servico: 'Marketing e Promoção',
    status: 'ativo',
    contato_email: 'contato@marketingmusic.com.br',
    contato_telefone: '(21) 7788-9900',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cnpj: '90.123.456/0001-78',
    responsavel: 'Juliana Ferreira',
    website: 'www.marketingmusic.com.br',
    observacoes: 'Agência especializada em marketing musical. Gestão de redes sociais, campanhas promocionais e relações públicas.',
    projetos_utilizados: 38,
    avaliacao: 4.6,
    created_at: '2021-04-30T12:00:00Z'
  },
  {
    id: '10',
    nome: 'Estúdio Acústico Premium',
    categoria: 'estudio',
    tipo_servico: 'Gravação Acústica',
    status: 'ativo',
    contato_email: 'contato@acusticopremium.com.br',
    contato_telefone: '(11) 8899-0011',
    endereco: 'Rua Harmonia, 567',
    cidade: 'São Paulo',
    estado: 'SP',
    cnpj: '01.234.567/0001-89',
    responsavel: 'Marcos Ribeiro',
    website: 'www.acusticopremium.com.br',
    observacoes: 'Estúdio com excelente acústica. Ideal para gravações de música clássica, MPB e jazz.',
    projetos_utilizados: 8,
    avaliacao: 4.9,
    created_at: '2022-09-14T09:30:00Z'
  },
  {
    id: '11',
    nome: 'Light & Sound Eventos',
    categoria: 'servico',
    tipo_servico: 'Sonorização e Iluminação',
    status: 'ativo',
    contato_email: 'eventos@lightsound.com.br',
    contato_telefone: '(11) 9900-1122',
    endereco: 'Av. dos Eventos, 890',
    cidade: 'São Paulo',
    estado: 'SP',
    cnpj: '12.345.678/0001-90',
    responsavel: 'Ricardo Souza',
    website: 'www.lightsound.com.br',
    observacoes: 'Fornece equipamentos de som e iluminação para shows, eventos e apresentações ao vivo.',
    projetos_utilizados: 21,
    avaliacao: 4.5,
    created_at: '2021-07-25T14:15:00Z'
  },
  {
    id: '12',
    nome: 'Foto & Vídeo Music',
    categoria: 'servico',
    tipo_servico: 'Fotografia e Vídeo',
    status: 'ativo',
    contato_email: 'contato@fotovideomusic.com.br',
    contato_telefone: '(21) 2233-4455',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cnpj: '23.456.789/0001-01',
    responsavel: 'Patrícia Martins',
    website: 'www.fotovideomusic.com.br',
    observacoes: 'Serviços de fotografia para capas, sessões de fotos de artistas e cobertura de eventos musicais.',
    projetos_utilizados: 16,
    avaliacao: 4.7,
    created_at: '2022-02-10T11:45:00Z'
  }
];

