import type { Metadata, Viewport } from "next";
import { dmSans, instrumentSerif } from "@/shared/config/font";
import "../styles/index.css";

export const metadata: Metadata = {
  title: "Iron Ledger - O Sistema Operacional Financeiro",
  description:
    "Controle financeiro redefinido com auditoria imutavel, transacoes distribuidas e previsao com IA.",
};

export const viewport: Viewport = {
  themeColor: "#080808",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSans.variable} ${instrumentSerif.variable}`}>
        {children}
      </body>
    </html>
  );
}
