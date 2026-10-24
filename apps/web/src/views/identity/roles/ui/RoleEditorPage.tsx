"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useEffect, useState, type FormEvent } from "react";
import { userApi, type PermissionInfo, type RoleDetail, type RoleSummary } from "@/entities/user";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader, primaryActionClass, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import { pageWidth } from "@/shared/ui/page-width";

export function RoleEditorPage({ id }: { id?: string }) {
  const router = useRouter();
  const [role, setRole] = useState<RoleDetail | null>(null);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [permissions, setPermissions] = useState<PermissionInfo[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentRoleId, setParentRoleId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    withSession(
      Promise.all([
        userApi.listRoles(),
        userApi.permissions(),
        id ? userApi.role(id) : Promise.resolve(null),
        id ? userApi.rolePermissions(id) : Promise.resolve([]),
      ]),
    )
      .then(([allRoles, allPermissions, detail, grants]) => {
        if (!active) return;
        setRoles(allRoles.items);
        setPermissions(allPermissions);
        setRole(detail);
        setName(detail?.name ?? "");
        setDescription(detail?.description ?? "");
        setParentRoleId(detail?.parentRoleId ?? "");
        setSelected(grants.map((grant) => grant.id));
        setReady(true);
        setLoading(false);
      })
      .catch((reason) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Não foi possível carregar o formulário.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const input = {
        name: name.trim(),
        description: description.trim() || null,
        parentRoleId: parentRoleId || null,
        permissionIds: selected,
      };
      const saved = await withSession(
        id ? userApi.updateRole(id, input) : userApi.createRole(input),
      );
      router.push(`/users/roles/${saved.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o papel.");
      setSaving(false);
    }
  }
  return (
    <Layout title={id ? "Editar papel" : "Novo papel"}>
      <div className={`${pageWidth.wide} pb-10`}>
        <PageHeader
          back={{ href: id ? (`/users/roles/${id}` as Route) : "/users/roles", label: "Papéis" }}
          title={id ? "Editar papel" : "Novo papel"}
          description="Defina o papel, sua herança e as permissões diretas."
        />
        {loading ? (
          <p role="status">Carregando…</p>
        ) : !ready ? (
          <p role="alert" className="rounded-2xl border border-border bg-card p-6">
            {error ?? "Não foi possível carregar o formulário."}
          </p>
        ) : role?.isSystem ? (
          <p role="alert" className="rounded-2xl border border-border bg-card p-6">
            Papéis de sistema não podem ser editados.
          </p>
        ) : (
          <form
            onSubmit={submit}
            className="grid gap-5 rounded-2xl border border-border bg-card p-6"
          >
            <label className="grid gap-2 text-sm font-medium">
              Nome
              <input
                required
                minLength={2}
                maxLength={64}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Descrição
              <textarea
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Papel pai
              <select
                value={parentRoleId}
                onChange={(event) => setParentRoleId(event.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value="">Nenhum</option>
                {roles
                  .filter((item) => item.id !== id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-semibold">Permissões diretas</legend>
              {permissions.length ? (
                permissions.map((item) => (
                  <label key={item.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, item.id]
                            : current.filter((value) => value !== item.id),
                        )
                      }
                    />
                    <span>
                      {item.resource}:{item.action}
                      {item.description ? ` · ${item.description}` : ""}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma permissão cadastrada.</p>
              )}
            </fieldset>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className={primaryActionClass}>
                {saving ? "Salvando…" : "Salvar papel"}
              </button>
              <button type="button" className={secondaryActionClass} onClick={() => router.back()}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
