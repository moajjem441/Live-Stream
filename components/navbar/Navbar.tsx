"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tv,
  Film,
  Newspaper,
  Trophy,
  Popcorn,
  Music,
  Smile,
  Heart,
  Search,
  RotateCw,
  Menu,
  X,
  Radio,
  Globe,
} from "lucide-react";
import { useChannelStore } from "@/store/channel-store";
import { usePreferenceStore } from "@/store/preference-store";
import { SearchModal } from "@/components/search/SearchModal";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Home", href: "/", icon: Radio },
  { name: "Live TV", href: "/live-tv", icon: Tv },
  { name: "Movies", href: "/movies", icon: Film },
  { name: "News", href: "/news", icon: Newspaper },
  { name: "Sports", href: "/sports", icon: Trophy },
  { name: "Entertainment", href: "/entertainment", icon: Popcorn },
  { name: "Music", href: "/music", icon: Music },
  { name: "Kids", href: "/kids", icon: Smile },
  { name: "Favorites", href: "/favorites", icon: Heart },
];

export function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const channels = useChannelStore((s) => s.channels);
  const countries = useChannelStore((s) => s.countries);
  const isLoading = useChannelStore((s) => s.isLoading);
  const lastUpdated = useChannelStore((s) => s.lastUpdated);
  const loadChannels = useChannelStore((s) => s.loadChannels);
  const selectedCountry = useChannelStore((s) => s.selectedCountry);
  const setSelectedCountry = useChannelStore((s) => s.setSelectedCountry);

  const rawFavorites = usePreferenceStore((s) => s.favorites);
  const favorites = mounted ? rawFavorites : [];

  const handleRefresh = async () => {
    await loadChannels(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-surface-border/80 bg-background/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-400 text-white shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
                <Tv className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white flex items-center">
                  STREAM<span className="text-brand-400">X</span>
                  <span className="ml-1.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </span>
                <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-semibold -mt-1">
                  Live OTT Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                      isActive
                        ? "bg-brand-500/15 text-brand-300 font-semibold shadow-inner"
                        : "text-zinc-400 hover:bg-surface-elevated/60 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5",
                        isActive ? "text-brand-400" : "text-zinc-400",
                        item.name === "Favorites" && favorites.length > 0 && "text-rose-400"
                      )}
                    />
                    <span>{item.name}</span>
                    {item.name === "Favorites" && favorites.length > 0 && (
                      <span className="ml-0.5 rounded-full bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-bold text-rose-300">
                        {favorites.length}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger Button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-elevated/60 px-3 py-1.5 text-xs text-zinc-400 hover:border-brand-500/40 hover:text-white transition-all shadow-sm"
              title="Search Channels (Ctrl+K or /)"
            >
              <Search className="h-4 w-4 text-brand-400" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-zinc-400 border border-white/5">
                ⌘K
              </kbd>
            </button>

            {/* Quick Country Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setCountryPickerOpen(!countryPickerOpen)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-elevated/60 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white transition-colors",
                  selectedCountry && "border-brand-500/40 text-brand-300"
                )}
                title="Filter by Country"
              >
                <Globe className="h-3.5 w-3.5 text-brand-400" />
                <span className="hidden sm:inline">
                  {selectedCountry ? selectedCountry : "Global"}
                </span>
              </button>

              {/* Country Picker Popover */}
              {countryPickerOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setCountryPickerOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 z-50 w-64 max-h-80 overflow-y-auto rounded-xl border border-surface-border bg-surface-secondary p-2 shadow-2xl">
                    <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 border-b border-surface-border/50 mb-1">
                      Filter by Country
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCountry(null);
                        setCountryPickerOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-surface-elevated flex items-center justify-between",
                        !selectedCountry && "bg-brand-500/15 text-brand-300 font-semibold"
                      )}
                    >
                      <span>🌐 All Countries (Global)</span>
                      <span className="text-[10px] text-zinc-500">{channels.length}</span>
                    </button>
                    {countries.slice(0, 40).map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          setSelectedCountry(c.code);
                          setCountryPickerOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-surface-elevated flex items-center justify-between",
                          selectedCountry === c.code &&
                            "bg-brand-500/15 text-brand-300 font-semibold"
                        )}
                      >
                        <span className="truncate pr-2">
                          {c.flag} {c.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 shrink-0">
                          {c.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-elevated/60 p-2 text-zinc-300 hover:text-white hover:border-brand-500/40 transition-colors disabled:opacity-50"
              title={
                lastUpdated
                  ? `Refresh Playlist (Last updated: ${new Date(
                      lastUpdated
                    ).toLocaleTimeString()})`
                  : "Refresh Channels"
              }
            >
              <RotateCw
                className={cn("h-4 w-4", isLoading && "animate-spin text-brand-400")}
              />
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden rounded-xl border border-surface-border bg-surface-elevated p-2 text-zinc-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-surface-border bg-surface/95 px-4 pt-3 pb-5 backdrop-blur-xl animate-fade-in">
            <nav className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-brand-500 text-white font-semibold"
                        : "bg-surface-elevated/60 text-zinc-300 hover:bg-surface-elevated hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                    {item.name === "Favorites" && favorites.length > 0 && (
                      <span className="ml-auto rounded-full bg-white/20 px-1.5 text-[10px]">
                        {favorites.length}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}
