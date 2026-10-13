import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const origin = new URL(process.env.TEST_URL || 'http://127.0.0.1:3018').origin;
const browser = await chromium.launch();

function emailDetails(href) {
  const email = new URL(href);
  assert.equal(email.protocol, 'mailto:');
  assert.equal(email.pathname, 'wisp@devonlabs.space');
  return { subject: email.searchParams.get('subject'), body: email.searchParams.get('body') };
}

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/shop/`);

  assert.equal(await page.getByRole('heading', { name: 'Hardware & curiosities', exact: true }).count(), 1);
  assert.equal(await page.locator('form, dialog').count(), 0, 'the Shop has no enquiry form or modal');
  assert.equal(await page.locator('#order-request, #contact-me').count(), 0, 'contact is handled directly from item cards');

  const header = emailDetails(await page.getByRole('link', { name: 'Contact me about the shop', exact: true }).getAttribute('href'));
  assert.equal(header.subject, 'Devon Labs enquiry — Shop');
  assert.match(header.body, /Hello Wisp, I’d like to ask about an item in your Shop\./);

  const products = [
    ['After Hours shirt', 'US$24.99'],
    ['Geometric light', 'US$14.99'],
    ['In flight', 'US$14.99'],
  ];
  const productRegion = page.getByRole('region', { name: 'Shirts and prints' });
  assert.equal(await productRegion.locator('article').count(), products.length);
  for (const [name, price] of products) {
    const card = productRegion.locator('article').filter({ has: page.getByRole('heading', { name, exact: true }) });
    assert.match(await card.innerText(), new RegExp(`${price.replace('$', '\\$')}`));
    const details = emailDetails(await card.getByRole('link', { name: `Contact me about ${name}`, exact: true }).getAttribute('href'));
    assert.equal(details.subject, `Devon Labs enquiry — ${name}`);
    assert.match(details.body, new RegExp(`Product: ${name}`));
    assert.match(details.body, new RegExp(`Price: ${price.replace('$', '\\$')}`));
  }

  const shirtBody = emailDetails(await productRegion.getByRole('link', { name: 'Contact me about After Hours shirt', exact: true }).getAttribute('href')).body;
  assert.match(shirtBody, /Requested size:/);
  assert.match(shirtBody, /Quantity:/);
  assert.match(shirtBody, /Delivery province \/ city:/);
  assert.match(shirtBody, /Please confirm sizing, availability, shipping cost and delivery time/);
  assert.doesNotMatch(await page.locator('body').innerText(), /\border(?:ing)?\b/i, 'customer-facing copy avoids order language');

  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(results.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], `Shop accessibility ${theme}`);
  }

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Shop fits ${width}px`);
  }

  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const fallback = await noJS.newPage();
  await fallback.goto(`${origin}/shop/`);
  assert.equal(await fallback.locator('form, dialog').count(), 0);
  assert.equal(await fallback.getByRole('link', { name: 'Contact me about the shop', exact: true }).count(), 1);
  assert.equal(await fallback.locator('a[href^="mailto:"]').count(), 6, 'all shop, merchandise, and photography links render without JavaScript');
  assert.equal(await fallback.locator('.__cf_email__').count(), 0, 'Cloudflare does not cloak guarded direct email links');
  await noJS.close();

  assert.deepEqual(errors, []);
  console.log('Passed Shop cards and prices, merchandise mailto content, no-form layout, Cloudflare-safe links, both-theme accessibility, four widths, and no-JavaScript rendering. No email was sent.');
} finally {
  await browser.close();
}
