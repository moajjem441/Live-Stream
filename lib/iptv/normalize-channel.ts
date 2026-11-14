import { Channel } from "@/types/channel";

/**
 * Returns initials for channel logo fallback (e.g., "HBO" -> "HB", "Sky Sports" -> "SS")
 */
export function getChannelInitials(name: string): string {
  if (!name) return "TV";
  const words = name.trim().split(/[\s-_]+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Generates an SVG data URL for a nice fallback channel card banner/logo
 */
export function getFallbackChannelSvg(name: string, group: string): string {
  const initials = getChannelInitials(name);
  const color1 = "#1e1b4b";
  const color2 = "#312e81";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <circle cx="150" cy="100" r="45" fill="#4338ca" opacity="0.3"/>
    <text x="150" y="108" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#c7d2fe" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    <text x="150" y="160" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#818cf8" text-anchor="middle">${escapeXml(group || "Live TV")}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
    }
    return c;
  });
}

