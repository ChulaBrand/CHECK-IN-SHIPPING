import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Check-In Shipping",
  description: "Registro de entrada de camiones para carga y descarga.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-950 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
