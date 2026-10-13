# Devon Labs

A static portfolio for software, photography, film, coffee, and the Devon Labs Shop. Built with Next.js and exported for Cloudflare Pages.

## Development

Use Node.js 22 (`.nvmrc`) and npm:

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
npm run start -- --port 3011
```

With the preview running, run `npm run test:browser` in another terminal. Set `TEST_URL` to test a different origin.

`npm run build` refreshes the public photography stories and generates responsive images. `npm run preview` builds the site and serves the export locally. To publish to the configured Cloudflare Pages project, run `npm run deploy`. GitHub Actions validates changes but does not deploy them.

## Content

- `data/profile.ts`, `data/developer-projects.ts`, `data/portfolio-summaries.ts`: About and portfolio content.
- `data/event-coverage.json`, `data/photography-bundles.json`: event galleries and recent photo stories.
- `data/coffee.ts`, `data/shop.ts`: coffee guide and shop offerings.
- `public/`: local fonts, photographs, video, and other site assets.

Run `npm run refresh:github` or `npm run refresh:media` to update the corresponding snapshots. An optional `GITHUB_TOKEN` can raise the GitHub API rate limit; it is not included in the exported site.

Country outlines are derived from Natural Earth through [world-atlas](https://github.com/topojson/world-atlas); see `data/world-countries.LICENSE`.
