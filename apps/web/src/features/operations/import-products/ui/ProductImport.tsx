"use client";

import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, FolderTree, Loader2, PackagePlus, RefreshCw, SkipForward, Upload, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type DragEvent } from "react";
import {
  PRODUCT_IMPORT_FIELDS,
  productApi,
  type ImportCell,
  type ImportExistingMode,
  type ImportRowAction,
  type ProductImportField,
  type ProductImportReport,
  type ProductImportRow,
  type UnitOption,
} from "@/entities/product";
import { withSession } from "@/shared/auth/with-session";
import { DataTable, SegmentedTabs, StatCard, type Column } from "@/shared/ui/data-list";
import { Field, StatusMessage, Switch, selectTriggerClass, type Status } from "@/shared/ui/form-primitives";
import { Button } from "@/shared/ui/kit/button";
import { SelectInput } from "@/shared/ui/kit/select";
import { cn } from "@/shared/ui/kit/utils";
import { ACCEPTED_FILES, readSpreadsheet } from "../model/read-spreadsheet";
import { downloadTemplate } from "../model/template";

const FIELD_LABELS: Record<ProductImportField, string> = {
  sku: "SKU", name: "Nome", category: "Categoria", subcategory: "Subcategoria", brand: "Marca/Fornecedor",
  standardCost: "Custo unitário", salePrice: "Preço de venda", status: "Status", unit: "Unidade",
  description: "Descrição", ncm: "NCM", minStock: "Estoque mínimo",
};

const ACTION_LABELS: Record<ImportRowAction, string> = { create: "Novo", update: "Atualizar", skip: "Ignorar", error: "Erro" };
const ACTION_CLASSES: Record<ImportRowAction, string> = {
  create: "bg-primary-soft text-primary",
  update: "bg-info-soft text-info",
  skip: "bg-ink/[0.06] text-ink/60",
  error: "bg-destructive-soft text-destructive",
};

const EXISTING_OPTIONS: { value: ImportExistingMode; label: string }[] = [
  { value: "skip", label: "Ignorar a linha" },
  { value: "update", label: "Atualizar o produto" },
  { value: "error", label: "Tratar como erro" },
];

/** Linhas renderizadas por vez; o relatório completo continua no estado. */
const VISIBLE_ROWS = 200;

type Filter = "all" | ImportRowAction;
type SheetFile = { name: string; rows: ImportCell[][] };

const number = new Intl.NumberFormat("pt-BR");
const message = (reason: unknown, fallback: string) => (reason instanceof Error ? reason.message : fallback);

const columns: Column<ProductImportRow>[] = [
  { id: "line", header: "Linha", className: "tabular-nums text-ink/60", cell: (row) => row.line },
  { id: "sku", header: "SKU", className: "font-mono text-[13px]", cell: (row) => row.sku ?? "—" },
  { id: "name", header: "Produto", className: "font-medium text-foreground", cell: (row) => row.name ?? "—" },
  { id: "category", header: "Categoria", hideBelow: "md", className: "text-ink/60", cell: (row) => row.category ?? "—" },
  {
    id: "action",
    header: "Resultado",
    cell: (row) => (
      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.05em] uppercase", ACTION_CLASSES[row.action])}>
        {ACTION_LABELS[row.action]}
      </span>
    ),
  },
  {
    id: "messages",
    header: "Observações",
    className: "min-w-[220px]",
    cell: (row) =>
      row.errors.length || row.warnings.length ? (
        <ul className="m-0 grid list-none gap-0.5 p-0 text-[12.5px]">
          {row.errors.map((text) => <li key={text} className="text-destructive">{text}</li>)}
          {row.warnings.map((text) => <li key={text} className="text-warning">{text}</li>)}
        </ul>
      ) : <span className="text-ink/40">—</span>,
  },
];

const defaultUnit = (units: UnitOption[]) =>
  units.find((unit) => unit.code.toLowerCase() === "un")?.id ?? units[0]?.id ?? "";

