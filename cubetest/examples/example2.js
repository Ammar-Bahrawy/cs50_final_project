import * as THREE from "three";
export default function (container) {
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / (window.innerHeight / 2),
    1,
    500
  );
  camera.position.set(0, 0, 100);
  camera.lookAt(0, 0, 0);
  const camera2 = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / (window.innerHeight / 2),
    1,
    500
  );
  camera2.position.set(0, 0, 100);
  camera2.lookAt(0, 0, 0);
  const scene = new THREE.Scene();
  const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
  const points = [];
  points.push(new THREE.Vector3(-10, 0, 0));
  points.push(new THREE.Vector3(0, 10, 0));
  points.push(new THREE.Vector3(10, 0, 0));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  renderer.render(scene, camera);
  function animate() {
    requestAnimationFrame(animate);
    line.rotation.x += 0.01;
    line.rotation.y += 0.01;

    const SCREEN_WIDTH = window.innerWidth;
    const SCREEN_HEIGHT = window.innerHeight;

    renderer.setScissorTest(true);

    renderer.setClearColor(0xff0000, 1);
    renderer.setScissor(
      0,
      SCREEN_HEIGHT * 0.3,
      SCREEN_WIDTH,
      SCREEN_HEIGHT * 0.7
    );
    renderer.setViewport(
      0,
      SCREEN_HEIGHT * 0.3,
      SCREEN_WIDTH,
      SCREEN_HEIGHT * 0.7
    );
    renderer.render(scene, camera);

    renderer.setClearColor(0x0000ff, 1);
    renderer.setScissor(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT * 0.3);
    renderer.setViewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT * 0.3);
    renderer.render(scene, camera2);

    //********************** */
    renderer.setScissorTest(fasle);
  }
  renderer.setAnimationLoop(animate);
}
