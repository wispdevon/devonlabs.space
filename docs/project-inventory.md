# Project inventory

This is the central inventory for projects across experiments, active development, maintenance, paused work, and archives. The public portfolio remains curated separately in `data/developer-projects.ts` and `data/portfolio-summaries.ts`.

Coverage is incremental: the entries below were individually reconciled through 2026-10-28. This is not yet an exhaustive audit of every project. Add or reconcile entries as projects are worked on; verify actual repository identity and state before updating them. Keep confidential details outside this repository.

## Upstreamer

- Purpose: a browser-local open source contribution field guide, learning tools, and companion agent skill.
- Repository: [wispdevon/upstreamer](https://github.com/wispdevon/upstreamer).
- Website: [upstreamer.dev](https://upstreamer.dev), as configured in the project; the current local work has not been deployed.
- Status: active development.
- Last meaningful update: 2026-10-28 — added a learning journal with independent storage, recovery, Markdown export, and an agent learning-note workflow on `feature/learning-journal`.
- Verification: 11 unit/package tests and 30 Chromium browser tests passed, alongside typecheck, lint, skill validation, and production build. Desktop/mobile production preview and both themes were checked; other browser engines remain untested. Final evidence lives in the repository's `docs/learning/2026-10-28-learning-journal.md`.
- Next steps: review the completed journal work and evaluate practice prompts after using it on a real task. Deployment is separate.

## MIFARE Pay

- Purpose: prepaid card operations and administrative tools for a supervised pilot.
- Repository: [wispdevon/mifare-pay](https://github.com/wispdevon/mifare-pay) (**private repository**).
- Website: [mf.devonlabs.space](https://mf.devonlabs.space).
- Status: actively maintained; release `v30.1` is live.
- Last meaningful update: 2026-10-27 — shipped streamlined administration settings and guarded linked-import undo in release `v30.1`.
- Verification: 60 frontend tests, 38 backend unit tests, and 45 integration checks passed before release. The public service and static asset checksums were verified after deployment.
- Next steps: maintain the current supervised release and triage future operator feedback.

## Devon Labs

- Purpose: portfolio for software, photography, film, coffee, and shop offerings; central project tracking.
- Repository: [wispdevon/devonlabs.space](https://github.com/wispdevon/devonlabs.space).
- Website: [devonlabs.space](https://devonlabs.space), as configured in the project.
- Status: maintained; Desloppify cleanup is live in production.
- Last meaningful update: 2026-10-29 — merged the tested photo-viewer and coffee-label cleanup to `main`, updated Next.js to 16.4.3 after dependency audit, and deployed as Cloudflare Pages deployment [a972fa45](https://a972fa45.devonlabs-space.pages.dev) from commit `26ac895`. GitHub CI, local lint/tests/typecheck/build, browser suite, zero-vulnerability npm audit, seven production routes and their deployed script references passed. The second Desloppify scan found no new changes; the full subjective assessment remains pending. [Scan details](desloppify-2026-10-29.md).
- Previous production update: 2026-10-28 — deployed faster navigation and lighter media clients as Cloudflare deployment `490804e7` from `cc860ee`. Short-lived HTML caching reduced homepage median TTFB from 72.0 to 56.4 ms at BKK; controlled Coffee load time improved from 3.12 to 2.10 seconds and hover-prepared Film navigation from 539 to 115 ms. Production route health, distributed JavaScript checksums and live navigation were verified. [Measurements, limitations and cache policy](ttfb.md).
- Next steps: complete the full subjective code-health review, investigate the remaining source findings and test-detection limitations, monitor performance across real devices, preserve the documented 60-second HTML freshness policy on future deployments, and expand inventory coverage as projects are reviewed. The existing GitHub-oriented portfolio integration has not been migrated.
