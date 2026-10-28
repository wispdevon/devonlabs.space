# TTFB investigation — 2026-10-28

The current Cloudflare Pages deployment is already fast from the measured Bangkok location. Configuration changes and an optimized after measurement are **pending Cloudflare zone access**. The second run below is an unchanged control, not an optimization result.

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

## Findings and next experiment

- The application uses a static Next.js export; there is no request-time Next.js rendering to optimize.
- Hashed JavaScript and generated images already have a one-year immutable policy. Live generated images returned edge cache hits. Preserve those existing rules.
- Ten interleaved comparisons measured custom-host and `pages.dev` medians of 72.3 and 67.6 ms respectively, with overlapping timing ranges. There is no demonstrated large custom-zone penalty at this location.
- The existing Wrangler login can access the Pages project but zone settings, DNS and ruleset reads return 403. No zone settings or production deployments were changed during this investigation.
- A possible experiment is an exact-host, homepage-only edge cache rule for anonymous GET/HEAD requests, retaining browser revalidation. First back up the existing rules and confirm a supported TTL, deployment invalidation or purge path, and rollback. Measure a warm-cache treatment and repeat the untreated state to check attribution. Keep it only if the gain exceeds the observed noise and freshness checks pass.

[Cloudflare's Pages guidance](https://developers.cloudflare.com/pages/configuration/serving-pages/) recommends its built-in caching and warns that custom cache rules can preserve stale content after deployment or interfere with redirects and Functions. A custom HTML rule should not be installed without resolving invalidation. [Cloudflare-CDN-Cache-Control](https://developers.cloudflare.com/cache/concepts/cdn-cache-control/) separates CDN freshness from browser freshness; its ability to make Pages HTML eligible and its deployment invalidation behavior have not been verified here.

HTTP and `www` probes did not produce working redirects from this environment. Control hosts showed differing HTTP behavior too, so those probes do not establish a DNS or redirect defect; account inspection remains necessary before changing either.

## Repeat the benchmark

Requires Python 3 and curl with HTTP/2 support. Run from the repository root:

```sh
python3 scripts/benchmark-ttfb.py --label before --samples 30 --out output/ttfb
# Apply and verify one configuration change, then warm the same URLs.
python3 scripts/benchmark-ttfb.py --label after --samples 30 --out output/ttfb
```

The script records all attempts and calculates latency percentiles only for successful HTTP 200 responses. Redirects are not followed; their statuses remain in the raw results and are excluded from successful latency statistics. Always review failure counts, Cloudflare location, cache status, protocol and sample count alongside latency. `--base-url` supports a preview origin. Use different labels for independent runs; preserve the raw JSONL when comparing results. Site builds and deployment are not needed to run this external benchmark.
