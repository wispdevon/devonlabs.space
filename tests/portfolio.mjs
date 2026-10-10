import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = new URL(process.env.TEST_URL || 'http://127.0.0.1:3011/').origin;
const routes = [
  ['About', '/', 'Hello, I’m Wisp.'],
  ['Work', '/work/', 'Work'],
  ['Software', '/software/', 'Software'],
  ['Film', '/film/', 'Film'],
  ['Photography', '/photography/', 'Photography'],
  ['Coffee', '/coffee/', 'Coffee'],
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
      if (label === 'Shop') assert.equal(await page.locator('h1').evaluate(heading => heading.scrollWidth <= heading.clientWidth && getComputedStyle(heading).whiteSpace === 'nowrap'), true, `Shop title fits one line at ${width}px`);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('navigation').getByRole('link', { name: 'Work', exact: true }).click();
  await page.waitForURL(`${origin}/work/`);
  assert.equal(await page.locator('.work-entry').count(), 5);
  assert.equal(await page.locator('.work-entry a[href="/software/"]').count(), 1);
  assert.equal(await page.locator('.work-contact a').getAttribute('href'), 'mailto:wisp@devonlabs.space');
  assert.equal(await page.locator('.work-contact .__cf_email__').count(), 0);
  await page.getByRole('navigation').getByRole('link', { name: 'Coffee', exact: true }).click();
  await page.waitForURL(`${origin}/coffee/`);
  await page.getByLabel('Explore an origin').selectOption('076');
  assert.equal(await page.locator('.origin-detail h3').innerText(), 'Brazil');
  assert.equal(await page.locator('.origin-status').innerText(), 'To try');
  await page.getByRole('checkbox', { name: 'Brazil', exact: true }).check();
  assert.equal(await page.locator('.origin-status').innerText(), 'Checked off');
  assert.match(await page.locator('.checklist-count').innerText(), /1 \/ 25/);
  await page.reload();
  assert.equal(await page.getByRole('checkbox', { name: 'Brazil', exact: true }).isChecked(), true);
  await page.getByRole('checkbox', { name: 'Brazil', exact: true }).uncheck();
  assert.match(await page.locator('.checklist-count').innerText(), /0 \/ 25/);
  for (const gear of ['Hario V60', 'Flair Neo', 'ROKpresso Classic', 'Mischief M40', 'Hario Switch']) assert.equal(await page.getByRole('heading', { name: gear, exact: true }).count(), 1);
  await page.locator('.origin-map path').filter({ has: page.locator('title', { hasText: /^Ethiopia$/ }) }).click();
  assert.equal(await page.locator('.origin-detail h3').innerText(), 'Ethiopia');
  assert.equal(await page.locator('.coffee-media-placeholder').count(), 2);
  assert.equal(await page.locator('.coffee-conversation a[href^="mailto:wisp@devonlabs.space"]').count(), 1);
  const dose = page.getByLabel('Coffee dose', { exact: false });
  const ratio = page.getByLabel('Ratio', { exact: false });
  await dose.fill('20');
  await ratio.fill('17');
  assert.match(await page.locator('output').innerText(), /340/);
  await dose.fill('');
  assert.match(await page.locator('output').innerText(), /Enter a dose/);
  await dose.fill('18');
  await ratio.fill('16');
  assert.match(await page.locator('output').innerText(), /288/);
  await page.getByRole('navigation').getByRole('link', { name: 'About', exact: true }).click();
  await page.waitForURL(`${origin}/`);
  assert.match(await page.locator('main').innerText(), /Independent developer based in Thailand/);
  assert.match(await page.locator('main').innerText(), /infrastructure you can actually own/);
  assert.equal(await page.locator('main').getByText(/Lorem Ipsum/i).count(), 0);
  assert.equal(await page.locator('.working-with li svg').count(), 6);
  assert.equal(await page.locator('.find-me a').count(), 5);
  assert.equal(await page.locator('.find-me a[href="https://bsky.app/profile/wispdevon.bsky.social"]').count(), 1);
  assert.equal(await page.locator('.contact-portrait').getAttribute('src'), '/developer/profile.jpg');
  await page.locator('.contact-portrait').evaluate(image => { image.loading = 'eager'; return image.decode(); });
  assert.equal(await page.locator('.find-me a[href="https://github.com/wispdevon"]').count(), 1);
  assert.equal(await page.locator('.find-me a[href="https://www.last.fm/user/wisp-"]').count(), 1);
  assert.equal(await page.locator('.find-me a[href="https://discord.com/channels/@me"]').count(), 1);
  assert.equal(await page.locator('.find-me a[href="mailto:wisp@devonlabs.space"]').count(), 1);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copy Discord username wispcream' }).click();
  await page.getByRole('status').getByText('Username copied').waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'wispcream');
  assert.equal(await page.locator('nav').evaluate(element => getComputedStyle(element).flexDirection), 'column');
  const introduction = await page.locator('.about-introduction').boundingBox();
  const photograph = await page.locator('.about-photo').boundingBox();
  assert.ok(photograph.y >= introduction.y + introduction.height, 'About photo follows the introduction vertically');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('main').evaluate(element => getComputedStyle(element).animationName), 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
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
  assert.equal(await page.locator('.shop-product').count(), 4);
  assert.equal(await page.locator('a[href*="1337sheets"], a[href="/workshop/"]').count(), 0);
  await page.locator('.shop-products img').evaluateAll(images => Promise.all(images.map(image => { image.loading = 'eager'; return image.decode(); })));
  await page.goto(`${origin}/workshop/`);
  assert.equal(new URL(page.url()).pathname, '/shop/');
  assert.deepEqual(errors, []);
  console.log('Passed: seven routes, contact links, four widths, Work links, coffee map/checklist persistence, confirmed gear, brew calculator, theme persistence, gallery controls, film player, shop title and workshop redirect.');
} finally {
  await browser.close();
}
