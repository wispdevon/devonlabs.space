import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL = process.env.TEST_URL || 'http://127.0.0.1:3011';
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.querySelector('.constellation-field')?.dataset.renderer === 'webgl');
  assert.equal(await page.locator('.constellation-node').count(), 9);
  assert.equal(await page.locator('.constellation-node:visible').count(), 9);
  const canvasPixels = await page.locator('.constellation-field canvas').evaluate(canvas => {
    const sample = document.createElement('canvas');
    sample.width = 256;
    sample.height = 256;
    const context = sample.getContext('2d');
    context.drawImage(canvas, 0, 0, 256, 256);
    const pixels = context.getImageData(0, 0, 256, 256).data;
    let drawn = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) drawn++;
    return drawn;
  });
  assert.ok(canvasPixels > 100, `Canvas should render connection lines and nodes (${canvasPixels} pixels)`);
  const frameBefore = await page.locator('canvas').evaluate(canvas => canvas.toDataURL());
  await page.waitForTimeout(800);
  assert.notEqual(await page.locator('canvas').evaluate(canvas => canvas.toDataURL()), frameBefore, 'Constellation should animate');
  assert.match(await page.title(), /Devon Labs/);
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://devonlabs.space/');
  assert.equal(await page.locator('.portrait-link img').evaluate(image => image.naturalWidth > 0), true);
  if (process.env.SCREENSHOT_DIR) {
    await mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/desktop.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Explore HeadshotFlow', exact: true }).click();
  assert.equal(await page.locator('#inspector-title').innerText(), 'HeadshotFlow');
  await page.locator('.inspector-image img').evaluate(image => image.decode());
  assert.equal(await page.locator('.inspector-source').getAttribute('href'), 'https://github.com/wispdevon/GibbonPfp');
  await page.getByRole('button', { name: 'Next project', exact: true }).click();
  assert.equal(await page.locator('#inspector-title').innerText(), 'Immichinko');
  await page.locator('.inspector-related').getByRole('button', { name: 'Quester', exact: false }).click();
  assert.equal(await page.locator('#inspector-title').innerText(), 'Quester');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.project-inspector').count(), 0);
  await page.getByRole('button', { name: 'Pause motion' }).click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);
  const pausedFrame = await page.locator('canvas').evaluate(canvas => canvas.toDataURL());
  await page.waitForTimeout(250);
  assert.equal(await page.locator('canvas').evaluate(canvas => canvas.toDataURL()), pausedFrame, 'Pause should stop animation');
  await page.getByRole('button', { name: 'Resume motion' }).click();
  const firstNode = page.getByRole('button', { name: 'Explore HeadshotFlow', exact: true });
  const initialBox = await firstNode.boundingBox();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.waitForTimeout(100);
  assert.notEqual((await firstNode.boundingBox()).x, initialBox.x, 'Zoom should change node positions');
  await page.getByRole('button', { name: 'Reset constellation' }).click();
  const canvasBox = await page.locator('canvas').boundingBox();
  await page.mouse.move(canvasBox.x + 20, canvasBox.y + 80);
  const beforeDrag = await firstNode.boundingBox();
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + 150, canvasBox.y + 140, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  assert.notEqual((await firstNode.boundingBox()).x, beforeDrag.x, 'Dragging should rotate the scene');
  await page.getByRole('button', { name: 'Reset constellation' }).click();
  await page.locator('.filters').getByRole('button', { name: 'Photography', exact: true }).click();
  assert.equal(await page.locator('.constellation-node:not([disabled])').count(), 4);
  assert.equal(await page.locator('.constellation-node').count(), 9, 'Every project remains in the constellation');
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await page.getByRole('button', { name: 'List view' }).click();
  assert.equal(await page.locator('.project-row').count(), 9);
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
  }
  await page.getByRole('button', { name: 'Constellation view' }).click();
  await page.waitForFunction(() => document.querySelector('.constellation-field')?.dataset.renderer === 'webgl');
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    await page.getByRole('button', { name: 'Reset constellation' }).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Constellation overflow at ${width}px`);
    assert.equal(await page.locator('.constellation-node:visible').count(), 9, `All nine nodes are in frame at ${width}px`);
    const bounds = await page.locator('.constellation-node').evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { x: box.x, y: box.y, right: box.right, bottom: box.bottom };
    }));
    for (const box of bounds) assert.ok(box.x >= 0 && box.right <= width, `Node must fit horizontally at ${width}px`);
    for (let i = 0; i < bounds.length; i++) for (let j = i + 1; j < bounds.length; j++) {
      const a = bounds[i], b = bounds[j];
      const overlapX = Math.min(a.right, b.right) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
      assert.ok(overlapX <= 0 || overlapY <= 0, `Project labels overlap at ${width}px: ${i} and ${j}`);
    }
    if (process.env.SCREENSHOT_DIR && width === 390) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/mobile.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Explore HeadshotFlow', exact: true }).click();
  assert.equal(await page.locator('#inspector-title').innerText(), 'HeadshotFlow');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/mobile-details.png`, fullPage: true });
  await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(100);
  const reducedFrame = await page.locator('canvas').evaluate(canvas => canvas.toDataURL());
  await page.waitForTimeout(200);
  assert.equal(await page.locator('canvas').evaluate(canvas => canvas.toDataURL()), reducedFrame, 'Reduced motion should disable automatic movement');
  await page.locator('canvas').evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForFunction(() => document.querySelector('.constellation-field')?.dataset.renderer === 'fallback');
  assert.equal(await page.getByRole('button', { name: 'Zoom in', exact: true }).isDisabled(), true);
  assert.equal(await page.locator('.constellation-node:visible').count(), 9);
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.skip-link').evaluate(element => element === document.activeElement), true);
  for (const link of await page.locator('a[href^="https://github.com/wispdevon/"]').evaluateAll(links => links.map(link => link.href))) assert.match(link, /^https:\/\/github\.com\/wispdevon\//);
  assert.deepEqual(errors, []);
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mobile.goto(baseURL, { waitUntil: 'networkidle' });
  await mobile.waitForFunction(() => document.querySelector('.constellation-field')?.dataset.renderer === 'webgl');
  const mobileCanvas = await mobile.locator('canvas').boundingBox();
  const touch = await mobile.context().newCDPSession(mobile);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: mobileCanvas.x + 5, y: mobileCanvas.y + 230 }] });
  for (let step = 1; step <= 5; step++) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: mobileCanvas.x + 5, y: mobileCanvas.y + 230 - step * 25 }] });
    await mobile.waitForTimeout(30);
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await mobile.waitForTimeout(200);
  assert.ok(await mobile.evaluate(() => scrollY) > 0, 'Touch gestures on the canvas should allow page scrolling');
  await mobile.getByRole('button', { name: 'Explore HeadshotFlow', exact: true }).tap();
  assert.equal(await mobile.locator('#inspector-title').innerText(), 'HeadshotFlow');
  await mobile.getByRole('button', { name: 'Close project', exact: true }).tap();
  assert.equal(await mobile.locator('.project-inspector').count(), 0);
  await mobile.getByRole('button', { name: 'Zoom in', exact: true }).tap();
  await mobile.getByRole('button', { name: 'Reset constellation', exact: true }).tap();
  await mobile.close();
  const fallback = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl' || type === 'webgl2') return null;
      return original.call(this, type, ...args);
    };
  });
  await fallback.goto(baseURL, { waitUntil: 'networkidle' });
  await fallback.waitForFunction(() => document.querySelector('.constellation-field')?.dataset.renderer === 'fallback');
  assert.equal(await fallback.locator('.constellation-node:visible').count(), 9);
  await fallback.getByRole('button', { name: 'Explore Strider', exact: true }).click();
  assert.equal(await fallback.locator('#inspector-title').innerText(), 'Strider');
  await fallback.close();
  console.log('Passed: WebGL pixel rendering, animation/pause, drag, zoom/reset, all project nodes, related-project navigation, mobile taps and scrolling, reduced motion, context loss and no-WebGL fallback, list search/filter/preview, keyboard entry, metadata, and four viewport widths.');
} finally {
  await browser.close();
}
