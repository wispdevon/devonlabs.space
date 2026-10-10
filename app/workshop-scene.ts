import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { circuit, discoveries, photographs, works } from '@/data/workshop';
import { createRoverPhysics, driveRover, roverGrounded, wheelPoints } from './workshop-physics';

export type WorldSettings = {
  night: boolean;
  quality: 'low' | 'high';
  sound: boolean;
  paused: boolean;
  reduced: boolean;
  discovered?: string[];
};
export type WorldEvent =
  | { type: 'nearby'; id: string | null }
  | { type: 'open'; id: string }
  | { type: 'discovery'; id: string }
  | { type: 'jump' }
  | { type: 'race'; elapsed: number; checkpoint: number; finished?: boolean };
export type WorldHandle = {
  update: (settings: WorldSettings) => void;
  teleport: (id: string) => void;
  respawn: () => void;
  jump: () => void;
  steer: (x: number, y: number) => void;
  boost: (value: boolean) => void;
  race: () => void;
  cancelRace: () => void;
  reset: () => void;
  dispose: () => void;
};

export async function mountWorkshop(
  host: HTMLDivElement,
  initial: WorldSettings,
  onEvent: (event: WorldEvent) => void,
  onFallback: () => void
): Promise<WorldHandle> {
  await RAPIER.init();
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor('#bad5ce');
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'Drive around Devon Labs');
  renderer.domElement.setAttribute('role', 'application');
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-30, 30, 20, -20, 0.1, 180);
  const physics = new RAPIER.World({ x: 0, y: -15, z: 0 });
  physics.timestep = 1 / 60;
  let settings = initial;
  let disposed = false;
  let unavailable = false;
  let accumulator = 0;
  let last = performance.now();
  let nearby: string | null = null;
  let elapsed = 0;
  let raceTime = 0;
  let raceCheckpoint = -1;
  let lastReport = 0;
  let zoom = 1;
  let azimuth = 0.63;
  let elevation = 0.78;
  let width = 1;
  let height = 1;
  let touchSteer = { x: 0, y: 0 };
  let touchBoost = false;
  let jumpQueued = false;
  let lastJump = -10;
  const keys = new Set<string>();
  const found = new Set<string>();
  const interactive: THREE.Object3D[] = [];
  const movingProps: { body: RAPIER.RigidBody; mesh: THREE.Mesh; initial: THREE.Vector3 }[] = [];
  const resources = new Set<THREE.Texture>();
  const colors = {
    white: '#f4f6f3',
    ink: '#253c43',
    pink: '#e77d9f',
    blue: '#5085c1',
    mint: '#54aa96',
    lilac: '#a79acc',
    yellow: '#e2cc60',
  };
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 24);
  const sphereGeometry = new THREE.IcosahedronGeometry(1, 1);
  const material = (color: string) => {
    if (!materials.has(color))
      materials.set(
        color,
        new THREE.MeshStandardMaterial({ color, roughness: 0.76, metalness: 0.05 })
      );
    return materials.get(color)!;
  };
  const box = (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    color: string
  ) => {
    const mesh = new THREE.Mesh(boxGeometry, material(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    radius: number,
    h: number,
    color: string
  ) => {
    const mesh = new THREE.Mesh(cylinderGeometry, material(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(radius, h, radius);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const fixedBox = (
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    rotation = 0
  ) => {
    physics.createCollider(
      RAPIER.ColliderDesc.cuboid(sx / 2, sy / 2, sz / 2)
        .setTranslation(x, y, z)
        .setRotation({ x: Math.sin(rotation / 2), y: 0, z: 0, w: Math.cos(rotation / 2) })
        .setFriction(0.8)
    );
  };
  const label = (text: string, color = colors.ink, background = colors.white) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 192;
    const context = canvas.getContext('2d')!;
    context.fillStyle = background;
    context.fillRect(0, 0, 1024, 192);
    context.fillStyle = color;
    context.font = `500 64px ${getComputedStyle(document.body).fontFamily}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 512, 100, 940);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    resources.add(texture);
    return texture;
  };
  const picture = (
    parent: THREE.Object3D,
    url: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number
  ) => {
    const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    plane.position.set(x, y, z);
    parent.add(plane);
    new THREE.TextureLoader().load(url, (texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      resources.add(texture);
      mat.map = texture;
      mat.needsUpdate = true;
    });
    return plane;
  };
  const sign = (
    parent: THREE.Object3D,
    text: string,
    x: number,
    y: number,
    z: number,
    w: number
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, (w * 192) / 1024),
      new THREE.MeshBasicMaterial({ map: label(text), side: THREE.DoubleSide })
    );
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  const ambient = new THREE.HemisphereLight('#eef7ff', '#96a8b1', 2.2);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#fff7ec', 3.1);
  sun.position.set(-22, 40, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -48;
  sun.shadow.camera.right = 48;
  sun.shadow.camera.top = 48;
  sun.shadow.camera.bottom = -48;
  sun.shadow.normalBias = 0.08;
  scene.add(sun);
  cylinder(scene, 0, -1.15, 0, 42, 2.2, '#a3adbb');
  const surface = cylinder(scene, 0, -0.03, 0, 41.8, 0.2, '#e0e7e5');
  surface.castShadow = false;
  physics.createCollider(
    RAPIER.ColliderDesc.cylinder(0.1, 41.8).setTranslation(0, -0.03, 0).setFriction(0.8)
  );
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), material('#bad5ce'));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3;
  floor.receiveShadow = true;
  scene.add(floor);

  box(scene, 0, 0.1, 0, 7, 0.06, 65, '#f0f2ed');
  box(scene, 0, 0.105, 5, 62, 0.06, 6, '#f0f2ed');
  for (let i = -30; i <= 30; i += 4) {
    box(scene, -2.9, 0.15, i, 0.1, 0.04, 1.5, '#bac9c6');
    box(scene, 2.9, 0.15, i, 0.1, 0.04, 1.5, '#bac9c6');
  }
  for (let i = -28; i < 30; i += 5) {
    box(scene, i, 0.14, 2.4, 1.6, 0.03, 0.12, '#bac9c6');
    box(scene, i, 0.14, 7.6, 1.6, 0.03, 0.12, '#bac9c6');
  }
  // Deterministic low-poly terrain keeps the scene reproducible and inexpensive.
  for (let i = 0; i < 78; i++) {
    const angle = i * 2.399963;
    const radius = 12 + (i % 9) * 3.2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (
      Math.abs(x) < 5 ||
      Math.abs(z - 5) < 4 ||
      works.some((work) => Math.hypot(x - work.position[0], z - work.position[1]) < 4)
    )
      continue;
    const rock = new THREE.Mesh(sphereGeometry, material(i % 3 ? '#c4cfce' : '#adbfbb'));
    rock.position.set(x, 0.25, z);
    rock.scale.set(0.5 + (i % 3) * 0.25, 0.4, 0.5);
    rock.rotation.y = i;
    rock.castShadow = true;
    scene.add(rock);
  }
  const brand = new THREE.Group();
  brand.position.set(-4, 0, 6);
  scene.add(brand);
  box(brand, 0, 1.9, 0, 0.15, 3.8, 0.15, colors.ink);
  box(brand, 6, 1.9, 0, 0.15, 3.8, 0.15, colors.ink);
  box(brand, 3, 3.5, 0, 7, 1.5, 0.2, colors.white);
  sign(brand, 'Devon Labs', 3, 3.55, 0.12, 6.6);
  sign(brand, 'MADE OF CURIOSITY', 3, 2.8, 0.14, 4.1);

  const sector = (text: string, x: number, z: number, color: string) => {
    const mesh = sign(scene, text, x, 0.19, z, 9);
    mesh.rotation.x = -Math.PI / 2;
    box(scene, x, 0.12, z - 1.25, 10, 0.06, 0.12, color);
  };
  sector('01 / PHOTO STUDIO', -15, -6, colors.pink);
  sector('02 / SOFTWARE LAB', 16, 0, colors.blue);
  sector('03 / OPEN-AIR CINEMA', -17, 23, colors.lilac);
  sector('04 / HARDWARE BENCH', 17, 23, colors.mint);

  works.forEach((work, index) => {
    const group = new THREE.Group();
    group.position.set(work.position[0], 0, work.position[1]);
    group.userData.work = work.id;
    scene.add(group);
    const plinth = cylinder(
      group,
      0,
      0.15,
      0,
      3.3,
      0.22,
      index < 3 || index === 4 || index === 9
        ? '#eddae2'
        : work.kind === 'Video'
          ? '#e1ddef'
          : work.kind === 'Hardware'
            ? '#d1e6df'
            : '#d6e3ef'
    );
    plinth.castShadow = false;
    if (work.kind === 'Photography') {
      for (let p = 0; p < 3; p++) {
        const frame = new THREE.Group();
        frame.position.set((p - 1) * 2.05, 0, p === 1 ? -0.4 : 0.25);
        frame.rotation.y = (p - 1) * -0.18;
        group.add(frame);
        box(frame, 0, 2.5, 0, 1.9, 3.4, 0.16, colors.white);
        picture(frame, photographs[p].image, 0, 2.5, 0.09, 1.7, 2.55);
        box(frame, 0, 0.7, 0, 0.15, 1.4, 0.15, colors.ink);
      }
    } else if (work.kind === 'Video') {
      box(group, 0, 3, -0.5, 8, 4.9, 0.25, colors.ink);
      picture(group, work.image!, 0, 3, -0.35, 7.6, 4.27);
      box(group, -3.7, 1.1, -0.5, 0.22, 2.2, 0.22, colors.ink);
      box(group, 3.7, 1.1, -0.5, 0.22, 2.2, 0.22, colors.ink);
      for (let p = 0; p < 6; p++) {
        box(
          group,
          ((p % 3) - 1) * 2,
          0.45,
          3 + Math.floor(p / 3) * 1.7,
          1.3,
          0.65,
          0.9,
          colors.lilac
        );
      }
    } else if (work.kind === 'Hardware') {
      box(group, 0, 1.4, 0, 6, 0.3, 2.3, colors.white);
      box(group, -2, 0.7, 0, 0.2, 1.4, 0.2, colors.ink);
      box(group, 2, 0.7, 0, 0.2, 1.4, 0.2, colors.ink);
      for (let p = 0; p < 3; p++) {
        box(group, (p - 1) * 1.7, 1.8, 0, 1.2, 0.5, 1.3, colors.mint);
        box(group, (p - 1) * 1.7, 2.1, -0.2, 0.8, 0.1, 0.7, colors.ink);
      }
      cylinder(group, 2.5, 3, -0.7, 0.07, 3, colors.ink);
      cylinder(group, 2.5, 4.5, -0.7, 0.17, 0.3, colors.yellow);
    } else if (index === 0 || index === 4 || index === 5 || index === 8) {
      box(group, 0, 1.25, 0, 3.1, 1.8, 1.6, work.color);
      const lens = cylinder(group, 0, 1.3, 1.05, 0.64, 0.85, colors.ink);
      lens.rotation.x = Math.PI / 2;
      const glass = cylinder(group, 0, 1.3, 1.5, 0.5, 0.1, '#7bbfc0');
      glass.rotation.x = Math.PI / 2;
      box(group, -0.85, 2.3, 0, 0.8, 0.4, 0.8, colors.ink);
      box(group, 1, 2.2, 0.2, 0.4, 0.2, 0.4, colors.yellow);
      if (work.image) picture(group, work.image, 0, 3.1, -0.7, 3.5, 2.2);
    } else {
      box(group, 0, 1.4, 0, 3.7, 0.2, 2.5, colors.white);
      box(group, -1.4, 0.7, 0, 0.15, 1.4, 0.15, colors.ink);
      box(group, 1.4, 0.7, 0, 0.15, 1.4, 0.15, colors.ink);
      box(group, 0, 2.6, -0.5, 3, 1.9, 0.25, colors.ink);
      if (work.image) picture(group, work.image, 0, 2.6, -0.35, 2.8, 1.6);
      else {
        const screen = sign(
          group,
          index === 3
            ? 'DONE > NEXT'
            : index === 6
              ? 'LESS NOISE'
              : index === 7
                ? 'WIFI / QR'
                : 'HELLO, WORLD',
          0,
          2.6,
          -0.35,
          2.8
        );
        screen.material = new THREE.MeshBasicMaterial({
          map: label(
            index === 3
              ? 'DONE > NEXT'
              : index === 6
                ? 'LESS NOISE'
                : index === 7
                  ? 'WIFI / QR'
                  : 'HELLO, WORLD',
            colors.white,
            work.color
          ),
        });
      }
      box(group, 0, 1.6, 0.5, 1.9, 0.08, 0.65, '#c4cbd0');
    }
    const name = sign(group, work.name, 0, 0.5, 3.4, 5);
    name.rotation.x = -Math.PI / 2;
    group.traverse((object) => {
      object.userData.work = work.id;
    });
    interactive.push(group);
    if (work.kind !== 'Video') fixedBox(work.position[0], 1.1, work.position[1], 3.3, 2.2, 1.8);
    else fixedBox(work.position[0], 2.4, work.position[1] - 0.5, 8, 4.8, 0.3);
    return group;
  });

  // Movable crates and ramps are real physics bodies, not decorative animation.
  for (let i = 0; i < 14; i++) {
    const x = (i < 7 ? -1 : 1) * (7 + (i % 7) * 2.7),
      z = i < 7 ? 9 : 10;
    const mesh = box(
      scene,
      x,
      0.55,
      z,
      1,
      1,
      1,
      [colors.pink, colors.blue, colors.mint, colors.yellow][i % 4]
    );
    const body = physics.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(x, 0.55, z)
        .setLinearDamping(0.4)
        .setAngularDamping(0.7)
    );
    physics.createCollider(
      RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setMass(0.35).setRestitution(0.2),
      body
    );
    movingProps.push({ body, mesh, initial: new THREE.Vector3(x, 0.55, z) });
  }
  for (const [x, z] of [
    [-5, 16],
    [6, -8],
  ]) {
    const ramp = box(scene, x, 0.65, z, 3.5, 0.3, 5, colors.lilac);
    ramp.rotation.x = 0.24;
    fixedBox(x, 0.65, z, 3.5, 0.3, 5, 0.24);
  }
  const secretMeshes = discoveries.map((secret, i) => {
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.65),
      new THREE.MeshStandardMaterial({
        color: colors.yellow,
        emissive: '#8e7525',
        emissiveIntensity: 0.2,
      })
    );
    mesh.position.set(secret.position[0], 1.1, secret.position[1]);
    mesh.rotation.y = i;
    mesh.castShadow = true;
    scene.add(mesh);
    return mesh;
  });
  circuit.slice(0, -1).forEach(([x, z], i) => {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    scene.add(group);
    box(group, -2, 1.4, 0, 0.2, 2.8, 0.2, colors.lilac);
    box(group, 2, 1.4, 0, 0.2, 2.8, 0.2, colors.lilac);
    box(group, 0, 2.8, 0, 4.2, 0.25, 0.25, colors.lilac);
    sign(group, i === 0 ? 'CIRCUIT' : String(i), 0, 2.8, 0.16, 2.5);
    return group;
  });
  const track = new THREE.BufferGeometry().setFromPoints(
    circuit.map(([x, z]) => new THREE.Vector3(x, 0.2, z))
  );
  scene.add(
    new THREE.Line(
      track,
      new THREE.LineDashedMaterial({ color: '#a8b5ba', dashSize: 0.7, gapSize: 0.8 })
    ).computeLineDistances()
  );
  const raceMarker = new THREE.Mesh(
    new THREE.TorusGeometry(2, 0.12, 8, 32),
    new THREE.MeshBasicMaterial({ color: colors.yellow })
  );
  raceMarker.rotation.x = -Math.PI / 2;
  raceMarker.visible = false;
  scene.add(raceMarker);

  const stars = new THREE.Group();
  scene.add(stars);
  const starPositions = works.map(
    (work, i) => new THREE.Vector3(work.position[0] * 1.2, 25 + (i % 3) * 3, work.position[1] * 1.2)
  );
  starPositions.forEach((position) => {
    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22),
      new THREE.MeshBasicMaterial({ color: '#f6f2c8' })
    );
    star.position.copy(position);
    stars.add(star);
  });
  const constellationLines = new THREE.BufferGeometry().setFromPoints(
    starPositions.flatMap((p, i) => (i < starPositions.length - 1 ? [p, starPositions[i + 1]] : []))
  );
  stars.add(
    new THREE.LineSegments(
      constellationLines,
      new THREE.LineBasicMaterial({ color: '#b5bfdf', transparent: true, opacity: 0.4 })
    )
  );

  const rover = new THREE.Group();
  scene.add(rover);
  box(rover, 0, 0.1, 0, 1.65, 0.65, 2.65, colors.yellow);
  box(rover, 0, 0.65, -0.25, 1.35, 0.8, 1.45, colors.white);
  box(rover, 0, 0.74, 0.5, 1.15, 0.5, 0.05, '#294d55');
  box(rover, 0, 1.08, -0.22, 1.48, 0.12, 1.6, colors.mint);
  cylinder(rover, 0.55, 1.4, -0.6, 0.035, 0.8, colors.ink);
  cylinder(rover, 0.55, 1.85, -0.6, 0.13, 0.12, colors.pink);
  for (const x of [-0.52, 0.52]) {
    box(rover, x, 0.1, 1.35, 0.35, 0.2, 0.08, colors.white);
    box(rover, x, 0.1, -1.35, 0.25, 0.15, 0.08, colors.pink);
  }
  const wheels: THREE.Group[] = [];
  const { body, collider, vehicle } = createRoverPhysics(physics);
  wheelPoints.forEach(([x]) => {
    const group = new THREE.Group();
    rover.add(group);
    const tire = cylinder(group, 0, 0, 0, 0.47, 0.32, colors.ink);
    tire.rotation.z = Math.PI / 2;
    const hub = cylinder(group, x > 0 ? 0.18 : -0.18, 0, 0, 0.24, 0.035, colors.white);
    hub.rotation.z = Math.PI / 2;
    wheels.push(group);
  });
  const follow = new THREE.Vector3(0, 0, 6);
  const target = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  let dragging: { x: number; y: number; moved: boolean; id: number } | null = null;
  const touches = new Map<number, { x: number; y: number }>();
  let pinchDistance = 0;
  let audio: AudioContext | null = null;
  let oscillator: OscillatorNode | null = null;
  let gain: GainNode | null = null;
  function sound() {
    if (!settings.sound || settings.paused) return;
    if (!audio) {
      audio = new AudioContext();
      oscillator = audio.createOscillator();
      gain = audio.createGain();
      oscillator.type = 'triangle';
      oscillator.connect(gain);
      gain.connect(audio.destination);
      gain.gain.value = 0.018;
      oscillator.start();
    }
    void audio.resume().catch(() => {});
  }
  function chime(frequency: number) {
    if (!settings.sound || document.hidden) return;
    sound();
    if (!audio) return;
    const note = audio.createOscillator();
    const volume = audio.createGain();
    note.frequency.value = frequency;
    note.type = 'sine';
    note.connect(volume);
    volume.connect(audio.destination);
    volume.gain.setValueAtTime(0.035, audio.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.14);
    note.start();
    note.stop(audio.currentTime + 0.15);
    note.onended = () => {
      note.disconnect();
      volume.disconnect();
    };
  }
  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    const h = width < 680 ? 34 : 39;
    camera.left = (-h * width) / height / 2;
    camera.right = (h * width) / height / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio, settings.quality === 'high' ? 1.7 : 1));
    renderer.setSize(width, height);
  }
  function resetPosition(x = 0, z = 6) {
    body.setTranslation({ x, y: 1.3, z }, true);
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    body.setRotation({ x: 0, y: 1, z: 0, w: 0 }, true);
    keys.clear();
    touchSteer = { x: 0, y: 0 };
    jumpQueued = false;
    follow.set(x, 0, z);
  }
  function cancelRace() {
    raceCheckpoint = -1;
    onEvent({ type: 'race', elapsed: 0, checkpoint: -1 });
  }
  function startRace() {
    resetPosition(circuit[0][0], circuit[0][1] + 2);
    raceTime = 0;
    raceCheckpoint = 1;
    onEvent({ type: 'race', elapsed: 0, checkpoint: 1 });
  }
  function applySettings(next: WorldSettings) {
    settings = next;
    settings.discovered?.forEach((id) => found.add(id));
    secretMeshes.forEach((mesh, i) => {
      mesh.visible = !found.has(discoveries[i].id);
    });
    stars.visible = settings.night;
    ambient.intensity = settings.night ? 0.75 : 2.2;
    sun.intensity = settings.night ? 0.8 : 3.1;
    sun.color.set(settings.night ? '#a8c0f0' : '#fff7ec');
    floor.material = material(settings.night ? '#151e35' : '#bad5ce');
    renderer.setClearColor(settings.night ? '#151e35' : '#bad5ce');
    renderer.shadowMap.enabled = settings.quality === 'high';
    resize();
    if (settings.paused) {
      keys.clear();
      touchSteer = { x: 0, y: 0 };
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
    if (!settings.sound || settings.paused) {
      if (gain) gain.gain.value = 0;
    } else {
      sound();
    }
  }
  function step() {
    const throttle =
      touchSteer.y ||
      (keys.has('w') || keys.has('arrowup') ? 1 : 0) -
        (keys.has('s') || keys.has('arrowdown') ? 1 : 0);
    const steering =
      touchSteer.x ||
      (keys.has('a') || keys.has('arrowleft') ? 1 : 0) -
        (keys.has('d') || keys.has('arrowright') ? 1 : 0);
    if (jumpQueued) {
      jumpQueued = false;
      if (elapsed - lastJump > 0.7 && roverGrounded(physics, body, collider)) {
        body.applyImpulse({ x: 0, y: 34, z: 0 }, true);
        lastJump = elapsed;
        chime(390);
        onEvent({ type: 'jump' });
      }
    }
    driveRover(vehicle, throttle, steering, touchBoost || keys.has('shift'), 1 / 60, collider);
    physics.step();
    elapsed += 1 / 60;
    const p = body.translation();
    if (Math.hypot(p.x, p.z) > 41 || p.y < -4) {
      resetPosition();
      cancelRace();
    }
    let next: string | null = null;
    let distance = 5.5;
    for (const work of works) {
      const d = Math.hypot(p.x - work.position[0], p.z - work.position[1]);
      if (d < distance) {
        next = work.id;
        distance = d;
      }
    }
    if (next !== nearby) {
      nearby = next;
      onEvent({ type: 'nearby', id: next });
    }
    discoveries.forEach((secret, i) => {
      if (
        !found.has(secret.id) &&
        Math.hypot(p.x - secret.position[0], p.z - secret.position[1]) < 2
      ) {
        found.add(secret.id);
        secretMeshes[i].visible = false;
        chime(760);
        onEvent({ type: 'discovery', id: secret.id });
      }
    });
    if (raceCheckpoint >= 0) {
      raceTime += 1 / 60;
      const [x, z] = circuit[raceCheckpoint];
      if (Math.hypot(p.x - x, p.z - z) < 3.4) {
        raceCheckpoint++;
        if (raceCheckpoint === circuit.length) {
          chime(880);
          onEvent({ type: 'race', elapsed: raceTime, checkpoint: raceCheckpoint, finished: true });
          raceCheckpoint = -1;
        }
      }
      if (raceCheckpoint >= 0 && elapsed - lastReport > 0.1) {
        lastReport = elapsed;
        onEvent({ type: 'race', elapsed: raceTime, checkpoint: raceCheckpoint });
      }
    }
  }
  function frame(now: number) {
    if (disposed || unavailable) return;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (document.hidden) {
      accumulator = 0;
      return;
    }
    raceMarker.visible = raceCheckpoint >= 0;
    if (raceCheckpoint >= 0)
      raceMarker.position.set(circuit[raceCheckpoint][0], 0.25, circuit[raceCheckpoint][1]);
    if (!settings.paused) {
      accumulator += dt;
      while (accumulator >= 1 / 60) {
        step();
        accumulator -= 1 / 60;
      }
    } else accumulator = 0;
    const p = body.translation(),
      q = body.rotation();
    rover.position.set(p.x, p.y, p.z);
    rover.quaternion.set(q.x, q.y, q.z, q.w);
    wheels.forEach((wheel, i) => {
      const [x, , z] = wheelPoints[i];
      wheel.position.set(x, -(vehicle.wheelSuspensionLength(i) ?? 0.42), z);
      wheel.rotation.y = vehicle.wheelSteering(i) ?? 0;
      wheel.children.forEach((child) => {
        child.rotation.x = vehicle.wheelRotation(i) ?? 0;
      });
    });
    movingProps.forEach((prop) => {
      const p = prop.body.translation(),
        q = prop.body.rotation();
      prop.mesh.position.set(p.x, p.y, p.z);
      prop.mesh.quaternion.set(q.x, q.y, q.z, q.w);
    });
    if (!settings.reduced && !settings.paused)
      secretMeshes.forEach((mesh, i) => {
        mesh.rotation.y += dt * 0.65;
        mesh.position.y = 1.2 + Math.sin(elapsed * 1.5 + i) * 0.13;
      });
    target.set(p.x, 0, p.z);
    follow.lerp(target, settings.reduced ? 1 : 1 - Math.exp(-dt * 4));
    camera.position.set(
      follow.x + Math.sin(azimuth) * Math.cos(elevation) * 52,
      Math.sin(elevation) * 52,
      follow.z + Math.cos(azimuth) * Math.cos(elevation) * 52
    );
    camera.lookAt(follow.x, 0, follow.z);
    if (gain && oscillator) {
      const speed = Math.min(Math.abs(vehicle.currentVehicleSpeed()), 20);
      gain.gain.value = settings.sound && !settings.paused ? 0.007 + speed * 0.001 : 0;
      oscillator.frequency.value = 65 + speed * 10;
    }
    host.dataset.position = `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`;
    host.dataset.checkpoint = String(raceCheckpoint);
    renderer.render(scene, camera);
  }
  const keydown = (event: KeyboardEvent) => {
    if (settings.paused) return;
    const key = event.key.toLowerCase();
    if (
      [
        'w',
        'a',
        's',
        'd',
        'arrowup',
        'arrowdown',
        'arrowleft',
        'arrowright',
        'shift',
        ' ',
        'r',
        'enter',
        '+',
        '-',
      ].includes(key)
    ) {
      event.preventDefault();
      keys.add(key);
      sound();
    }
    if (key === ' ') jumpQueued = true;
    if (key === 'r') {
      resetPosition();
      cancelRace();
    }
    if (key === 'enter' && nearby) {
      chime(520);
      onEvent({ type: 'open', id: nearby });
    }
    if (key === '+' || key === '-') {
      zoom = THREE.MathUtils.clamp(zoom * (key === '+' ? 1.1 : 0.9), 0.7, 1.7);
      resize();
    }
  };
  const keyup = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
  const blur = () => {
    keys.clear();
    touchSteer = { x: 0, y: 0 };
    touchBoost = false;
  };
  const visibility = () => {
    blur();
    last = performance.now();
    accumulator = 0;
    if (document.hidden && gain) gain.gain.value = 0;
  };
  const down = (event: PointerEvent) => {
    if (settings.paused) return;
    renderer.domElement.focus({ preventScroll: true });
    renderer.domElement.setPointerCapture(event.pointerId);
    touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dragging = { x: event.clientX, y: event.clientY, moved: false, id: event.pointerId };
    pinchDistance = 0;
    sound();
  };
  const move = (event: PointerEvent) => {
    if (!touches.has(event.pointerId) || settings.paused) return;
    touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDistance) {
        zoom = THREE.MathUtils.clamp((zoom * distance) / pinchDistance, 0.7, 1.7);
        resize();
      }
      pinchDistance = distance;
    }
    if (dragging && dragging.id === event.pointerId) {
      const dx = event.clientX - dragging.x,
        dy = event.clientY - dragging.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragging.moved = true;
      azimuth -= dx * 0.005;
      elevation = THREE.MathUtils.clamp(elevation + dy * 0.003, 0.42, 1.15);
      dragging.x = event.clientX;
      dragging.y = event.clientY;
    }
  };
  const up = (event: PointerEvent) => {
    touches.delete(event.pointerId);
    if (dragging?.id === event.pointerId && !dragging.moved && !settings.paused) {
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - rect.left) / width) * 2 - 1,
          (-(event.clientY - rect.top) / height) * 2 + 1
        ),
        camera
      );
      const hit = raycaster.intersectObjects(interactive, true)[0];
      if (hit?.object.userData.work) {
        chime(520);
        onEvent({ type: 'open', id: hit.object.userData.work });
      }
    }
    dragging = null;
  };
  const cancelPointer = () => {
    touches.clear();
    dragging = null;
    pinchDistance = 0;
  };
  const wheel = (event: WheelEvent) => {
    if (settings.paused) return;
    event.preventDefault();
    zoom = THREE.MathUtils.clamp(zoom * Math.exp(-event.deltaY * 0.001), 0.7, 1.7);
    resize();
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    unavailable = true;
    renderer.setAnimationLoop(null);
    host.dataset.renderer = 'fallback';
    blur();
    if (gain) gain.gain.value = 0;
    onFallback();
  };
  renderer.domElement.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  window.addEventListener('blur', blur);
  document.addEventListener('visibilitychange', visibility);
  renderer.domElement.addEventListener('pointerdown', down);
  renderer.domElement.addEventListener('pointermove', move);
  renderer.domElement.addEventListener('pointerup', up);
  renderer.domElement.addEventListener('pointercancel', cancelPointer);
  renderer.domElement.addEventListener('wheel', wheel, { passive: false });
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  applySettings(initial);
  host.dataset.renderer = 'webgl';
  renderer.setAnimationLoop(frame);
  return {
    update: applySettings,
    teleport(id) {
      const work = works.find((w) => w.id === id);
      if (work) {
        resetPosition(work.position[0], work.position[1] + 4.2);
        cancelRace();
      }
    },
    respawn() {
      resetPosition();
      cancelRace();
    },
    jump() {
      jumpQueued = true;
      sound();
    },
    steer(x, y) {
      touchSteer = { x, y };
      sound();
    },
    boost(value) {
      touchBoost = value;
      sound();
    },
    race: startRace,
    cancelRace,
    reset() {
      resetPosition();
      cancelRace();
      found.clear();
      secretMeshes.forEach((mesh) => {
        mesh.visible = true;
      });
      movingProps.forEach((prop) => {
        prop.body.setTranslation(prop.initial, true);
        prop.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        prop.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        prop.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      });
    },
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      renderer.domElement.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerup', up);
      renderer.domElement.removeEventListener('pointercancel', cancelPointer);
      renderer.domElement.removeEventListener('wheel', wheel);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      if (audio) void audio.close().catch(() => {});
      physics.free();
      const geometries = new Set<THREE.BufferGeometry>();
      const mats = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          geometries.add(object.geometry);
          (Array.isArray(object.material) ? object.material : [object.material]).forEach(
            (mat: THREE.Material) => mats.add(mat)
          );
        }
      });
      geometries.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      resources.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
