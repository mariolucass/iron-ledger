import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/shared/config/font";
import { siteMetadata } from "@/shared/config/metadata";
import { themeVariables } from "@/shared/config/theme";
import "./globals.css";
import { ApplicationShell } from "@/widgets/layout";

export const metadata: Metadata = siteMetadata;

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
        <ApplicationShell>{children}</ApplicationShell>
      </body>
    </html>
  );
}
