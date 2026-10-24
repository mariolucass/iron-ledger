import { Bell, ShieldAlert } from "lucide-react";
import type { AlertsSummaryData } from "../../model/types";

type Props = AlertsSummaryData & { total: number };

export function AlertsSummary({ activeCount, criticalCount, healthPct, resolvedCount, severityPercentages, total }: Props) {
  const circumference = 2 * Math.PI * 18;
  const segments = [
    { label: "Crítico", value: severityPercentages.CRITICAL, color: "bg-destructive" },
    { label: "Aviso", value: severityPercentages.WARNING, color: "bg-warning" },
    { label: "Informativo", value: severityPercentages.INFO, color: "bg-info" },
  ];

  return <section aria-label="Resumo dos alertas" className="mb-6 grid grid-cols-[1fr_1fr_1.5fr_1.3fr] gap-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
    <div className="flex items-center gap-4 rounded-[14px] border border-border bg-card px-[22px] py-5"><div className="flex size-[46px] shrink-0 items-center justify-center rounded-[13px] border border-border bg-card-elevated text-warning"><Bell size={20} /></div><div><div className="mb-1 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">Alertas ativos</div><div className="text-[28px] leading-none font-extrabold tracking-[-0.04em]">{activeCount}</div></div></div>
    <div className={`flex items-center gap-4 rounded-[14px] border px-[22px] py-5 ${criticalCount ? "border-destructive/20 bg-destructive/10" : "border-border bg-card"}`}><div className={`flex size-[46px] shrink-0 items-center justify-center rounded-[13px] border ${criticalCount ? "border-destructive/25 bg-destructive-soft text-destructive" : "border-border bg-card-elevated text-subtle-foreground"}`}><ShieldAlert size={20} /></div><div><div className="mb-1 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">Críticos</div><div className={`text-[28px] leading-none font-extrabold tracking-[-0.04em] ${criticalCount ? "text-destructive" : "text-foreground"}`}>{criticalCount}</div></div></div>
    <div className="rounded-[14px] border border-border bg-card px-[22px] py-5"><div className="mb-3.5 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">Distribuição por severidade</div><div className="mb-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full">{segments.map((item) => item.value > 0 && <div key={item.label} className={`rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />)}<div className="flex-1 rounded-full bg-subtle-foreground" /></div><div className="flex gap-3">{segments.map((item) => <div key={item.label} className="flex items-center gap-1 text-[10.5px]"><span className={`size-1.5 rounded-full ${item.color}`} /><span className="text-muted-foreground">{item.label}</span><span className="font-mono text-subtle-foreground">{item.value}%</span></div>)}</div></div>
    <div className="flex items-center gap-4 rounded-[14px] border border-border bg-card px-[22px] py-5"><div className="relative size-[46px] shrink-0"><svg width="46" height="46" className="-rotate-90"><circle cx="23" cy="23" r="18" fill="none" stroke="var(--border)" strokeWidth="4" /><circle cx="23" cy="23" r="18" fill="none" stroke="var(--primary)" strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - healthPct / 100)} strokeLinecap="round" /></svg><span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-primary">{healthPct}%</span></div><div><div className="mb-1 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">Saúde do sistema</div><div className="text-[13px] text-muted-foreground"><strong className="text-primary">{resolvedCount}</strong> resolvidos de {total}</div></div></div>
  </section>;
}
