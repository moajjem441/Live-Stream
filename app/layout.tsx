import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar/Navbar";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import Link from "next/link";
import { Tv, Heart, Shield, Radio, Github } from "lucide-react";

export const metadata: Metadata = {
  title: "StreamX — Premium IPTV Live TV Streaming Platform",
  description:
    "Next-generation live IPTV streaming platform powered by a centralized M3U playlist. Watch thousands of news, sports, movies, and entertainment channels in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-brand-500 selection:text-white">
        {/* Navigation Bar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1">{children}</main>

        {/* Global Picture-in-Picture Mini Player */}
        <MiniPlayer />

        {/* Premium Dark Footer */}
        <footer className="mt-20 border-t border-surface-border/60 bg-surface/50 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Brand and Description */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white shadow">
                    <Tv className="h-4 w-4" />
                  </div>
                  <span className="text-lg font-black tracking-tight text-white">
                    STREAM<span className="text-brand-400">X</span>
                  </span>
                </div>
                <p className="max-w-md text-xs text-zinc-400">
                  A high-performance live TV dashboard built on Next.js, HLS.js, and a single centralized IPTV playlist architecture.
                </p>
              </div>

              {/* Quick Links */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
                <Link href="/live-tv" className="hover:text-brand-300 transition-colors">
                  All Channels
                </Link>
                <Link href="/sports" className="hover:text-brand-300 transition-colors">
                  Sports
                </Link>
                <Link href="/movies" className="hover:text-brand-300 transition-colors">
                  Movies
                </Link>
                <Link href="/news" className="hover:text-brand-300 transition-colors">
                  News
                </Link>
                <Link href="/favorites" className="hover:text-brand-300 transition-colors">
                  Favorites
                </Link>
              </div>
            </div>

            <div className="mt-8 border-t border-surface-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
              <p>
                © {new Date().getFullYear()} StreamX. Powered strictly by iptv-org index playlist.
              </p>
              <p className="flex items-center gap-1.5 text-zinc-400">
                <Shield className="h-3 w-3 text-brand-400" />
                <span>Single Source of Truth Architecture</span>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

