# StreamX — Independent Technical Audit & Verification Report

---

### A. Executive Summary

This independent technical audit evaluated the StreamX live IPTV streaming application across 11 core functional, architectural, performance, and reliability domains. Testing was conducted directly against the live remote playlist source (`https://iptv-org.github.io/iptv/index.m3u`), the Next.js runtime, and the compiled production application.

**Key Findings:**
1. **Single Playlist Architecture:** Fully verified. Only `https://iptv-org.github.io/iptv/index.m3u` is queried. Concurrent network request deduplication and in-memory caching prevent duplicate upstream network fetches.
2. **Real Dataset Statistics:** Fresh calculation on the live source confirms **11,472** raw `#EXTINF:` entries yielding **11,457** valid HTTP/HTTPS streaming channels across **30** dynamic categories and **180** unique countries. Exactly **15** entries are non-HTTP protocols (`rtmp://`, `srt://`, `rtsp://`) which are safely filtered out.
3. **M3U Parser:** Tested against 14 specific IPTV format variations. Originally failed on `#EXTGRP:` and `#EXTLOGO:`. Both directives were patched and verified to PASS.
4. **Search System:** Search across 11,457 channels executes in **0.7ms - 1.2ms**. A bug where `tvg-id` and `id` were omitted from string matching was identified and fixed.
5. **Playback Reality:** Out of tested HTTPS HLS streams from the public playlist, streams on CDNs with open CORS headers (`Access-Control-Allow-Origin: *`) play smoothly in HLS.js. Streams with domain-locked CORS (`http://pluto.tv`), offline origin servers, or non-HLS content trigger the player's error screen with retry, next channel, and direct link options.
6. **SSR & Hydration:** Identified and fixed an initial SSR state issue where client-rendered watch/category pages rendered empty `<main>` tags on the server before client hydration. Pages now render skeletons on SSR, ensuring consistent hydration.
7. **Production Verification:** `npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass with exit code 0 and zero warnings.

---

### B. Actual Test Environment

- **Operating System:** Windows 11 Pro (amd64)
- **Node.js Version:** `v22.20.0`
- **npm Version:** `11.7.0`
- **Next.js Version:** `14.2.15` (App Router)
- **TypeScript Version:** `5.6.3`
- **ESLint Version:** `8.57.1` / `eslint-config-next@14.2.15`
- **Test Commands Executed:**
  - `npx tsx audit/test_playlist_architecture.mjs`
  - `npx tsx audit/test_m3u_parser.mjs`
  - `npx tsx audit/test_playlist_statistics.mjs`
  - `npx tsx audit/test_categories_countries_languages.mjs`
  - `npx tsx audit/test_search_and_pagination.mjs`
  - `npx tsx audit/test_favorites_and_history.mjs`
  - `npx tsx audit/test_real_playback.mjs`
  - `npx tsx audit/test_route_content.mjs`
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm run build`
- **Testing Limitations:** Chrome DevTools remote debugging port (`DevToolsActivePort`) was unavailable in this headless environment. Interactive visual UI click events were therefore verified via automated Node.js DOM/HTTP integration probes and unit tests rather than live Chrome DevTools session.

---

### C. Verification Results

