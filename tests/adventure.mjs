import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:3011');
  const close = () => page.getByRole('button', { name: 'Close', exact: true }).click();
  for (const name of [
    'A lost negative',
    'A spare lens',
    'A good signal',
    'An old archive',
    'A quiet satellite',
    'A little starlight',
  ]) {
    await page.getByRole('button', { name, exact: true }).click();
    await page.getByRole('button', { name: 'Take it', exact: true }).click();
    await page.locator('dialog').waitFor({ state: 'hidden' });
  }
  await page.getByRole('button', { name: 'The projector', exact: true }).click();
  await page.getByRole('button', { name: 'Use a lost negative', exact: true }).click();
  assert.match(await page.getByRole('status').textContent(), /does not fit/);
  await close();
  for (const [name, item] of [
    ['The lightbox', 'a lost negative'],
    ['The projector', 'a spare lens'],
    ['The antenna', 'a good signal'],
  ]) {
    await page.getByRole('button', { name, exact: true }).click();
    await page.getByRole('button', { name: `Use ${item}`, exact: true }).click();
    assert.match(await page.locator('dialog').textContent(), /Brought to life/);
    await close();
  }
  await page.reload();
  await page.getByRole('button', { name: 'Your pockets', exact: true }).click();
  assert.equal(await page.locator('.pocket-items button:enabled').count(), 6);
  await close();
  assert.equal(await page.locator('.room-hotspot.restored').count(), 3);
  assert.equal(await page.locator('.room-hotspot.item').count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Your pockets', exact: true }).click();
  await page.getByRole('button', { name: /A spare lens/ }).click();
  assert.match(await page.locator('.holding').textContent(), /A spare lens/);
  await page.locator('.holding').click();
  assert.equal(await page.locator('.holding').count(), 0);
  await page.getByRole('button', { name: 'The lightbox', exact: true }).focus();
  await page.keyboard.press('Enter');
  assert.match(await page.locator('dialog').textContent(), /Brought to life/);
  await page.keyboard.press('Escape');
  await page.locator('dialog').waitFor({ state: 'hidden' });
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
    'The lightbox'
  );
  console.log(
    'Passed: six pickups, wrong-item rejection, three repairs, persistence, and keyboard focus.'
  );
} finally {
  await browser.close();
}
