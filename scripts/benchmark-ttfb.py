#!/usr/bin/env python3
"""Repeatable fresh-connection TTFB benchmark for Devon Labs.

Each sample is an independent curl process with one GET, so no TCP/TLS session
or HTTP connection is reused. Cumulative timings run from transfer start:
`connect_ready_ms` includes DNS, and `tls_ready_ms` includes DNS and TCP.
`tcp_phase_ms` and `tls_phase_ms` are derived from adjacent cumulative timings.
`response_wait_ms` is starttransfer - pretransfer readiness.

Run from the repository root to write results to output/ttfb by default.
"""
import argparse
import json
import math
import pathlib
import statistics
import subprocess
import tempfile
import time
from datetime import datetime, timezone

ROUTES = {
    "home": "/",
    "photography": "/photography/",
    "shop": "/shop/",
    "software": "/software/",
}
DEFAULT_BASE_URL = "https://devonlabs.space"
WRITEOUT = "\n".join([
    "http_code=%{http_code}", "http_version=%{http_version}",
    "remote_ip=%{remote_ip}", "time_namelookup=%{time_namelookup}",
    "time_connect=%{time_connect}", "time_appconnect=%{time_appconnect}",
    "time_pretransfer=%{time_pretransfer}",
    "time_starttransfer=%{time_starttransfer}", "time_total=%{time_total}",
    "size_download=%{size_download}",
])


def response_headers(path):
    found = {}
    try:
        raw = path.read_text(errors="replace").splitlines()
    except OSError:
        return found
    for line in raw:
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        found[key.strip().lower()] = value.strip()
    return found


def percentile(values, p):
    ordered = sorted(values)
    if not ordered:
        return None
    rank = (len(ordered) - 1) * p
    lo = math.floor(rank)
    hi = math.ceil(rank)
    return ordered[lo] + (ordered[hi] - ordered[lo]) * (rank - lo)


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--label", required=True, help="e.g. baseline, after")
    parser.add_argument("--samples", type=int, default=30,
                        help="samples per route; must be at least 1 (default: 30)")
    parser.add_argument("--pause", type=float, default=0.2,
                        help="seconds between requests; must be nonnegative (default: 0.2)")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL,
                        help=f"origin to test (default: {DEFAULT_BASE_URL})")
    parser.add_argument("--out", type=pathlib.Path, default=pathlib.Path("output/ttfb"),
                        help="directory for raw samples and summary (default: output/ttfb)")
    args = parser.parse_args()
    if args.samples < 1:
        parser.error("--samples must be at least 1")
    if args.pause < 0:
        parser.error("--pause must be nonnegative")
    if not args.base_url.startswith(("http://", "https://")):
        parser.error("--base-url must start with http:// or https://")
    return args


def run_sample(label, sample, route, url, out_dir):
    with tempfile.NamedTemporaryFile(dir=out_dir, prefix="headers-", delete=False) as header_file:
        header_path = pathlib.Path(header_file.name)
    cmd = ["curl", "--silent", "--show-error", "--max-time", "25",
           "--output", "/dev/null", "--dump-header", str(header_path),
           "--write-out", WRITEOUT, "--", url]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=27)
        fields = {}
        for line in proc.stdout.splitlines():
            if "=" in line:
                key, value = line.split("=", 1)
                fields[key] = value
        raw_seconds = {}
        for source in ("time_namelookup", "time_connect", "time_appconnect",
                       "time_pretransfer", "time_starttransfer", "time_total"):
            raw_seconds[source] = float(fields.get(source, 0) or 0)
        dns = raw_seconds["time_namelookup"]
        connect = raw_seconds["time_connect"]
        tls = raw_seconds["time_appconnect"]
        pretransfer = raw_seconds["time_pretransfer"]
        starttransfer = raw_seconds["time_starttransfer"]
        hs = response_headers(header_path)
        http_code = int(fields.get("http_code", "0") or 0)
        row = {
            "label": label, "sample": sample, "route": route, "url": url,
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "curl_exit_code": proc.returncode, "curl_stderr": proc.stderr.strip(),
            "http_code": http_code, "http_version": fields.get("http_version"),
            "remote_ip": fields.get("remote_ip"),
            "dns_ms": round(dns * 1000, 3),
            "connect_ready_ms": round(connect * 1000, 3),
            "tls_ready_ms": round(tls * 1000, 3),
            "tcp_phase_ms": round(max(0, connect - dns) * 1000, 3),
            "tls_phase_ms": round(max(0, tls - connect) * 1000, 3),
            "pretransfer_ready_ms": round(pretransfer * 1000, 3),
            "curl_ttfb_ms": round(starttransfer * 1000, 3),
            "response_wait_ms": round(max(0, starttransfer - pretransfer) * 1000, 3),
            "total_ms": round(raw_seconds["time_total"] * 1000, 3),
            "size_bytes": float(fields.get("size_download", 0) or 0),
            "cf_ray": hs.get("cf-ray"),
            "cf_colo": (hs.get("cf-ray", "").split("-")[-1] or None),
            "cf_cache_status": hs.get("cf-cache-status"),
            "age": hs.get("age"), "cache_control": hs.get("cache-control"),
            "server": hs.get("server"), "content_type": hs.get("content-type"),
        }
    except subprocess.TimeoutExpired as exc:
        row = {"label": label, "sample": sample, "route": route, "url": url,
               "timestamp_utc": datetime.now(timezone.utc).isoformat(),
               "curl_exit_code": 124, "curl_stderr": str(exc), "http_code": 0}
    finally:
        header_path.unlink(missing_ok=True)
    row["valid_latency_sample"] = row.get("curl_exit_code") == 0 and row.get("http_code") == 200
    return row


