import { Activity, CheckCheck, Filter, Search, X } from "lucide-react";
import type { AlertTab, Severity, Source } from "../../model/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";

interface Props {
  activeTab: AlertTab; counts: Record<AlertTab, number>; search: string; severity: Severity | "ALL"; source: Source | "ALL"; canResolveAll: boolean;
  onTabChange: (value: AlertTab) => void; onSearchChange: (value: string) => void; onSeverityChange: (value: Severity | "ALL") => void; onSourceChange: (value: Source | "ALL") => void; onResolveAll: () => void;
}
const tabs: { id: AlertTab; label: string }[] = [{ id: "ALL", label: "Todos" }, { id: "ACTIVE", label: "Ativos" }, { id: "ACKNOWLEDGED", label: "Reconhecidos" }, { id: "RESOLVED", label: "Resolvidos" }];

export function AlertsFilterBar(props: Props) {
  return <section aria-label="Filtros de alertas" className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
    <div className="flex flex-wrap gap-0.5">{tabs.map((tab) => <button type="button" key={tab.id} onClick={() => props.onTabChange(tab.id)} className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] transition-colors ${props.activeTab === tab.id ? "bg-card-elevated font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{tab.label}<span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${props.activeTab === tab.id ? "bg-primary-soft text-primary" : "bg-muted text-subtle-foreground"}`}>{props.counts[tab.id]}</span></button>)}</div>
    <div className="flex flex-wrap items-center gap-2.5">
      <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary-soft"><Search size={13} className="text-muted-foreground" /><span className="sr-only">Procurar alertas</span><input value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder="Procurar alertas..." className="w-[180px] bg-transparent text-[13px] text-foreground outline-none placeholder:text-subtle-foreground" />{props.search && <button type="button" aria-label="Limpar pesquisa" onClick={() => props.onSearchChange("")} className="text-subtle-foreground hover:text-muted-foreground"><X size={12} /></button>}</label>
      <Select value={props.severity} onValueChange={(value) => props.onSeverityChange(value as Severity | "ALL")}>
        <SelectTrigger size="sm" aria-label="Filtrar por severidade" className="text-[12.5px]"><Filter size={13} /><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="ALL">Severidade</SelectItem><SelectItem value="CRITICAL">Crítico</SelectItem><SelectItem value="WARNING">Aviso</SelectItem><SelectItem value="INFO">Informativo</SelectItem></SelectContent>
      </Select>
      <Select value={props.source} onValueChange={(value) => props.onSourceChange(value as Source | "ALL")}>
        <SelectTrigger size="sm" aria-label="Filtrar por origem" className="text-[12.5px]"><Activity size={13} /><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="ALL">Origem</SelectItem><SelectItem value="FORECASTING">Previsão AI</SelectItem><SelectItem value="TRANSACTIONS">Motor de Sagas</SelectItem><SelectItem value="INVENTORY">Estoque</SelectItem><SelectItem value="SECURITY">Segurança</SelectItem><SelectItem value="SYSTEM">Infraestrutura</SelectItem></SelectContent>
      </Select>
      <span className="h-6 w-px bg-border max-sm:hidden" /><button type="button" onClick={props.onResolveAll} disabled={!props.canResolveAll} className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground"><CheckCheck size={14} />Resolver todos</button>
    </div>
  </section>;
}
