import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = new URL(process.env.TEST_URL || 'http://127.0.0.1:3011/').origin;
const browser = await chromium.launch();
try {
  for (const mode of ['hover', 'focus', 'save-data', 'slow-network']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
    if (mode === 'save-data' || mode === 'slow-network') {
      await context.addInitScript(mode => {
        Object.defineProperty(navigator, 'connection', { configurable: true, value: {
          saveData: mode === 'save-data', effectiveType: mode === 'slow-network' ? '2g' : '4g',
        } });
      }, mode);
    }
    const page = await context.newPage();
    const requests = [];
    const errors = [];
    page.on('request', request => { if (new URL(request.url()).pathname.endsWith('.txt')) requests.push(new URL(request.url()).pathname); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin);
    // A completed interaction confirms hydration before testing intent signals.
    await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    assert.deepEqual(requests, [], 'Initial loading does not prefetch unrelated routes');
    const film = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Film', exact: true });
    const prefetch = mode === 'hover' || mode === 'focus'
      ? page.waitForResponse(response => new URL(response.url()).pathname.startsWith('/film/') && new URL(response.url()).pathname.endsWith('.txt') && response.status() === 200, { timeout: 5000 })
      : null;
    if (mode === 'focus') await film.focus();
    else await film.hover();
    if (mode === 'save-data' || mode === 'slow-network') {
      await page.waitForTimeout(500);
      assert.deepEqual(requests, [], 'Constrained connections do not speculate');
    } else {
      await prefetch;
      assert.ok(requests.length > 0);
      assert.ok(requests.every(path => path.startsWith('/film/')), 'Only the intended route is prefetched');
    }
    await film.click();
    await page.waitForURL(`${origin}/film/`);
    await page.getByRole('heading', { level: 1, name: 'Film', exact: true }).waitFor();
    assert.equal(await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Film', exact: true }).getAttribute('aria-current'), 'page');
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('Passed navigation intent prefetch, no initial speculation, constrained-connection opt-out, and route navigation.');
} finally { await browser.close(); }
