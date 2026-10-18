import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/shared/config/font";
import { themeVariables } from "@/shared/config/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Iron Ledger - O Sistema Operacional Financeiro",
  description:
    "Controle financeiro redefinido com auditoria imutavel, transacoes distribuidas e previsao com IA.",
};

export const viewport: Viewport = {
  themeColor: themeVariables["--background"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={fontVariables} style={themeVariables}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
