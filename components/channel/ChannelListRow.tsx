"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, Heart, Tv } from "lucide-react";
import { Channel } from "@/types/channel";
import { usePreferenceStore } from "@/store/preference-store";
import { getFallbackChannelSvg } from "@/lib/iptv/normalize-channel";
import { getCountryFlag } from "@/lib/iptv/countries";
import { cn } from "@/lib/utils";

interface ChannelListRowProps {
  channel: Channel;
}

export const ChannelListRow = React.memo(function ChannelListRow({ channel }: ChannelListRowProps) {
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

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActivePlayerChannel(channel);
  };

  return (
    <div className="group flex items-center justify-between rounded-xl border border-surface-border/50 bg-surface/60 px-4 py-3 transition-colors hover:border-brand-500/40 hover:bg-surface-secondary">
      {/* Left side: Thumbnail + Name + Metadata */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <Link
          href={`/watch/${encodeURIComponent(channel.id)}`}
          className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-elevated flex items-center justify-center p-1.5"
        >
          {channel.logo && !imageError ? (
            <img
              src={channel.logo}
              alt={channel.name}
              loading="lazy"
              onError={() => setImageError(true)}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <img
              src={fallbackSvg}
              alt={channel.name}
              className="h-full w-full object-cover"
            />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/watch/${encodeURIComponent(channel.id)}`}
              className="font-medium text-sm text-foreground hover:text-brand-400 transition-colors truncate"
            >
              {channel.name}
            </Link>

            {channel.resolution && (
              <span className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-300">
                {channel.resolution}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <Tv className="h-3 w-3 text-brand-400" />
              {channel.group || "General"}
            </span>

            <span>•</span>

            <span className="flex items-center gap-1">
              <span>{flag}</span>
              <span>{channel.country || "Global"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Action buttons */}
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <button
          onClick={handleFavoriteClick}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          className={cn(
            "rounded-lg p-2 transition-colors",
            isFavorited
              ? "text-rose-500 hover:text-rose-400"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
          )}
        >
          <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
        </button>

        <button
          onClick={handlePlayClick}
          className="flex items-center gap-1.5 rounded-lg bg-surface-elevated px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-500 group-hover:bg-brand-600"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Play</span>
        </button>
      </div>
    </div>
  );
});

