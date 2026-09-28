import { useEffect, useState } from 'react';
import CrmModal from './CrmModal';
import type { EntradaPessoa } from '../../services/crm/persons';
import type { OpcaoUsuario } from '../../services/crm/usuarios';
import type { CrmEmail, CrmPessoa, CrmTelefone, RotuloEmail, RotuloTelefone } from '../../services/crm/types';

const ROTULOS_EMAIL: RotuloEmail[] = ['comercial', 'casa', 'outro'];
const ROTULOS_TELEFONE: RotuloTelefone[] = ['trabalho', 'casa', 'celular', 'outro'];

// Sem largura: quem usa decide. Misturar w-full com w-32 na mesma string deixa
// o Tailwind escolher pela ordem do CSS gerado, e w-full vencia, quebrando as
// linhas repetíveis de e-mail e telefone.
const CAMPO_BASE =
  'rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-smooth focus:border-primary-teal';
const CAMPO = `w-full ${CAMPO_BASE}`;
const ROTULO = 'mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500';

interface CrmPessoaFormProps {
  aberto: boolean;
  pessoa: CrmPessoa | null;
  organizacoes: { id: string; nome: string }[];
  usuarios: OpcaoUsuario[];
  salvando: boolean;
  onSalvar: (entrada: EntradaPessoa) => void;
  onFechar: () => void;
}

const EMAIL_VAZIO: CrmEmail = { email: '', rotulo: 'comercial', principal: true };
const TELEFONE_VAZIO: CrmTelefone = { telefone: '', rotulo: 'trabalho', principal: true };

