import type { Metadata } from "next";
import { ForecastingPage } from "@/views/forecasting";

export const metadata: Metadata = {
  title: "Previsoes com IA - Iron Ledger",
  description:
    "Modelos preditivos de machine learning para otimizacao estrategica de estoque e capital.",
};

export default function Page() {
  return <ForecastingPage />;
}
