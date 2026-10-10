# Devon Labs

An explorable first-person workshop for Wisp's software, photographs, films, and hardware. The full-screen Three.js world contains nine software stations, a photography gallery, an outdoor cinema, and a hardware-shop destination. Descriptions are based on public project READMEs; Sharply is explicitly credited as a fork.

Click the ground to walk, or click an object to approach and inspect it. Pathfinding.js provides A* routes around fixed exhibits and ramps; Rapier's character controller handles walking, gravity, jumping, collisions, and movable crates. Drag to look around, walk with WASD/up/down, turn with Q/E or left/right, run with Shift, jump with Space, interact with Enter, and return to the entrance with R. Mobile supports tap-to-walk, drag-to-look, a thumb joystick, jump, and run controls. The original little rover is parked in the world as an inspectable object.

The map and searchable project index provide direct access without walking. Project viewers contain real media and small browser-native previews of portrait framing, photo reviewing, and contact-sheet layout; these previews are not the complete desktop/server applications. Six found objects can be explicitly collected into a pocket inventory. Use the negative, lens, and transmitter to restore the lightbox, projector, and antenna; repairs change the world, but never gate portfolio content. The world also includes a checkpoint circuit with a personal-best timer, four achievements, day/night switching, and optional synthesized audio. Progress and repairs are validated and saved locally; existing exploration progress is preserved. There are no accounts, public scores, or visitor-message services.

Sound starts muted. Reduced motion disables decorative animation, exaggerated UI transitions, and automatic look smoothing. Simulation and audio pause while the tab is hidden; opening a dialog stops walking. WebGL startup failure or context loss exposes the same portfolio as HTML. All destinations also have direct links when JavaScript is disabled.

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

Next.js exports a fully static site to `out/`. No Node server, runtime GitHub API request, image transformation service, or secret is needed by the deployed website. Inter, screenshots, and twelve optimized public Immich photographs are served locally. The camp film streams from the public photography domain only when requested; the 688 MB original is intentionally not included in the Pages deployment.

`npm test` exercises actual walking physics, A* navigation, portfolio/media integrity, inventory matching, and progress validation. `npm run test:browser` covers scene pixels, walking, dialogs, previews, photos, map travel, audio/settings, persistence, desktop/mobile controls, reduced motion, and WebGL fallbacks. `npm run test:adventure` exercises visible 3D clicks, approach/inspection, explicit pickup, inventory selection, wrong-item rejection, three repairs, and persistence. Set `TEST_URL` for another preview or live deployment; optional `SCREENSHOT_DIR` writes screenshots outside the repository.

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
