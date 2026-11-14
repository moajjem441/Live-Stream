"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, Heart, Tv } from "lucide-react";
import { Channel } from "@/types/channel";
import { usePreferenceStore } from "@/store/preference-store";
import { getFallbackChannelSvg } from "@/lib/iptv/normalize-channel";
import { getCountryFlag } from "@/lib/iptv/countries";
import { cn } from "@/lib/utils";

interface ChannelCardProps {
  channel: Channel;
  priority?: boolean;
}

export const ChannelCard = React.memo(function ChannelCard({ channel }: ChannelCardProps) {
  const [imageError, setImageError] = useState(false);
  const favorites = usePreferenceStore((s) => s.favorites);
  const toggleFavorite = usePreferenceStore((s) => s.toggleFavorite);
  const setActivePlayerChannel = usePreferenceStore((s) => s.setActivePlayerChannel);

  const isFavorited = favorites.includes(channel.id);
  const fallbackSvg = getFallbackChannelSvg(channel.name, channel.group);
  const flag = getCountryFlag(channel.countryCode);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(channel.id);
  };

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActivePlayerChannel(channel);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-surface-border/60 bg-surface/80 p-3 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:bg-surface-secondary hover:shadow-xl hover:shadow-brand-500/10">
      {/* Thumbnail / Logo Area */}
      <Link
        href={`/watch/${encodeURIComponent(channel.id)}`}
        className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-elevated/80 flex items-center justify-center p-3"
      >
        {channel.logo && !imageError ? (
          <img
            src={channel.logo}
            alt={channel.name}
            loading="lazy"
            onError={() => setImageError(true)}
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <img
            src={fallbackSvg}
            alt={channel.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          {channel.resolution && (
            <span className="rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-brand-300 backdrop-blur-md border border-brand-500/20">
              {channel.resolution}
            </span>
          )}
          <span className="flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 backdrop-blur-md border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>

        {/* Country Flag */}
        {channel.countryCode && (
          <div
            className="absolute top-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-xs backdrop-blur-md border border-white/10"
            title={`${channel.country} (${channel.countryCode})`}
          >
            {flag}
          </div>
        )}

        {/* Hover Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
          <button
            onClick={handleQuickPlay}
            title="Quick Play in Player"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/50 transition-transform duration-200 hover:scale-110 active:scale-95"
          >
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </button>
        </div>
      </Link>

      {/* Info Area */}
      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/watch/${encodeURIComponent(channel.id)}`}
            className="font-medium text-sm text-foreground line-clamp-1 hover:text-brand-400 transition-colors"
            title={channel.name}
          >
            {channel.name}
          </Link>

          {/* Favorite Toggle Button */}
          <button
            onClick={handleFavoriteClick}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            className={cn(
              "shrink-0 rounded-full p-1.5 transition-colors duration-200",
              isFavorited
                ? "text-rose-500 hover:text-rose-400"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            )}
          >
            <Heart
              className={cn("h-4 w-4 transition-transform active:scale-125", isFavorited && "fill-current")}
            />
          </button>
        </div>

        {/* Footer info: Category and Country */}
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
            <Tv className="h-3 w-3 text-brand-400" />
            {channel.group || "General"}
          </span>

          <span className="truncate text-[11px] text-zinc-500 max-w-[90px]">
            {channel.country || "Global"}
          </span>
        </div>
      </div>
    </div>
  );
});

