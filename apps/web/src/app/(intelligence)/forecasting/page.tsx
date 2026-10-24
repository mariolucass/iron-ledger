import { createMetadata } from "@/shared/config/metadata";
import {
  getForecastAccuracy,
  getForecastAccuracyDetail,
  type ForecastAccuracyDetail,
  type ForecastAccuracyResponse,
} from "@/entities/analytics";
import { ForecastingPage } from "@/views/intelligence/forecasting";

export const metadata = createMetadata({
  title: "Previsões com IA",
  description: "Modelos preditivos para otimização estratégica de estoque e capital.",
  path: "/forecasting",
});

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { product } = await searchParams;
  const requested = typeof product === "string" ? product.trim() : "";

  // O serviço de analytics é opcional: sem ele, a página segue com o restante.
  let accuracy: ForecastAccuracyResponse | null = null;
  let detail: ForecastAccuracyDetail | null = null;
  try {
    accuracy = await getForecastAccuracy({ limit: 20 });
    const selected =
      accuracy.items.find((item) => item.product_id === requested) ?? accuracy.items[0];
    if (selected) detail = await getForecastAccuracyDetail(selected.product_id);
  } catch {
    detail = null;
  }

  return <ForecastingPage accuracy={accuracy} detail={detail} />;
}
