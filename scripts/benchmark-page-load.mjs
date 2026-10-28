#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { chromium } = require('playwright');

const ROUTES = {
  home: '/',
  film: '/film/',
  photography: '/photography/',
  coffee: '/coffee/',
  software: '/software/',
};

function argsFrom(argv) {
  const args = {
    baseUrl: 'http://127.0.0.1:3011',
    beforeUrl: null,
    afterUrl: null,
    label: 'before',
    samples: 5,
    navigationSamples: 3,
    settleMs: 5000,
    imageTimeoutMs: 15000,
    output: 'output/page-load',
    cpuRate: 4,
    downloadMbps: 1.6,
    uploadMbps: 0.75,
    latencyMs: 150,
  };
  const names = {
    '--base-url': 'baseUrl', '--before-url': 'beforeUrl', '--after-url': 'afterUrl',
    '--label': 'label', '--samples': 'samples', '--navigation-samples': 'navigationSamples',
    '--settle-ms': 'settleMs', '--image-timeout-ms': 'imageTimeoutMs',
    '--output': 'output', '--cpu-rate': 'cpuRate', '--download-mbps': 'downloadMbps',
    '--upload-mbps': 'uploadMbps', '--latency-ms': 'latencyMs',
  };
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--help' || key === '-h') {
      console.log(`Usage: node ${path.basename(argv[1])} [options]\n\n` +
        `  --base-url URL            Origin (default ${args.baseUrl})\n` +
        `  --before-url URL          First origin for interleaved paired runs\n` +
        `  --after-url URL           Second origin for interleaved paired runs\n` +
        `  --label NAME              Result label (default ${args.label})\n` +
        `  --samples N               Cold contexts per route (default ${args.samples})\n` +
        `  --navigation-samples N     Root-to-Film hover/click pairs per origin (default ${args.navigationSamples})\n` +
        `  --settle-ms N             Fixed metrics window after load (default ${args.settleMs})\n` +
        `  --image-timeout-ms N      Viewport image readiness timeout (default ${args.imageTimeoutMs})\n` +
        `  --cpu-rate N              CDP CPU slowdown (default ${args.cpuRate}x)\n` +
        `  --download-mbps N         CDP download cap (default ${args.downloadMbps})\n` +
        `  --upload-mbps N           CDP upload cap (default ${args.uploadMbps})\n` +
        `  --latency-ms N            CDP added network latency (default ${args.latencyMs})\n` +
        `  --output DIR              Artifacts directory (default ${args.output})`);
      process.exit(0);
    }
    if (!(key in names) || i + 1 >= argv.length) throw new Error(`Unknown option or missing value: ${key}`);
    const name = names[key];
    const value = argv[++i];
    args[name] = ['baseUrl', 'beforeUrl', 'afterUrl', 'label', 'output'].includes(name) ? value : Number(value);
  }
  if (!args.baseUrl.startsWith('http://') && !args.baseUrl.startsWith('https://')) throw new Error('--base-url must use http:// or https://');
  if (Boolean(args.beforeUrl) !== Boolean(args.afterUrl)) throw new Error('--before-url and --after-url must be supplied together');
  for (const key of ['beforeUrl', 'afterUrl']) {
    if (args[key] && !args[key].startsWith('http://') && !args[key].startsWith('https://')) throw new Error(`--${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)} must use http:// or https://`);
  }
  if (!Number.isInteger(args.samples) || args.samples < 1) throw new Error('--samples must be an integer >= 1');
  if (!Number.isInteger(args.navigationSamples) || args.navigationSamples < 0) throw new Error('--navigation-samples must be an integer >= 0');
  for (const name of ['settleMs', 'imageTimeoutMs', 'cpuRate', 'downloadMbps', 'uploadMbps', 'latencyMs']) {
    if (!Number.isFinite(args[name]) || args[name] < 0) throw new Error(`--${name} must be a nonnegative number`);
  }
  if (args.cpuRate < 1 || args.downloadMbps <= 0 || args.uploadMbps <= 0) throw new Error('CPU rate and bandwidth limits must be greater than zero');
  return args;
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (sorted.length - 1) * p;
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
}

function summarize(values) {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return null;
  return {
    p50: Number(percentile(finite, 0.5).toFixed(2)),
    p95: Number(percentile(finite, 0.95).toFixed(2)),
    min: Number(Math.min(...finite).toFixed(2)),
    max: Number(Math.max(...finite).toFixed(2)),
  };
}

