import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type FilterTipo = 'todos' | 'contrato' | 'termo' | 'aditivo' | 'outro';
type FilterStatus = 'todos' | 'ativo' | 'vencido' | 'cancelado';
type ViewMode = 'tabela' | 'cards' | 'grid';
type SortBy = 'data' | 'titulo' | 'tipo' | 'artista' | 'projeto';
type GroupBy = 'nenhum' | 'tipo' | 'artista' | 'projeto' | 'status';

export default function Documentos() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<FilterTipo>('todos');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [viewMode, setViewMode] = useState<ViewMode>('tabela');
  const [sortBy, setSortBy] = useState<SortBy>('data');
  const [groupBy, setGroupBy] = useState<GroupBy>('nenhum');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAnexosModal, setShowAnexosModal] = useState(false);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [artistas, setArtistas] = useState<any[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocumento, setSelectedDocumento] = useState<any>(null);
  const [anexos, setAnexos] = useState<any[]>([]);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: '',
    artista_id: '',
    projeto_id: '',
    data_inicio: '',
    data_fim: '',
    valor: '',
    descricao: '',
    status: 'ativo',
    arquivo: null as File | null,
    arquivos: [] as File[],
  });

  useEffect(() => {
    loadDocumentos();
    loadArtistas();
    loadProjetos();
  }, []);

  const loadDocumentos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documentos')
        .select(`
          *,
          artista:artista_id(id, nome),
          projeto:projeto_id(id, nome),
          anexos:documentos_anexos(id, arquivo_url, arquivo_nome, arquivo_key, arquivo_tipo, descricao, ordem)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setDocumentos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      setDocumentos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnexos = async (documentoId: string) => {
    try {
      const { data, error } = await supabase
        .from('documentos_anexos')
        .select('*')
        .eq('documento_id', documentoId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      if (data) setAnexos(data);
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
      setAnexos([]);
    }
  };

  const loadArtistas = async () => {
    try {
      const { data, error } = await supabase
        .from('artistas')
        .select('id, nome')
        .order('nome', { ascending: true });

      if (error) throw error;
      if (data) setArtistas(data);
    } catch (error) {
      console.error('Erro ao carregar artistas:', error);
      setArtistas([]);
    }
  };

  const loadProjetos = async () => {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .select('id, nome')
        .order('nome', { ascending: true });

      if (error) throw error;
      if (data) setProjetos(data);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      setProjetos([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validar campos obrigatórios
      if (!formData.titulo.trim()) {
        alert('Por favor, preencha o título.');
        return;
      }
      if (!formData.tipo) {
        alert('Por favor, selecione o tipo de documento.');
        return;
      }
      if (!formData.arquivo && formData.arquivos.length === 0) {
        alert('Por favor, selecione pelo menos um arquivo para upload.');
        return;
      }

      setUploading(true);

      // Upload do arquivo principal para Cloudflare R2
      let result: any = null;
      if (formData.arquivo) {
        const { storageService, R2_BUCKETS } = await import('../../services/storage');
        result = await storageService.upload(formData.arquivo, {
          bucket: R2_BUCKETS.DOCUMENTOS,
          folder: 'documentos',
          makePublic: false, // Usar signed URLs (mais seguro)
        });
      }

      // Preparar dados do documento
      // Validar que o tipo está nos valores permitidos
      const tiposPermitidos = ['contrato', 'termo', 'aditivo', 'outro'];
      const tipoValido = tiposPermitidos.includes(formData.tipo) ? formData.tipo : 'outro';
      
      const documentoData: any = {
        nome: formData.titulo.trim(), // Campo obrigatório no banco
        titulo: formData.titulo.trim(),
        tipo: tipoValido,
        categoria: tipoValido, // Campo obrigatório no banco (mesmo valor de tipo, validado)
        status: formData.status || 'ativo',
      };

      // Adicionar arquivo principal se houver
      if (result) {
        documentoData.arquivo_url = result.url;
        documentoData.arquivo_nome = formData.arquivo?.name;
        documentoData.arquivo_key = result.key;
      }

      // Adicionar associações e tipo de associação
      if (formData.artista_id && formData.projeto_id) {
        documentoData.artista_id = formData.artista_id;
        documentoData.projeto_id = formData.projeto_id;
        documentoData.tipo_associacao = 'projeto'; // Priorizar projeto quando tem ambos
      } else if (formData.artista_id) {
        documentoData.artista_id = formData.artista_id;
        documentoData.tipo_associacao = 'artista';
      } else if (formData.projeto_id) {
        documentoData.projeto_id = formData.projeto_id;
        documentoData.tipo_associacao = 'projeto';
      } else {
        // Sem associação - não enviar tipo_associacao ou enviar null
        documentoData.tipo_associacao = null;
      }
      if (formData.data_inicio) documentoData.data_inicio = formData.data_inicio;
      if (formData.data_fim) documentoData.data_fim = formData.data_fim;
      if (formData.valor && formData.valor.trim()) {
        const valorNum = parseFloat(formData.valor.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(valorNum) && valorNum > 0) {
          documentoData.valor = valorNum;
        }
      }
      if (formData.descricao && formData.descricao.trim()) {
        documentoData.descricao = formData.descricao.trim();
      }
      if (formData.identificacao_partes && formData.identificacao_partes.trim()) {
        documentoData.identificacao_partes = formData.identificacao_partes.trim();
      }
      if (formData.objeto_escopo && formData.objeto_escopo.trim()) {
        documentoData.objeto_escopo = formData.objeto_escopo.trim();
      }
      if (formData.valores_pagamento && formData.valores_pagamento.trim()) {
        documentoData.valores_pagamento = formData.valores_pagamento.trim();
      }
      if (formData.vigencia_prazos && formData.vigencia_prazos.trim()) {
        documentoData.vigencia_prazos = formData.vigencia_prazos.trim();
      }
      if (formData.termos_legais && formData.termos_legais.trim()) {
        documentoData.termos_legais = formData.termos_legais.trim();
      }
      if (formData.assinatura && formData.assinatura.trim()) {
        documentoData.assinatura = formData.assinatura.trim();
      }

      console.log('Dados a serem inseridos:', documentoData);

      const { error, data } = await supabase
        .from('documentos')
        .insert([documentoData])
        .select();

      if (error) {
        console.error('Erro detalhado:', error);
        console.error('Código do erro:', error.code);
        console.error('Mensagem:', error.message);
        throw error;
      }

      console.log('Documento criado com sucesso:', data);

      // Upload de anexos adicionais para Cloudflare R2
      // Todos os anexos são salvos no bucket R2_BUCKETS.DOCUMENTOS na pasta 'documentos/anexos'
      if (formData.arquivos.length > 0 && data && data[0]) {
        const { storageService, R2_BUCKETS } = await import('../../services/storage');
        for (let i = 0; i < formData.arquivos.length; i++) {
          const file = formData.arquivos[i];
          try {
            const anexoResult = await storageService.upload(file, {
              bucket: R2_BUCKETS.DOCUMENTOS,
              folder: 'documentos/anexos',
              makePublic: false, // Usar signed URLs (mais seguro)
              provider: 'r2', // Garantir que usa R2 explicitamente
            });

            await supabase
              .from('documentos_anexos')
              .insert([{
                documento_id: data[0].id,
                arquivo_url: anexoResult.url,
                arquivo_nome: file.name,
                arquivo_key: anexoResult.key,
                arquivo_tipo: file.type,
                arquivo_tamanho: file.size,
                ordem: i,
              }]);
          } catch (error: any) {
            console.error(`Erro ao fazer upload do anexo ${file.name}:`, error);
          }
        }
      }

      await loadDocumentos();
      
      setShowModal(false);
      resetForm();
      alert('Documento cadastrado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar documento:', error);
      alert(`Erro ao criar documento: ${error.message || 'Verifique o console para mais detalhes.'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleImprimir = (documento: any) => {
    setSelectedDocumento(documento);
    setShowPrintModal(true);
  };

  const handleDownloadDocumentoPDF = async (documento: any) => {
    try {
      console.log('Gerando PDF para documento:', documento);
      
      // Verificar se o documento tem algum conteúdo
      const hasContent = documento.identificacao_partes || 
                        documento.objeto_escopo || 
                        documento.valores_pagamento || 
                        documento.vigencia_prazos || 
                        documento.termos_legais || 
                        documento.assinatura ||
                        documento.descricao;
      
      console.log('Documento tem conteúdo?', hasContent);
      
      if (!hasContent) {
        alert('Este documento não possui campos preenchidos para gerar o PDF. Preencha pelo menos um dos campos do formulário.');
        return;
      }

      // Importar html2pdf.js dinamicamente
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      // Função helper para escapar HTML
      const escapeHtml = (text: string) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };

      // Criar elemento HTML temporário para o documento
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto;">
          <div style="text-align: center; border-bottom: 3px solid #333; padding-bottom: 15px; margin-bottom: 30px;">
            <h1 style="font-size: 28px; margin: 0; color: #333;">CEU MUSIC</h1>
            <p style="font-size: 16px; font-weight: bold; margin: 5px 0;">${escapeHtml(getTipoLabel(documento.tipo).toUpperCase())}</p>
            <p style="font-size: 14px; color: #666; margin: 5px 0;">${escapeHtml(documento.titulo || '')}</p>
          </div>

          ${documento.identificacao_partes ? `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #555; margin-top: 25px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #ddd; font-size: 16px;">1. IDENTIFICAÇÃO DAS PARTES (QUEM?)</h3>
            <p style="margin: 8px 0; text-align: justify; white-space: pre-wrap;">${escapeHtml(documento.identificacao_partes)}</p>
          </div>
          ` : ''}

          ${documento.objeto_escopo ? `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #555; margin-top: 25px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #ddd; font-size: 16px;">2. OBJETO E ESCOPO (O QUÊ?)</h3>
            <p style="margin: 8px 0; text-align: justify; white-space: pre-wrap;">${escapeHtml(documento.objeto_escopo)}</p>
          </div>
          ` : ''}

          ${documento.valores_pagamento ? `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #555; margin-top: 25px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #ddd; font-size: 16px;">3. VALORES E PAGAMENTO (QUANTO E COMO?)</h3>
            <p style="margin: 8px 0; text-align: justify; white-space: pre-wrap;">${escapeHtml(documento.valores_pagamento)}</p>
            ${documento.valor ? `<p style="font-size: 18px; font-weight: bold; color: #14b8a6; margin-top: 10px;">Valor Total: ${escapeHtml(formatCurrency(documento.valor))}</p>` : ''}
          </div>
          ` : ''}

          ${documento.vigencia_prazos ? `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #555; margin-top: 25px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #ddd; font-size: 16px;">4. VIGÊNCIA E PRAZOS (QUANDO?)</h3>
            <p style="margin: 8px 0; text-align: justify; white-space: pre-wrap;">${escapeHtml(documento.vigencia_prazos)}</p>
            ${documento.data_inicio || documento.data_fim ? `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
              ${documento.data_inicio ? `<p style="margin: 8px 0;"><strong>Data de Início:</strong> ${escapeHtml(formatDate(documento.data_inicio))}</p>` : ''}
              ${documento.data_fim ? `<p style="margin: 8px 0;"><strong>Data de Fim:</strong> ${escapeHtml(formatDate(documento.data_fim))}</p>` : ''}
            </div>
            ` : ''}
          </div>
          ` : ''}

          <div style="margin-bottom: 25px;">
            <h3 style="color: #555; margin-top: 25px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #ddd; font-size: 16px;">INFORMAÇÕES ADICIONAIS</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
              ${documento.artista?.nome ? `<p style="margin: 8px 0;"><strong>Artista:</strong> ${escapeHtml(documento.artista.nome)}</p>` : ''}
              ${documento.projeto?.nome ? `<p style="margin: 8px 0;"><strong>Projeto:</strong> ${escapeHtml(documento.projeto.nome)}</p>` : ''}
            </div>
            ${documento.descricao ? `
            <div style="margin-top: 10px;">
              <p style="margin: 8px 0;"><strong>Descrição:</strong></p>
              <p style="margin: 8px 0; text-align: justify; white-space: pre-wrap;">${escapeHtml(documento.descricao)}</p>
            </div>
            ` : ''}
          </div>

          ${documento.termos_legais ? `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #555; margin-top: 25px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #ddd; font-size: 16px;">5. TERMOS LEGAIS E CLÁUSULAS</h3>
            <p style="margin: 8px 0; text-align: justify; white-space: pre-wrap;">${escapeHtml(documento.termos_legais)}</p>
          </div>
          ` : ''}

          ${documento.assinatura ? `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #555; margin-top: 25px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #ddd; font-size: 16px;">6. ASSINATURA E CONCORDÂNCIA</h3>
            <p style="margin: 8px 0; text-align: justify; white-space: pre-wrap;">${escapeHtml(documento.assinatura)}</p>
          </div>
          ` : ''}

          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px;">
              <div>
                <p style="font-weight: bold; margin-bottom: 5px;">CEU MUSIC</p>
                <p style="font-size: 14px; color: #666;">Gravadora</p>
                <div style="border-top: 1px solid #333; padding-top: 10px; margin-top: 60px;">
                  <p style="font-size: 12px; color: #999;">Assinatura</p>
                </div>
              </div>
              <div style="text-align: right;">
                <p style="font-weight: bold; margin-bottom: 5px;">${escapeHtml(documento.artista?.nome || 'Artista')}</p>
                <p style="font-size: 14px; color: #666;">Contratado</p>
                <div style="border-top: 1px solid #333; padding-top: 10px; margin-top: 60px;">
                  <p style="font-size: 12px; color: #999;">Assinatura</p>
                </div>
              </div>
            </div>
            <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
              <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>
        </div>
      `;

      // Adicionar elemento ao DOM para renderização
      document.body.appendChild(element);
      
      console.log('Elemento HTML criado e adicionado ao DOM');
      console.log('Conteúdo preview:', element.innerHTML.substring(0, 300));

      // Configurações do PDF
      const opt = {
        margin: [15, 15, 15, 15],
        filename: `${getTipoLabel(documento.tipo)}_${(documento.titulo || 'documento').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      console.log('Iniciando geração do PDF com html2pdf...');
      
      // Gerar PDF como blob
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      
      console.log('PDF gerado como blob:', pdfBlob);

      // Fazer upload do PDF para o Cloudflare R2
      const { uploadToR2, R2_BUCKETS } = await import('../../lib/r2');
      
      // Criar um File object a partir do blob
      const pdfFile = new File(
        [pdfBlob], 
        opt.filename,
        { type: 'application/pdf' }
      );
      
      console.log('Fazendo upload do PDF para o Cloudflare R2...');
      
      const uploadResult = await uploadToR2(pdfFile, {
        bucket: R2_BUCKETS.DOCUMENTOS,
        folder: 'documentos',
        contentType: 'application/pdf'
      });
      
      console.log('Upload concluído:', uploadResult);
      
      // Atualizar o documento no banco com a URL do PDF no R2
      const { data: updateData, error: updateError } = await supabase
        .from('documentos')
        .update({ 
          arquivo_url: uploadResult.url,
          arquivo_key: uploadResult.key,
          arquivo_nome: opt.filename
        })
        .eq('id', documento.id)
        .select();
      
      if (updateError) {
        console.error('Erro ao atualizar documento:', updateError);
      } else {
        console.log('Documento atualizado com URL do R2:', updateData);
      }
      
      // Baixar o PDF gerado
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = opt.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      console.log('PDF salvo no R2 e download iniciado!');

      // Remover elemento temporário após um delay
      setTimeout(() => {
        if (document.body.contains(element)) {
          document.body.removeChild(element);
        }
      }, 1000);
      
      alert('✅ PDF gerado e salvo no Cloudflare R2 com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      alert(`Erro ao gerar PDF do contrato: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleDownload = async (documento: any) => {
    // Baixar o arquivo anexado do R2
    await handleDownloadArquivoAnexado(documento);
  };

  const handleDownloadArquivoAnexado = async (documento: any) => {
    // Baixar o arquivo anexado no formulário (se houver)
    try {
      const { getSignedUrlR2, R2_BUCKETS, findKeyByFileName } = await import('../../lib/r2');
      
      // Determinar o key do arquivo
      let arquivoKey: string | null = documento.arquivo_key || null;
      
      // Se não temos o key salvo, tentar encontrar no bucket
      if (!arquivoKey && documento.arquivo_nome) {
        try {
          console.log('Buscando key do arquivo no bucket...');
          // Tentar encontrar o arquivo no bucket pelo nome
          arquivoKey = await findKeyByFileName(
            R2_BUCKETS.DOCUMENTOS,
            documento.arquivo_nome,
            'documentos'
          );
          
          if (arquivoKey) {
            console.log('Key encontrado:', arquivoKey);
            // Salvar o key encontrado no banco para próximas vezes
            try {
              await supabase
                .from('documentos')
                .update({ arquivo_key: arquivoKey })
                .eq('id', documento.id);
            } catch (e) {
              console.warn('Erro ao salvar key no banco:', e);
            }
          }
        } catch (error) {
          console.warn('Erro ao buscar key no bucket:', error);
        }
      }

      // Se ainda não temos key, tentar extrair da URL
      if (!arquivoKey && documento.arquivo_url) {
        try {
          const url = new URL(documento.arquivo_url);
          const pathParts = url.pathname.split('/').filter(p => p);
          
          // Para URLs assinadas do R2, o formato pode variar
          // Tentar extrair do pathname
          if (pathParts.length >= 2) {
            // Pular o bucket e pegar o resto
            const bucketIndex = pathParts.findIndex(p => 
              p === R2_BUCKETS.DOCUMENTOS || 
              p === 'documentos' ||
              p.includes('documentos')
            );
            
            if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
              arquivoKey = pathParts.slice(bucketIndex + 1).join('/');
            } else {
              // Se não encontrou o bucket, tentar pegar tudo depois do primeiro elemento
              arquivoKey = pathParts.slice(1).join('/');
            }
          }
        } catch (e) {
          console.warn('Erro ao extrair key da URL:', e);
        }
      }

      // Gerar nova URL assinada
      let downloadUrl: string | null = null;
      
      if (arquivoKey) {
        try {
          console.log('Gerando URL assinada para key:', arquivoKey);
          downloadUrl = await getSignedUrlR2(
            R2_BUCKETS.DOCUMENTOS,
            arquivoKey,
            86400 // URL válida por 24 horas (1 dia)
          );
          console.log('Nova URL assinada gerada com sucesso');
        } catch (error: any) {
          console.error('Erro ao gerar URL assinada:', error);
          
          // Se o erro for NoSuchKey, tentar buscar no bucket novamente
          if (error.message?.includes('NoSuchKey') || error.message?.includes('does not exist')) {
            if (documento.arquivo_nome) {
              console.log('Key não encontrado, tentando buscar no bucket...');
              try {
                arquivoKey = await findKeyByFileName(
                  R2_BUCKETS.DOCUMENTOS,
                  documento.arquivo_nome,
                  'documentos'
                );
                
                if (arquivoKey) {
            downloadUrl = await getSignedUrlR2(
              R2_BUCKETS.DOCUMENTOS,
              arquivoKey,
              86400 // URL válida por 24 horas
            );
                  // Salvar o key correto
                  await supabase
                    .from('documentos')
                    .update({ arquivo_key: arquivoKey })
                    .eq('id', documento.id);
                }
              } catch (retryError) {
                console.error('Erro ao buscar key no bucket:', retryError);
              }
            }
          }
          
          // Se ainda não temos URL, usar a original como último recurso
          if (!downloadUrl && documento.arquivo_url) {
            downloadUrl = documento.arquivo_url;
            console.warn('Usando URL original como fallback (pode estar expirada)');
          }
        }
      } else {
        // Se não temos key, usar a URL original (pode estar expirada)
        downloadUrl = documento.arquivo_url;
        console.warn('Usando URL original (pode estar expirada)');
      }

      if (!downloadUrl) {
        alert('Não foi possível gerar URL para download. O arquivo pode não existir mais no storage.');
        return;
      }

      // Fazer download direto usando elemento <a>
      console.log('Iniciando download de:', downloadUrl);
      
      // Criar link temporário para download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Tentar definir nome do arquivo se disponível
      if (documento.arquivo_nome) {
        link.download = documento.arquivo_nome;
      } else {
        link.download = `documento_${documento.id}_${Date.now()}`;
      }
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Download iniciado com sucesso');
      
    } catch (error: any) {
      console.error('Erro ao baixar arquivo:', error);
      alert(`Erro ao baixar arquivo: ${error.message || 'Erro desconhecido. Verifique se o arquivo existe e se as credenciais do R2 estão configuradas.'}`);
    }
  };


  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert('Apenas administradores podem excluir documentos.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este documento? Todos os arquivos associados também serão excluídos do Cloudflare R2.')) {
      return;
    }

    try {
      // Buscar o documento para obter informações dos arquivos
      const { data: documento, error: fetchError } = await supabase
        .from('documentos')
        .select('arquivo_key, anexos:documentos_anexos(id, arquivo_key)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Excluir arquivo principal do R2 se existir
      if (documento?.arquivo_key) {
        try {
          const { deleteFromR2, R2_BUCKETS } = await import('../../lib/r2');
          await deleteFromR2(R2_BUCKETS.DOCUMENTOS, documento.arquivo_key);
          console.log('Arquivo principal excluído do R2:', documento.arquivo_key);
        } catch (r2Error: any) {
          console.warn('Erro ao excluir arquivo principal do R2 (continuando...):', r2Error);
          // Continuar mesmo se houver erro ao excluir do R2
        }
      }

      // Excluir todos os anexos do R2
      if (documento?.anexos && documento.anexos.length > 0) {
        const { deleteFromR2, R2_BUCKETS } = await import('../../lib/r2');
        for (const anexo of documento.anexos) {
          if (anexo.arquivo_key) {
            try {
              await deleteFromR2(R2_BUCKETS.DOCUMENTOS, anexo.arquivo_key);
              console.log('Anexo excluído do R2:', anexo.arquivo_key);
            } catch (r2Error: any) {
              console.warn(`Erro ao excluir anexo ${anexo.id} do R2 (continuando...):`, r2Error);
              // Continuar mesmo se houver erro
            }
          }
        }
      }

      // Excluir o documento do banco (os anexos serão excluídos automaticamente por CASCADE)
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadDocumentos();
      alert('Documento e arquivos excluídos com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir documento:', error);
      alert(`Erro ao excluir documento: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      tipo: '',
      artista_id: '',
      projeto_id: '',
      data_inicio: '',
      data_fim: '',
      valor: '',
      descricao: '',
      status: 'ativo',
      arquivo: null,
      arquivos: [],
      identificacao_partes: '',
      objeto_escopo: '',
      valores_pagamento: '',
      vigencia_prazos: '',
      termos_legais: '',
      assinatura: '',
    });
  };

  const handleAddAnexo = async (documentoId: string, file: File) => {
    try {
      setUploadingAnexo(true);
      
      // Upload do arquivo para Cloudflare R2
      // O storageService por padrão usa R2 (configurado em services/storage.ts)
      const { storageService, R2_BUCKETS } = await import('../../services/storage');
      const result = await storageService.upload(file, {
        bucket: R2_BUCKETS.DOCUMENTOS,
        folder: 'documentos/anexos',
        makePublic: false, // Usar signed URLs (mais seguro)
        provider: 'r2', // Garantir que usa R2 explicitamente
      });

      // Obter número de anexos existentes para definir ordem
      const { count } = await supabase
        .from('documentos_anexos')
        .select('*', { count: 'exact', head: true })
        .eq('documento_id', documentoId);

      // Inserir anexo
      const { error } = await supabase
        .from('documentos_anexos')
        .insert([{
          documento_id: documentoId,
          arquivo_url: result.url,
          arquivo_nome: file.name,
          arquivo_key: result.key,
          arquivo_tipo: file.type,
          arquivo_tamanho: file.size,
          ordem: (count || 0),
        }]);

      if (error) throw error;

      await loadAnexos(documentoId);
      await loadDocumentos();
      alert('Anexo adicionado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao adicionar anexo:', error);
      alert(`Erro ao adicionar anexo: ${error.message}`);
    } finally {
      setUploadingAnexo(false);
    }
  };

  const handleDeleteAnexo = async (anexoId: string, documentoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este anexo? O arquivo também será excluído do Cloudflare R2.')) return;

    try {
      // Buscar o anexo para obter o arquivo_key
      const { data: anexo, error: fetchError } = await supabase
        .from('documentos_anexos')
        .select('arquivo_key')
        .eq('id', anexoId)
        .single();

      if (fetchError) throw fetchError;

      // Excluir arquivo do R2 se existir
      if (anexo?.arquivo_key) {
        try {
          const { deleteFromR2, R2_BUCKETS } = await import('../../lib/r2');
          await deleteFromR2(R2_BUCKETS.DOCUMENTOS, anexo.arquivo_key);
          console.log('Anexo excluído do R2:', anexo.arquivo_key);
        } catch (r2Error: any) {
          console.warn('Erro ao excluir anexo do R2 (continuando...):', r2Error);
          // Continuar mesmo se houver erro ao excluir do R2
        }
      }

      // Excluir o anexo do banco
      const { error } = await supabase
        .from('documentos_anexos')
        .delete()
        .eq('id', anexoId);

      if (error) throw error;

      await loadAnexos(documentoId);
      await loadDocumentos();
      alert('Anexo e arquivo excluídos com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir anexo:', error);
      alert(`Erro ao excluir anexo: ${error.message}`);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      contrato: 'Contrato',
      termo: 'Termo',
      aditivo: 'Aditivo',
      outro: 'Outro',
    };
    return tipos[tipo] || tipo;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      ativo: 'bg-green-500/20 text-green-400',
      vencido: 'bg-red-500/20 text-red-400',
      cancelado: 'bg-gray-500/20 text-gray-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const filteredDocumentos = documentos.filter((doc) => {
    const matchesSearch = 
      doc.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.artista?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.projeto?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipo === 'todos' || doc.tipo === filterTipo;
    const matchesStatus = filterStatus === 'todos' || doc.status === filterStatus;

    return matchesSearch && matchesTipo && matchesStatus;
  });

  // Função de ordenação
  const sortedDocumentos = [...filteredDocumentos].sort((a, b) => {
    switch (sortBy) {
      case 'titulo':
        return (a.titulo || '').localeCompare(b.titulo || '');
      case 'tipo':
        return (a.tipo || '').localeCompare(b.tipo || '');
      case 'artista':
        return (a.artista?.nome || '').localeCompare(b.artista?.nome || '');
      case 'projeto':
        return (a.projeto?.nome || '').localeCompare(b.projeto?.nome || '');
      case 'data':
      default:
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
    }
  });

  // Função de agrupamento
  const groupedDocumentos = (() => {
    if (groupBy === 'nenhum') {
      return { 'Todos': sortedDocumentos };
    }

    const groups: { [key: string]: any[] } = {};
    sortedDocumentos.forEach(doc => {
      let key = 'Sem agrupamento';
      
      switch (groupBy) {
        case 'tipo':
          key = getTipoLabel(doc.tipo) || 'Sem tipo';
          break;
        case 'artista':
          key = doc.artista?.nome || 'Sem artista';
          break;
        case 'projeto':
          key = doc.projeto?.nome || 'Sem projeto';
          break;
        case 'status':
          key = doc.status?.charAt(0).toUpperCase() + doc.status?.slice(1) || 'Sem status';
          break;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(doc);
    });

    return groups;
  })();

  const tipos = ['contrato', 'termo', 'aditivo', 'outro'];

  const handleVisualizar = (documento: any) => {
    setSelectedDocumento(documento);
    setShowViewModal(true);
    if (documento.id) {
      loadAnexos(documento.id);
    }
  };


  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Documentos</h1>
            <p className="text-gray-400">Gerencie contratos e documentos da gravadora</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center gap-2"
          >
            <i className="ri-file-add-line text-lg"></i>
            <span>Anexar Documento</span>
          </button>
        </div>

        {/* Controles de Organização */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Modo de Visualização */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-400">Visualização:</label>
              <div className="flex gap-1 bg-dark-bg rounded-lg p-1">
                <button
                  onClick={() => setViewMode('tabela')}
                  className={`p-2 rounded transition-smooth ${viewMode === 'tabela' ? 'bg-gradient-primary text-white' : 'text-gray-400 hover:text-white'}`}
                  title="Tabela"
                >
                  <i className="ri-table-line"></i>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded transition-smooth ${viewMode === 'cards' ? 'bg-gradient-primary text-white' : 'text-gray-400 hover:text-white'}`}
                  title="Cards"
                >
                  <i className="ri-file-list-3-line"></i>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-smooth ${viewMode === 'grid' ? 'bg-gradient-primary text-white' : 'text-gray-400 hover:text-white'}`}
                  title="Grid"
                >
                  <i className="ri-grid-line"></i>
                </button>
              </div>
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-400">Ordenar por:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
              >
                <option value="data">Data (mais recente)</option>
                <option value="titulo">Título</option>
                <option value="tipo">Tipo</option>
                <option value="artista">Artista</option>
                <option value="projeto">Projeto</option>
              </select>
            </div>

            {/* Agrupamento */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-400">Agrupar por:</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className="px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
              >
                <option value="nenhum">Nenhum</option>
                <option value="tipo">Tipo</option>
                <option value="artista">Artista</option>
                <option value="projeto">Projeto</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <i className="ri-search-line mr-2"></i>Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, artista, projeto..."
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
              />
            </div>

            {/* Filtro por Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <i className="ri-file-list-line mr-2"></i>Filtrar por Tipo
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['todos', ...tipos] as FilterTipo[]).map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setFilterTipo(tipo)}
                    className={`px-3 py-1 rounded-lg text-sm transition-smooth cursor-pointer ${
                      filterTipo === tipo
                        ? 'bg-gradient-primary text-white'
                        : 'bg-dark-bg text-gray-400 hover:bg-dark-hover hover:text-white'
                    }`}
                  >
                    {tipo === 'todos' ? 'Todos' : getTipoLabel(tipo)}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por Status */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <i className="ri-checkbox-circle-line mr-2"></i>Filtrar por Status
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['todos', 'ativo', 'vencido', 'cancelado'] as FilterStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1 rounded-lg text-sm transition-smooth cursor-pointer ${
                      filterStatus === status
                        ? 'bg-gradient-primary text-white'
                        : 'bg-dark-bg text-gray-400 hover:bg-dark-hover hover:text-white'
                    }`}
                  >
                    {status === 'todos' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Lista de Documentos */}
        {loading ? (
          <div className="text-center py-12">
            <i className="ri-loader-4-line text-4xl text-primary-teal animate-spin mb-4"></i>
            <p className="text-gray-400">Carregando documentos...</p>
          </div>
        ) : (
          <>
            {Object.entries(groupedDocumentos).map(([groupName, docs]) => (
              <div key={groupName} className="mb-6">
                {groupBy !== 'nenhum' && (
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <i className="ri-folder-line text-primary-teal"></i>
                    {groupName} ({docs.length})
                  </h3>
                )}
                
                {viewMode === 'tabela' && (
                  <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-dark-hover">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Título</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Artista</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Projeto</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Período</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                          {docs.map((doc) => (
                            <tr key={doc.id} className="hover:bg-dark-hover transition-smooth">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-white">{doc.titulo}</div>
                                {doc.descricao && (
                                  <div className="text-xs text-gray-400 mt-1 line-clamp-1">{doc.descricao}</div>
                                )}
                                {doc.anexos && doc.anexos.length > 0 && (
                                  <div className="text-xs text-primary-teal mt-1">
                                    <i className="ri-attachment-line"></i> {doc.anexos.length} anexo(s)
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs rounded-lg bg-primary-teal/20 text-primary-teal">
                                  {getTipoLabel(doc.tipo)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white">{doc.artista?.nome || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white">{doc.projeto?.nome || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white">
                                  {formatDate(doc.data_inicio)} {doc.data_fim && `- ${formatDate(doc.data_fim)}`}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-lg ${getStatusColor(doc.status)}`}>
                                  {doc.status?.charAt(0).toUpperCase() + doc.status?.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleVisualizar(doc)}
                                    className="p-2 hover:bg-primary-teal/20 text-primary-teal rounded-lg transition-smooth cursor-pointer"
                                    title="Visualizar"
                                  >
                                    <i className="ri-eye-line text-lg"></i>
                                  </button>
                                  <button
                                    onClick={() => handleImprimir(doc)}
                                    className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-smooth cursor-pointer"
                                    title="Imprimir"
                                  >
                                    <i className="ri-printer-line text-lg"></i>
                                  </button>
                                  <button
                                    onClick={() => handleDownload(doc)}
                                    className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-smooth cursor-pointer"
                                    title="Baixar PDF"
                                  >
                                    <i className="ri-download-line text-lg"></i>
                                  </button>
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDelete(doc.id)}
                                      className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-smooth cursor-pointer"
                                      title="Excluir"
                                    >
                                      <i className="ri-delete-bin-line text-lg"></i>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {viewMode === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {docs.map((doc) => (
                      <div key={doc.id} className="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-primary-teal transition-smooth">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-white font-semibold text-sm line-clamp-2">{doc.titulo}</h4>
                          <span className={`px-2 py-1 text-xs rounded-lg ${getStatusColor(doc.status)} ml-2 flex-shrink-0`}>
                            {doc.status?.charAt(0).toUpperCase() + doc.status?.slice(1)}
                          </span>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <i className="ri-file-list-line"></i>
                            <span>{getTipoLabel(doc.tipo)}</span>
                          </div>
                          {doc.artista?.nome && (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <i className="ri-user-line"></i>
                              <span>{doc.artista.nome}</span>
                            </div>
                          )}
                          {doc.projeto?.nome && (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <i className="ri-folder-line"></i>
                              <span>{doc.projeto.nome}</span>
                            </div>
                          )}
                          {doc.anexos && doc.anexos.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-primary-teal">
                              <i className="ri-attachment-line"></i>
                              <span>{doc.anexos.length} anexo(s)</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-dark-border">
                          <button
                            onClick={() => handleVisualizar(doc)}
                            className="flex-1 px-3 py-2 bg-primary-teal/20 hover:bg-primary-teal/30 text-primary-teal rounded-lg transition-smooth cursor-pointer text-sm flex items-center justify-center gap-1"
                          >
                            <i className="ri-eye-line"></i>
                            Ver
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-smooth cursor-pointer"
                            title="Baixar"
                          >
                            <i className="ri-download-line"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {docs.map((doc) => (
                      <div key={doc.id} className="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-primary-teal transition-smooth cursor-pointer" onClick={() => handleVisualizar(doc)}>
                        <div className="text-center mb-3">
                          <i className="ri-file-pdf-line text-4xl text-primary-teal mb-2"></i>
                          <h4 className="text-white font-semibold text-sm line-clamp-2">{doc.titulo}</h4>
                        </div>
                        <div className="space-y-1 mb-3 text-xs text-gray-400">
                          <div>{getTipoLabel(doc.tipo)}</div>
                          {doc.artista?.nome && <div>{doc.artista.nome}</div>}
                          {doc.anexos && doc.anexos.length > 0 && (
                            <div className="text-primary-teal">
                              <i className="ri-attachment-line"></i> {doc.anexos.length}
                            </div>
                          )}
                        </div>
                        <span className={`block text-center px-2 py-1 text-xs rounded-lg ${getStatusColor(doc.status)}`}>
                          {doc.status?.charAt(0).toUpperCase() + doc.status?.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {sortedDocumentos.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-file-line text-6xl text-gray-600 mb-4"></i>
                <p className="text-gray-400">Nenhum documento encontrado</p>
              </div>
            )}
          </>
        )}

        {/* Modal Anexar Documento */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Anexar Documento</h2>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Arquivo Principal */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo do Documento *</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => setFormData({ ...formData, arquivo: e.target.files?.[0] || null })}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  />
                  {formData.arquivo && (
                    <p className="text-xs text-primary-teal mt-2">
                      ✓ {formData.arquivo.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos aceitos: PDF, DOC, DOCX, TXT
                  </p>
                </div>

                {/* Anexos Adicionais */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <i className="ri-attachment-line mr-2"></i>
                    Anexos Adicionais (Opcional)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setFormData({ ...formData, arquivos: files });
                    }}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  />
                  {formData.arquivos.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {formData.arquivos.map((file, index) => (
                        <p key={index} className="text-xs text-primary-teal">
                          ✓ {file.name}
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Você pode anexar múltiplos arquivos adicionais ao documento
                  </p>
                </div>

                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Título *</label>
                    <input
                      type="text"
                      required
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="Ex: Contrato de Gravação - Artista X"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Tipo *</label>
                    <select
                      required
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                    >
                      <option value="">Selecione o tipo</option>
                      {tipos.map(tipo => (
                        <option key={tipo} value={tipo}>{getTipoLabel(tipo)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="vencido">Vencido</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Artista</label>
                    <select
                      value={formData.artista_id}
                      onChange={(e) => setFormData({ ...formData, artista_id: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                    >
                      <option value="">Selecione o artista</option>
                      {artistas.map(artista => (
                        <option key={artista.id} value={artista.id}>{artista.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Projeto</label>
                    <select
                      value={formData.projeto_id}
                      onChange={(e) => setFormData({ ...formData, projeto_id: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                    >
                      <option value="">Selecione o projeto</option>
                      {projetos.map(projeto => (
                        <option key={projeto.id} value={projeto.id}>{projeto.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Datas e Valores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Data de Início</label>
                    <input
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Data de Fim</label>
                    <input
                      type="date"
                      value={formData.data_fim}
                      onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                      min={formData.data_inicio || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Valor</label>
                    <input
                      type="text"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth"
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                    placeholder="Descrição ou observações sobre o documento..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="ri-loader-4-line animate-spin"></i>
                        Anexando...
                      </span>
                    ) : (
                      'Anexar Documento'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Visualizar Documento */}
        {showViewModal && selectedDocumento && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Detalhes do Documento</h2>
                <button 
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedDocumento(null);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Título</label>
                    <p className="text-white">{selectedDocumento.titulo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
                    <p className="text-white">{getTipoLabel(selectedDocumento.tipo)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Artista</label>
                    <p className="text-white">{selectedDocumento.artista?.nome || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Projeto</label>
                    <p className="text-white">{selectedDocumento.projeto?.nome || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Data de Início</label>
                    <p className="text-white">{formatDate(selectedDocumento.data_inicio)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Data de Fim</label>
                    <p className="text-white">{formatDate(selectedDocumento.data_fim)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Valor</label>
                    <p className="text-primary-teal font-semibold">{formatCurrency(selectedDocumento.valor)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                    <span className={`px-2 py-1 text-xs rounded-lg ${getStatusColor(selectedDocumento.status)}`}>
                      {selectedDocumento.status?.charAt(0).toUpperCase() + selectedDocumento.status?.slice(1)}
                    </span>
                  </div>
                  {selectedDocumento.descricao && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Descrição</label>
                      <p className="text-white whitespace-pre-wrap">{selectedDocumento.descricao}</p>
                    </div>
                  )}
                </div>

                {/* Novos Campos */}
                {selectedDocumento.identificacao_partes && (
                  <div className="border-t border-dark-border pt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Identificação das Partes (Quem?)</label>
                    <p className="text-white whitespace-pre-wrap">{selectedDocumento.identificacao_partes}</p>
                  </div>
                )}

                {selectedDocumento.objeto_escopo && (
                  <div className="border-t border-dark-border pt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Objeto e Escopo (O quê?)</label>
                    <p className="text-white whitespace-pre-wrap">{selectedDocumento.objeto_escopo}</p>
                  </div>
                )}

                {selectedDocumento.valores_pagamento && (
                  <div className="border-t border-dark-border pt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Valores e Pagamento (Quanto e Como?)</label>
                    <p className="text-white whitespace-pre-wrap">{selectedDocumento.valores_pagamento}</p>
                  </div>
                )}

                {selectedDocumento.vigencia_prazos && (
                  <div className="border-t border-dark-border pt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Vigência e Prazos (Quando?)</label>
                    <p className="text-white whitespace-pre-wrap">{selectedDocumento.vigencia_prazos}</p>
                  </div>
                )}

                {selectedDocumento.termos_legais && (
                  <div className="border-t border-dark-border pt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Termos Legais</label>
                    <p className="text-white whitespace-pre-wrap">{selectedDocumento.termos_legais}</p>
                  </div>
                )}

                {selectedDocumento.assinatura && (
                  <div className="border-t border-dark-border pt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Assinatura e Concordância</label>
                    <p className="text-white whitespace-pre-wrap">{selectedDocumento.assinatura}</p>
                  </div>
                )}

                {/* Seção de Anexos */}
                <div className="border-t border-dark-border pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-400">
                      <i className="ri-attachment-line mr-2"></i>
                      Anexos ({anexos.length + (selectedDocumento.anexos?.length || 0)})
                    </label>
                    <button
                      onClick={() => {
                        setShowAnexosModal(true);
                      }}
                      className="px-3 py-1 bg-primary-teal/20 hover:bg-primary-teal/30 text-primary-teal rounded-lg transition-smooth cursor-pointer text-sm flex items-center gap-1"
                    >
                      <i className="ri-add-line"></i>
                      Adicionar Anexo
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedDocumento.arquivo_url && (
                      <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                        <div className="flex items-center gap-3">
                          <i className="ri-file-line text-primary-teal text-xl"></i>
                          <div>
                            <p className="text-white text-sm">{selectedDocumento.arquivo_nome || 'Arquivo principal'}</p>
                            <p className="text-xs text-gray-400">Arquivo principal</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadArquivoAnexado(selectedDocumento)}
                          className="p-2 hover:bg-primary-teal/20 text-primary-teal rounded-lg transition-smooth cursor-pointer"
                          title="Baixar"
                        >
                          <i className="ri-download-line"></i>
                        </button>
                      </div>
                    )}
                    
                    {(anexos.length > 0 || selectedDocumento.anexos?.length > 0) && (
                      <>
                        {(selectedDocumento.anexos || anexos).map((anexo: any) => (
                          <div key={anexo.id} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                            <div className="flex items-center gap-3">
                              <i className="ri-attachment-line text-primary-teal text-xl"></i>
                              <div>
                                <p className="text-white text-sm">{anexo.arquivo_nome}</p>
                                {anexo.descricao && (
                                  <p className="text-xs text-gray-400">{anexo.descricao}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  const { getSignedUrlR2, R2_BUCKETS } = await import('../../lib/r2');
                                  try {
                                    const url = await getSignedUrlR2(
                                      R2_BUCKETS.DOCUMENTOS,
                                      anexo.arquivo_key,
                                      86400
                                    );
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = anexo.arquivo_nome;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  } catch (error: any) {
                                    alert(`Erro ao baixar anexo: ${error.message}`);
                                  }
                                }}
                                className="p-2 hover:bg-primary-teal/20 text-primary-teal rounded-lg transition-smooth cursor-pointer"
                                title="Baixar"
                              >
                                <i className="ri-download-line"></i>
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteAnexo(anexo.id, selectedDocumento.id)}
                                  className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-smooth cursor-pointer"
                                  title="Excluir"
                                >
                                  <i className="ri-delete-bin-line"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    
                    {anexos.length === 0 && !selectedDocumento.arquivo_url && (selectedDocumento.anexos?.length || 0) === 0 && (
                      <p className="text-gray-400 text-sm text-center py-4">Nenhum anexo adicionado</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-dark-border">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDownload(selectedDocumento)}
                      className="flex-1 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center justify-center gap-2"
                    >
                      <i className="ri-file-pdf-line"></i>
                      <span>Baixar {getTipoLabel(selectedDocumento.tipo)} (PDF)</span>
                    </button>
                    <button
                      onClick={() => handleImprimir(selectedDocumento)}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center justify-center gap-2"
                    >
                      <i className="ri-printer-line"></i>
                      <span>Imprimir</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Imprimir Documento */}
        {showPrintModal && selectedDocumento && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Imprimir {getTipoLabel(selectedDocumento.tipo)}</h2>
                <button 
                  onClick={() => {
                    setShowPrintModal(false);
                    setSelectedDocumento(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div id="print-content" className="space-y-6 text-gray-900">
                {/* Cabeçalho */}
                <div className="text-center border-b pb-4">
                  <h1 className="text-2xl font-bold mb-2">CEU MUSIC</h1>
                  <p className="text-gray-600">{getTipoLabel(selectedDocumento.tipo).toUpperCase()}</p>
                  <p className="text-sm text-gray-500 mt-1">{selectedDocumento.titulo}</p>
                </div>

                {/* Identificação das Partes */}
                {selectedDocumento.identificacao_partes && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 border-b pb-1">1. IDENTIFICAÇÃO DAS PARTES (QUEM?)</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedDocumento.identificacao_partes}</p>
                  </div>
                )}

                {/* Objeto e Escopo */}
                {selectedDocumento.objeto_escopo && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 border-b pb-1">2. OBJETO E ESCOPO (O QUÊ?)</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedDocumento.objeto_escopo}</p>
                  </div>
                )}

                {/* Valores e Pagamento */}
                {selectedDocumento.valores_pagamento && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 border-b pb-1">3. VALORES E PAGAMENTO (QUANTO E COMO?)</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedDocumento.valores_pagamento}</p>
                    {selectedDocumento.valor && (
                      <p className="mt-2 text-lg font-bold text-primary-teal">Valor Total: {formatCurrency(selectedDocumento.valor)}</p>
                    )}
                  </div>
                )}

                {/* Vigência e Prazos */}
                {selectedDocumento.vigencia_prazos && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 border-b pb-1">4. VIGÊNCIA E PRAZOS (QUANDO?)</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedDocumento.vigencia_prazos}</p>
                    {(selectedDocumento.data_inicio || selectedDocumento.data_fim) && (
                      <div className="mt-2 text-sm">
                        {selectedDocumento.data_inicio && (
                          <p><strong>Data de Início:</strong> {formatDate(selectedDocumento.data_inicio)}</p>
                        )}
                        {selectedDocumento.data_fim && (
                          <p><strong>Data de Fim:</strong> {formatDate(selectedDocumento.data_fim)}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Informações Adicionais */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 border-b pb-1">INFORMAÇÕES ADICIONAIS</h3>
                  <div className="text-sm space-y-1">
                    {selectedDocumento.artista?.nome && (
                      <p><strong>Artista:</strong> {selectedDocumento.artista.nome}</p>
                    )}
                    {selectedDocumento.projeto?.nome && (
                      <p><strong>Projeto:</strong> {selectedDocumento.projeto.nome}</p>
                    )}
                    {selectedDocumento.descricao && (
                      <div className="mt-2">
                        <p><strong>Descrição:</strong></p>
                        <p className="whitespace-pre-wrap">{selectedDocumento.descricao}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Termos Legais */}
                {selectedDocumento.termos_legais && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 border-b pb-1">5. TERMOS LEGAIS E CLÁUSULAS</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedDocumento.termos_legais}</p>
                  </div>
                )}

                {/* Assinatura */}
                {selectedDocumento.assinatura && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 border-b pb-1">6. ASSINATURA E CONCORDÂNCIA</h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedDocumento.assinatura}</p>
                  </div>
                )}

                {/* Rodapé */}
                <div className="border-t pt-4 mt-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="font-semibold mb-2">CEU MUSIC</p>
                      <p className="text-sm text-gray-600">Gravadora</p>
                      <div className="mt-4 border-t pt-2">
                        <p className="text-xs text-gray-500">Assinatura</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold mb-2">{selectedDocumento.artista?.nome || 'Artista'}</p>
                      <p className="text-sm text-gray-600">Contratado</p>
                      <div className="mt-4 border-t pt-2">
                        <p className="text-xs text-gray-500">Assinatura</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t">
                <button
                  onClick={() => {
                    const printContent = document.getElementById('print-content');
                    if (printContent) {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Contrato - ${selectedDocumento.titulo}</title>
                              <style>
                                body { font-family: Arial, sans-serif; padding: 20px; }
                                h1 { color: #333; }
                                h3 { color: #555; margin-top: 20px; }
                                p { margin: 5px 0; }
                                .border-b { border-bottom: 1px solid #ddd; padding-bottom: 10px; }
                                .border-t { border-top: 1px solid #ddd; padding-top: 10px; }
                                .text-center { text-align: center; }
                                .text-right { text-align: right; }
                                .grid { display: grid; }
                                .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                                .gap-8 { gap: 2rem; }
                                .space-y-4 > * + * { margin-top: 1rem; }
                                .space-y-6 > * + * { margin-top: 1.5rem; }
                                .mt-8 { margin-top: 2rem; }
                                .mb-2 { margin-bottom: 0.5rem; }
                                .pt-4 { padding-top: 1rem; }
                                .whitespace-pre-wrap { white-space: pre-wrap; }
                              </style>
                            </head>
                            <body>
                              ${printContent.innerHTML}
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="ri-printer-line"></i>
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => {
                    setShowPrintModal(false);
                    setSelectedDocumento(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-smooth cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Adicionar Anexo */}
        {showAnexosModal && selectedDocumento && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Adicionar Anexo</h2>
                <button 
                  onClick={() => {
                    setShowAnexosModal(false);
                  }}
                  className="text-gray-400 hover:text-white transition-smooth cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && selectedDocumento.id) {
                        await handleAddAnexo(selectedDocumento.id, file);
                        setShowAnexosModal(false);
                      }
                    }}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos aceitos: PDF, DOC, DOCX, TXT, JPG, PNG
                  </p>
                </div>

                {uploadingAnexo && (
                  <div className="text-center py-4">
                    <i className="ri-loader-4-line text-2xl text-primary-teal animate-spin"></i>
                    <p className="text-gray-400 text-sm mt-2">Enviando anexo...</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAnexosModal(false)}
                    className="flex-1 px-4 py-3 bg-dark-bg hover:bg-dark-hover text-white rounded-lg transition-smooth cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

