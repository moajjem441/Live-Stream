import Link from "next/link";
import { Tv, Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-500/10 border border-brand-500/20 text-brand-400 shadow-2xl">
          <Tv className="h-12 w-12" />
        </div>
        <span className="absolute -bottom-2 -right-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-black text-white">
          404
        </span>
      </div>

      <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
        Channel Frequency Lost
      </h1>
      <p className="mt-3 text-sm text-zinc-400 max-w-sm">
        The stream or page you are searching for does not broadcast on this frequency. Check your URL or return to the live catalog.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>StreamX Home</span>
        </Link>

        <Link
          href="/live-tv"
          className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-elevated px-5 py-2.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
        >
          <Compass className="h-4 w-4 text-brand-400" />
          <span>Browse All Channels</span>
        </Link>
      </div>
    </div>
  );
}

