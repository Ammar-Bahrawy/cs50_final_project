import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

export default function init(container) {
  const numCubes = 27;
  const gridSize = 3;
  const scene = initScene();
  const camera = initCamera();
  const renderer = initRenderer();
  const orbitControls = initOrbitControls(camera, renderer);
  const circles = initCircles(scene);
  const cubes = initCube(scene, numCubes, gridSize);
  const circleTransformControls = initCirclesTransformControls(
    camera,
    renderer,
    scene,
    circles,
    cubes,
    orbitControls,
    rotateAxis
  );
  initGridHelper(scene);

  function animate() {
    // requestAnimationFrame(animate);
    // orbitControls.update();

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
}

function initScene() {
  return new THREE.Scene();
}

function initCamera() {
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(10, 10, 10);
  camera.lookAt(5, 5, 5);
  return camera;
}

function initRenderer() {
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  return renderer;
}

function initOrbitControls(camera, renderer) {
  const orbitControls = new OrbitControls(camera, renderer.domElement);
  const newCenter = new THREE.Vector3(1.5, 1.5, 1.5);
  orbitControls.enableZoom = false;
  orbitControls.enablePan = false;
  orbitControls.target.copy(newCenter);
  orbitControls.update();

  return orbitControls;
}

function initGridHelper(scene) {
  const size = 10;
  const divisions = 10;
  const gridHelperY = new THREE.GridHelper(size, divisions, 0x0000ff);
  const gridHelper = new THREE.GridHelper(size, divisions, 0x0000ff);
  gridHelperY.rotation.x = Math.PI / 2; // Rotate to lie on XY plane
  scene.add(gridHelperY);
  scene.add(gridHelper);
}

function initCirclesTransformControls(
  camera,
  renderer,
  scene,
  circles,
  cubes,
  orbitControls,
  rotateAxis
) {
  let circlesTransformControls = [];
  for (let i = 0, n = circles.length; i < n; i++) {
    const circleTransformControls = new TransformControls(
      camera,
      renderer.domElement
    );
    circleTransformControls.attach(circles[i]);
    circleTransformControls.setMode("rotate");
    circleTransformControls.setSpace("local");
    circleTransformControls.showX = false;
    circleTransformControls.showY = false;
    scene.add(circleTransformControls);

    circleTransformControls.addEventListener("mouseDown", () => {
      // rotateAxis(circles[i]);
      connectCubes(circles[i], cubes);
    });

    circleTransformControls.addEventListener("mouseUp", () => {
      rotateAxis(circles[i]);
      disconnectCubes(circles[i], cubes, scene);
    });

    circleTransformControls.addEventListener(
      "dragging-changed",
      function (event) {
        toggleOrbitControls(orbitControls, !event.value); // Disable OrbitControls while dragging
      }
    );

    circlesTransformControls.push(circleTransformControls);
    console.log("circle added control");
  }
  return circlesTransformControls;
}

// Function to toggle OrbitControls
function toggleOrbitControls(orbitControls, enabled) {
  orbitControls.enabled = enabled;
}

function rotateAxis(circle) {
  let axis = checkAxis(circle);
  axis = axis == "y" ? "z" : axis;

  const snapAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]; // Snap angles in radians
  const currentRotation = circle.rotation[axis]; // Get current rotation around axis

  // Find the nearest snap angle
  let nearestAngle = snapAngles[0];
  let minDifference = Math.abs(currentRotation - snapAngles[0]);

  for (let i = 1; i < snapAngles.length; i++) {
    let difference = Math.abs(currentRotation - snapAngles[i]);
    // Ensure difference is within 2π range for correct comparison
    difference = difference > Math.PI ? Math.PI * 2 - difference : difference;

    if (difference < minDifference) {
      minDifference = difference;
      nearestAngle = snapAngles[i];
    }
  }
  console.log("rotateAxis: ", axis);
  console.log("current angle: ", currentRotation);
  console.log("Nearest angle: ", nearestAngle);
  // Set the circle's rotation to the nearest snap angle
  circle.rotation[axis] = nearestAngle;
}

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({
  color: Math.random() * 0xffffff,
  wireframe: false,
});

