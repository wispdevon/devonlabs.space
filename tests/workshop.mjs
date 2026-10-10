import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const modules = new Map();
function load(path) {
  if (modules.has(path)) return modules.get(path);
  const output = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (id) =>
    id.startsWith('.')
      ? id.endsWith('.json')
        ? JSON.parse(readFileSync(resolve(dirname(path), id), 'utf8'))
        : load(resolve(dirname(path), `${id}.ts`))
      : require(id);
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  modules.set(path, module.exports);
  return module.exports;
}
const { works, discoveries, puzzles, canRepair, emptyProgress, readProgress } = load(
  resolve('data/workshop.ts')
);
assert.equal(works.length, 12);
assert.equal(new Set(works.map((work) => work.id)).size, 12);
assert.equal(works.filter((work) => work.kind === 'Software').length, 9);
assert.deepEqual(
  new Set(works.map((work) => work.kind)),
  new Set(['Software', 'Photography', 'Video', 'Hardware'])
);
assert.equal(discoveries.length, 6);
for (const work of works) {
  assert.ok(work.href.startsWith('https://'));
  assert.ok(Math.hypot(...work.position) < 40);
  if (work.image) assert.ok(readFileSync(resolve('public', work.image.slice(1))).length > 0);
}
for (const discovery of discoveries) assert.ok(Math.hypot(...discovery.position) < 41);
assert.deepEqual(readProgress(null), emptyProgress());
assert.deepEqual(readProgress('broken'), emptyProgress());
assert.deepEqual(readProgress('{"version":2}'), emptyProgress());
const valid = {
  version: 1,
  visited: [works[0].id, works[0].id, 'fake'],
  discoveries: [discoveries[0].id, 'fake'],
  jumped: true,
  best: 35.4,
  repaired: [],
};
assert.deepEqual(readProgress(JSON.stringify(valid)), {
  ...valid,
  visited: [works[0].id],
  discoveries: [discoveries[0].id],
});
assert.equal(readProgress(JSON.stringify({ ...valid, best: -1 })).best, null);
assert.equal(readProgress(JSON.stringify({ ...valid, best: '34' })).best, null);
assert.equal(
  readProgress(JSON.stringify({ ...valid, visited: {}, discoveries: {}, jumped: 'true' })).jumped,
  false
);
const photos = JSON.parse(readFileSync('data/workshop-media.json', 'utf8'));
assert.equal(photos.source, 'https://im.devonlabs.space/s/thebest');
assert.equal(photos.photos.length, 12);
for (const photo of photos.photos)
  assert.ok(readFileSync(resolve('public', photo.image.slice(1))).length > 0);
assert.equal(puzzles.length, 3);
assert.equal(canRepair('projector', 'lens', ['lens'], []), true);
assert.equal(canRepair('projector', 'signal', ['signal'], []), false);
assert.equal(canRepair('projector', 'lens', [], []), false);
assert.equal(canRepair('projector', 'lens', ['lens'], ['projector']), false);
assert.deepEqual(
  readProgress(JSON.stringify({ ...valid, repaired: ['projector', 'fake'] })).repaired,
  []
);
assert.deepEqual(
  readProgress(
    JSON.stringify({
      ...valid,
      discoveries: ['lens'],
      repaired: ['projector', 'projector', 'fake'],
    })
  ).repaired,
  ['projector']
);

assert.ok(readFileSync('public/workshop/room.webp').length > 10000);
console.log(
  'Passed: portfolio/media integrity, progress migration, inventory/puzzle validation, and room asset.'
);
