import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cache for 1 hour

const PLAYLIST_URL = "https://iptv-org.github.io/iptv/index.m3u";

// Server-side in-memory cache
let cachedM3U: string | null = null;
let lastFetched: number = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";
  const now = Date.now();

  try {
    if (!forceRefresh && cachedM3U && now - lastFetched < CACHE_TTL_MS) {
      return new NextResponse(cachedM3U, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
          "X-Cache-Status": "HIT",
        },
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(PLAYLIST_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "StreamX/1.0",
        Accept: "*/*",
      },
      next: { revalidate: 3600 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Upstream IPTV returned status ${response.status}`);
    }

    const text = await response.text();
    cachedM3U = text;
    lastFetched = now;

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        "X-Cache-Status": "MISS",
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch M3U playlist from iptv-org:", error);

    // If we have stale cache, return it on error
    if (cachedM3U) {
      return new NextResponse(cachedM3U, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Cache-Status": "STALE",
        },
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch playlist", details: error?.message || "Unknown error" },
      { status: 502 }
    );
  }
}

