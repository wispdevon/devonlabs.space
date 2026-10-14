import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const origin = new URL(process.env.TEST_URL || 'http://127.0.0.1:3011').origin;
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

  assert.equal(await page.locator('form, dialog').count(), 0, 'coverage is shown as direct-contact cards');
  const cards = page.getByRole('region', { name: 'Photography coverage' }).locator('.coverage-product');
  assert.equal(await cards.count(), 2);

  for (const [id, name, price, duration, count] of [
    ['coverage-short', 'Short Coverage', 'THB 2,000', '90 minutes', 75],
    ['coverage-extended', 'Extended Coverage', 'THB 4,000', '3 hours', 150],
  ]) {
    const card = page.locator(`#${id}`);
    assert.equal(await card.getByRole('heading', { name, exact: true }).count(), 1);
    assert.match(await card.innerText(), new RegExp(`${price}.*${duration}`, 's'));
    assert.match(await card.innerText(), new RegExp(`${count} edited photos minimum`));
    assert.match(await card.innerText(), /Minimum 50 edited photos per hour guaranteed/);
    assert.match(await card.innerText(), /Guaranteed delivery within 1–3 calendar days after the shoot/);
    assert.equal(await card.locator('.product-description').count(), 0, 'package descriptions are omitted for a compact card');

    const contact = card.getByRole('link', { name: `Contact me about ${name}`, exact: true });
    const details = emailDetails(await contact.getAttribute('href'));
    assert.equal(details.subject, `Devon Labs enquiry — ${name}`);
    assert.ok(details.body.includes(`Package: ${name}`));
    assert.ok(details.body.includes(`Price: ${price}`));
    assert.ok(details.body.includes(`Duration: ${duration}`));
    assert.ok(details.body.includes(`Minimum edited photos: ${count}`));
    assert.match(details.body, /Minimum 50 edited photos per hour guaranteed/);
    assert.match(details.body, /Guaranteed delivery within 1–3 calendar days after the shoot/);
    assert.match(details.body, /Preferred shoot date:/);
    assert.match(details.body, /Shoot location:/);

    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(results.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], `${name} accessibility ${theme}`);
    }
  }

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Coverage cards fit ${width}px`);
  }

  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const fallback = await noJS.newPage();
  await fallback.goto(`${origin}/shop/`);
  assert.equal(await fallback.locator('form, dialog').count(), 0);
  assert.equal(await fallback.getByRole('link', { name: 'Contact me about Short Coverage', exact: true }).count(), 1);
  assert.equal(await fallback.getByRole('link', { name: 'Contact me about Extended Coverage', exact: true }).count(), 1);
  assert.equal(await fallback.locator('.__cf_email__').count(), 0, 'Cloudflare does not cloak guarded direct email links');
  await noJS.close();

  await page.goto(`${origin}/photography/`);
  const offers = page.getByRole('region', { name: 'Photography packages' });
  assert.match(await offers.innerText(), /THB 2,000.*75 edited photos.*THB 4,000.*150 edited photos/s);
  assert.match(await offers.innerText(), /1–3 calendar days/);
  assert.deepEqual(errors, []);
  console.log('Passed photography prices and terms, compact direct-contact cards, mailto content, both-theme accessibility, four widths, no-JavaScript rendering, and Photography page links. No email was sent.');
} finally {
  await browser.close();
}
