import type { Warehouse } from "../model/types";

export function WarehouseLabel({ warehouse }: { warehouse: Pick<Warehouse, "code" | "name"> }) {
  return <span className="inline-flex items-center gap-2">
    <span className="font-mono text-xs text-muted-foreground">{warehouse.code}</span>
    <span>{warehouse.name}</span>
  </span>;
}
