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
  //   circleTransformControls.setRotationSnap(Math.PI / 4);
  circleTransformControls.showX = false;
  circleTransformControls.showY = false;
  scene.add(circleTransformControls);

  function rotateX() {
    const snapAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]; // Snap angles in radians
    const currentRotation = circle.rotation.x; // Get current rotation around x-axis

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

    // Set the circle's rotation to the nearest snap angle
    circle.rotation.x = nearestAngle;
  }

  // function toggleRotationSnap() {
  //   if (circleTransformControls.rotationSnap === null) {
  //     circleTransformControls.rotationSnap = Math.PI / 4;
  //     rotateZ();
  //   } else {
  //     circleTransformControls.rotationSnap = null;
  //   }
  // }

  // circleTransformControls.addEventListener("mouseDown", toggleRotationSnap);
  circleTransformControls.addEventListener("mouseUp", rotateX);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({
    color: Math.random() * 0xffffff,
    wireframe: false,
  });

  const cube = new THREE.Mesh(geometry, material);

  cube.position.set(0, -1, 0);

  circle.add(cube);

  //   const transformControls = new TransformControls(camera, renderer.domElement);
  //   transformControls.attach(cube);
  //   transformControls.mode = "rotate";
  //   will need to play around witht this later
  //   transformControls.translationSnap = 3;
  //   scene.add(transformControls);

  // Function to toggle OrbitControls
  function toggleOrbitControls(enabled) {
    orbitControls.enabled = enabled;
  }

  // Event listener for TransformControls
  //   transformControls.addEventListener("dragging-changed", function (event) {
  //     toggleOrbitControls(!event.value); // Disable OrbitControls while dragging
  //   });
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

    // console.log("circle.rotation.z:", circle.rotation.x);
  }

  renderer.setAnimationLoop(animate);
}
// const geometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
//   const material = new THREE.MeshBasicMaterial({
//     color: 0x00ff00,
//     wireframe: true,
//   });