export default function CrmPessoaForm({
  aberto,
  pessoa,
  organizacoes,
  usuarios,
  salvando,
  onSalvar,
  onFechar,
}: CrmPessoaFormProps) {
  const [form, setForm] = useState<EntradaPessoa>(estadoInicial(null));
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (aberto) {
      setForm(estadoInicial(pessoa));
      setErro('');
    }
  }, [aberto, pessoa]);

  const alterar = (campo: keyof EntradaPessoa, valor: unknown) =>
    setForm((atual) => ({ ...atual, [campo]: valor }));

  const enviar = () => {
    if (form.nome.trim() === '') {
      setErro('O nome é obrigatório.');
      return;
    }
    onSalvar({ ...form, nome: form.nome.trim() });
  };

  return (
    <CrmModal
      titulo={pessoa ? 'Editar pessoa' : 'Nova pessoa'}
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
          <label className={ROTULO} htmlFor="pessoa-nome">Nome *</label>
          <input
            id="pessoa-nome"
            className={CAMPO}
            value={form.nome}
            onChange={(e) => alterar('nome', e.target.value)}
            placeholder="Nome do contato"
          />
        </div>

        <div>
          <label className={ROTULO} htmlFor="pessoa-org">Organização</label>
          <select
            id="pessoa-org"
            className={CAMPO}
            value={form.organizacao_id ?? ''}
            onChange={(e) => alterar('organizacao_id', e.target.value || null)}
          >
            <option value="">—</option>
            {organizacoes.map((org) => (
              <option key={org.id} value={org.id}>{org.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={ROTULO} htmlFor="pessoa-cargo">Cargo</label>
          <input
            id="pessoa-cargo"
            className={CAMPO}
            value={form.cargo ?? ''}
            onChange={(e) => alterar('cargo', e.target.value)}
          />
        </div>

        <div>
          <label className={ROTULO} htmlFor="pessoa-dono">Responsável</label>
          <select
            id="pessoa-dono"
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
          <label className={ROTULO} htmlFor="pessoa-aniversario">Aniversário</label>
          <input
            id="pessoa-aniversario"
            type="date"
            className={CAMPO}
            value={form.aniversario ?? ''}
            onChange={(e) => alterar('aniversario', e.target.value || null)}
          />
        </div>
      </div>

      {/* E-mails e telefones repetíveis, como no Pipedrive */}
      <ListaContatos
        titulo="E-mails"
        itens={form.emails}
        rotulos={ROTULOS_EMAIL}
        chaveValor="email"
        placeholder="email@empresa.com"
        onChange={(emails) => alterar('emails', emails)}
        criarVazio={() => ({ ...EMAIL_VAZIO, principal: false })}
      />

      <ListaContatos
        titulo="Telefones"
        itens={form.telefones}
        rotulos={ROTULOS_TELEFONE}
        chaveValor="telefone"
        placeholder="(00) 00000-0000"
        onChange={(telefones) => alterar('telefones', telefones)}
        criarVazio={() => ({ ...TELEFONE_VAZIO, principal: false })}
      />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className={ROTULO} htmlFor="pessoa-cidade">Cidade</label>
          <input
            id="pessoa-cidade"
            className={CAMPO}
            value={form.cidade ?? ''}
            onChange={(e) => alterar('cidade', e.target.value)}
          />
        </div>
        <div>
          <label className={ROTULO} htmlFor="pessoa-estado">Estado</label>
          <input
            id="pessoa-estado"
            className={CAMPO}
            value={form.estado ?? ''}
            onChange={(e) => alterar('estado', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className={ROTULO} htmlFor="pessoa-obs">Observações</label>
          <textarea
            id="pessoa-obs"
            rows={3}
            className={CAMPO}
            value={form.observacoes ?? ''}
            onChange={(e) => alterar('observacoes', e.target.value)}
          />
        </div>
      </div>
    </CrmModal>
  );
}

/** Lista repetível de e-mails ou telefones, cada linha com valor + rótulo. */
function ListaContatos<T extends CrmEmail | CrmTelefone>({
  titulo,
  itens,
  rotulos,
  chaveValor,
  placeholder,
  onChange,
  criarVazio,
}: {
  titulo: string;
  itens: T[];
  rotulos: string[];
  chaveValor: 'email' | 'telefone';
  placeholder: string;
  onChange: (itens: T[]) => void;
  criarVazio: () => T;
}) {
  const atualizar = (indice: number, mudanca: Partial<T>) =>
    onChange(itens.map((item, i) => (i === indice ? { ...item, ...mudanca } : item)));

  const remover = (indice: number) => {
    const restantes = itens.filter((_, i) => i !== indice);
    // Sempre mantém alguém como principal para a lista não ficar sem destaque.
    if (restantes.length > 0 && !restantes.some((item) => item.principal)) {
      restantes[0] = { ...restantes[0], principal: true };
    }
    onChange(restantes);
  };

  const definirPrincipal = (indice: number) =>
    onChange(itens.map((item, i) => ({ ...item, principal: i === indice })));

  return (
    <fieldset className="mt-5">
      <legend className={ROTULO}>{titulo}</legend>
      <div className="space-y-2">
        {itens.map((item, indice) => (
          <div key={indice} className="flex items-center gap-2">
            <input
              className={`${CAMPO_BASE} min-w-0 flex-1`}
              placeholder={placeholder}
              value={campoTexto(item, chaveValor)}
              onChange={(e) => atualizar(indice, { [chaveValor]: e.target.value } as Partial<T>)}
            />
            <select
              className={`${CAMPO_BASE} w-32 shrink-0`}
              value={item.rotulo}
              onChange={(e) => atualizar(indice, { rotulo: e.target.value } as Partial<T>)}
              aria-label={`Rótulo do ${titulo.toLowerCase()}`}
            >
              {rotulos.map((rotulo) => (
                <option key={rotulo} value={rotulo}>
                  {rotulo.charAt(0).toUpperCase() + rotulo.slice(1)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => definirPrincipal(indice)}
              title="Definir como principal"
              className={`rounded p-2 transition-smooth ${
                item.principal ? 'text-primary-teal' : 'text-gray-600 hover:text-gray-300'
              }`}
            >
              <i className={item.principal ? 'ri-star-fill' : 'ri-star-line'} />
            </button>
            <button
              type="button"
              onClick={() => remover(indice)}
              aria-label="Remover"
              className="rounded p-2 text-gray-500 transition-smooth hover:bg-dark-hover hover:text-red-400"
            >
              <i className="ri-close-line" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange([...itens, criarVazio()])}
        className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary-teal hover:underline"
      >
        <i className="ri-add-line" />
        Adicionar {titulo.toLowerCase().slice(0, -1)}
      </button>
    </fieldset>
  );
}

/** Lê 'email' ou 'telefone' da união sem precisar separar os dois formulários. */
function campoTexto(item: CrmEmail | CrmTelefone, chave: 'email' | 'telefone'): string {
  if (chave === 'email') return 'email' in item ? item.email : '';
  return 'telefone' in item ? item.telefone : '';
}

function estadoInicial(pessoa: CrmPessoa | null): EntradaPessoa {
  if (!pessoa) {
    return {
      nome: '',
      organizacao_id: null,
      dono_id: null,
      cargo: '',
      endereco: '',
      cidade: '',
      estado: '',
      aniversario: null,
      observacoes: '',
      emails: [{ ...EMAIL_VAZIO }],
      telefones: [{ ...TELEFONE_VAZIO }],
    };
  }

  return {
    nome: pessoa.nome,
    organizacao_id: pessoa.organizacao_id ?? null,
    dono_id: pessoa.dono_id ?? null,
    cargo: pessoa.cargo ?? '',
    endereco: pessoa.endereco ?? '',
    cidade: pessoa.cidade ?? '',
    estado: pessoa.estado ?? '',
    aniversario: pessoa.aniversario ?? null,
    observacoes: pessoa.observacoes ?? '',
    emails: pessoa.emails.length > 0 ? pessoa.emails.map((e) => ({ ...e })) : [{ ...EMAIL_VAZIO }],
    telefones:
      pessoa.telefones.length > 0 ? pessoa.telefones.map((t) => ({ ...t })) : [{ ...TELEFONE_VAZIO }],
  };
}
