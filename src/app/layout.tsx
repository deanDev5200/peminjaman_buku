import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { dbOperations } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  let title = 'Jnana Grha Mandara';
  let description = 'Sistem Peminjaman Buku';

  try {
    title = dbOperations.getSetting('app_title') ?? title;
    description = dbOperations.getSetting('app_subtitle') ?? description;
  } catch {
    // Fall back to defaults when the database is unavailable (e.g. during build).
  }

  return {
    title,
    description,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
