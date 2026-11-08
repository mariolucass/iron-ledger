import { AlertTriangle, ArrowUpRight, Check, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

/* Telas de exemplo do produto. Os dados são ilustrativos. */

type Tone = "ok" | "warn" | "danger" | "info" | "muted";

const chipTone: Record<Tone, string> = {
  ok: "border-primary/25 bg-primary-soft text-primary",
  warn: "border-warning/25 bg-warning-soft text-warning",
  danger: "border-destructive/25 bg-destructive-soft text-destructive",
  info: "border-info/25 bg-info-soft text-info",
  muted: "border-ink/10 bg-ink/[0.04] text-ink/60",
};

function Chip({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap ${chipTone[tone]}`}>{children}</span>;
}

const card = "rounded-2xl border border-ink/[0.08] bg-ink/[0.03]";

function PanelHeader({ title, meta }: { title: string; meta?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="m-0 text-[15px] font-semibold tracking-[-0.015em] text-foreground">{title}</h3>
      {meta}
    </div>
  );
}

const bars = [38, 52, 44, 66, 55, 74, 61, 86, 70, 92, 80, 95];

export function OverviewPanel() {
  const kpis = [
    { label: "Unidades em estoque", value: "18.429", note: "+4,8% no mês" },
    { label: "Reservado", value: "1.240", note: "7 transações" },
    { label: "Em andamento", value: "12", note: "3 aguardando" },
  ];
  const attention = [
    { tone: "danger" as const, label: "Abaixo do mínimo", detail: "JAQ-0231 · CD São Paulo" },
    { tone: "warn" as const, label: "Reposição sugerida", detail: "TEN-0408 · Loja Centro" },
    { tone: "ok" as const, label: "Transação concluída", detail: "TXN-00483921" },
  ];
  return (
    <div className="p-4 md:p-6">
      <PanelHeader
        title="Visão geral"
        meta={
          <div className="flex gap-1 rounded-full border border-ink/10 bg-ink/[0.04] p-0.5 text-[12px] font-medium">
            {["7D", "30D", "90D"].map((period) => (
              <span key={period} className={`rounded-full px-2.5 py-1 ${period === "30D" ? "bg-ink/[0.12] text-foreground" : "text-ink/55"}`}>{period}</span>
            ))}
          </div>
        }
      />
      <div className="mb-3 grid grid-cols-3 gap-2.5 md:gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`${card} p-3 md:p-4`}>
            <p className="m-0 truncate text-[12px] text-ink/60">{kpi.label}</p>
            <p className="m-0 mt-1.5 text-[20px] font-semibold tracking-[-0.03em] text-foreground tabular-nums md:text-[26px]">{kpi.value}</p>
            <p className="m-0 mt-1 truncate text-[12px] text-primary">{kpi.note}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-[1.5fr_1fr]">
        <div className={`${card} p-4`}>
          <p className="m-0 mb-3 text-[13px] font-medium text-foreground">Movimentações por dia</p>
          <div aria-hidden className="flex h-28 items-end gap-1.5 md:h-40">
            {bars.map((height, index) => (
              <div key={index} className="flex h-full flex-1 items-end">
                <div style={{ height: `${height}%` }} className="w-full rounded-t-md bg-gradient-to-t from-primary/15 via-info/50 to-primary" />
              </div>
            ))}
          </div>
        </div>
        <div className={`${card} p-4 max-md:hidden`}>
          <p className="m-0 mb-3 flex items-center gap-2 text-[13px] font-medium text-foreground"><AlertTriangle size={14} className="text-warning" aria-hidden />Atenção</p>
          <ul className="m-0 grid list-none gap-2.5 p-0">
            {attention.map((item) => (
              <li key={item.detail} className="flex items-start justify-between gap-2">
                <span className="min-w-0"><span className="block truncate text-[13px] text-foreground">{item.label}</span><span className="block truncate text-[12px] text-ink/55">{item.detail}</span></span>
                <Chip tone={item.tone}>{item.tone === "ok" ? "Ok" : item.tone === "danger" ? "Crítico" : "Aviso"}</Chip>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function StockPanel() {
  const rows: { sku: string; name: string; warehouse: string; available: string; status: string; tone: Tone }[] = [
    { sku: "CAM-0012", name: "Camiseta básica M", warehouse: "CD São Paulo", available: "342", status: "Ok", tone: "ok" },
    { sku: "TEN-0408", name: "Tênis de corrida 42", warehouse: "Loja Centro", available: "8", status: "Baixo", tone: "warn" },
    { sku: "JAQ-0231", name: "Jaqueta corta-vento G", warehouse: "CD São Paulo", available: "0", status: "Crítico", tone: "danger" },
    { sku: "BON-0097", name: "Boné aba curva", warehouse: "Estoque Sul", available: "126", status: "Ok", tone: "ok" },
    { sku: "MOC-0310", name: "Mochila 20 L", warehouse: "Loja Centro", available: "21", status: "Ok", tone: "ok" },
  ];
  return (
    <div className="p-4 md:p-6">
      <PanelHeader title="Estoque" meta={<span className="rounded-full bg-ink/[0.1] px-3.5 py-1.5 text-[12.5px] font-medium text-foreground">Novo movimento</span>} />
      <div className={`${card} overflow-hidden`}>
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-ink/[0.08] text-[12px] text-ink/55">
              <th className="px-4 py-2.5 font-medium">SKU</th>
              <th className="px-4 py-2.5 font-medium">Produto</th>
              <th className="px-4 py-2.5 font-medium max-md:hidden">Armazém</th>
              <th className="px-4 py-2.5 text-right font-medium">Disponível</th>
              <th className="px-4 py-2.5 font-medium">Situação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sku} className="border-b border-ink/[0.06] last:border-0">
                <td className="px-4 py-3 font-mono text-[12.5px] text-ink/80">{row.sku}</td>
                <td className="px-4 py-3 text-foreground">{row.name}</td>
                <td className="px-4 py-3 text-ink/60 max-md:hidden">{row.warehouse}</td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">{row.available}</td>
                <td className="px-4 py-3"><Chip tone={row.tone}>{row.status}</Chip></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TransactionPanel() {
  const steps = [
    { name: "Reservar estoque", time: "0,3 s" },
    { name: "Confirmar baixa", time: "0,5 s" },
    { name: "Reconciliar reserva", time: "0,2 s" },
  ];
  return (
    <div className="p-4 md:p-6">
      <PanelHeader title="TXN-00483921" meta={<Chip tone="ok">Concluída</Chip>} />
      <p className="m-0 mb-4 text-[13px] text-ink/60">Venda · 12 un · CAM-0012 · CD São Paulo</p>
      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
        <ol className={`${card} m-0 grid list-none gap-0 p-4`}>
          {steps.map((step, index) => (
            <li key={step.name} className="relative flex items-center gap-3 py-2.5">
              {index < steps.length - 1 && <span aria-hidden className="absolute top-[34px] left-[13px] h-[calc(100%-8px)] w-px bg-primary/30" />}
              <span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary-soft text-primary"><Check size={14} aria-hidden /></span>
              <span className="flex-1 text-[14px] text-foreground">{step.name}</span>
              <span className="text-[12.5px] text-ink/55 tabular-nums">{step.time}</span>
            </li>
          ))}
        </ol>
        <div className="rounded-2xl border border-dashed border-warning/30 bg-warning-soft/40 p-4">
          <p className="m-0 mb-2 flex items-center gap-2 text-[13px] font-medium text-warning"><RotateCcw size={14} aria-hidden />Se uma etapa falhar</p>
          <p className="m-0 text-[13px] leading-relaxed text-ink/70">A saga executa a compensação: <strong className="font-medium text-foreground">Liberar reserva</strong>. O saldo volta ao que era e a transação termina como <strong className="font-medium text-foreground">Compensada</strong>.</p>
        </div>
      </div>
    </div>
  );
}

export function AuditPanel() {
  const events = [
    { who: "Maria Silva", initials: "MS", action: "Atualizou saldo", target: "CAM-0012 · CD São Paulo", time: "há 2 min", diff: "120 → 96" },
    { who: "Sistema", initials: "S", action: "Concluiu transação", target: "TXN-00483921", time: "há 5 min", diff: null },
    { who: "Carlos Souza", initials: "CS", action: "Criou produto", target: "BON-0097", time: "há 1 h", diff: null },
    { who: "Maria Silva", initials: "MS", action: "Alterou papéis", target: "Pedro Lima", time: "há 3 h", diff: null },
  ];
  return (
    <div className="p-4 md:p-6">
      <PanelHeader title="Auditoria" meta={<span className="text-[12.5px] text-ink/55">Hoje</span>} />
      <ul className={`${card} m-0 list-none divide-y divide-ink/[0.06] p-0`}>
        {events.map((event) => (
          <li key={event.time} className="flex items-center gap-3 px-4 py-3">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full border border-ink/10 bg-ink/[0.06] text-[12px] font-semibold text-ink/80">{event.initials}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] text-foreground"><strong className="font-semibold">{event.who}</strong> {event.action.toLowerCase()}</span>
              <span className="block truncate text-[12.5px] text-ink/55">{event.target}</span>
            </span>
            {event.diff && <span className="rounded-lg border border-ink/10 bg-sunken px-2 py-1 font-mono text-[12px] text-primary max-sm:hidden">{event.diff}</span>}
            <time className="shrink-0 text-[12.5px] text-ink/50">{event.time}</time>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WarehousePanel() {
  const tree: { depth: number; code: string; name: string; type: string; flags?: string[] }[] = [
    { depth: 0, code: "CD-SP", name: "CD São Paulo", type: "Centro de distribuição" },
    { depth: 1, code: "A", name: "Zona A", type: "Zona" },
    { depth: 2, code: "01", name: "Corredor 01", type: "Corredor" },
    { depth: 3, code: "R1", name: "Estante R1", type: "Estante", flags: ["Separação", "Recebimento"] },
    { depth: 1, code: "D1", name: "Doca 1", type: "Doca", flags: ["Recebimento"] },
  ];
  return (
    <div className="p-4 md:p-6">
      <PanelHeader title="Armazéns" meta={<Chip tone="ok">Ativa</Chip>} />
      <div className="grid gap-3 md:grid-cols-[1.5fr_1fr]">
        <ul className={`${card} m-0 grid list-none gap-1 p-3`}>
          {tree.map((node) => (
            <li key={node.code + node.depth} style={{ marginLeft: node.depth * 18 }} className="flex flex-wrap items-center gap-2 rounded-xl px-3 py-2">
              <span className="font-mono text-[13px] font-semibold text-foreground">{node.code}</span>
              <span className="text-[13px] text-ink/65">{node.name}</span>
              {node.flags?.map((flag) => <Chip key={flag} tone="muted">{flag}</Chip>)}
            </li>
          ))}
        </ul>
        <dl className={`${card} m-0 grid content-start gap-3 p-4 max-md:hidden`}>
          {[["Unidades em estoque", "6.412"], ["SKUs", "184"], ["Localizações", "42"]].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-2">
              <dt className="text-[13px] text-ink/60">{label}</dt>
              <dd className="m-0 flex items-center gap-1 text-[18px] font-semibold text-foreground tabular-nums">{value}<ArrowUpRight size={13} className="text-primary" aria-hidden /></dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
