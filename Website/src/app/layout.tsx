import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const urlSite = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: urlSite ? new URL(urlSite) : undefined,
  title: "Perfin — Central de análise econômica",
  description: "Termômetro econômico com os últimos indicadores do Banco Central e o Portal Perfin: painéis, relatórios e assistente de IA.",
  openGraph: { title: "Perfin — Central de análise econômica", locale: "pt_BR", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
