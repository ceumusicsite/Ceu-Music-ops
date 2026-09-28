import { useCallback, useEffect, useState } from 'react';
import CrmLayout from '../../../components/crm/CrmLayout';
import { CRM_SUBITENS_CONFIGURACOES } from '../../../components/crm/navegacao';
import CrmModal from '../../../components/crm/CrmModal';
import {
  atualizarCampo,
  criarCampo,
  excluirCampo,
  listarTodosOsCampos,
  reordenarCampos,
  tipoTemOpcoes,
  TIPOS_CAMPO,
  type CrmCampoPersonalizado,
  type TipoCampo,
} from '../../../services/crm/customFields';
import type { CrmEntidade } from '../../../services/crm/types';

const CAMPO =
  'w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-smooth focus:border-primary-teal';
const ROTULO = 'mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500';

const ENTIDADES: { valor: CrmEntidade; rotulo: string }[] = [
  { valor: 'negocio', rotulo: 'Negócios' },
  { valor: 'pessoa', rotulo: 'Pessoas' },
  { valor: 'organizacao', rotulo: 'Organizações' },
  { valor: 'lead', rotulo: 'Leads' },
];

export default function CrmCamposPersonalizadosPage() {
  const [entidade, setEntidade] = useState<CrmEntidade>('negocio');
  const [campos, setCampos] = useState<CrmCampoPersonalizado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [formAberto, setFormAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoCampo>('texto');
  const [opcoesTexto, setOpcoesTexto] = useState('');
  const [obrigatorio, setObrigatorio] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<CrmCampoPersonalizado | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      setCampos(await listarTodosOsCampos(entidade));
    } catch (e) {
      console.error('Erro ao carregar campos:', e);
      setErro('Não foi possível carregar os campos personalizados.');
    } finally {
      setCarregando(false);
    }
  }, [entidade]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const mover = async (indice: number, direcao: -1 | 1) => {
    const destino = indice + direcao;
    if (destino < 0 || destino >= campos.length) return;

    const reordenados = [...campos];
    [reordenados[indice], reordenados[destino]] = [reordenados[destino], reordenados[indice]];
    setCampos(reordenados);

    try {
      await reordenarCampos(reordenados.map((c) => c.id));
    } catch (e) {
      console.error('Erro ao reordenar campos:', e);
      await carregar();
    }
  };

  const salvar = async () => {
    if (nome.trim() === '') {
      setErro('O nome do campo é obrigatório.');
      return;
    }

    const opcoes = opcoesTexto
      .split('\n')
      .map((linha) => linha.trim())
      .filter(Boolean);

    if (tipoTemOpcoes(tipo) && opcoes.length === 0) {
      setErro('Informe ao menos uma opção para este tipo de campo.');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      await criarCampo({ entidade, nome, tipo, opcoes, obrigatorio });
      setFormAberto(false);
      setNome('');
      setTipo('texto');
      setOpcoesTexto('');
      setObrigatorio(false);
      await carregar();
    } catch (e) {
      console.error('Erro ao criar campo:', e);
      setErro('Não foi possível criar o campo.');
    } finally {
      setSalvando(false);
    }
  };

  const rotuloTipo = (valor: TipoCampo) =>
    TIPOS_CAMPO.find((t) => t.valor === valor)?.rotulo ?? valor;

  return (
    <CrmLayout
      modulo="Configurações"
      titulo="Campos personalizados"
      subItens={CRM_SUBITENS_CONFIGURACOES}
      resumo="Campos extras que aparecem nos formulários de cada módulo"
      acoes={
        <button
          type="button"
          onClick={() => setFormAberto(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-teal px-4 py-2.5 text-sm font-semibold text-white transition-smooth hover:opacity-90"
        >
          <i className="ri-add-line text-base" />
          Campo
        </button>
      }
    >
      {erro && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-dark-border pb-3">
        {ENTIDADES.map((item) => (
          <button
            key={item.valor}
            type="button"
            onClick={() => setEntidade(item.valor)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-smooth ${
              entidade === item.valor
                ? 'bg-primary-teal/15 font-medium text-primary-teal'
                : 'text-gray-400 hover:bg-dark-hover hover:text-white'
            }`}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-dark-border bg-dark-card">
        {carregando ? (
          <div className="p-10 text-center text-gray-500">
            <i className="ri-loader-4-line animate-spin text-2xl" />
          </div>
        ) : campos.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <i className="ri-input-field text-3xl text-gray-600" />
            <p className="mt-2 text-sm">
              Nenhum campo personalizado para {ENTIDADES.find((e) => e.valor === entidade)?.rotulo}.
            </p>
          </div>
        ) : (
          <ul>
            {campos.map((campo, indice) => (
              <li
                key={campo.id}
                className="flex flex-wrap items-center gap-3 border-b border-dark-border/60 px-4 py-3 last:border-0"
              >
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => mover(indice, -1)}
                    disabled={indice === 0}
                    aria-label="Subir campo"
                    className="text-gray-500 transition-smooth hover:text-primary-teal disabled:opacity-25"
                  >
                    <i className="ri-arrow-up-s-line" />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(indice, 1)}
                    disabled={indice === campos.length - 1}
                    aria-label="Descer campo"
                    className="text-gray-500 transition-smooth hover:text-primary-teal disabled:opacity-25"
                  >
                    <i className="ri-arrow-down-s-line" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <p className={campo.ativo ? 'text-sm text-white' : 'text-sm text-gray-500'}>
                    {campo.nome}
                    {campo.obrigatorio && <span className="ml-1 text-red-400">*</span>}
                    {!campo.ativo && <span className="ml-2 text-xs text-gray-600">oculto</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {rotuloTipo(campo.tipo)}
                    {campo.opcoes.length > 0 && ` · ${campo.opcoes.length} opções`}
                    {' · chave '}
                    <code className="text-gray-600">{campo.chave}</code>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await atualizarCampo(campo.id, { ativo: !campo.ativo });
                    await carregar();
                  }}
                  className="rounded-lg border border-dark-border px-3 py-1.5 text-xs text-gray-300 transition-smooth hover:bg-dark-hover hover:text-white"
                >
                  {campo.ativo ? 'Ocultar' : 'Mostrar'}
                </button>

                <button
                  type="button"
                  onClick={() => setParaExcluir(campo)}
                  aria-label={`Excluir ${campo.nome}`}
                  className="rounded p-1.5 text-gray-600 transition-smooth hover:bg-dark-hover hover:text-red-400"
                >
                  <i className="ri-delete-bin-line" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-600">
        Os valores ficam na coluna <code>custom_fields</code> de cada registro. Ocultar um campo
        preserva o que já foi preenchido; excluir remove só a definição.
      </p>

      <CrmModal
        titulo="Novo campo personalizado"
        aberto={formAberto}
        onFechar={() => setFormAberto(false)}
        largura="max-w-lg"
        rodape={
          <>
            <button
              type="button"
              onClick={() => setFormAberto(false)}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="rounded-lg bg-primary-teal px-4 py-2 text-sm font-semibold text-white transition-smooth hover:opacity-90 disabled:opacity-50"
            >
              {salvando ? 'Salvando…' : 'Criar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={ROTULO} htmlFor="campo-nome">Nome *</label>
            <input
              id="campo-nome"
              className={CAMPO}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Gênero musical"
            />
          </div>

          <div>
            <label className={ROTULO} htmlFor="campo-tipo">Tipo</label>
            <select
              id="campo-tipo"
              className={CAMPO}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoCampo)}
            >
              {TIPOS_CAMPO.map((item) => (
                <option key={item.valor} value={item.valor}>{item.rotulo}</option>
              ))}
            </select>
          </div>

          {tipoTemOpcoes(tipo) && (
            <div>
              <label className={ROTULO} htmlFor="campo-opcoes">Opções (uma por linha)</label>
              <textarea
                id="campo-opcoes"
                rows={4}
                className={CAMPO}
                value={opcoesTexto}
                onChange={(e) => setOpcoesTexto(e.target.value)}
                placeholder={'Gospel\nMPB\nSertanejo'}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              id="campo-obrigatorio"
              type="checkbox"
              checked={obrigatorio}
              onChange={(e) => setObrigatorio(e.target.checked)}
              className="h-4 w-4 accent-primary-teal"
            />
            <label htmlFor="campo-obrigatorio" className="text-sm text-gray-300">
              Obrigatório ao salvar
            </label>
          </div>
        </div>
      </CrmModal>

      <CrmModal
        titulo="Excluir campo"
        aberto={paraExcluir !== null}
        onFechar={() => setParaExcluir(null)}
        largura="max-w-md"
        rodape={
          <>
            <button
              type="button"
              onClick={() => setParaExcluir(null)}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                if (paraExcluir) await excluirCampo(paraExcluir.id);
                setParaExcluir(null);
                await carregar();
              }}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-smooth hover:bg-red-600"
            >
              Excluir
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-300">
          O campo <strong className="text-white">{paraExcluir?.nome}</strong> deixa de aparecer nos
          formulários. Os valores já gravados continuam nos registros, mas ficam sem rótulo. Para
          apenas tirá-lo de vista, use <strong className="text-white">Ocultar</strong>.
        </p>
      </CrmModal>
    </CrmLayout>
  );
}
