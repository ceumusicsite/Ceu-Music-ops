import type { CrmEtapa } from '../../services/crm/types';
import { diasNaEtapa } from '../../services/crm/formato';

interface CrmBarraEtapasProps {
  etapas: CrmEtapa[];
  etapaAtualId: string;
  dataEntradaEtapa?: string | null;
  desabilitado?: boolean;
  onEscolherEtapa: (etapaId: string) => void;
}

/**
 * Trilha de etapas em galhardetes do topo do negócio. As etapas já percorridas
 * ficam preenchidas, e a atual mostra há quantos dias o negócio está nela.
 */
export default function CrmBarraEtapas({
  etapas,
  etapaAtualId,
  dataEntradaEtapa,
  desabilitado = false,
  onEscolherEtapa,
}: CrmBarraEtapasProps) {
  const indiceAtual = etapas.findIndex((e) => e.id === etapaAtualId);
  const dias = diasNaEtapa(dataEntradaEtapa);

  return (
    <div className="flex w-full overflow-x-auto">
      {etapas.map((etapa, indice) => {
        const atual = indice === indiceAtual;
        const percorrida = indice < indiceAtual;

        return (
          <button
            key={etapa.id}
            type="button"
            disabled={desabilitado}
            onClick={() => onEscolherEtapa(etapa.id)}
            title={desabilitado ? 'Negócio fechado' : `Mover para ${etapa.nome}`}
            style={{
              clipPath:
                indice === 0
                  ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                  : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)',
              marginLeft: indice === 0 ? 0 : '-6px',
            }}
            className={`relative min-w-[8.5rem] flex-1 whitespace-nowrap px-5 py-2 text-xs font-medium transition-smooth ${
              desabilitado ? 'cursor-default' : 'cursor-pointer'
            } ${
              atual
                ? 'bg-primary-teal text-white'
                : percorrida
                  ? 'bg-primary-teal/30 text-white'
                  : 'bg-dark-hover text-gray-400 hover:bg-dark-border'
            }`}
          >
            {atual ? `${dias} ${dias === 1 ? 'dia' : 'dias'} · ${etapa.nome}` : etapa.nome}
          </button>
        );
      })}
    </div>
  );
}
