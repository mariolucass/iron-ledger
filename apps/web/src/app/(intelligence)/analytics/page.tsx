import { createMetadata } from "@/shared/config/metadata";
import {
  getAnalyticsCatalog,
  getAnalyticsSummary,
  getInflectionPoints,
} from "@/entities/analytics";
import { AnalyticsOverview, AnalyticsUnavailable } from "@/views/intelligence/analytics";

export const metadata = createMetadata({
  title: "Analytics",
  description:
    "Mudanças persistentes em vendas, cancelamento, atraso e avaliação de vendedores e categorias.",
  path: "/analytics",
});

const PAGE_SIZE = 20;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const single = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string).trim() : undefined;
  // Os selects enviam "ALL" quando nenhum filtro é escolhido.
  const oneOf = (key: string, allowed: readonly string[], upper = true) => {
    const raw = single(key);
    const value = upper ? raw?.toUpperCase() : raw;
    return value && allowed.includes(value) ? value : undefined;
  };
  const rawOffset = Number(single("offset"));
  try {
    const catalog = await getAnalyticsCatalog();
    const filters = {
      seller_id: single("seller_id") || undefined,
      metric: oneOf(
        "metric",
        catalog.metrics.map((metric) => metric.name),
        false,
      ),
      severity: oneOf("severity", Object.keys(catalog.severities)),
      classification: oneOf("classification", Object.keys(catalog.classifications)),
      impact: oneOf("impact", ["POSITIVE", "NEGATIVE"]),
      offset: Number.isSafeInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0,
    };
    const [summary, points] = await Promise.all([
      getAnalyticsSummary(),
      getInflectionPoints({ ...filters, limit: PAGE_SIZE }),
    ]);
    return (
      <AnalyticsOverview summary={summary} points={points} catalog={catalog} filters={filters} />
    );
  } catch {
    return <AnalyticsUnavailable />;
  }
}
