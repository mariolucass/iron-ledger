import { notFound } from "next/navigation";
import { AnalyticsError, getInflectionPoint } from "@/entities/analytics";
import { createMetadata } from "@/shared/config/metadata";
import { AnalyticsPointDetail } from "@/views/analytics";
import { AnalyticsUnavailable } from "@/views/analytics";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const point = await getInflectionPoint(slug);
    return createMetadata({
      title: `Ponto de inflexão em ${point.metric}`,
      description: point.explanation,
    });
  } catch {
    // Página de erro/404: o próprio componente trata; o título genérico basta.
    return createMetadata({ title: "Ponto de inflexão" });
  }
}

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
