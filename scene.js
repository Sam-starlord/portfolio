import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas = document.getElementById("ai-scene");
const stage = document.querySelector(".hero-visual");

if (canvas && stage) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.z = 6;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const core = new THREE.Group();
  scene.add(core);

  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.55, 2),
    new THREE.MeshBasicMaterial({ color: 0x61e6d1, wireframe: true, transparent: true, opacity: 0.48 })
  );
  core.add(shell);

  const nucleus = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.68, 1),
    new THREE.MeshBasicMaterial({ color: 0xd8ff69, wireframe: true, transparent: true, opacity: 0.85 })
  );
  core.add(nucleus);

  const nodeGeometry = new THREE.SphereGeometry(0.055, 8, 8);
  const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xd8ff69 });
  const nodes = [];
  const links = new THREE.Group();
  core.add(links);

  for (let index = 0; index < 14; index += 1) {
    const angle = (index / 14) * Math.PI * 2;
    const radius = 1.85 + (index % 3) * 0.18;
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    node.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.7) * 0.9, Math.sin(angle) * radius * 0.5);
    nodes.push(node);
    core.add(node);
  }

  const linkMaterial = new THREE.LineBasicMaterial({ color: 0x61e6d1, transparent: true, opacity: 0.26 });
  for (let index = 0; index < nodes.length; index += 1) {
    const next = nodes[(index + 1) % nodes.length];
    const geometry = new THREE.BufferGeometry().setFromPoints([nodes[index].position, next.position]);
    links.add(new THREE.Line(geometry, linkMaterial));
  }

  const pointer = { x: 0, y: 0 };
  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  stage.addEventListener("pointermove", (event) => {
    const bounds = stage.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
  });

  stage.addEventListener("pointerleave", () => {
    pointer.x = 0;
    pointer.y = 0;
  });

  function animate(time) {
    core.rotation.y = time * 0.00016 + pointer.x * 0.22;
    core.rotation.x = Math.sin(time * 0.00025) * 0.12 + pointer.y * 0.16;
    shell.rotation.z = -time * 0.0001;
    nucleus.rotation.y = -time * 0.0003;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(animate);
}
