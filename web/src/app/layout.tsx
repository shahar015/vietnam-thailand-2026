import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "וייטנאם ותאילנד",
  description: "המסלול, הלילות והמלונות של הטיול בנובמבר 2026",
  appleWebApp: { capable: true, title: "הטיול", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f2f2f7",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
