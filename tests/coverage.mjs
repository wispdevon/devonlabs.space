import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const origin = new URL(process.env.TEST_URL || 'http://127.0.0.1:3011').origin;
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/shop/`);
  for (const [name, price, duration, count] of [['Short Coverage', 'THB 2,000', '90 minutes', 75], ['Extended Coverage', 'THB 4,000', '3 hours', 150]]) {
    const trigger = page.getByRole('button', { name: `View ${name} details`, exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name, exact: true });
    await dialog.waitFor();
    assert.match(await dialog.innerText(), new RegExp(`${price}.*${duration}`, 's'));
    assert.match(await dialog.innerText(), new RegExp(`${count} edited photos minimum`));
    assert.match(await dialog.innerText(), /1–3 calendar days after the shoot/);
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(axe.violations.map(v => v.id), [], `${name} ${theme} accessibility`);
    }
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(label => document.activeElement?.getAttribute('aria-label') === label, `View ${name} details`);
    assert.equal(await trigger.evaluate(e => e === document.activeElement), true);
    await trigger.click();
    await dialog.getByRole('button', { name: 'Request coverage', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(name => document.querySelector(`input[name="product"][value="${name}"]`)?.checked, name === 'Short Coverage' ? 'coverage-short' : 'coverage-extended');
    assert.equal(await page.getByRole('radio', { name, exact: true }).isChecked(), true);
    assert.equal(await page.locator('#order-size, #order-quantity, #order-province, #order-country').count(), 0);
    await page.getByLabel('Your name').fill('Test Photographer');
    await page.getByLabel('Reply email').fill('test@example.com');
    await page.getByRole('button', { name: 'Prepare order email' }).click();
    assert.equal(await page.locator('.order-preview').count(), 0, 'Coverage date and location are required');
    await page.getByLabel('Preferred shoot date').fill('2026-12-12');
    await page.getByLabel('Shoot location').fill('Rawai, Phuket');
    await page.getByRole('button', { name: 'Prepare order email' }).click();
    const draft = new URL(await page.getByRole('link', { name: 'Open email draft' }).getAttribute('href'));
    const body = draft.searchParams.get('body');
    assert.ok(body.includes(`Product: ${name}`));
    assert.ok(body.includes(`Unit price: ${price}`));
    assert.ok(body.includes(`Minimum edited photos: ${count}`));
    assert.match(body, /Preferred shoot date: 2026-12-12\nShoot location: Rawai, Phuket/);
    assert.doesNotMatch(body, /US\$|shipping|Digital file by email/);
  }
  await page.getByRole('radio', { name: 'After Hours shirt', exact: true }).check();
  assert.equal(await page.locator('#order-date, #order-location').count(), 0);
  assert.equal(await page.locator('.order-preview').count(), 0);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.getByRole('button', { name: 'View Short Coverage details', exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Coverage fits ${width}px`);
    await page.keyboard.press('Escape');
  }
  await page.goto(`${origin}/photography/`);
  const offers = page.getByRole('region', { name: 'Photography packages' });
  assert.match(await offers.innerText(), /THB 2,000.*75 edited photos.*THB 4,000.*150 edited photos/s);
  assert.match(await offers.innerText(), /1–3 calendar days/);
  assert.deepEqual(errors, []);
  console.log('Passed package modals, both currencies, enquiry selection and validation, guarantees, focus, accessibility, four widths and Photography links. No email sent.');
} finally { await browser.close(); }
