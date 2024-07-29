import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

// export default function init(container) {
const numCubes = 27;
const gridSize = 3;
const scene = initScene();
const camera = initCamera();
// const cameras = initMoreCameras(); // cameras
const renderer = initRenderer();

const orbitControls = initOrbitControls(camera, renderer);
// const circles = initCircles(scene);

const textures = initTexture();
initLight(scene);

const cubes = initCube(scene, numCubes, gridSize, textures);
const centers = initCenters(scene, cubes, textures);
initRaycast(
  camera,
  scene,
  renderer,
  cubes,
  onPointerDown,
  orbitControls,
  getAxis,
  getCenter,
  centers,
  resetCentersRotation
);

window.addEventListener("resize", function () {
  resize(camera, renderer); // , cameras[0]
});

function animate() {
  // orbitControls.update();

  renderer.render(scene, camera);
  // requestAnimationFrame(animate);
}

renderer.setAnimationLoop(animate);
// }

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
  // orbitControls.enableZoom = false;
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
  gridHelperY.rotation.x = Math.PI / 2;
  scene.add(gridHelperY);
  scene.add(gridHelper);
}

// Function to toggle OrbitControls
function toggleOrbitControls(orbitControls, down) {
  if (down == "down") {
    orbitControls.enabled = false;
  } else {
    orbitControls.enabled = true;
  }
}

function rotateAxis(center) {
  let axis = ["x", "y", "z"];
  for (let i = 0; i < 3; i++) {
    const snapAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]; // Snap angles in radians
    const currentRotation = center.rotation[axis[i]]; // Get current rotation around axis[i]

    // Find the nearest snap angle
    let nearestAngle = snapAngles[0];
    let minDifference = Math.abs(currentRotation - snapAngles[0]);

    for (let j = 1; j < snapAngles.length; j++) {
      // Corrected index from i to j
      let difference = Math.abs(currentRotation - snapAngles[j]);
      difference = difference > Math.PI ? Math.PI * 2 - difference : difference;

      if (difference < minDifference) {
        minDifference = difference;
        nearestAngle = snapAngles[j];
      }
    }

    center.rotation[axis[i]] = nearestAngle;
  }
}

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({
  color: Math.random() * 0xffffff,
  wireframe: false,
});

