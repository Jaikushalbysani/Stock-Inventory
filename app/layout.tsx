import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nandagopala Rice Mill — Inventory",
  description: "Daily rice stock management — inward, outward and live stock by bag weight (kg).",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
