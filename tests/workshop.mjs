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
const { works, discoveries, circuit, emptyProgress, readProgress } = load(
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

await RAPIER.init();
const { createRoverPhysics, driveRover, roverGrounded } = load(resolve('app/workshop-physics.ts'));
function simulation() {
  const world = new RAPIER.World({ x: 0, y: -15, z: 0 });
  world.timestep = 1 / 60;
  world.createCollider(RAPIER.ColliderDesc.cuboid(100, 0.1, 100));
  const rover = createRoverPhysics(world);
  const step = (throttle = 0, steering = 0, boost = false, count = 1) => {
    for (let i = 0; i < count; i++) {
      driveRover(rover.vehicle, throttle, steering, boost, 1 / 60, rover.collider);
      world.step();
    }
  };
  step(0, 0, false, 90);
  return { world, ...rover, step };
}
const normal = simulation();
assert.ok(roverGrounded(normal.world, normal.body, normal.collider), 'Rover settles on the ground');
const origin = normal.body.translation();
normal.step(1, 0, false, 120);
assert.ok(normal.body.translation().z < origin.z - 5, 'Throttle drives forward');
assert.ok(
  Math.hypot(normal.body.linvel().x, normal.body.linvel().z) < 12.3,
  'Normal speed is bounded'
);
normal.step(0, 0, false, 120);
assert.ok(Math.abs(normal.body.linvel().z) < 1, 'Brake stops the rover');
const beforeReverse = normal.body.translation().z;
normal.step(-1, 0, false, 120);
assert.ok(
  normal.body.translation().z > beforeReverse + 5,
  `Reverse drives backwards: ${JSON.stringify({ beforeReverse, position: normal.body.translation(), velocity: normal.body.linvel(), rotation: normal.body.rotation() })}`
);
normal.world.free();
const boost = simulation();
boost.step(1, 0, true, 150);
assert.ok(Math.abs(boost.body.linvel().z) > 12, 'Boost raises the speed limit');
assert.ok(Math.hypot(boost.body.linvel().x, boost.body.linvel().z) < 19.3, 'Boost remains bounded');
boost.world.free();
const turning = simulation();
turning.step(1, 1, false, 120);
assert.ok(Math.abs(turning.body.translation().x) > 1, 'Steering turns the rover');
turning.world.free();
const jumping = simulation();
const startHeight = jumping.body.translation().y;
jumping.body.applyImpulse({ x: 0, y: 34, z: 0 }, true);
jumping.step(0, 0, false, 18);
assert.ok(jumping.body.translation().y > startHeight + 0.5, 'Jump lifts the chassis');
assert.ok(
  !roverGrounded(jumping.world, jumping.body, jumping.collider),
  'Airborne rover cannot jump again'
);
jumping.step(0, 0, false, 180);
assert.ok(roverGrounded(jumping.world, jumping.body, jumping.collider), 'Rover lands');
jumping.world.free();
const collision = simulation();
collision.world.createCollider(RAPIER.ColliderDesc.cuboid(4, 2, 0.5).setTranslation(0, 2, -3));
collision.step(1, 0, false, 180);
assert.ok(collision.body.translation().z > -3, 'Fixed station blocks the chassis');
collision.world.free();
console.log(
  'Passed: portfolio/media integrity, progress validation, four work categories, circuit route, rover suspension, forward/reverse, braking, steering, boost limits, grounded jump, landing, and physical collisions.'
);
