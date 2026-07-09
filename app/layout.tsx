import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal",
  description: "Portal administrativo y de aplicaciones — ÚNA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
