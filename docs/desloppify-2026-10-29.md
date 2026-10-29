# Desloppify comparison version

Date: 2026-10-29. Base: `5b8341f`. Tested source: `a405575` (including `4f4370e`). Branch: `desloppify/portfolio-preview`.
The cleanup was merged to `main` and deployed on 2026-10-29 as commit `26ac895` at [Cloudflare deployment a972fa45](https://a972fa45.devonlabs-space.pages.dev). A second scan after the merge and dependency update found no new or changed Desloppify issues; objective score remains 66.9 and strict score 16.7. This is still a scoped cleanup, not a completed full-codebase assessment.

## Changes

- Coffee origin labels now share one decision function, including the checklist's distinct “To explore” fallback.
- Photography and Coffee use one photo viewer. Each thumbnail travels with its original-photo metadata; the client no longer imports a separate catalog and joins it to thumbnails by array position.
- Responsive-image rendering remains on the server. Coffee video markup now stays in its server component, retaining native controls, sources, posters, and deferred original loading.
- Explicit opener-focus restoration is preserved. A review identified that a pointer activation need not focus the opening button. A regression test passed on the original version, failed when that restoration was removed, and passed after restoration.
- The viewer browser test is part of `npm run test:browser`; local Desloppify state is ignored by Git.

## Scan evidence

Desloppify 1.0, TypeScript scanner:

| Measure | Initial | Final |
| --- | ---: | ---: |
| Objective score | 66.7 | 66.9 |
| Strict score | 16.7 | 16.7 |
| Duplication dimension | 92.6% | 100.0% |
| Repeated viewer boilerplate clusters | 2 | 0 |
| Coffee map complexity finding | 1 | 0 |

Two additional findings from a focused blind review were imported and resolved: repeated origin-label decisions and the viewers' parallel-array contract. The review covered abstraction fitness, mid-level elegance, and low-level elegance. The tool rejected scored import because the review did not cover all dimensions; only findings were imported. No subjective scores were claimed or overridden. All 20 scored subjective dimensions remain unassessed in tool state.

The scan's test-coverage heuristic reports gaps despite the passing repository tests; it is not measured execution coverage. Its `next lint` detector reports reduced coverage; the project's actual `npm run lint` command passes. The three static-HTML security flags were inspected: the theme initializer is fixed code, Work uses a fixed public email link, and shop contact HTML escapes interpolated values to preserve Cloudflare's email-rewrite exemption. This pass does not certify security or resolve the remaining backlog. The dependency audit separately found an advisory affecting the pinned Next.js version; Next.js was updated to 16.4.3 and `npm audit` reports zero vulnerabilities.

Pin the language and omit generated code when reproducing a source scan. Once build and preview outputs existed, automatic language selection switched to JavaScript and scanned compiled assets; that intermediate run is not a before/after comparison. The final scan excludes dependency, build, preview, and screenshot outputs. The `.wrangler` exclusion may receive an unused-exclusion notice when no preview-generated sources exist.

```sh
uvx --from 'desloppify[full]' desloppify --lang typescript \
  --exclude node_modules --exclude .next --exclude out \
  --exclude .wrangler --exclude output --exclude next-env.d.ts \
  scan --path . --no-badge
uvx --from 'desloppify[full]' desloppify --lang typescript next
```

Workflow reference: [official Desloppify guide](https://github.com/peteromallet/desloppify/blob/main/docs/SKILL.md).

## Verification

- On Node 22, `npm run lint`, `npm test` (seven unit tests plus content/image/map integrity), `npx tsc --noEmit`, `npm audit`, and the Next.js 16.4.3 production build passed.
- The complete `npm run test:browser` suite passed on the merged build: seven routes, 320/390/768/1440px layouts, both-theme accessibility, contact links, lazy loading, navigation intent, masonry, photo viewers, video playback, and no-JavaScript fallbacks. GitHub Actions passed the same checks on `main` before deployment.
- The new viewer checks cover every thumbnail/original pair, repeated opening, both wrap directions, keyboard and button navigation, Escape/Close focus return, pointer activation without focus, client route navigation, and server-rendered Coffee videos without JavaScript.
- Coffee and Photography viewport screenshots were byte-identical after decoding at 390px and 1440px. Coffee SVG labels, checklist content, and selected-country status labels also matched the original. This is bounded visual parity evidence, not a claim about every scroll position or browser engine.
- Chromium was tested through the repository's Playwright setup because this session exposed no in-app browser controller. Firefox, Safari, and physical touch devices were not tested.

The deployed site serves all seven checked routes with JavaScript assets matching the new Pages deployment; Cloudflare may inject its email-decoding script on the custom domain. Future work is a full blind review and investigation of remaining source findings and test-detection limitations.
