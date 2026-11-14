"use client";

import { useMemo, useState, useEffect } from "react";
import { usePreferenceStore } from "@/store/preference-store";
import { useChannelStore } from "@/store/channel-store";
import { Channel } from "@/types/channel";

export function useRecentlyWatched() {
  const [mounted, setMounted] = useState(false);
  const recentlyWatched = usePreferenceStore((s) => s.recentlyWatched);
  const clearRecentlyWatched = usePreferenceStore((s) => s.clearRecentlyWatched);
  const addRecentlyWatched = usePreferenceStore((s) => s.addRecentlyWatched);
  const channels = useChannelStore((s) => s.channels);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeRecentlyWatched = mounted ? recentlyWatched : [];

  const recentChannels = useMemo(() => {
    if (!safeRecentlyWatched.length || !channels.length) return [];
    const channelMap = new Map<string, Channel>();
    for (const c of channels) {
      channelMap.set(c.id, c);
      if (c.tvgId) channelMap.set(c.tvgId, c);
    }

    const result: Channel[] = [];
    for (const item of safeRecentlyWatched) {
      const channel = channelMap.get(item.channelId);
      if (channel) {
        result.push(channel);
      }
    }
    return result;
  }, [safeRecentlyWatched, channels]);

  return {
    recentlyWatched: safeRecentlyWatched,
    recentChannels,
    addRecentlyWatched,
    clearRecentlyWatched,
    count: recentChannels.length,
    isMounted: mounted,
  };
}
