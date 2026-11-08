import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/shared/config/font";
import { siteMetadata } from "@/shared/config/metadata";
import { themeBootScript, themeStylesheet, themeVariables } from "@/shared/config/theme";
import "./globals.css";
import { ApplicationShell } from "@/widgets/layout";
import { DataProviders } from "@/shared/lib/data-providers";

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
    <html lang="pt-BR" className={fontVariables} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeStylesheet }} />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="font-sans">
        <DataProviders>
          <ApplicationShell>{children}</ApplicationShell>
        </DataProviders>
      </body>
    </html>
  );
}
