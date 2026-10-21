import { createMetadata } from "@/shared/config/metadata";
import { ForecastingPage } from "@/views/forecasting";

export const metadata = createMetadata({
  title: "Previsões com IA",
  description: "Modelos preditivos para otimização estratégica de estoque e capital.",
  path: "/forecasting",
});

export default function Page() {
  return <ForecastingPage />;
}
