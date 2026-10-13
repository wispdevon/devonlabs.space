import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import sharp from 'sharp';
import { refreshPhotographyBundles } from '../scripts/refresh-photography-bundles.mjs';

const feedUrl = 'https://photo.devonlabs.space/rss/';

function xml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function feedItem({ title, date, slug, postUrl = `https://photo.devonlabs.space/${slug}/`, description = '', content = '' }) {
  return `<item><title>${xml(title)}</title><link>${xml(postUrl)}</link><pubDate>${date}</pubDate><description><![CDATA[${description}]]></description>${content ? `<content:encoded><![CDATA[${content}]]></content:encoded>` : ''}</item>`;
}

function feed(...items) {
  return `<?xml version="1.0"?><rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>${items.join('')}</channel></rss>`;
}

function imageMarkup(...images) {
  return images.map(({ src, alt = '' }) => `<figure><img src="${src}" alt="${alt}"></figure>`).join('');
}

function response(status, body) {
  return new Response(body, { status });
}

function fetchFixture({ feedBody, feedStatus = 200, assets = {} }) {
  const calls = [];
  const fetchImpl = async input => {
    const url = String(input);
    calls.push(url);
    if (url === feedUrl) return response(feedStatus, feedBody ?? '');
    return Object.hasOwn(assets, url) ? response(200, assets[url]) : response(404, 'missing fixture');
  };
  return { fetchImpl, calls };
}

async function makeImage(width, height, color) {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  }).jpeg().toBuffer();
}

async function makeWorkspace(t, { withFallback = false } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'photography-bundles-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const snapshotPath = path.join(root, 'data', 'photography-bundles.json');
  const bundleDirectory = path.join(root, 'public', 'photography', 'bundles');
  if (!withFallback) return { root, snapshotPath, bundleDirectory };

  await mkdir(path.dirname(snapshotPath), { recursive: true });
  await mkdir(bundleDirectory, { recursive: true });
  const fallbackImage = await makeImage(96, 64, { r: 80, g: 110, b: 150 });
  await writeFile(path.join(bundleDirectory, 'previous.webp'), await sharp(fallbackImage).webp().toBuffer());
  const fallback = [{
    title: 'Previous story',
    url: 'https://photo.devonlabs.space/previous-story/',
    publishedAt: 'Fri, 24 Apr 2026 16:51:01 GMT',
    photos: [{
      image: '/photography/bundles/previous.webp',
      source: 'https://images.example/previous.jpg',
      alt: 'A previous photograph',
    }],
  }];
  const snapshot = `${JSON.stringify(fallback, null, 2)}\n`;
  await writeFile(snapshotPath, snapshot);
  return { root, snapshotPath, bundleDirectory, snapshot };
}

