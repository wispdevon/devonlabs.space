# Devon Labs

A colorful multi-page portfolio for Wisp’s software, photography, films, and hardware, inspired by https://rsms.me/, https://aresluna.org/, and the Strider design system. The homepage is About, with biography sourced from [Wisp’s GitHub profile README](https://github.com/wispdevon/wispdevon); the retrieved snapshot and curated content live in `data/profile-readme.md` and `data/profile.ts`. Work, Software, Film, Photography, Coffee and Shop each have their own static page. Work presents existing software, photographs and film alongside Bjorn The Cyber Viking and Blackhole Badge hardware projects; Coffee includes an interactive origin atlas, gear list, methodologies, four curated photos and two original-quality on-demand videos from the Home Coffee album, a dose-to-water calculator and an invitation to chat. A read-only 25-country exploration list accompanies the published history; only confirmed records are marked Tried. Confirmed gear: Hario V60, Flair Neo, ROKpresso Classic, Mischief M40 and Hario Switch. Coffee media comes from https://im.devonlabs.space/s/homecoffee; responsive photos and the original H.264 video are stored locally in public/coffee and indexed in data/coffee-media.json. Published origins, favorites and next-to-try choices are confirmed by Wisp; individual tasting notes remain empty. Edit coffee origins, the starter checklist and gear in `data/coffee.ts`. The map uses local country paths derived from Natural Earth via [world-atlas](https://github.com/topojson/world-atlas); attribution is in `data/world-countries.LICENSE`.

Warm paper and plum text pair with page-specific violet/lime, cobalt/peach, teal/coral, burgundy/apricot, and forest/lime duotones. SVG filters color About, Work, Film and software interface studies without altering the originals; Photography, Shop photographs and website previews retain original colors. Photography shows original colors and offers a native large-image dialog; the film plays on demand in original color. Fonts and preview images are local. Theme preference persists and follows the OS before a manual override. About includes colored stack icons and a portrait/contact column linking GitHub, Bluesky, Last.fm, Discord and email; its profile photo is a local copy of Wisp’s public GitHub avatar. Discord opens the app and lets visitors copy the username wispcream; email links to wisp@devonlabs.space. Edit software summaries in `data/portfolio-summaries.ts`; repository details remain in `data/developer-projects.ts`.

The Devon Labs Shop offers Phuket photography coverage, the After Hours shirt, and two digital photo files. Each photography item opens its own details modal and prefills an email enquiry. Merchandise previews reuse the existing artwork and portfolio photos; payment and booking are confirmed by email. The illustrated workshop page and navigation are removed. Cloudflare redirects its old URL to `/shop/`. Existing media remain in `public/workshop/` because the portfolio still uses the photographs and camp poster.

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
```

Browser tests cover all seven routes, active navigation, biography, responsive layouts, theme persistence, original-color gallery, modal keyboard/focus behavior, the Coffee calculator, Work links, and the sample shop with a single-line title. Set `TEST_URL` to your preview/live origin, for example `http://localhost:3013/`.

## Cloudflare Pages

`npm run deploy` builds the static export in `out/` and publishes via Wrangler to Pages project `devonlabs-space`, hosted at devonlabs.space. No runtime server or secrets are required. GitHub Actions validates pushes but does not publish them. Existing DNS excludes the apex from Tensor's dynamic updates.

## Content

Edit `data/developer-projects.ts` for repository details, `data/portfolio-summaries.ts` for software descriptions, and `data/shop.ts` for the shirts-and-prints catalog. `npm run refresh:github` updates public metadata. Optional `GITHUB_TOKEN` is never shipped to browsers. `npm run refresh:media` refreshes twelve public photographs and provenance in `data/workshop-media.json`. Product pricing and manufacturing specifications are confirmed with customers by email before payment.

Responsive WebP assets are generated with Sharp by `npm run images` (also before dev/build), without upscaling, at widths up to 320, 640, 960 and 1600 px. `data/image-manifest.json` records actual dimensions and content-hashed URLs. Generated images receive immutable caching; originals remain revalidatable and are loaded in photo dialogs only when opened. Shared navigation disables prefetch while retaining client transitions.

Validation includes media/map integrity, all seven routes at 320/390/768/1440 px, keyboard dialogs and focus restoration, on-demand playback, WCAG A/AA axe checks in both themes, and cold-browser loading/theme checks. A matched local cold-context comparison at 390×844, DPR 1, scrolling the full page measured Photography images at 2,015,970 bytes before and 216,134 bytes after (89.3% reduction); Coffee measured 745,636 → 269,084 bytes. These are browser transfer observations, not field performance scores. No original dialog photos or unrelated About photo are requested before opening/navigation.

