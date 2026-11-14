"use client";

import React, { useState, useMemo } from "react";
import { useChannels } from "@/hooks/use-channels";
import { useRecentlyWatched } from "@/hooks/use-recently-watched";
import { ChannelCard } from "@/components/channel/ChannelCard";
import { ChannelCardSkeleton } from "@/components/ui/Skeleton";
import { Newspaper, Search, History, ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function NewsPage() {
  const { channels, isLoading, getChannelsByCategory } = useChannels();
  const { recentChannels } = useRecentlyWatched();

  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 48;

  const newsChannels = useMemo(() => {
    if (!channels.length) return [];
    return getChannelsByCategory("news");
  }, [getChannelsByCategory, channels]);

  const recentNewsChannels = useMemo(() => {
    return recentChannels.filter((c) =>
      c.group.toLowerCase().includes("news") ||
      c.categories.some((cat) => cat.toLowerCase().includes("news"))
    );
  }, [recentChannels]);

  const countries = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of newsChannels) {
      if (c.countryCode) {
        map.set(c.countryCode, (map.get(c.countryCode) || 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [newsChannels]);

  const filtered = useMemo(() => {
    let result = newsChannels;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q)
      );
    }

    if (selectedCountry !== "all") {
      result = result.filter((c) => c.countryCode === selectedCountry);
    }

    return result;
  }, [newsChannels, search, selectedCountry]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginated = filtered.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-surface-border/60 bg-gradient-to-r from-blue-950/40 via-surface to-surface p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Newspaper className="h-4 w-4" />
              <span>World Headlines & 24/7 Coverage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Global News Channels
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Stay informed with real-time news broadcasts, live press conferences, and international coverage from premier networks worldwide.
            </p>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-center shrink-0">
            <span className="block text-2xl font-black text-blue-300">
              {formatNumber(newsChannels.length)}
            </span>
            <span className="text-[10px] uppercase font-bold text-blue-400/80">
              News Channels
            </span>
          </div>
        </div>
      </div>

      {/* Recently Watched News Channels (if any) */}
      {recentNewsChannels.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <History className="h-4 w-4 text-brand-400" />
            <span>Recently Watched News</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {recentNewsChannels.slice(0, 4).map((c) => (
              <ChannelCard key={c.id} channel={c} />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-surface-border/60 bg-surface/70 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search news channels by name or country..."
            className="w-full rounded-xl border border-surface-border bg-surface-elevated pl-9 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <select
            value={selectedCountry}
            onChange={(e) => {
              setSelectedCountry(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-surface-border bg-surface-elevated px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Countries ({newsChannels.length})</option>
            {countries.map(([code, count]) => (
              <option key={code} value={code}>
                {code} ({count} channels)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {channels.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ChannelCardSkeleton key={i} />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="rounded-2xl border border-surface-border/60 bg-surface/50 p-16 text-center">
          <Newspaper className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
          <h3 className="text-base font-bold text-white">No news channels found</h3>
          <p className="mt-1 text-xs text-zinc-400">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginated.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-surface-border/60 text-xs text-zinc-400">
          <span>Page {safePage} of {totalPages} ({formatNumber(filtered.length)} channels)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(safePage - 1)}
              disabled={safePage <= 1}
              className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={() => setCurrentPage(safePage + 1)}
              disabled={safePage >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