test('refreshes the newest three image stories and stores every unique image without a three-photo limit', async t => {
  const { root, snapshotPath, bundleDirectory } = await makeWorkspace(t);
  await mkdir(bundleDirectory, { recursive: true });
  const staleGeneratedFilename = 'photo-00000000000000000000.webp';
  await writeFile(path.join(bundleDirectory, staleGeneratedFilename), await sharp(await makeImage(64, 48, { r: 90, g: 110, b: 130 })).webp().toBuffer());
  await writeFile(path.join(bundleDirectory, 'curated-original.jpg'), await makeImage(64, 48, { r: 140, g: 120, b: 100 }));
  const large = await makeImage(2400, 1800, { r: 210, g: 40, b: 35 });
  const small = await makeImage(320, 200, { r: 25, g: 145, b: 70 });
  const third = await makeImage(1100, 700, { r: 30, g: 75, b: 205 });
  const fourth = await makeImage(1800, 1200, { r: 200, g: 150, b: 25 });
  const vertical = await makeImage(480, 900, { r: 120, g: 60, b: 170 });
  const feedBody = feed(
    feedItem({ title: 'Oldest story', date: 'Mon, 06 Apr 2026 08:00:00 GMT', slug: 'oldest', description: imageMarkup({ src: 'https://photo.devonlabs.space/vertical.jpg', alt: 'Vertical portrait' }) }),
    feedItem({ title: 'No images', date: 'Fri, 10 Apr 2026 08:00:00 GMT', slug: 'no-images', description: '<p>A story without photo markup.</p>' }),
    feedItem({
      title: 'Newest story',
      date: 'Thu, 09 Apr 2026 08:00:00 GMT',
      slug: 'newest',
      description: imageMarkup(
        { src: 'https://photo.devonlabs.space/large.jpg' },
        { src: 'https://photo.devonlabs.space/duplicate-content.jpg', alt: 'Duplicate of the first image' },
        { src: 'https://photo.devonlabs.space/small.jpg', alt: 'A small image' },
      ),
      content: imageMarkup(
        { src: 'https://photo.devonlabs.space/third.jpg', alt: 'Blue scene' },
        { src: 'https://photo.devonlabs.space/fourth.jpg', alt: 'Fourth unique image' },
      ),
    }),
    feedItem({ title: 'Middle story', date: 'Wed, 08 Apr 2026 08:00:00 GMT', slug: 'middle', description: imageMarkup({ src: 'https://photo.devonlabs.space/vertical.jpg', alt: 'Vertical portrait' }) }),
    feedItem({ title: 'Older story', date: 'Tue, 07 Apr 2026 08:00:00 GMT', slug: 'older', description: imageMarkup({ src: 'https://photo.devonlabs.space/fourth.jpg', alt: 'Golden landscape' }) }),
  );
  const { fetchImpl, calls } = fetchFixture({
    feedBody,
    assets: {
      'https://photo.devonlabs.space/large.jpg': large,
      'https://photo.devonlabs.space/duplicate-content.jpg': large,
      'https://photo.devonlabs.space/small.jpg': small,
      'https://photo.devonlabs.space/third.jpg': third,
      'https://photo.devonlabs.space/fourth.jpg': fourth,
      'https://photo.devonlabs.space/vertical.jpg': vertical,
    },
  });

  const result = await refreshPhotographyBundles({ root, fetchImpl });

  assert.equal(result.status, 'updated');
  const bundles = JSON.parse(await readFile(snapshotPath, 'utf8'));
  assert.deepEqual(bundles.map(bundle => bundle.title), ['Newest story', 'Middle story', 'Older story']);
  assert.equal(bundles[0].publishedAt, 'Thu, 09 Apr 2026 08:00:00 GMT');
  assert.equal(bundles[0].photos.length, 4, 'content-identical URLs do not consume a distinct-image slot');
  assert.deepEqual(bundles[0].photos.map(photo => photo.source), [
    'https://photo.devonlabs.space/large.jpg',
    'https://photo.devonlabs.space/small.jpg',
    'https://photo.devonlabs.space/third.jpg',
    'https://photo.devonlabs.space/fourth.jpg',
  ]);
  assert.equal(bundles[0].photos[0].alt, 'Photo from Newest story');
  assert.equal(bundles[0].photos[1].alt, 'A small image');
  assert.match(bundles[0].photos[0].image, /^\/photography\/bundles\/photo-[a-f0-9]{20}\.webp$/);

  const largeFile = path.join(root, 'public', bundles[0].photos[0].image.slice(1));
  const largeMetadata = await sharp(largeFile).metadata();
  assert.deepEqual([largeMetadata.width, largeMetadata.height], [1600, 1200]);
  const smallFile = path.join(root, 'public', bundles[0].photos[1].image.slice(1));
  const smallMetadata = await sharp(smallFile).metadata();
  assert.deepEqual([smallMetadata.width, smallMetadata.height], [320, 200], 'small images are not enlarged');
  for (const bundle of bundles) {
    assert.ok(bundle.photos.length >= 1);
    for (const photo of bundle.photos) {
      const file = path.join(root, 'public', photo.image.slice(1));
      const metadata = await sharp(file).metadata();
      assert.ok(Math.max(metadata.width, metadata.height) <= 1600);
      assert.equal(path.dirname(file), bundleDirectory);
      assert.ok(photo.alt);
    }
  }
  const storedFiles = await readdir(bundleDirectory);
  assert.equal(storedFiles.length, 6, 'duplicate image content is written only once and curated originals remain');
  assert.ok(!storedFiles.includes(staleGeneratedFilename), 'stale script-generated assets are pruned after success');
  assert.ok(storedFiles.includes('curated-original.jpg'), 'user-curated originals are preserved');
  assert.ok(calls.includes(feedUrl));
  assert.ok(calls.includes('https://photo.devonlabs.space/fourth.jpg'), 'the third newest image-bearing story is included');
});

