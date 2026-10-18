import type { Metadata } from "next";
import { DesignSystemPage } from "@/views/design-system";

export const metadata: Metadata = {
  title: "Design System - Iron Ledger",
  description:
    "Padroes visuais, tokens e componentes UI da arquitetura Iron Ledger.",
};

export default function Page() {
  return <DesignSystemPage />;
}
