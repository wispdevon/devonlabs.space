# TTFB investigation — 2026-10-28

Cloudflare now caches the seven canonical public HTML pages for 60 seconds while preserving browser revalidation. The account change was measured separately from the frontend improvements below. All edge measurements are from Bangkok; they are not global field measurements.

## Measurements

Each run used 30 GET requests per route, interleaved across four routes. Every request ran in a separate curl process with a fresh TCP/TLS connection; the URLs were stable, with no cache-busting queries. All 240 requests returned HTTP/2 200 through Cloudflare's BKK location. Both runs reported `cf-cache-status: DYNAMIC` and `Cache-Control: public, max-age=0, must-revalidate` for HTML.

| Route | Baseline median / p95 | Unchanged control median / p95 |
| --- | --- | --- |
| `/` | 73.7 / 97.4 ms | 74.5 / 80.3 ms |
| `/photography/` | 76.3 / 97.3 ms | 75.8 / 84.9 ms |
| `/shop/` | 75.8 / 83.4 ms | 72.3 / 93.3 ms |
| `/software/` | 71.3 / 96.5 ms | 72.6 / 85.9 ms |

Baseline began at 14:02:01 UTC; the control began at 14:04:43 UTC. These are curl `time_starttransfer` measurements, including DNS, connection establishment and TLS. Homepage response wait (`time_starttransfer - time_pretransfer`) was 36.7 ms median in the baseline and 37.9 ms in the control. This is a network-inclusive wait, not a measurement of Cloudflare CPU time.

Raw samples and summaries are in [benchmarks/ttfb-2026-10-28](benchmarks/ttfb-2026-10-28/). The original baseline summary uses cumulative `connect_ms`, `tls_ms`, and `pretransfer_ms` names. The reusable script and control use explicit `*_ready_ms` names and separate TCP/TLS phase durations.

A separate 20-pair interleaved protocol comparison measured medians of 74.8 ms over HTTP/2 and 59.1 ms over HTTP/3, with linearly interpolated p95 values of 89.4 and 90.3 ms. HTTP/3 was already enabled; this is a comparison of existing protocols, not a configuration improvement. The fresh-connection benchmark does not exercise connection resumption or 0-RTT.

These are single-location synthetic measurements, without browser rendering, browser cache or field data. DNS may already be cached locally. Small median differences and changing p95 values in the unchanged control demonstrate measurement noise; they do not establish a performance gain. `DYNAMIC` describes the exposed custom-domain cache layer and does not prove Pages' internal asset storage is uncached.

## Cloudflare configuration and measured result

Two narrowly scoped rules were configured through the signed-in dashboard. Before this change, the zone had no Cache Rules or Cache Response Rules. The exact policy is recorded in [cloudflare-cache-rules.json](cloudflare-cache-rules.json):

- Eligible URLs are the exact HTTPS canonical URLs for About, Work, Software, Film, Photography, Coffee and Shop. Queries, cookies, Authorization, Range and RSC headers do not match. Other subdomains and assets are outside the rules.
- The request rule respects cache headers, bypasses responses without cache headers, and prevents storage of response codes 201 and above. Browser TTL respects the origin.
- The response rule adds `s-maxage=60` only within Cloudflare for HTTP 200 HTML without `Set-Cookie`. Visitors continue to receive `public, max-age=0, must-revalidate`.

Thirty fresh-connection requests per route were measured immediately before enabling cache eligibility, then after enabling it across the site. The source deployment was unchanged during this experiment.

| Route | Before median / p95 | After median / p95 | After cache status |
| --- | --- | --- | --- |
| `/` | 72.0 / 99.6 ms | 56.4 / 79.4 ms | 30 HIT |
| `/photography/` | 77.4 / 91.2 ms | 56.8 / 91.3 ms | 29 HIT, 1 MISS |
| `/shop/` | 73.9 / 89.8 ms | 56.2 / 80.9 ms | 29 HIT, 1 MISS |
| `/software/` | 77.3 / 91.7 ms | 54.9 / 71.8 ms | 29 HIT, 1 MISS |

