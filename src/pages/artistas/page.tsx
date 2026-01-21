import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { supabase } from '../../lib/supabase';

interface Artista {
  id: string;
  nome: string;
  genero: string;
  status: string;
  contato_email: string;
  contato_telefone?: string;
  observacoes_internas?: string;
  created_at: string;
  foto?: string; // Caminho da foto
  isFromPhotos?: boolean; // Indica se é um artista que só tem foto, sem registro no banco
}

export default function Artistas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState<'csv' | 'json' | 'supabase' | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [supabaseTableName, setSupabaseTableName] = useState('artistas');
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [artistaToDelete, setArtistaToDelete] = useState<Artista | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    genero: 'gospel', // Todos os artistas da CEU são gospel
    status: 'ativo',
    contato_email: '',
    contato_telefone: '',
    observacoes_internas: ''
  });

  useEffect(() => {
    loadArtistas();
  }, []);

  // Função para normalizar nome do artista para corresponder à pasta
  const normalizeNome = (nome: string): string => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/[^a-z0-9-]/g, ''); // Remove caracteres especiais
  };

  // Função para encontrar a foto do artista
  const getArtistaFoto = (nome: string): string | null => {
    const normalizedNome = normalizeNome(nome);
    
    // Mapeamento direto de nomes conhecidos (para casos especiais)
    const nomeMapping: Record<string, string> = {
      'alex-lucio': 'alex-lucio',
      'caio-torres': 'caio-torres',
      'debora-lopes': 'debora-lopes',
      'gabriel-magalhaes': 'gabriel-magalhaes',
      'george-lean': 'george-lean',
      'kaka-tavares': 'kaka-tavares',
      'maria-pita': 'maria-pita',
      'martinha': 'martinha',
      'na-graca': 'na graca',
      'nicole-lavinia': 'nicole-lavinia',
      'no-santuario': 'no santuario',
      'rachel-malafaia': 'rachel-malafaia',
      'william-soares': 'william-soares',
    };

    // Tenta encontrar pelo mapeamento primeiro
    const pastaNome = nomeMapping[normalizedNome] || normalizedNome;
    
    // Lista de pastas conhecidas com fotos
    const pastasComFotos = [
      'alex-lucio',
      'caio-torres',
      'debora-lopes',
      'gabriel-magalhaes',
      'george-lean',
      'kaka-tavares',
      'maria-pita',
      'martinha',
      'na graca',
      'nicole-lavinia',
      'no santuario',
      'rachel-malafaia',
      'william-soares',
    ];

    // Verifica se a pasta existe
    if (pastasComFotos.includes(pastaNome)) {
      // Retorna o caminho da foto
      return `/artistas/${pastaNome}/${pastaNome === 'alex-lucio' ? 'IMG_3735.jpg' :
        pastaNome === 'caio-torres' ? 'IMG_0273.jpg' :
        pastaNome === 'debora-lopes' ? 'debora-lopes.png' :
        pastaNome === 'gabriel-magalhaes' ? 'IMG_4165.jpg' :
        pastaNome === 'george-lean' ? 'IMG_1982.jpg' :
        pastaNome === 'kaka-tavares' ? 'IMG_3648.jpg' :
        pastaNome === 'maria-pita' ? 'IMG_4240.jpg' :
        pastaNome === 'martinha' ? 'Gemini_Generated_Image_o5dhzho5dhzho5dh (1).png' :
        pastaNome === 'na graca' ? 'na graca.png' :
        pastaNome === 'nicole-lavinia' ? 'IMG_3996.jpg' :
        pastaNome === 'no santuario' ? 'IMG_0090.jpg' :
        pastaNome === 'rachel-malafaia' ? 'IMG_5693.jpg' :
        pastaNome === 'william-soares' ? 'IMG_4092.jpg' : ''}`;
    }

    return null;
  };

  // Lista de artistas que têm fotos mas podem não estar no banco
  const artistasComFotos: Array<{ nome: string; foto: string }> = [
    { nome: 'Alex Lucio', foto: '/artistas/alex-lucio/IMG_3735.jpg' },
    { nome: 'Caio Torres', foto: '/artistas/caio-torres/IMG_0273.jpg' },
    { nome: 'Débora Lopes', foto: '/artistas/debora-lopes/debora-lopes.png' },
    { nome: 'Gabriel Magalhães', foto: '/artistas/gabriel-magalhaes/IMG_4165.jpg' },
    { nome: 'George Lean', foto: '/artistas/george-lean/IMG_1982.jpg' },
    { nome: 'Kaká Tavares', foto: '/artistas/kaka-tavares/IMG_3648.jpg' },
    { nome: 'Maria Pita', foto: '/artistas/maria-pita/IMG_4240.jpg' },
    { nome: 'Martinha', foto: '/artistas/martinha/Gemini_Generated_Image_o5dhzho5dhzho5dh (1).png' },
    { nome: 'Na Graça', foto: '/artistas/na graca/na graca.png' },
    { nome: 'Nicole Lavínia', foto: '/artistas/nicole-lavinia/IMG_3996.jpg' },
    { nome: 'No Santuário', foto: '/artistas/no santuario/IMG_0090.jpg' },
    { nome: 'Rachel Malafaia', foto: '/artistas/rachel-malafaia/IMG_5693.jpg' },
    { nome: 'William Soares', foto: '/artistas/william-soares/IMG_4092.jpg' },
  ];

  const loadArtistas = async () => {
    try {
      const { data, error } = await supabase
        .from('artistas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArtistas(data || []);
    } catch (error) {
      console.error('Erro ao carregar artistas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('artistas')
        .insert([formData]);

      if (error) throw error;

      setShowModal(false);
      setFormData({
        nome: '',
        genero: 'gospel', // Todos os artistas da CEU são gospel
        status: 'ativo',
        contato_email: '',
        contato_telefone: '',
        observacoes_internas: ''
      });
      loadArtistas();
    } catch (error) {
      console.error('Erro ao criar artista:', error);
      alert('Erro ao criar artista. Tente novamente.');
    }
  };

  const handleDeleteClick = (artista: Artista) => {
    setArtistaToDelete(artista);
    setShowDeleteConfirm(true);
    setShowActionsMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!artistaToDelete) return;

    try {
      const { error } = await supabase
        .from('artistas')
        .delete()
        .eq('id', artistaToDelete.id);

      if (error) throw error;

      setShowDeleteConfirm(false);
      setArtistaToDelete(null);
      loadArtistas();
    } catch (error) {
      console.error('Erro ao deletar artista:', error);
      alert('Erro ao deletar artista. Tente novamente.');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setArtistaToDelete(null);
  };

  // Adiciona fotos aos artistas existentes e cria lista combinada
  const artistasComFotosAdicionadas = artistas.map(artista => ({
    ...artista,
    foto: getArtistaFoto(artista.nome) || undefined,
  }));

  // Encontra artistas que têm fotos mas não estão no banco
  const artistasSemRegistro = artistasComFotos.filter(fotoArtista => {
    const normalizedFotoNome = normalizeNome(fotoArtista.nome);
    return !artistas.some(artista => 
      normalizeNome(artista.nome) === normalizedFotoNome
    );
  }).map(fotoArtista => ({
    id: `foto-${normalizeNome(fotoArtista.nome)}`,
    nome: fotoArtista.nome,
    genero: 'gospel',
    status: 'ativo',
    contato_email: '',
    foto: fotoArtista.foto,
    isFromPhotos: true,
    created_at: new Date().toISOString(),
  }));

  // Combina artistas do banco com artistas que só têm fotos
  const todosArtistas = [...artistasComFotosAdicionadas, ...artistasSemRegistro];

  const filteredArtistas = todosArtistas.filter(artista => {
    const matchesSearch = artista.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || artista.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin"></i>
            <p className="text-gray-400 mt-4">Carregando artistas...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Artistas</h1>
            <p className="text-gray-400 text-sm md:text-base">Gerencie todos os artistas da gravadora</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <i className="ri-add-line text-lg md:text-xl"></i>
            <span className="text-sm md:text-base">Novo Artista</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['todos', 'ativo', 'em_producao', 'pausa', 'finalizado'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-smooth cursor-pointer whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-gradient-primary text-white'
                      : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  {status === 'todos' ? 'Todos' : 
                   status === 'em_producao' ? 'Em Produção' :
                   status === 'pausa' ? 'Pausa' :
                   status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Artists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArtistas.map((artista) => (
            <div 
              key={artista.id} 
              className="bg-dark-card border border-dark-border rounded-xl overflow-hidden hover:border-primary-teal transition-smooth flex flex-col"
              onClick={() => {
                // Fechar menu de ações se clicar fora dele
                if (showActionsMenu !== artista.id) {
                  setShowActionsMenu(null);
                }
              }}
            >
              {/* Área da Foto */}
              <div className="w-full py-8 px-6 bg-dark-bg flex items-center justify-center">
                {artista.foto ? (
                  <div className="w-52 h-64 rounded-xl overflow-hidden shadow-xl">
                    <img 
                      src={artista.foto} 
                      alt={artista.nome}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Se a imagem não carregar, mostra as iniciais
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.className = 'w-52 h-64 rounded-xl bg-gradient-primary flex items-center justify-center shadow-xl';
                          parent.innerHTML = `<span class="text-5xl font-bold text-white">${getInitials(artista.nome)}</span>`;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-52 h-64 rounded-xl bg-gradient-primary flex items-center justify-center shadow-xl">
                    <span className="text-5xl font-bold text-white">{getInitials(artista.nome)}</span>
                  </div>
                )}
              </div>

              {/* Informações do Artista */}
              <div className="px-6 py-7 space-y-4 flex-1">
                {/* Nome do Artista */}
                <h3 className="text-lg font-semibold text-white mb-2">{artista.nome}</h3>
                
                {/* Email */}
                {artista.contato_email && (
                  <div className="flex items-center gap-3 text-base text-white">
                    <i className="ri-mail-line text-primary-teal text-xl"></i>
                    <span className="truncate">{artista.contato_email}</span>
                  </div>
                )}
                
                {/* Telefone */}
                {artista.contato_telefone && (
                  <div className="flex items-center gap-3 text-base text-white">
                    <i className="ri-phone-line text-primary-teal text-xl"></i>
                    <span>{artista.contato_telefone}</span>
                  </div>
                )}

                {/* Indicador de artista sem registro completo */}
                {artista.isFromPhotos && (
                  <div className="flex items-center gap-2 text-sm text-yellow-400">
                    <i className="ri-image-line"></i>
                    <span>Foto disponível - Registro incompleto</span>
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="px-6 pb-6 flex gap-3 relative">
                {!artista.isFromPhotos ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/artistas/${artista.id}`);
                    }}
                    className="flex-1 px-5 py-3 bg-dark-bg hover:bg-dark-hover text-white text-base font-medium rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Ver Detalhes
                  </button>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowModal(true);
                      setFormData({
                        nome: artista.nome,
                        genero: 'gospel',
                        status: 'ativo',
                        contato_email: '',
                        contato_telefone: '',
                        observacoes_internas: ''
                      });
                    }}
                    className="flex-1 px-5 py-3 bg-gradient-primary hover:opacity-90 text-white text-base font-medium rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Criar Registro
                  </button>
                )}
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActionsMenu(showActionsMenu === artista.id ? null : artista.id);
                    }}
                    className="w-12 h-12 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer flex items-center justify-center"
                    title="Mais opções"
                  >
                    <i className="ri-more-2-fill text-xl"></i>
                  </button>
                  
                  {showActionsMenu === artista.id && !artista.isFromPhotos && (
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-dark-card border border-dark-border rounded-lg shadow-lg z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/artistas/${artista.id}`);
                          setShowActionsMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-hover transition-smooth cursor-pointer flex items-center gap-2 rounded-t-lg"
                      >
                        <i className="ri-eye-line"></i>
                        Ver Detalhes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/artistas/${artista.id}`);
                          setShowActionsMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-hover transition-smooth cursor-pointer flex items-center gap-2"
                      >
                        <i className="ri-edit-line"></i>
                        Editar
                      </button>
                      <div className="border-t border-dark-border"></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(artista);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-smooth cursor-pointer flex items-center gap-2 rounded-b-lg"
                      >
                        <i className="ri-delete-bin-line"></i>
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredArtistas.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-user-star-line text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">Nenhum artista encontrado</p>
          </div>
        )}

        {/* Modal Importar Artistas */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Importar Artistas</h2>
                <button 
                  onClick={() => {
                    setShowImportModal(false);
                    setImportType(null);
                    setImportError(null);
                    setImportSuccess(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              {!importType ? (
                <div className="space-y-4">
                  <p className="text-gray-400 mb-6">Escolha o método de importação:</p>
                  
                  <button
                    onClick={() => setImportType('csv')}
                    className="w-full p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-primary-teal transition-smooth cursor-pointer text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary-teal/20 flex items-center justify-center">
                      <i className="ri-file-text-line text-2xl text-primary-teal"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">Importar de CSV</h3>
                      <p className="text-sm text-gray-400">Faça upload de um arquivo CSV com os dados dos artistas</p>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 text-xl"></i>
                  </button>

                  <button
                    onClick={() => setImportType('json')}
                    className="w-full p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-primary-teal transition-smooth cursor-pointer text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary-teal/20 flex items-center justify-center">
                      <i className="ri-code-s-slash-line text-2xl text-primary-teal"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">Importar de JSON</h3>
                      <p className="text-sm text-gray-400">Faça upload de um arquivo JSON com os dados dos artistas</p>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 text-xl"></i>
                  </button>

                  <button
                    onClick={() => setImportType('supabase')}
                    className="w-full p-4 bg-dark-bg border border-dark-border rounded-lg hover:border-primary-teal transition-smooth cursor-pointer text-left flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary-teal/20 flex items-center justify-center">
                      <i className="ri-database-2-line text-2xl text-primary-teal"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">Importar do Supabase</h3>
                      <p className="text-sm text-gray-400">Importar de outra tabela no mesmo banco Supabase</p>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 text-xl"></i>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setImportType(null);
                      setImportError(null);
                      setImportSuccess(null);
                    }}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-smooth cursor-pointer mb-4"
                  >
                    <i className="ri-arrow-left-line"></i>
                    <span>Voltar</span>
                  </button>

                  {importType === 'csv' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo CSV</label>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileImport(file);
                          }}
                          className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        />
                      </div>
                      <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-2">Formato esperado (CSV):</p>
                        <code className="text-xs text-gray-500 block mb-3">
                          nome,contato_email,contato_telefone,status,observacoes_internas
                        </code>
                        <p className="text-xs text-gray-500 mt-2">
                          Nota: O gênero será automaticamente definido como "gospel" para todos os artistas.
                        </p>
                        <button
                          onClick={downloadTemplate}
                          className="text-sm text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer flex items-center gap-2"
                        >
                          <i className="ri-download-line"></i>
                          Baixar template CSV
                        </button>
                      </div>
                    </div>
                  )}

                  {importType === 'json' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo JSON</label>
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileImport(file);
                          }}
                          className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        />
                      </div>
                      <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-2">Formato esperado (JSON):</p>
                        <code className="text-xs text-gray-500 block">
                          {`[\n  {\n    "nome": "Nome do Artista",\n    "contato_email": "email@exemplo.com",\n    "contato_telefone": "(11) 99999-9999",\n    "status": "ativo"\n  }\n]`}
                        </code>
                        <p className="text-xs text-gray-500 mt-2">
                          Nota: O gênero será automaticamente definido como "gospel" para todos os artistas.
                        </p>
                      </div>
                    </div>
                  )}

                  {importType === 'supabase' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Nome da Tabela</label>
                        <input
                          type="text"
                          value={supabaseTableName}
                          onChange={(e) => setSupabaseTableName(e.target.value)}
                          placeholder="Ex: artistas, artists, performers"
                          className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Digite o nome da tabela no Supabase que contém os artistas do site da CEU Music
                        </p>
                      </div>
                      <button
                        onClick={importFromSupabase}
                        disabled={importLoading || !supabaseTableName}
                        className="w-full px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {importLoading ? (
                          <>
                            <i className="ri-loader-4-line animate-spin"></i>
                            Importando...
                          </>
                        ) : (
                          <>
                            <i className="ri-download-line"></i>
                            Importar da Tabela
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {importLoading && (
                    <div className="text-center py-4">
                      <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin mb-2"></i>
                      <p className="text-gray-400">Processando importação...</p>
                    </div>
                  )}

                  {importError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <i className="ri-error-warning-line text-red-400 text-xl"></i>
                        <div className="flex-1">
                          <p className="text-red-400 font-medium mb-1">Erro na importação</p>
                          <p className="text-sm text-red-300">{importError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {importSuccess && (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <i className="ri-checkbox-circle-line text-green-400 text-xl"></i>
                        <div className="flex-1">
                          <p className="text-green-400 font-medium mb-1">Importação concluída!</p>
                          <p className="text-sm text-green-300">{importSuccess}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteConfirm && artistaToDelete && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <i className="ri-alert-line text-2xl text-red-400"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Confirmar Exclusão</h2>
                  <p className="text-sm text-gray-400">Esta ação não pode ser desfeita</p>
                </div>
              </div>
              
              <p className="text-white mb-6">
                Tem certeza que deseja excluir o artista <strong>"{artistaToDelete.nome}"</strong>?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border text-white font-medium rounded-lg hover:bg-dark-hover transition-smooth"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-smooth"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Novo Artista */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Novo Artista</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Nome do Artista</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="Digite o nome do artista"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">E-mail</label>
                  <input
                    type="email"
                    required
                    value={formData.contato_email}
                    onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="artista@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Telefone (opcional)</label>
                  <input
                    type="tel"
                    value={formData.contato_telefone}
                    onChange={(e) => setFormData({ ...formData, contato_telefone: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="em_producao">Em Produção</option>
                    <option value="pausa">Pausa</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Observações Internas (opcional)</label>
                  <textarea
                    value={formData.observacoes_internas}
                    onChange={(e) => setFormData({ ...formData, observacoes_internas: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Observações internas sobre o artista..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Criar Artista
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}