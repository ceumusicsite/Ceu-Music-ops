import { useEffect, useState } from 'react';
import CrmModal from './CrmModal';
import CrmCamposPersonalizados from './CrmCamposPersonalizados';
import {
  listarCampos,
  primeiroObrigatorioVazio,
  type CrmCampoPersonalizado,
} from '../../services/crm/customFields';
import type { EntradaNegocio } from '../../services/crm/deals';
import { criarPessoa } from '../../services/crm/persons';
import { criarOrganizacao } from '../../services/crm/organizations';
import type { OpcaoUsuario } from '../../services/crm/usuarios';
import type { CrmEtapa, CrmNegocio } from '../../services/crm/types';

const CAMPO =
  'w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-smooth focus:border-primary-teal';
const ROTULO = 'mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500';

interface CrmNegocioFormProps {
  aberto: boolean;
  negocio: CrmNegocio | null;
  pipelineId: string;
  /** Etapa pré-selecionada quando o usuário clica em "+ Negócio" dentro de uma coluna. */
  etapaInicialId?: string;
  etapas: CrmEtapa[];
  pessoas: { id: string; nome: string }[];
  organizacoes: { id: string; nome: string }[];
  usuarios: OpcaoUsuario[];
  salvando: boolean;
  onSalvar: (entrada: EntradaNegocio) => void;
  onFechar: () => void;
}

