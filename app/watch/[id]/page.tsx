"use client";

import React, { useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useChannels } from "@/hooks/use-channels";
import { usePreferenceStore } from "@/store/preference-store";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { ChannelCard } from "@/components/channel/ChannelCard";
import { ChannelCardSkeleton } from "@/components/ui/Skeleton";
import {
  Tv,
  Heart,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
  Radio,
  Keyboard,
  Compass,
} from "lucide-react";
import { getCountryFlag } from "@/lib/iptv/countries";
import { cn } from "@/lib/utils";

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id ? decodeURIComponent(params.id as string) : "";

  const { channels, isLoading, getChannelById } = useChannels();
  const favorites = usePreferenceStore((s) => s.favorites);
  const toggleFavorite = usePreferenceStore((s) => s.toggleFavorite);
  const addRecentlyWatched = usePreferenceStore((s) => s.addRecentlyWatched);
  const setActivePlayerChannel = usePreferenceStore((s) => s.setActivePlayerChannel);

  // Find the target channel
  const channel = useMemo(() => {
    if (!rawId || !channels.length) return undefined;
    return getChannelById(rawId);
  }, [rawId, channels, getChannelById]);

  // Track recently watched & sync with mini player for navigation
  useEffect(() => {
    if (channel) {
      addRecentlyWatched(channel.id);
      setActivePlayerChannel(channel);
    }
  }, [channel, addRecentlyWatched, setActivePlayerChannel]);

  // Find channel index in dataset for Next/Prev
  const currentIndex = useMemo(() => {
    if (!channel || !channels.length) return -1;
    return channels.findIndex((c) => c.id === channel.id);
  }, [channel, channels]);

  const prevChannel = currentIndex > 0 ? channels[currentIndex - 1] : undefined;
  const nextChannel = currentIndex >= 0 && currentIndex < channels.length - 1 ? channels[currentIndex + 1] : undefined;

  const handleNext = () => {
    if (nextChannel) {
      router.push(`/watch/${encodeURIComponent(nextChannel.id)}`);
    }
  };

  const handlePrev = () => {
    if (prevChannel) {
      router.push(`/watch/${encodeURIComponent(prevChannel.id)}`);
    }
  };

  // Find similar channels in same group
  const similarChannels = useMemo(() => {
    if (!channel || !channels.length) return [];
    return channels
      .filter((c) => c.id !== channel.id && c.group === channel.group)
      .slice(0, 8);
  }, [channel, channels]);

  if (channels.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="aspect-video w-full rounded-2xl bg-surface-elevated animate-pulse" />
        <div className="h-10 w-1/3 rounded-lg bg-surface-elevated animate-pulse" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated text-zinc-400">
          <Tv className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Channel Not Found</h2>
        <p className="text-xs text-zinc-400">
          The requested channel ID does not exist in the current playlist.
        </p>
        <Link
          href="/live-tv"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          <Compass className="h-4 w-4" />
          <span>Browse All Channels</span>
        </Link>
      </div>
    );
  }

  const isFavorited = favorites.includes(channel.id);
  const flag = getCountryFlag(channel.countryCode);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      {/* Top Breadcrumb & Next/Prev Quick Navigation */}
      <div className="flex items-center justify-between gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Link href="/live-tv" className="hover:text-white transition-colors">
            Live TV
          </Link>
          <span>/</span>
          <Link
            href={`/live-tv?category=${encodeURIComponent(channel.group)}`}
            className="hover:text-white transition-colors"
          >
            {channel.group}
          </Link>
          <span>/</span>
          <span className="text-white font-medium truncate max-w-xs">{channel.name}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrev}
            disabled={!prevChannel}
            className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface-elevated px-2.5 py-1 hover:text-white disabled:opacity-40 transition-colors"
            title={prevChannel ? `Previous: ${prevChannel.name}` : "No previous channel"}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Prev Channel</span>
          </button>
          <button
            onClick={handleNext}
            disabled={!nextChannel}
            className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface-elevated px-2.5 py-1 hover:text-white disabled:opacity-40 transition-colors"
            title={nextChannel ? `Next: ${nextChannel.name}` : "No next channel"}
          >
            <span className="hidden sm:inline">Next Channel</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Player on Left, Side Details & Queue on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 spans): Video Player & Channel Info */}
        <div className="lg:col-span-2 space-y-6">
          <VideoPlayer
            channel={channel}
            onNextChannel={handleNext}
            onPrevChannel={handlePrev}
            hasNext={Boolean(nextChannel)}
            hasPrev={Boolean(prevChannel)}
          />

          {/* Channel Details Banner */}
          <div className="rounded-2xl border border-surface-border/60 bg-surface/80 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {channel.name}
                  </h1>
                  {channel.resolution && (
                    <span className="rounded bg-brand-500/20 px-2 py-0.5 text-xs font-bold text-brand-300 border border-brand-500/30">
                      {channel.resolution}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Transmission
                  </span>
                  <span>•</span>
                  <span>{channel.group}</span>
                  <span>•</span>
                  <span>{flag} {channel.country}</span>
                  {channel.language && channel.language !== "Unknown" && (
                    <>
                      <span>•</span>
                      <span>Lang: {channel.language}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFavorite(channel.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-xs font-medium transition-colors",
                    isFavorited
                      ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
                      : "text-zinc-300 hover:text-white"
                  )}
                >
                  <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
                  <span>{isFavorited ? "Favorited" : "Favorite"}</span>
                </button>

                <a
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-elevated px-3 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
                  title="Raw stream URL"
                >
                  <span>Raw M3U8</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Keyboard Shortcuts Hint Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-surface-border/40 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1 text-zinc-300 font-semibold">
                <Keyboard className="h-3.5 w-3.5 text-brand-400" />
                Shortcuts:
              </span>
              <span><kbd className="rounded bg-black/40 px-1 py-0.5 border border-white/5">Space</kbd> Play/Pause</span>
              <span><kbd className="rounded bg-black/40 px-1 py-0.5 border border-white/5">F</kbd> Fullscreen</span>
              <span><kbd className="rounded bg-black/40 px-1 py-0.5 border border-white/5">M</kbd> Mute</span>
              <span><kbd className="rounded bg-black/40 px-1 py-0.5 border border-white/5">←</kbd> <kbd className="rounded bg-black/40 px-1 py-0.5 border border-white/5">→</kbd> Channels</span>
              <span><kbd className="rounded bg-black/40 px-1 py-0.5 border border-white/5">↑</kbd> <kbd className="rounded bg-black/40 px-1 py-0.5 border border-white/5">↓</kbd> Volume</span>
            </div>
          </div>
        </div>

        {/* Right Column: Similar Channels Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              More in {channel.group}
            </h2>
            <Link
              href={`/live-tv?category=${encodeURIComponent(channel.group)}`}
              className="text-xs text-brand-400 hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {similarChannels.map((c) => (
              <ChannelCard key={c.id} channel={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

