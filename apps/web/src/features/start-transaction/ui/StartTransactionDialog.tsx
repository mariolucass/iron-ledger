"use client";

import { Loader2, X } from "lucide-react";
import type { TransactionDetail } from "@/entities/transaction";
import { colors as theme } from "@/shared/config/tokens";
import { useStartTransaction } from "../model/use-start-transaction";
import type { TransactionStockOption } from "../model/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";

export function StartTransactionDialog({
  items,
  loading = false,
  onClose,
  onStarted,
}: {
  items: TransactionStockOption[];
  loading?: boolean;
  onClose: () => void;
  onStarted: (transaction: TransactionDetail) => void;
}) {
  const {
    sellable, selected, stockLevelId, setStockLevelId, quantity, setQuantity,
    externalRef, setExternalRef, failConfirmation, setFailConfirmation, error, submitting, submit,
  } = useStartTransaction({ items, onStarted });

  const fieldStyle = {
    width: "100%",
    background: theme.bg,
    color: theme.textPrimary,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: "10px 12px",
  };

  return <div className="fixed inset-0 z-[300] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="presentation">
    <form onSubmit={submit} className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-elevated" aria-labelledby="start-transaction-title">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.08em] text-primary uppercase">Saga · Temporal</p>
          <h2 id="start-transaction-title" className="mt-1 text-xl font-bold">Nova transação de saída</h2>
          <p className="mt-1 text-xs text-muted-foreground">Reserva o estoque, confirma a baixa e compensa automaticamente em caso de falha.</p>
        </div>
        <button type="button" aria-label="Fechar formulário de transação" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"><X size={16} /></button>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-1.5 text-xs text-muted-foreground"><span id="start-transaction-stock-label">Produto e depósito</span>
          <Select value={stockLevelId} onValueChange={setStockLevelId} required disabled={loading || sellable.length === 0}>
            <SelectTrigger aria-labelledby="start-transaction-stock-label" className="w-full data-[size=default]:h-10">
              <SelectValue placeholder={loading ? "Carregando saldos…" : sellable.length === 0 ? "Nenhum saldo disponível" : "Selecione um saldo"} />
            </SelectTrigger>
            <SelectContent>{sellable.map((item) => <SelectItem key={item.stockLevelId} value={item.stockLevelId}>{item.sku} · {item.product} · {item.warehouse} ({item.available} disp.)</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-xs text-muted-foreground">Quantidade
            <input type="number" min="0" step="0.0001" max={selected?.available} value={quantity} onChange={(event) => setQuantity(event.target.value)} style={fieldStyle} required />
          </label>
          <label className="grid gap-1.5 text-xs text-muted-foreground">Referência externa
            <input value={externalRef} onChange={(event) => setExternalRef(event.target.value)} placeholder="Ex.: PED-10293" maxLength={120} style={fieldStyle} />
          </label>
        </div>
        <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-xs text-muted-foreground">
          <input type="checkbox" checked={failConfirmation} onChange={(event) => setFailConfirmation(event.target.checked)} className="mt-0.5" />
          <span><strong className="text-foreground">Simular falha na confirmação</strong><br />Demonstra a compensação: a reserva é liberada e o saldo volta ao disponível.</span>
        </label>
        {error && <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive-soft px-3 py-2 text-xs text-destructive">{error}</div>}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground">Cancelar</button>
        <button type="submit" disabled={submitting || loading || !stockLevelId} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
          {submitting && <Loader2 size={14} className="animate-spin" />}Iniciar Saga
        </button>
      </div>
    </form>
  </div>;
}
