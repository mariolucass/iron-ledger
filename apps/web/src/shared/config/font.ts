import { DM_Serif_Display, JetBrains_Mono, Manrope } from "next/font/google";

export const sans = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const serif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-dm-serif-display",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const fontVariables = `${sans.variable} ${serif.variable} ${mono.variable}`;
