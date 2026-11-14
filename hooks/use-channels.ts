"use client";

import { useEffect } from "react";
import { useChannelStore } from "@/store/channel-store";

export function useChannels() {
  const channels = useChannelStore((s) => s.channels);
  const categories = useChannelStore((s) => s.categories);
  const countries = useChannelStore((s) => s.countries);
  const languages = useChannelStore((s) => s.languages);
  const isLoading = useChannelStore((s) => s.isLoading);
  const error = useChannelStore((s) => s.error);
  const lastUpdated = useChannelStore((s) => s.lastUpdated);
  const loadChannels = useChannelStore((s) => s.loadChannels);
  const getChannelById = useChannelStore((s) => s.getChannelById);
  const getChannelsByCategory = useChannelStore((s) => s.getChannelsByCategory);
  const getChannelsByCountry = useChannelStore((s) => s.getChannelsByCountry);
  const searchChannels = useChannelStore((s) => s.searchChannels);

  useEffect(() => {
    if (channels.length === 0 && !isLoading && !error) {
      loadChannels();
    }
  }, [channels.length, isLoading, error, loadChannels]);

  return {
    channels,
    categories,
    countries,
    languages,
    isLoading,
    error,
    lastUpdated,
    refreshChannels: (force = true) => loadChannels(force),
    getChannelById,
    getChannelsByCategory,
    getChannelsByCountry,
    searchChannels,
  };
}