function comparison(before, after) {
  if (!Number.isFinite(before) || !Number.isFinite(after)) return null;
  return {
    beforeP50: before,
    afterP50: after,
    deltaP50: Number((after - before).toFixed(2)),
    changePercent: before === 0 ? null : Number((((after - before) / before) * 100).toFixed(2)),
  };
}

function routeUrl(baseUrl, route) {
  return new URL(route, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).href;
}

async function waitForViewportImages(page, timeoutMs) {
  const result = await page.evaluate(async timeout => {
    const visible = () => [...document.images].filter(image => {
      const rect = image.getBoundingClientRect();
      return rect.top < innerHeight && rect.bottom > 0 && rect.left < innerWidth && rect.right > 0;
    });
    const start = performance.now();
    while (performance.now() - start < timeout) {
      const images = visible();
      if (images.every(image => image.complete && image.naturalWidth > 0)) {
        await Promise.all(images.map(image => image.decode().catch(() => undefined)));
        return { ready: true, visibleCount: images.length,
          loadedCount: images.filter(image => image.naturalWidth > 0).length,
          failedCount: images.filter(image => image.complete && image.naturalWidth === 0).length,
          urls: images.map(image => image.currentSrc || image.src) };
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const images = visible();
    return { ready: false, visibleCount: images.length,
      loadedCount: images.filter(image => image.complete && image.naturalWidth > 0).length,
      failedCount: images.filter(image => image.complete && image.naturalWidth === 0).length,
      pendingCount: images.filter(image => !image.complete).length,
      urls: images.map(image => image.currentSrc || image.src) };
  }, timeoutMs);
  return result;
}

async function collectMetrics(page, row, settleMs) {
  return page.evaluate(({ rowData, windowMs }) => {
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const entries = window.__fullLoadEntries || { paints: {}, lcp: null, shifts: [], longTasks: [], loadAt: null };
    const windowEnd = (entries.loadAt ?? nav?.loadEventEnd ?? 0) + windowMs;
    const afterLoadLongTasks = entries.longTasks.filter(entry => entry.startTime >= (entries.loadAt ?? 0) && entry.startTime < windowEnd);
    const navigation = {
      responseStartMs: nav?.responseStart ?? null,
      responseEndMs: nav?.responseEnd ?? null,
      domContentLoadedMs: nav?.domContentLoadedEventEnd ?? null,
      loadEventStartMs: nav?.loadEventStart ?? null,
      loadEventEndMs: nav?.loadEventEnd ?? null,
      transferSize: nav?.transferSize ?? 0,
      encodedBodySize: nav?.encodedBodySize ?? 0,
      decodedBodySize: nav?.decodedBodySize ?? 0,
    };
    const resourceRows = resources.map(resource => {
      const url = resource.name;
      const isScript = /\.m?js(?:[?#]|$)/i.test(url);
      const isImage = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i.test(url);
      return {
        url, initiatorType: resource.initiatorType,
        startTimeMs: Number(resource.startTime.toFixed(2)), durationMs: Number(resource.duration.toFixed(2)),
        transferSize: resource.transferSize, encodedBodySize: resource.encodedBodySize,
        decodedBodySize: resource.decodedBodySize,
        kind: isScript ? 'javascript' : isImage ? 'image' : 'other',
      };
    });
    const sum = (rows, key) => rows.reduce((total, item) => total + (item[key] || 0), 0);
    const scripts = resourceRows.filter(item => item.kind === 'javascript');
    const images = resourceRows.filter(item => item.kind === 'image');
    const other = resourceRows.filter(item => item.kind === 'other');
    const shifts = entries.shifts.filter(entry => !entry.hadRecentInput && entry.startTime < windowEnd);
    const lcp = entries.lcp;
    return {
      route: rowData.route, url: rowData.url, status: rowData.status,
      measurementWindowAfterLoadMs: windowMs,
      fcpMs: entries.paints.fcp ?? null,
      lcp: lcp ? { timeMs: lcp.startTime, size: lcp.size, element: lcp.element,
                   url: lcp.url || null } : null,
      cls: Number(shifts.reduce((sumValue, item) => sumValue + item.value, 0).toFixed(5)),
      longTasks: {
        countBeforeWindowEnd: entries.longTasks.filter(entry => entry.startTime < windowEnd).length,
        totalMsBeforeWindowEnd: Number(entries.longTasks.filter(entry => entry.startTime < windowEnd).reduce((sumValue, item) => sumValue + item.duration, 0).toFixed(2)),
        afterLoadCount: afterLoadLongTasks.length,
        afterLoadTotalMs: Number(afterLoadLongTasks.reduce((sumValue, item) => sumValue + item.duration, 0).toFixed(2)),
        afterLoadDurationsMs: afterLoadLongTasks.map(item => Number(item.duration.toFixed(2))),
      },
      navigation,
      bytes: {
        allNetworkBytes: navigation.transferSize + sum(resourceRows, 'transferSize'),
        resourceNetworkBytes: sum(resourceRows, 'transferSize'),
        resourceEncodedBodyBytes: sum(resourceRows, 'encodedBodySize'),
        resourceDecodedBodyBytes: sum(resourceRows, 'decodedBodySize'),
        javascriptNetworkBytes: sum(scripts, 'transferSize'),
        javascriptEncodedBodyBytes: sum(scripts, 'encodedBodySize'),
        javascriptDecodedBytes: sum(scripts, 'decodedBodySize'),
        imageNetworkBytes: sum(images, 'transferSize'),
        imageEncodedBodyBytes: sum(images, 'encodedBodySize'),
        imageDecodedBytes: sum(images, 'decodedBodySize'),
        otherResourceNetworkBytes: sum(other, 'transferSize'),
      },
      resourceCount: resources.length,
      resources: resourceRows,
    };
  }, { rowData: row, windowMs: settleMs });
}

async function runOne(browser, routeName, route, sample, args, screenshotDir) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'light',
  });
  let session;
  try {
    const page = await context.newPage();
    session = await context.newCDPSession(page);
    await session.send('Network.enable');
    await session.send('Network.setCacheDisabled', { cacheDisabled: true });
    await session.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: args.latencyMs,
      downloadThroughput: args.downloadMbps * 1_000_000 / 8,
      uploadThroughput: args.uploadMbps * 1_000_000 / 8,
    });
    await session.send('Emulation.setCPUThrottlingRate', { rate: args.cpuRate });
    await page.addInitScript(() => {
      window.__fullLoadEntries = { paints: {}, lcp: null, shifts: [], longTasks: [], loadAt: null };
      try { performance.setResourceTimingBufferSize(5000); } catch {}
      const entries = window.__fullLoadEntries;
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) if (entry.name === 'first-contentful-paint') entries.paints.fcp = entry.startTime;
        }).observe({ type: 'paint', buffered: true });
      } catch {}
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) entries.lcp = {
            startTime: entry.startTime, size: entry.size,
            element: entry.element ? `${entry.element.tagName.toLowerCase()}${entry.element.id ? `#${entry.element.id}` : ''}` : null,
            url: entry.url || null,
          };
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {}
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) entries.shifts.push({ startTime: entry.startTime, value: entry.value, hadRecentInput: entry.hadRecentInput });
        }).observe({ type: 'layout-shift', buffered: true });
      } catch {}
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) entries.longTasks.push({ startTime: entry.startTime, duration: entry.duration });
        }).observe({ type: 'longtask', buffered: true });
      } catch {}
      addEventListener('load', () => { entries.loadAt = performance.now(); }, { once: true });
    });
    const url = routeUrl(args.baseUrl, route);
    const start = Date.now();
    let response = null;
    let navigationError = null;
    try {
      response = await page.goto(url, { waitUntil: 'load', timeout: 90000 });
    } catch (error) {
      navigationError = String(error);
    }
    const navElapsedMs = Date.now() - start;
    // Measure a fixed post-load window, independent of whether networking becomes idle.
    await page.waitForTimeout(args.settleMs);
    let metrics = null;
    if (response) {
      metrics = await collectMetrics(page, { route: routeName, url, status: response.status() }, args.settleMs);
    }
    // Wait only for <img> elements intersecting both viewport axes; never scroll the page.
    let screenshotReadiness = { ready: false, error: 'navigation did not return a response' };
    let screenshot = null;
    if (response) {
      try {
        screenshotReadiness = await waitForViewportImages(page, args.imageTimeoutMs);
        const file = path.join(screenshotDir, `${routeName}-${String(sample).padStart(2, '0')}.png`);
        await page.screenshot({ path: file, fullPage: false, animations: 'disabled' });
        screenshot = file;
      } catch (error) {
        screenshotReadiness = { ...screenshotReadiness, error: String(error) };
      }
    }
    return {
      label: args.label, variant: args.variant || args.label, route: routeName, sample, url, status: response?.status() ?? null,
      navigationElapsedMs: navElapsedMs, navigationError,
      screenshotReadiness, screenshot, metrics,
    };
  } finally {
    if (session) await session.detach().catch(() => {});
    await context.close();
  }
}

