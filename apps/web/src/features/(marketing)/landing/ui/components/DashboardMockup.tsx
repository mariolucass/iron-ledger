import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Package, TrendingUp } from "lucide-react";

const metrics = [
  { label: "Receita mensal", value: "R$ 482 mil", trend: "+12,4%", icon: TrendingUp },
  { label: "Itens em estoque", value: "18.429", trend: "+4,8%", icon: Package },
  { label: "Movimentações", value: "8.491", trend: "+18,2%", icon: Activity },
];

const alerts = [
  { title: "Estoque mínimo", detail: "SKU-4821 · Loja Centro", tone: "text-destructive bg-destructive-soft", severity: "Crítico" },
  { title: "Reposição recomendada", detail: "SKU-3910 · Estoque Sul", tone: "text-warning bg-warning-soft", severity: "Alto" },
  { title: "Transferência concluída", detail: "TXN-00483919", tone: "text-primary bg-primary-soft", severity: "Resolvido" },
];

const chartBars = ["h-[35%]", "h-[48%]", "h-[42%]", "h-[67%]", "h-[53%]", "h-[76%]", "h-[62%]", "h-[88%]", "h-[72%]", "h-[94%]", "h-[81%]", "h-[96%]"];

export function DashboardMockup() {
  return <div className="h-full w-full p-3 font-sans md:p-4">
    <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
      <div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary"><Activity size={14} /></span><span className="text-xs font-bold md:text-sm">Visão geral</span></div>
      <div className="flex gap-1.5">{["7D", "30D", "90D"].map((period, index) => <span key={period} className={`rounded px-2 py-1 text-[8px] font-semibold md:text-[10px] ${index === 1 ? "bg-primary-soft text-primary" : "bg-card text-muted-foreground"}`}>{period}</span>)}</div>
    </div>
    <div className="mb-2 grid grid-cols-3 gap-2">{metrics.map(({ label, value, trend, icon: Icon }) => <div key={label} className="rounded-lg border border-border bg-card p-2 md:p-3">
      <div className="mb-2 flex items-center justify-between text-muted-foreground"><span className="truncate text-[7px] md:text-[10px]">{label}</span><Icon size={11} /></div>
      <strong className="block truncate text-[10px] tracking-tight md:text-base">{value}</strong><span className="mt-1 flex items-center gap-0.5 text-[7px] text-primary md:text-[9px]"><ArrowUpRight size={8} />{trend}</span>
    </div>)}</div>
    <div className="grid grid-cols-[1.6fr_1fr] gap-2">
      <div className="rounded-lg border border-border bg-card p-2 md:p-3">
        <div className="mb-3 flex items-center justify-between"><span className="text-[8px] font-semibold md:text-[11px]">Fluxo de movimentações</span><span className="text-[7px] text-muted-foreground md:text-[9px]">Últimos 30 dias</span></div>
        <div className="flex h-24 items-end gap-1 md:h-48 md:gap-1.5">{chartBars.map((heightClass, index) => <div key={index} className="flex h-full flex-1 items-end"><div className={`w-full rounded-t-sm bg-gradient-to-t from-primary/20 to-primary ${heightClass}`} /></div>)}</div>
      </div>
      <div className="rounded-lg border border-border bg-card p-2 md:p-3">
        <div className="mb-2 flex items-center gap-1.5"><AlertTriangle size={11} className="text-warning" /><span className="text-[8px] font-semibold md:text-[11px]">Alertas recentes</span></div>
        <div className="flex flex-col gap-1.5">{alerts.map((alert) => <div key={alert.detail} className="rounded-md bg-card-elevated p-1.5 md:p-2"><div className="flex items-center justify-between gap-1"><strong className="truncate text-[7px] md:text-[9px]">{alert.title}</strong><span className={`hidden rounded px-1 py-0.5 text-[6px] font-bold sm:block md:text-[7px] ${alert.tone}`}>{alert.severity}</span></div><p className="mt-0.5 truncate text-[6px] text-muted-foreground md:text-[8px]">{alert.detail}</p></div>)}</div>
        <div className="mt-2 flex items-center gap-1 text-[7px] text-muted-foreground md:text-[8px]"><ArrowDownRight size={8} />3 eventos nas últimas horas</div>
      </div>
    </div>
  </div>;
}
