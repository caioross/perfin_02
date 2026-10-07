import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AvisoNovaVersao from "@/componentes/pwa/AvisoNovaVersao";
import BannerOffline from "@/componentes/pwa/BannerOffline";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Portal Perfin", template: "%s · Portal Perfin" },
  description: "Central de análise econômica do time Perfin: indicadores, relatórios e assistente.",
  applicationName: "Portal Perfin",
  appleWebApp: { capable: true, title: "Perfin", statusBarStyle: "default" },
  icons: {
    apple: [{ url: "/icones/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f6e66" },
    { media: "(prefers-color-scheme: dark)", color: "#0e141a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <BannerOffline />
        {children}
        <AvisoNovaVersao />
      </body>
    </html>
  );
}
