"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useFavorites } from "@/hooks/use-favorites";
import { ChannelCard } from "@/components/channel/ChannelCard";
import { Heart, Compass, Search, Tv } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function FavoritesPage() {
  const { favoriteChannels, count, isMounted } = useFavorites();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return favoriteChannels;
    const q = search.toLowerCase().trim();
    return favoriteChannels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    );
  }, [favoriteChannels, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-surface-border/60 bg-gradient-to-r from-rose-950/40 via-surface to-surface p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider">
              <Heart className="h-4 w-4 fill-current" />
              <span>Personal Collection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Favorite Channels
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Quick access to your handpicked live television broadcasts. Saved locally on your device for instant streaming anytime.
            </p>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-center shrink-0">
            <span className="block text-2xl font-black text-rose-300">
              {isMounted ? formatNumber(count) : "—"}
            </span>
            <span className="text-[10px] uppercase font-bold text-rose-400/80">
              Saved Channels
            </span>
          </div>
        </div>
      </div>

      {isMounted && count > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search within your favorites..."
            className="w-full rounded-xl border border-surface-border bg-surface-elevated pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-brand-500"
          />
        </div>
      )}

      {/* Grid or Empty State */}
      {!isMounted ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-video rounded-xl bg-surface-elevated animate-pulse" />
          ))}
        </div>
      ) : count === 0 ? (
        <div className="rounded-2xl border border-surface-border/60 bg-surface/50 p-16 text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Heart className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No favorite channels yet</h3>
            <p className="text-xs text-zinc-400">
              Click the heart icon on any channel card while browsing to save your preferred streams here.
            </p>
          </div>
          <Link
            href="/live-tv"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 transition-colors"
          >
            <Compass className="h-4 w-4" />
            <span>Explore Channels</span>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-surface-border/60 bg-surface/50 p-12 text-center">
          <p className="text-sm text-zinc-400">No favorites match &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      )}
    </div>
  );
}

