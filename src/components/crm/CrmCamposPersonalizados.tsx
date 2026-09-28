import type { CrmCampoPersonalizado } from '../../services/crm/customFields';
import type { OpcaoUsuario } from '../../services/crm/usuarios';

const CAMPO =
  'w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-smooth focus:border-primary-teal';
const ROTULO = 'mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500';

interface CrmCamposPersonalizadosProps {
  campos: CrmCampoPersonalizado[];
  valores: Record<string, unknown>;
  usuarios?: OpcaoUsuario[];
  onChange: (valores: Record<string, unknown>) => void;
}

/** Renderiza os campos definidos em Configurações › Campos personalizados. */
export default function CrmCamposPersonalizados({
  campos,
  valores,
  usuarios = [],
  onChange,
}: CrmCamposPersonalizadosProps) {
  if (campos.length === 0) return null;

  const alterar = (chave: string, valor: unknown) => onChange({ ...valores, [chave]: valor });

  return (
    <div className="mt-5 border-t border-dark-border pt-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Campos personalizados
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {campos.map((campo) => {
          const id = `campo-${campo.chave}`;
          const valor = valores[campo.chave];
          const rotulo = (
            <label className={ROTULO} htmlFor={id}>
              {campo.nome}
              {campo.obrigatorio && ' *'}
            </label>
          );

          if (campo.tipo === 'checkbox') {
            return (
              <div key={campo.id} className="flex items-center gap-2 pt-5">
                <input
                  id={id}
                  type="checkbox"
                  checked={valor === true}
                  onChange={(e) => alterar(campo.chave, e.target.checked)}
                  className="h-4 w-4 accent-primary-teal"
                />
                <label htmlFor={id} className="text-sm text-gray-300">
                  {campo.nome}
                  {campo.obrigatorio && ' *'}
                </label>
              </div>
            );
          }

          if (campo.tipo === 'lista_multipla') {
            const selecionados = Array.isArray(valor) ? (valor as string[]) : [];
            return (
              <div key={campo.id} className="md:col-span-2">
                <span className={ROTULO}>
                  {campo.nome}
                  {campo.obrigatorio && ' *'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {campo.opcoes.map((opcao) => {
                    const ativo = selecionados.includes(opcao);
                    return (
                      <button
                        key={opcao}
                        type="button"
                        onClick={() =>
                          alterar(
                            campo.chave,
                            ativo
                              ? selecionados.filter((o) => o !== opcao)
                              : [...selecionados, opcao]
                          )
                        }
                        className={`rounded-lg border px-3 py-1.5 text-sm transition-smooth ${
                          ativo
                            ? 'border-primary-teal bg-primary-teal/15 font-medium text-primary-teal'
                            : 'border-dark-border text-gray-400 hover:bg-dark-hover'
                        }`}
                      >
                        {opcao}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (campo.tipo === 'lista_unica' || campo.tipo === 'usuario') {
            const opcoes =
              campo.tipo === 'usuario'
                ? usuarios.map((u) => ({ valor: u.id, rotulo: u.name }))
                : campo.opcoes.map((o) => ({ valor: o, rotulo: o }));

            return (
              <div key={campo.id}>
                {rotulo}
                <select
                  id={id}
                  className={CAMPO}
                  value={(valor as string) ?? ''}
                  onChange={(e) => alterar(campo.chave, e.target.value || null)}
                >
                  <option value="">—</option>
                  {opcoes.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>
                      {opcao.rotulo}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (campo.tipo === 'texto_longo' || campo.tipo === 'endereco') {
            return (
              <div key={campo.id} className="md:col-span-2">
                {rotulo}
                <textarea
                  id={id}
                  rows={campo.tipo === 'endereco' ? 2 : 3}
                  className={CAMPO}
                  value={(valor as string) ?? ''}
                  onChange={(e) => alterar(campo.chave, e.target.value)}
                />
              </div>
            );
          }

          const tipoHtml =
            campo.tipo === 'numero' || campo.tipo === 'moeda'
              ? 'number'
              : campo.tipo === 'data'
                ? 'date'
                : campo.tipo === 'hora'
                  ? 'time'
                  : campo.tipo === 'telefone'
                    ? 'tel'
                    : 'text';

          return (
            <div key={campo.id}>
              {rotulo}
              <input
                id={id}
                type={tipoHtml}
                step={campo.tipo === 'moeda' ? '0.01' : undefined}
                className={CAMPO}
                value={(valor as string | number) ?? ''}
                onChange={(e) =>
                  alterar(
                    campo.chave,
                    tipoHtml === 'number'
                      ? e.target.value === ''
                        ? null
                        : Number(e.target.value)
                      : e.target.value
                  )
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
