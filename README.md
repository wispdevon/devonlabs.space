# Devon Labs

A typography-led portfolio for Wisp’s software, photography, films, and hardware, inspired by the personal, browsable layouts of https://rsms.me/ and https://aresluna.org/. The homepage combines rsms.me’s parallel editorial columns and vertical navigation with Strider’s warm paper, faint dot grid, titanium accents, and graphite dark mode. Fonts and project and photography assets are local. The theme follows the system and a manual override persists locally. Software summaries live in `app/page.tsx`; repository details remain in `data/developer-projects.ts`.

The original illustrated workshop is preserved at `/workshop/` with its own layout and styles.

A still, illustrated 2D point-and-click workshop for Wisp's software, photography, film, and hardware. No 3D renderer, physics, walking, camera dragging, or animation loop. Click objects to explore. Narrow screens expose the same objects as labeled touch targets beneath the illustration.

All twelve destinations are available through room categories, a searchable index, and the window's constellation. Six curiosities can be collected. Use the negative, lens, and transmitter to restore three devices. Puzzles never gate portfolio content. Existing version-one visitor progress is preserved in local storage. Native dialogs support keyboard navigation, Escape, and focus restoration.

Descriptions come from public READMEs; Sharply is credited as a fork. Portrait, photo-review, and contact-sheet previews illustrate selected projects, not full applications. Twelve real photos come from https://im.devonlabs.space/s/thebest. The camp film streams on demand from photo.devonlabs.space. Hardware links to the shop without invented catalogue claims.

The generated room (`public/workshop/room.webp`) is fictional environment art, not portfolio photography. Inter and portfolio images are local. Photography and Ghost remain at photo.devonlabs.space. This project does not alter Ghost or DNS.

## Development

Use Node 22 or newer.

```sh
npm ci
npm run dev -- --port 3011
npm run lint
npm test
npm run build
npm run start -- --ip 127.0.0.1 --port 3011
npm run test:browser
npm run test:adventure
```

Tests cover media integrity, progress migration, static room pixels, project viewers, responsive layouts, pickups, item matching, repairs, and focus restoration. Set `TEST_URL` to the full workshop URL (for example `http://localhost:3012/workshop/`) for a different preview/live target. Browser tests also check the portfolio at that URL’s origin. Set `SCREENSHOT_DIR` for evidence outside the repository.

## Cloudflare Pages

`npm run deploy` builds the static export in `out/` and publishes via Wrangler to Pages project `devonlabs-space`, hosted at devonlabs.space. No runtime server or secrets are required. GitHub Actions validates pushes but does not publish them. Existing DNS excludes the apex from Tensor's dynamic updates.

## Content

Edit `data/developer-projects.ts` for software descriptions, `data/workshop.ts` for work/items/puzzles, and `app/adventure.tsx` for object placement. `npm run refresh:github` updates the checked-in public metadata snapshot. Optional `GITHUB_TOKEN` is never shipped to browsers. `npm run refresh:media` refreshes twelve public photographs and provenance in `data/workshop-media.json`; the current snapshot uses the album's October 2025 bucket. Verify public shop products before adding catalogue content.
