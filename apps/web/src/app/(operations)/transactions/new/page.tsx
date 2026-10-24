import { createMetadata } from "@/shared/config/metadata";
import { NewTransactionPage } from "@/views/transactions";

export const metadata = createMetadata({
  title: "Nova transação",
  description: "Inicie uma transação de saída com referência externa e simulação de falha.",
  path: "/transactions/new",
});

export default function Page() {
  return <NewTransactionPage />;
}