All before requests were DYNAMIC. The after run includes initial misses; it is not an assertion that a first visit to every edge will hit cache. Tail latency on Photography did not improve materially. A preceding homepage-only experiment measured 72.0 → 55.3 ms median and 99.6 → 68.5 ms p95, with 30 HIT responses; other routes remained controls.

Expiry was observed directly: a HIT at Age 58 was followed five seconds later by EXPIRED, then HIT with Age 5. Cookie, Authorization, Range, RSC and query probes all bypassed the rule. HTML remained unchanged after normalizing Cloudflare's per-request email encoding. Raw measurements and probes are in the benchmark directory.

After future deployments, these HTML responses can remain cached for up to 60 seconds. For immediate publication, purge the seven exact URLs through Cloudflare's custom purge UI, or wait for expiry and verify the new document and referenced assets. Keep immutable asset names content hashed. To roll back this configuration, disable the request eligibility rule first, disable the response rule, then purge those seven URLs. No existing rules need restoring because both rule lists were empty before this experiment.

## Frontend improvements

- Responsive image metadata is resolved at build time for Film, Photography and Coffee. Client viewers receive server-rendered thumbnails/posters rather than importing the entire image catalog. The media routes shed about 106 KB of decoded JavaScript (about 19 KB gzipped), with small increases to their HTML payloads.
- Main content no longer waits through a 650 ms entry fade. Hover and dialog animations remain.
- Navigation warms only the link being hovered or keyboard focused. There is no initial route prefetch, and Save-Data or 2G connections opt out.
- Offscreen Coffee videos use native `loading="lazy"` with `preload="none"` and explicit dimensions. Chromium 151 deferred two posters totaling 198,928 body bytes until scrolling near the journal. Browsers without native media lazy loading preserve normal controls and `preload="none"`; they may still fetch posters eagerly.

The production build and lint passed. Unit/integrity checks, the complete existing browser suite, and new navigation tests passed. The poster regression test failed on the previous export and passed after the change; it also verifies both posters load after scrolling. After the final media change, loading, seven-route interaction/accessibility checks and lint passed again. Browser coverage includes four widths, both themes, dialogs and focus, film playback, coffee controls, masonry resizing and no-JavaScript content. Connected Brave also rendered the production preview without console errors, and the theme toggle responded correctly.

### Controlled full-page load comparison

The baseline is the application at `818fd87`; the final application is `4f4e6f4`. Both exports were served through Wrangler Pages Dev 4.149.0, with matching Brotli compression and headers. Chromium 151.0.7922.34 used a fresh context and disabled cache for each sample, a 390 × 844 viewport at DPR 1, 4× CPU slowdown, 150 ms added network latency, 1.6 Mbps download and 0.75 Mbps upload. Three paired samples per route alternated control/treatment order. Each observed `load` plus a fixed five-second window; no concurrent builds or browser tests ran.

| Route | Median load event, before → after | Initial transfer, before → after |
| --- | --- | --- |
| About | 2,183 → 2,181 ms | 349,934 → 350,028 B |
| Film | 2,172 → 2,070 ms | 345,860 → 325,917 B |
| Photography | 2,244 → 2,200 ms | 481,999 → 463,238 B |
| Coffee | 3,119 → 2,097 ms | 581,009 → 361,618 B |
| Software | 2,112 → 2,120 ms | 327,751 → 327,847 B |

Coffee's median load event improved by 32.7%, with 219,391 fewer initial transfer bytes. Two offscreen video posters accounted for 199,528 transfer bytes before and zero after. Film and Photography transfer reductions are repeatable, but their small timing improvements should not be generalized from three samples. About and Software load times were effectively unchanged. Median LCP was 1,912 → 1,912 ms on About, 856 → 856 ms on Film, 1,020 → 680 ms on Photography, 828 → 656 ms on Coffee and 764 → 672 ms on Software. Cumulative layout shift stayed at 0, except About at 0.01 in both arms; no post-load long tasks were observed.