function initCube(scene, numCubes, gridSize, materials) {
  const cubeSize = gridSize / Math.cbrt(numCubes); // Calculate cube size - 0.01
  const cubes = [];

  for (let x = 0, n = Math.cbrt(numCubes); x < n; x++) {
    for (let y = 0; y < n; y++) {
      for (let z = 0; z < n; z++) {
        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        // const material = new THREE.MeshStandardMaterial({
        //   map: textures,
        // });

        const cube = new THREE.Mesh(geometry, materials);

        // ***

        // if (x == 0) {
        //   const material = new THREE.MeshStandardMaterial({
        //     color: 0x222222,
        //   });
        //   cube.material = material;
        // }

        // ***

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
  // console.log("center position: ", center.position);
  if (center.position[axis] == 0.5) {
    index = 0;
  } else {
    index = 1;
  }
  for (let i = 0, n = cubes.length; i < n; i++) {
    if (
      cubes[i].position[axis] > min[index] &&
      cubes[i].position[axis] < max[index] &&
      center != cubes[i]
    ) {
      // console.log("connected a cube to center");
      const worldPosition = new THREE.Vector3();
      cubes[i].getWorldPosition(worldPosition);
      // console.log("before: ", cubes[i].position);
      center.worldToLocal(worldPosition);
      worldPosition.x = parseFloat(worldPosition.x.toFixed(6));
      worldPosition.y = parseFloat(worldPosition.y.toFixed(6));
      worldPosition.z = parseFloat(worldPosition.z.toFixed(6));
      cubes[i].material.color.set(0xffffff);
      cubes[i].position.copy(worldPosition);
      //   console.log("after: ", cubes[i].position);
      center.add(cubes[i]);
    }
  }
}

function disconnectCubes(cubes, scene) {
  for (let i = 0; i < cubes.length; i++) {
    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();

    cubes[i].getWorldQuaternion(worldQuaternion);

    cubes[i].getWorldPosition(worldPosition);
    cubes[i].position.x = Math.round(worldPosition.x * 10) / 10;
    cubes[i].position.y = Math.round(worldPosition.y * 10) / 10;
    cubes[i].position.z = Math.round(worldPosition.z * 10) / 10;

    scene.add(cubes[i]);

    cubes[i].quaternion.copy(worldQuaternion);
    // console.log("disconnected");
  }
}

function initCenters(scene, cubes, textures) {
  let centers = [];
  let count1 = [1, 3, 5, 4, 2, 0];
  let countCount = 0;
  for (let i = 0, n = cubes.length; i < n; i++) {
    for (let x = 0.5; x <= 2.5; x++) {
      for (let y = 0.5; y <= 2.5; y++) {
        for (let z = 0.5; z <= 2.5; z++) {
          let count = 0;

          if (x === 1.5) count++;
          if (y === 1.5) count++;
          if (z === 1.5) count++;

          if (count >= 2) {
            const vector = new THREE.Vector3(x, y, z);

            if (cubes[i].position.equals(vector)) {
              // console.log("vector: ", vector);
              // console.log("cube position: ", cubes[i].position);
              // console.log("count1: ", count1);
              // console.log("i: ", i);
              if (i != 13) {
                // console.log("count1: ", count1[countCount]);
                cubes[i].material = textures[count1[countCount]];
                countCount++;
                // let textureNames = ["orange", "white", "blue", "green", "yellow", "red"];
                // let textureNames = ["red", "orange", "yellow", "white", "green", "blue"];
              }
              centers.push(cubes[i]);
              // console.log("cube center added");
            }
          }
        }
      }
    }
  }

  // console.log(centers.length);
  return centers;
}

// function checkAxis(center, isCenter, cubeSide) {
//   let axis;
//   if (center.position.x != 1.5) {
//     axis = "x";
//   } else if (center.position.y != 1.5) {
//     axis = "y";
//   } else if (center.position.z != 1.5) {
//     axis = "z";
//   }
//   if (isCenter) {
//     if (cubeSide == "x") {
//       axis = "z";
//     } else if (cubeSide == "z") {
//       axis = "x";
//     } else if (cubeSide == "y") {
//       axis = "x";
//     }
//   }
//   return axis;
// }

function resize(camera, renderer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerDown(event, intersects, cubes, orbitControls) {
  if (intersects.length > 0) {
    const closestObject = intersects[0].object;

    for (let i = 0, n = cubes.length; i < n; i++) {
      if (closestObject == cubes[i]) {
        // console.log("Clicked a cube: ", cubes[i].position);
        toggleOrbitControls(orbitControls, "down");

        // *****************************

        const facePosition = getFacePosition(intersects[0]);
        // console.log("Face position: ", facePosition);

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

  // console.log("Face: ", face);

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
  centers,
  resetCentersRotation
) {
  let mousePosition = null;
  let intersectPosition = null;
  let down = false;
  let axis;
  let axis3D;
  let position;
  let center;
  let intersects = [];
  let isMouseDown = false;
  let rotationSpeed = 0.01;
  let face, cubeSide;
  let connectedCubes = [];
  let centerRotation = null;
  let centerNewRotation;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  // const pointer = new THREE.Vector3();

  renderer.domElement.addEventListener("pointerup", function (event) {
    toggleOrbitControls(orbitControls, !event.value);
    // mousePosition = null;
    if (center) {
      rotateAxis(center);
      centerNewRotation = center.rotation;
      isMouseDown = false;
      disconnectCubes(cubes, scene);
      // rotateCubes(connectedCubes, center, centerRotation, centerNewRotation);
      // console.log("initial: ", centerRotation);
      resetCentersRotation(centers);
      centerRotation = null;
    }
    center = null;
  });

  renderer.domElement.addEventListener("pointerdown", function (event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    intersects = raycaster.intersectObjects(scene.children);
    position = onPointerDown(event, intersects, cubes, orbitControls);

    if (position) {
      down = true;
    }
    mousePosition = {
      x: event.clientX,
      y: event.clientY,
    };

    // intersectPosition = {
    //   x: intersects[0].point.x,
    //   y: intersects[0].point.y,
    //   z: intersects[0].point.z,
    // };

    isMouseDown = true;
  });

  renderer.domElement.addEventListener("mousemove", function (event) {
    if (down) {
      [down, axis] = getAxis(event, mousePosition);
      // console.log("position and axis: ", position + axis);
      if (centers && position && axis && intersects[0].point) {
        fixPositionFloatError(cubes);
        [center, face, cubeSide] = getCenter(
          centers,
          position,
          axis,
          intersects[0].point
        );
      }
      if (center) {
        if (!centerRotation) {
          centerRotation = center.rotation;
          // console.log("initial: ", centerRotation);
        } // 8*****************************************
        [axis3D, connectedCubes] = ConnectToCenter(
          center,
          cubes,
          axis,
          face,
          cubeSide
        );
        down = false;
      }
    }
    // ********************************************************************************
    if (isMouseDown) {
      const deltaMove = {
        x: event.clientX - mousePosition.x,
        y: event.clientY - mousePosition.y,
      };
      // const deltaMove = {
      //   x: intersects[0].point.x - intersectPosition.x,
      //   y: intersects[0].point.y - intersectPosition.y,
      //   z: intersects[0].point.z - intersectPosition.z,
      // };

      mousePosition = {
        x: event.clientX,
        y: event.clientY,
      };
      // intersectPosition = {
      //   x: intersects[0].point.x,
      //   y: intersects[0].point.y,
      //   z: intersects[0].point.z,
      // };
      if (center)
        rotateObject(
          center,
          deltaMove,
          axis3D,
          rotationSpeed,
          face,
          connectedCubes
        );
    }
  });
}

function getAxis(event, mousePosition) {
  if (mousePosition) {
    const deltaX = event.clientX - mousePosition.x;
    const deltaY = event.clientY - mousePosition.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // console.log("Mouse moved along the x-axis first");
      return [false, "x"];
    } else {
      // console.log("Mouse moved along the y-axis first");
      return [false, "y"];
    }
  }
}

function getCenter(centers, position, axis, intersectPoint) {
  let newPosition = new THREE.Vector3();
  let cubeSide;
  const conditionX = position.x == 1.5,
    conditionY = position.y == 1.5,
    conditionZ = position.z == 1.5,
    firstCondition =
      (conditionX && conditionY) ||
      (conditionX && conditionZ) ||
      (conditionZ && conditionY);
  let face = 1;

  intersectPoint.x = parseFloat(intersectPoint.x.toFixed(2));
  intersectPoint.y = parseFloat(intersectPoint.y.toFixed(2));
  intersectPoint.z = parseFloat(intersectPoint.z.toFixed(2));

  if (intersectPoint.x == 3 || intersectPoint.x == 0) {
    face = intersectPoint.x == 0 ? 1 : -1;
    cubeSide = "x";
    newPosition.x = 1.5;
    if (axis == "y") {
      newPosition.y = 1.5;
      newPosition.z = position.z;
    } else {
      newPosition.z = 1.5;
      newPosition.y = position.y;
    }
  } else if (intersectPoint.z == 3 || intersectPoint.z == 0) {
    face = intersectPoint.z == 0 ? 1 : -1;
    cubeSide = "z";
    newPosition.z = 1.5;
    if (axis == "y") {
      newPosition.y = 1.5;
      newPosition.x = position.x;
    } else {
      newPosition.x = 1.5;
      newPosition.y = position.y;
    }
  } else if (intersectPoint.y == 3 || intersectPoint.y == 0) {
    face = intersectPoint.y == 0 ? 1 : -1;
    cubeSide = "y";
    newPosition.y = 1.5;
    if (axis == "y") {
      newPosition.x = 1.5;
      newPosition.z = position.z;
    } else {
      newPosition.z = 1.5;
      newPosition.x = position.x;
    }
  }
  if (firstCondition) {
    newPosition.x = 1.5;
    newPosition.y = 1.5;
    newPosition.z = 1.5;
  }
  for (let i = 0, n = centers.length; i < n; i++) {
    if (centers[i].position.equals(newPosition)) {
      return [centers[i], face, cubeSide];
    }
  }
}

function ConnectToCenter(center, cubes, axis, face, cubeSide) {
  let side;
  let connectedCubes = [];

  if (center.position.x == 0.5 || center.position.x == 2.5) side = "x";
  if (center.position.y == 0.5 || center.position.y == 2.5) side = "y";
  if (center.position.z == 0.5 || center.position.z == 2.5) side = "z";

  if (
    center.position.x == 1.5 &&
    center.position.y == 1.5 &&
    center.position.z == 1.5
  ) {
    if (cubeSide == "x") {
      if (axis == "y") {
        side = "z";
      } else {
        side = "y";
      }
    } else if (cubeSide == "y") {
      if (axis == "y") {
        side = "x";
      } else {
        side = "z";
      }
    } else if (cubeSide == "z")
      if (axis == "y") {
        side = "x";
      } else {
        side = "y";
      }
  }
  // console.log("center position: ", center.position);
  // console.log("center side: ", side);
  let color = Math.random() * 0xffffff;
  for (let i = 0; i < cubes.length; i++) {
    if (
      cubes[i].position[side] == center.position[side] &&
      cubes[i] != center
    ) {
      const worldPosition = new THREE.Vector3();
      cubes[i].getWorldPosition(worldPosition);

      const worldQuaternion = new THREE.Quaternion();

      cubes[i].getWorldQuaternion(worldQuaternion);

      center.worldToLocal(worldPosition);
      worldPosition.x = parseFloat(worldPosition.x.toFixed(6));
      worldPosition.y = parseFloat(worldPosition.y.toFixed(6));
      worldPosition.z = parseFloat(worldPosition.z.toFixed(6));
      // cubes[i].material.color.set(color);
      cubes[i].position.copy(worldPosition);
      //   console.log("after: ", cubes[i].position);
      center.add(cubes[i]);

      cubes[i].quaternion.copy(worldQuaternion);
      connectedCubes.push(cubes[i]);
    }
  }
  return [side, connectedCubes];
}

// Function to rotate object along specified axis
function rotateObject(
  object,
  deltaMove,
  axis,
  rotationSpeed,
  face,
  connectedCubes
) {
  // for (let i = 0, n = connectedCubes.length; i < n; i++) {
  //   switch (axis) {
  //     case "x":
  //       connectedCubes[i].rotation.x += -deltaMove.y * rotationSpeed * face;
  //       break;
  //     case "y":
  //       connectedCubes[i].rotation.y += deltaMove.x * rotationSpeed;
  //       break;
  //     case "z":
  //       connectedCubes[i].rotation.z += deltaMove.y * rotationSpeed * face; // or use deltaMove.x if preferred
  //       break;
  //   }
  // }
  switch (axis) {
    case "x":
      object.rotation.x += -deltaMove.y * rotationSpeed * face;
      break;
    case "y":
      object.rotation.y += deltaMove.x * rotationSpeed;
      break;
    case "z":
      object.rotation.z += deltaMove.y * rotationSpeed * face; // or use deltaMove.x if preferred
      break;
  }
}

function resetCentersRotation(centers) {
  for (let i = 0, n = centers.length; i < n; i++) {
    centers[i].rotation.set(0, 0, 0);
    // console.log("reseted");
  }
}

function initTexture() {
  let textures = [];
  let materials = [];
  let textureNames = ["red", "orange", "yellow", "white", "green", "blue"];

  for (let i = 0, n = textureNames.length; i < n; i++) {
    textures[i] = new THREE.TextureLoader().load(
      `./static/${textureNames[i]}.png`
    );
    materials[i] = new THREE.MeshStandardMaterial({ map: textures[i] });
  }
  return materials;
}

function initLight(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff); // White light
  scene.add(ambientLight);
}

function fixPositionFloatError(cubes) {
  for (let i = 0, n = cubes.length; i < n; i++) {
    cubes[i].position.x = parseFloat(cubes[i].position.x.toFixed(2));
    cubes[i].position.y = parseFloat(cubes[i].position.y.toFixed(2));
    cubes[i].position.z = parseFloat(cubes[i].position.z.toFixed(2));
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
