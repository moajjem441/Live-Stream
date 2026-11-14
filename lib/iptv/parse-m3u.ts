import { Channel, CategoryInfo, CountryInfo, LanguageInfo, PlaylistMetadata } from "@/types/channel";
import { getCountryName, getCountryFlag } from "./countries";

export interface ParsedPlaylistResult {
  channels: Channel[];
  metadata: PlaylistMetadata;
}

/**
 * Robust M3U Parser designed specifically for IPTV playlists.
 * Handles quoted attributes, channel names with commas, CRLF/LF,
 * VLCOPT directives, and derives country/resolution metadata.
 */
export function parseM3U(m3uContent: string): ParsedPlaylistResult {
  if (!m3uContent || typeof m3uContent !== "string") {
    return {
      channels: [],
      metadata: {
        channelCount: 0,
        lastUpdated: Date.now(),
        categories: [],
        countries: [],
        languages: [],
      },
    };
  }

  const lines = m3uContent.split(/\r?\n/);
  const channels: Channel[] = [];
  const categoryMap = new Map<string, number>();
  const countryMap = new Map<string, number>();
  const languageMap = new Map<string, number>();
  const seenUrls = new Set<string>();

  let currentExtInf: string | null = null;
  let currentUserAgent: string | undefined = undefined;
  let currentReferrer: string | undefined = undefined;
  let currentExtGrp: string | undefined = undefined;
  let currentExtLogo: string | undefined = undefined;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    // Check for EXTINF line
    if (line.startsWith("#EXTINF:")) {
      currentExtInf = line;
      currentUserAgent = undefined;
      currentReferrer = undefined;
      currentExtGrp = undefined;
      currentExtLogo = undefined;
      continue;
    }

    // Check for EXTGRP directive (fallback category)
    if (line.startsWith("#EXTGRP:")) {
      currentExtGrp = line.substring(8).trim();
      continue;
    }

    // Check for EXTLOGO directive (fallback logo)
    if (line.startsWith("#EXTLOGO:")) {
      currentExtLogo = line.substring(9).trim();
      continue;
    }

    // Check for EXTHTTP directive (custom headers)
    if (line.startsWith("#EXTHTTP:")) {
      try {
        const httpOpts = JSON.parse(line.substring(9).trim());
        if (httpOpts["User-Agent"]) currentUserAgent = httpOpts["User-Agent"];
        if (httpOpts["Referer"]) currentReferrer = httpOpts["Referer"];
      } catch (e) {
        // ignore malformed JSON in EXTHTTP
      }
      continue;
    }

    // Check for VLC options before the URL
    if (line.startsWith("#EXTVLCOPT:")) {
      const opt = line.substring(11).trim();
      if (opt.startsWith("http-user-agent=")) {
        currentUserAgent = opt.substring(16).trim();
      } else if (opt.startsWith("http-referrer=")) {
        currentReferrer = opt.substring(14).trim();
      }
      continue;
    }

    // Ignore other comments
    if (line.startsWith("#")) {
      continue;
    }

    // This line should be a stream URL
    if (currentExtInf && (line.startsWith("http://") || line.startsWith("https://"))) {
      const streamUrl = line;

      // Avoid duplicate stream URLs if any
      if (seenUrls.has(streamUrl)) {
        currentExtInf = null;
        continue;
      }
      seenUrls.add(streamUrl);

      // Parse metadata from currentExtInf
      const channel = parseExtInf(
        currentExtInf,
        streamUrl,
        channels.length + 1,
        currentUserAgent,
        currentReferrer,
        currentExtGrp,
        currentExtLogo
      );

      if (channel) {
        channels.push(channel);

        // Track category counts
        for (const cat of channel.categories) {
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        }

        // Track country counts
        if (channel.countryCode && channel.countryCode !== "UNKNOWN") {
          countryMap.set(channel.countryCode, (countryMap.get(channel.countryCode) || 0) + 1);
        }

        // Track language counts
        if (channel.language && channel.language !== "Unknown") {
          languageMap.set(channel.language, (languageMap.get(channel.language) || 0) + 1);
        }
      }

      currentExtInf = null;
      currentUserAgent = undefined;
      currentReferrer = undefined;
      currentExtGrp = undefined;
      currentExtLogo = undefined;
    }
  }

  // Format categories
  const categories: CategoryInfo[] = Array.from(categoryMap.entries())
    .map(([name, count]) => ({
      id: slugify(name),
      name,
      slug: slugify(name),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Format countries
  const countries: CountryInfo[] = Array.from(countryMap.entries())
    .map(([code, count]) => ({
      code,
      name: getCountryName(code),
      flag: getCountryFlag(code),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Format languages
  const languages: LanguageInfo[] = Array.from(languageMap.entries())
    .map(([code, count]) => ({
      code,
      name: code,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    channels,
    metadata: {
      channelCount: channels.length,
      lastUpdated: Date.now(),
      categories,
      countries,
      languages,
    },
  };
}

/**
 * Parse an EXTINF line into a Channel object
 */
function parseExtInf(
  extinfLine: string,
  streamUrl: string,
  index: number,
  inheritedUserAgent?: string,
  inheritedReferrer?: string,
  fallbackGroup?: string,
  fallbackLogo?: string
): Channel | null {
  try {
    // 1. Separate attributes from channel title.
    // The comma separating attributes and title is after the duration/attributes.
    // Attributes look like: #EXTINF:-1 tvg-id="..." group-title="...",Channel Name
    let title = "";
    let attributesStr = "";

    // Find the comma that marks the start of the title.
    // Notice attributes can contain quoted strings with commas inside, so we scan carefully.
    let inQuotes = false;
    let splitIdx = -1;

    // Start scanning after '#EXTINF:'
    const startIdx = 8;
    for (let i = startIdx; i < extinfLine.length; i++) {
      const char = extinfLine[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        splitIdx = i;
        break;
      }
    }

    if (splitIdx !== -1) {
      attributesStr = extinfLine.substring(startIdx, splitIdx).trim();
      title = extinfLine.substring(splitIdx + 1).trim();
    } else {
      title = extinfLine.substring(startIdx).trim();
    }

    // Fallback if title is empty
    if (!title) {
      title = `Channel ${index}`;
    }

    // 2. Extract key-value attributes
    const attributes: Record<string, string> = {};
    const attrRegex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
    let match: RegExpExecArray | null;

    while ((match = attrRegex.exec(attributesStr)) !== null) {
      attributes[match[1].toLowerCase()] = match[2];
    }

    const tvgId = attributes["tvg-id"] || "";
    const tvgName = attributes["tvg-name"] || title;
    const tvgLogo = attributes["tvg-logo"] || fallbackLogo || "";
    const rawGroup = attributes["group-title"] || fallbackGroup || "Uncategorized";
    const httpUserAgent = attributes["http-user-agent"] || inheritedUserAgent;
    const httpReferrer = attributes["http-referrer"] || inheritedReferrer;

    // 3. Normalize categories
    // Some channels have multiple categories separated by semicolons: "Entertainment;General"
    const rawCategories = rawGroup
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean);

    const categories = rawCategories.length > 0 ? rawCategories : ["Uncategorized"];
    const primaryGroup = categories[0] || "Uncategorized";

    // 4. Extract Country
    let countryCode = attributes["tvg-country"] || "";
    if (!countryCode && tvgId) {
      // Common IPTV-org format: ChannelName.cc@Quality or ChannelName.cc
      const countryMatch = tvgId.match(/\.([a-z]{2})(?:@[^"]*)?$/i);
      if (countryMatch) {
        countryCode = countryMatch[1].toUpperCase();
      }
    }

    const country = countryCode ? getCountryName(countryCode) : "Unknown";

    // 5. Extract Language
    const language = attributes["tvg-language"] || "Unknown";

    // 6. Extract Resolution
    let resolution = "";
    const resMatch = (title + " " + tvgId).match(/\b(4k|2160p|1080p|720p|576p|480p|360p|270p|HD|FHD|SD|UHD)\b/i);
    if (resMatch) {
      resolution = resMatch[1].toUpperCase();
    }

    // 7. Generate stable Unique ID
    const uniqueId = tvgId
      ? slugify(tvgId)
      : `${slugify(title)}-${index}`;

    return {
      id: uniqueId,
      name: title,
      tvgId,
      tvgName,
      logo: tvgLogo,
      group: primaryGroup,
      categories,
      country,
      countryCode: countryCode.toUpperCase(),
      language,
      url: streamUrl,
      resolution: resolution || undefined,
      httpUserAgent,
      httpReferrer,
    };
  } catch (err) {
    console.error("Failed to parse EXTINF entry:", extinfLine, err);
    return null;
  }
}

/**
 * Generate a URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

