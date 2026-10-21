import { Badge } from "@/shared/ui/kit/badge";
import type { Movement } from "../model/inventoryData";

const variant = { ENTRADA: "success", SAÍDA: "destructive", AJUSTE: "warning" } as const satisfies Record<Movement["type"], string>;

export function MovementBadge({ type }: { type: Movement["type"] }) {
  return <Badge variant={variant[type]}>{type}</Badge>;
}

const qtyClass = (qty: string) => (qty.startsWith("+") ? "text-primary" : "text-destructive");

const empty = "m-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center text-[14px] text-white/55";

/** Movimentos em tabela compacta (linha expandida do estoque). */
export function MovementTable({ movements, loading }: { movements: Movement[] | undefined; loading: boolean }) {
  if (!movements) {
    return <p role="status" className={empty}>{loading ? "Carregando movimentos…" : "Não foi possível carregar os movimentos."}</p>;
  }
  if (!movements.length) return <p className={empty}>Nenhuma movimentação recente encontrada.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-white/[0.08] text-[12.5px] text-white/55">
            {["Tipo", "Quantidade", "Referência", "Por", "Data e hora"].map((header) => (
              <th key={header} scope="col" className="px-3 py-2 font-medium">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {movements.map((movement, index) => (
            <tr key={index} className="border-b border-white/[0.05] last:border-0">
              <td className="px-3 py-2.5"><MovementBadge type={movement.type} /></td>
              <td className={`px-3 py-2.5 font-mono font-semibold tabular-nums ${qtyClass(movement.qty)}`}>{movement.qty}</td>
              <td className="px-3 py-2.5 font-mono text-[12.5px] text-white/60">{movement.ref}</td>
              <td className="px-3 py-2.5 text-white/60">{movement.by}</td>
              <td className="px-3 py-2.5 whitespace-nowrap text-white/60">{movement.ts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Movimentos em cartões (gaveta de detalhes). */
export function MovementCards({ movements }: { movements: Movement[] }) {
  if (!movements.length) return <p className={empty}>Nenhuma movimentação recente encontrada.</p>;
  return (
    <ul className="m-0 grid list-none gap-2.5 p-0">
      {movements.map((movement, index) => (
        <li key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <MovementBadge type={movement.type} />
            <span className={`font-mono text-[15px] font-semibold tabular-nums ${qtyClass(movement.qty)}`}>{movement.qty}</span>
          </div>
          <div className="mb-1 font-mono text-[12.5px] text-white/55">Ref: {movement.ref}</div>
          <div className="text-[13px] text-white/55">Por {movement.by} · {movement.ts}</div>
        </li>
      ))}
    </ul>
  );
}
