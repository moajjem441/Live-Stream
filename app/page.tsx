"use client";

import React, { useMemo } from "react";
import { useChannels } from "@/hooks/use-channels";
import { useRecentlyWatched } from "@/hooks/use-recently-watched";
import { useFavorites } from "@/hooks/use-favorites";
import { Hero } from "@/components/hero/Hero";
import { HorizontalChannelRow } from "@/components/sections/HorizontalChannelRow";
import { HeroSkeleton, HorizontalRowSkeleton } from "@/components/ui/Skeleton";
import {
  Flame,
  History,
  Trophy,
  Film,
  Newspaper,
  Popcorn,
  Music,
  Smile,
  Heart,
  AlertCircle,
  RotateCw,
} from "lucide-react";

export default function HomePage() {
  const { channels, isLoading, error, refreshChannels, getChannelsByCategory } = useChannels();
  const { recentChannels } = useRecentlyWatched();
  const { favoriteChannels } = useFavorites();

  // Find a strong featured channel (e.g. from News, Sports or Movies that has a logo)
  const featuredChannel = useMemo(() => {
    if (!channels.length) return undefined;
    // Prefer a well-known channel with logo and 1080p/720p or from popular categories
    return (
      channels.find(
        (c) =>
          c.logo &&
          (c.resolution?.includes("1080") || c.resolution?.includes("720")) &&
          ["news", "sports", "movies", "entertainment"].includes(c.group.toLowerCase())
      ) ||
      channels.find((c) => c.logo && c.group.toLowerCase() !== "undefined") ||
      channels[0]
    );
  }, [channels]);

  // Dynamic category groups
  const sportsChannels = useMemo(() => {
    if (!channels.length) return [];
    return getChannelsByCategory("sports");
  }, [getChannelsByCategory, channels]);

  const movieChannels = useMemo(() => {
    if (!channels.length) return [];
    return getChannelsByCategory("movies");
  }, [getChannelsByCategory, channels]);

  const newsChannels = useMemo(() => {
    if (!channels.length) return [];
    return getChannelsByCategory("news");
  }, [getChannelsByCategory, channels]);

  const entertainmentChannels = useMemo(() => {
    if (!channels.length) return [];
    return getChannelsByCategory("entertainment");
  }, [getChannelsByCategory, channels]);

  const musicChannels = useMemo(() => {
    if (!channels.length) return [];
    return getChannelsByCategory("music");
  }, [getChannelsByCategory, channels]);

  const kidsChannels = useMemo(() => {
    if (!channels.length) return [];
    return getChannelsByCategory("kids");
  }, [getChannelsByCategory, channels]);

  // Popular channels: channels with logos and HD resolution
  const popularChannels = useMemo(() => {
    return channels.filter((c) => c.logo).slice(0, 30);
  }, [channels]);

  if (channels.length === 0 && !error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <HeroSkeleton />
        <HorizontalRowSkeleton />
        <HorizontalRowSkeleton />
        <HorizontalRowSkeleton />
      </div>
    );
  }

  if (error && channels.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Failed to Load Channel Dataset</h2>
        <p className="mt-2 text-sm text-zinc-400">{error}</p>
        <button
          onClick={() => refreshChannels(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 transition-colors"
        >
          <RotateCw className="h-4 w-4" />
          <span>Retry Loading Playlist</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-10">
      {/* Hero Section */}
      <Hero featuredChannel={featuredChannel} />

      {/* Horizontal Channel Rows */}
      <div className="space-y-6">
        {/* Recently Watched (if any) */}
        {recentChannels.length > 0 && (
          <HorizontalChannelRow
            title="Recently Watched"
            subtitle="Pick up where you left off"
            channels={recentChannels}
            icon={<History className="h-5 w-5" />}
          />
        )}

        {/* Favorites Row (if any) */}
        {favoriteChannels.length > 0 && (
          <HorizontalChannelRow
            title="Your Favorites"
            subtitle="Quick access to your preferred channels"
            channels={favoriteChannels}
            viewAllHref="/favorites"
            icon={<Heart className="h-5 w-5 text-rose-400" />}
          />
        )}

        {/* Popular Channels */}
        <HorizontalChannelRow
          title="Popular Channels"
          subtitle="Top rated broadcasts across the world"
          channels={popularChannels}
          viewAllHref="/live-tv"
          icon={<Flame className="h-5 w-5 text-amber-400" />}
        />

        {/* Sports Section */}
        {sportsChannels.length > 0 && (
          <HorizontalChannelRow
            title="Sports Channels"
            subtitle="Live athletics, football, racing, and tournament broadcasts"
            channels={sportsChannels}
            viewAllHref="/sports"
            icon={<Trophy className="h-5 w-5 text-brand-400" />}
          />
        )}

        {/* Movies Section */}
        {movieChannels.length > 0 && (
          <HorizontalChannelRow
            title="Movie Channels"
            subtitle="24/7 feature films, cinema classics, and blockbuster streams"
            channels={movieChannels}
            viewAllHref="/movies"
            icon={<Film className="h-5 w-5 text-purple-400" />}
          />
        )}

        {/* News Section */}
        {newsChannels.length > 0 && (
          <HorizontalChannelRow
            title="News Channels"
            subtitle="Breaking global news, politics, and financial updates"
            channels={newsChannels}
            viewAllHref="/news"
            icon={<Newspaper className="h-5 w-5 text-blue-400" />}
          />
        )}

        {/* Entertainment Section */}
        {entertainmentChannels.length > 0 && (
          <HorizontalChannelRow
            title="Entertainment Channels"
            subtitle="Comedy, drama, talk shows, and general entertainment"
            channels={entertainmentChannels}
            viewAllHref="/entertainment"
            icon={<Popcorn className="h-5 w-5 text-pink-400" />}
          />
        )}

        {/* Music Section */}
        {musicChannels.length > 0 && (
          <HorizontalChannelRow
            title="Music Channels"
            subtitle="Continuous music videos, concerts, and radio streams"
            channels={musicChannels}
            viewAllHref="/music"
            icon={<Music className="h-5 w-5 text-emerald-400" />}
          />
        )}

        {/* Kids Section */}
        {kidsChannels.length > 0 && (
          <HorizontalChannelRow
            title="Kids & Family"
            subtitle="Cartoons, family animation, and educational programs"
            channels={kidsChannels}
            viewAllHref="/kids"
            icon={<Smile className="h-5 w-5 text-yellow-400" />}
          />
        )}
      </div>
    </div>
  );
}

