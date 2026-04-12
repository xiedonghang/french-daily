import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FrenchDaily — 每日法语听力",
  description: "每天一篇10分钟法语听力，配5道理解测试题",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-[var(--background)]">
        {/* Global Nav */}
        <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🇫🇷</span>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                FrenchDaily
              </span>
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/listen" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium">
                听力库
              </Link>
            </div>
          </div>
        </nav>

        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-xs text-slate-400">
            <span>© 2026 FrenchDaily · 每天10分钟，轻松学法语</span>
            <span>Powered by YouTube + AI</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
