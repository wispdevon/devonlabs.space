import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import sharp from 'sharp';
const manifest = JSON.parse(await readFile('data/image-manifest.json'));
for (const [source, image] of Object.entries(manifest)) {
  const original = await sharp(`public${source}`).metadata();
  assert.equal(image.width, original.width);
  assert.equal(image.height, original.height);
  const sizes = source.startsWith('/photography/events/') ? [320, 400, 640, 960, 1600] : [320, 640, 960, 1600];
  assert.deepEqual(image.variants.map(item => item.width), [...new Set(sizes.map(width => Math.min(width, original.width)))]);
  for (const variant of image.variants) {
    assert.match(variant.src, /-[a-f0-9]{16}\.webp$/);
    const file = `public${variant.src}`;
    const actual = await sharp(file).metadata();
    assert.equal(actual.width, variant.width);
    assert.equal(actual.height, variant.height);
    assert.equal((await stat(file)).size, variant.bytes);
  }
}
for (const file of ['data/workshop-media.json', 'data/coffee-media.json']) {
  const media = JSON.parse(await readFile(file));
  for (const photo of media.photos) assert.ok(manifest[photo.image], `${photo.image} has responsive variants`);
  for (const video of media.videos ?? []) if (video.original && !video.src.startsWith('https://')) assert.equal((await stat(`public${video.src}`)).size, video.bytes, 'Original video preserves uploaded size');
  for (const video of media.videos ?? []) for (const source of [video.src, video.poster]) if (!source.startsWith('https://')) await stat(`public${source}`); else assert.equal(new URL(source).hostname, 'im.devonlabs.space');
}
const countries = JSON.parse(await readFile('data/world-countries.json'));
const bundles = JSON.parse(await readFile('data/photography-bundles.json'));
const coverage = JSON.parse(await readFile('data/event-coverage.json'));
assert.ok(coverage.events.length >= 2, 'Event coverage tells multiple event stories');
assert.equal(new Set(coverage.events.map(event => event.id)).size, coverage.events.length);
for (const event of coverage.events) {
  assert.match(event.albumId, /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/, 'Each event records its source album');
  if (event.source) assert.ok(['im.devonlabs.space', 'photo.devonlabs.space'].includes(new URL(event.source).hostname));
  assert.ok(Number.isFinite(Date.parse(event.date)));
  assert.ok(event.photos.length >= 3, `${event.title} has a cohesive gallery`);
  assert.equal(new Set(event.photos.map(photo => photo.id)).size, event.photos.length);
  for (const photo of event.photos) {
    assert.ok(manifest[photo.image], `${photo.image} has responsive variants`);
    assert.equal(manifest[photo.image].width, photo.width);
    assert.equal(manifest[photo.image].height, photo.height);
    assert.ok(photo.alt && photo.caption, 'Event photographs have descriptive text');
  }
}
assert.ok(manifest['/shop/after-hours-shirt.webp'], 'Shirt preview has responsive variants');
for (const bundle of bundles) {
  assert.equal(new URL(bundle.url).hostname, 'photo.devonlabs.space');
  assert.ok(Number.isFinite(Date.parse(bundle.publishedAt)));
  for (const photo of bundle.photos) assert.ok(manifest[photo.image], `${photo.image} has responsive variants`);
}
assert.equal(new Set(countries.map(item => item.id)).size, countries.length);
for (const country of countries) for (const ring of country.path.split('Z')) {
  const points = [...ring.matchAll(/[ML]([\d.-]+),([\d.-]+)/g)].map(match => Number(match[1]));
  for (let i = 0; i < points.length; i++) assert.ok(Math.abs(points[i] - points[(i + 1) % points.length]) <= 480, `${country.name} wraps at date line`);
}
console.log('Passed image manifest, dimensions, no upscaling, media files, and map geometry integrity.');
