import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

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

  const orbitControls = new OrbitControls(camera, renderer.domElement);
  const newCenter = new THREE.Vector3(1.5, 1.5, 1.5);

  orbitControls.enableZoom = false;
  orbitControls.enablePan = false;
  orbitControls.target.copy(newCenter);

  camera.position.set(10, 10, 10);
  camera.lookAt(5, 5, 5);
  orbitControls.update();

  const grindHelper = new THREE.GridHelper(10, 10, 0x0000ff);
  scene.add(grindHelper);

  const circleGeomerty = new THREE.CircleGeometry(2, 20);
  const circleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const circle = new THREE.Mesh(circleGeomerty, circleMaterial);
  circle.position.set(0.5, 1.5, 1.5);
  circle.lookAt(0, 1.5, 1.5);
  scene.add(circle);

  const circleTransformControls = new TransformControls(
    camera,
    renderer.domElement
  );
  circleTransformControls.attach(circle);
  circleTransformControls.setMode("rotate");
  circleTransformControls.setSpace("local");
  circleTransformControls.setRotationSnap(Math.PI / 4);
  scene.add(circleTransformControls);

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
  const cubes = createCubes(scene, numCubes, 3);

  const transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.attach(cubes[1]);
  //   transformControls.mode = "rotate";
  //   will need to play around witht this later
  //   transformControls.translationSnap = 3;
  scene.add(transformControls);

  // Function to toggle OrbitControls
  function toggleOrbitControls(enabled) {
    orbitControls.enabled = enabled;
  }

  // Event listener for TransformControls
  transformControls.addEventListener("dragging-changed", function (event) {
    toggleOrbitControls(!event.value); // Disable OrbitControls while dragging
  });
  circleTransformControls.addEventListener(
    "dragging-changed",
    function (event) {
      toggleOrbitControls(!event.value); // Disable OrbitControls while dragging
    }
  );

  function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
}
// const geometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
//   const material = new THREE.MeshBasicMaterial({
//     color: 0x00ff00,
//     wireframe: true,
//   });