test('skips posts with no images and preserves the last snapshot when none of the feed items has an image', async t => {
  const workspace = await makeWorkspace(t, { withFallback: true });
  const generatedFilename = 'photo-22222222222222222222.webp';
  const generatedImage = await sharp(await makeImage(60, 45, { r: 105, g: 85, b: 65 })).webp().toBuffer();
  await writeFile(path.join(workspace.bundleDirectory, generatedFilename), generatedImage);
  const feedBody = feed(
    feedItem({ title: 'Empty newest story', date: 'Fri, 10 Apr 2026 08:00:00 GMT', slug: 'empty-newest', description: '<p>No images here.</p>' }),
    feedItem({ title: 'Also empty', date: 'Thu, 09 Apr 2026 08:00:00 GMT', slug: 'also-empty', description: '' }),
  );
  const { fetchImpl } = fetchFixture({ feedBody });

  const result = await refreshPhotographyBundles({ root: workspace.root, fetchImpl });

  assert.equal(result.status, 'stale');
  assert.match(result.warning.message, /no image-bearing posts/i);
  assert.equal(await readFile(workspace.snapshotPath, 'utf8'), workspace.snapshot);
  assert.deepEqual((await readdir(workspace.bundleDirectory)).sort(), [generatedFilename, 'previous.webp'].sort());
  assert.deepEqual(await readFile(path.join(workspace.bundleDirectory, generatedFilename)), generatedImage);
});

test('keeps a valid snapshot after feed errors and rejects when no valid fallback exists', async t => {
  const workspace = await makeWorkspace(t, { withFallback: true });
  const { fetchImpl } = fetchFixture({ feedStatus: 503, feedBody: 'temporarily unavailable' });

  const result = await refreshPhotographyBundles({ root: workspace.root, fetchImpl });

  assert.equal(result.status, 'stale');
  assert.match(result.warning.message, /503/);
  assert.equal(await readFile(workspace.snapshotPath, 'utf8'), workspace.snapshot);

  const emptyWorkspace = await makeWorkspace(t);
  await assert.rejects(
    refreshPhotographyBundles({ root: emptyWorkspace.root, fetchImpl }),
    /refresh failed and no valid snapshot is available/i,
  );
});

test('keeps the last snapshot and does not promote partial assets when an image download fails', async t => {
  const workspace = await makeWorkspace(t, { withFallback: true });
  const oldGeneratedFilename = 'photo-11111111111111111111.webp';
  const oldGeneratedImage = await sharp(await makeImage(72, 54, { r: 75, g: 95, b: 115 })).webp().toBuffer();
  await writeFile(path.join(workspace.bundleDirectory, oldGeneratedFilename), oldGeneratedImage);
  const feedBody = feed(feedItem({
    title: 'New story',
    date: 'Fri, 10 Apr 2026 08:00:00 GMT',
    slug: 'new-story',
    description: imageMarkup(
      { src: 'https://photo.devonlabs.space/available.jpg', alt: 'A new scene' },
      { src: 'https://photo.devonlabs.space/unavailable.jpg', alt: 'A second scene' },
    ),
  }));
  const fetchImpl = async input => {
    if (String(input) === feedUrl) return response(200, feedBody);
    if (String(input) === 'https://photo.devonlabs.space/available.jpg') {
      return response(200, await makeImage(800, 600, { r: 40, g: 120, b: 180 }));
    }
    return response(502, 'image source failed');
  };

  const result = await refreshPhotographyBundles({ root: workspace.root, fetchImpl });

  assert.equal(result.status, 'stale');
  assert.match(result.warning.message, /502/);
  assert.equal(await readFile(workspace.snapshotPath, 'utf8'), workspace.snapshot);
  assert.deepEqual((await readdir(workspace.bundleDirectory)).sort(), [oldGeneratedFilename, 'previous.webp'].sort());
  assert.deepEqual(await readFile(path.join(workspace.bundleDirectory, oldGeneratedFilename)), oldGeneratedImage);
});

