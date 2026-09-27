import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CleanQR - Smart URL Cleaner & QR Generator",
  description: "A modern SaaS-style web application to clean URLs and generate high-quality QR codes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased bg-[#0F172A] text-slate-100`}
    >
      <body className={`${inter.className} min-h-full flex flex-col bg-[#0F172A] selection:bg-indigo-500/30`}>{children}</body>
    </html>
  );
}
