import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = new URL(process.env.TEST_URL || 'http://127.0.0.1:3019').origin;
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/photography/`);
  await page.waitForFunction(() => {
    const grids = [...document.querySelectorAll('.dynamic-masonry')];
    return grids.length > 0 && grids.every(grid => grid.getAttribute('data-packed') === 'true');
  });
  for (const width of [1440, 768, 390, 320, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('.dynamic-masonry img').evaluateAll(images => Promise.all(images.map(image => { image.loading = 'eager'; return image.decode(); })));
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    for (const grid of await page.locator('.dynamic-masonry').all()) {
      assert.equal(await grid.getAttribute('data-packed'), 'true');
      const items = await grid.locator(':scope > .masonry-item').evaluateAll(elements => elements.map(element => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      }));
      assert.ok(Math.max(...items.map(item => item.width)) - Math.min(...items.map(item => item.width)) < 1, 'Masonry uses continuous lanes instead of hole-producing wide spans');
      const gap = await grid.evaluate(element => Number.parseFloat(getComputedStyle(element).getPropertyValue('--masonry-gap')));
      const lanes = new Map();
      for (const item of items) {
        const key = Math.round(item.x);
        if (!lanes.has(key)) lanes.set(key, []);
        lanes.get(key).push(item);
      }
      for (const lane of lanes.values()) {
        lane.sort((a, b) => a.y - b.y);
        assert.ok(Math.abs(lane[0].y - Math.min(...items.map(item => item.y))) < 1, 'Every lane starts at the top');
        for (let index = 1; index < lane.length; index++) {
          const space = lane[index].y - lane[index - 1].y - lane[index - 1].height;
          assert.ok(space >= gap - 1 && space <= gap + 2, `No interior masonry holes at ${width}px: ${space}px`);
        }
      }
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
        const a = items[i], b = items[j];
        const intersectionWidth = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const intersectionHeight = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        assert.ok(intersectionWidth <= 1 || intersectionHeight <= 1, `Masonry tiles do not overlap at ${width}px`);
      }
    }
    const ratios = await page.locator('.dynamic-masonry img').evaluateAll(images => images.map(image => {
      const bounds = image.getBoundingClientRect();
      return Math.abs(bounds.width / bounds.height - Number(image.getAttribute('width')) / Number(image.getAttribute('height')));
    }));
    assert.ok(ratios.every(error => error < .025), 'All images remain uncropped at natural proportions');
  }
  const names = await page.locator('.photo-gallery button').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')));
  assert.deepEqual(names, Array.from({ length: 12 }, (_, index) => `Open photograph ${index + 1}`), 'Source and keyboard order are preserved');
  await page.getByRole('button', { name: 'Open photograph 5', exact: true }).click();
  await page.getByRole('dialog', { name: /The Best/ }).waitFor();
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Open photograph 5');
  assert.deepEqual(errors, []);
  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 1000 } });
  const fallback = await noJS.newPage();
  await fallback.goto(`${origin}/photography/`);
  assert.equal(await fallback.locator('.photo-gallery img').count(), 12);
  assert.equal(await fallback.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Static grid remains usable without JavaScript');
  console.log('Passed continuous masonry lanes without interior holes, resize/repacking, no overlaps, natural proportions, source order, photo modal focus and no-JavaScript fallback.');
} finally { await browser.close(); }
