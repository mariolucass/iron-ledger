"use client";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useEffect, useState, type FormEvent } from "react";
import { platformApi } from "@/entities/platform";
import { withSession } from "@/shared/auth/with-session";
import { PageHeader, primaryActionClass, secondaryActionClass } from "@/shared/ui/data-list";
import { Layout } from "@/widgets/layout";
import { pageWidth } from "@/shared/ui/page-width";
export function FeatureFlagEditorPage({ id }: { id?: string }) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [rollout, setRollout] = useState(0);
  const [rules, setRules] = useState("");
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    let active = true;
    withSession(platformApi.flag(id))
      .then((item) => {
        if (active) {
          setKey(item.key);
          setDescription(item.description ?? "");
          setIsEnabled(item.isEnabled);
          setRollout(item.rollout);
          setRules(item.rules == null ? "" : (JSON.stringify(item.rules, null, 2) ?? ""));
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Não foi possível carregar a flag.");
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
      let parsed: unknown = null;
      if (rules.trim()) parsed = JSON.parse(rules);
      const input = {
        key: key.trim(),
        description: description.trim() || null,
        isEnabled,
        rollout,
        rules: parsed,
      };
      const result = await withSession(
        id ? platformApi.updateFlag(id, input) : platformApi.createFlag(input),
      );
      router.push(`/system/feature-flags/${result.id}`);
    } catch (reason) {
      setError(
        reason instanceof SyntaxError
          ? "As regras precisam estar em JSON válido."
          : reason instanceof Error
            ? reason.message
            : "Não foi possível salvar a flag.",
      );
      setSaving(false);
    }
  }
  return (
    <Layout title={id ? "Editar feature flag" : "Nova feature flag"}>
      <div className={`${pageWidth.wide} pb-10`}>
        <PageHeader
          back={{
            href: id ? (`/system/feature-flags/${id}` as Route) : "/system/feature-flags",
            label: "Feature flags",
          }}
          title={id ? "Editar feature flag" : "Nova feature flag"}
          description="Configure liberação, percentual de rollout e regras em JSON."
        />
        {loading ? (
          <p role="status">Carregando…</p>
        ) : id && error && !key ? (
          <p role="alert">{error}</p>
        ) : (
          <form
            onSubmit={submit}
            className="grid gap-5 rounded-2xl border border-border bg-card p-6"
          >
            <label className="grid gap-2 text-sm font-medium">
              Chave
              <input
                required
                minLength={2}
                maxLength={120}
                pattern="[a-z0-9][a-z0-9._-]*"
                value={key}
                onChange={(event) => setKey(event.target.value)}
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
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(event) => setIsEnabled(event.target.checked)}
              />
              Ativada
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Rollout (%)
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={rollout}
                onChange={(event) => setRollout(Number(event.target.value))}
                className="rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Regras (JSON)
              <textarea
                rows={8}
                value={rules}
                onChange={(event) => setRules(event.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
                placeholder='{"roles": ["ADMIN"]}'
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className={primaryActionClass}>
                {saving ? "Salvando…" : "Salvar flag"}
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
