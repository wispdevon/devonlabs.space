import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { areProjectsConnected, categoryColors, projects } from '@/data/developer-projects';

export type SceneState = { matches: string[]; selected: string | null; hovered: string | null; paused: boolean };
export type SceneHandle = { update: (state: SceneState) => void; zoom: (amount: number) => void; reset: () => void; rotate: (x: number, y: number) => void; dispose: () => void };

const positions = [
  [-4.8, 1.8, .5], [-1.7, 3, -.7], [1.6, 1.2, .8],
  [4.8, 2.8, -.5], [-1.9, -.5, .3], [-5, -2.3, -.6],
  [4.7, -1.2, .4], [-1.4, -3, .5], [2, -2.6, -.4]
];

export function mountConstellation(host: HTMLDivElement, buttons: Map<string, HTMLButtonElement>, initial: SceneState, onFallback: () => void): SceneHandle {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const world = new THREE.Group();
  scene.add(world);
  const camera = new THREE.OrthographicCamera(-7, 7, 4, -4, .1, 100);
  camera.position.set(0, 0, 20);
  const controls = new OrbitControls(camera, renderer.domElement);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  controls.enableDamping = !reduced.matches;
  controls.dampingFactor = .12;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = .35;
  controls.minAzimuthAngle = -.38;
  controls.maxAzimuthAngle = .38;
  controls.minPolarAngle = Math.PI / 2 - .22;
  controls.maxPolarAngle = Math.PI / 2 + .22;
  // One-finger vertical movement remains available for normal mobile page scrolling.
  controls.touches.ONE = THREE.TOUCH.PAN;
  controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
  renderer.domElement.style.touchAction = 'pan-y';
  let state = initial;
  let width = 1;
  let height = 1;
  let visible = true;
  let interacting = false;
  let elapsed = 0;
  let previous = performance.now();
  let disposed = false;
  let contextUnavailable = false;

  const nodeGeometry = new THREE.SphereGeometry(.055, 12, 8);
  const nodes = projects.map(project => {
    const material = new THREE.MeshBasicMaterial({ color: categoryColors[project.category], transparent: true });
    const node = new THREE.Mesh(nodeGeometry, material);
    world.add(node);
    return node;
  });
  const links = projects.flatMap((project, i) => projects.slice(i + 1).flatMap((other, offset) => {
    const j = i + offset + 1;
    const sameCategory = project.category === other.category;
    if (!areProjectsConnected(project, other)) return [];
    const material = new THREE.LineBasicMaterial({ color: sameCategory ? categoryColors[project.category] : '#85858d', transparent: true, opacity: .25 });
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const line = new THREE.Line(geometry, material);
    world.add(line);
    return [{ i, j, line, sameCategory }];
  }));

  const pulseGeometry = new THREE.SphereGeometry(.09, 8, 6);
  const pulseMaterial = new THREE.MeshBasicMaterial({ color: '#e7e7e7', transparent: true, opacity: .8 });
  const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
  world.add(pulse);
  const projected = new THREE.Vector3();

  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    const mobile = width < 680;
    const spanY = mobile ? 11.6 : Math.max(8.9, 13.4 * height / width);
    const spanX = spanY * width / height;
    camera.left = -spanX / 2;
    camera.right = spanX / 2;
    camera.top = spanY / 2;
    camera.bottom = -spanY / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    nodes.forEach((node, index) => {
      const position = mobile
        ? [index % 2 === 0 ? -1.5 : 1.5, 4.3 - Math.floor(index / 2) * 2.12, (index % 3 - 1) * .3]
        : positions[index];
      node.position.set(position[0], position[1], position[2]);
    });
    links.forEach(({ i, j, line }) => {
      const attribute = line.geometry.getAttribute('position');
      attribute.setXYZ(0, nodes[i].position.x, nodes[i].position.y, nodes[i].position.z);
      attribute.setXYZ(1, nodes[j].position.x, nodes[j].position.y, nodes[j].position.z);
      attribute.needsUpdate = true;
      line.geometry.computeBoundingSphere();
    });
    frame(performance.now());
  }

  function frame(now: number) {
    if (disposed || contextUnavailable) return;
    const delta = Math.min((now - previous) / 1000, .05);
    previous = now;
    if (!visible || document.hidden) return;
    const moving = !state.paused && !reduced.matches && !interacting && !state.selected && !state.hovered;
    if (moving) elapsed += delta;
    // Keep project targets stationary; animate signals along their connections.
    controls.update();
    world.updateMatrixWorld();
    camera.updateMatrixWorld();
    const active = state.hovered || state.selected;
    const matched = new Set(state.matches);
    nodes.forEach((node, index) => {
      const project = projects[index];
      const button = buttons.get(project.repo);
      node.material.opacity = matched.has(project.repo) ? 1 : .18;
      node.getWorldPosition(projected).project(camera);
      if (button) {
        const x = (projected.x + 1) * width / 2;
        const y = (1 - projected.y) * height / 2;
        const inFrame = x > 55 && x < width - 55 && y > 30 && y < height - 65;
        button.style.transform = `translate(${x}px, ${y}px) translate(-50%, -25px)`;
        button.style.visibility = inFrame ? 'visible' : 'hidden';
        button.style.zIndex = project.repo === active ? '3' : '2';
      }
    });
    links.forEach(({ i, j, line, sameCategory }) => {
      const a = projects[i].repo;
      const b = projects[j].repo;
      const matching = matched.has(a) && matched.has(b);
      line.material.opacity = !matching ? .045 : active ? (a === active || b === active ? .75 : .08) : sameCategory ? .3 : .14;
    });
    const availableLinks = links.filter(link => matched.has(projects[link.i].repo) && matched.has(projects[link.j].repo));
    const path = availableLinks[Math.floor(elapsed / 2.7) % availableLinks.length];
    pulse.visible = moving && !!path;
    if (path) pulse.position.lerpVectors(nodes[path.i].position, nodes[path.j].position, elapsed % 2.7 / 2.7);
    renderer.render(scene, camera);
  }

  function zoom(amount: number) {
    camera.zoom = THREE.MathUtils.clamp(camera.zoom * amount, .85, 1.7);
    camera.updateProjectionMatrix();
    frame(performance.now());
  }
  function reset() {
    controls.reset();
    camera.position.set(0, 0, 20);
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    elapsed = 0;
    controls.update();
    frame(performance.now());
  }
  function rotate(x: number, y: number) {
    camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), x);
    camera.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), y);
    controls.update();
    frame(performance.now());
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  intersection.observe(host);
  const wheel = (event: WheelEvent) => {
    if (!event.altKey || event.ctrlKey) return;
    event.preventDefault();
    zoom(Math.exp(-event.deltaY * .001));
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    contextUnavailable = true;
    renderer.setAnimationLoop(null);
    host.classList.remove('scene-ready');
    host.dataset.renderer = 'fallback';
    buttons.forEach(button => { button.style.transform = ''; button.style.visibility = ''; });
    onFallback();
  };
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('wheel', wheel, { passive: false });
  controls.addEventListener('start', () => { interacting = true; host.classList.add('is-dragging'); });
  controls.addEventListener('end', () => { interacting = false; host.classList.remove('is-dragging'); });
  const changeMotion = () => { controls.enableDamping = !reduced.matches; frame(performance.now()); };
  reduced.addEventListener('change', changeMotion);
  host.classList.add('scene-ready');
  host.dataset.renderer = 'webgl';
  resize();
  renderer.setAnimationLoop(frame);
  return {
    update(next) { state = next; frame(performance.now()); },
    zoom,
    reset,
    rotate,
    dispose() {
      disposed = true;
      observer.disconnect();
      intersection.disconnect();
      renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener('wheel', wheel);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      reduced.removeEventListener('change', changeMotion);
      controls.dispose();
      links.forEach(({ line }) => { line.geometry.dispose(); line.material.dispose(); });
      nodes.forEach(node => node.material.dispose());
      nodeGeometry.dispose();
      pulseGeometry.dispose();
      pulseMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      host.classList.remove('scene-ready');
    }
  };
}
