import type { Metadata } from "next";
import AuthProvider from "@/components/providers/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "LaVozDiaria - Noticias · Análisis · Verdad",
  description:
    "Portal de noticias con información veraz sobre Política, Deportes, Economía y Sociedad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-cream font-[family-name:var(--font-body)]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}