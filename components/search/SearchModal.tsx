"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X, Tv, Play, Heart } from "lucide-react";
import { useChannelStore } from "@/store/channel-store";
import { usePreferenceStore } from "@/store/preference-store";
import { Channel } from "@/types/channel";
import { getFallbackChannelSvg } from "@/lib/iptv/normalize-channel";
import { getCountryFlag } from "@/lib/iptv/countries";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const searchChannels = useChannelStore((s) => s.searchChannels);
  const setActivePlayerChannel = usePreferenceStore((s) => s.setActivePlayerChannel);
  const [results, setResults] = useState<Channel[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const hits = searchChannels(query, 40);
      setResults(hits);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, searchChannels]);

  // Keyboard shortcut ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-md animate-fade-in">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-surface-border bg-surface-secondary shadow-2xl z-10 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-surface-border gap-3 bg-surface">
          <Search className="h-5 w-5 text-brand-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 11,000+ channels by name, category, country or language..."
            className="flex-1 bg-transparent text-sm sm:text-base text-foreground placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg bg-surface-elevated px-2 py-1 text-xs text-zinc-400 hover:text-white border border-surface-border"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-3 space-y-1.5 flex-1">
          {query.trim() === "" ? (
            <div className="py-12 text-center text-zinc-500">
              <Tv className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-sm">Type any channel title, category (e.g. Sports, News), or country</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["Sports", "News", "Movies", "United States", "United Kingdom", "Music"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setQuery(preset)}
                    className="rounded-full bg-surface-elevated px-3 py-1 text-xs text-zinc-400 hover:text-brand-300 hover:border-brand-500/30 border border-surface-border"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <p className="text-sm font-medium text-zinc-400">No channels found matching &quot;{query}&quot;</p>
              <p className="text-xs text-zinc-500 mt-1">Try another search term or browse by category</p>
            </div>
          ) : (
            results.map((channel) => {
              const flag = getCountryFlag(channel.countryCode);
              return (
                <div
                  key={channel.id}
                  className="group flex items-center justify-between rounded-xl p-2.5 hover:bg-surface-elevated transition-colors"
                >
                  <Link
                    href={`/watch/${encodeURIComponent(channel.id)}`}
                    onClick={() => {
                      setActivePlayerChannel(channel);
                      onClose();
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-surface flex items-center justify-center p-1">
                      {channel.logo ? (
                        <img
                          src={channel.logo}
                          alt={channel.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getFallbackChannelSvg(channel.name, channel.group);
                          }}
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-brand-400">TV</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground group-hover:text-brand-400 transition-colors truncate">
                          {channel.name}
                        </span>
                        {channel.resolution && (
                          <span className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-300">
                            {channel.resolution}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                        <span className="text-zinc-400">{channel.group}</span>
                        <span>•</span>
                        <span>{flag} {channel.country}</span>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href={`/watch/${encodeURIComponent(channel.id)}`}
                    onClick={() => {
                      setActivePlayerChannel(channel);
                      onClose();
                    }}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs text-zinc-300 hover:bg-brand-500 hover:text-white transition-colors"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Watch</span>
                  </Link>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        {results.length > 0 && (
          <div className="border-t border-surface-border px-4 py-2.5 text-xs text-zinc-500 flex justify-between bg-surface">
            <span>Showing top {results.length} channels</span>
            <span>Click any channel to watch</span>
          </div>
        )}
      </div>
    </div>
  );
}

