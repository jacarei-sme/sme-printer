import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../css/app.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Monitoramento de Impressoras - SME Jacareí',
  description: 'DDashboard para monitoramento de impressoras da Secretaria Municipal de Educação de Jacareí.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
