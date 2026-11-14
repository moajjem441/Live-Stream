import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Channel } from "@/types/channel";

export interface RecentlyWatchedItem {
  channelId: string;
  watchedAt: number;
}

interface PreferenceState {
  favorites: string[];
  recentlyWatched: RecentlyWatchedItem[];
  activePlayerChannel: Channel | null;
  miniPlayerOpen: boolean;
  volume: number;
  isMuted: boolean;
  theme: "dark" | "light";

  // Actions
  toggleFavorite: (channelId: string) => void;
  isFavorite: (channelId: string) => boolean;
  addRecentlyWatched: (channelId: string) => void;
  clearRecentlyWatched: () => void;
  setActivePlayerChannel: (channel: Channel | null) => void;
  setMiniPlayerOpen: (open: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleTheme: () => void;
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set, get) => ({
      favorites: [],
      recentlyWatched: [],
      activePlayerChannel: null,
      miniPlayerOpen: false,
      volume: 0.8,
      isMuted: false,
      theme: "dark",

      toggleFavorite: (channelId: string) => {
        const { favorites } = get();
        if (favorites.includes(channelId)) {
          set({ favorites: favorites.filter((id) => id !== channelId) });
        } else {
          set({ favorites: [channelId, ...favorites] });
        }
      },

      isFavorite: (channelId: string) => {
        return get().favorites.includes(channelId);
      },

      addRecentlyWatched: (channelId: string) => {
        const { recentlyWatched } = get();
        // Remove existing to place at front without duplicates
        const filtered = recentlyWatched.filter(
          (item) => item.channelId !== channelId
        );
        const updated = [
          { channelId, watchedAt: Date.now() },
          ...filtered,
        ].slice(0, 30); // limit to 30 items
        set({ recentlyWatched: updated });
      },

      clearRecentlyWatched: () => {
        set({ recentlyWatched: [] });
      },

      setActivePlayerChannel: (channel) => {
        set({ activePlayerChannel: channel });
        if (channel) {
          get().addRecentlyWatched(channel.id);
        }
      },

      setMiniPlayerOpen: (open) => set({ miniPlayerOpen: open }),

      setVolume: (volume) =>
        set({ volume: Math.max(0, Math.min(1, volume)), isMuted: volume === 0 }),

      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark",
        })),
    }),
    {
      name: "streamx_user_preferences_v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        favorites: state.favorites,
        recentlyWatched: state.recentlyWatched,
        volume: state.volume,
        isMuted: state.isMuted,
        theme: state.theme,
      }),
    }
  )
);