async function runNavigationOne(browser, target, sample, args) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    colorScheme: 'light',
  });
  let session;
  try {
    const page = await context.newPage();
    session = await context.newCDPSession(page);
    await session.send('Network.enable');
    await session.send('Network.setCacheDisabled', { cacheDisabled: true });
    await session.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: args.latencyMs,
      downloadThroughput: args.downloadMbps * 1_000_000 / 8,
      uploadThroughput: args.uploadMbps * 1_000_000 / 8,
    });
    await session.send('Emulation.setCPUThrottlingRate', { rate: args.cpuRate });

    const requests = [];
    const records = new Map();
    page.on('request', request => {
      const record = {
        url: request.url(),
        path: (() => { try { return new URL(request.url()).pathname; } catch { return ''; } })(),
        resourceType: request.resourceType(),
        startedAtMs: performance.now(),
        finishedAtMs: null,
        failed: null,
        status: null,
      };
      requests.push(record);
      records.set(request, record);
    });
    page.on('requestfinished', request => {
      const record = records.get(request);
      if (record) record.finishedAtMs = performance.now();
    });
    page.on('requestfailed', request => {
      const record = records.get(request);
      if (record) { record.finishedAtMs = performance.now(); record.failed = request.failure()?.errorText || 'failed'; }
    });
    page.on('response', response => {
      const record = records.get(response.request());
      if (record) record.status = response.status();
    });

    const rootUrl = routeUrl(target.baseUrl, '/');
    const rootStart = performance.now();
    let rootStatus = null;
    let rootError = null;
    try {
      const response = await page.goto(rootUrl, { waitUntil: 'load', timeout: 90000 });
      rootStatus = response?.status() ?? null;
    } catch (error) { rootError = String(error); }
    const rootLoadMs = performance.now() - rootStart;

    // A theme-toggle interaction confirms hydration, as in the project's
    // navigation test, before measuring mouse-intent prefetch behavior.
    let hydrationConfirmed = false;
    if (rootStatus === 200) {
      await page.getByRole('button', { name: 'Dark mode', exact: true }).click({ timeout: 15000 });
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark', undefined, { timeout: 15000 });
      hydrationConfirmed = true;
    }
    const film = page.locator('nav[aria-label="Main navigation"] a[href="/film/"]');
    await film.waitFor({ state: 'visible', timeout: 15000 });
    const beforeHoverFlightRequests = requests.filter(record => record.path.startsWith('/film/') && record.path.endsWith('.txt'));

    const hoverStartedAtMs = performance.now();
    await film.hover({ timeout: 15000 });
    await page.waitForTimeout(700);
    const clickStartedAtMs = performance.now();
    const hoverRequests = requests.filter(record => record.startedAtMs >= hoverStartedAtMs && record.startedAtMs < clickStartedAtMs);
    const hoverFlightRequests = hoverRequests.filter(record => record.path.startsWith('/film/') && record.path.endsWith('.txt'));

    const urlCommitPromise = page.waitForURL(url => new URL(url).pathname === '/film/', { timeout: 90000 });
    const contentPromise = page.waitForFunction(() => location.pathname === '/film/' &&
      document.querySelector('main h1')?.textContent?.trim() === 'Film', undefined, { timeout: 90000 });
    await film.click({ timeout: 15000 });
    await urlCommitPromise;
    const urlCommittedAtMs = performance.now();
    await contentPromise;
    const filmContentReadyAtMs = performance.now();
    const clickRequests = requests.filter(record => record.startedAtMs >= clickStartedAtMs);
    return {
      variant: target.variant, baseUrl: target.baseUrl, sample,
      viewport: { width: 1440, height: 1000 }, rootStatus, rootError,
      rootLoadMs: Number(rootLoadMs.toFixed(2)), hydrationConfirmed,
      hoverWindowMs: Number((clickStartedAtMs - hoverStartedAtMs).toFixed(2)),
      beforeHoverFlightRequestCount: beforeHoverFlightRequests.length,
      hoverRequestCount: hoverRequests.length,
      hoverRequests,
      hoverFlightRequestCount: hoverFlightRequests.length,
      hoverFlightRequests,
      clickToUrlCommitMs: Number((urlCommittedAtMs - clickStartedAtMs).toFixed(2)),
      clickToFilmContentMs: Number((filmContentReadyAtMs - clickStartedAtMs).toFixed(2)),
      clickRequests,
    };
  } finally {
    if (session) await session.detach().catch(() => {});
    await context.close();
  }
}

