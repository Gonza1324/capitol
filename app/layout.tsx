import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Capitol Hub",
  description: "Plataforma interna para Capitol",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
