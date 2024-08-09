import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

main();
function main() {
  const numCubes = 27;
  const gridSize = 3;
  const scene = initScene();
  const camera = initCamera();
  const renderer = initRenderer();

  const orbitControls = initOrbitControls(camera, renderer);

  const textures = initTexture();
  initLight(scene);

  const cubes = initCube(scene, numCubes, gridSize, textures);
  const centers = initCenters(scene, cubes, textures);
  const handlePointerDownListener = initRaycast(
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

  let button = document.getElementById("shuffle");

  button.addEventListener("click", function () {
    // console.log("clicked: ", handlePointerDownListener);
    renderer.domElement.removeEventListener(
      "pointerdown",
      handlePointerDownListener
    );

    let counter = 0;

    function repeatShuffle() {
      let lastMove;
      if (counter < 50) {
        lastMove = shuffle(centers, cubes, scene, lastMove);
        counter++;
        setTimeout(repeatShuffle, 10);
      } else {
        console.log("Got to the esle clause");
        // Re-add the pointerdown listener after shuffling is complete
        renderer.domElement.addEventListener(
          "pointerdown",
          handlePointerDownListener
        );
      }
    }

    repeatShuffle();

    renderer.domElement.addEventListener(
      "pointerdown",
      handlePointerDownListener
    );
  });

  window.addEventListener("resize", function () {
    resize(camera, renderer);
  });

  function animate() {
    // orbitControls.update();

    renderer.render(scene, camera);
    // requestAnimationFrame(animate);
  }

  renderer.setAnimationLoop(animate);
  // }
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
  const cubeSize = gridSize / Math.cbrt(numCubes);
  const cubes = [];

  for (let x = 0, n = Math.cbrt(numCubes); x < n; x++) {
    for (let y = 0; y < n; y++) {
      for (let z = 0; z < n; z++) {
        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const cube = new THREE.Mesh(geometry, materials);

        cube.position.set(x + 0.5, y + 0.5, z + 0.5);

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
      const worldPosition = new THREE.Vector3();
      cubes[i].getWorldPosition(worldPosition);
      center.worldToLocal(worldPosition);
      worldPosition.x = parseFloat(worldPosition.x.toFixed(6));
      worldPosition.y = parseFloat(worldPosition.y.toFixed(6));
      worldPosition.z = parseFloat(worldPosition.z.toFixed(6));
      cubes[i].material.color.set(0xffffff);
      cubes[i].position.copy(worldPosition);
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
              if (i != 13) {
                cubes[i].material = textures[count1[countCount]];
                countCount++;
              }
              centers.push(cubes[i]);
            }
          }
        }
      }
    }
  }
  return centers;
}

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
        toggleOrbitControls(orbitControls, "down");

        const facePosition = getFacePosition(intersects[0]);
        return closestObject.position;
      }
    }
  }
}

function getFacePosition(intersect) {
  const intersectionPoint = intersect.point;

  const face = intersect.face;
  const geometry = intersect.object.geometry;
  const vertices = geometry.attributes.position;

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

  renderer.domElement.addEventListener("pointerup", function (event) {
    toggleOrbitControls(orbitControls, !event.value);
    if (center) {
      rotateAxis(center);
      centerNewRotation = center.rotation;
      disconnectCubes(cubes, scene);
      resetCentersRotation(centers);
      centerRotation = null;
    }
    isMouseDown = false;
    center = null;
  });

  function handlePointerDownListener(event) {
    console.log("Added or removed listener.");
    isMouseDown = true;
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
  }

  renderer.domElement.addEventListener(
    "pointerdown",
    handlePointerDownListener
  );

  renderer.domElement.addEventListener("mousemove", function (event) {
    if (down) {
      [down, axis] = getAxis(event, mousePosition);
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
        }
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
    if (isMouseDown) {
      const deltaMove = {
        x: event.clientX - mousePosition.x,
        y: event.clientY - mousePosition.y,
      };

      mousePosition = {
        x: event.clientX,
        y: event.clientY,
      };

      if (center) rotateObject(center, deltaMove, axis3D, rotationSpeed, face);
    }
  });

  return handlePointerDownListener;
}

function getAxis(event, mousePosition) {
  if (mousePosition) {
    const deltaX = event.clientX - mousePosition.x;
    const deltaY = event.clientY - mousePosition.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return [false, "x"];
    } else {
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
      cubes[i].position.copy(worldPosition);
      center.add(cubes[i]);

      cubes[i].quaternion.copy(worldQuaternion);
      connectedCubes.push(cubes[i]);
    }
  }
  return [side, connectedCubes];
}

// Function to rotate object along specified axis
function rotateObject(object, deltaMove, axis, rotationSpeed, face) {
  // console.log("face: ", face);
  switch (axis) {
    case "x":
      object.rotation.x += -deltaMove.y * rotationSpeed * face;
      break;
    case "y":
      object.rotation.y += deltaMove.x * rotationSpeed;
      break;
    case "z":
      object.rotation.z += deltaMove.y * rotationSpeed * face;
      break;
  }
}

function resetCentersRotation(centers) {
  for (let i = 0, n = centers.length; i < n; i++) {
    centers[i].rotation.set(0, 0, 0);
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

function fixRotationFloatError(cubes) {
  for (let i = 0, n = cubes.length; i < n; i++) {
    cubes[i].rotation.x = parseFloat(cubes[i].rotation.x.toFixed(2));
    cubes[i].rotation.y = parseFloat(cubes[i].rotation.y.toFixed(2));
    cubes[i].rotation.z = parseFloat(cubes[i].rotation.z.toFixed(2));
  }
}

///////////////////////////////////////////////////////////////////////////////////
function shuffle(centers, cubes, scene, lastMove) {
  let rotationSpeed = 0.01;
  let axis3D, connectedCubes, newMove;

  do {
    newMove = generateRandomMove(centers);
  } while (lastMove && JSON.stringify(newMove) === JSON.stringify(lastMove));

  lastMove = newMove;

  let face = Math.floor(Math.random() * 2) * 2 - 1;

  [axis3D, connectedCubes] = ConnectToCenter(
    newMove.center,
    cubes,
    newMove.axis,
    face,
    newMove.cubeSide
  );

  // console.log(newMove.center);
  // console.log(newMove.deltaMove);
  // console.log(axis3D);
  // console.log(newMove.axis);
  // console.log(face);

  fixRotationFloatError(cubes);
  fixPositionFloatError(cubes);

  rotateObject(newMove.center, newMove.deltaMove, axis3D, rotationSpeed, face);

  rotateAxis(newMove.center);
  disconnectCubes(cubes, scene);
  resetCentersRotation(centers);

  return lastMove;
}

function generateRandomMove(centers) {
  let axis = 0;
  let cubeSides = ["x", "y", "z"];
  let xy = ["x", "y"];
  let deltaMove = {
    x: 0,
    y: 0,
  };

  let resultAxis = xy[Math.floor(Math.random() * 2)];

  deltaMove[resultAxis] += 90;

  axis = resultAxis;

  const randomIndex = Math.floor(Math.random() * centers.length);
  let center = centers[randomIndex];

  let cubeSide = Math.floor(Math.random() * cubeSides.length);

  return { axis, deltaMove, center, cubeSide };
}

function resetCube(cubes) {
  cubes.forEach((cube) => {
    cube.rotation.set(0, 0, 0);
  });
}
