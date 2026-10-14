import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

// Rings crossing the date line must be split, including their closing edge.
const mapCountries = JSON.parse(await readFile(new URL('../data/world-countries.json', import.meta.url)));
const eventCoverage = JSON.parse(await readFile(new URL('../data/event-coverage.json', import.meta.url)));
for (const country of mapCountries) {
  for (const ring of country.path.split('Z')) {
    const points = [...ring.matchAll(/[ML]([\d.-]+),([\d.-]+)/g)].map(match => [Number(match[1]), Number(match[2])]);
    for (let i = 0; i < points.length; i++) {
      assert.ok(Math.abs(points[i][0] - points[(i + 1) % points.length][0]) <= 480, `${country.name} crosses the map instead of wrapping at its edge`);
    }
  }
}

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
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  for (const [label, path, title] of routes) {
    await page.goto(`${origin}${path}`);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.getByRole('heading', { level: 1 }).textContent(), title);
    assert.equal(await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).getAttribute('aria-current'), 'page');
    assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).pathname, path);
    assert.equal(await page.locator('meta[name="twitter:title"]').getAttribute('content'), await page.title());
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label} overflows at ${width}px`);
      if (label === 'Shop') assert.equal(await page.locator('h1').evaluate(heading => heading.scrollWidth <= heading.clientWidth && getComputedStyle(heading).whiteSpace === 'nowrap'), true, `Shop title fits one line at ${width}px`);
      if (label === 'Photography') {
        assert.equal(await page.locator('.event-story details, .event-story summary').count(), 0);
        assert.equal(await page.getByRole('heading', { name: 'AM Wedding', exact: true }).count(), 0);
        const ratios = await page.locator('.photo-gallery img, .photo-bundle-images img, .event-coverage-photos img').evaluateAll(async images => {
          // Let responsive sources settle after a viewport change before decoding.
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          await Promise.all(images.map(image => { image.loading = 'eager'; return image.decode(); }));
          // Density-corrected naturalWidth/Height and client sizes round to whole pixels.
          // Compare precise layout against original dimensions verified by the integrity suite.
          return images.map(image => {
            const bounds = image.getBoundingClientRect();
            return Math.abs(bounds.width / bounds.height - Number(image.getAttribute('width')) / Number(image.getAttribute('height')));
          });
        });
        assert.ok(ratios.every(error => error < 0.025), `Photography preserves natural proportions at ${width}px`);
        assert.equal(await page.locator('.photo-gallery').evaluate(element => getComputedStyle(element).display), 'grid');
        assert.equal(await page.locator('.photo-bundle').count(), 3);
        assert.equal(await page.locator('.event-story').count(), eventCoverage.events.length);
        assert.equal(await page.getByRole('navigation', { name: 'Event galleries' }).getByRole('link').count(), eventCoverage.events.length);
        for (const [index, event] of eventCoverage.events.entries()) {
          const story = page.locator('.event-story').nth(index);
          assert.equal(await story.getByRole('heading', { level: 3 }).textContent(), event.title);
          assert.equal(await story.locator('img').count(), event.photos.length);
          assert.equal(await story.locator('.event-coverage-photos').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length), width > 600 ? 3 : 2, 'Event galleries use responsive continuous masonry lanes');
          for (const image of await story.locator('img').all()) assert.equal(await image.isVisible(), true, 'Every event photograph is visible without expanding');
          if (event.source) assert.equal(await story.getByRole('link', { name: 'View the event collection' }).getAttribute('href'), event.source);
          else assert.equal(await story.getByRole('link', { name: 'View the event collection' }).count(), 0);
        }
        assert.match(await page.getByRole('link', { name: 'Enquire about coverage' }).getAttribute('href'), /^mailto:wisp@devonlabs\.space\?subject=Event%20photography%20enquiry$/);
      }
    }
  }
  // Navigation updates route styling without replacing the shared layout DOM.
  await page.evaluate(() => {
    window.layoutNodes = [...document.querySelectorAll('.p-header, main, .p-footer')];
  });
  for (const [label, path, title] of routes) {
    await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();
    await page.waitForURL(`${origin}${path}`);
    await page.getByRole('heading', { level: 1, name: title, exact: true }).waitFor();
    assert.equal(await page.locator('.portfolio').count(), 1);
    assert.equal(await page.locator(`.portfolio.page-${label.toLowerCase()}`).count(), 1);
    assert.equal(await page.getByRole('navigation').locator('[aria-current="page"]').count(), 1);
    assert.equal(await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).getAttribute('aria-current'), 'page');
    assert.equal(await page.evaluate(() => window.layoutNodes.every((node, index) => node === document.querySelectorAll('.p-header, main, .p-footer')[index])), true, 'Shared header, main and footer persist');
  }
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noScript.newPage();
  await staticPage.goto(`${origin}/photography/`);
  assert.equal(await staticPage.locator('.portfolio.page-photography').count(), 1);
  assert.equal(await staticPage.getByRole('navigation').getByRole('link', { name: 'Photography', exact: true }).getAttribute('aria-current'), 'page');
  await noScript.close();
  for (const theme of ['light', 'dark']) {
    for (const [, path] of routes) {
      await page.goto(`${origin}${path}`);
      await page.evaluate(theme => localStorage.setItem('devon-portfolio-theme', theme), theme);
      await page.reload();
      await page.waitForFunction(theme => document.querySelector('.theme-toggle').getAttribute('aria-pressed') === String(theme === 'dark'), theme);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(results.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })), [], `Accessibility: ${path} ${theme}`);
    }
  }
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; localStorage.setItem('devon-portfolio-theme', 'light'); });
  await page.reload();
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
  assert.equal(await page.locator('.origin-status').innerText(), 'Tried');
  assert.equal(await page.getByRole('checkbox').count(), 0);
  await page.evaluate(() => localStorage.setItem('devon-coffee-origins', '["076"]'));
  await page.reload();
  await page.getByLabel('Explore an origin').selectOption('076');
  assert.equal(await page.locator('.origin-status').innerText(), 'Tried');
  assert.equal(await page.locator('.checklist-count').count(), 0);
  for (const gear of ['Hario V60', 'Flair Neo', 'ROKpresso Classic', 'Mischief M40', 'Hario Switch']) assert.equal(await page.getByRole('heading', { name: gear, exact: true }).count(), 1);
  await page.locator('.origin-map path').filter({ has: page.locator('title', { hasText: /^Ethiopia:/ }) }).click();
  assert.equal(await page.locator('.origin-detail h3').innerText(), 'Ethiopia');
  assert.equal(await page.locator('.coffee-photos button').count(), 4);
  assert.equal(await page.locator('#history-title + ul li').count(), 14);
  assert.equal(await page.locator('#history-title + ul li').filter({ hasText: 'Favorite' }).count(), 4);
  assert.deepEqual(await page.locator('#next-title + ul li').allTextContents(), ['Burundi', 'India', 'Yemen']);
  await page.getByLabel('Explore an origin').selectOption('764');
  assert.equal(await page.locator('.origin-status').innerText(), 'Tried · Favorite');
  await page.getByLabel('Explore an origin').selectOption('887');
  assert.equal(await page.locator('.origin-status').innerText(), 'To try next');
  assert.match(await page.locator('.coffee-method-list').innerText(), /20 g \/ 250 ml/);
  assert.equal(await page.locator('.coffee-conversation a[href="https://discord.gg/TVvDd4CUeP"]').count(), 1);
  await page.locator('.coffee-photos img').evaluateAll(images => Promise.all(images.map(image => { image.loading = 'eager'; return image.decode(); })));
  await page.getByRole('button', { name: 'Open coffee photograph 1', exact: true }).click();
  assert.equal(await page.locator('.photo-dialog').evaluate(dialog => dialog.open), true);
  await page.keyboard.press('ArrowRight');
  assert.match(await page.locator('#coffee-photo-title').innerText(), /2 \/ 4/);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('button', { name: 'Open coffee photograph 1', exact: true }).evaluate(button => button === document.activeElement), true);
  assert.equal(await page.locator('.coffee-videos video').count(), 2);
  for (const player of await page.locator('.coffee-videos video').all()) {
    assert.equal(await player.getAttribute('preload'), 'none');
    await player.evaluate(async video => { video.muted = true; await video.play(); });
    await page.waitForFunction(video => video.currentTime > 0, await player.elementHandle());
    assert.equal(await player.evaluate(video => video.videoWidth), 2160);
    await player.evaluate(video => video.pause());
  }
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
  assert.match(await page.locator('.contact-portrait').getAttribute('src'), /generated\/images\/profile-/);
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
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  assert.equal(await page.locator('.featured-project').count(), 6);
  assert.equal(await page.locator('.more-tools li').count(), 3);
  assert.equal(await page.locator('.website-project').count(), 3);
  for (const preview of await page.locator('.website-preview img').all()) assert.equal(await preview.evaluate(image => getComputedStyle(image).filter), 'none');
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Photography', exact: true }).click();
  await page.waitForURL(`${origin}/photography/`);
  assert.equal(await page.locator('.photo-gallery button').count(), 12);
  assert.equal(await page.locator('.photo-gallery img').first().evaluate(image => getComputedStyle(image).filter), 'none');
  assert.equal(await page.getByRole('button', { name: 'Duotone', exact: true }).count(), 0);
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
  assert.equal(await page.locator('.film-story').count(), 2);
  const video = page.getByRole('region', { name: 'The One Camp ’26', exact: true }).locator('video');
  assert.equal(await video.getAttribute('preload'), 'none');
  assert.equal(await video.evaluate(video => video.paused), true);
  await video.evaluate(async video => { video.muted = true; await video.play(); });
  await page.waitForFunction(video => video.currentTime > 0, await video.elementHandle());
  await video.evaluate(video => video.pause());
  const coffeeFilm = page.getByRole('region', { name: 'Home Coffee', exact: true }).locator('video');
  assert.equal(await coffeeFilm.getAttribute('preload'), 'none');
  assert.equal(await coffeeFilm.evaluate(video => video.paused), true);
  await coffeeFilm.evaluate(async video => { video.muted = true; await video.play(); });
  await page.waitForFunction(video => video.currentTime > 0, await coffeeFilm.elementHandle());
  assert.equal(await coffeeFilm.evaluate(video => video.videoWidth), 2160);
  assert.equal(await coffeeFilm.evaluate(video => video.videoHeight), 2880);
  await coffeeFilm.evaluate(video => video.pause());
  await page.getByRole('navigation').getByRole('link', { name: 'Shop', exact: true }).click();
  await page.waitForURL(`${origin}/shop/`);
  assert.equal(await page.locator('.shop-product').count(), 5);
  assert.equal(await page.getByRole('heading', { name: /mug/i }).count(), 0);
  assert.equal(await page.locator('a[href*="1337sheets"], a[href="/workshop/"]').count(), 0);
  for (const image of await page.locator('.shop-products img').all()) assert.equal(await image.evaluate(image => getComputedStyle(image).filter), 'none');
  await page.locator('.shop-products img').evaluateAll(images => Promise.all(images.map(image => { image.loading = 'eager'; return image.decode(); })));
  await page.goto(`${origin}/workshop/`);
  assert.equal(new URL(page.url()).pathname, '/shop/');
  assert.deepEqual(errors, []);
  console.log('Passed: seven routes, contact links, four widths, Work links, published coffee history and favorites, confirmed gear, brew calculator, theme persistence, original-color gallery, website previews, film player, shop title and workshop redirect.');
} finally {
  await browser.close();
}
