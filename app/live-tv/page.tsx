"use client";

import React, { useMemo } from "react";
import { useChannels } from "@/hooks/use-channels";
import { useChannelStore } from "@/store/channel-store";
import { ChannelFilters } from "@/components/filters/ChannelFilters";
import { ChannelCard } from "@/components/channel/ChannelCard";
import { ChannelListRow } from "@/components/channel/ChannelListRow";
import { ChannelCardSkeleton } from "@/components/ui/Skeleton";
import { ChevronLeft, ChevronRight, Tv, AlertCircle } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function LiveTvPage() {
  const { channels, isLoading, error } = useChannels();
  const getFilteredChannels = useChannelStore((s) => s.getFilteredChannels);
  const viewMode = useChannelStore((s) => s.viewMode);
  const itemsPerPage = useChannelStore((s) => s.itemsPerPage);
  const currentPage = useChannelStore((s) => s.currentPage);
  const setPage = useChannelStore((s) => s.setPage);

  const filteredChannels = useMemo(() => {
    if (!channels.length) return [];
    return getFilteredChannels();
  }, [getFilteredChannels, channels]);

  const totalPages = Math.ceil(filteredChannels.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedChannels = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return filteredChannels.slice(start, start + itemsPerPage);
  }, [filteredChannels, safeCurrentPage, itemsPerPage]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Tv className="h-4 w-4" />
            <span>Complete Live Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            All Live TV Channels
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Browse, search and filter every channel from our central dataset.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-surface-border bg-surface-elevated/80 px-4 py-2 text-center">
            <span className="block text-lg font-black text-brand-400">
              {formatNumber(channels.length)}
            </span>
            <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
              Total Channels
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <ChannelFilters
        totalCount={channels.length}
        filteredCount={filteredChannels.length}
      />

      {/* Channel Grid or List */}
      {isLoading && channels.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ChannelCardSkeleton key={i} />
          ))}
        </div>
      ) : paginatedChannels.length === 0 ? (
        <div className="rounded-2xl border border-surface-border/60 bg-surface/50 p-16 text-center">
          <Tv className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
          <h3 className="text-base font-bold text-white">No channels found</h3>
          <p className="mt-1 text-xs text-zinc-400">
            Try adjusting your search query, country, or category filters.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedChannels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedChannels.map((channel) => (
            <ChannelListRow key={channel.id} channel={channel} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-surface-border/60">
          <p className="text-xs text-zinc-400">
            Showing Page <strong className="text-white">{safeCurrentPage}</strong> of{" "}
            <strong className="text-white">{totalPages}</strong> (
            {formatNumber(filteredChannels.length)} channels)
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(safeCurrentPage - 1)}
              disabled={safeCurrentPage <= 1}
              className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {/* Quick jump page numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {generatePaginationPages(safeCurrentPage, totalPages).map((p, idx) =>
                p === "..." ? (
                  <span key={`dots-${idx}`} className="px-2 text-xs text-zinc-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${p}`}
                    onClick={() => setPage(Number(p))}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                      safeCurrentPage === p
                        ? "bg-brand-500 text-white"
                        : "bg-surface-elevated text-zinc-400 hover:text-white border border-surface-border"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => setPage(safeCurrentPage + 1)}
              disabled={safeCurrentPage >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function generatePaginationPages(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }

  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
}