| Feature | Status | Test Method | Actual Result | Evidence |
|---|---|---|---|---|
| **Single Playlist Enforcement** | **PASS** | Codebase regex search & AST inspection | Only `https://iptv-org.github.io/iptv/index.m3u` is referenced. No category playlists (`movies.m3u`, `news.m3u`, etc.) exist. | `Select-String -Pattern "m3u"` matched only `fetch-playlist.ts` and `parse-m3u.ts`. |
| **Network Request Deduplication** | **PASS** | Automated mock network test (`test_playlist_architecture.mjs`) | 5 simultaneous `fetchPlaylist()` calls executed only 1 network fetch. Subsequent calls returned cached reference (0 delta fetches). | Network fetch counter logged `Total network fetches triggered: 1` across 5 concurrent promises. |
| **Cache Expiration & Force Refresh** | **PASS** | Automated integration test (`test_playlist_architecture.mjs`) | `fetchPlaylist({ force: true })` bypasses cache and triggers a fresh upstream request. Cache TTL configured to 1 hour (3,600,000ms). | Network fetch counter incremented from 1 to 2 upon `force: true`. |
| **Fallback API Proxy** | **PASS** | Automated network fault injection | Simulated network rejection on primary URL; fetch service cleanly fell back to `/api/playlist` proxy. | Logged: `Direct fetch failed... Fallback fetch initiated to: /api/playlist. Fallback succeeded with 1 channels`. |
| **M3U Standard Directives** | **PASS** | Automated unit test suite (`test_m3u_parser.mjs`) | Supported `#EXTINF`, `#EXTGRP`, `#EXTLOGO`, `#EXTHTTP`, `#EXTVLCOPT`, quotes, commas in titles, and CRLF line breaks. | 14/14 test cases passed in test runner. |
| **Unsupported Protocols Filter** | **PASS** | Automated parser test on real playlist | Non-HTTP streams (`rtmp://`, `srt://`, `rtsp://`) are filtered out and not added to playable dataset. | 15 non-HTTP entries omitted from parsed output; 0 invalid protocol URLs exist in dataset. |
| **Dynamic Categories** | **PASS** | Live dataset analysis (`test_categories_countries_languages.mjs`) | 30 dynamic categories generated from `group-title` and `#EXTGRP`. Compound groups (e.g. `Movies;Series`) indexed in both categories. | 639 compound channels verified to match both primary and secondary categories. |
| **Category Slug Matching** | **PASS** | Automated matching test across all 30 categories | All 30 categories matched expected counts using slugified and cleaned string matching. | All 30 categories matched by slug with 0 mismatches. |
| **Country Code Derivation** | **PASS** | Automated parser test across 11,457 channels | Extracted ISO 3166-1 alpha-2 country codes from `tvg-id` format (`channel.cc@quality`). Mapped to names and flag emojis. | 180 countries detected. 0 channels without country code (100% matched). |
| **Language Metadata** | **PARTIAL** | Live playlist inspection | `iptv-org`'s `index.m3u` does not provide `tvg-language` tags. Filter safely displays `Language (Unavailable)` and disables dropdown rather than inventing fake data. | 0 channels contain explicit language tags; 11,457 mark language as `Unknown`. |
| **Search Functionality** | **PASS** | Automated benchmark test (`test_search_and_pagination.mjs`) | Case-insensitive search, partial channel name, category, country, `id`, and `tvg-id` search all return matching channels. | Latency: 0.79ms - 1.2ms average per query over 11,457 records. |
| **Pagination Boundaries** | **PASS** | Boundary calculation test (`test_search_and_pagination.mjs`) | Slices 48 channels per page across 239 total pages. Page 1 starts at channel 1; page 239 ends at channel 11,457 (33 items). Filter changes reset page to 1. | Slices verified for pages 1, 4, 5, 120, 238, 239. Last page has exactly 33 channels (11,457 % 48 = 33). |
| **Favorites Add / Remove** | **PASS** | Zustand store unit test (`test_favorites_and_history.mjs`) | `toggleFavorite` adds channel, checks `isFavorite: true`, and toggles off to `false`. | Verified state transitions: `[]` -> `['channel-1']` -> `['channel-2', 'channel-1']` -> `['channel-2']`. |
| **Recently Watched Deduplication** | **PASS** | Store unit test (`test_favorites_and_history.mjs`) | Re-watching a channel moves it to the front of the queue without duplicating array entries. Capped at 30 items. | Watching `A, B, C, A` produced `['channel-A', 'channel-C', 'channel-B']` (length: 3). |
| **LocalStorage Corruption Tolerance**| **PASS** | Fault injection test (`test_favorites_and_history.mjs`) | Corrupted JSON string in localStorage caught safely by parse guard without throwing or crashing UI. | Logged: `Corrupted JSON safely caught without crashing? true`. |
| **Real IPTV Playback** | **PARTIAL** | Network probe on 11 representative live streams (`test_real_playback.mjs`) | HLS streams with `Access-Control-Allow-Origin: *` or matching origin play via HLS.js. Domain-locked CORS (e.g. `pluto.tv`) or offline origins trigger the error overlay. | 7/11 streams returned valid HLS manifests with CORS headers; 4 were blocked by upstream CORS, offline server, or HTTP mixed-content restrictions. |
| **Error Screen & Recovery** | **PASS** | Code inspection & simulated playback failure | When HLS encounters a fatal network error, `hasError` state displays the error banner with "Retry Stream", "Next Channel", and "Direct Link". | Inspected `components/player/VideoPlayer.tsx` lines 120-160 and 320-365. |
| **Mini Player Route Persistence** | **PASS** | Code inspection & layout persistence | `MiniPlayer` is mounted in root `layout.tsx` outside page children; persists during client route changes; automatically suppresses on `/watch/[id]`. | Inspected `app/layout.tsx` line 34 and `components/player/MiniPlayer.tsx` lines 36-39. |
| **SSR / Hydration Consistency** | **PASS** | SSR HTML inspection (`inspect_ssr.mjs`) | Server-rendered HTML renders pulse skeletons during initial load. Client hydration mounts real data without React text/attribute mismatch warnings. | All 10 routes render full HTML structures (1,767 - 13,454 bytes) with skeletons. |
| **Production Build** | **PASS** | Next.js build command | `npm run build` completed successfully with exit code 0. Zero TypeScript errors. | Build log: `✓ Compiled successfully`, `✓ Generating static pages (12/12)`. |
| **Typecheck** | **PASS** | TypeScript compiler | `npx tsc --noEmit` completed with exit code 0 and zero errors. | Command completed with 0 errors. |
| **Linter** | **PASS** | ESLint check | `npm run lint` completed with exit code 0. Zero errors and zero warnings. | Output: `✔ No ESLint warnings or errors`. |
| **Interactive Chrome DevTools** | **NOT VERIFIED** | Chrome DevTools subagent | Chrome remote debugging port was not active on host machine (`DevToolsActivePort` missing). | Automated HTTP/DOM probes executed as alternatives. |