function initCube(scene, numCubes, gridSize) {
  const cubeSize = gridSize / Math.cbrt(numCubes) - 0.01; // Calculate cube size
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

        cube.position.set(x + 0.5, y + 0.5, z + 0.5);
        // cube.setRotationSnap = 0.5;

        scene.add(cube);

        cubes.push(cube);
      }
    }
  }
  return cubes;
}

function connectCubes(circle, cubes) {
  let min = [0, 2];
  let max = [1, 3];
  let index;

  let axis = checkAxis(circle);

  if (circle.position[axis] == 0.5) {
    index = 0;
  } else {
    index = 1;
  }

  for (let i = 0; i < cubes.length; i++) {
    if (
      cubes[i].position[axis] > min[index] &&
      cubes[i].position[axis] < max[index]
    ) {
      const worldPosition = new THREE.Vector3();
      cubes[i].getWorldPosition(worldPosition);
      //   console.log("before: ", cubes[i].position);
      circle.worldToLocal(worldPosition);
      worldPosition.x = parseFloat(worldPosition.x.toFixed(6));
      worldPosition.y = parseFloat(worldPosition.y.toFixed(6));
      worldPosition.z = parseFloat(worldPosition.z.toFixed(6));
      cubes[i].position.copy(worldPosition);
      //   console.log("after: ", cubes[i].position);
      circle.add(cubes[i]);
      console.log("connected");
    }
  }
}

function disconnectCubes(circle, cubes, scene) {
  for (let i = 0; i < cubes.length; i++) {
    const worldPosition = new THREE.Vector3();
    cubes[i].getWorldPosition(worldPosition);
    cubes[i].position.copy(worldPosition);
    scene.add(cubes[i]);
    console.log("disconnected");
  }
}

function initCircles(scene) {
  const circles = [];
  for (let x = 0.5; x <= 2.5; x++) {
    for (let y = 0.5; y <= 2.5; y++) {
      for (let z = 0.5; z <= 2.5; z++) {
        let count = 0;

        if (x === 1.5) count++;
        if (y === 1.5) count++;
        if (z === 1.5) count++;

        if (count == 2) {
          const circleGeomerty = new THREE.CircleGeometry(2, 20);
          const circleMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
          });
          const circle = new THREE.Mesh(circleGeomerty, circleMaterial);
          circle.position.set(x, y, z);

          let xAxis = x === 1.5 ? 0 : 0.5;
          let yAxis = y === 1.5 ? 0 : 0.5;
          let zAxis = z === 1.5 ? 0 : 0.5;

          circle.lookAt(x + xAxis, y + yAxis, z + zAxis);
          scene.add(circle);

          circles.push(circle);

          console.log("circle added");
        }
      }
    }
  }
  return circles;
}

function checkAxis(circle) {
  let axis;
  if (circle.position.x != 1.5) {
    axis = "x";
  }
  if (circle.position.y != 1.5) {
    axis = "y";
  }
  if (circle.position.z != 1.5) {
    axis = "z";
  }
  console.log(axis);
  return axis;
}

// v = [
//   (0.5, 1.5, 1.5),
//   (2.5, 1.5, 1.5),
//   (1.5, 1.5, 0.5),
//   (1.5, 1.5, 2.5),
//   (1.5, 0.5, 1.5),
//   (1.5, 2.5, 1.5),
// ];
// circle.add(cubes[i]);
// cubes[i].position.x -= 1.5;
// // cubes[i].position.y -= 1.5;
// cubes[i].position.z -= 2.5;

// setTimeout(function () {
//         circle.add(cube);
//         cube.position.set(x - 1, y - 1, 0);
//         console.log("Waited for 2 seconds!");
//       }, 2000);