async function main() {
  const args = argsFrom(process.argv);
  const outDir = path.resolve(args.output);
  const paired = Boolean(args.beforeUrl && args.afterUrl);
  const targets = paired
    ? [{ variant: 'before', baseUrl: args.beforeUrl }, { variant: 'after', baseUrl: args.afterUrl }]
    : [{ variant: args.label, baseUrl: args.baseUrl }];
  for (const target of targets) fs.mkdirSync(path.join(outDir, `${args.label}-${target.variant}-screenshots`), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const startedAt = new Date().toISOString();
  const rows = [];
  try {
    for (const [routeName, route] of Object.entries(ROUTES)) {
      for (let sample = 1; sample <= args.samples; sample++) {
        const order = sample % 2 === 1 ? targets : [...targets].reverse();
        for (const target of order) {
          const runArgs = { ...args, ...target, variant: target.variant,
                            label: paired ? `${args.label}-${target.variant}` : args.label };
          const screenshotDir = path.join(outDir, `${args.label}-${target.variant}-screenshots`);
          console.error(`${args.label} ${target.variant}: ${routeName} ${sample}/${args.samples}`);
          try {
            rows.push(await runOne(browser, routeName, route, sample, runArgs, screenshotDir));
          } catch (error) {
            rows.push({ label: runArgs.label, variant: target.variant, route: routeName, sample,
                        error: String(error), stack: error?.stack || null });
          }
        }
      }
    }
    const summaries = {};
    const metricFields = [
      'navigationElapsedMs', 'navigation.loadEventEndMs', 'navigation.domContentLoadedMs',
      'fcpMs', 'lcp.timeMs', 'cls', 'longTasks.afterLoadTotalMs',
      'bytes.allNetworkBytes', 'bytes.javascriptNetworkBytes', 'bytes.javascriptDecodedBytes',
      'bytes.imageNetworkBytes', 'bytes.imageDecodedBytes',
    ];
    const get = (object, dotted) => dotted.split('.').reduce((value, key) => value?.[key], object);
    for (const target of targets) {
      const routeSummary = {};
      for (const [routeName] of Object.entries(ROUTES)) {
        const selected = rows.filter(row => row.route === routeName && row.variant === target.variant);
        const stats = {};
        for (const field of metricFields) {
          stats[field] = summarize(selected.map(row => get(field === 'navigationElapsedMs' ? row : row.metrics, field)));
        }
        routeSummary[routeName] = {
          count: selected.length,
          successful: selected.filter(row => row.status === 200 && row.metrics).length,
          statuses: selected.reduce((counts, row) => { const key = String(row.status ?? 'error'); counts[key] = (counts[key] || 0) + 1; return counts; }, {}),
          screenshotReady: selected.filter(row => row.screenshotReadiness?.ready).length,
          screenshotImages: selected.map(row => row.screenshotReadiness?.visibleCount).filter(Number.isFinite),
          metrics: stats,
        };
      }
      summaries[target.variant] = routeSummary;
    }
    const navigationSamples = [];
    if (paired && args.navigationSamples > 0) {
      for (let sample = 1; sample <= args.navigationSamples; sample++) {
        const order = sample % 2 === 1 ? targets : [...targets].reverse();
        for (const target of order) {
          console.error(`${args.label} ${target.variant}: root -> Film hover navigation ${sample}/${args.navigationSamples}`);
          try {
            navigationSamples.push(await runNavigationOne(browser, target, sample, args));
          } catch (error) {
            navigationSamples.push({ variant: target.variant, sample, error: String(error), stack: error?.stack || null });
          }
        }
      }
    }
    const navigationSummaries = {};
    for (const target of targets) {
      const selected = navigationSamples.filter(sample => sample.variant === target.variant);
      const successful = selected.filter(sample => Number.isFinite(sample.clickToFilmContentMs));
      navigationSummaries[target.variant] = {
        count: selected.length,
        successful: successful.length,
        rootLoadMs: summarize(selected.map(sample => sample.rootLoadMs)),
        hoverWindowMs: summarize(selected.map(sample => sample.hoverWindowMs)),
        hoverFlightRequestCount: summarize(selected.map(sample => sample.hoverFlightRequestCount)),
        clickToUrlCommitMs: summarize(successful.map(sample => sample.clickToUrlCommitMs)),
        clickToFilmContentMs: summarize(successful.map(sample => sample.clickToFilmContentMs)),
        runsWithHoverFlightPrefetch: selected.filter(sample => sample.hoverFlightRequestCount > 0).length,
      };
    }
    const navigationComparisons = paired ? {
      clickToUrlCommitMs: comparison(navigationSummaries.before.clickToUrlCommitMs?.p50, navigationSummaries.after.clickToUrlCommitMs?.p50),
      clickToFilmContentMs: comparison(navigationSummaries.before.clickToFilmContentMs?.p50, navigationSummaries.after.clickToFilmContentMs?.p50),
      hoverFlightRequestCount: comparison(navigationSummaries.before.hoverFlightRequestCount?.p50, navigationSummaries.after.hoverFlightRequestCount?.p50),
    } : {};
    const comparisons = {};
    if (paired) {
      for (const [routeName] of Object.entries(ROUTES)) {
        comparisons[routeName] = {};
        for (const field of metricFields) {
          const before = summaries.before[routeName].metrics[field]?.p50;
          const after = summaries.after[routeName].metrics[field]?.p50;
          comparisons[routeName][field] = Number.isFinite(before) && Number.isFinite(after)
            ? { beforeP50: before, afterP50: after, deltaP50: Number((after - before).toFixed(2)),
                changePercent: before === 0 ? null : Number((((after - before) / before) * 100).toFixed(2)) }
            : null;
        }
      }
    }
    const result = {
      label: args.label,
      startedAt,
      baseUrl: paired ? null : args.baseUrl,
      targets,
      environment: {
        browser: 'Chromium via project Playwright', version: browser.version(),
        viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, mobileEmulation: true,
        cpuSlowdownRate: args.cpuRate,
        network: { latencyMs: args.latencyMs, downloadMbps: args.downloadMbps, uploadMbps: args.uploadMbps,
                   downloadBytesPerSecond: args.downloadMbps * 1_000_000 / 8,
                   uploadBytesPerSecond: args.uploadMbps * 1_000_000 / 8 },
      },
      methodology: {
        samplesPerRoute: args.samples, freshBrowserContextPerSample: true, cacheDisabled: true,
        navigationWait: 'load event', fixedMeasurementWindowAfterLoadMs: args.settleMs,
        screenshot: 'viewport only, after waiting for <img> elements intersecting both viewport axes; no scrolling',
        resourceBytes: 'PerformanceResourceTiming transferSize (network bytes including headers), encodedBodySize, decodedBodySize; initial navigation transfer and image/script resource subsets reported separately',
        LCP: 'last LargestContentfulPaint entry observed by the end of the fixed post-load window',
        CLS: 'sum of layout-shift entries without recent input before the end of that window',
        longTasks: 'PerformanceObserver longtask entries, with the fixed post-load-window total reported',
        navigationIntent: paired && args.navigationSamples > 0
          ? 'Separate desktop study: fresh context per sample, navigate to root, confirm hydration with theme-toggle interaction, hover Film for 700ms, click, then measure URL commit and main h1=Film; same CPU/network throttle.'
          : null,
      },
      summaries,
      comparisons,
      navigationSummaries,
      navigationComparisons,
      navigationSamples,
      samples: rows,
    };
    const timestamp = startedAt.replace(/[:.]/g, '-');
    const resultFile = path.join(outDir, `${args.label}${paired ? '-paired' : ''}-${timestamp}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({ resultFile, screenshotDirs: targets.map(target => path.join(outDir, `${args.label}-${target.variant}-screenshots`)), summaries, comparisons, navigationSummaries, navigationComparisons, environment: result.environment, methodology: result.methodology }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error?.stack || error); process.exit(1); });