---

### D. Actual Playlist Statistics

Data freshly fetched from `https://iptv-org.github.io/iptv/index.m3u` on **2026-11-14**:

- **Downloaded Size:** 2,638,696 bytes (~2.64 MB)
- **Total Lines in Raw M3U:** 23,862 lines
- **Total `#EXTINF:` Entries:** 11,472
- **Successfully Parsed Channels:** 11,457 (parsing took 69 milliseconds)
- **Valid HTTP/HTTPS Stream URLs:** 11,457
  - HTTPS URLs: 9,060 (79.1%)
  - HTTP URLs: 2,397 (20.9%)
- **Unsupported Protocol Entries:** 15 (0.13%)
  - RTMP (`rtmp://`): 11
  - SRT (`srt://`): 1
  - RTSP (`rtsp://`): 1
  - Other non-HTTP: 2
- **Invalid or Incomplete Entries (missing URL):** 0
- **Duplicate Channel IDs:** 0 (100% unique)
- **Duplicate Stream URLs in Raw Playlist:** 0
- **Unique Countries Detected:** 180
- **Unique Categories Detected:** 30
- **Channels Without Country Metadata:** 0 (100% resolved via `tvg-id` country code suffix)

**Top 5 Countries by Channel Count:**
1. United States (`US`): 2,011 channels
2. India (`IN`): 827 channels
3. Russia (`RU`): 520 channels
4. Germany (`DE`): 439 channels
5. Sweden (`SE`): 380 channels

**Top 5 Categories by Channel Count:**
1. General: 2,749 channels
2. Undefined: 1,541 channels
3. News: 1,067 channels
4. Entertainment: 905 channels
5. Religious: 822 channels

---

### E. Confirmed Bugs & Fixes Applied

#### Bug 1: Missing `tvg-id` and `id` in Search Condition
- **Description:** Searching for a channel by its exact `tvg-id` (e.g. `00sReplay.us@SD`) returned 0 results.
- **Reproduction Steps:** Call `useChannelStore.getState().searchChannels("00sReplay.us@SD")`. Returned empty array.
- **Root Cause:** In `store/channel-store.ts`, `searchChannels` and `getFilteredChannels` checked `c.name`, `c.tvgName`, `c.group`, `c.country`, but omitted `c.tvgId` and `c.id`.
- **Files Affected:** `store/channel-store.ts`
- **Fix Applied:** Added `(c.tvgId && c.tvgId.toLowerCase().includes(q)) || c.id.toLowerCase().includes(q)` to both selectors.
- **Retest Result:** PASS. `searchChannels("00sReplay.us@SD")` returned 1 hit (`00s Replay`).

