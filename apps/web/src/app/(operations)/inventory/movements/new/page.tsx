import { createMetadata } from "@/shared/config/metadata";
import { NewMovementPage } from "@/views/inventory";

export const metadata = createMetadata({
  title: "Novo movimento",
  description: "Registre um movimento de estoque com referência e observação.",
  path: "/inventory/movements/new",
});

export default function Page() {
  return <NewMovementPage />;
}
