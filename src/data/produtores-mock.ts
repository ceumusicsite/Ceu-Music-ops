export interface Produtor {
  id: string;
  nome: string;
  especialidade: string;
  status: 'ativo' | 'ocupado' | 'disponivel' | 'inativo';
  contato_email: string;
  contato_telefone?: string;
  instagram?: string;
  portfolio?: string;
  anos_experiencia: number;
  artistas_trabalhados: string[];
  projetos: {
    id: string;
    nome: string;
    artista: string;
    tipo: string;
    ano: number;
  }[];
  observacoes?: string;
  created_at: string;
}

export const produtoresMock: Produtor[] = [
  {
    id: '1',
    nome: 'Carlos Silva',
    especialidade: 'Produtor Musical / Mix & Master',
    status: 'disponivel',
    contato_email: 'carlos.silva@ceumusic.com',
    contato_telefone: '(11) 98765-4321',
    instagram: '@carlossilvaproducer',
    portfolio: 'carlossilva.com',
    anos_experiencia: 12,
    artistas_trabalhados: ['Anitta', 'Ludmilla', 'Pabllo Vittar', 'Gloria Groove'],
    projetos: [
      {
        id: 'p1',
        nome: 'Envolver',
        artista: 'Anitta',
        tipo: 'Single',
        ano: 2023
      },
      {
        id: 'p2',
        nome: 'Verdinha',
        artista: 'Ludmilla',
        tipo: 'Álbum',
        ano: 2022
      },
      {
        id: 'p3',
        nome: 'Parabéns',
        artista: 'Pabllo Vittar',
        tipo: 'Single',
        ano: 2023
      }
    ],
    observacoes: 'Especialista em pop urbano e funk brasileiro',
    created_at: '2023-01-15T10:30:00Z'
  },
  {
    id: '2',
    nome: 'Marina Costa',
    especialidade: 'Produtora / Compositora',
    status: 'ocupado',
    contato_email: 'marina.costa@ceumusic.com',
    contato_telefone: '(21) 99876-5432',
    instagram: '@marinacostamusic',
    portfolio: 'marinacosta.com.br',
    anos_experiencia: 8,
    artistas_trabalhados: ['Liniker', 'Céu', 'Marisa Monte', 'Elza Soares'],
    projetos: [
      {
        id: 'p4',
        nome: 'Indigo Borboleta Anil',
        artista: 'Liniker',
        tipo: 'Álbum',
        ano: 2021
      },
      {
        id: 'p5',
        nome: 'APKA!',
        artista: 'Céu',
        tipo: 'Álbum',
        ano: 2019
      },
      {
        id: 'p6',
        nome: 'Portas',
        artista: 'Marisa Monte',
        tipo: 'Álbum',
        ano: 2021
      }
    ],
    observacoes: 'Especializada em MPB contemporânea e música autoral',
    created_at: '2022-05-20T14:20:00Z'
  },
  {
    id: '3',
    nome: 'Rafael "RAF" Santos',
    especialidade: 'Beatmaker / Produtor Hip Hop',
    status: 'ativo',
    contato_email: 'raf.santos@ceumusic.com',
    contato_telefone: '(11) 97654-3210',
    instagram: '@rafsantosbeats',
    portfolio: 'rafsantos.beats',
    anos_experiencia: 10,
    artistas_trabalhados: ['Emicida', 'Racionais MC\'s', 'Djonga', 'BK\'', 'Criolo'],
    projetos: [
      {
        id: 'p7',
        nome: 'AmarElo',
        artista: 'Emicida',
        tipo: 'Álbum',
        ano: 2019
      },
      {
        id: 'p8',
        nome: 'Corre das Quebradas',
        artista: 'Racionais MC\'s',
        tipo: 'Single',
        ano: 2022
      },
      {
        id: 'p9',
        nome: 'Ladrão',
        artista: 'Djonga',
        tipo: 'Álbum',
        ano: 2023
      },
      {
        id: 'p10',
        nome: 'Gigantes',
        artista: 'BK\'',
        tipo: 'Single',
        ano: 2022
      }
    ],
    observacoes: 'Referência em Hip Hop nacional, trabalha com samples e produção orgânica',
    created_at: '2021-08-10T09:15:00Z'
  },
  {
    id: '4',
    nome: 'Juliana Oliveira',
    especialidade: 'Produtora Executiva / A&R',
    status: 'disponivel',
    contato_email: 'juliana.oliveira@ceumusic.com',
    contato_telefone: '(11) 96543-2109',
    instagram: '@juoliveira_ar',
    anos_experiencia: 15,
    artistas_trabalhados: ['Gilberto Gil', 'Caetano Veloso', 'Gal Costa', 'Maria Bethânia'],
    projetos: [
      {
        id: 'p11',
        nome: 'OK OK OK',
        artista: 'Gilberto Gil',
        tipo: 'Álbum',
        ano: 2018
      },
      {
        id: 'p12',
        nome: 'Meu Coco',
        artista: 'Caetano Veloso',
        tipo: 'Álbum',
        ano: 2021
      },
      {
        id: 'p13',
        nome: 'A Pele do Futuro',
        artista: 'Gal Costa',
        tipo: 'Álbum',
        ano: 2019
      }
    ],
    observacoes: 'Vasta experiência com artistas consagrados da MPB',
    created_at: '2020-03-05T11:45:00Z'
  },
  {
    id: '5',
    nome: 'Diego Mendes',
    especialidade: 'Produtor / Engenheiro de Áudio',
    status: 'ocupado',
    contato_email: 'diego.mendes@ceumusic.com',
    contato_telefone: '(11) 95432-1098',
    instagram: '@diegomendesaudio',
    portfolio: 'diegomendesmix.com',
    anos_experiencia: 9,
    artistas_trabalhados: ['Silva', 'Francisco El Hombre', 'Tuyo', 'Terno Rei'],
    projetos: [
      {
        id: 'p14',
        nome: 'Claridão',
        artista: 'Silva',
        tipo: 'Álbum',
        ano: 2021
      },
      {
        id: 'p15',
        nome: 'Rasgacabeza',
        artista: 'Francisco El Hombre',
        tipo: 'Álbum',
        ano: 2018
      },
      {
        id: 'p16',
        nome: 'O Amor é Noite',
        artista: 'Tuyo',
        tipo: 'Álbum',
        ano: 2020
      }
    ],
    observacoes: 'Especialista em rock alternativo e indie brasileiro',
    created_at: '2021-11-12T16:30:00Z'
  },
  {
    id: '6',
    nome: 'Thiago "TH" Rodrigues',
    especialidade: 'Produtor Eletrônico / DJ',
    status: 'disponivel',
    contato_email: 'th.rodrigues@ceumusic.com',
    contato_telefone: '(11) 94321-0987',
    instagram: '@th_producer',
    portfolio: 'thproducer.com',
    anos_experiencia: 7,
    artistas_trabalhados: ['Vintage Culture', 'Alok', 'Bruno Martini', 'Cat Dealers'],
    projetos: [
      {
        id: 'p17',
        nome: 'It Is What It Is',
        artista: 'Vintage Culture',
        tipo: 'Single',
        ano: 2023
      },
      {
        id: 'p18',
        nome: 'Hear Me Now',
        artista: 'Alok',
        tipo: 'Single',
        ano: 2022
      },
      {
        id: 'p19',
        nome: 'Living on the Outside',
        artista: 'Bruno Martini',
        tipo: 'Single',
        ano: 2021
      }
    ],
    observacoes: 'Especializado em house music e EDM',
    created_at: '2022-07-18T13:00:00Z'
  },
  {
    id: '7',
    nome: 'Patrícia Almeida',
    especialidade: 'Produtora / Arranjadora',
    status: 'ativo',
    contato_email: 'patricia.almeida@ceumusic.com',
    contato_telefone: '(21) 93210-9876',
    instagram: '@patriciaalmeidamusic',
    anos_experiencia: 11,
    artistas_trabalhados: ['Seu Jorge', 'Zeca Pagodinho', 'Alcione', 'Diogo Nogueira'],
    projetos: [
      {
        id: 'p20',
        nome: 'Sambabook Caetano Veloso',
        artista: 'Seu Jorge',
        tipo: 'Álbum',
        ano: 2020
      },
      {
        id: 'p21',
        nome: 'Mais Feliz',
        artista: 'Zeca Pagodinho',
        tipo: 'Álbum',
        ano: 2022
      },
      {
        id: 'p22',
        nome: 'A Voz do Samba',
        artista: 'Alcione',
        tipo: 'Álbum',
        ano: 2021
      }
    ],
    observacoes: 'Especialista em samba e música popular brasileira',
    created_at: '2020-09-22T10:00:00Z'
  },
  {
    id: '8',
    nome: 'Lucas Fernandes',
    especialidade: 'Produtor / Sound Designer',
    status: 'disponivel',
    contato_email: 'lucas.fernandes@ceumusic.com',
    contato_telefone: '(11) 92109-8765',
    instagram: '@lucasfernandessound',
    portfolio: 'lucasfernandes.audio',
    anos_experiencia: 6,
    artistas_trabalhados: ['Jovem Dionísio', 'Lagum', 'Vitão', 'Tiago Iorc'],
    projetos: [
      {
        id: 'p23',
        nome: 'Acorda Pedrinho',
        artista: 'Jovem Dionísio',
        tipo: 'Single',
        ano: 2022
      },
      {
        id: 'p24',
        nome: 'Deixa',
        artista: 'Lagum',
        tipo: 'Álbum',
        ano: 2023
      },
      {
        id: 'p25',
        nome: 'Meu Abrigo',
        artista: 'Tiago Iorc',
        tipo: 'Single',
        ano: 2021
      }
    ],
    observacoes: 'Trabalha com pop alternativo e música indie pop',
    created_at: '2022-12-01T15:20:00Z'
  }
];