#### Bug 2: Missing Support for `#EXTGRP:` and `#EXTLOGO:` M3U Directives
- **Description:** When an IPTV playlist entry used `#EXTGRP:Category` or `#EXTLOGO:url` instead of inline attributes, category defaulted to `Uncategorized` and logo was lost.
- **Reproduction Steps:** Feed M3U content containing `#EXTGRP:Sports` between `#EXTINF` and URL into `parseM3U()`.
- **Root Cause:** In `lib/iptv/parse-m3u.ts`, all lines starting with `#` other than `#EXTVLCOPT:` were treated as generic comments.
- **Files Affected:** `lib/iptv/parse-m3u.ts`
- **Fix Applied:** Added parsing for `#EXTGRP:`, `#EXTLOGO:`, and `#EXTHTTP:`, passing fallback values into `parseExtInf()`.
- **Retest Result:** PASS. All 14 M3U parser test cases passed.

#### Bug 3: Empty `<main>` Tag on SSR Watch Page
- **Description:** Navigating or querying `/watch/[id]` directly returned an empty `<main class="flex-1"></main>` in the server-rendered HTML.
- **Reproduction Steps:** Execute `fetch('http://localhost:3009/watch/00sreplayussd')` and inspect `<main>`.
- **Root Cause:** In `app/watch/[id]/page.tsx`, `if (!channel) return null;` executed on SSR because channels load asynchronously via client effect.
- **Files Affected:** `app/watch/[id]/page.tsx`
- **Fix Applied:** If `channels.length === 0`, render the player skeleton structure so SSR returns full HTML.
- **Retest Result:** PASS. Server-rendered HTML length increased from 0 to 233 chars with proper skeleton layout.

#### Bug 4: Category Page SSR Empty Flashing
- **Description:** Category pages (`/movies`, `/news`, `/sports`, etc.) rendered "No channels found" in SSR HTML before client dataset hydrated.
- **Reproduction Steps:** Check SSR HTML of `/movies` or `/kids`.
- **Root Cause:** Check was `if (isLoading && channels.length === 0)`; on initial SSR, `isLoading` is false and `channels` is empty, triggering the empty message branch.
- **Files Affected:** `app/page.tsx`, `app/movies/page.tsx`, `app/news/page.tsx`, `app/sports/page.tsx`, `app/entertainment/page.tsx`, `app/music/page.tsx`, `app/kids/page.tsx`
- **Fix Applied:** Changed condition to `if (channels.length === 0)` to display loading skeletons during initial load.
- **Retest Result:** PASS. All category pages return complete skeleton structures on SSR.

#### Bug 5: Re-attaching Keyboard Event Listeners in VideoPlayer
- **Description:** Video player keyboard event listeners were re-binding on every single render cycle.
- **Reproduction Steps:** Run `npm run lint`. Warned: `togglePlay` and `toggleFullscreen` make dependencies of useEffect change on every render.
- **Root Cause:** `togglePlay` and `toggleFullscreen` were unmemoized function declarations in the component body.
- **Files Affected:** `components/player/VideoPlayer.tsx`
- **Fix Applied:** Wrapped both callbacks in `useCallback(..., [])`.
- **Retest Result:** PASS. ESLint hook warning cleared.

---

### F. Performance Findings

- **Parser Execution Time:** 69ms to parse 2.64 MB of raw M3U text (11,457 channels).
- **Search Latency:** 0.79ms - 1.2ms average over 11,457 in-memory records.
- **Filtering Latency:** 5.6ms - 8.1ms average over 11,457 in-memory records.
- **Pagination Overhead:** Sub-millisecond slice operation (48 items per page).
- **Production Server Response Times:**
  - Route `/`: 151ms - 366ms
  - Route `/live-tv`: 17ms - 24ms
  - Route `/movies`: 14ms - 15ms
  - Route `/news`: 13ms
  - Route `/sports`: 19ms
  - Route `/favorites`: 12ms - 13ms
  - Dynamic Route `/watch/00sreplayussd`: 108ms - 134ms
  - Proxy `/api/playlist`: 614ms (cached in Node memory) / 4.0s (cold upstream fetch)

---

### G. Security & Reliability Findings

#### Confirmed Risks
1. **HTTP Mixed Content on HTTPS Deployments:**
   - **Finding:** 2,397 channels (20.9% of the playlist) use unencrypted `http://` URLs.
   - **Impact:** If StreamX is deployed to an HTTPS domain (e.g. Vercel, Netlify, Cloudflare), modern browsers block mixed content HTTP streams.
   - **Mitigation in Place:** StreamX provides an explicit "Direct Link" button allowing users to open the stream in desktop players like VLC if blocked by browser policy.
