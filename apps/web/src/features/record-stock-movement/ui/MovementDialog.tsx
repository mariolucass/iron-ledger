"use client";

import { colors as theme } from "@/shared/config/tokens";
import { Loader2, X } from "lucide-react";
import { useRecordStockMovement } from "../model/use-record-stock-movement";
import type { MovementStockOption } from "../model/types";

export function MovementDialog({
  items,
  onClose,
  onSuccess,
}: {
  items: MovementStockOption[];
  onClose: () => void;
  onSuccess: (message: string) => Promise<void>;
}) {
  const {
    stockLevelId, setStockLevelId, type, setType, quantity, setQuantity,
    referenceId, setReferenceId, notes, setNotes, error, submitting, submit,
  } = useRecordStockMovement({ items, onClose, onSuccess });

  const fieldStyle = {
    width: "100%",
    background: theme.bg,
    color: theme.textPrimary,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: "10px 12px",
  };

  return <div className="fixed inset-0 z-[300] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="presentation">
    <form onSubmit={submit} className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-elevated" aria-labelledby="movement-title">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div><p className="text-[10px] font-bold tracking-[0.08em] text-primary uppercase">Inventário</p><h2 id="movement-title" className="mt-1 text-xl font-bold">Novo movimento</h2></div>
        <button type="button" aria-label="Fechar formulário de movimento" onClick={onClose} className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"><X size={16} /></button>
      </div>
      <div className="grid gap-4">
        <label className="grid gap-1.5 text-xs text-muted-foreground">Produto e depósito
          <select value={stockLevelId} onChange={(event) => setStockLevelId(event.target.value)} style={fieldStyle} required>
            {items.filter((item) => item.stockLevelId).map((item) => <option key={item.stockLevelId} value={item.stockLevelId}>{item.sku} · {item.product} · {item.warehouse}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-xs text-muted-foreground">Tipo
            <select value={type} onChange={(event) => setType(event.target.value as typeof type)} style={fieldStyle}>
              <option value="INBOUND">Entrada</option><option value="OUTBOUND">Saída</option><option value="ADJUSTMENT">Ajuste</option><option value="RETURN">Retorno</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs text-muted-foreground">Quantidade
            <input type="number" step="0.0001" value={quantity} onChange={(event) => setQuantity(event.target.value)} style={fieldStyle} required />
          </label>
        </div>
        <label className="grid gap-1.5 text-xs text-muted-foreground">Referência
          <input value={referenceId} onChange={(event) => setReferenceId(event.target.value)} placeholder="Ex.: TXN-000123" maxLength={120} style={fieldStyle} />
        </label>
        <label className="grid gap-1.5 text-xs text-muted-foreground">Observação
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} rows={3} style={fieldStyle} />
        </label>
        {error && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive-soft px-3 py-2 text-xs text-destructive">{error}</div>}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground">Cancelar</button>
        <button type="submit" disabled={submitting || !stockLevelId} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{submitting && <Loader2 size={14} className="animate-spin" />}Registrar</button>
      </div>
    </form>
  </div>;
}