Software includes full-column original-color website captures linking to Quester (quest.devonlabs.space), Strider (boards.devonlabs.space), and Sharply (www.sharplyphoto.com). Coffee includes Hoffmann’s V60 ratios, Wisp’s 20 g / 250 ml adaptation, Kasuya’s 4:6 method, and Discord contact/community links. Shop photographs use original colors.

Coffee videos preserve their uploaded 2160×2880 (AV1/Opus) and 2160×3840 (H.264/AAC) files, with no video re-encoding. The 62 MB AV1 original streams from the public Home Coffee album because it exceeds Pages’ 25 MiB asset limit; the 18 MB H.264 original is served locally. Playback remains on demand and native fullscreen is available. The AV1 clip requires browser AV1/Opus support; an original-file link is provided alongside each player. The selected photo gallery includes three additional original-resolution JPEG-derived WebP photographs from the album.

Photography uses responsive CSS columns for a masonry gallery with uncropped natural proportions. `data/photography-bundles.json` records the newest three image-containing posts from photo.devonlabs.space, refreshed before builds from its public RSS feed, with local responsive previews and source links; originals live in `public/photography/bundles/`.

The Photography page leads with Event coverage galleries grouped by actual event album, with several photographs telling each event’s story and email enquiries to Wisp. Each event gallery displays all selected photographs immediately in responsive masonry columns, with no expansion control. Quick links jump between events. `data/event-coverage.json` records event titles, dates, collection links, source asset IDs, descriptions and local dimensions; local WebP previews live in `public/photography/events/` and use the responsive image pipeline. Immich access is used only during curation; visitors receive local images without credentials or authenticated album URLs.

After adding the masonry layout and nine bundle previews, the same cold 390×844 / DPR 1 full-scroll check measured Photography at 449,600 image bytes (77.7% below the original 2,015,970-byte baseline). Natural image proportions are checked at all four viewport widths.

The Shop sells by personal quote: choose a shirt or photo print, requested size and quantity, then prepare an email request to `wisp@devonlabs.space`. The customer must send the email; preparing or copying it does not submit an order. Wisp confirms production availability, the USD product price and shirt shipping, and sizing before arranging payment and the full delivery address. The site stores no customer form data and collects no payment. A direct-email fallback works without JavaScript. Run `tests/shop.mjs` with `TEST_URL` to check validation, Thai text, encoded email contents, both themes and copy fallback.

Shop pricing: the Devon Labs shirt is US$24.99, with shipping confirmed separately. Each photograph is US$14.99 for the digital file, delivered by email after payment; physical printing/framing is excluded. Digital orders require no print size or shipping address.


The Shop features the After Hours shirt (US$24.99 before shipping), two digital photo files (US$14.99 each), and two photography coverage packages priced in THB. The coffee shirt and artwork-credit section are not shown on the live page. Concept artwork and source-license records remain archived locally.

After Hours v4 removes the location caption from the garment. The back carries only AFTER HOURS above the faded night photograph; the editable artwork uses actual outlined Space Grotesk Bold glyphs.

## Photography coverage and photo-story refresh

`data/shop.ts` is the shared source of package prices and guarantees for Shop, Photography, and enquiry emails:

| Package | Price | Coverage | Minimum edited photos | Guaranteed delivery |
| --- | --- | --- | --- | --- |
| Short Coverage | THB 2,000 | 90 minutes | 75 | 1–3 calendar days after the shoot |
| Extended Coverage | THB 4,000 | 3 hours | 150 | 1–3 calendar days after the shoot |

Coverage includes photography only, with a minimum of 50 edited photos per hour guaranteed. Each Shop package has a native modal with keyboard dismissal, backdrop dismissal, and focus restoration. Request coverage selects that package in the email form and asks for date, location, name, reply email, and optional notes. Email preparation does not send a message or confirm a booking. Existing merchandise keeps its USD prices.

Run `npm run refresh:bundles` to refresh photo stories from `https://photo.devonlabs.space/rss/`. After a manual refresh, run `npm run images` or build before previewing the new images. Builds run the refresh before responsive-image generation. The refresh selects the newest three image-containing stories and up to three distinct preview images per story; it preserves source alt text where available. Preview downloads and metadata are validated before replacing the data snapshot. A failed refresh reports a warning and retains the previous valid snapshot; without a valid snapshot the build fails. The refreshed stories become live on the next deployment; there is no scheduled deployment.

`npm test` includes fixture tests for feed ordering, duplicate images, and failed-refresh preservation. `npm run test:browser` includes package modal, enquiry, currency, guarantee, accessibility, and responsive checks.