A separate desktop navigation study used three alternating pairs with the same throttle and about 757 ms hovering over Film before clicking. Median click-to-heading was 538.8 → 115.0 ms (78.6% lower). The baseline fetched its route after the click; the final build fetched two successful Flight payloads during hover and needed no Flight request after the click. This result measures a prepared mouse navigation, not a touch-only visit or an unprepared click.

All 30 initial navigations returned HTTP 200 and viewport screenshot readiness passed. Readiness only waited for images intersecting both viewport axes. Initial transfer includes network headers and resources captured in the observation window; it excludes deferred offscreen images and original videos. It is not a promise that an entire photography collection downloads in that time. Field INP, other browser engines, different devices and global network conditions remain unmeasured. Coffee's map geometry remains duplicated in its HTML and client bundle and is a possible future profiling target.

Raw results and static payload inventories are in [benchmarks/page-load-2026-10-28](benchmarks/page-load-2026-10-28/). Runtime resource measurements exclude unused scripts; the disk inventory also counts linked `nomodule` scripts. Screenshots and discarded runs are retained outside the repository. The reusable harness is `scripts/benchmark-page-load.mjs`:

```sh
# Serve each frozen export with the same Wrangler version and configuration.
node scripts/benchmark-page-load.mjs --before-url http://127.0.0.1:3012 --after-url http://127.0.0.1:3011 --label comparison --samples 3
```

An earlier local benchmark used a Python server for the old build and Wrangler for the new build. Its timing/transfer comparisons are invalid because compression differed; those results are excluded. A separate early run also overlapped browser tests. The corrected comparison must use matching servers and no concurrent browser tests/builds.

## Findings

- The application uses a static Next.js export; there is no request-time Next.js rendering to optimize.
- Hashed JavaScript and generated images already have a one-year immutable policy. Live generated images returned edge cache hits. Preserve those existing rules.
- Ten interleaved comparisons measured custom-host and `pages.dev` medians of 72.3 and 67.6 ms respectively, with overlapping timing ranges. There is no demonstrated large custom-zone penalty at this location.
- The Wrangler login can access the Pages project but zone settings, DNS and ruleset reads return 403. The authorized signed-in browser was used to configure the cache rules.

[Cloudflare's Pages guidance](https://developers.cloudflare.com/pages/configuration/serving-pages/) warns that custom caching can preserve stale content after deployment or interfere with redirects and Functions. The short freshness window and canonical URL allowlist limit those effects here. [Cache Response Rules](https://developers.cloudflare.com/cache/how-to/cache-response-rules/) support Cloudflare-only directives; their precedence over request settings makes the verified 60-second TTL possible without changing browser freshness.

HTTP and `www` probes did not produce working redirects from this environment. Control hosts showed differing HTTP behavior too, so those probes do not establish a DNS or redirect defect; account inspection remains necessary before changing either.

## Repeat the benchmark

Requires Python 3 and curl with HTTP/2 support. Run from the repository root:

```sh
python3 scripts/benchmark-ttfb.py --label before --samples 30 --out output/ttfb
# Apply and verify one configuration change, then warm the same URLs.
python3 scripts/benchmark-ttfb.py --label after --samples 30 --out output/ttfb
```

The script records all attempts and calculates latency percentiles only for successful HTTP 200 responses. Redirects are not followed; their statuses remain in the raw results and are excluded from successful latency statistics. Always review failure counts, Cloudflare location, cache status, protocol and sample count alongside latency. `--base-url` supports a preview origin. Use different labels for independent runs; preserve the raw JSONL when comparing results. Site builds and deployment are not needed to run this external benchmark.
