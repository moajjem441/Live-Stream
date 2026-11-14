"use client";

import React from "react";
import {
  LayoutGrid,
  List,
  Filter,
  RotateCcw,
  Globe,
  SlidersHorizontal,
  Search,
} from "lucide-react";
import { useChannelStore } from "@/store/channel-store";
import { formatNumber } from "@/lib/utils";

interface ChannelFiltersProps {
  totalCount: number;
  filteredCount: number;
}

export function ChannelFilters({ totalCount, filteredCount }: ChannelFiltersProps) {
  const categories = useChannelStore((s) => s.categories);
  const countries = useChannelStore((s) => s.countries);
  const languages = useChannelStore((s) => s.languages);

  const searchQuery = useChannelStore((s) => s.searchQuery);
  const selectedCategory = useChannelStore((s) => s.selectedCategory);
  const selectedCountry = useChannelStore((s) => s.selectedCountry);
  const selectedLanguage = useChannelStore((s) => s.selectedLanguage);
  const sortBy = useChannelStore((s) => s.sortBy);
  const viewMode = useChannelStore((s) => s.viewMode);

  const setSearchQuery = useChannelStore((s) => s.setSearchQuery);
  const setSelectedCategory = useChannelStore((s) => s.setSelectedCategory);
  const setSelectedCountry = useChannelStore((s) => s.setSelectedCountry);
  const setSelectedLanguage = useChannelStore((s) => s.setSelectedLanguage);
  const setSortBy = useChannelStore((s) => s.setSortBy);
  const setViewMode = useChannelStore((s) => s.setViewMode);
  const resetFilters = useChannelStore((s) => s.resetFilters);

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(selectedCategory) ||
    Boolean(selectedCountry) ||
    Boolean(selectedLanguage);

  return (
    <div className="space-y-4 rounded-2xl border border-surface-border/60 bg-surface/70 p-4 sm:p-5 backdrop-blur-md">
      {/* Top row: Search input + View Mode + Reset */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search within page */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter channels by name..."
            className="w-full rounded-xl border border-surface-border bg-surface-elevated pl-10 pr-4 py-2 text-sm text-foreground placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Right controls: Total count + View Mode + Reset */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs text-zinc-400 font-medium">
            Showing <strong className="text-white">{formatNumber(filteredCount)}</strong> of{" "}
            {formatNumber(totalCount)} channels
          </span>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}

          {/* Grid / List View Toggle */}
          <div className="flex items-center rounded-lg border border-surface-border bg-surface-elevated p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-brand-500 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-brand-500 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: Dropdowns for Category, Country, Language, Sort */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Category Dropdown */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
            Category
          </label>
          <select
            value={selectedCategory || "all"}
            onChange={(e) =>
              setSelectedCategory(e.target.value === "all" ? null : e.target.value)
            }
            className="w-full rounded-lg border border-surface-border bg-surface-elevated px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Categories ({formatNumber(totalCount)})</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name} ({formatNumber(cat.count)})
              </option>
            ))}
          </select>
        </div>

        {/* Country Dropdown */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
            Country
          </label>
          <select
            value={selectedCountry || "all"}
            onChange={(e) =>
              setSelectedCountry(e.target.value === "all" ? null : e.target.value)
            }
            className="w-full rounded-lg border border-surface-border bg-surface-elevated px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Countries</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({formatNumber(c.count)})
              </option>
            ))}
          </select>
        </div>

        {/* Language Dropdown */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
            Language
          </label>
          <select
            value={selectedLanguage || "all"}
            disabled={languages.length === 0}
            onChange={(e) =>
              setSelectedLanguage(e.target.value === "all" ? null : e.target.value)
            }
            className="w-full rounded-lg border border-surface-border bg-surface-elevated px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">
              {languages.length === 0 ? "Language (Unavailable)" : "All Languages"}
            </option>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name} ({formatNumber(l.count)})
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full rounded-lg border border-surface-border bg-surface-elevated px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
          >
            <option value="name-asc">Name (A to Z)</option>
            <option value="name-desc">Name (Z to A)</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>
    </div>
  );
}

