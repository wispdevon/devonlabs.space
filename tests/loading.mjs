import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const origin = new URL(process.env.TEST_URL || 'http://127.0.0.1:3011/').origin;
const browser = await chromium.launch();
try {
  for (const route of ['photography', 'coffee']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const images = [];
    const requests = [];
    page.on('request', request => requests.push(new URL(request.url()).pathname));
    page.on('response', async response => { if (response.request().resourceType() === 'image') images.push({ url: new URL(response.url()).pathname, bytes: (await response.body()).length }); });
    await page.goto(`${origin}/${route}/`);
    for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 600) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(100); }
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('.expanded-photo').count(), 0);
    if (route === 'coffee') assert.ok(!requests.some(url => /(?:\/api\/assets\/.+\/original|\/coffee\/brewing[^/]*\.mp4)$/.test(url)), 'Original videos wait for playback');
    assert.ok(!requests.some(url => /^\/workshop\/photos\//.test(url)), 'No original Photography or unrelated About image before opening');
    if (route === 'coffee') assert.ok(!requests.some(url => /^\/generated\/images\/01-/.test(url)), 'No responsive About photo on Coffee');
    assert.ok(!requests.some(url => /^\/coffee\/photo-/.test(url)), 'No original Coffee image before opening');
    assert.ok(!requests.some(url => /\/(?:index|work|software|film|shop)\.txt/.test(url)), 'No unrelated route prefetch');
    const bytes = images.reduce((total, image) => total + image.bytes, 0);
    if (route === 'photography') assert.ok(bytes < 880000, `Photography image budget: ${bytes}`);
    console.log(`${route}: ${bytes} image bytes at 390px / DPR 1, cold context, full scroll.`);
    if (route === 'photography') {
      assert.equal(await page.locator('.event-story details, .event-story summary').count(), 0);
      for (const image of await page.locator('.event-coverage-photos img').all()) {
        assert.equal(await image.isVisible(), true, 'Event photographs are displayed without disclosure controls');
      }
    }
    await page.getByRole('button', { name: route === 'coffee' ? 'Open coffee photograph 1' : 'Open photograph 1', exact: true }).click();
    await page.locator('.expanded-photo').evaluate(image => image.decode());
    assert.match(await page.locator('.expanded-photo').getAttribute('src'), route === 'coffee' ? /^\/coffee\/photo-/ : /^\/workshop\/photos\//);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.expanded-photo'));
    await context.close();
  }
  for (const preference of ['dark', 'light', 'invalid', 'blocked']) {
    const context = await browser.newContext({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await context.addInitScript(preference => {
      if (preference === 'blocked') Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage disabled'); } });
      else localStorage.setItem('devon-portfolio-theme', preference);
      new MutationObserver(() => {
        if (document.querySelector('.portfolio') && !window.firstTheme) window.firstTheme = document.documentElement.dataset.theme;
      }).observe(document, { childList: true, subtree: true });
    }, preference);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin);
    const expected = preference === 'light' ? 'light' : 'dark';
    assert.equal(await page.evaluate(() => window.firstTheme), expected, 'Theme present when first content mounts');
    await page.getByRole('button', { name: 'Dark mode', exact: true }).waitFor();
    await page.waitForFunction(expected => document.querySelector('.theme-toggle').getAttribute('aria-pressed') === String(expected === 'dark'), expected);
    if (preference === 'invalid' || preference === 'blocked') {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    }
    await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), expected === 'dark' ? 'light' : 'dark');
    await page.getByRole('navigation').getByRole('link', { name: 'Work', exact: true }).click();
    await page.waitForURL(`${origin}/work/`);
    await page.waitForFunction(theme => document.querySelector('.theme-toggle').getAttribute('aria-pressed') === String(theme === 'dark'), expected === 'dark' ? 'light' : 'dark');
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('Passed cold loading, deferred originals, no unrelated prefetch, first-content theme, invalid preference and unavailable storage.');
} finally { await browser.close(); }