/** Importa produtos de CSV ou XLSX: lê no navegador, valida na API (prévia) e grava tudo ou nada. */
export function ProductImport({ units }: { units: UnitOption[] }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<SheetFile | null>(null);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [defaultUnitId, setDefaultUnitId] = useState(() => defaultUnit(units));
  const [onExisting, setOnExisting] = useState<ImportExistingMode>("skip");
  const [createCategories, setCreateCategories] = useState(true);
  const [mapping, setMapping] = useState<(ProductImportField | null)[] | undefined>();
  const [report, setReport] = useState<ProductImportReport | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState<ProductImportReport | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [attempt, setAttempt] = useState(0);

  const request = useMemo(
    () => file && defaultUnitId
      ? { rows: file.rows, columns: mapping, options: { defaultUnitId, onExisting, createCategories } }
      : null,
    [file, mapping, defaultUnitId, onExisting, createCategories],
  );

  useEffect(() => {
    if (!request) return;
    let cancelled = false;
    setPreviewing(true);
    setStatus(null);
    withSession(productApi.previewImport(request))
      .then((next) => { if (!cancelled) setReport(next); })
      .catch((reason) => {
        if (!cancelled) {
          setReport(null);
          setStatus({ type: "error", message: message(reason, "Não foi possível validar a planilha.") });
        }
      })
      .finally(() => { if (!cancelled) setPreviewing(false); });
    return () => { cancelled = true; };
  }, [request, attempt]);

  const load = async (selected: File | undefined) => {
    if (!selected) return;
    setReading(true);
    setStatus(null);
    setReport(null);
    setCommitted(null);
    setMapping(undefined);
    setFilter("all");
    try {
      const rows = await readSpreadsheet(selected);
      if (rows.length < 2) throw new Error("A planilha precisa de um cabeçalho e pelo menos uma linha de produto.");
      if (rows.length > 5_001) throw new Error(`A planilha tem ${number.format(rows.length - 1)} linhas; o limite é 5.000 por arquivo.`);
      setFile({ name: selected.name, rows });
    } catch (reason) {
      setFile(null);
      setStatus({ type: "error", message: message(reason, "Não foi possível ler o arquivo.") });
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const reset = () => {
    setFile(null);
    setReport(null);
    setCommitted(null);
    setMapping(undefined);
    setStatus(null);
  };

  const remap = (index: number, field: ProductImportField | null) => {
    if (!report) return;
    const next = (mapping ?? report.columns.map((column) => column.field)).map((current, position) =>
      position === index ? field : current === field && field !== null ? null : current);
    setMapping(next);
  };

  const commit = async () => {
    if (!request) return;
    setCommitting(true);
    setStatus(null);
    try {
      setCommitted(await withSession(productApi.commitImport(request)));
    } catch (reason) {
      setStatus({ type: "error", message: message(reason, "Não foi possível importar os produtos.") });
    } finally {
      setCommitting(false);
    }
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    void load(event.dataTransfer.files[0]);
  };

  const rows = useMemo(
    () => (report ? (filter === "all" ? report.rows : report.rows.filter((row) => row.action === filter)) : []),
    [report, filter],
  );

  if (committed) {
    const { create, update } = committed.summary;
    return (
      <div className="grid justify-items-center gap-5 rounded-2xl border border-border bg-card px-6 py-14 text-center">
        <span aria-hidden className="grid size-14 place-items-center rounded-2xl border border-primary/25 bg-primary-soft text-primary">
          <CheckCircle2 size={26} strokeWidth={1.7} />
        </span>
        <div className="grid gap-1.5">
          <h2 className="m-0 text-lg font-bold text-foreground">Importação concluída</h2>
          <p className="m-0 max-w-[460px] text-[14.5px] leading-relaxed text-ink/60">
            {number.format(create)} produto(s) criado(s) e {number.format(update)} atualizado(s)
            {committed.categoriesToCreate.length ? `, com ${committed.categoriesToCreate.length} categoria(s) nova(s)` : ""}.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild><Link href="/products">Ver produtos</Link></Button>
          <Button variant="outline" onClick={reset}>Importar outro arquivo</Button>
        </div>
      </div>
    );
  }

  const blocked = !report || previewing || report.summary.error > 0 || report.missingRequired.length > 0;
  const writes = report ? report.summary.create + report.summary.update : 0;

  return (
    <div className="grid gap-6">
      {status && <StatusMessage status={status} />}

      <section className="grid gap-5 rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="m-0 text-base font-bold text-foreground">Arquivo</h2>
            <p className="m-0 text-[13px] text-ink/60">CSV (separado por ponto e vírgula ou vírgula) ou Excel .xlsx, até 5.000 linhas.</p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}><Download aria-hidden /> Baixar modelo</Button>
        </div>

        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-ink/[0.03] px-4 py-3">
            <FileSpreadsheet size={20} className="shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-medium text-foreground">{file.name}</div>
              <div className="text-[12.5px] text-ink/60">{number.format(file.rows.length - 1)} linha(s) de dados</div>
            </div>
            <Button variant="ghost" size="icon" onClick={reset} aria-label="Remover arquivo"><X aria-hidden /></Button>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "grid cursor-pointer justify-items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
              dragging ? "border-primary/70 bg-primary-soft/40" : "border-border-strong hover:border-primary/50 hover:bg-ink/[0.03]",
            )}
          >
            {reading ? <Loader2 size={24} className="animate-spin text-primary" aria-hidden /> : <Upload size={24} className="text-ink/50" aria-hidden />}
            <span className="text-[14.5px] text-foreground">{reading ? "Lendo arquivo…" : "Arraste a planilha aqui ou clique para escolher"}</span>
            <span className="text-[12.5px] text-ink/50">.csv ou .xlsx · a primeira linha deve ser o cabeçalho</span>
          </label>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_FILES}
          className="sr-only"
          onChange={(event) => void load(event.target.files?.[0])}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Unidade padrão" hint="Usada quando a planilha não tem coluna de unidade.">
            {(props) => (
              <SelectInput
                {...props}
                value={defaultUnitId}
                onChange={setDefaultUnitId}
                className={selectTriggerClass}
                options={units.map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.code})` }))}
              />
            )}
          </Field>
          <Field label="Quando o SKU já existir">
            {(props) => (
              <SelectInput
                {...props}
                value={onExisting}
                onChange={(value) => setOnExisting(value as ImportExistingMode)}
                className={selectTriggerClass}
                options={EXISTING_OPTIONS}
              />
            )}
          </Field>
        </div>
        <Switch
          checked={createCategories}
          onChange={setCreateCategories}
          label="Criar categorias e subcategorias que não existem"
          description="Desligado, linhas com categoria desconhecida ficam com erro."
        />
      </section>

      {report && (
        <>
          <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="grid gap-1">
              <h2 className="m-0 text-base font-bold text-foreground">Colunas</h2>
              <p className="m-0 text-[13px] text-ink/60">Reconhecemos os cabeçalhos automaticamente. Ajuste o que estiver errado.</p>
            </div>
            {report.missingRequired.length > 0 && (
              <StatusMessage status={{ type: "error", message: `Indique a coluna de ${report.missingRequired.map((field) => FIELD_LABELS[field]).join(" e ")}.` }} />
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {report.columns.map((column) => (
                <Field key={column.index} label={column.header || `Coluna ${column.index + 1}`}>
                  {(props) => (
                    <SelectInput
                      {...props}
                      value={column.field ?? ""}
                      onChange={(value) => remap(column.index, (value || null) as ProductImportField | null)}
                      className={selectTriggerClass}
                      options={[
                        { value: "", label: "Ignorar coluna" },
                        ...PRODUCT_IMPORT_FIELDS.map((field) => ({ value: field, label: FIELD_LABELS[field] })),
                      ]}
                    />
                  )}
                </Field>
              ))}
            </div>
          </section>

          <section className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={PackagePlus} label="Novos" value={number.format(report.summary.create)} />
              <StatCard icon={RefreshCw} label="Atualizar" value={number.format(report.summary.update)} />
              <StatCard icon={SkipForward} label="Ignorados" value={number.format(report.summary.skip)} />
              <StatCard icon={AlertTriangle} label="Com erro" value={number.format(report.summary.error)} />
            </div>

            {report.categoriesToCreate.length > 0 && (
              <div className="flex items-start gap-2.5 rounded-xl border border-info/30 bg-info-soft px-3.5 py-3 text-[13px] text-info">
                <FolderTree size={15} className="mt-px shrink-0" aria-hidden />
                <span>Categorias que serão criadas: {report.categoriesToCreate.join(", ")}.</span>
              </div>
            )}

            <SegmentedTabs<Filter>
              label="Filtrar linhas"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: `Todas (${report.summary.total})` },
                { value: "error", label: `Erros (${report.summary.error})` },
                { value: "create", label: `Novos (${report.summary.create})` },
                { value: "update", label: `Atualizar (${report.summary.update})` },
                { value: "skip", label: `Ignorados (${report.summary.skip})` },
              ]}
            />

            <DataTable
              caption="Prévia da importação"
              columns={columns}
              rows={rows.slice(0, VISIBLE_ROWS)}
              getRowKey={(row) => String(row.line)}
              rowTone={(row) => (row.action === "error" ? "danger" : row.warnings.length && row.action !== "skip" ? "warning" : undefined)}
              loading={previewing}
              empty={<p className="m-0 py-10 text-center text-[14px] text-ink/60">Nenhuma linha neste filtro.</p>}
            />
            {rows.length > VISIBLE_ROWS && (
              <p className="m-0 text-center text-[12.5px] text-ink/50">
                Mostrando {VISIBLE_ROWS} de {number.format(rows.length)} linhas. Use os filtros para ver as demais.
              </p>
            )}
          </section>

          <div className="sticky bottom-4 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-border bg-card-elevated/90 px-4 py-3 backdrop-blur-xl">
            <span className="mr-auto text-[13px] text-ink/60">
              {previewing
                ? "Validando…"
                : report.summary.error
                  ? "Corrija as linhas com erro na planilha e envie de novo."
                  : writes
                    ? "Tudo certo. Nada é gravado se alguma linha falhar."
                    : "Nenhuma linha para gravar."}
            </span>
            <Button variant="ghost" onClick={() => setAttempt((n) => n + 1)} disabled={previewing || committing}>
              Validar de novo
            </Button>
            <Button onClick={() => void commit()} disabled={blocked || committing || writes === 0}>
              {committing ? <><Loader2 className="animate-spin" aria-hidden /> Importando…</> : `Importar ${number.format(writes)} produto(s)`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
