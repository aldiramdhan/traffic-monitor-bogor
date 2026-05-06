import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Traffic Monitor Bogor - Sistem Pemantauan Lalu Lintas Real-time",
  description: "Aplikasi pemantauan lalu lintas real-time untuk Kota Bogor dengan teknologi CCTV streaming dan analisis AI menggunakan Google Gemini",
  keywords: "traffic monitoring, Bogor, CCTV, AI analysis, real-time, lalu lintas",
  authors: [{ name: "Traffic Monitor Team" }],
  openGraph: {
    title: "Traffic Monitor Bogor",
    description: "Sistem Pemantauan Lalu Lintas Real-time dengan AI",
    type: "website",
    locale: "id_ID",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
