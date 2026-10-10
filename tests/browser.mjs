import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const screenshots = process.env.SCREENSHOT_DIR || '/tmp/devon-2d-qa';
await mkdir(screenshots, { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:3011');
  await page.locator('.room-art').evaluate((img) => img.decode());
  assert.match(await page.title(), /Devon Labs/);
  assert.equal(await page.locator('canvas').count(), 0);
  await page.mouse.move(0, 0);
  const initial = await page.locator('.painted-room').screenshot();
  await page.keyboard.press('w');
  await page.keyboard.press('Space');
  await page.mouse.move(400, 400);
  await page.mouse.down();
  await page.mouse.move(600, 450);
  await page.mouse.up();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(700);
  assert.deepEqual(await page.locator('.painted-room').screenshot(), initial, 'Room stays still');
  await page.screenshot({ path: `${screenshots}/desktop.png` });
  const close = () => page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Photo studio', exact: true }).click();
  await page.getByRole('button', { name: /The Best/ }).click();
  await page.locator('.gallery-photo img').evaluate((img) => img.decode());
  const firstPhoto = await page.locator('.gallery-photo img').getAttribute('src');
  await page.getByRole('button', { name: 'Next photograph', exact: true }).click();
  assert.notEqual(await page.locator('.gallery-photo img').getAttribute('src'), firstPhoto);
  await close();
  await page.getByRole('button', { name: 'Cinema', exact: true }).click();
  await page.getByRole('button', { name: /The One Camp/ }).click();
  assert.equal(await page.locator('video').getAttribute('preload'), 'none');
  assert.equal(await page.locator('video').evaluate((v) => v.paused), true);
  await close();
  await page.getByRole('button', { name: 'The constellation', exact: true }).click();
  assert.equal(await page.locator('.paper-constellation button').count(), 12);
  await close();
  await page.getByRole('button', { name: 'All work', exact: true }).click();
  assert.equal(await page.locator('.room-projects button').count(), 12);
  await page.getByRole('searchbox').fill('Headshot');
  await page.locator('.room-projects button').click();
  assert.equal(await page.locator('.portrait-preview').count(), 1);
  await close();
  await page.getByRole('button', { name: 'Software lab', exact: true }).click();
  assert.equal(await page.locator('.room-projects button').count(), 9);
  await close();
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('button', { name: 'Hardware bench', exact: true }).click();
    await page.getByRole('button', { name: /1337 Sheets/ }).click();
    assert.equal(
      await page.getByRole('link', { name: 'Visit the shop' }).getAttribute('href'),
      'https://shop.1337sheets.com/'
    );
    await close();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => (document.querySelector('main').scrollTop = 0));
  await page.screenshot({ path: `${screenshots}/mobile.png` });
  const touch = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await touch.goto(process.env.TEST_URL || 'http://127.0.0.1:3011');
  await touch.getByRole('button', { name: 'A spare lens', exact: true }).tap();
  await touch.getByRole('button', { name: 'Take it', exact: true }).tap();
  await touch.locator('dialog').waitFor({ state: 'hidden' });
  await touch.getByRole('button', { name: 'Your pockets', exact: true }).tap();
  assert.equal(await touch.locator('.pocket-items button:enabled').count(), 1);
  await touch.close();
  assert.deepEqual(errors, []);
  console.log(
    'Passed: static 2D room, media viewers, constellation, search, four viewports, and console health.'
  );
} finally {
  await browser.close();
}
