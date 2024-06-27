import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function (container) {
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );

  const controls = new OrbitControls(camera, renderer.domElement);
  const newCenter = new THREE.Vector3(1.5, 1.5, 1.5);

  controls.enableZoom = false;
  controls.enablePan = false;
  controls.target.copy(newCenter);

  camera.position.set(10, 10, 10);
  // camera.lookAt(5, 5, 5);
  controls.update();

  const grindHelper = new THREE.GridHelper(10, 10, 0x0000ff);
  scene.add(grindHelper);

  //  function to create the cubes
  function createCubes(scene, numCubes, gridSize) {
    const cubeSize = gridSize / Math.cbrt(numCubes); // Calculate cube size
    const offset = (gridSize - cubeSize) / 2; // Centering offset
    const cubes = [];

    for (let x = 0; x < Math.cbrt(numCubes); x++) {
      for (let y = 0; y < Math.cbrt(numCubes); y++) {
        for (let z = 0; z < Math.cbrt(numCubes); z++) {
          const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
          const material = new THREE.MeshBasicMaterial({
            color: Math.random() * 0xffffff,
            wireframe: false,
          });

          const cube = new THREE.Mesh(geometry, material);

          cube.position.set(2 + x - 1.5, 2 + y - 1.5, 2 + z - 1.5);

          scene.add(cube);

          cubes.push(cube);
        }
      }
    }
    return cubes;
  }

  const numCubes = 27;
  const cubes = createCubes(scene, 27, 3);

  function animate() {
    requestAnimationFrame(animate);
    controls.update();

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
}
// const geometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
//   const material = new THREE.MeshBasicMaterial({
//     color: 0x00ff00,
//     wireframe: true,
//   });
