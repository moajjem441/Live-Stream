import { Channel, CategoryInfo } from "@/types/channel";

/**
 * Standard category definitions for primary navigation routing
 */
export const PRIMARY_NAV_CATEGORIES = [
  { name: "Live TV", slug: "all", path: "/live-tv" },
  { name: "Movies", slug: "movies", path: "/movies" },
  { name: "News", slug: "news", path: "/news" },
  { name: "Sports", slug: "sports", path: "/sports" },
  { name: "Entertainment", slug: "entertainment", path: "/entertainment" },
  { name: "Music", slug: "music", path: "/music" },
  { name: "Kids", slug: "kids", path: "/kids" },
  { name: "Favorites", slug: "favorites", path: "/favorites" },
];

/**
 * Normalizes a category string to standard title case
 */
export function normalizeCategoryName(rawCategory: string): string {
  if (!rawCategory || rawCategory.trim().toLowerCase() === "undefined") {
    return "General";
  }

  const trimmed = rawCategory.trim();
  // Capitalize first letters
  return trimmed
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Checks if a channel belongs to a target category
 * Handles both exact matches, sub-categories (e.g. "Movies;Series"), and case-insensitivity
 */
export function channelMatchesCategory(channel: Channel, categorySlugOrName: string): boolean {
  if (!categorySlugOrName || categorySlugOrName.toLowerCase() === "all") {
    return true;
  }

  const target = categorySlugOrName.toLowerCase().trim();
  const targetClean = target.replace(/[-_]+/g, " ");

  // Check primary group
  const groupLower = channel.group.toLowerCase();
  const groupClean = groupLower.replace(/[-_]+/g, " ");
  if (
    groupLower.includes(target) ||
    groupClean.includes(target) ||
    groupClean.includes(targetClean)
  ) {
    return true;
  }

  // Check all secondary categories
  for (const cat of channel.categories) {
    const catLower = cat.toLowerCase();
    const catClean = catLower.replace(/[-_]+/g, " ");
    if (
      catLower.includes(target) ||
      catClean.includes(target) ||
      catClean.includes(targetClean)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Extract dynamic category stats from an array of channels
 */
export function extractCategoriesFromChannels(channels: Channel[]): CategoryInfo[] {
  const counts = new Map<string, number>();

  for (const channel of channels) {
    for (const cat of channel.categories) {
      const normalized = normalizeCategoryName(cat);
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      count,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

