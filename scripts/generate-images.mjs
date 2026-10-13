import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readdir, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const output = 'public/generated/images';
await mkdir(output, { recursive: true });
const manifest = {};
const keep = new Set();
for (const directory of ['workshop/photos', 'developer', 'coffee', 'workshop', 'photography/bundles', 'photography/events', 'shop']) {
  for (const name of (await readdir(`public/${directory}`, { recursive: directory === 'photography/events' })).sort()) {
    if (!/\.(webp|jpe?g|png)$/.test(name) || name === 'room.webp') continue;
    const source = `/${directory}/${name}`;
    const bytes = await readFile(`public${source}`);
    const metadata = await sharp(bytes).metadata();
    const variants = [];
    const sizes = directory === 'photography/bundles' ? [200, 320, 400, 640, 960, 1600] : directory === 'photography/events' ? [200, 320, 400, 640, 960, 1600] : [320, 640, 960, 1600];
    for (const width of [...new Set(sizes.map(size => Math.min(size, metadata.width)))]) {
      const { data, info } = await sharp(bytes).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer({ resolveWithObject: true });
      const hash = createHash('sha256').update(data).digest('hex').slice(0, 16);
      const filename = `${path.parse(name).name}-${info.width}-${hash}.webp`;
      keep.add(filename);
      await writeFile(`${output}/${filename}`, data);
      variants.push({ src: `/generated/images/${filename}`, width: info.width, height: info.height, bytes: data.length });
    }
    manifest[source] = { width: metadata.width, height: metadata.height, variants };
  }
}
for (const filename of await readdir(output)) if (!keep.has(filename)) await rm(`${output}/${filename}`);
await writeFile('data/image-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated responsive variants for ${Object.keys(manifest).length} images.`);
