# Devlog publication

Posts are static pages in `app/devlogs/`. Shared post metadata lives in
`data/devlogs.ts`; reading styles are scoped to `devlogs.module.css`. Reuse the
existing site shell and navigation before adding another publishing system.

## Minecraft minigames network — 18 November 2026

- Post: [A Minecraft network that wakes up when you play](https://devonlabs.space/devlogs/minecraft-minigames-network/).
- Production: [ab7d4276](https://ab7d4276.devonlabs-space.pages.dev), source commit `a5bb097095a1cc1398a0c11abd4605463e6859b2`.
- Prior production retained for rollback: `a972fa45-7e19-499a-88be-4dd20c59c1aa`.
- Scope: public design and progress overview; no Minecraft service changes.

The editorial sources are the MinecraftHosting project's current task queue,
network operations, instance board, reset/snapshot, hub station, CTM activation,
egg, compatibility, and Honey Clicker intake records. The queue's completed
activation record takes precedence over older prose describing that activation
as pending. The local catalog has 24 entries including staged Honey Clicker;
the recorded live baseline remains 23 registered games. Catalog length alone is
not deployment evidence.

The post is a dated snapshot. Future changes should explicitly update its date
and claims or become a new devlog. Preserve the distinction between implemented,
tested, installed, activated, and fully playtested. Do not publish private
receipts, player records, credentials, internal addresses, or map archives.

### Verification

- Node 22 and the committed lockfile; Next.js 16.4.3. Reinstalled dependencies
  after discovering an older installed version, then rebuilt the export.
- ESLint, all seven unit tests, image/media integrity, TypeScript through the
  production build, and the complete existing browser suite passed.
- Focused checks passed locally and on production: index-to-post navigation,
  canonical URL, active section navigation, all ten contents links, keyboard
  skip/focus, no-JavaScript content, four widths (320/390/768/1440), both themes,
  WCAG A/AA scans, and no browser console errors.
- Inspected desktop/mobile and diagram screenshots. Used installed Chromium
  after the in-app browser was unavailable and bundled Chromium could not open
  Axe's second page. No test assertions were removed.
- Both new pages and their checked assets match the tested export bytes. The
  homepage is transformed by the existing Cloudflare email-protection feature;
  its new navigation is present. All nine primary content routes return 200.
- An independent read-only review corrected the save wording: returning to the
  hub transfers the player; the backend saves before automatic shutdown.

### Follow-up

The dependency audit flags existing advisories, including Next.js cache
information-disclosure advisories
[GHSA-mfr8-8qww-v76h](https://github.com/advisories/GHSA-mfr8-8qww-v76h) and
[GHSA-vc7v-qv4w-wrv8](https://github.com/advisories/GHSA-vc7v-qv4w-wrv8).
The installed CLI emitted an upgrade reminder and the unchanged build passed
on its documented retry. Upgrade and verify dependencies in a separate task;
this publication does not claim a clean security audit. Production remains a
static export without a request-time Next.js server.

The next editorial practice is to recheck the current queue against actual
activation evidence before writing the next progress post. A successful server
startup still does not establish a complete map playthrough.

## Client screenshot follow-up — 18 November 2026

The user supplied five fresh, HUD-free screenshots for this post. The original
2560×1440 PNGs remain in the client; public WebP copies explicitly use sRGB,
retain the entire frame, and use the existing responsive-image pipeline.

| Capture | Public image | Subject |
| --- | --- | --- |
| `2026-11-18_07.04.07.png` | `minigames-hub-overview.webp` | Hub and empty instance board; article/social cover |
| `2026-11-18_07.04.19.png` | `minigames-spawn-plaza.webp` | Welcome text and central plaza |
| `2026-11-18_07.04.32.png` | `minigames-adventure-stations.webp` | Art of Defense and Aghanim’s Labyrinth 2 |
| `2026-11-18_07.04.43.png` | `minigames-diversity-apiary.webp` | Diversity trilogy and placed Apiary station |
| `2026-11-18_07.04.49.png` | `minigames-party-stations.webp` | Mineparty and Mario Party |

All five have captions, alt text, and full-size links. The hero loads eagerly;
the other four load lazily. Twenty responsive variants cover 320–1600px widths.
The placement status now acknowledges the visible Apiary display. The plaza
image contains the public join hostname as part of its in-game welcome signage;
no player names, chat, coordinates, or private operational details are visible.

Lint, unit/image-integrity checks, and the production build passed. Focused
browser checks verified image decoding, 16:9 proportions, mobile/desktop layout,
both themes, contents/keyboard navigation, no-JavaScript article content, and
WCAG A/AA. Visual checks compared the source colors and rendered screenshots.
