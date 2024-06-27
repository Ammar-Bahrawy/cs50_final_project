import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

export default function init(container) {
  const numCubes = 27;
  const gridSize = 3;
  const scene = initScene();
  const camera = initCamera();
  // const cameras = initMoreCameras(); // cameras
  const renderer = initRenderer();

  const orbitControls = initOrbitControls(camera, renderer);
  // const circles = initCircles(scene);
  const cubes = initCube(scene, numCubes, gridSize);
  const centers = initCenters(scene, cubes, connectCubes, disconnectCubes);
  initRaycast(
    camera,
    scene,
    renderer,
    cubes,
    onPointerDown,
    orbitControls,
    getAxis,
    getCenter,
    centers
  );
  // const circleTransformControls = initCirclesTransformControls(
  //   cameras[0], // camera
  //   renderer,
  //   scene,
  //   circles,
  //   cubes,
  //   orbitControls,
  //   rotateAxis
  // );
  // initGridHelper(scene);

  // positionControls(circleTransformControls);

  window.addEventListener("resize", function () {
    resize(camera, renderer); // , cameras[0]
  });

  function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();

    // updateCircleControls(circleTransformControls);
    // splitRender(renderer, scene, camera, cameras[0]); // multiscreen

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
    300
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
      disconnectCubes(cubes, scene);
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
function toggleOrbitControls(orbitControls, down) {
  if (down == "down") {
    orbitControls.enabled = false;
  } else {
    orbitControls.enabled = true;
  }
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
        // console.log("Cube position: ", cube.position);
        // cube.setRotationSnap = 0.5;

        scene.add(cube);

        cubes.push(cube);
      }
    }
  }
  return cubes;
}

function connectCubes(center, cubes, axis) {
  let min = [0, 2];
  let max = [1, 3];
  let index;

  // let axis = checkAxis(center);
  console.log("center position: ", center.position);
  if (center.position[axis] == 0.5) {
    index = 0;
  } else {
    index = 1;
  }
  for (let i = 0; i < cubes.length; i++) {
    if (
      cubes[i].position[axis] > min[index] &&
      cubes[i].position[axis] < max[index] &&
      center != cubes[i]
    ) {
      console.log("connected a cube to center");
      const worldPosition = new THREE.Vector3();
      cubes[i].getWorldPosition(worldPosition);
      // console.log("before: ", cubes[i].position);
      center.worldToLocal(worldPosition);
      worldPosition.x = parseFloat(worldPosition.x.toFixed(6));
      worldPosition.y = parseFloat(worldPosition.y.toFixed(6));
      worldPosition.z = parseFloat(worldPosition.z.toFixed(6));
      cubes[i].position.copy(worldPosition);
      //   console.log("after: ", cubes[i].position);
      center.add(cubes[i]);
    }
  }
}

function disconnectCubes(cubes, scene) {
  for (let i = 0; i < cubes.length; i++) {
    const worldPosition = new THREE.Vector3();
    cubes[i].getWorldPosition(worldPosition);
    cubes[i].position.copy(worldPosition);
    scene.add(cubes[i]);
    console.log("disconnected");
  }
}

function initCenters(scene, cubes, connectCubes, disconnectCubes) {
  let centers = [];
  for (let i = 0, n = cubes.length; i < n; i++) {
    for (let x = 0.5; x <= 2.5; x++) {
      for (let y = 0.5; y <= 2.5; y++) {
        for (let z = 0.5; z <= 2.5; z++) {
          let count = 0;

          if (x === 1.5) count++;
          if (y === 1.5) count++;
          if (z === 1.5) count++;

          if (count >= 2) {
            let xAxis = x === 1.5 ? 1 : 0;
            let yAxis = y === 1.5 ? 1 : 0;
            let zAxis = z === 1.5 ? 1 : 0;
            const vector = new THREE.Vector3(x, y, z);

            if (cubes[i].position.equals(vector)) {
              console.log("vector: ", vector);
              console.log("cube position: ", cubes[i].position);
              centers.push(cubes[i]);
              cubes[i].material.transparent = true;
              cubes[i].material.opacity = 0.5;
              console.log("cube center added");
            }
          }
        }
      }
    }
  }

  console.log(centers.length);
  return centers;
}

