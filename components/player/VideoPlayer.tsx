"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  PictureInPicture,
  RotateCcw,
  SkipBack,
  SkipForward,
  AlertCircle,
  Tv,
  ExternalLink,
  Heart,
} from "lucide-react";
import { Channel } from "@/types/channel";
import { usePreferenceStore } from "@/store/preference-store";
import { getFallbackChannelSvg } from "@/lib/iptv/normalize-channel";
import { getCountryFlag } from "@/lib/iptv/countries";
import { cn } from "@/lib/utils";

export const CHANNEL_LOADING_TIMEOUT_MS = 30000;
export const CHANNEL_ERROR_MESSAGE =
  "Unable to load this channel. Please try again or select another channel.";

interface VideoPlayerProps {
  channel: Channel;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  className?: string;
  autoPlay?: boolean;
}

export function VideoPlayer({
  channel,
  onNextChannel,
  onPrevChannel,
  hasNext = false,
  hasPrev = false,
  className,
  autoPlay = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Loading timeout and lifecycle refs
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentAttemptIdRef = useRef<number>(0);
  const hasPlaybackStartedRef = useRef<boolean>(false);

  const clearLoadingTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, []);

  const handlePlaybackStarted = useCallback(() => {
    hasPlaybackStartedRef.current = true;
    clearLoadingTimeout();
    setIsLoading(false);
    setIsPlaying(true);
  }, [clearLoadingTimeout]);

  const handleWaiting = useCallback(() => {
    // Buffering after playback has already started triggers waiting event.
    // Show spinner during buffering without re-triggering the 30-second load failure timeout.
    setIsLoading(true);
  }, []);

  const handleVideoError = useCallback(() => {
    // If HLS is active, Hls.Events.ERROR handles stream errors and recovery.
    // If native video playback encounters an error, handle it directly:
    if (!hlsRef.current) {
      clearLoadingTimeout();
      setIsLoading(false);
      setHasError(true);
      setErrorMessage(CHANNEL_ERROR_MESSAGE);
    }
  }, [clearLoadingTimeout]);

  const volume = usePreferenceStore((s) => s.volume);
  const isMuted = usePreferenceStore((s) => s.isMuted);
  const setVolume = usePreferenceStore((s) => s.setVolume);
  const toggleMute = usePreferenceStore((s) => s.toggleMute);
  const favorites = usePreferenceStore((s) => s.favorites);
  const toggleFavorite = usePreferenceStore((s) => s.toggleFavorite);

  const isFavorited = favorites.includes(channel.id);
  const flag = getCountryFlag(channel.countryCode);
  const fallbackSvg = getFallbackChannelSvg(channel.name, channel.group);

  // Initialize and load stream
  const loadStream = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Track attempt to invalidate previous channel loading timeouts
    const attemptId = ++currentAttemptIdRef.current;
    hasPlaybackStartedRef.current = false;
    clearLoadingTimeout();

    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");

    // Destroy previous HLS instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Start 30-second channel loading timeout
    loadingTimeoutRef.current = setTimeout(() => {
      // Guard against superseded attempts and already-started playback
      if (attemptId !== currentAttemptIdRef.current) return;
      if (hasPlaybackStartedRef.current) return;

      console.warn(`Channel loading timed out after ${CHANNEL_LOADING_TIMEOUT_MS / 1000}s`);

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }

      setIsLoading(false);
      setHasError(true);
      setErrorMessage(CHANNEL_ERROR_MESSAGE);
    }, CHANNEL_LOADING_TIMEOUT_MS);

    const streamUrl = channel.url;

    // Check if HLS.js is supported
    if (Hls.isSupported() && streamUrl.includes(".m3u8")) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      let networkRetryCount = 0;
      let mediaRetryCount = 0;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (attemptId !== currentAttemptIdRef.current) return;
        if (autoPlay) {
          video.play().catch(() => {
            // Autoplay with sound might be blocked by browser policy
            video.muted = true;
            video.play().catch((err) => console.log("Autoplay blocked:", err));
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (attemptId !== currentAttemptIdRef.current) return;
        console.warn("HLS stream event error:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              networkRetryCount++;
              if (networkRetryCount <= 2) {
                console.log(`Fatal network error (attempt ${networkRetryCount}), recovering...`);
                hls.startLoad();
              } else {
                console.log("Fatal network error could not be recovered.");
                clearLoadingTimeout();
                hls.destroy();
                hlsRef.current = null;
                setIsLoading(false);
                setHasError(true);
                setErrorMessage(CHANNEL_ERROR_MESSAGE);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              mediaRetryCount++;
              if (mediaRetryCount <= 2) {
                console.log(`Fatal media error (attempt ${mediaRetryCount}), recovering...`);
                hls.recoverMediaError();
              } else {
                console.log("Fatal media error could not be recovered.");
                clearLoadingTimeout();
                hls.destroy();
                hlsRef.current = null;
                setIsLoading(false);
                setHasError(true);
                setErrorMessage(CHANNEL_ERROR_MESSAGE);
              }
              break;
            default:
              // Unrecoverable fatal error
              clearLoadingTimeout();
              hls.destroy();
              hlsRef.current = null;
              setIsLoading(false);
              setHasError(true);
              setErrorMessage(CHANNEL_ERROR_MESSAGE);
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl") || streamUrl.endsWith(".mp4")) {
      // Native HLS playback (Safari, mobile iOS, or direct video)
      video.src = streamUrl;
      video.load();
      if (autoPlay) {
        video.play().catch(() => {
          video.muted = true;
          video.play().catch((err) => console.log("Autoplay blocked:", err));
        });
      }
    } else {
      clearLoadingTimeout();
      setIsLoading(false);
      setHasError(true);
      setErrorMessage(CHANNEL_ERROR_MESSAGE);
    }
  }, [channel.url, autoPlay, clearLoadingTimeout]);

  // Load stream when channel changes or component mounts
  useEffect(() => {
    loadStream();

    return () => {
      clearLoadingTimeout();
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [loadStream, clearLoadingTimeout]);

  // Volume & Mute Sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch((e) => console.warn(e));
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(false);
    }
  }, []);

  // Picture in Picture toggle
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("PiP not supported or blocked:", err);
    }
  };

  // Auto hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !hasError) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "arrowleft":
          if (onPrevChannel && hasPrev) {
            e.preventDefault();
            onPrevChannel();
          }
          break;
        case "arrowright":
          if (onNextChannel && hasNext) {
            e.preventDefault();
            onNextChannel();
          }
          break;
        case "arrowup":
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case "arrowdown":
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, onNextChannel, onPrevChannel, hasNext, hasPrev, volume, setVolume]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl select-none",
        className
      )}
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={handleWaiting}
        onPlaying={handlePlaybackStarted}
        onTimeUpdate={() => {
          if (!hasPlaybackStartedRef.current && videoRef.current && videoRef.current.currentTime > 0) {
            handlePlaybackStarted();
          }
        }}
        onError={handleVideoError}
        onClick={togglePlay}
        className="h-full w-full object-contain cursor-pointer"
      />

      {/* Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 pointer-events-none">
          <div className="h-12 w-12 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin" />
          <p className="mt-4 text-xs font-medium text-zinc-300 tracking-wide">
            Loading channel...
          </p>
        </div>
      )}

      {/* Error Overlay UI */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-secondary/95 p-6 text-center z-30">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-3">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">Stream Unavailable</h3>
          <p className="mt-1.5 max-w-md text-xs sm:text-sm text-zinc-400">
            {errorMessage || CHANNEL_ERROR_MESSAGE}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={loadStream}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>

            <Link
              href="/live-tv"
              className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-xs font-medium text-zinc-200 hover:text-white transition-colors"
            >
              <Tv className="h-3.5 w-3.5" />
              <span>Choose Another Channel</span>
            </Link>

            {hasNext && onNextChannel && (
              <button
                onClick={onNextChannel}
                className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-elevated px-4 py-2 text-xs font-medium text-zinc-200 hover:text-white transition-colors"
              >
                <span>Next Channel</span>
                <SkipForward className="h-3.5 w-3.5" />
              </button>
            )}

            <a
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-surface-border px-3 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
              title="Open direct stream URL in external player (e.g. VLC)"
            >
              <span>Direct Link</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* Top Channel Header Bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-12 shrink-0 overflow-hidden rounded bg-black/60 border border-white/10 flex items-center justify-center p-1">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackSvg;
                }}
              />
            ) : (
              <span className="text-[10px] font-bold text-brand-400">TV</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white drop-shadow truncate max-w-xs sm:max-w-md">
                {channel.name}
              </h2>
              {channel.resolution && (
                <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-300 border border-brand-500/30">
                  {channel.resolution}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
              <span>•</span>
              <span>{channel.group}</span>
              <span>•</span>
              <span>{flag} {channel.country}</span>
            </div>
          </div>
        </div>

        {/* Favorite button */}
        <button
          onClick={() => toggleFavorite(channel.id)}
          className={cn(
            "rounded-full p-2 bg-black/50 backdrop-blur-md border border-white/10 transition-colors",
            isFavorited ? "text-rose-500" : "text-zinc-300 hover:text-white"
          )}
          title={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
        </button>
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-20 flex flex-col justify-end p-4 bg-gradient-to-t from-black/85 via-black/50 to-transparent transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left Controls: Play/Pause, Prev, Next, Volume */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/40 hover:bg-brand-600 transition-transform active:scale-95"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5" />
              )}
            </button>

            {hasPrev && onPrevChannel && (
              <button
                onClick={onPrevChannel}
                className="text-zinc-300 hover:text-white transition-colors p-1.5"
                title="Previous Channel (Left Arrow)"
              >
                <SkipBack className="h-5 w-5" />
              </button>
            )}

            {hasNext && onNextChannel && (
              <button
                onClick={onNextChannel}
                className="text-zinc-300 hover:text-white transition-colors p-1.5"
                title="Next Channel (Right Arrow)"
              >
                <SkipForward className="h-5 w-5" />
              </button>
            )}

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/volume ml-2">
              <button
                onClick={toggleMute}
                className="text-zinc-300 hover:text-white transition-colors"
                title={isMuted ? "Unmute (M)" : "Mute (M)"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="h-1.5 w-16 sm:w-20 accent-brand-500 cursor-pointer bg-white/20 rounded-lg appearance-none"
              />
            </div>
          </div>

          {/* Right Controls: PiP, Fullscreen */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePiP}
              className="text-zinc-300 hover:text-white transition-colors p-1.5"
              title="Picture-in-Picture"
            >
              <PictureInPicture className="h-5 w-5" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="text-zinc-300 hover:text-white transition-colors p-1.5"
              title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