export default function CrmNegocioForm({
  aberto,
  negocio,
  pipelineId,
  etapaInicialId,
  etapas,
  pessoas,
  organizacoes,
  usuarios,
  salvando,
  onSalvar,
  onFechar,
}: CrmNegocioFormProps) {
  const [form, setForm] = useState<EntradaNegocio>(() => estadoInicial(null, pipelineId, etapas, etapaInicialId));
  const [erro, setErro] = useState('');
  const [campos, setCampos] = useState<CrmCampoPersonalizado[]>([]);
  const [criandoPessoa, setCriandoPessoa] = useState(false);
  const [novaPessoaNome, setNovaPessoaNome] = useState('');
  const [criandoOrg, setCriandoOrg] = useState(false);
  const [novaOrgNome, setNovaOrgNome] = useState('');

  useEffect(() => {
    listarCampos('negocio')
      .then(setCampos)
      .catch((e) => console.error('Erro ao carregar campos personalizados:', e));
  }, []);

  useEffect(() => {
    if (aberto) {
      setForm(estadoInicial(negocio, pipelineId, etapas, etapaInicialId));
      setErro('');
      setCriandoPessoa(false);
      setNovaPessoaNome('');
      setCriandoOrg(false);
      setNovaOrgNome('');
    }
  }, [aberto, negocio, pipelineId, etapas, etapaInicialId]);

  const alterar = (campo: keyof EntradaNegocio, valor: unknown) =>
    setForm((atual) => ({ ...atual, [campo]: valor }));

  const enviar = async () => {
    if (form.titulo.trim() === '') {
      setErro('O título do negócio é obrigatório.');
      return;
    }
    if (!form.stage_id) {
      setErro('Escolha uma etapa.');
      return;
    }

    const faltando = primeiroObrigatorioVazio(campos, form.custom_fields ?? {});
    if (faltando) {
      setErro(`O campo "${faltando}" é obrigatório.`);
      return;
    }

    let orgIdFinal = form.organizacao_id;
    if (criandoOrg && novaOrgNome.trim()) {
      try {
        const criada = await criarOrganizacao({ nome: novaOrgNome.trim() });
        orgIdFinal = criada.id;
      } catch (err) {
        console.error('Erro ao criar organização:', err);
      }
    }

    let personIdFinal = form.person_id;
    if (criandoPessoa && novaPessoaNome.trim()) {
      try {
        const criada = await criarPessoa({
          nome: novaPessoaNome.trim(),
          organizacao_id: orgIdFinal,
          dono_id: form.dono_id,
        });
        personIdFinal = criada.id;
      } catch (err) {
        console.error('Erro ao criar pessoa:', err);
      }
    }

    onSalvar({
      ...form,
      titulo: form.titulo.trim(),
      organizacao_id: orgIdFinal,
      person_id: personIdFinal,
    });
  };

  return (
    <CrmModal
      titulo={negocio ? 'Editar negócio' : 'Novo negócio'}
      aberto={aberto}
      onFechar={onFechar}
      rodape={
        <>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-smooth hover:bg-dark-hover hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={enviar}
            disabled={salvando}
            className="rounded-lg bg-primary-teal px-4 py-2 text-sm font-semibold text-white transition-smooth hover:opacity-90 disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </>
      }
    >
      {erro && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {erro}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={ROTULO} htmlFor="negocio-titulo">Título *</label>
          <input
            id="negocio-titulo"
            className={CAMPO}
            value={form.titulo}
            onChange={(e) => alterar('titulo', e.target.value)}
            placeholder="Ex.: Campanha de lançamento — Single de outubro"
          />
        </div>

        <div>
          <label className={ROTULO} htmlFor="negocio-valor">Valor (R$)</label>
          <input
            id="negocio-valor"
            type="number"
            min="0"
            step="0.01"
            className={CAMPO}
            value={form.valor}
            onChange={(e) => alterar('valor', Number(e.target.value))}
          />
        </div>

        <div>
          <label className={ROTULO} htmlFor="negocio-etapa">Etapa *</label>
          <select
            id="negocio-etapa"
            className={CAMPO}
            value={form.stage_id}
            onChange={(e) => alterar('stage_id', e.target.value)}
          >
            {etapas.map((etapa) => (
              <option key={etapa.id} value={etapa.id}>{etapa.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className={ROTULO} htmlFor="negocio-org">Organização</label>
            <button
              type="button"
              onClick={() => {
                setCriandoOrg(!criandoOrg);
                setNovaOrgNome('');
              }}
              className="text-xs text-primary-teal hover:underline"
            >
              {criandoOrg ? 'Selecionar existente' : '+ Nova organização'}
            </button>
          </div>
          {criandoOrg ? (
            <input
              id="negocio-org-novo"
              className={CAMPO}
              placeholder="Nome da organização…"
              value={novaOrgNome}
              onChange={(e) => setNovaOrgNome(e.target.value)}
            />
          ) : (
            <select
              id="negocio-org"
              className={CAMPO}
              value={form.organizacao_id ?? ''}
              onChange={(e) => alterar('organizacao_id', e.target.value || null)}
            >
              <option value="">—</option>
              {organizacoes.map((org) => (
                <option key={org.id} value={org.id}>{org.nome}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className={ROTULO} htmlFor="negocio-pessoa">Pessoa de contato</label>
            <button
              type="button"
              onClick={() => {
                setCriandoPessoa(!criandoPessoa);
                setNovaPessoaNome('');
              }}
              className="text-xs text-primary-teal hover:underline"
            >
              {criandoPessoa ? 'Selecionar existente' : '+ Nova pessoa'}
            </button>
          </div>
          {criandoPessoa ? (
            <input
              id="negocio-pessoa-novo"
              className={CAMPO}
              placeholder="Nome da pessoa de contato…"
              value={novaPessoaNome}
              onChange={(e) => setNovaPessoaNome(e.target.value)}
            />
          ) : (
            <select
              id="negocio-pessoa"
              className={CAMPO}
              value={form.person_id ?? ''}
              onChange={(e) => alterar('person_id', e.target.value || null)}
            >
              <option value="">—</option>
              {pessoas.map((pessoa) => (
                <option key={pessoa.id} value={pessoa.id}>{pessoa.nome}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className={ROTULO} htmlFor="negocio-dono">Responsável</label>
          <select
            id="negocio-dono"
            className={CAMPO}
            value={form.dono_id ?? ''}
            onChange={(e) => alterar('dono_id', e.target.value || null)}
          >
            <option value="">—</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>{usuario.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={ROTULO} htmlFor="negocio-prazo">Previsão de fechamento</label>
          <input
            id="negocio-prazo"
            type="date"
            className={CAMPO}
            value={form.data_prevista_fechamento ?? ''}
            onChange={(e) => alterar('data_prevista_fechamento', e.target.value || null)}
          />
        </div>

        <div className="md:col-span-2">
          <label className={ROTULO} htmlFor="negocio-origem">Origem</label>
          <input
            id="negocio-origem"
            className={CAMPO}
            value={form.origem ?? ''}
            onChange={(e) => alterar('origem', e.target.value)}
            placeholder="Ex.: Indicação, Instagram, Evento"
          />
        </div>
      </div>

      <CrmCamposPersonalizados
        campos={campos}
        valores={form.custom_fields ?? {}}
        usuarios={usuarios}
        onChange={(valores) => alterar('custom_fields', valores)}
      />
    </CrmModal>
  );
}

function estadoInicial(
  negocio: CrmNegocio | null,
  pipelineId: string,
  etapas: CrmEtapa[],
  etapaInicialId?: string
): EntradaNegocio {
  if (!negocio) {
    return {
      titulo: '',
      valor: 0,
      moeda: 'BRL',
      pipeline_id: pipelineId,
      stage_id: etapaInicialId ?? etapas[0]?.id ?? '',
      person_id: null,
      organizacao_id: null,
      dono_id: null,
      origem: '',
      data_prevista_fechamento: null,
      custom_fields: {},
    };
  }

  return {
    titulo: negocio.titulo,
    valor: negocio.valor,
    moeda: negocio.moeda,
    pipeline_id: negocio.pipeline_id,
    stage_id: negocio.stage_id,
    person_id: negocio.person_id ?? null,
    organizacao_id: negocio.organizacao_id ?? null,
    dono_id: negocio.dono_id ?? null,
    origem: negocio.origem ?? '',
    data_prevista_fechamento: negocio.data_prevista_fechamento ?? null,
    custom_fields: negocio.custom_fields ?? {},
  };
}
