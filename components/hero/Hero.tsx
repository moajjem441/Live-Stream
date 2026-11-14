"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, Compass, Tv, Sparkles, Volume2, Heart } from "lucide-react";
import { Channel } from "@/types/channel";
import { usePreferenceStore } from "@/store/preference-store";
import { getCountryFlag } from "@/lib/iptv/countries";
import { getFallbackChannelSvg } from "@/lib/iptv/normalize-channel";

interface HeroProps {
  featuredChannel?: Channel;
}

export function Hero({ featuredChannel }: HeroProps) {
  const [logoError, setLogoError] = useState(false);
  const favorites = usePreferenceStore((s) => s.favorites);
  const toggleFavorite = usePreferenceStore((s) => s.toggleFavorite);
  const setActivePlayerChannel = usePreferenceStore((s) => s.setActivePlayerChannel);

  if (!featuredChannel) return null;

  const isFavorited = favorites.includes(featuredChannel.id);
  const flag = getCountryFlag(featuredChannel.countryCode);
  const fallbackSvg = getFallbackChannelSvg(featuredChannel.name, featuredChannel.group);

  const handleWatchLive = () => {
    setActivePlayerChannel(featuredChannel);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-surface-border/60 bg-gradient-to-r from-surface via-surface-secondary to-surface p-6 sm:p-10 lg:p-12 shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between gap-8">
        {/* Left Column: Info & CTAs */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          {/* Top Badges */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              FEATURED LIVE STREAM
            </span>

            <span className="flex items-center gap-1 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300 border border-brand-500/20">
              <Sparkles className="h-3 w-3" />
              {featuredChannel.group || "General"}
            </span>

            {featuredChannel.resolution && (
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-zinc-300 border border-white/10">
                {featuredChannel.resolution}
              </span>
            )}

            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <span>{flag}</span>
              <span>{featuredChannel.country}</span>
            </span>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {featuredChannel.name}
            </h1>
            <p className="max-w-xl text-sm sm:text-base text-zinc-400 leading-relaxed mx-auto lg:mx-0">
              Live broadcast streaming worldwide in high definition. Enjoy uninterrupted entertainment, real-time broadcasts, and seamless playback on StreamX.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <Link
              href={`/watch/${encodeURIComponent(featuredChannel.id)}`}
              onClick={handleWatchLive}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-600 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Watch Live Now</span>
            </Link>

            <Link
              href="/live-tv"
              className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-elevated/70 px-5 py-3.5 text-sm font-medium text-zinc-200 transition-all hover:bg-surface-elevated hover:text-white hover:border-zinc-700"
            >
              <Compass className="h-4 w-4 text-brand-400" />
              <span>Explore All Channels</span>
            </Link>

            <button
              onClick={() => toggleFavorite(featuredChannel.id)}
              className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-elevated/40 px-4 py-3.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-surface-elevated transition-colors"
            >
              <Heart
                className={`h-4 w-4 ${isFavorited ? "fill-rose-500 text-rose-500" : ""}`}
              />
              <span>{isFavorited ? "Favorited" : "Favorite"}</span>
            </button>
          </div>
        </div>

        {/* Right Column: High Quality Channel Display */}
        <div className="w-full max-w-sm sm:max-w-md shrink-0">
          <div className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-surface-border/80 bg-surface-elevated p-6 shadow-2xl flex items-center justify-center">
            {featuredChannel.logo && !logoError ? (
              <img
                src={featuredChannel.logo}
                alt={featuredChannel.name}
                onError={() => setLogoError(true)}
                className="max-h-full max-w-full object-contain filter drop-shadow-lg transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <img
                src={fallbackSvg}
                alt={featuredChannel.name}
                className="h-full w-full object-cover rounded-xl"
              />
            )}

            {/* Subtle gloss reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/5 pointer-events-none" />

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-zinc-300 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              <span className="flex items-center gap-1.5 font-medium">
                <Tv className="h-3.5 w-3.5 text-brand-400" />
                Live Broadcast
              </span>
              <span className="text-[11px] text-zinc-400">StreamX Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

