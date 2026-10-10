import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.env.TEST_URL || 'http://127.0.0.1:3011';
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const errors = [];
const position = async (page) =>
  (await page.locator('.world').getAttribute('data-position')).split(',').map(Number);
const ready = async (page) => {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('.world')?.dataset.renderer === 'webgl');
  await page.waitForTimeout(700);
};
const close = async (page) =>
  page.getByRole('button', { name: 'Close panel', exact: true }).click();
const index = async (page) => page.getByRole('button', { name: 'Open project index' }).click();
const open = async (page, id) => {
  await index(page);
  await page.getByRole('textbox', { name: 'Search projects' }).fill('');
  await page.getByRole('radio', { name: 'All', exact: true }).check();
  await page.locator(`[data-project="${id}"]`).click();
};
const travel = async (page, name) => {
  await page.getByRole('button', { name: 'Open map' }).click();
  await page.locator('.map-destinations').getByRole('button', { name, exact: true }).click();
};
const screenshot = async (page, name) => {
  if (process.env.SCREENSHOT_DIR) {
    await mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/${name}.png` });
  }
};
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  page.setDefaultTimeout(30000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await ready(page);
  assert.match(await page.title(), /Devon Labs/);
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute('href'),
    'https://devonlabs.space/'
  );
  assert.equal(await page.locator('canvas').count(), 1);
  assert.equal(await page.locator('.world-loading').count(), 0);
  assert.equal(
    await page.locator('canvas').evaluate((canvas) => canvas.width > 100 && canvas.height > 100),
    true
  );
  const colors = await page.locator('canvas').evaluate((canvas) => {
    const sample = document.createElement('canvas');
    sample.width = 128;
    sample.height = 128;
    const ctx = sample.getContext('2d');
    ctx.drawImage(canvas, 0, 0, 128, 128);
    const data = ctx.getImageData(0, 0, 128, 128).data;
    const colors = new Set();
    for (let i = 0; i < data.length; i += 4)
      colors.add(`${data[i] >> 3},${data[i + 1] >> 3},${data[i + 2] >> 3}`);
    return colors.size;
  });
  assert.ok(
    colors > 30,
    `World must contain rendered geometry, not only a background (${colors} colors)`
  );
  await screenshot(page, 'desktop');
  console.log('Desktop rendered; checking driving and jump.');
  await page.locator('canvas').focus();
  const before = await position(page);
  await page.keyboard.down('w');
  await page.waitForTimeout(1000);
  await page.keyboard.up('w');
  const after = await position(page);
  assert.ok(
    Math.hypot(after[0] - before[0], after[2] - before[2]) > 1,
    'Keyboard drives the rover'
  );
  await page.getByRole('button', { name: 'Respawn rover' }).click();
  await page.waitForTimeout(600);
  assert.ok(Math.abs((await position(page))[0]) < 0.1);
  await page.locator('canvas').focus();
  await page.keyboard.press('Space');
  console.log('Jump requested at', await position(page));
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('devon-workshop-v1') || '{}').jumped === true
  );
  await page.waitForTimeout(1000);
  await index(page);
  assert.equal(await page.locator('.index-rows > button').count(), 12);
  const pausedBefore = await position(page);
  await page.waitForTimeout(300);
  assert.deepEqual(await position(page), pausedBefore, 'Project overlays park the rover');
  await page.getByRole('radio', { name: 'Software', exact: true }).check();
  assert.equal(await page.locator('.index-rows > button').count(), 9);
  await page.getByRole('textbox', { name: 'Search projects' }).fill('does-not-exist');
  assert.equal(await page.getByText('No matching work.').isVisible(), true);
  await page.getByRole('textbox', { name: 'Search projects' }).fill('strider');
  assert.equal(await page.locator('.index-rows > button').count(), 1);
  await page.locator('[data-project="strider"]').click();
  assert.equal(await page.locator('.work-detail h1').textContent(), 'Strider');
  assert.equal(
    await page.locator('.work-links a').getAttribute('href'),
    'https://github.com/wispdevon/strider'
  );
  await close(page);
  await open(page, 'GibbonPfp');
  assert.equal(
    await page.locator('.portrait-preview img').evaluate((image) => image.naturalWidth > 0),
    true
  );
  await page.getByRole('radio', { name: '1:1', exact: true }).check();
  assert.equal(
    await page
      .locator('.portrait-preview')
      .evaluate((element) => getComputedStyle(element).aspectRatio),
    '1 / 1'
  );
  await page.getByRole('slider', { name: 'Portrait crop' }).fill('1.6');
  assert.notEqual(
    await page
      .locator('.portrait-preview img')
      .evaluate((element) => getComputedStyle(element).transform),
    'matrix(1, 0, 0, 1, 0, 0)'
  );
  await screenshot(page, 'portrait-preview');
  await close(page);
  await open(page, 'Immichinko');
  await page.getByRole('button', { name: 'Favorite photograph', exact: true }).click();
  assert.equal(
    await page
      .getByRole('button', { name: 'Favorite photograph', exact: true })
      .getAttribute('aria-pressed'),
    'true'
  );
  const first = await page.locator('.review-photo').getAttribute('src');
  await page.getByRole('button', { name: 'Next photograph', exact: true }).click();
  assert.notEqual(await page.locator('.review-photo').getAttribute('src'), first);
  await close(page);
  await open(page, 'immich-contact');
  await page.getByRole('slider', { name: 'Contact sheet columns' }).fill('4');
  assert.equal(await page.locator('.slider-field output').textContent(), '4');
  await page.getByRole('checkbox', { name: 'Film border' }).uncheck();
  assert.equal(await page.locator('.sheet-preview.film').count(), 0);
  await close(page);
  await open(page, 'the-best');
  assert.equal(
    await page.locator('.gallery-photo img').evaluate((image) => image.naturalWidth > 0),
    true
  );
  assert.equal(await page.locator('.gallery-thumbnails button').count(), 12);
  const photo = await page.locator('.gallery-photo img').getAttribute('src');
  await page.getByRole('button', { name: 'Next photograph', exact: true }).click();
  assert.notEqual(await page.locator('.gallery-photo img').getAttribute('src'), photo);
  await screenshot(page, 'photography');
  await close(page);
  await open(page, 'camp-film');
  assert.equal(await page.locator('video').getAttribute('preload'), 'none');
  assert.equal(await page.locator('video').evaluate((video) => video.paused), true);
  assert.match(await page.locator('video').getAttribute('src'), /photo\.devonlabs\.space/);
  await close(page);
  assert.equal(await page.locator('video').count(), 0);
  await open(page, 'hardware');
  assert.equal(
    await page.locator('.work-links a').getAttribute('href'),
    'https://shop.1337sheets.com/'
  );
  await close(page);
  await open(page, 'sharply');
  assert.equal(await page.locator('.fork-note').isVisible(), true);
  await close(page);
  await travel(page, 'HeadshotFlow');
  await page.waitForTimeout(500);
  assert.ok(Math.abs((await position(page))[0] + 17) < 0.2);
  assert.equal(await page.locator('.nearby-work').isVisible(), true);
  await page.locator('canvas').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.work-detail h1').textContent(), 'HeadshotFlow');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog[open]').count(), 0);
  const frame = await page.locator('canvas').evaluate((canvas) => canvas.toDataURL());
  await page.getByRole('button', { name: 'Switch to night' }).click();
  const activeColors = await page
    .getByRole('button', { name: 'Switch to day' })
    .evaluate((button) => {
      const style = getComputedStyle(button);
      return { foreground: style.color, background: style.backgroundColor };
    });
  assert.notEqual(
    activeColors.foreground,
    activeColors.background,
    'Active hovered icon is visible'
  );
  await page.waitForTimeout(300);
  assert.notEqual(await page.locator('canvas').evaluate((canvas) => canvas.toDataURL()), frame);
  await screenshot(page, 'night');
  await page.getByRole('button', { name: 'Switch to day' }).click();
  await page.getByRole('button', { name: 'Enable sound' }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Mute sound' }).getAttribute('aria-pressed'),
    'true'
  );
  await page.getByRole('button', { name: 'Mute sound' }).click();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('combobox', { name: 'Rendering quality' }).selectOption('low');
  await close(page);
  assert.equal(await page.locator('.world').getAttribute('data-renderer'), 'webgl');
  await page.getByRole('button', { name: 'Start circuit', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.world')?.dataset.checkpoint === '1');
  assert.equal(await page.locator('.race-status').isVisible(), true);
  await page.waitForTimeout(250);
  assert.notEqual(await page.locator('.race-status strong').textContent(), '0:00.0');
  await page.getByRole('button', { name: 'End circuit', exact: true }).click();
  await page.getByRole('button', { name: 'Open achievements' }).click();
  assert.equal(await page.locator('.achievement').count(), 4);
  assert.ok((await page.locator('.achievement.earned').count()) >= 1);
  await close(page);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('.world')?.dataset.renderer === 'webgl');
  await page.getByRole('button', { name: 'Open achievements' }).click();
  assert.ok(
    (await page.locator('.achievement.earned').count()) >= 1,
    'Achievements persist across reload'
  );
  await close(page);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 850 });
    await page.waitForTimeout(200);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      `No overflow at ${width}`
    );
    for (const selector of [
      '.world-tools',
      '.world-actions',
      '.world-status',
      '.world-signature',
    ]) {
      const bounds = await page.locator(selector).boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width, `${selector} fits at ${width}`);
    }
    await index(page);
    assert.equal(await page.locator('.index-rows > button').count(), 12);
    assert.equal(
      await page.locator('dialog').evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
      true
    );
    await close(page);
    if (width === 390) await screenshot(page, 'mobile');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(
    await page.locator('.world-signature').evaluate((el) => getComputedStyle(el).animationName),
    'none'
  );
  assert.deepEqual(errors, [], 'No application errors');

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const touch = await mobile.newPage();
  await ready(touch);
  const origin = await position(touch);
  const stick = await touch.locator('.joystick').boundingBox();
  const cdp = await mobile.newCDPSession(touch);
  const point = { x: stick.x + stick.width / 2, y: stick.y + stick.height / 2 };
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ ...point, radiusX: 3, radiusY: 3 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: point.x, y: point.y - 35, radiusX: 3, radiusY: 3 }],
  });
  await touch.waitForTimeout(1000);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const destination = await position(touch);
  assert.ok(
    Math.hypot(destination[0] - origin[0], destination[2] - origin[2]) > 1,
    'Touch joystick drives'
  );
  await touch.getByRole('button', { name: 'Respawn rover' }).tap();
  await touch.waitForTimeout(600);
  await touch.getByRole('button', { name: 'Jump rover' }).tap();
  await touch.waitForFunction(
    () => JSON.parse(localStorage.getItem('devon-workshop-v1') || '{}').jumped === true
  );
  await touch.getByRole('button', { name: 'Open project index' }).tap();
  await touch.locator('[data-project="the-best"]').tap();
  const heading = await touch.locator('.work-detail h1').boundingBox();
  const header = await touch.locator('.dialog-top').boundingBox();
  assert.ok(heading.y >= header.y + header.height, 'Project heading is below the sticky header');
  assert.equal(
    await touch.locator('.gallery-photo img').evaluate((img) => img.naturalWidth > 0),
    true
  );
  await screenshot(touch, 'mobile-gallery');
  await mobile.close();

  const fallback = await browser.newContext();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
      return original.call(this, type, ...args);
    };
  });
  const basic = await fallback.newPage();
  await basic.goto(url, { waitUntil: 'networkidle' });
  await basic.waitForSelector('.world-fallback');
  assert.equal(await basic.locator('.fallback-works > button').count(), 12);
  await basic
    .locator('.fallback-works')
    .getByRole('button', { name: /Strider/ })
    .click();
  assert.equal(await basic.locator('.work-detail h1').textContent(), 'Strider');
  await fallback.close();
  await page
    .locator('canvas')
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
    );
  await page.waitForSelector('.world-fallback');
  assert.equal(await page.locator('.fallback-works > button').count(), 12);
  console.log(
    'Passed: rendered world pixels, rover driving/jump/respawn, paused overlays, all destinations, source links, three previews, real photo lightbox, video controls, map travel, night/audio/quality, circuit timer, achievements/persistence, four viewport widths, mobile joystick/taps, reduced motion, and WebGL fallback.'
  );
} finally {
  await browser.close();
}
