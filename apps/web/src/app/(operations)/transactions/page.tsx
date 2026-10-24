import { createMetadata } from "@/shared/config/metadata";
import { TransactionsPage } from "@/views/operations/transactions";

export const metadata = createMetadata({
  title: "Transações",
  description:
    "Acompanhamento, gestão e liquidação de transações distribuídas baseadas em eventos.",
  path: "/transactions",
});

export default function Page() {
  return <TransactionsPage />;
}
