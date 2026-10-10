import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = new URL(process.env.TEST_URL || 'http://127.0.0.1:3011/').origin;
const routes = [
  ['About', '/', 'Hello, I’m Wisp.'],
  ['Software', '/software/', 'Software'],
  ['Film', '/film/', 'Film'],
  ['Photography', '/photography/', 'Photography'],
  ['Shop', '/shop/', 'Hardware & curiosities'],
];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  for (const [label, path, title] of routes) {
    await page.goto(`${origin}${path}`);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.getByRole('heading', { level: 1 }).textContent(), title);
    assert.equal(await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).getAttribute('aria-current'), 'page');
    assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).pathname, path);
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label} overflows at ${width}px`);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('navigation').getByRole('link', { name: 'About', exact: true }).click();
  await page.waitForURL(`${origin}/`);
  assert.match(await page.locator('main').innerText(), /Independent developer based in Thailand/);
  assert.match(await page.locator('main').innerText(), /infrastructure you can actually own/);
  assert.equal(await page.locator('main').getByText(/Lorem Ipsum/i).count(), 0);
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Software', exact: true }).click();
  await page.waitForURL(`${origin}/software/`);
  await page.waitForFunction(() => document.querySelector('.portfolio')?.dataset.theme === 'dark');
  assert.equal(await page.locator('.featured-project').count(), 3);
  assert.equal(await page.locator('.more-tools li').count(), 6);
  await page.reload();
  await page.waitForFunction(() => document.querySelector('.portfolio')?.dataset.theme === 'dark');
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Photography', exact: true }).click();
  await page.waitForURL(`${origin}/photography/`);
  assert.equal(await page.locator('.photo-gallery button').count(), 12);
  await page.getByRole('button', { name: 'Original', exact: true }).click();
  assert.equal(await page.locator('.photo-gallery img').first().evaluate(image => getComputedStyle(image).filter), 'none');
  await page.getByRole('button', { name: 'Duotone', exact: true }).click();
  assert.match(await page.locator('.photo-gallery img').first().evaluate(image => getComputedStyle(image).filter), /tone-photography/);
  const opener = page.getByRole('button', { name: 'Open photograph 1', exact: true });
  await opener.click();
  await page.locator('dialog').waitFor({ state: 'visible' });
  await page.locator('.expanded-photo').evaluate(image => image.decode());
  const first = await page.locator('.expanded-photo').getAttribute('src');
  await page.getByRole('button', { name: 'Next photograph', exact: true }).click();
  assert.notEqual(await page.locator('.expanded-photo').getAttribute('src'), first);
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('.expanded-photo').getAttribute('src'), first);
  await page.keyboard.press('Escape');
  await page.locator('dialog').waitFor({ state: 'hidden' });
  assert.equal(await opener.evaluate(button => button === document.activeElement), true);
  await page.getByRole('navigation').getByRole('link', { name: 'Film', exact: true }).click();
  await page.waitForURL(`${origin}/film/`);
  const video = page.locator('video');
  assert.equal(await video.getAttribute('preload'), 'none');
  assert.equal(await video.evaluate(video => video.paused), true);
  await page.getByRole('navigation').getByRole('link', { name: 'Shop', exact: true }).click();
  await page.waitForURL(`${origin}/shop/`);
  assert.equal(await page.getByRole('link', { name: 'Visit 1337 Sheets', exact: false }).getAttribute('href'), 'https://shop.1337sheets.com/');
  await page.getByRole('link', { name: /Explore the workshop/ }).click();
  await page.locator('.room-art').waitFor();
  await page.goBack();
  await page.locator('.portfolio').waitFor();
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflow), 'visible');
  assert.deepEqual(errors, []);
  console.log('Passed: five routes, active navigation, README biography, four widths, theme persistence, original/duotone gallery, modal keyboard/focus, film delivery, and workshop round trip.');
} finally {
  await browser.close();
}
