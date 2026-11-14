import { Channel, PlaylistMetadata } from "@/types/channel";
import { parseM3U, ParsedPlaylistResult } from "./parse-m3u";

const DIRECT_PLAYLIST_URL = "https://iptv-org.github.io/iptv/index.m3u";
const PROXY_PLAYLIST_URL = "/api/playlist";

const CACHE_STORAGE_KEY = "streamx_playlist_cache_v1";
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Singleton in-memory cache
let inMemoryCache: ParsedPlaylistResult | null = null;
let lastFetchedTimestamp: number = 0;
let inFlightPromise: Promise<ParsedPlaylistResult> | null = null;

export interface FetchPlaylistOptions {
  force?: boolean;
  timeoutMs?: number;
}

/**
 * Centralized IPTV Playlist Fetching Service
 * Ensures single source of truth, one-time parsing, and unified in-memory + session caching.
 */
export async function fetchPlaylist(
  options: FetchPlaylistOptions = {}
): Promise<ParsedPlaylistResult> {
  const { force = false, timeoutMs = 15000 } = options;
  const now = Date.now();

  // 1. Check in-memory cache if not forced
  if (!force && inMemoryCache && now - lastFetchedTimestamp < CACHE_EXPIRY_MS) {
    return inMemoryCache;
  }

  // 2. Prevent duplicate simultaneous requests (Request Deduplication)
  if (inFlightPromise) {
    return inFlightPromise;
  }

  // 3. Check browser sessionStorage/localStorage cache if available
  if (!force && typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(CACHE_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.timestamp && now - parsed.timestamp < CACHE_EXPIRY_MS) {
          inMemoryCache = parsed.data;
          lastFetchedTimestamp = parsed.timestamp;
          return parsed.data;
        }
      }
    } catch (e) {
      console.warn("Could not read playlist cache from storage:", e);
    }
  }

  // 4. Perform fetch (single flight)
  inFlightPromise = (async () => {
    let rawM3U: string = "";

    try {
      // First attempt: Direct fetch to iptv-org
      rawM3U = await fetchWithTimeout(DIRECT_PLAYLIST_URL, timeoutMs);
    } catch (directErr) {
      console.warn("Direct fetch from iptv-org failed, attempting proxy fallback:", directErr);
      try {
        // Fallback attempt: Fetch via local API route proxy
        const proxyUrl = force ? `${PROXY_PLAYLIST_URL}?refresh=true` : PROXY_PLAYLIST_URL;
        rawM3U = await fetchWithTimeout(proxyUrl, timeoutMs);
      } catch (proxyErr) {
        console.error("Proxy fetch also failed:", proxyErr);

        // If we have stale in-memory cache, return it instead of hard failing
        if (inMemoryCache) {
          console.warn("Using stale in-memory cache due to network failure");
          return inMemoryCache;
        }

        throw new Error(
          "Unable to load IPTV playlist. Please check your internet connection or try again."
        );
      }
    }

    // 5. Parse only once
    const parsedResult = parseM3U(rawM3U);

    // 6. Store in memory
    inMemoryCache = parsedResult;
    lastFetchedTimestamp = Date.now();

    // 7. Store in sessionStorage for quick reload persistence
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          CACHE_STORAGE_KEY,
          JSON.stringify({
            timestamp: lastFetchedTimestamp,
            data: parsedResult,
          })
        );
      } catch (e) {
        // Storage might be exceeded due to size, fallback safely to in-memory
        console.warn("Session storage quota exceeded, using in-memory cache only:", e);
      }
    }

    return parsedResult;
  })().finally(() => {
    inFlightPromise = null;
  });

  return inFlightPromise;
}

/**
 * Fetch helper with timeout controller
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-cache",
      headers: {
        Accept: "text/plain, */*",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return await res.text();
  } finally {
    clearTimeout(id);
  }
}

/**
 * Clear in-memory and session cache
 */
export function clearPlaylistCache(): void {
  inMemoryCache = null;
  lastFetchedTimestamp = 0;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(CACHE_STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }
}

