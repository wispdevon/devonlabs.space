# Devon Labs

Developer portfolio for Wisp, styled after TooExpensive.dev: Monaspace Neon, a black canvas, subtle borders, and a searchable project directory. Descriptions are based on public project READMEs; Sharply is explicitly credited as a fork.

## Development

Use Node 22 or newer.

```sh
npm ci
npm run dev -- --port 3011
npm run lint
npm run build
```

Next.js exports a fully static site to `out/`. No Node server, runtime GitHub API request, image transformation service, or secret is needed by the deployed website. Fonts and project screenshots are served locally.

## Cloudflare Pages

```sh
npm run preview
npm run deploy
```

For Pages Git integration, select Next.js static export, use `npm run build`, output directory `out`, and Node 22. The Wrangler project is `devonlabs-space`. Configure `devonlabs.space` as its custom domain. Photography links to `photo.devonlabs.space`.

## Content

Edit `data/developer-projects.ts` for selected projects and descriptions. Run `npm run refresh:github` to update the checked-in public GitHub metadata snapshot, then commit and rebuild. An optional `GITHUB_TOKEN` raises the refresh rate limit and is never included in browser assets. Builds use the checked-in snapshot.

The earlier photo portfolio is backed up locally at `../devonlabs.space-before-developer-portfolio/`.
