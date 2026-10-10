import RAPIER from '@dimforge/rapier3d-compat';

export const wheelPoints = [
  [-0.99, 0, 0.9],
  [0.99, 0, 0.9],
  [-0.99, 0, -0.9],
  [0.99, 0, -0.9],
];

export function createRoverPhysics(world: RAPIER.World) {
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, 1.3, 6)
      .setLinearDamping(0.2)
      .setAngularDamping(2)
      .setCcdEnabled(true)
  );
  const collider = world.createCollider(
    RAPIER.ColliderDesc.cuboid(0.78, 0.32, 1.28).setMass(5).setFriction(0.4),
    body
  );
  body.setRotation({ x: 0, y: 1, z: 0, w: 0 }, true);
  // Keep the arcade rover upright while Rapier handles suspension, yaw, and collisions.
  body.setEnabledRotations(false, true, false, true);
  const vehicle = world.createVehicleController(body);
  vehicle.indexUpAxis = 1;
  vehicle.setIndexForwardAxis = 2;
  wheelPoints.forEach(([x, y, z], i) => {
    vehicle.addWheel({ x, y, z }, { x: 0, y: -1, z: 0 }, { x: -1, y: 0, z: 0 }, 0.42, 0.47);
    vehicle.setWheelSuspensionStiffness(i, 32);
    vehicle.setWheelSuspensionCompression(i, 4.4);
    vehicle.setWheelSuspensionRelaxation(i, 5.5);
    vehicle.setWheelFrictionSlip(i, 2);
    vehicle.setWheelMaxSuspensionForce(i, 100);
  });
  return { body, collider, vehicle };
}

export function driveRover(
  vehicle: RAPIER.DynamicRayCastVehicleController,
  throttle: number,
  steering: number,
  boost: boolean,
  dt: number,
  collider: RAPIER.Collider
) {
  for (let i = 0; i < 4; i++) {
    vehicle.setWheelEngineForce(i, (boost ? 24 : 12) * throttle);
    vehicle.setWheelBrake(i, throttle ? 0 : 1.5);
    vehicle.setWheelSteering(i, i < 2 ? steering * 0.43 : 0);
  }
  vehicle.updateVehicle(
    dt,
    RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
    undefined,
    (other) => other.handle !== collider.handle
  );
  const body = vehicle.chassis();
  const velocity = body.linvel();
  const speed = Math.hypot(velocity.x, velocity.z);
  const limit = boost ? 19 : 12;
  if (speed > limit)
    body.setLinvel(
      { x: (velocity.x * limit) / speed, y: velocity.y, z: (velocity.z * limit) / speed },
      true
    );
}

export function roverGrounded(
  world: RAPIER.World,
  body: RAPIER.RigidBody,
  collider: RAPIER.Collider
) {
  const hit = world.castRay(
    new RAPIER.Ray(body.translation(), { x: 0, y: -1, z: 0 }),
    1.05,
    true,
    undefined,
    undefined,
    collider,
    body
  );
  return hit !== null;
}