def summarize(label, stamp, samples, base_url, jsonl, rows):
    metrics = ["dns_ms", "connect_ready_ms", "tls_ready_ms", "tcp_phase_ms",
               "tls_phase_ms", "pretransfer_ready_ms", "curl_ttfb_ms",
               "response_wait_ms", "total_ms"]
    summary = {
        "label": label, "started_at_utc": stamp,
        "base_url": base_url, "samples_per_route_requested": samples,
        "method": "GET, independent curl process per sample (fresh TCP/TLS connection), round-robin routes",
        "timing_definitions": {
            "dns_ms": "time_namelookup, cumulative from transfer start",
            "connect_ready_ms": "time_connect, cumulative from transfer start (includes DNS)",
            "tls_ready_ms": "time_appconnect, cumulative from transfer start (includes DNS and TCP)",
            "tcp_phase_ms": "time_connect - time_namelookup",
            "tls_phase_ms": "time_appconnect - time_connect",
            "pretransfer_ready_ms": "time_pretransfer, cumulative to request-ready point",
            "curl_ttfb_ms": "time_starttransfer, cumulative from transfer start",
            "response_wait_ms": "time_starttransfer - time_pretransfer",
        },
        "latency_percentiles_use_only": "curl exit code 0 and HTTP 200 responses",
        "jsonl": str(jsonl), "routes": {},
    }
    for name in ROUTES:
        selected = [r for r in rows if r.get("route") == name]
        successful = [r for r in selected if r.get("valid_latency_sample")]
        route_summary = {
            "count": len(selected), "successful_latency_samples": len(successful),
            "invalid_latency_samples": len(selected) - len(successful),
            "transport_failures": sum(r.get("curl_exit_code") != 0 for r in selected),
            "non_200_responses": sum(r.get("curl_exit_code") == 0 and r.get("http_code") != 200 for r in selected),
            "statuses": {}, "cf_cache_statuses": {}, "http_versions": {}, "colo_codes": {},
        }
        for field, outkey in (("http_code", "statuses"), ("cf_cache_status", "cf_cache_statuses"),
                              ("http_version", "http_versions"), ("cf_colo", "colo_codes")):
            for row in selected:
                key = str(row.get(field, "none"))
                route_summary[outkey][key] = route_summary[outkey].get(key, 0) + 1
        for metric in metrics:
            values = [r[metric] for r in successful if metric in r]
            if values:
                route_summary[metric] = {"p50": round(statistics.median(values), 3),
                                         "p95": round(percentile(values, .95), 3),
                                         "min": round(min(values), 3), "max": round(max(values), 3)}
        route_summary["ages"] = sorted({r.get("age") for r in selected if r.get("age") is not None})
        route_summary["cache_control"] = sorted({r.get("cache_control") for r in selected if r.get("cache_control")})
        summary["routes"][name] = route_summary
    return summary


def main():
    args = parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    jsonl = args.out / f"{args.label}-{stamp}.jsonl"
    base_url = args.base_url.rstrip("/")
    rows = []
    routes = list(ROUTES.items())
    # Round-robin routes to reduce time-of-day and warm-up bias between routes.
    for i in range(args.samples):
        for name, path in routes:
            row = run_sample(args.label, i + 1, name, base_url + path, args.out)
            rows.append(row)
            with jsonl.open("a") as f:
                f.write(json.dumps(row, sort_keys=True) + "\n")
            time.sleep(args.pause)
    summary = summarize(args.label, stamp, args.samples, base_url, jsonl, rows)
    summary_path = args.out / f"{args.label}-{stamp}-summary.json"
    summary_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n")
    print(json.dumps(summary, indent=2, sort_keys=True))

if __name__ == "__main__":
    main()