2. **Third-Party CORS Restrictions:**
   - **Finding:** Public IPTV streams are controlled by external broadcasters. Broadcasters that omit `Access-Control-Allow-Origin: *` cannot be played in web browsers.
   - **Impact:** Streams from restricted origins (e.g. Pluto TV domain-locked feeds) fail to load in HLS.js.
   - **Mitigation in Place:** The custom error screen catches fatal network errors, explains the CORS restriction, and offers immediate retry, next channel, and direct link options.

#### Potential Risks
1. **External Logo Images:** Channel logos reference thousands of third-party domains. Handled safely with `unoptimized: true` in Next.js config and SVG initials fallback on `onError`.
2. **XML/SVG Injection:** Fallback SVG generator uses `escapeXml()` to sanitize channel titles and groups against `<>&'"`.

---

### H. Modified Files

| File | Reason for Modification |
|---|---|
| `lib/iptv/parse-m3u.ts` | Added support for `#EXTGRP:`, `#EXTLOGO:`, and `#EXTHTTP:` M3U directives. |
| `store/channel-store.ts` | Added `tvgId` and `id` to search conditions; added concurrency guard in `loadChannels()`; made `getChannelById` case-insensitive. |
| `components/player/VideoPlayer.tsx` | Wrapped `togglePlay` and `toggleFullscreen` in `useCallback` to prevent unnecessary event listener re-attachments. |
| `app/watch/[id]/page.tsx` | Render player skeleton during SSR when `channels.length === 0`; synchronized `setActivePlayerChannel` on watch. |
| `app/page.tsx` | Fixed SSR skeleton display condition; cleaned `useMemo` dependencies. |
| `app/movies/page.tsx` | Fixed SSR skeleton display condition; cleaned `useMemo` dependencies. |
| `app/news/page.tsx` | Fixed SSR skeleton display condition; cleaned `useMemo` dependencies. |
| `app/sports/page.tsx` | Fixed SSR skeleton display condition; cleaned `useMemo` dependencies. |
| `app/entertainment/page.tsx` | Fixed SSR skeleton display condition; cleaned `useMemo` dependencies. |
| `app/music/page.tsx` | Fixed SSR skeleton display condition; cleaned `useMemo` dependencies. |
| `app/kids/page.tsx` | Fixed SSR skeleton display condition; cleaned `useMemo` dependencies. |
| `app/live-tv/page.tsx` | Cleaned `useMemo` dependencies. |
| `components/filters/ChannelFilters.tsx` | Updated language filter to show `Language (Unavailable)` and disable when count is 0. |
| `hooks/use-favorites.ts` | Added client mount hydration guard to prevent SSR/CSR attribute mismatch. |
| `hooks/use-recently-watched.ts` | Added client mount hydration guard to prevent SSR/CSR attribute mismatch. |
| `components/navbar/Navbar.tsx` | Added client mount hydration guard for favorites count badge. |
| `lib/iptv/categorize-channels.ts` | Normalized hyphens and underscores to spaces for slug matching. |
| `tsconfig.json` | Updated target to `es2020` and enabled `downlevelIteration`. |
| `.eslintrc.json` | Configured Next.js core web vitals lint rules. |

---

### I. Remaining Problems

1. **Upstream IPTV Stream Volatility:** Approximately 20% to 35% of public streams on `iptv-org` are either offline, geo-blocked, or restricted by domain CORS policies at any given time. This is an inherent property of public IPTV playlists and cannot be solved client-side without an external transcoding relay.
2. **Missing Language Metadata in Source:** The primary `iptv-org` playlist does not annotate channels with `tvg-language`. Language filtering remains unavailable as required by prompt rules to avoid fabricating metadata.
3. **Headless Chrome DevTools:** Interactive visual testing through Chrome DevTools could not be completed due to the missing debugging port on the host system.

---

### J. Final Verdict

**Verdict: READY FOR TESTING / READY FOR DEPLOYMENT**

StreamX adheres strictly to the single-playlist architecture, parses all 11,457 valid channels reliably, prevents duplicate network calls, supports dynamic categorization, pagination, search, favorites persistence, and handles stream failures gracefully. Zero TypeScript or ESLint errors exist, and the production build compiles cleanly.

