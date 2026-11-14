"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Hls from "hls.js";
import { Play, Pause, X, Maximize2, Volume2, VolumeX } from "lucide-react";
import { usePreferenceStore } from "@/store/preference-store";
import { getFallbackChannelSvg } from "@/lib/iptv/normalize-channel";

export function MiniPlayer() {
  const pathname = usePathname();
  const router = useRouter();

  const activeChannel = usePreferenceStore((s) => s.activePlayerChannel);
  const setActivePlayerChannel = usePreferenceStore((s) => s.setActivePlayerChannel);
  const volume = usePreferenceStore((s) => s.volume);
  const isMuted = usePreferenceStore((s) => s.isMuted);
  const toggleMute = usePreferenceStore((s) => s.toggleMute);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // If user is currently on the dedicated /watch/[id] page, hide the mini-player to avoid two players playing at once!
  const isWatchPage = pathname.startsWith("/watch");

  useEffect(() => {
    if (!activeChannel || isWatchPage) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = activeChannel.url;

    if (Hls.isSupported() && streamUrl.includes(".m3u8")) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          video.muted = true;
          video.play().catch((err) => console.log("Mini autoplay blocked:", err));
        });
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl") || streamUrl.endsWith(".mp4")) {
      video.src = streamUrl;
      video.play().catch(() => {
        video.muted = true;
        video.play().catch((err) => console.log("Mini autoplay blocked:", err));
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel, isWatchPage]);

  // Sync volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  if (!activeChannel || isWatchPage) return null;

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((e) => console.log(e));
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleExpand = () => {
    router.push(`/watch/${encodeURIComponent(activeChannel.id)}`);
  };

  const handleClose = () => {
    setActivePlayerChannel(null);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 w-72 sm:w-80 overflow-hidden rounded-2xl border border-surface-border/80 bg-surface shadow-2xl backdrop-blur-xl animate-scale-up">
      {/* Mini Video */}
      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="h-full w-full object-contain"
        />

        {/* Video Overlay controls */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity gap-2">
          <button
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white shadow hover:scale-105 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-rose-400" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Live Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Mini Footer */}
      <div className="flex items-center justify-between p-2.5 bg-surface-secondary">
        <div className="min-w-0 flex-1 pr-2">
          <p className="font-semibold text-xs text-white truncate">
            {activeChannel.name}
          </p>
          <p className="text-[10px] text-zinc-400 truncate">
            {activeChannel.group} • {activeChannel.country}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleExpand}
            className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-surface-elevated transition-colors"
            title="Expand to Full Player"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-surface-elevated transition-colors"
            title="Close Player"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

