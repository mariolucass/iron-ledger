"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Power } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  LOCATION_TYPES,
  locationTypeLabel,
  warehouseApi,
  type WarehouseLocation,
} from "@/entities/warehouse";
import { withSession } from "@/shared/auth/with-session";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Field, StatusMessage, inputClass, type Status } from "@/shared/ui/form-primitives";
import {
  emptyLocationForm,
  locationFormSchema,
  toLocationFlags,
  toLocationFormValues,
  type LocationFormValues,
} from "../model/location-schema";

type Mode = { kind: "create"; parentId: string } | { kind: "edit"; location: WarehouseLocation } | null;

function LocationForm({
  warehouseId,
  mode,
  locations,
  onDone,
  onCancel,
}: {
  warehouseId: string;
  mode: NonNullable<Mode>;
  locations: WarehouseLocation[];
  onDone: (location: WarehouseLocation, created: boolean) => void;
  onCancel: () => void;
}) {
  const editing = mode.kind === "edit";
  const [status, setStatus] = useState<Status>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: editing ? toLocationFormValues(mode.location) : emptyLocationForm(mode.parentId),
  });

  const submit = handleSubmit(async (values) => {
    setStatus(null);
    try {
      if (mode.kind === "edit") {
        onDone(await withSession(warehouseApi.updateLocation(warehouseId, mode.location.id, toLocationFlags(values))), false);
      } else {
        onDone(
          await withSession(
            warehouseApi.createLocation(warehouseId, {
              ...toLocationFlags(values),
              code: values.code.trim().toUpperCase(),
              type: values.type,
              parentId: values.parentId || null,
            }),
          ),
          true,
        );
      }
    } catch (reason) {
      setStatus({ type: "error", message: reason instanceof Error ? reason.message : "Não foi possível salvar a localização." });
    }
  });

  const check = (name: "isPickable" | "isReceivable", label: string) => (
    <label className="flex h-11 cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
      <input type="checkbox" className="size-4 accent-[var(--primary)]" {...register(name)} /> {label}
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-lg border border-primary/30 bg-background p-4">
      <h3 className="m-0 text-sm font-semibold text-foreground">
        {editing ? `Editar ${mode.location.path}` : "Nova localização"}
      </h3>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Código" error={errors.code?.message}>
          {(props) => <input {...props} {...register("code")} className={`${inputClass} font-mono uppercase`} disabled={editing} autoComplete="off" spellCheck={false} />}
        </Field>
        <Field label="Tipo">
          {(props) => (
            <select {...props} {...register("type")} className={inputClass} disabled={editing}>
              {LOCATION_TYPES.map((type) => <option key={type} value={type}>{locationTypeLabel[type]}</option>)}
            </select>
          )}
        </Field>
        <Field label="Dentro de">
          {(props) => (
            <select {...props} {...register("parentId")} className={inputClass} disabled={editing}>
              <option value="">Raiz do armazém</option>
              {locations.filter((l) => l.isActive).map((l) => <option key={l.id} value={l.id}>{l.path}</option>)}
            </select>
          )}
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <Field label="Nome" error={errors.name?.message}>
            {(props) => <input {...props} {...register("name")} className={inputClass} autoComplete="off" />}
          </Field>
        </div>
        <Field label="Peso máx. (kg)" error={errors.maxWeightKg?.message}>
          {(props) => <input {...props} {...register("maxWeightKg")} className={inputClass} inputMode="decimal" autoComplete="off" />}
        </Field>
        <Field label="Volume máx. (m³)" error={errors.maxVolumeM3?.message}>
          {(props) => <input {...props} {...register("maxVolumeM3")} className={inputClass} inputMode="decimal" autoComplete="off" />}
        </Field>
      </div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        {check("isPickable", "Permite separação")}
        {check("isReceivable", "Permite recebimento")}
        <div className="w-44">
          <Field label="Ordem de separação" error={errors.pickSequence?.message}>
            {(props) => <input {...props} {...register("pickSequence")} className={inputClass} inputMode="numeric" autoComplete="off" />}
          </Field>
        </div>
      </div>
      <StatusMessage status={status} />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando…" : editing ? "Guardar" : "Adicionar"}</Button>
      </div>
    </form>
  );
}

export function LocationsPanel({
  warehouseId,
  locations,
  onChange,
}: {
  warehouseId: string;
  locations: WarehouseLocation[];
  onChange: (locations: WarehouseLocation[]) => void;
}) {
  const [mode, setMode] = useState<Mode>(null);
  const [notice, setNotice] = useState<Status>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const ordered = useMemo(() => [...locations].sort((a, b) => a.path.localeCompare(b.path)), [locations]);

  const toggleActive = async (location: WarehouseLocation) => {
    setNotice(null);
    setBusyId(location.id);
    try {
      const saved = await withSession(warehouseApi.updateLocation(warehouseId, location.id, { isActive: !location.isActive }));
      onChange(locations.map((l) => (l.id === saved.id ? saved : l)));
    } catch (reason) {
      setNotice({ type: "error", message: reason instanceof Error ? reason.message : "Não foi possível alterar a localização." });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-base font-bold text-foreground">Localizações</h2>
          <p className="mt-1 mb-0 text-[13px] text-muted-foreground">Zonas, corredores, estantes e compartimentos do armazém.</p>
        </div>
        <Button variant="outline" onClick={() => setMode({ kind: "create", parentId: "" })}><Plus /> Adicionar</Button>
      </div>

      <div className="mt-4 grid gap-4">
        <StatusMessage status={notice} />
        {mode && (
          <LocationForm
            key={mode.kind === "edit" ? mode.location.id : `new-${mode.parentId}`}
            warehouseId={warehouseId}
            mode={mode}
            locations={locations}
            onCancel={() => setMode(null)}
            onDone={(saved, created) => {
              onChange(created ? [...locations, saved] : locations.map((l) => (l.id === saved.id ? saved : l)));
              setMode(null);
              setNotice({ type: "success", message: created ? "Localização adicionada." : "Localização atualizada." });
            }}
          />
        )}

        {ordered.length === 0 ? (
          <p className="m-0 text-[13px] text-muted-foreground">Nenhuma localização cadastrada.</p>
        ) : (
          <ul className="m-0 grid list-none gap-2 p-0">
            {ordered.map((location) => (
              <li
                key={location.id}
                style={{ marginLeft: (location.path.split("/").length - 1) * 20 }}
                className={`flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 ${location.isActive ? "" : "opacity-60"}`}
              >
                <span className="font-mono text-sm font-semibold text-foreground">{location.code}</span>
                {location.name && <span className="text-sm text-muted-foreground">{location.name}</span>}
                <Badge variant="outline">{locationTypeLabel[location.type]}</Badge>
                {location.isPickable && <Badge variant="secondary">Separação</Badge>}
                {location.isReceivable && <Badge variant="secondary">Recebimento</Badge>}
                {!location.isActive && <Badge variant="warning">Inativa</Badge>}
                <span className="ml-auto flex items-center gap-1">
                  {location.isActive && (
                    <Button size="sm" variant="ghost" onClick={() => setMode({ kind: "create", parentId: location.id })}>
                      <Plus /> Filha
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setMode({ kind: "edit", location })}>Editar</Button>
                  <Button size="sm" variant="ghost" disabled={busyId === location.id} onClick={() => void toggleActive(location)}>
                    <Power /> {location.isActive ? "Desativar" : "Reativar"}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
