import React from 'react';

export interface ProjetoParticipanteData {
  id?: string;
  projeto_id: string;
  projeto_nome?: string;
  artista_nome?: string;
  faixas_ids?: string[];
  faixas_nomes?: string[];
  tipo_participacao: string;
  tipo_participacao_outro?: string | null;
  funcao_instrumento: string;
  autorizante_nome: string;
  autorizante_nome_artistico?: string | null;
  autorizante_cpf?: string | null;
  autorizante_rg?: string | null;
  autorizante_nacionalidade?: string | null;
  autorizante_estado_civil?: string | null;
  autorizante_profissao?: string | null;
  autorizante_endereco?: string | null;
  autorizante_email?: string | null;
  autorizante_telefone?: string | null;
  autorizante_pix?: string | null;
  status: 'pendente' | 'enviado' | 'assinado' | 'cancelado';
  token?: string;
  declaracao_concordancia?: boolean;
  assinatura_digital?: string | null;
  aceito_em?: string | null;
  ip_origem?: string | null;
  user_agent?: string | null;
  termo_versao?: string;
  observacoes?: string | null;
  created_at?: string;
}

interface TermoParticipanteContentProps {
  data: ProjetoParticipanteData;
  isPrintable?: boolean;
}

export const TIPOS_PARTICIPACAO_LABELS: Record<string, string> = {
  musico: 'Músico(a) / Instrumentista',
  produtor_musical: 'Produtor(a) Musical',
  arranjador: 'Arranjador(a)',
  compositor: 'Compositor(a)',
  letrista: 'Letrista',
  engenheiro_audio: 'Engenheiro(a) de Áudio',
  mixador: 'Mixador(a)',
  masterizador: 'Masterizador(a)',
  cantor_convidado: 'Cantor(a) Convidado(a) / Feat',
  backing_vocal: 'Backing Vocal',
  coral: 'Coral',
  outro: 'Outro Profissional',
};

