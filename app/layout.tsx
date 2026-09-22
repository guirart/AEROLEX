import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroLex | Inteligência jurídica para Direito Aéreo",
  description: "Leitura estruturada de documentos jurídicos com partes, citações, teses, provas e riscos.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
