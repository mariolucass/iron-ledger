import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnalyticsError, getInflectionPoint } from "@/entities/analytics/api";
import { AnalyticsPointDetail } from "@/views/analytics/AnalyticsPointDetail";
import { AnalyticsUnavailable } from "@/views/analytics/AnalyticsOverview";

export const metadata: Metadata = { title: "Ponto de inflexão - Iron Ledger" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const point = await getInflectionPoint(slug);
    return <AnalyticsPointDetail point={point} />;
  } catch (error) {
    if (error instanceof AnalyticsError && error.status === 404) notFound();
    return <AnalyticsUnavailable />;
  }
}
