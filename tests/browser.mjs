import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL = process.env.TEST_URL || 'http://127.0.0.1:3011';
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('.project-row').count(), 9);
  assert.match(await page.title(), /Devon Labs/);
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://devonlabs.space/');
  assert.equal(await page.locator('.portrait-link img').evaluate(image => image.naturalWidth > 0), true);
  if (process.env.SCREENSHOT_DIR) {
    await mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/desktop.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Preview', exact: false }).first().click();
  const preview = page.locator('.project-preview:visible img');
  await preview.waitFor();
  await preview.evaluate(image => image.decode());
  assert.equal(await preview.evaluate(image => image.naturalWidth > 0), true);
  if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/preview.png`, fullPage: true });
  await page.getByRole('button', { name: 'Close preview', exact: false }).click();
  await page.locator('.filters').getByRole('button', { name: 'Photography', exact: true }).click();
  assert.equal(await page.locator('.project-row').count(), 4);
  await page.getByRole('searchbox', { name: 'Search projects' }).fill('immich');
  assert.equal(await page.locator('.project-row').count(), 3);
  await page.getByRole('searchbox').fill('no such project');
  assert.equal(await page.locator('.empty-state').count(), 1);
  await page.getByRole('button', { name: 'Show all projects' }).click();
  assert.equal(await page.locator('.project-row').count(), 9);
  await page.locator('.filters').getByRole('button', { name: 'Contributions', exact: true }).click();
  assert.equal(await page.locator('.project-row').count(), 1);
  assert.match(await page.locator('.project-identity').innerText(), /Fork/);
  await page.getByRole('button', { name: 'Reset filters' }).click();
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}px`);
    assert.equal(await page.locator('.project-row').count(), 9);
    if (process.env.SCREENSHOT_DIR && width === 390) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/mobile.png`, fullPage: true });
  }
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.skip-link').evaluate(element => element === document.activeElement), true);
  for (const link of await page.locator('a[href^="https://github.com/wispdevon/"]').evaluateAll(links => links.map(link => link.href))) assert.match(link, /^https:\/\/github\.com\/wispdevon\//);
  assert.deepEqual(errors, []);
  console.log('Passed: project search, combined filters, reset, empty state, fork credit, image preview, keyboard entry, metadata, and four viewport widths.');
} finally {
  await browser.close();
}
