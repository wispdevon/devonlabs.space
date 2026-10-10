import RAPIER from '@dimforge/rapier3d-compat';
import PF from 'pathfinding';

export type Obstacle = { x: number; z: number; width: number; depth: number };
export function createWalkingPhysics(world: RAPIER.World) {
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 1, 14)
  );
  const collider = world.createCollider(RAPIER.ColliderDesc.capsule(0.55, 0.3), body);
  const controller = world.createCharacterController(0.025);
  controller.enableAutostep(0.4, 0.3, true);
  controller.enableSnapToGround(0.3);
  controller.setApplyImpulsesToDynamicBodies(true);
  controller.setCharacterMass(5);
  return { body, collider, controller, grounded: false, vertical: 0 };
}
export type Walker = ReturnType<typeof createWalkingPhysics>;
export function walk(
  world: RAPIER.World,
  player: Walker,
  x: number,
  z: number,
  jump: boolean,
  dt: number
) {
  const jumped = jump && player.grounded;
  if (jumped) player.vertical = 5.5;
  else if (player.grounded && player.vertical < 0) player.vertical = -0.5;
  player.vertical -= 15 * dt;
  player.controller.computeColliderMovement(player.collider, {
    x: x * dt,
    y: player.vertical * dt,
    z: z * dt,
  });
  const movement = player.controller.computedMovement();
  const position = player.body.translation();
  player.body.setNextKinematicTranslation({
    x: position.x + movement.x,
    y: position.y + movement.y,
    z: position.z + movement.z,
  });
  player.grounded = player.controller.computedGrounded();
  world.step();
  return jumped;
}

export function createNavigator(obstacles: Obstacle[]) {
  const size = 85,
    offset = 42;
  const grid = new PF.Grid(size, size);
  for (let z = 0; z < size; z++)
    for (let x = 0; x < size; x++) {
      const wx = x - offset,
        wz = z - offset;
      const blocked =
        Math.hypot(wx, wz) > 39 ||
        obstacles.some(
          (o) => Math.abs(wx - o.x) <= o.width / 2 + 0.8 && Math.abs(wz - o.z) <= o.depth / 2 + 0.8
        );
      grid.setWalkableAt(x, z, !blocked);
    }
  const finder = new PF.AStarFinder({ diagonalMovement: PF.DiagonalMovement.OnlyWhenNoObstacles });
  const cell = (value: number) => Math.max(0, Math.min(size - 1, Math.round(value) + offset));
  return (start: { x: number; z: number }, end: { x: number; z: number }) => {
    const sx = cell(start.x),
      sz = cell(start.z),
      ex = cell(end.x),
      ez = cell(end.z);
    if (!grid.isWalkableAt(sx, sz) || !grid.isWalkableAt(ex, ez)) return [];
    const path = finder.findPath(sx, sz, ex, ez, grid.clone());
    return path.slice(1).map(([x, z]) => ({ x: x - offset, z: z - offset }));
  };
}
