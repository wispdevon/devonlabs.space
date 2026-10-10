# Devon Labs

An explorable planetary workshop for Wisp's software, photographs, films, and hardware. The full-screen Three.js world contains nine software stations, a photography gallery, an outdoor cinema, and a hardware-shop destination. Descriptions are based on public project READMEs; Sharply is explicitly credited as a fork.

The rover uses Rapier's raycast-vehicle controller for suspension, steering, physical collisions, ramps, and jumps. The chassis stays upright for arcade-friendly handling. Drive with WASD/arrows, boost with Shift, jump with Space, interact with Enter, and respawn with R. Drag the scene to move the camera and scroll to zoom. Mobile has a thumb joystick, jump, and boost controls.

The map and searchable project index provide direct access without driving. Project viewers contain real media and small browser-native previews of portrait framing, photo reviewing, and contact-sheet layout; these previews are not the complete desktop/server applications. The world includes six discoveries, a checkpoint circuit with a personal-best timer, four achievements, day/night switching, and optional synthesized audio. Progress is validated and saved locally; there are no accounts, public scores, or visitor-message services.

Sound starts muted. Reduced motion disables decorative animation, exaggerated UI transitions, and camera smoothing. Simulation and audio pause while the tab is hidden; opening a dialog parks the rover. WebGL startup failure or context loss exposes the same portfolio as HTML. All destinations also have direct links when JavaScript is disabled.

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

Next.js exports a fully static site to `out/`. No Node server, runtime GitHub API request, image transformation service, or secret is needed by the deployed website. Inter, screenshots, and twelve optimized public Immich photographs are served locally. The camp film streams from the public photography domain only when requested; the 688 MB original is intentionally not included in the Pages deployment.

`npm test` exercises the actual rover physics, portfolio/media integrity, and progress validation. `npm run test:browser` covers scene pixels, driving, dialogs, previews, photos, map travel, audio/settings, persistence, desktop/mobile controls, reduced motion, and WebGL fallbacks. Set `TEST_URL` for another preview or live deployment; optional `SCREENSHOT_DIR` writes screenshots outside the repository.

## Cloudflare Pages

```sh
npm run preview
npm run deploy
```

The deployed project uses Pages Direct Upload through Wrangler. Run `npm run deploy` to publish updates after committing them. GitHub Actions validates lint, the static export, and browser interactions on every push; it does not automatically publish. For a separate Git-integrated Pages project, select Next.js static export, use `npm run build`, output directory `out`, and Node 22.

The Wrangler project is `devonlabs-space`, with `devonlabs.space` as its custom domain. The apex DNS record is a proxied CNAME to `devonlabs-space.pages.dev` and is excluded from Tensor's dynamic DNS updates. Photography and Ghost remain at `photo.devonlabs.space`.

## Content

Edit `data/developer-projects.ts` for software descriptions and `data/workshop.ts` for destinations, locations, the circuit, and discoveries. Run `npm run refresh:github` to update the checked-in public GitHub metadata snapshot. An optional `GITHUB_TOKEN` raises the refresh rate limit and is never included in browser assets. Builds use the checked-in snapshot.

`npm run refresh:media` refreshes twelve photographs from `https://im.devonlabs.space/s/thebest` into local WebP assets and `data/workshop-media.json`. It reads only the public share, requires no account token, and never saves private metadata. Rebuild and commit the updated files. The current snapshot is twelve verified images from the album's October 2025 bucket.

The cinema currently contains the verified One Camp film from the local Ghost database. The shop could not be verified during this redesign, so its station links to `https://shop.1337sheets.com/` without stale prices, invented product images, or unverified claims. Add product destinations only after verifying the public catalogue.

The earlier photo portfolio is backed up locally at `../devonlabs.space-before-developer-portfolio/`.