function checkAxis(center) {
  let axis;
  if (center.position.x != 1.5) {
    axis = "x";
  }
  if (center.position.y != 1.5) {
    axis = "y";
  }
  if (center.position.z != 1.5) {
    axis = "z";
  }
  console.log(axis);
  return axis;
}

function checkAxis2() {}

function resize(camera, renderer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerDown(event, pointer, intersects, cubes, orbitControls) {
  if (intersects.length > 0) {
    const closestObject = intersects[0].object;

    for (let i = 0, n = cubes.length; i < n; i++) {
      if (closestObject == cubes[i]) {
        console.log("Clicked a cube");
        toggleOrbitControls(orbitControls, "down");

        // *****************************

        const facePosition = getFacePosition(intersects[0]);
        console.log("Face position: ", facePosition);

        // *****************************

        return closestObject.position;
      }
    }
  }
}

function getFacePosition(intersect) {
  // Get the point of intersection
  const intersectionPoint = intersect.point;

  // Calculate the centroid of the intersected face (if needed)
  const face = intersect.face;
  const geometry = intersect.object.geometry;
  const vertices = geometry.attributes.position;

  console.log("Face: ", face);

  const vA = new THREE.Vector3().fromBufferAttribute(vertices, face.a);
  const vB = new THREE.Vector3().fromBufferAttribute(vertices, face.b);
  const vC = new THREE.Vector3().fromBufferAttribute(vertices, face.c);

  const faceCentroid = new THREE.Vector3()
    .add(face.a)
    .add(face.b)
    .add(face.c)
    .divideScalar(3);

  return faceCentroid;
}

function initRaycast(
  camera,
  scene,
  renderer,
  cubes,
  onPointerDown,
  orbitControls,
  getAxis,
  getCenter,
  centers
) {
  let mousePosition = null;
  let down = false;
  let axis;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  renderer.domElement.addEventListener("pointerup", function (event) {
    toggleOrbitControls(orbitControls, !event.value);
    // mousePosition = null;
    disconnectCubes(cubes, scene);
  });

  renderer.domElement.addEventListener("pointerdown", function (event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    let position = onPointerDown(
      event,
      pointer,
      intersects,
      cubes,
      orbitControls
    );

    if (position) {
      down = true;
      let center = getCenter(centers, position, axis);
      if (center) connectCubes(center, cubes, axis);
    }
    mousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
  });
  renderer.domElement.addEventListener("mousemove", function (event) {
    if (down) {
      [down, axis] = getAxis(event, mousePosition);
    }
  });
}

function getAxis(event, mousePosition) {
  if (mousePosition) {
    const deltaX = event.clientX - mousePosition.x;
    const deltaY = event.clientY - mousePosition.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      console.log("Mouse moved along the x-axis first");
      return [false, "x"];
    } else {
      console.log("Mouse moved along the y-axis first");
      return [false, "y"];
    }
  }
}

function getCenter(centers, position, axis) {
  let centerY = axis == "x" ? 2.5 : 1.5;
  let positionY = position.y;
  // if (axis == "x") {
  //   // WILL BE BACK!!
  //   let commonAxis = position.y;
  // } else {
  //   for (let i = 0, n = centers.length; i < n; i++) {
  //     if (
  //       centers.position.z == position.z ||
  //       centers.position.x == position.x
  //     ) {
  //       console.log("FOUND CENTER!");
  //       return centers[i];
  //     }
  //   }
  // }

  for (let i = 0, n = centers.length; i < n; i++) {
    if (centers[i].position[axis] === centerY) {
      console.log("FOUND CENTER!");
      return centers[i];
    }
  }
}
// function

// width = 1920
// height = 919

// v = [
//   (0.5, 1.5, 1.5),
//   (2.5, 1.5, 1.5),
//   (1.5, 1.5, 0.5),
//   (1.5, 1.5, 2.5),
//   (1.5, 0.5, 1.5),
//   (1.5, 2.5, 1.5),
// ];

// setTimeout(function () {
//         circle.add(cube);
//         cube.position.set(x - 1, y - 1, 0);
//         console.log("Waited for 2 seconds!");
//       }, 2000);
