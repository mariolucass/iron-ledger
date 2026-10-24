import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { fontVariables } from "@/shared/config/font";
import { siteMetadata } from "@/shared/config/metadata";
import { THEME_STORAGE_KEY, themeStylesheet, themeVariables } from "@/shared/config/theme";
import "./globals.css";
import { ApplicationShell } from "@/widgets/layout";

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: themeVariables["--background"],
};

/** Applies the stored theme before first paint, only on application routes (landing and auth stay dark). */
const themeBootScript = `try{var p=location.pathname;if(p!=="/"&&p.indexOf("/login")!==0&&p.indexOf("/register")!==0&&localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={fontVariables} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeStylesheet }} />
      </head>
      <body className="font-sans">
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
        <ApplicationShell>{children}</ApplicationShell>
      </body>
    </html>
  );
}
