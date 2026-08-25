import React from 'react';

export interface TermoUsoData {
  id?: string;
  token?: string;
  status?: 'pendente' | 'assinado' | 'cancelado';
  projeto_nome: string;
  artista_principal?: string | null;
  data_gravacao?: string | null;
  local_gravacao?: string | null;
  tipo_participacao?: string | null;
  tipo_participacao_outro?: string | null;
  autorizante_nome: string;
  autorizante_nome_artistico?: string | null;
  autorizante_cpf?: string | null;
  autorizante_rg?: string | null;
  autorizante_endereco?: string | null;
  autorizante_email?: string | null;
  autorizante_telefone?: string | null;
  aceito_em?: string | null;
  ip_origem?: string | null;
  user_agent?: string | null;
  assinatura_digital?: string | null;
  declaracao_concordancia?: boolean;
  termo_versao?: string;
}

interface TermoUsoContentProps {
  data: TermoUsoData;
  isPrintable?: boolean;
}

export default function TermoUsoContent({ data, isPrintable = false }: TermoUsoContentProps) {
  const formatDateBR = (isoDate?: string | null) => {
    if (!isoDate) return '____/____/________';
    try {
      if (isoDate.includes('T')) {
        const d = new Date(isoDate);
        return d.toLocaleDateString('pt-BR');
      }
      const [y, m, day] = isoDate.split('-');
      if (y && m && day) return `${day}/${m}/${y}`;
      return isoDate;
    } catch {
      return isoDate;
    }
  };

  const formatDateTimeBR = (isoDate?: string | null) => {
    if (!isoDate) return '-';
    try {
      const d = new Date(isoDate);
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    } catch {
      return isoDate;
    }
  };

  return (
    <div className={`space-y-6 text-sm text-gray-300 leading-relaxed font-sans ${isPrintable ? 'print:text-black print:bg-white print:p-0' : ''}`}>
      {/* Cabeçalho do Documento */}
      <div className="text-center space-y-2 border-b border-dark-border/80 pb-5">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold uppercase tracking-wider mb-1">
          <i className="ri-shield-check-line"></i>
          Instrumento Particular de Autorização
        </div>
        <h1 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
          Termo de Autorização e Licença de Uso de Imagem, Voz, Nome e Performance Artística
        </h1>
        <p className="text-xs text-gray-400">
          CÉU MUSIC PRODUÇÕES ARTÍSTICAS LTDA • CNPJ: 57.358.544/0001-47
        </p>
      </div>

      {/* Partes */}
      <div className="bg-dark-bg/60 p-4 rounded-xl border border-dark-border space-y-3">
        <p>
          <strong className="text-white">Pelo presente instrumento particular, de um lado:</strong>
        </p>
        <p className="text-xs sm:text-sm text-gray-300">
          <strong className="text-white">CÉU MUSIC PRODUÇÕES ARTÍSTICAS LTDA</strong>, inscrita no CNPJ sob o nº <strong className="text-white">57.358.544/0001-47</strong>, com sede na Av. Olof Palme, 765, salas 701, 702, 703, 704, 724, 725 e 726 – Camorim – Rio de Janeiro, RJ, CEP: 22783-119, doravante denominada simplesmente <strong className="text-teal-400">"CÉU MUSIC"</strong>;
        </p>
        <p>
          <strong className="text-white">e, de outro lado:</strong>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm pt-1 border-t border-dark-border/40">
          <div>
            <span className="text-gray-400">Nome Civil:</span>{' '}
            <strong className="text-white">{data.autorizante_nome || '_________________________________'}</strong>
          </div>
          <div>
            <span className="text-gray-400">Nome Artístico:</span>{' '}
            <strong className="text-white">{data.autorizante_nome_artistico || 'Não informado'}</strong>
          </div>
          <div>
            <span className="text-gray-400">CPF:</span>{' '}
            <strong className="text-white">{data.autorizante_cpf || '_____________________'}</strong>
          </div>
          <div>
            <span className="text-gray-400">RG:</span>{' '}
            <strong className="text-white">{data.autorizante_rg || '_____________________'}</strong>
          </div>
          <div className="sm:col-span-2">
            <span className="text-gray-400">Endereço:</span>{' '}
            <strong className="text-white">{data.autorizante_endereco || '_________________________________'}</strong>
          </div>
          <div>
            <span className="text-gray-400">E-mail:</span>{' '}
            <strong className="text-white">{data.autorizante_email || '_____________________'}</strong>
          </div>
          <div>
            <span className="text-gray-400">Telefone / WhatsApp:</span>{' '}
            <strong className="text-white">{data.autorizante_telefone || '_____________________'}</strong>
          </div>
        </div>
        <p className="text-xs text-gray-400 pt-1">
          doravante denominado(a) <strong className="text-teal-400">"AUTORIZANTE"</strong>;
        </p>
        <p className="text-xs text-gray-300">
          têm entre si ajustado o presente TERMO DE AUTORIZAÇÃO E LICENÇA DE USO DE IMAGEM, VOZ, NOME E PERFORMANCE ARTÍSTICA, mediante as condições seguintes:
        </p>
      </div>

      {/* Cláusulas do Termo */}
      <div className="space-y-4 text-xs sm:text-sm text-gray-300">
        {/* Cláusula 1 */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-white text-sm">1. OBJETO</h3>
          <p>
            <strong>1.1.</strong> O AUTORIZANTE autoriza expressamente a CÉU MUSIC a captar, fixar, gravar, fotografar, filmar, reproduzir, editar e utilizar sua imagem, voz, nome civil, nome artístico, interpretação, performance e demais elementos de sua personalidade artística registrados em razão de sua participação em gravações, sessões, ensaios, apresentações, produções audiovisuais, fonográficas, fotográficas, conteúdos de bastidores, entrevistas, projetos independentes, covers ou quaisquer outros projetos realizados, produzidos, apoiados, disponibilizados ou registrados nas dependências, estúdios, espaços ou com a participação da CÉU MUSIC.
          </p>
          <p>
            <strong>1.2.</strong> A presente autorização compreende materiais captados antes, durante e após a realização do respectivo projeto, desde que relacionados à atividade, produção ou participação do AUTORIZANTE.
          </p>
        </div>

        {/* Cláusula 2 */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-white text-sm">2. FORMAS DE UTILIZAÇÃO</h3>
          <p>
            <strong>2.1.</strong> A autorização abrange a utilização dos materiais para fins institucionais, promocionais, publicitários, informativos, históricos, documentais, comerciais e de portfólio, incluindo a divulgação das atividades, projetos, estrutura, serviços, artistas, produções e trabalhos realizados ou apoiados pela CÉU MUSIC.
          </p>
          <p>
            <strong>2.2.</strong> A utilização poderá ocorrer, exemplificativamente, em sites e páginas institucionais; Instagram, Facebook, TikTok, YouTube, X, LinkedIn e demais redes sociais, atuais ou futuras; plataformas digitais, aplicativos e serviços de streaming; canais oficiais da CÉU MUSIC e de seus projetos; portfólios físicos e digitais; apresentações comerciais e institucionais; press kits, releases, mídia kits e materiais destinados à imprensa; campanhas publicitárias e promocionais; anúncios e mídia patrocinada; materiais gráficos, impressos, eletrônicos e audiovisuais; newsletters, e-mails, apresentações, catálogos, retrospectivas e demais materiais institucionais; eventos, feiras, convenções, exposições, premiações e apresentações; documentários, making of, bastidores, teasers, trailers, cortes, chamadas e demais conteúdos promocionais; materiais destinados à divulgação do catálogo, portfólio, histórico e acervo da CÉU MUSIC; bem como em quaisquer outros meios de comunicação, distribuição, exibição ou divulgação existentes ou que venham a ser criados.
          </p>
        </div>

        {/* Cláusula 3 */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-white text-sm">3. EDIÇÃO E ADAPTAÇÃO</h3>
          <p>
            <strong>3.1.</strong> A CÉU MUSIC poderá realizar os ajustes técnicos e editoriais necessários à utilização autorizada, incluindo edição, montagem, cortes, redução, legendagem, inserção de identidade visual, logomarcas, créditos, trilhas, textos, formatos e adaptações necessárias às diferentes plataformas e mídias.
          </p>
          <p>
            <strong>3.2.</strong> A autorização prevista nesta cláusula não permite utilização que exponha o AUTORIZANTE a situação vexatória, ilícita, difamatória ou que desvirtue deliberadamente sua participação no projeto.
          </p>
        </div>

        {/* Cláusula 4 */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-white text-sm">4. TERRITÓRIO, PRAZO E MEIOS</h3>
          <p>
            <strong>4.1.</strong> A presente autorização é concedida para utilização no Brasil e no exterior, considerando a natureza global das plataformas digitais.
          </p>
          <p>
            <strong>4.2.</strong> A autorização é concedida pelo prazo de <strong>10 (dez) anos</strong>, contados da assinatura deste instrumento, permitindo-se, após esse período, a manutenção dos materiais já publicados no acervo histórico, institucional e portfólio da CÉU MUSIC, sem obrigação de exclusão de publicações pretéritas, ressalvadas as hipóteses previstas em lei.
          </p>
          <p>
            <strong>4.3.</strong> A autorização compreende todos os formatos, suportes, tecnologias e meios de comunicação atualmente existentes ou que venham a ser desenvolvidos durante sua vigência.
          </p>
        </div>

        {/* Cláusula 5 */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-white text-sm">5. GRATUIDADE E AUSÊNCIA DE PARTICIPAÇÃO FINANCEIRA</h3>
          <p>
            <strong>5.1.</strong> Salvo quando houver disposição expressa em contrato específico celebrado entre as partes, a presente autorização é concedida a título gratuito, não sendo devido ao AUTORIZANTE qualquer pagamento, cachê, royalty, participação, remuneração ou indenização em decorrência das utilizações previstas neste Termo.
          </p>
          <p>
            <strong>5.2.</strong> Eventual remuneração devida pela participação do AUTORIZANTE no projeto, quando existente, será regulada pelo contrato ou instrumento específico correspondente e não se confunde com a presente autorização de uso de imagem.
          </p>
        </div>

        {/* Cláusula 6 */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-white text-sm">6. PROJETOS INDEPENDENTES, COVERS E CONTEÚDOS DE TERCEIROS</h3>
          <p>
            <strong>6.1.</strong> Nos projetos independentes, covers ou produções realizadas por terceiros nas instalações, estúdios ou com apoio técnico da CÉU MUSIC, esta autorização não implica cessão à CÉU MUSIC da titularidade do projeto, fonograma, obra musical ou conteúdo audiovisual, salvo se houver instrumento específico dispondo em sentido contrário.
          </p>
          <p>
            <strong>6.2.</strong> A autorização permite, contudo, que a CÉU MUSIC utilize registros da participação do AUTORIZANTE e trechos razoáveis do projeto para fins de divulgação institucional, portfólio, demonstração de trabalhos realizados, publicidade dos serviços da gravadora/estúdio, redes sociais, catálogo histórico e promoção de suas atividades, nos limites deste Termo.
          </p>
          <p>
            <strong>6.3.</strong> Quando o projeto envolver obra musical, fonograma, fotografia, audiovisual ou qualquer outro conteúdo pertencente a terceiros, o AUTORIZANTE declara estar ciente de que a presente autorização se refere aos seus direitos de personalidade e à sua participação, não substituindo as autorizações eventualmente necessárias dos respectivos titulares de direitos autorais, conexos ou demais direitos de terceiros.
          </p>
        </div>

        {/* Cláusula 7 */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-white text-sm">7. DECLARAÇÕES DO AUTORIZANTE</h3>
          <p><strong>7.1. O AUTORIZANTE declara:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>a)</strong> possuir capacidade e legitimidade para conceder as autorizações previstas neste instrumento;</li>
            <li><strong>b)</strong> estar ciente das finalidades para as quais sua imagem, voz, nome e performance poderão ser utilizados;</li>
            <li><strong>c)</strong> que sua participação e autorização não violam, tanto quanto seja de seu conhecimento e responsabilidade, compromissos de exclusividade anteriormente assumidos com terceiros;</li>
            <li><strong>d)</strong> comprometer-se a informar previamente à CÉU MUSIC sobre eventual limitação contratual relevante que possa impedir determinada utilização de sua imagem, nome, voz ou performance.</li>
          </ul>
        </div>

        {/* Cláusula 8 */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-white text-sm">8. AUSÊNCIA DE VÍNCULO</h3>
          <p>
            <strong>8.1.</strong> A assinatura deste Termo, isoladamente, não estabelece vínculo empregatício, sociedade, representação, agenciamento, exclusividade ou qualquer relação diversa daquela decorrente da autorização ora concedida.
          </p>
        </div>

        {/* Cláusula 9 */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-white text-sm">9. PROTEÇÃO DE DADOS PESSOAIS (LGPD)</h3>
          <p>
            <strong>9.1.</strong> Os dados pessoais fornecidos neste Termo poderão ser tratados pela CÉU MUSIC para fins de identificação do AUTORIZANTE, comprovação e gestão da presente autorização, exercício regular de direitos e cumprimento de obrigações legais e contratuais, observada a legislação aplicável, inclusive a Lei nº 13.709/2018 – Lei Geral de Proteção de Dados Pessoais (LGPD).
          </p>
          <p>
            <strong>9.2.</strong> O tratamento da imagem, voz e demais elementos abrangidos por este instrumento observará as finalidades e limites aqui estabelecidos e a legislação aplicável.
          </p>
        </div>

        {/* Cláusula 10 */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-white text-sm">10. DISPOSIÇÕES GERAIS</h3>
          <p>
            <strong>10.1.</strong> A eventual tolerância de qualquer das partes quanto ao descumprimento de obrigação prevista neste Termo não constituirá renúncia, novação ou alteração das condições aqui estabelecidas.
          </p>
          <p>
            <strong>10.2.</strong> Caso qualquer disposição seja considerada inválida ou inexequível, as demais permanecerão válidas e eficazes.
          </p>
          <p>
            <strong>10.3.</strong> Este Termo poderá ser assinado física ou eletronicamente, reconhecendo as partes a validade jurídica das assinaturas eletrônicas admitidas pela legislação brasileira (Medida Provisória nº 2.200-2/2001 e Lei nº 14.063/2020).
          </p>
          <p>
            <strong>10.4.</strong> Havendo contrato específico entre o AUTORIZANTE e a CÉU MUSIC relativo ao projeto, as disposições daquele instrumento prevalecerão sobre este Termo em caso de conflito específico.
          </p>
        </div>
      </div>

      {/* Identificação do Projeto */}
      <div className="bg-dark-bg/80 p-4 rounded-xl border border-dark-border space-y-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-dark-border pb-2">
          <i className="ri-folder-music-line text-primary-teal"></i>
          IDENTIFICAÇÃO DO PROJETO / SESSÃO
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          <div>
            <span className="text-gray-400 block">Projeto / Produção:</span>
            <strong className="text-white text-sm">{data.projeto_nome || '-'}</strong>
          </div>
          <div>
            <span className="text-gray-400 block">Artista(s) Principal:</span>
            <strong className="text-white text-sm">{data.artista_principal || 'Céu Music'}</strong>
          </div>
          <div>
            <span className="text-gray-400 block">Data da Gravação:</span>
            <strong className="text-white">{formatDateBR(data.data_gravacao)}</strong>
          </div>
          <div>
            <span className="text-gray-400 block">Local:</span>
            <strong className="text-white">{data.local_gravacao || 'Estúdio Céu Music - Rio de Janeiro, RJ'}</strong>
          </div>
          <div className="sm:col-span-2">
            <span className="text-gray-400 block">Tipo de Participação:</span>
            <span className="inline-block mt-1 px-3 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold text-xs">
              {data.tipo_participacao || 'Convidado'} {data.tipo_participacao_outro ? `(${data.tipo_participacao_outro})` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Assinaturas */}
      <div className="pt-4 border-t border-dark-border space-y-4">
        <p className="text-xs text-center text-gray-400">
          Rio de Janeiro, {data.aceito_em ? formatDateBR(data.aceito_em) : new Date().toLocaleDateString('pt-BR')}.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Assinatura do Autorizante */}
          <div className="bg-dark-bg/90 p-4 rounded-xl border border-dark-border text-center flex flex-col justify-between min-h-[160px]">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Autorizante (Signatário)
              </p>
              {data.assinatura_digital ? (
                <div className="py-2 flex items-center justify-center">
                  <img
                    src={data.assinatura_digital}
                    alt="Assinatura Digital"
                    className="max-h-16 object-contain filter invert opacity-90"
                  />
                </div>
              ) : (
                <div className="py-6 text-gray-500 text-xs italic border-b border-dashed border-gray-700">
                  Assinatura pendente
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-dark-border/40">
              <strong className="text-white block text-sm">{data.autorizante_nome || 'AUTORIZANTE'}</strong>
              {data.autorizante_cpf && <span className="text-[11px] text-gray-400 block">CPF: {data.autorizante_cpf}</span>}
              {data.aceito_em && (
                <span className="text-[10px] text-emerald-400 block mt-1">
                  <i className="ri-checkbox-circle-fill mr-1"></i>
                  Assinado digitalmente em {formatDateTimeBR(data.aceito_em)}
                </span>
              )}
            </div>
          </div>

          {/* Assinatura Céu Music */}
          <div className="bg-dark-bg/90 p-4 rounded-xl border border-dark-border text-center flex flex-col justify-between min-h-[160px]">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Pela Licenciada
              </p>
              <div className="py-3 flex flex-col items-center justify-center">
                <span className="text-sm font-black bg-gradient-to-r from-teal-400 to-amber-300 bg-clip-text text-transparent">
                  CÉU MUSIC PRODUÇÕES
                </span>
                <span className="text-[10px] text-gray-500 font-mono mt-1">
                  Assinatura Eletrônica Registrada
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-dark-border/40">
              <strong className="text-white block text-sm">CÉU MUSIC PRODUÇÕES ARTÍSTICAS LTDA</strong>
              <span className="text-[11px] text-gray-400 block">CNPJ: 57.358.544/0001-47</span>
            </div>
          </div>
        </div>

        {/* Metadados de Autenticidade Digital */}
        {data.aceito_em && (
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 text-[11px] text-gray-300 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <i className="ri-shield-check-fill text-sm"></i>
              <span>CERTIFICADO DE VALIDADE DO ACEITE DIGITAL</span>
            </div>
            <p className="text-gray-400">
              Este termo foi assinado eletronicamente com ciência e consentimento expresso, nos termos da MP nº 2.200-2/2001 e Lei nº 14.063/2020.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 pt-1 font-mono text-[10px] text-gray-400">
              <span><strong>Data/Hora:</strong> {formatDateTimeBR(data.aceito_em)}</span>
              <span><strong>IP Origem:</strong> {data.ip_origem || 'Não registrado'}</span>
              <span><strong>Token Doc:</strong> {data.token ? `${data.token.slice(0, 16)}...` : '-'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
