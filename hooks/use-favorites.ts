"use client";

import { useMemo, useState, useEffect } from "react";
import { usePreferenceStore } from "@/store/preference-store";
import { useChannelStore } from "@/store/channel-store";
import { Channel } from "@/types/channel";

export function useFavorites() {
  const [mounted, setMounted] = useState(false);
  const favorites = usePreferenceStore((s) => s.favorites);
  const toggleFavorite = usePreferenceStore((s) => s.toggleFavorite);
  const isFavorite = usePreferenceStore((s) => s.isFavorite);
  const channels = useChannelStore((s) => s.channels);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use empty array during SSR / initial render to prevent React hydration mismatch
  const safeFavorites = mounted ? favorites : [];

  const favoriteChannels = useMemo(() => {
    if (!safeFavorites.length || !channels.length) return [];
    const channelMap = new Map<string, Channel>();
    for (const c of channels) {
      channelMap.set(c.id, c);
      if (c.tvgId) channelMap.set(c.tvgId, c);
    }

    const result: Channel[] = [];
    for (const id of safeFavorites) {
      const found = channelMap.get(id);
      if (found) {
        result.push(found);
      }
    }
    return result;
  }, [safeFavorites, channels]);

  return {
    favoriteIds: safeFavorites,
    favoriteChannels,
    toggleFavorite,
    isFavorite: (id: string) => (mounted ? isFavorite(id) : false),
    count: favoriteChannels.length,
    isMounted: mounted,
  };
}
