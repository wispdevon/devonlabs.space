import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const origin = 'https://im.devonlabs.space';
const source = `${origin}/s/thebest`;
const download = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${response.status} fetching ${new URL(url).pathname}`);
  return Buffer.from(await response.arrayBuffer());
};
const page = (await download(source)).toString();
const sharedImage = page.match(/property="og:image" content="([^"]+)"/)?.[1];
if (!sharedImage) throw new Error('Public album does not expose its shared image');
const key = new URL(sharedImage.replaceAll('&amp;', '&')).searchParams.get('key');
if (!key) throw new Error('Missing public album share key');
const api = (path, params = {}) => {
  const url = new URL(`/api/${path}`, origin);
  Object.entries({ ...params, key }).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
};
const share = JSON.parse(await download(api('shared-links/me')));
const albumId = share.album.id;
const buckets = JSON.parse(await download(api('timeline/buckets', { albumId, size: 'MONTH' })));
const photos = [];
await mkdir('public/workshop/photos', { recursive: true });
for (const { timeBucket } of buckets) {
  const bucket = JSON.parse(
    await download(api('timeline/bucket', { albumId, size: 'MONTH', timeBucket }))
  );
  for (let i = 0; i < Math.min(bucket.id.length, 3) && photos.length < 12; i++) {
    if (!bucket.isImage[i]) continue;
    const number = String(photos.length + 1).padStart(2, '0');
    const preview = await download(api(`assets/${bucket.id[i]}/thumbnail`, { size: 'preview' }));
    await sharp(preview)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(`public/workshop/photos/${number}.webp`);
    const date = bucket.fileCreatedAt[i].slice(0, 10);
    photos.push({
      id: bucket.id[i],
      image: `/workshop/photos/${number}.webp`,
      date,
      alt: `Photograph ${number} from Wisp's The Best collection, ${date}`,
      ratio: bucket.ratio[i],
    });
  }
  if (photos.length === 12) break;
}
if (!photos.length) throw new Error('No photographs found');
await writeFile(
  'data/workshop-media.json',
  `${JSON.stringify({ source, album: share.album.albumName, fetchedAt: new Date().toISOString(), photos }, null, 2)}\n`
);
console.log(`Saved ${photos.length} photographs from the public Immich album.`);
