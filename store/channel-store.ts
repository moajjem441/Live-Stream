import { create } from "zustand";
import { Channel, CategoryInfo, CountryInfo, LanguageInfo } from "@/types/channel";
import { fetchPlaylist } from "@/lib/iptv/fetch-playlist";
import { channelMatchesCategory } from "@/lib/iptv/categorize-channels";

interface ChannelStoreState {
  // State
  channels: Channel[];
  categories: CategoryInfo[];
  countries: CountryInfo[];
  languages: LanguageInfo[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  selectedChannel: Channel | null;

  // Filters & Search
  searchQuery: string;
  selectedCategory: string | null;
  selectedCountry: string | null;
  selectedLanguage: string | null;
  sortBy: "name-asc" | "name-desc" | "category";
  viewMode: "grid" | "list";
  itemsPerPage: number;
  currentPage: number;

  // Actions
  loadChannels: (force?: boolean) => Promise<void>;
  setSelectedChannel: (channel: Channel | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedCountry: (country: string | null) => void;
  setSelectedLanguage: (language: string | null) => void;
  setSortBy: (sortBy: "name-asc" | "name-desc" | "category") => void;
  setViewMode: (mode: "grid" | "list") => void;
  setPage: (page: number) => void;
  setItemsPerPage: (count: number) => void;
  resetFilters: () => void;

  // Selectors
  getChannelById: (id: string) => Channel | undefined;
  getChannelsByCategory: (category: string) => Channel[];
  getChannelsByCountry: (countryCode: string) => Channel[];
  getChannelsByLanguage: (language: string) => Channel[];
  searchChannels: (query: string, limit?: number) => Channel[];
  getFilteredChannels: () => Channel[];
}

export const useChannelStore = create<ChannelStoreState>((set, get) => ({
  channels: [],
  categories: [],
  countries: [],
  languages: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  selectedChannel: null,

  searchQuery: "",
  selectedCategory: null,
  selectedCountry: null,
  selectedLanguage: null,
  sortBy: "name-asc",
  viewMode: "grid",
  itemsPerPage: 48,
  currentPage: 1,

  loadChannels: async (force = false) => {
    // If we already have channels and force is false, no-op
    if (!force && get().channels.length > 0) {
      return;
    }
    // Prevent simultaneous concurrent loading dispatches
    if (!force && get().isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const result = await fetchPlaylist({ force });
      set({
        channels: result.channels,
        categories: result.metadata.categories,
        countries: result.metadata.countries,
        languages: result.metadata.languages,
        lastUpdated: result.metadata.lastUpdated,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      console.error("Error loading channels into store:", err);
      set({
        isLoading: false,
        error: err?.message || "Failed to load channel playlist",
      });
    }
  },

  setSelectedChannel: (channel) => set({ selectedChannel: channel }),

  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),

  setSelectedCategory: (category) =>
    set({ selectedCategory: category, currentPage: 1 }),

  setSelectedCountry: (country) =>
    set({ selectedCountry: country, currentPage: 1 }),

  setSelectedLanguage: (language) =>
    set({ selectedLanguage: language, currentPage: 1 }),

  setSortBy: (sortBy) => set({ sortBy, currentPage: 1 }),

  setViewMode: (viewMode) => set({ viewMode }),

  setPage: (currentPage) => set({ currentPage }),

  setItemsPerPage: (itemsPerPage) =>
    set({ itemsPerPage, currentPage: 1 }),

  resetFilters: () =>
    set({
      searchQuery: "",
      selectedCategory: null,
      selectedCountry: null,
      selectedLanguage: null,
      sortBy: "name-asc",
      currentPage: 1,
    }),

  // Selectors
  getChannelById: (id: string) => {
    if (!id) return undefined;
    const target = id.toLowerCase().trim();
    return get().channels.find(
      (c) =>
        c.id.toLowerCase() === target ||
        (c.tvgId && c.tvgId.toLowerCase() === target) ||
        c.url.toLowerCase() === target
    );
  },

  getChannelsByCategory: (category: string) => {
    return get().channels.filter((c) => channelMatchesCategory(c, category));
  },

  getChannelsByCountry: (countryCode: string) => {
    if (!countryCode || countryCode === "ALL") return get().channels;
    return get().channels.filter(
      (c) => c.countryCode.toUpperCase() === countryCode.toUpperCase()
    );
  },

  getChannelsByLanguage: (language: string) => {
    if (!language || language === "ALL") return get().channels;
    return get().channels.filter(
      (c) => c.language.toLowerCase() === language.toLowerCase()
    );
  },

  searchChannels: (query: string, limit = 50) => {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    const channels = get().channels;
    const results: Channel[] = [];

    for (let i = 0; i < channels.length; i++) {
      const c = channels[i];
      if (
        c.name.toLowerCase().includes(q) ||
        (c.tvgName && c.tvgName.toLowerCase().includes(q)) ||
        (c.tvgId && c.tvgId.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.countryCode.toLowerCase().includes(q) ||
        c.language.toLowerCase().includes(q)
      ) {
        results.push(c);
        if (results.length >= limit) break;
      }
    }

    return results;
  },

  getFilteredChannels: () => {
    const {
      channels,
      searchQuery,
      selectedCategory,
      selectedCountry,
      selectedLanguage,
      sortBy,
    } = get();

    let filtered = channels;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.tvgName && c.tvgName.toLowerCase().includes(q)) ||
          (c.tvgId && c.tvgId.toLowerCase().includes(q)) ||
          c.id.toLowerCase().includes(q) ||
          c.group.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          c.countryCode.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter((c) =>
        channelMatchesCategory(c, selectedCategory)
      );
    }

    // Country filter
    if (selectedCountry && selectedCountry !== "all") {
      filtered = filtered.filter(
        (c) => c.countryCode.toUpperCase() === selectedCountry.toUpperCase()
      );
    }

    // Language filter
    if (selectedLanguage && selectedLanguage !== "all") {
      filtered = filtered.filter(
        (c) => c.language.toLowerCase() === selectedLanguage.toLowerCase()
      );
    }

    // Sorting
    if (sortBy === "name-asc") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "category") {
      filtered = [...filtered].sort((a, b) => a.group.localeCompare(b.group));
    }

    return filtered;
  },
}));