test('does not fetch image URLs outside the photo feed host', async t => {
  const { root } = await makeWorkspace(t);
  const feedBody = feed(feedItem({
    title: 'Untrusted image URL',
    date: 'Fri, 10 Apr 2026 08:00:00 GMT',
    slug: 'untrusted-image',
    description: imageMarkup({ src: 'http://127.0.0.1/latest/meta-data/' }),
  }));
  const { fetchImpl, calls } = fetchFixture({ feedBody });

  await assert.rejects(
    refreshPhotographyBundles({ root, fetchImpl }),
    /no valid snapshot is available/i,
  );
  assert.deepEqual(calls, [feedUrl], 'only the configured RSS host is requested');
});

test('rejects story links outside the HTTPS photo feed host', async t => {
  const workspace = await makeWorkspace(t, { withFallback: true });
  const feedBody = feed(
    feedItem({
      title: 'External story',
      date: 'Fri, 10 Apr 2026 08:00:00 GMT',
      slug: 'external-story',
      postUrl: 'https://example.org/story/',
      description: imageMarkup({ src: 'https://photo.devonlabs.space/external-story.jpg' }),
    }),
    feedItem({
      title: 'Script URL story',
      date: 'Thu, 09 Apr 2026 08:00:00 GMT',
      slug: 'script-story',
      postUrl: 'javascript:alert(1)',
      description: imageMarkup({ src: 'https://photo.devonlabs.space/script-story.jpg' }),
    }),
  );
  const { fetchImpl, calls } = fetchFixture({
    feedBody,
    assets: {
      'https://photo.devonlabs.space/external-story.jpg': await makeImage(80, 60, { r: 100, g: 80, b: 60 }),
      'https://photo.devonlabs.space/script-story.jpg': await makeImage(80, 60, { r: 60, g: 80, b: 100 }),
    },
  });

  const result = await refreshPhotographyBundles({ root: workspace.root, fetchImpl });

  assert.equal(result.status, 'stale');
  assert.match(result.warning.message, /no image-bearing posts/i);
  assert.deepEqual(calls, [feedUrl]);
  assert.equal(await readFile(workspace.snapshotPath, 'utf8'), workspace.snapshot);
});

test('keeps a committed fresh snapshot when stale-asset cleanup fails and reports a warning', async t => {
  const workspace = await makeWorkspace(t, { withFallback: true });
  const feedBody = feed(feedItem({
    title: 'Fresh story',
    date: 'Fri, 10 Apr 2026 08:00:00 GMT',
    slug: 'fresh-story',
    description: imageMarkup({ src: 'https://photo.devonlabs.space/fresh.jpg', alt: 'Fresh content' }),
  }));
  const { fetchImpl } = fetchFixture({
    feedBody,
    assets: { 'https://photo.devonlabs.space/fresh.jpg': await makeImage(96, 64, { r: 20, g: 150, b: 90 }) },
  });
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = message => warnings.push(String(message));

  let result;
  try {
    result = await refreshPhotographyBundles({
      root: workspace.root,
      fetchImpl,
      pruneImpl: async () => { throw new Error('simulated cleanup error'); },
    });
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(result.status, 'updated');
  assert.equal(result.entries[0].title, 'Fresh story');
  assert.match(await readFile(workspace.snapshotPath, 'utf8'), /Fresh story/);
  assert.deepEqual(await readdir(workspace.bundleDirectory), ['previous.webp', result.entries[0].photos[0].image.split('/').at(-1)].sort());
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /simulated cleanup error/);
});
