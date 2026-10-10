import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.env.TEST_URL || 'http://127.0.0.1:3011';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const locations = {
  negative: [-2.2, 8],
  lens: [-6, 5],
  signal: [6, 3],
  lightbox: [-18, 1],
  projector: [-12, 19],
  antenna: [14, 20],
  rover: [4, 8],
  GibbonPfp: [-17, -11],
};
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.setDefaultTimeout(30000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
const position = async () =>
  (await page.locator('.world').getAttribute('data-position')).split(',').map(Number);
const progress = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem('devon-workshop-v1') || '{}'));
async function look(id) {
  const [x, , z] = await position();
  const [tx, tz] = locations[id];
  const desired = Math.atan2(tx - x, z - tz);
  for (let i = 0; i < 3; i++) {
    const [yaw, pitch] = (await page.locator('.world').getAttribute('data-view'))
      .split(',')
      .map(Number);
    const delta = Math.atan2(Math.sin(desired - yaw), Math.cos(desired - yaw));
    if (Math.abs(delta) < 0.015 && Math.abs(pitch + 0.07) < 0.015) break;
    await page.mouse.move(720, 475);
    await page.mouse.down();
    await page.mouse.move(
      720 + Math.max(-2.4, Math.min(2.4, delta)) / 0.004,
      475 + (pitch + 0.07) / 0.003,
      { steps: 4 }
    );
    await page.mouse.up();
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(200);
}
async function clickObject(id) {
  await look(id);
  const projected = JSON.parse(await page.locator('.world').getAttribute('data-hotspots')).find(
    (item) => item.id === id
  );
  assert.equal(projected?.visible, true, `${id} is visibly framed in first person`);
  await page.mouse.move(projected.x, projected.y);
  await page.mouse.click(projected.x, projected.y);
  console.log(
    'Clicked',
    id,
    'at',
    projected.x.toFixed(0),
    projected.y.toFixed(0),
    'walking:',
    await page.locator('.world').getAttribute('data-walking')
  );
}
async function take(id) {
  await clickObject(id);
  await page.getByRole('button', { name: 'Take it', exact: true }).waitFor();
  assert.equal(
    (await progress()).discoveries?.includes(id) || false,
    false,
    'Inspecting alone does not collect'
  );
  await page.getByRole('button', { name: 'Take it', exact: true }).click();
  await page.waitForFunction(
    (id) => JSON.parse(localStorage.getItem('devon-workshop-v1') || '{}').discoveries?.includes(id),
    id
  );
  console.log(`Collected ${id} through a real 3D click and explicit pickup.`);
}
async function hold(name) {
  await page.getByRole('button', { name: 'Open inventory' }).click();
  await page
    .locator('.pocket-items')
    .getByRole('button', { name: new RegExp(name) })
    .click();
  assert.equal(await page.locator('.held-item').isVisible(), true);
}
try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => document.querySelector('.world')?.dataset.camera === 'first-person'
  );
  await page.waitForTimeout(700);
  const origin = await position();
  await page.mouse.click(720, 700);
  await page.waitForFunction(() => document.querySelector('.world')?.dataset.walking === 'true');
  await page.waitForFunction(() => document.querySelector('.world')?.dataset.walking === 'false');
  const arrived = await position();
  assert.ok(
    Math.hypot(arrived[0] - origin[0], arrived[2] - origin[2]) > 1,
    'Ground clicks walk to a real destination'
  );
  await page.getByRole('button', { name: 'Return to entrance', exact: true }).click();
  await page.waitForTimeout(300);
  await take('negative');
  await hold('A lost negative');
  await clickObject('projector');
  await page.getByText('That does not fit here.', { exact: true }).waitFor();
  assert.equal((await progress()).repaired.length, 0, 'Wrong item cannot solve the puzzle');
  await page.getByRole('button', { name: 'Put item away' }).click();
  await take('lens');
  await take('signal');
  for (const [puzzle, name] of [
    ['lightbox', 'A lost negative'],
    ['projector', 'A spare lens'],
    ['antenna', 'A good signal'],
  ]) {
    await hold(name);
    await clickObject(puzzle);
    await page.waitForFunction(
      (id) => JSON.parse(localStorage.getItem('devon-workshop-v1') || '{}').repaired?.includes(id),
      puzzle
    );
    assert.equal(await page.locator('.held-item').count(), 0);
    console.log(`Repaired ${puzzle} by approaching and using an inventory object.`);
  }
  if (process.env.SCREENSHOT_DIR) {
    await mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/adventure-repaired.png` });
    await page.getByRole('button', { name: 'Open inventory' }).click();
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/inventory.png` });
  }
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => document.querySelector('.world')?.dataset.camera === 'first-person'
  );
  assert.equal((await progress()).repaired.length, 3, 'Repairs persist');
  await page.getByRole('button', { name: 'Open inventory' }).click();
  assert.equal(await page.locator('.pocket-items > button:not(:disabled)').count(), 3);
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page.getByRole('button', { name: 'Return to entrance', exact: true }).click();
  await page.waitForTimeout(300);
  await clickObject('rover');
  await page.getByRole('heading', { name: 'The little rover', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await clickObject('GibbonPfp');
  await page.getByRole('heading', { name: 'HeadshotFlow', exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'Passed: first-person drag-to-look, click-to-approach, explicit pickups, inventory selection, wrong-item rejection, all three repairs, persistence, parked-rover inspection, and direct 3D project entry.'
  );
} catch (error) {
  console.log(
    'Adventure failure position:',
    await position(),
    'state:',
    await progress(),
    'body:',
    await page.locator('body').innerText()
  );
  await page.screenshot({ path: '/tmp/devon-adventure-failure.png' });
  throw error;
} finally {
  await browser.close();
}
