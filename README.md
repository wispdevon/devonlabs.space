# Devon Labs

A colorful multi-page portfolio for Wisp’s software, photography, films, and hardware, inspired by https://rsms.me/, https://aresluna.org/, and the Strider design system. The homepage is About, with biography sourced from [Wisp’s GitHub profile README](https://github.com/wispdevon/wispdevon); the retrieved snapshot and curated content live in `data/profile-readme.md` and `data/profile.ts`. Software, Film, Photography and Shop each have their own static page.

Warm paper and plum text pair with page-specific violet/lime, cobalt/peach, teal/coral, burgundy/apricot, and forest/lime duotones. SVG filters color the existing assets without altering the originals. Photography offers Original mode and a native large-image dialog; the film plays on demand in original color. Fonts and preview images are local. Theme preference persists and follows the OS before a manual override. Edit software summaries in `data/portfolio-summaries.ts`; repository details remain in `data/developer-projects.ts`.

The Devon Labs shop is an on-site preview catalog with two sample mugs and two framed wall prints. Every product is labeled Placeholder; pricing and checkout are not available. Mug illustrations are native SVG; print mockups reuse existing portfolio photos. The illustrated workshop page and navigation are removed. Cloudflare redirects its old URL to `/shop/`. Existing media remain in `public/workshop/` because the portfolio still uses the photographs and camp poster.

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

Browser tests cover all five routes, active navigation, biography, responsive layouts, theme persistence, duotone/original gallery, modal keyboard/focus behavior, and the placeholder shop with a single-line title. Set `TEST_URL` to your preview/live origin, for example `http://localhost:3013/`.

## Cloudflare Pages

`npm run deploy` builds the static export in `out/` and publishes via Wrangler to Pages project `devonlabs-space`, hosted at devonlabs.space. No runtime server or secrets are required. GitHub Actions validates pushes but does not publish them. Existing DNS excludes the apex from Tensor's dynamic updates.

## Content

Edit `data/developer-projects.ts` for repository details, `data/portfolio-summaries.ts` for software descriptions, and `app/shop/page.tsx` for the preview catalog. `npm run refresh:github` updates public metadata. Optional `GITHUB_TOKEN` is never shipped to browsers. `npm run refresh:media` refreshes twelve public photographs and provenance in `data/workshop-media.json`. Replace placeholder products with real descriptions, pricing and checkout when the shop is ready.
