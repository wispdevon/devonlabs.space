import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = new URL(process.env.TEST_URL || 'http://127.0.0.1:3011/').origin;
const gallery = JSON.parse(await readFile(new URL('../data/workshop-media.json', import.meta.url)));
const coffee = JSON.parse(await readFile(new URL('../data/coffee-media.json', import.meta.url)));
const browser = await chromium.launch();
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [path, selector, photos] of [
      ['/photography/', '.photo-gallery button', gallery.photos],
      ['/coffee/', '.coffee-photos button', coffee.photos],
    ]) {
      await page.goto(`${origin}${path}`);
      const buttons = page.locator(selector);
      const dialog = page.locator('.photo-dialog');
      assert.equal(await buttons.count(), photos.length);
      for (let index = 0; index < photos.length; index++) {
        const opener = buttons.nth(index);
        await opener.click();
        await dialog.waitFor({ state: 'visible' });
        const expanded = dialog.locator('.expanded-photo');
        assert.equal(await expanded.getAttribute('src'), photos[index].image, 'Thumbnail opens its paired original');
        assert.equal(await expanded.getAttribute('alt'), await opener.locator('img').getAttribute('alt'));
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
        assert.equal(await opener.evaluate(button => button === document.activeElement), true, 'Escape restores opener focus');
      }

      // Some platforms activate pointer-clicked buttons without focusing them.
      await page.getByRole('button', { name: 'Dark mode', exact: true }).focus();
      await buttons.nth(1).evaluate(button => button.addEventListener('mousedown', event => event.preventDefault(), { once: true }));
      await buttons.nth(1).click();
      await dialog.waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      await page.waitForFunction(button => button === document.activeElement, await buttons.nth(1).elementHandle(), { timeout: 2000 });
      assert.equal(await buttons.nth(1).evaluate(button => button === document.activeElement), true, 'Pointer activation restores the actual opener even when it was not focused');

      await buttons.first().click();
      await dialog.waitFor({ state: 'visible' });
      await page.keyboard.press('ArrowLeft');
      assert.equal(await dialog.locator('.expanded-photo').getAttribute('src'), photos.at(-1).image, 'Previous wraps to last');
      await page.keyboard.press('ArrowRight');
      assert.equal(await dialog.locator('.expanded-photo').getAttribute('src'), photos[0].image, 'Next wraps to first');
      await dialog.getByRole('button', { name: 'Next photograph', exact: true }).click();
      assert.equal(await dialog.locator('.expanded-photo').getAttribute('src'), photos[1].image);
      await dialog.getByRole('button', { name: 'Previous photograph', exact: true }).click();
      assert.equal(await dialog.locator('.expanded-photo').getAttribute('src'), photos[0].image);
      await dialog.getByRole('button', { name: 'Close', exact: false }).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(await buttons.first().evaluate(button => button === document.activeElement), true, 'Close restores opener focus');

      const navigation = page.getByRole('navigation', { name: 'Main navigation' });
      await navigation.getByRole('link', { name: 'Software', exact: true }).click();
      await page.waitForURL(`${origin}/software/`);
      assert.equal(await page.locator('dialog[open]').count(), 0, 'Navigation leaves no open viewer');
      await navigation.getByRole('link', { name: path === '/coffee/' ? 'Coffee' : 'Photography', exact: true }).click();
      await page.waitForURL(`${origin}${path}`);
      await buttons.last().click();
      await dialog.waitFor({ state: 'visible' });
      assert.equal(await dialog.locator('.expanded-photo').getAttribute('src'), photos.at(-1).image, 'Viewer reopens after client navigation');
      await page.keyboard.press('Escape');
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noScript.newPage();
  await staticPage.goto(`${origin}/coffee/`);
  assert.equal(await staticPage.locator('.coffee-videos video').count(), coffee.videos.length, 'Coffee videos are server rendered');
  for (const [index, video] of coffee.videos.entries()) {
    const player = staticPage.locator('.coffee-videos video').nth(index);
    assert.equal(await player.getAttribute('preload'), 'none');
    assert.equal(await player.locator('source').getAttribute('src'), video.src);
    assert.equal(await player.locator('a').getAttribute('href'), video.src);
  }
  await noScript.close();
  console.log('Passed: both photo viewers at mobile/desktop widths, every thumbnail/original pairing, reopening, wraparound, arrow keys, buttons, Escape, focus restoration, and route cleanup.');
} finally {
  await browser.close();
}
