import { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import jsPDF from 'jspdf';

type FilterType = 'todos' | 'contrato' | 'licenca' | 'certificado' | 'outro';

interface Documento {
  id: number;
  nome: string;
  tipo: FilterType;
  descricao: string;
  artista?: string;
  projeto?: string;
  dataUpload: string;
  tamanho: string;
  status: 'ativo' | 'vencido' | 'pendente';
}

export default function Documentos() {
  const [filterType, setFilterType] = useState<FilterType>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [documentos, setDocumentos] = useState<Documento[]>([
    {
      id: 1,
      nome: 'Contrato de Exclusividade - Artista A',
      tipo: 'contrato',
      descricao: 'Contrato de exclusividade por 3 anos',
      artista: 'Artista A',
      dataUpload: '2024-01-15',
      tamanho: '2.4 MB',
      status: 'ativo'
    },
    {
      id: 2,
      nome: 'Licença de Uso - Single Verão',
      tipo: 'licenca',
      descricao: 'Licença para uso comercial',
      projeto: 'Single Verão 2024',
      dataUpload: '2024-01-10',
      tamanho: '1.8 MB',
      status: 'ativo'
    },
    {
      id: 3,
      nome: 'Certificado ISRC - EP Acústico',
      tipo: 'certificado',
      descricao: 'Certificado ISRC para distribuição',
      projeto: 'EP Acústico',
      dataUpload: '2024-01-08',
      tamanho: '456 KB',
      status: 'ativo'
    },
    {
      id: 4,
      nome: 'Contrato de Colaboração - Artista B',
      tipo: 'contrato',
      descricao: 'Contrato temporário de colaboração',
      artista: 'Artista B',
      dataUpload: '2023-12-20',
      tamanho: '3.1 MB',
      status: 'vencido'
    },
    {
      id: 5,
      nome: 'Autorização de Lançamento',
      tipo: 'outro',
      descricao: 'Autorização para lançamento em plataformas',
      projeto: 'Single Colaboração',
      dataUpload: '2024-01-12',
      tamanho: '892 KB',
      status: 'pendente'
    }
  ]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Documento | null>(null);


  const filteredDocumentos = documentos.filter(doc => {
    const matchesType = filterType === 'todos' || doc.tipo === filterType;
    const matchesSearch = doc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.artista && doc.artista.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (doc.projeto && doc.projeto.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-500/20 text-green-400';
      case 'vencido':
        return 'bg-red-500/20 text-red-400';
      case 'pendente':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeIcon = (tipo: FilterType) => {
    switch (tipo) {
      case 'contrato':
        return 'ri-file-paper-2-line';
      case 'licenca':
        return 'ri-file-shield-line';
      case 'certificado':
        return 'ri-award-line';
      case 'outro':
        return 'ri-file-line';
      default:
        return 'ri-file-line';
    }
  };

  const stats = [
    { label: 'Total de Documentos', value: documentos.length, icon: 'ri-file-line', color: 'from-primary-teal to-primary-brown' },
    { label: 'Contratos Ativos', value: documentos.filter(d => d.tipo === 'contrato' && d.status === 'ativo').length, icon: 'ri-file-paper-2-line', color: 'from-primary-brown to-primary-dark' },
    { label: 'Vencidos', value: documentos.filter(d => d.status === 'vencido').length, icon: 'ri-alert-line', color: 'from-red-500 to-red-700' },
    { label: 'Pendentes', value: documentos.filter(d => d.status === 'pendente').length, icon: 'ri-time-line', color: 'from-yellow-500 to-yellow-700' },
  ];

  const handleView = (doc: Documento) => {
    setSelectedDoc(doc);
    setShowViewModal(true);
  };

  const handleDownload = (doc: Documento) => {
    // Criar novo documento PDF
    const pdf = new jsPDF();
    
    // Configurações
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;
    
    // Cores (em RGB)
    const primaryColor = [20, 184, 166]; // teal
    const darkColor = [17, 24, 39]; // dark-gray
    const textColor = [255, 255, 255];
    const grayColor = [156, 163, 175];
    const lightGrayColor = [243, 244, 246];
    
    // Função auxiliar para verificar se precisa de nova página
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };
    
    // Header com gradiente simulado
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, pageWidth, 60, 'F');
    
    // Logo/Título no header
    pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CEU Music Ops', margin, 35);
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255, 0.9);
    pdf.text('Sistema de Gestão de Documentos', margin, 45);
    
    // Data no header (direita)
    pdf.setFontSize(9);
    pdf.text(
      new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      }),
      pageWidth - margin,
      35,
      { align: 'right' }
    );
    
    yPosition = 75;
    
    // Card principal com sombra simulada
    const cardY = yPosition;
    const cardHeight = 120;
    
    // Sombra do card
    pdf.setFillColor(0, 0, 0, 0.05);
    pdf.roundedRect(margin + 2, cardY + 2, contentWidth, cardHeight, 3, 3, 'F');
    
    // Card principal
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(margin, cardY, contentWidth, cardHeight, 3, 3, 'F');
    
    // Barra lateral colorida
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.roundedRect(margin, cardY, 5, cardHeight, 0, 0, 'F');
    
    yPosition = cardY + 20;
    
    // Título do documento
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Detalhes do Documento', margin + 10, yPosition);
    
    yPosition += 15;
    
    // Nome do documento (destaque)
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 30, 30);
    pdf.text(doc.nome, margin + 10, yPosition, { maxWidth: contentWidth - 20 });
    
    yPosition += 20;
    
    // Seção de informações principais
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Função auxiliar para adicionar linha de informação melhorada
    const addInfoLine = (label: string, value: string, isBold = false, icon?: string) => {
      checkNewPage(12);
      
      // Background alternado para linhas
      const lineIndex = Math.floor((yPosition - cardY - 50) / 12);
      if (lineIndex % 2 === 0) {
        pdf.setFillColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
        pdf.roundedRect(margin + 10, yPosition - 6, contentWidth - 20, 10, 2, 2, 'F');
      }
      
      // Label
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(75, 85, 99); // gray-600
      pdf.setFontSize(9);
      const labelText = icon ? `${icon} ${label}` : label;
      pdf.text(labelText + ':', margin + 15, yPosition);
      
      // Value
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setTextColor(17, 24, 39); // dark-gray
      pdf.setFontSize(10);
      const labelWidth = pdf.getTextWidth(labelText + ': ');
      const maxValueWidth = contentWidth - 35 - labelWidth;
      pdf.text(value, margin + 15 + labelWidth, yPosition, { maxWidth: maxValueWidth });
      
      yPosition += 12;
    };
    
    // Adicionar informações organizadas
    addInfoLine('Descrição', doc.descricao);
    
    // Tipo e Status na mesma linha
    const tipoText = doc.tipo.charAt(0).toUpperCase() + doc.tipo.slice(1);
    addInfoLine('Tipo', tipoText);
    
    // Status com badge colorido
    const statusText = doc.status === 'ativo' ? 'Ativo' : doc.status === 'vencido' ? 'Vencido' : 'Pendente';
    checkNewPage(12);
    
    const lineIndex = Math.floor((yPosition - cardY - 50) / 12);
    if (lineIndex % 2 === 0) {
      pdf.setFillColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
      pdf.roundedRect(margin + 10, yPosition - 6, contentWidth - 20, 10, 2, 2, 'F');
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(75, 85, 99);
    pdf.setFontSize(9);
    pdf.text('Status:', margin + 15, yPosition);
    
    // Badge de status colorido
    let statusColor: number[];
    if (doc.status === 'ativo') {
      statusColor = [34, 197, 94]; // verde
    } else if (doc.status === 'vencido') {
      statusColor = [239, 68, 68]; // vermelho
    } else {
      statusColor = [234, 179, 8]; // amarelo
    }
    
    const statusX = margin + 15 + pdf.getTextWidth('Status: ') + 3;
    pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.roundedRect(statusX, yPosition - 5, 35, 8, 4, 4, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(statusText, statusX + 17.5, yPosition, { align: 'center' });
    
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(10);
    yPosition += 12;
    
    // Informações adicionais
    addInfoLine('Data de Upload', new Date(doc.dataUpload).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }));
    
    addInfoLine('Tamanho do Arquivo', doc.tamanho);
    
    if (doc.artista) {
      addInfoLine('Artista Relacionado', doc.artista, true);
    }
    
    if (doc.projeto) {
      addInfoLine('Projeto Relacionado', doc.projeto, true);
    }
    
    yPosition += 15;
    
    // Linha separadora decorativa
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setLineWidth(2);
    pdf.line(margin + 10, yPosition, margin + 50, yPosition);
    pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.setLineWidth(0.5);
    pdf.line(margin + 50, yPosition, pageWidth - margin - 10, yPosition);
    
    yPosition += 20;
    
    // Seção de informações do sistema
    checkNewPage(25);
    
    pdf.setFillColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
    pdf.roundedRect(margin, yPosition, contentWidth, 20, 3, 3, 'F');
    
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128); // gray-500
    pdf.setFont('helvetica', 'italic');
    pdf.text(
      `Documento gerado automaticamente pelo sistema CEU Music Ops`,
      margin + 10,
      yPosition + 8
    );
    pdf.text(
      `Gerado em ${new Date().toLocaleString('pt-BR')}`,
      margin + 10,
      yPosition + 15
    );
    
    // Rodapé em todas as páginas
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    // Nome do arquivo (sanitizado)
    const fileName = doc.nome
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 50) + '.pdf';
    
    // Salvar PDF
    pdf.save(fileName);
  };

  const handleDeleteClick = (doc: Documento) => {
    setDocToDelete(doc);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (docToDelete) {
      setDocumentos(documentos.filter(d => d.id !== docToDelete.id));
      setShowDeleteConfirm(false);
      setDocToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDocToDelete(null);
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Documentos</h1>
            <p className="text-gray-400">Gerencie contratos, licenças e certificados</p>
          </div>
          <button className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2 whitespace-nowrap">
            <i className="ri-upload-line text-xl"></i>
            Upload Documento
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-primary-teal transition-smooth">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <i className={`${stat.icon} text-2xl text-white`}></i>
                </div>
                <span className="text-2xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['todos', 'contrato', 'licenca', 'certificado', 'outro'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth cursor-pointer ${
                    filterType === type
                      ? 'bg-gradient-primary text-white'
                      : 'bg-dark-bg text-gray-400 hover:bg-dark-hover hover:text-white border border-dark-border'
                  }`}
                >
                  {type === 'todos' ? 'Todos' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-bg border-b border-dark-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Documento</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Relacionado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tamanho</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {filteredDocumentos.length > 0 ? (
                  filteredDocumentos.map((doc) => (
                    <tr key={doc.id} className="hover:bg-dark-hover transition-smooth">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-white">{doc.nome}</p>
                          <p className="text-xs text-gray-500 mt-1">{doc.descricao}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <i className={`${getTypeIcon(doc.tipo)} text-primary-teal`}></i>
                          <span className="text-sm text-gray-300 capitalize">{doc.tipo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {doc.artista && (
                            <div className="flex items-center gap-1">
                              <i className="ri-user-star-line text-xs"></i>
                              <span>{doc.artista}</span>
                            </div>
                          )}
                          {doc.projeto && (
                            <div className="flex items-center gap-1">
                              <i className="ri-music-2-line text-xs"></i>
                              <span>{doc.projeto}</span>
                            </div>
                          )}
                          {!doc.artista && !doc.projeto && (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(doc.dataUpload).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {doc.tamanho}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                          {doc.status === 'ativo' ? 'Ativo' : doc.status === 'vencido' ? 'Vencido' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleView(doc)}
                            className="text-primary-teal hover:text-primary-brown transition-smooth cursor-pointer" 
                            title="Visualizar"
                          >
                            <i className="ri-eye-line text-lg"></i>
                          </button>
                          <button 
                            onClick={() => handleDownload(doc)}
                            className="text-gray-400 hover:text-white transition-smooth cursor-pointer" 
                            title="Download"
                          >
                            <i className="ri-download-line text-lg"></i>
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(doc)}
                            className="text-gray-400 hover:text-red-400 transition-smooth cursor-pointer" 
                            title="Excluir"
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <i className="ri-file-line text-4xl mb-2"></i>
                        <p className="text-sm">Nenhum documento encontrado</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Visualização */}
        {showViewModal && selectedDoc && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Detalhes do Documento</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-white transition-smooth"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Nome do Documento</label>
                  <p className="text-white font-medium">{selectedDoc.nome}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Descrição</label>
                  <p className="text-white">{selectedDoc.descricao}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Tipo</label>
                    <p className="text-white capitalize">{selectedDoc.tipo}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Status</label>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDoc.status)}`}>
                      {selectedDoc.status === 'ativo' ? 'Ativo' : selectedDoc.status === 'vencido' ? 'Vencido' : 'Pendente'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Data de Upload</label>
                    <p className="text-white">{new Date(selectedDoc.dataUpload).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Tamanho</label>
                    <p className="text-white">{selectedDoc.tamanho}</p>
                  </div>
                </div>
                
                {(selectedDoc.artista || selectedDoc.projeto) && (
                  <div>
                    <label className="text-sm text-gray-400">Relacionado</label>
                    <div className="text-white">
                      {selectedDoc.artista && (
                        <div className="flex items-center gap-2">
                          <i className="ri-user-star-line text-primary-teal"></i>
                          <span>Artista: {selectedDoc.artista}</span>
                        </div>
                      )}
                      {selectedDoc.projeto && (
                        <div className="flex items-center gap-2">
                          <i className="ri-music-2-line text-primary-teal"></i>
                          <span>Projeto: {selectedDoc.projeto}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleDownload(selectedDoc)}
                  className="flex-1 px-4 py-2 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-smooth"
                >
                  <i className="ri-download-line mr-2"></i>
                  Baixar Documento
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-dark-bg border border-dark-border text-white font-medium rounded-lg hover:bg-dark-hover transition-smooth"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteConfirm && docToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                Tem certeza que deseja excluir o documento <strong>"{docToDelete.nome}"</strong>?
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
      </div>
    </MainLayout>
  );
}

