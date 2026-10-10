import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';
import RAPIER from '@dimforge/rapier3d-compat';

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
const { works, discoveries, puzzles, canRepair, circuit, emptyProgress, readProgress } = load(
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
assert.deepEqual(circuit[0], circuit.at(-1));
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

await RAPIER.init();
const { createWalkingPhysics, walk, createNavigator } = load(resolve('app/workshop-walking.ts'));
const footWorld = new RAPIER.World({ x: 0, y: -15, z: 0 });
footWorld.createCollider(RAPIER.ColliderDesc.cuboid(50, 0.1, 50));
const walker = createWalkingPhysics(footWorld);
for (let i = 0; i < 90; i++) walk(footWorld, walker, 0, 0, false, 1 / 60);
assert.ok(walker.grounded, 'Walking character settles on ground');
const start = walker.body.translation();
for (let i = 0; i < 60; i++) walk(footWorld, walker, 0, -4, false, 1 / 60);
assert.ok(walker.body.translation().z < start.z - 3.5, 'Character walks forward');
assert.equal(walk(footWorld, walker, 0, 0, true, 1 / 60), true);
for (let i = 0; i < 15; i++) walk(footWorld, walker, 0, 0, false, 1 / 60);
assert.ok(walker.body.translation().y > start.y + 0.5, 'Character jumps');
assert.equal(walk(footWorld, walker, 0, 0, true, 1 / 60), false, 'No double jump');
for (let i = 0; i < 90; i++) walk(footWorld, walker, 0, 0, false, 1 / 60);
assert.ok(walker.grounded, 'Character lands');
footWorld.createCollider(RAPIER.ColliderDesc.cuboid(4, 2, 0.5).setTranslation(0, 2, 6));
for (let i = 0; i < 120; i++) walk(footWorld, walker, 0, -4, false, 1 / 60);
assert.ok(walker.body.translation().z > 6.7, 'Exhibit blocks walking character');
footWorld.free();
const obstacle = { x: 0, z: 0, width: 4, depth: 4 };
const navigation = createNavigator([obstacle]);
const path = navigation({ x: 0, z: 8 }, { x: 0, z: -8 });
assert.ok(
  path.length >= 16 && path.some((point) => Math.abs(point.x) >= 3),
  'A* routes around the exhibit'
);
assert.ok(path.every((point) => Math.abs(point.x) > 2.8 || Math.abs(point.z) > 2.8));
assert.deepEqual(navigation({ x: 0, z: 8 }, { x: 0, z: 0 }), []);
assert.deepEqual(navigation({ x: 0, z: 8 }, { x: 42, z: 42 }), []);
console.log(
  'Passed: portfolio/media integrity, progress migration, inventory/puzzle validation, A* obstacle routing, and walking/collisions/jump/landing.'
);
