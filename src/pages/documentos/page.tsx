import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type FilterTipo = 'todos' | 'contrato' | 'termo' | 'aditivo' | 'outro';
type FilterStatus = 'todos' | 'ativo' | 'vencido' | 'cancelado';

export default function Documentos() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<FilterTipo>('todos');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [artistas, setArtistas] = useState<any[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocumento, setSelectedDocumento] = useState<any>(null);
  
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
    // Novos campos
    identificacao_partes: '',
    objeto_escopo: '',
    valores_pagamento: '',
    vigencia_prazos: '',
    termos_legais: '',
    assinatura: '',
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
          projeto:projeto_id(id, nome)
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
      if (!formData.arquivo) {
        alert('Por favor, selecione um arquivo para upload.');
        return;
      }

      setUploading(true);

      // Upload do arquivo para Cloudflare R2
      const { storageService, R2_BUCKETS } = await import('../../services/storage');
      const result = await storageService.upload(formData.arquivo, {
        bucket: R2_BUCKETS.DOCUMENTOS,
        folder: 'documentos',
        makePublic: false, // Usar signed URLs (mais seguro)
      });

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
        arquivo_url: result.url,
        arquivo_nome: formData.arquivo.name,
        arquivo_key: result.key, // Salvar o key para gerar novas URLs quando necessário
      };

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

  const handleVisualizar = (documento: any) => {
    setSelectedDocumento(documento);
    setShowViewModal(true);
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
      const html2pdf = (await import('html2pdf.js')).default;

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
    // Sempre gerar PDF formatado do documento
    handleDownloadDocumentoPDF(documento);
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

  const handleDownloadMultiple = async (documentosParaDownload: any[]) => {
    if (documentosParaDownload.length === 0) {
      alert('Nenhum documento selecionado para download.');
      return;
    }

    try {
      const { getSignedUrlR2, R2_BUCKETS, findKeyByFileName } = await import('../../lib/r2');
      
      let sucesso = 0;
      let falhas = 0;
      const erros: string[] = [];

      for (const documento of documentosParaDownload) {
        try {
          let arquivoKey: string | null = documento.arquivo_key || null;
          
          // Se não temos o key, tentar encontrar
          if (!arquivoKey && documento.arquivo_nome) {
            arquivoKey = await findKeyByFileName(
              R2_BUCKETS.DOCUMENTOS,
              documento.arquivo_nome,
              'documentos'
            );
            
            if (arquivoKey) {
              await supabase
                .from('documentos')
                .update({ arquivo_key: arquivoKey })
                .eq('id', documento.id);
            }
          }

          // Se ainda não temos key, tentar extrair da URL
          if (!arquivoKey && documento.arquivo_url) {
            try {
              const url = new URL(documento.arquivo_url);
              const pathParts = url.pathname.split('/').filter(p => p);
              if (pathParts.length >= 2) {
                const bucketIndex = pathParts.findIndex(p => 
                  p === R2_BUCKETS.DOCUMENTOS || 
                  p === 'documentos' ||
                  p.includes('documentos')
                );
                if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
                  arquivoKey = pathParts.slice(bucketIndex + 1).join('/');
                } else {
                  arquivoKey = pathParts.slice(1).join('/');
                }
              }
            } catch (e) {
              // Ignorar erro de extração
            }
          }

          // Gerar URL assinada
          let downloadUrl: string | null = null;
          
          if (arquivoKey) {
            downloadUrl = await getSignedUrlR2(
              R2_BUCKETS.DOCUMENTOS,
              arquivoKey,
              86400 // URL válida por 24 horas
            );
          } else if (documento.arquivo_url) {
            downloadUrl = documento.arquivo_url;
          }

          if (downloadUrl) {
            // Criar link temporário para download direto
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            if (documento.arquivo_nome) {
              link.download = documento.arquivo_nome;
            }
            
            // Adicionar delay entre downloads para evitar bloqueio
            setTimeout(() => {
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }, sucesso * 300); // Delay de 300ms entre cada download
            sucesso++;
          } else {
            falhas++;
            erros.push(`${documento.titulo}: URL não disponível`);
          }
        } catch (error: any) {
          falhas++;
          erros.push(`${documento.titulo}: ${error.message || 'Erro desconhecido'}`);
        }
      }

      // Mostrar resultado
      if (falhas === 0) {
        alert(`✅ ${sucesso} documento(s) sendo baixado(s)!`);
      } else {
        alert(`⚠️ ${sucesso} documento(s) baixado(s) com sucesso.\n❌ ${falhas} falha(s):\n${erros.join('\n')}`);
      }
    } catch (error: any) {
      console.error('Erro ao fazer download em lote:', error);
      alert(`Erro ao fazer download em lote: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert('Apenas administradores podem excluir documentos.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadDocumentos();
      alert('Documento excluído com sucesso!');
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
      identificacao_partes: '',
      objeto_escopo: '',
      valores_pagamento: '',
      vigencia_prazos: '',
      termos_legais: '',
      assinatura: '',
    });
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

  const tipos = ['contrato', 'termo', 'aditivo', 'outro'];

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
            <span>Novo Documento</span>
          </button>
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

          {/* Botões de Download em Lote */}
          <div className="border-t border-dark-border pt-4">
            <label className="block text-sm font-medium text-gray-400 mb-3">
              <i className="ri-download-line mr-2"></i>Download em Lote
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleDownloadMultiple(filteredDocumentos)}
                disabled={filteredDocumentos.length === 0}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                title={`Baixar todos os ${filteredDocumentos.length} documento(s) filtrado(s)`}
              >
                <i className="ri-download-line"></i>
                Baixar Todos ({filteredDocumentos.length})
              </button>
              <button
                onClick={() => handleDownloadMultiple(filteredDocumentos.filter(d => d.tipo === 'contrato'))}
                disabled={filteredDocumentos.filter(d => d.tipo === 'contrato').length === 0}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                title={`Baixar ${filteredDocumentos.filter(d => d.tipo === 'contrato').length} contrato(s)`}
              >
                <i className="ri-file-paper-line"></i>
                Contratos ({filteredDocumentos.filter(d => d.tipo === 'contrato').length})
              </button>
              <button
                onClick={() => handleDownloadMultiple(filteredDocumentos.filter(d => d.tipo === 'termo'))}
                disabled={filteredDocumentos.filter(d => d.tipo === 'termo').length === 0}
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                title={`Baixar ${filteredDocumentos.filter(d => d.tipo === 'termo').length} termo(s)`}
              >
                <i className="ri-file-text-line"></i>
                Termos ({filteredDocumentos.filter(d => d.tipo === 'termo').length})
              </button>
              <button
                onClick={() => handleDownloadMultiple(filteredDocumentos.filter(d => d.status === 'ativo'))}
                disabled={filteredDocumentos.filter(d => d.status === 'ativo').length === 0}
                className="px-4 py-2 bg-primary-teal/20 hover:bg-primary-teal/30 text-primary-teal rounded-lg transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                title={`Baixar ${filteredDocumentos.filter(d => d.status === 'ativo').length} documento(s) ativo(s)`}
              >
                <i className="ri-checkbox-circle-line"></i>
                Ativos ({filteredDocumentos.filter(d => d.status === 'ativo').length})
              </button>
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
                    {filteredDocumentos.map((doc) => (
                      <tr key={doc.id} className="hover:bg-dark-hover transition-smooth">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{doc.titulo}</div>
                          {doc.descricao && (
                            <div className="text-xs text-gray-400 mt-1 line-clamp-1">{doc.descricao}</div>
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

            {filteredDocumentos.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-file-line text-6xl text-gray-600 mb-4"></i>
                <p className="text-gray-400">Nenhum documento encontrado</p>
              </div>
            )}
          </>
        )}

        {/* Modal Novo Documento */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Novo Documento</h2>
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
                {/* Informações Básicas */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Informações Básicas</h3>
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
                </div>

                {/* Datas e Valores */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Datas e Valores</h3>
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
                </div>

                {/* Identificação das Partes */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Identificação das Partes (Quem?)</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Identifique as partes envolvidas no contrato/documento
                    </label>
                    <textarea
                      value={formData.identificacao_partes}
                      onChange={(e) => setFormData({ ...formData, identificacao_partes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                      placeholder="Ex: CONTRATANTE: CEU MUSIC, CNPJ: XX.XXX.XXX/XXXX-XX. CONTRATADO: [Nome do Artista], CPF: XXX.XXX.XXX-XX..."
                    />
                  </div>
                </div>

                {/* Objeto e Escopo */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Objeto e Escopo (O quê?)</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Descreva o objeto e o escopo do contrato/documento
                    </label>
                    <textarea
                      value={formData.objeto_escopo}
                      onChange={(e) => setFormData({ ...formData, objeto_escopo: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                      placeholder="Ex: O presente contrato tem por objeto a gravação de um álbum completo, incluindo produção, mixagem e masterização..."
                    />
                  </div>
                </div>

                {/* Valores e Pagamento */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Valores e Pagamento (Quanto e Como?)</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Detalhe os valores e condições de pagamento
                    </label>
                    <textarea
                      value={formData.valores_pagamento}
                      onChange={(e) => setFormData({ ...formData, valores_pagamento: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                      placeholder="Ex: O valor total do contrato é de R$ 50.000,00 (cinquenta mil reais), a ser pago em 3 parcelas de R$ 16.666,67, sendo a primeira no ato da assinatura..."
                    />
                  </div>
                </div>

                {/* Vigência e Prazos */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Vigência e Prazos (Quando?)</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Especifique a vigência e prazos do contrato/documento
                    </label>
                    <textarea
                      value={formData.vigencia_prazos}
                      onChange={(e) => setFormData({ ...formData, vigencia_prazos: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                      placeholder="Ex: Este contrato terá vigência de 12 (doze) meses, contados a partir da data de assinatura. O prazo para entrega do material é de 90 dias..."
                    />
                  </div>
                </div>

                {/* Termos Legais e Assinatura */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Termos Legais e Assinatura (Concordância)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Termos Legais e Cláusulas
                      </label>
                      <textarea
                        value={formData.termos_legais}
                        onChange={(e) => setFormData({ ...formData, termos_legais: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                        placeholder="Ex: As partes concordam que... Foro de eleição: Comarca de São Paulo/SP..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Assinaturas e Concordância
                      </label>
                      <textarea
                        value={formData.assinatura}
                        onChange={(e) => setFormData({ ...formData, assinatura: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                        placeholder="Ex: As partes declaram estar de acordo com os termos deste contrato e o assinam em duas vias de igual teor..."
                      />
                    </div>
                  </div>
                </div>

                {/* Arquivo e Descrição */}
                <div className="border-b border-dark-border pb-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Arquivo e Descrição</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Arquivo *</label>
                      <input
                        type="file"
                        required
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => setFormData({ ...formData, arquivo: e.target.files?.[0] || null })}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth cursor-pointer"
                      />
                      {formData.arquivo && (
                        <p className="text-xs text-gray-400 mt-1">
                          Arquivo selecionado: {formData.arquivo.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Descrição</label>
                      <textarea
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-teal transition-smooth resize-none"
                        placeholder="Descrição do documento..."
                      />
                    </div>
                  </div>
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
                        Enviando...
                      </span>
                    ) : (
                      'Salvar Documento'
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
                    {selectedDocumento.arquivo_url && (
                      <button
                        onClick={() => handleDownloadArquivoAnexado(selectedDocumento)}
                        className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:opacity-90 transition-smooth cursor-pointer flex items-center justify-center gap-2"
                        title="Baixar arquivo anexado ao formulário"
                      >
                        <i className="ri-file-download-line"></i>
                        <span>Anexo</span>
                      </button>
                    )}
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
      </div>
    </MainLayout>
  );
}

