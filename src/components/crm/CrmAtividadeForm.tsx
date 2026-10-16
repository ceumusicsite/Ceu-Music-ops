import { useEffect, useState } from 'react';
import CrmModal from './CrmModal';
import {
  TIPOS_ATIVIDADE,
  type EntradaAtividade,
  type FrequenciaRecorrencia,
} from '../../services/crm/activities';
import { formatarData } from '../../services/crm/formato';
import type { OpcaoUsuario } from '../../services/crm/usuarios';
import type { CrmAtividade, TipoAtividade } from '../../services/crm/types';

const CAMPO =
  'w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-smooth focus:border-primary-teal';
const ROTULO = 'mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500';

interface CrmAtividadeFormProps {
  aberto: boolean;
  atividade: CrmAtividade | null;
  usuarios: OpcaoUsuario[];
  negocios?: { id: string; titulo: string }[];
  pessoas?: { id: string; nome: string }[];
  organizacoes?: { id: string; nome: string }[];
  /** Quando a atividade nasce dentro de um negócio, o vínculo já vem fixo. */
  vinculoFixo?: { deal_id?: string; person_id?: string; organizacao_id?: string };
  salvando: boolean;
  onSalvar: (entrada: EntradaAtividade) => void;
  onFechar: () => void;
}

export default function CrmAtividadeForm({
  aberto,
  atividade,
  usuarios,
  negocios = [],
  pessoas = [],
  organizacoes = [],
  vinculoFixo,
  salvando,
  onSalvar,
  onFechar,
}: CrmAtividadeFormProps) {
  const [form, setForm] = useState<EntradaAtividade>(() => estadoInicial(null, vinculoFixo));
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (aberto) {
      setForm(estadoInicial(atividade, vinculoFixo));
      setErro('');
    }
  }, [aberto, atividade, vinculoFixo]);

  const alterar = (campo: keyof EntradaAtividade, valor: unknown) =>
    setForm((atual) => ({ ...atual, [campo]: valor }));

  const enviar = () => {
    if (form.assunto.trim() === '') {
      setErro('O assunto é obrigatório.');
      return;
    }
    onSalvar({ ...form, assunto: form.assunto.trim() });
  };

  return (
    <CrmModal
      titulo={atividade ? 'Editar atividade' : 'Nova atividade'}
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

      {/* Seletor de tipo em botões com ícone, como no Pipedrive */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TIPOS_ATIVIDADE.map((tipo) => (
          <button
            key={tipo.valor}
            type="button"
            onClick={() => alterar('tipo', tipo.valor)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-smooth ${
              form.tipo === tipo.valor
                ? 'border-primary-teal bg-primary-teal/15 font-medium text-primary-teal'
                : 'border-dark-border text-gray-400 hover:bg-dark-hover hover:text-white'
            }`}
          >
            <i className={tipo.icone} />
            {tipo.rotulo}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={ROTULO} htmlFor="atividade-assunto">Assunto *</label>
          <input
            id="atividade-assunto"
            className={CAMPO}
            value={form.assunto}
            onChange={(e) => alterar('assunto', e.target.value)}
            placeholder="Ex.: Ligar para alinhar a proposta"
          />
        </div>

        <div>
          <label className={ROTULO} htmlFor="atividade-data">Data</label>
          <input
            id="atividade-data"
            type="date"
            className={CAMPO}
            value={form.data ?? ''}
            onChange={(e) => alterar('data', e.target.value || null)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={ROTULO} htmlFor="atividade-hora">Hora</label>
            <input
              id="atividade-hora"
              type="time"
              className={CAMPO}
              value={form.hora ?? ''}
              onChange={(e) => alterar('hora', e.target.value || null)}
            />
          </div>
          <div>
            <label className={ROTULO} htmlFor="atividade-duracao">Duração (min)</label>
            <input
              id="atividade-duracao"
              type="number"
              min="0"
              step="15"
              className={CAMPO}
              value={form.duracao_minutos ?? ''}
              onChange={(e) =>
                alterar('duracao_minutos', e.target.value === '' ? null : Number(e.target.value))
              }
            />
          </div>
        </div>

        {/* Recorrência na área de data */}
        <div className="md:col-span-2 rounded-lg border border-dark-border bg-dark-bg/60 p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={ROTULO} htmlFor="atividade-recorrencia">
                <i className="ri-repeat-line mr-1 text-primary-teal" />
                Recorrência
              </label>
              <select
                id="atividade-recorrencia"
                className={CAMPO}
                value={form.recorrencia ?? 'nenhuma'}
                onChange={(e) => alterar('recorrencia', e.target.value as FrequenciaRecorrencia)}
              >
                <option value="nenhuma">Não se repete</option>
                <option value="diaria">Todos os dias (Diária)</option>
                <option value="dias_uteis">Dias úteis (Segunda a Sexta)</option>
                <option value="semanal">Semanalmente</option>
                <option value="quinzenal">A cada 2 semanas (Quinzenal)</option>
                <option value="mensal">Mensalmente</option>
              </select>
            </div>

            {form.recorrencia && form.recorrencia !== 'nenhuma' && (
              <div>
                <label className={ROTULO} htmlFor="atividade-repeticoes">
                  <i className="ri-calendar-check-line mr-1 text-primary-teal" />
                  Repetições
                </label>
                <select
                  id="atividade-repeticoes"
                  className={CAMPO}
                  value={form.recorrencia_repeticoes ?? 10}
                  onChange={(e) => alterar('recorrencia_repeticoes', Number(e.target.value))}
                >
                  <option value={5}>5 repetições</option>
                  <option value={10}>10 repetições (padrão)</option>
                  <option value={15}>15 repetições</option>
                  <option value={20}>20 repetições</option>
                  <option value={30}>30 repetições</option>
                  <option value={60}>60 repetições</option>
                </select>
              </div>
            )}
          </div>

          {form.recorrencia && form.recorrencia !== 'nenhuma' && (
            <div className="rounded-md bg-primary-teal/10 px-3 py-2 text-xs text-primary-teal flex items-center gap-2">
              <i className="ri-information-line text-sm shrink-0" />
              <span>
                {form.data ? (
                  <>
                    Serão geradas <strong>{form.recorrencia_repeticoes ?? 10}</strong> tarefas com recorrência <strong>{obterRotuloRecorrencia(form.recorrencia)}</strong> a partir de <strong>{formatarData(form.data)}</strong>.
                  </>
                ) : (
                  'Defina a data acima para gerar as repetições automaticamente.'
                )}
              </span>
            </div>
          )}
        </div>

        {!vinculoFixo && (
          <>
            <div>
              <label className={ROTULO} htmlFor="atividade-negocio">Negócio</label>
              <select
                id="atividade-negocio"
                className={CAMPO}
                value={form.deal_id ?? ''}
                onChange={(e) => alterar('deal_id', e.target.value || null)}
              >
                <option value="">—</option>
                {negocios.map((n) => (
                  <option key={n.id} value={n.id}>{n.titulo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={ROTULO} htmlFor="atividade-pessoa">Pessoa de contato</label>
              <select
                id="atividade-pessoa"
                className={CAMPO}
                value={form.person_id ?? ''}
                onChange={(e) => alterar('person_id', e.target.value || null)}
              >
                <option value="">—</option>
                {pessoas.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={ROTULO} htmlFor="atividade-org">Organização</label>
              <select
                id="atividade-org"
                className={CAMPO}
                value={form.organizacao_id ?? ''}
                onChange={(e) => alterar('organizacao_id', e.target.value || null)}
              >
                <option value="">—</option>
                {organizacoes.map((o) => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <label className={ROTULO} htmlFor="atividade-dono">Responsável</label>
          <select
            id="atividade-dono"
            className={CAMPO}
            value={form.dono_id ?? ''}
            onChange={(e) => alterar('dono_id', e.target.value || null)}
          >
            <option value="">—</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className={ROTULO} htmlFor="atividade-local">Local</label>
          <input
            id="atividade-local"
            className={CAMPO}
            value={form.local ?? ''}
            onChange={(e) => alterar('local', e.target.value)}
            placeholder="Ex.: Estúdio Céu, Google Meet"
          />
        </div>

        <div className="md:col-span-2">
          <label className={ROTULO} htmlFor="atividade-nota">Anotação</label>
          <textarea
            id="atividade-nota"
            rows={3}
            className={CAMPO}
            value={form.nota ?? ''}
            onChange={(e) => alterar('nota', e.target.value)}
          />
        </div>
      </div>
    </CrmModal>
  );
}

function estadoInicial(
  atividade: CrmAtividade | null,
  vinculoFixo?: { deal_id?: string; person_id?: string; organizacao_id?: string }
): EntradaAtividade {
  if (!atividade) {
    return {
      tipo: 'tarefa' as TipoAtividade,
      assunto: '',
      nota: '',
      local: '',
      data: new Date().toISOString().slice(0, 10),
      hora: null,
      duracao_minutos: null,
      dono_id: null,
      deal_id: vinculoFixo?.deal_id ?? null,
      person_id: vinculoFixo?.person_id ?? null,
      organizacao_id: vinculoFixo?.organizacao_id ?? null,
      recorrencia: 'nenhuma',
      recorrencia_repeticoes: 10,
    };
  }

  return {
    tipo: atividade.tipo,
    assunto: atividade.assunto,
    nota: atividade.nota ?? '',
    local: atividade.local ?? '',
    data: atividade.data ?? null,
    hora: atividade.hora ?? null,
    duracao_minutos: atividade.duracao_minutos ?? null,
    dono_id: atividade.dono_id ?? null,
    deal_id: atividade.deal_id ?? null,
    person_id: atividade.person_id ?? null,
    organizacao_id: atividade.organizacao_id ?? null,
    recorrencia: (atividade.recorrencia as FrequenciaRecorrencia) ?? 'nenhuma',
    recorrencia_repeticoes: 10,
  };
}

function obterRotuloRecorrencia(frequencia?: FrequenciaRecorrencia | null): string {
  switch (frequencia) {
    case 'diaria':
      return 'diária (todos os dias)';
    case 'dias_uteis':
      return 'em dias úteis (segunda a sexta)';
    case 'semanal':
      return 'semanal';
    case 'quinzenal':
      return 'quinzenal';
    case 'mensal':
      return 'mensal';
    default:
      return '';
  }
}