export default function TermoParticipanteContent({ data, isPrintable = false }: TermoParticipanteContentProps) {
  const formatDateTimeBR = (isoDate?: string | null) => {
    if (!isoDate) return '-';
    try {
      const d = new Date(isoDate);
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}`;
    } catch {
      return isoDate;
    }
  };

  const tipoLabel = TIPOS_PARTICIPACAO_LABELS[data.tipo_participacao] || data.tipo_participacao || 'Participante';

  return (
    <div
      className={`space-y-6 text-sm text-gray-300 leading-relaxed font-sans ${
        isPrintable ? 'print:text-black print:bg-white print:p-0' : ''
      }`}
    >
      {/* Cabeçalho do Documento */}
      <div className="text-center space-y-2 border-b border-dark-border/80 pb-5">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold uppercase tracking-wider mb-1">
          <i className="ri-shield-check-line"></i>
          Instrumento Particular de Cessão de Direitos e Ficha Técnica
        </div>
        <h1 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
          Termo de Autorização, Licença de Uso de Imagem, Voz, Performance Artística e Cessão de Direitos Conexos
        </h1>
        <p className="text-xs text-gray-400">
          CÉU MUSIC PRODUÇÕES ARTÍSTICAS LTDA • CNPJ: 57.358.544/0001-47
        </p>
      </div>

      {/* Identificação das Partes */}
      <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border space-y-3">
        <p>
          <strong className="text-white">Pelo presente instrumento particular, de um lado:</strong>
        </p>
        <p className="text-xs sm:text-sm text-gray-300">
          <strong className="text-white">CÉU MUSIC PRODUÇÕES ARTÍSTICAS LTDA</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <strong className="text-white">57.358.544/0001-47</strong>, com sede na Av. Olof Palme, 765, salas 701, 702, 703, 704, 724, 725 e 726 – Camorim – Rio de Janeiro, RJ, CEP: 22783-119, doravante denominada simplesmente <strong className="text-teal-400">"PRODUTORA"</strong> ou <strong className="text-teal-400">"CÉU MUSIC"</strong>;
        </p>
        <p>
          <strong className="text-white">e, de outro lado, na qualidade de PARTICIPANTE / MÚSICO / EXECUTANTE:</strong>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm pt-2 border-t border-dark-border/40">
          <div>
            <span className="text-gray-400">Nome Civil Completo:</span>{' '}
            <strong className="text-white">{data.autorizante_nome || '_________________________________'}</strong>
          </div>
          <div>
            <span className="text-gray-400">Nome Artístico / Crédito:</span>{' '}
            <strong className="text-white">{data.autorizante_nome_artistico || 'Mesmo do nome civil'}</strong>
          </div>
          <div>
            <span className="text-gray-400">CPF:</span>{' '}
            <strong className="text-white">{data.autorizante_cpf || '_____________________'}</strong>
          </div>
          <div>
            <span className="text-gray-400">RG:</span>{' '}
            <strong className="text-white">{data.autorizante_rg || 'Não informado'}</strong>
          </div>
          <div>
            <span className="text-gray-400">Nacionalidade / Estado Civil:</span>{' '}
            <strong className="text-white">
              {data.autorizante_nacionalidade || 'Brasileiro(a)'}{data.autorizante_estado_civil ? ` / ${data.autorizante_estado_civil}` : ''}
            </strong>
          </div>
          <div>
            <span className="text-gray-400">Profissão:</span>{' '}
            <strong className="text-white">{data.autorizante_profissao || 'Músico / Artista'}</strong>
          </div>
          <div className="sm:col-span-2">
            <span className="text-gray-400">Endereço Residencial:</span>{' '}
            <strong className="text-white">{data.autorizante_endereco || 'Não informado'}</strong>
          </div>
          <div>
            <span className="text-gray-400">E-mail:</span>{' '}
            <strong className="text-white">{data.autorizante_email || 'Não informado'}</strong>
          </div>
          <div>
            <span className="text-gray-400">WhatsApp / Telefone:</span>{' '}
            <strong className="text-white">{data.autorizante_telefone || 'Não informado'}</strong>
          </div>
          {data.autorizante_pix && (
            <div className="sm:col-span-2">
              <span className="text-gray-400">Chave PIX / Dados de Pagamento:</span>{' '}
              <strong className="text-teal-400">{data.autorizante_pix}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Dados do Projeto e Participação Técnica */}
      <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border space-y-2">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <i className="ri-folder-music-line text-teal-400"></i>
          Dados do Projeto Musical e Escopo da Participação
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm pt-1">
          <div>
            <span className="text-gray-400">Projeto / Obra:</span>{' '}
            <strong className="text-white">{data.projeto_nome || 'Projeto Musical Céu Music'}</strong>
          </div>
          <div>
            <span className="text-gray-400">Artista Principal:</span>{' '}
            <strong className="text-white">{data.artista_nome || 'Céu Music'}</strong>
          </div>
          <div>
            <span className="text-gray-400">Função / Papel:</span>{' '}
            <strong className="text-teal-400">
              {tipoLabel}
              {data.tipo_participacao === 'outro' && data.tipo_participacao_outro ? ` (${data.tipo_participacao_outro})` : ''}
            </strong>
          </div>
          <div>
            <span className="text-gray-400">Instrumento(s) / Execução:</span>{' '}
            <strong className="text-white">{data.funcao_instrumento || 'Não especificado'}</strong>
          </div>
          <div className="sm:col-span-2">
            <span className="text-gray-400">Faixas Participadas:</span>{' '}
            <strong className="text-white">
              {data.faixas_nomes && data.faixas_nomes.length > 0
                ? data.faixas_nomes.join(', ')
                : 'Todas as faixas do projeto'}
            </strong>
          </div>
        </div>
      </div>

      {/* Cláusulas Contratuais */}
      <div className="space-y-4 text-xs sm:text-sm text-gray-300">
        <div>
          <h3 className="font-bold text-white mb-1">CLÁUSULA PRIMEIRA – DO OBJETO</h3>
          <p>
            O presente instrumento tem por objeto a autorização, licenciamento e cessão irrevogável e irretratável à <strong className="text-white">CÉU MUSIC</strong> dos direitos de fixação, reprodução, comunicação pública, distribuição, execução e sincronização da atuação, interpretação, performance artística, vocal, instrumental e/ou arranjos prestados pelo <strong className="text-white">PARTICIPANTE</strong> no âmbito do projeto musical acima identificado, bem como a autorização irrestrita de uso de sua imagem, voz, nome civil e nome artístico captados em gravações de estúdio, ensaios, filmagens, bastidores (making of) e conteúdos promocionais relacionados.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-1">CLÁUSULA SEGUNDA – DA EXTENSÃO DOS DIREITOS E TERRITORIALIDADE</h3>
          <p>
            A autorização e cessão ora concedidas são celebradas em caráter de exclusividade para os fonogramas e videogramas produzidos no projeto, com abrangência <strong className="text-white">mundial (território universal)</strong> e por todo o prazo de proteção legal dos direitos de autor e conexos conferido pela Lei nº 9.610/1998 e tratados internacionais.
          </p>
          <p className="mt-1">
            A CÉU MUSIC fica plenamente autorizada a disponibilizar as obras e gravações em plataformas de streaming de áudio e vídeo (Spotify, Apple Music, YouTube, Deezer, TikTok, Instagram e demais agregadoras), radiodifusão, TV, cinema, mídias físicas, redes sociais e qualquer outra modalidade de exploração comercial ou promocional existente ou que venha a ser inventada.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-1">CLÁUSULA TERCEIRA – DA FICHA TÉCNICA E CRÉDITOS</h3>
          <p>
            O <strong className="text-white">PARTICIPANTE</strong> declara que as informações cadastrais e artísticas prestadas no presente instrumento são exatas e verdadeiras, servindo como base oficial para os créditos da <strong className="text-white">Ficha Técnica</strong>, cadastros no ECAD/Associações de Música e metadados de distribuição digital junto às distribuidoras.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-1">CLÁUSULA QUARTA – DA REMUNERAÇÃO E QUITAÇÃO</h3>
          <p>
            As condições financeiras (cachê, valor por sessão, permuta ou participação) eventualmente pactuadas de comum acordo entre as partes dão plena, geral e irrevogável quitação de todas e quaisquer obrigações patrimoniais, inexistindo qualquer débito posterior decorrente da execução artística ou da cessão de direitos conexos para a fixação das obras aqui previstas.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-1">CLÁUSULA QUINTA – DA PROTEÇÃO DE DADOS (LGPD)</h3>
          <p>
            O <strong className="text-white">PARTICIPANTE</strong> consente expressamente com a coleta e tratamento de seus dados pessoais e bancários pela <strong className="text-white">CÉU MUSIC</strong>, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD), exclusivamente para os fins de cumprimento das obrigações contratuais, recolhimento de tributos, créditos artísticos e gestão fonográfica.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-white mb-1">CLÁUSULA SEXTA – DO FORO</h3>
          <p>
            Para dirimir quaisquer controvérsias oriundas do presente instrumento, as partes elegem expressamente o Foro da Comarca da Capital do Estado do Rio de Janeiro, com renúncia a qualquer outro, por mais privilegiado que seja.
          </p>
        </div>
      </div>

      {/* Certificado de Assinatura Digital e Declaração */}
      <div className="bg-dark-bg p-4 rounded-xl border border-dark-border space-y-4 mt-6">
        <div className="flex items-center justify-between border-b border-dark-border/60 pb-3">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
            <i className="ri-award-line text-base"></i>
            Certificado de Validade Jurídica e Assinatura Digital
          </div>
          <span className="text-[11px] text-gray-400">Versão {data.termo_versao || '1.0'}</span>
        </div>

        <div className="flex items-start gap-2 text-xs text-gray-300">
          <i className="ri-checkbox-circle-fill text-teal-400 text-base flex-shrink-0 mt-0.5"></i>
          <span>
            Declaro sob as penas da lei que li e concordo integralmente com todos os termos, cláusulas e condições deste Instrumento Particular de Autorização, Licença e Cessão de Direitos, validando a assinatura eletrônica aposta abaixo.
          </span>
        </div>

        {data.status === 'assinado' && data.assinatura_digital ? (
          <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="border border-dark-border/80 bg-white/5 rounded-lg p-3 text-center">
              <p className="text-[11px] text-gray-400 mb-1">Assinatura Eletrônica Registrada:</p>
              <img
                src={data.assinatura_digital}
                alt={`Assinatura de ${data.autorizante_nome}`}
                className="max-h-24 mx-auto object-contain filter invert"
              />
              <p className="text-xs font-bold text-white mt-1 border-t border-dark-border/40 pt-1">
                {data.autorizante_nome}
              </p>
              {data.autorizante_cpf && (
                <p className="text-[11px] text-gray-400">CPF: {data.autorizante_cpf}</p>
              )}
            </div>

            <div className="text-xs space-y-1.5 bg-dark-bg/80 p-3 rounded-lg border border-dark-border/60">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-green-500/20 text-green-400">
                  <i className="ri-check-line mr-1"></i>
                  Assinado Digitalmente
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Data e Hora:</span>
                <span className="text-white font-mono">{formatDateTimeBR(data.aceito_em)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Endereço IP:</span>
                <span className="text-white font-mono">{data.ip_origem || 'Registrado via Web'}</span>
              </div>
              {data.token && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Token de Autenticação:</span>
                  <span className="text-teal-400 font-mono text-[10px] truncate max-w-[150px]">
                    {data.token}
                  </span>
                </div>
              )}
              {data.user_agent && (
                <div className="pt-1 text-[10px] text-gray-400 border-t border-dark-border/40 truncate" title={data.user_agent}>
                  Dispositivo: {data.user_agent}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-amber-500/40 bg-amber-500/10 p-4 rounded-lg text-center text-amber-300 text-xs">
            <i className="ri-time-line text-lg mb-1 block"></i>
            Documento pendente de assinatura digital pelo participante.
          </div>
        )}
      </div>
    </div>
  );
}
