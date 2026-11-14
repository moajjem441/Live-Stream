"use client";

import React, { useState, useMemo } from "react";
import { useChannels } from "@/hooks/use-channels";
import { ChannelCard } from "@/components/channel/ChannelCard";
import { ChannelCardSkeleton } from "@/components/ui/Skeleton";
import {
  Trophy,
  Search,
  Calendar,
  Radio,
  Info,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

const SPORTS_TABS = [
  { id: "all", label: "All Sports Channels" },
  { id: "live", label: "Live Matches" },
  { id: "upcoming", label: "Upcoming Fixtures" },
  { id: "football", label: "Football" },
  { id: "cricket", label: "Cricket" },
  { id: "tennis", label: "Tennis" },
  { id: "basketball", label: "Basketball" },
  { id: "other", label: "Other Sports" },
];

export default function SportsPage() {
  const { channels, isLoading, getChannelsByCategory } = useChannels();

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 48;

  // Real sports channels from playlist
  const allSportsChannels = useMemo(() => {
    if (!channels.length) return [];
    return getChannelsByCategory("sports");
  }, [getChannelsByCategory, channels]);

  // Specific sport filtering based on channel names
  const sportFilteredChannels = useMemo(() => {
    if (activeTab === "all" || activeTab === "live" || activeTab === "upcoming") {
      return allSportsChannels;
    }
    const keyword = activeTab.toLowerCase();
    return allSportsChannels.filter((c) =>
      c.name.toLowerCase().includes(keyword) ||
      c.tvgName.toLowerCase().includes(keyword)
    );
  }, [allSportsChannels, activeTab]);

  const countries = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of sportFilteredChannels) {
      if (c.countryCode) {
        map.set(c.countryCode, (map.get(c.countryCode) || 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sportFilteredChannels]);

  const filtered = useMemo(() => {
    let result = sportFilteredChannels;

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
  }, [sportFilteredChannels, search, selectedCountry]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginated = filtered.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-surface-border/60 bg-gradient-to-r from-emerald-950/40 via-surface to-surface p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Trophy className="h-4 w-4" />
              <span>Live Sports & Athletics Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Sports TV Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Tune into live sports broadcasts from across the globe, featuring continuous football, cricket, racing, basketball, and athletics channels.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-center shrink-0">
            <span className="block text-2xl font-black text-emerald-300">
              {formatNumber(allSportsChannels.length)}
            </span>
            <span className="text-[10px] uppercase font-bold text-emerald-400/80">
              Sports Channels
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Sports Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-surface-border/60">
        {SPORTS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                  : "bg-surface-elevated/60 text-zinc-400 hover:bg-surface-elevated hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Honest Match Information Architecture Notice for "live" or "upcoming" tabs */}
      {(activeTab === "live" || activeTab === "upcoming") && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6 backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-400 shrink-0">
              <Info className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-bold text-amber-200">
                Live Fixtures & Match Schedule API Not Configured
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                The primary IPTV playlist supplies 24/7 live television feeds, but does not provide reliable match schedule or score metadata. In accordance with StreamX integrity standards, no simulated or fake fixtures are displayed.
              </p>
              <p className="text-xs text-amber-300/80 pt-1">
                You can watch live sports broadcasts 24/7 on the {allSportsChannels.length} sports channels listed below:
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
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
            placeholder="Search sports channels (e.g. ESPN, Sky, Bein, Eurosport)..."
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
            <option value="all">All Countries ({sportFilteredChannels.length})</option>
            {countries.map(([code, count]) => (
              <option key={code} value={code}>
                {code} ({count} channels)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sports Channel Grid */}
      {channels.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ChannelCardSkeleton key={i} />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="rounded-2xl border border-surface-border/60 bg-surface/50 p-16 text-center">
          <Trophy className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
          <h3 className="text-base font-bold text-white">No sports channels found for this tab</h3>
          <p className="mt-1 text-xs text-zinc-400">
            Check &quot;All Sports Channels&quot; tab to explore all {allSportsChannels.length} available feeds.
          </p>
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

