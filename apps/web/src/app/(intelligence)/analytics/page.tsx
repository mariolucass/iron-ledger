import type { Metadata } from "next";
import { getAnalyticsSummary, getInflectionPoints } from "@/entities/analytics/api";
import { AnalyticsOverview, AnalyticsUnavailable } from "@/views/analytics/AnalyticsOverview";

export const metadata: Metadata = {
  title: "Analytics - Iron Ledger",
  description: "Resumo e pontos de inflexão detectados no pipeline de analytics.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const single = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : undefined;
  const severity = single("severity")?.toUpperCase();
  const rawOffset = Number(single("offset"));
  const filters = {
    seller_id: single("seller_id")?.trim(),
    metric: single("metric")?.trim(),
    severity:
      severity && ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(severity) ? severity : undefined,
    offset: Number.isSafeInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0,
  };
  try {
    const [summary, points] = await Promise.all([
      getAnalyticsSummary(),
      getInflectionPoints({ ...filters, limit: 20 }),
    ]);
    return <AnalyticsOverview summary={summary} points={points} filters={filters} />;
  } catch {
    return <AnalyticsUnavailable />;
  }
}
