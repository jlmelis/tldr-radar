import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TLDR Radar",
  description: "Jev-filtered TLDR newsletter triage with agentic deep-dives",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        <header className="border-b border-neutral-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 bg-white/95 backdrop-blur">
          <Link href="/" className="font-semibold tracking-tight text-[15px]">
            TLDR Radar
          </Link>
          <nav className="flex gap-5 text-sm text-neutral-500">
            <Link href="/" className="hover:text-neutral-900 transition-colors">
              Home
            </Link>
            <Link href="/settings" className="hover:text-neutral-900 transition-colors">
              Settings
            </Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
