"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Channel } from "@/types/channel";
import { ChannelCard } from "@/components/channel/ChannelCard";

interface HorizontalChannelRowProps {
  title: string;
  subtitle?: string;
  channels: Channel[];
  viewAllHref?: string;
  icon?: React.ReactNode;
}

export function HorizontalChannelRow({
  title,
  subtitle,
  channels,
  viewAllHref,
  icon,
}: HorizontalChannelRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!channels || channels.length === 0) {
    return null;
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -800 : 800;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative space-y-3 py-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-brand-400">{icon}</div>}
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-zinc-400">{subtitle}</p>
            )}
          </div>
          <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs font-semibold text-zinc-400">
            {channels.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors mr-2"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}

          {/* Scroll Navigation Buttons */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface hover:bg-surface-elevated text-zinc-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface hover:bg-surface-elevated text-zinc-300 hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth snap-x"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {channels.slice(0, 20).map((channel) => (
          <div
            key={channel.id}
            className="w-64 sm:w-72 shrink-0 snap-start"
          >
            <ChannelCard channel={channel} />
          </div>
        ))}
      </div>
    </section>
  );
}

