import { createHash, randomUUID } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import sharp from 'sharp';

const FEED_URL = 'https://photo.devonlabs.space/rss/';
const PHOTO_HOST = new URL(FEED_URL).hostname;
const MAX_STORIES = 3;
const MAX_IMAGE_EDGE = 1600;
const REQUEST_TIMEOUT_MS = 30_000;
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function childText(item, name) {
  return item.children().filter((_, child) => child.name === name).first().text().trim();
}

function isPhotoHostUrl(url) {
  return url.protocol === 'https:' && url.hostname === PHOTO_HOST && !url.username && !url.password && !url.port;
}

function absoluteImageUrl(value, baseUrl) {
  if (!value) return null;
  try {
    const url = new URL(value.trim(), baseUrl);
    if (!isPhotoHostUrl(url)) return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

function imageSource(image) {
  const attributes = ['src', 'data-src', 'data-original', 'data-lazy-src'];
  for (const attribute of attributes) {
    const value = image.attribs?.[attribute]?.trim();
    if (value) return value;
  }

  const srcset = image.attribs?.srcset ?? image.attribs?.['data-srcset'];
  if (srcset) return srcset.split(',')[0].trim().split(/\s+/)[0];
  return '';
}

function imageCandidates(markup, baseUrl) {
  const $ = load(markup ?? '');
  const candidates = new Map();
  $('img').each((_, element) => {
    const source = absoluteImageUrl(imageSource(element), baseUrl);
    if (!source) return;
    const alt = element.attribs?.alt?.trim() ?? '';
    const existing = candidates.get(source);
    if (!existing) candidates.set(source, { source, alt });
    else if (!existing.alt && alt) existing.alt = alt;
  });
  return [...candidates.values()];
}

function mediaCandidates(item, baseUrl) {
  return item.children()
    .filter((_, child) => child.name === 'media:content' || child.name === 'media:thumbnail')
    .toArray()
    .map(child => ({
      source: absoluteImageUrl(child.attribs?.url, baseUrl),
      alt: child.attribs?.['media:description']?.trim() ?? '',
    }))
    .filter(candidate => candidate.source);
}

export function parsePhotographyFeed(feedXml) {
  if (typeof feedXml !== 'string' || !feedXml.trim()) throw new Error('RSS feed is empty');

  const $ = load(feedXml, { xmlMode: true });
  const stories = $('item').toArray().map(element => {
    const item = $(element);
    const title = childText(item, 'title');
    const url = childText(item, 'link');
    const publishedAt = childText(item, 'pubDate');
    const publishedTime = Date.parse(publishedAt);
    if (!title || !url || !Number.isFinite(publishedTime)) return null;

    let postUrl;
    try {
      const parsedUrl = new URL(url);
      if (!isPhotoHostUrl(parsedUrl)) return null;
      postUrl = parsedUrl.href;
    } catch {
      return null;
    }

    const markup = [childText(item, 'description'), childText(item, 'content:encoded')]
      .filter(Boolean)
      .join('\n');
    const candidates = [...imageCandidates(markup, postUrl), ...mediaCandidates(item, postUrl)];
    const images = new Map();
    for (const candidate of candidates) {
      const existing = images.get(candidate.source);
      if (!existing) images.set(candidate.source, candidate);
      else if (!existing.alt && candidate.alt) existing.alt = candidate.alt;
    }

    return {
      title,
      url: postUrl,
      publishedAt,
      publishedTime,
      images: [...images.values()],
    };
  }).filter(story => story?.images.length);

  return stories
    .sort((a, b) => b.publishedTime - a.publishedTime)
    .slice(0, MAX_STORIES);
}

async function downloadImage(source, fetchImpl) {
  const url = new URL(source);
  if (url.protocol !== 'https:' || url.hostname !== PHOTO_HOST || url.username || url.password || url.port) {
    throw new Error(`Image URL is outside the photo feed host: ${source}`);
  }

  const response = await fetchImpl(source, {
    redirect: 'error',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response?.ok) throw new Error(`Image download failed (${response?.status ?? 'unknown'}): ${source}`);

  const input = Buffer.from(await response.arrayBuffer());
  if (!input.length) throw new Error(`Image download was empty: ${source}`);

  const pipeline = sharp(input, { failOn: 'error' });
  const sourceMetadata = await pipeline.metadata();
  if (!sourceMetadata.width || !sourceMetadata.height) throw new Error(`Image has no dimensions: ${source}`);

  const { data, info } = await sharp(input, { failOn: 'error' })
    .rotate()
    .resize({
      width: MAX_IMAGE_EDGE,
      height: MAX_IMAGE_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const orientation = sourceMetadata.orientation ?? 1;
  const rotated = orientation >= 5 && orientation <= 8;
  const sourceWidth = rotated ? sourceMetadata.height : sourceMetadata.width;
  const sourceHeight = rotated ? sourceMetadata.width : sourceMetadata.height;
  if (
    !info.width || !info.height ||
    Math.max(info.width, info.height) > MAX_IMAGE_EDGE ||
    info.width > sourceWidth || info.height > sourceHeight
  ) {
    throw new Error(`Image dimensions are invalid after processing: ${source}`);
  }

  const verified = await sharp(data, { failOn: 'error' }).metadata();
  if (verified.format !== 'webp' || verified.width !== info.width || verified.height !== info.height) {
    throw new Error(`Processed image did not validate: ${source}`);
  }

  const hash = createHash('sha256').update(data).digest('hex').slice(0, 20);
  return { filename: `photo-${hash}.webp`, data, hash };
}

function validSnapshotShape(snapshot) {
  return Array.isArray(snapshot) && snapshot.length > 0 && snapshot.length <= MAX_STORIES && snapshot.every(story => {
    if (
      !story || typeof story.title !== 'string' || !story.title.trim() ||
      typeof story.url !== 'string' || typeof story.publishedAt !== 'string' || !Number.isFinite(Date.parse(story.publishedAt)) ||
      !Array.isArray(story.photos) || story.photos.length < 1
    ) return false;

    try {
      if (!isPhotoHostUrl(new URL(story.url))) return false;
    } catch {
      return false;
    }

    return story.photos.every(photo => {
      if (
        !photo || typeof photo.image !== 'string' || typeof photo.source !== 'string' ||
        typeof photo.alt !== 'string' || !photo.alt.trim() ||
        !/^\/photography\/bundles\/[^/]+\.(?:jpe?g|png|webp)$/i.test(photo.image)
      ) return false;
      try {
        const source = new URL(photo.source);
        return source.protocol === 'https:' || source.protocol === 'http:';
      } catch {
        return false;
      }
    });
  });
}

async function readValidSnapshot(snapshotPath, root) {
  try {
    const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
    if (!validSnapshotShape(snapshot)) return null;

    for (const story of snapshot) {
      for (const photo of story.photos) {
        const filename = photo.image.slice('/photography/bundles/'.length);
        const localPath = path.join(root, 'public', 'photography', 'bundles', filename);
        await access(localPath);
        const metadata = await sharp(localPath, { failOn: 'error' }).metadata();
        if (!metadata.width || !metadata.height) return null;
      }
    }
    return snapshot;
  } catch {
    return null;
  }
}

async function promoteAssets(stagingDirectory, bundleDirectory, assets) {
  await mkdir(bundleDirectory, { recursive: true });
  for (const [filename, data] of assets) {
    const destination = path.join(bundleDirectory, filename);
    let existing;
    try {
      existing = await readFile(destination);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    if (existing) {
      if (!existing.equals(data)) throw new Error(`Content-hash filename collision: ${filename}`);
      continue;
    }
    await rename(path.join(stagingDirectory, filename), destination);
  }
}

async function writeSnapshotAtomically(snapshotPath, snapshot) {
  await mkdir(path.dirname(snapshotPath), { recursive: true });
  const temporaryPath = `${snapshotPath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`);
    await rename(temporaryPath, snapshotPath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

async function pruneUnreferencedGeneratedAssets(bundleDirectory, snapshot) {
  let entries;
  try {
    entries = await readdir(bundleDirectory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  const referenced = new Set(snapshot.flatMap(story => story.photos.map(photo => path.basename(photo.image))));
  for (const entry of entries) {
    if (!entry.isFile() || !/^photo-[a-f0-9]{20}\.webp$/.test(entry.name) || referenced.has(entry.name)) continue;
    await rm(path.join(bundleDirectory, entry.name));
  }
}

export async function refreshPhotographyBundles({
  fetchImpl = globalThis.fetch,
  root = PROJECT_ROOT,
  pruneImpl = pruneUnreferencedGeneratedAssets,
} = {}) {
  const projectRoot = path.resolve(root);
  const snapshotPath = path.join(projectRoot, 'data', 'photography-bundles.json');
  const bundleDirectory = path.join(projectRoot, 'public', 'photography', 'bundles');
  let stagingDirectory;

  try {
    const response = await fetchImpl(FEED_URL, {
      redirect: 'error',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response?.ok) throw new Error(`RSS request failed (${response?.status ?? 'unknown'})`);

    const stories = parsePhotographyFeed(await response.text());
    if (!stories.length) throw new Error('RSS contains no image-bearing posts');

    await mkdir(path.dirname(bundleDirectory), { recursive: true });
    stagingDirectory = await mkdtemp(path.join(path.dirname(bundleDirectory), '.bundles-refresh-'));
    const stagedAssets = new Map();
    const assetsBySource = new Map();
    const snapshot = [];

    for (const story of stories) {
      const photos = [];
      const seenHashes = new Set();
      for (const candidate of story.images) {
        let asset = assetsBySource.get(candidate.source);
        if (!asset) {
          asset = await downloadImage(candidate.source, fetchImpl);
          assetsBySource.set(candidate.source, asset);
          if (!stagedAssets.has(asset.filename)) {
            stagedAssets.set(asset.filename, asset.data);
            await writeFile(path.join(stagingDirectory, asset.filename), asset.data);
          }
        }
        if (seenHashes.has(asset.hash)) continue;
        seenHashes.add(asset.hash);
        photos.push({
          image: `/photography/bundles/${asset.filename}`,
          source: candidate.source,
          alt: candidate.alt || `Photo from ${story.title}`,
        });
      }
      if (!photos.length) throw new Error(`Story has no distinct images: ${story.title}`);
      snapshot.push({ title: story.title, url: story.url, publishedAt: story.publishedAt, photos });
    }

    if (!validSnapshotShape(snapshot)) throw new Error('Generated photography snapshot is invalid');
    await promoteAssets(stagingDirectory, bundleDirectory, stagedAssets);
    await writeSnapshotAtomically(snapshotPath, snapshot);
    try {
      await pruneImpl(bundleDirectory, snapshot);
    } catch (cleanupError) {
      console.warn(`Fresh photography snapshot committed, but stale generated images could not be pruned: ${cleanupError.message}`);
    }
    return { status: 'updated', entries: snapshot };
  } catch (error) {
    const previous = await readValidSnapshot(snapshotPath, projectRoot);
    if (previous) return { status: 'stale', entries: previous, warning: error };
    throw new Error(`Refresh failed and no valid snapshot is available: ${error.message}`, { cause: error });
  } finally {
    if (stagingDirectory) await rm(stagingDirectory, { recursive: true, force: true });
  }
}

async function runCli() {
  try {
    const result = await refreshPhotographyBundles();
    if (result.status === 'stale') {
      console.warn(`Photography bundle refresh failed; keeping the valid existing snapshot: ${result.warning.message}`);
      return;
    }
    console.log(`Refreshed ${result.entries.length} photography stories.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runCli();
