//
import * as THREE from 'three';
import './js/pizza';
import './bert.scss';

/* Taken from https://threejs.org/examples/#webgl_geometry_shapes */
var scene, camera, renderer, group;
var targetRotation = 0,
  targetRotationOnMouseDown = 0,
  mouseX = 0,
  mouseXOnMouseDown = 0;

var textureUrl = 'https://thumb9.shutterstock.com/display_pic_with_logo/164685236/584974912/stock-photo-pepperoni-pizza-a-seamless-food-texture-use-this-texture-in-fabric-and-material-prints-image-584974912.jpg';

var clock;

var loader,
  pizzaTexture,
  geometry,
  groups = [],
  pivot = new THREE.Group(),
  slices = [];

var options = {
  numSlices: 5,
  ySpinVelocity: 0.02,
  fov: 45,
  camera: [200, 200, 200]
};

/**/
function init() {
  // Set up scene and camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    options.fov,
    window.innerWidth / window.innerHeight,
    1, 1000
  );
  camera.position.set(options.camera[0], options.camera[1], options.camera[2]);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  scene.add(camera);

  // lights
  var lights = new THREE.Group();
  lights.add(new THREE.PointLight(0xffffff, 0.6));
  lights.add(new THREE.PointLight(0xffffff, 0.6));
  lights.add(new THREE.AmbientLight(0x909090)); // soft white light

  lights.children[0].position.set(100, 100, 100);
  lights.children[0].lookAt(0, 0, 0);
  lights.children[1].position.set(50, -200, 150);
  lights.children[1].lookAt(0, 0, 0);
  scene.add(lights);

  // generate slices
  for (var p = 0; p < options.numSlices; p++) {
    addPizza(
      rand(-100, 100),
      rand(-100, 100),
      rand(-100, 100)
    );
  }

  // Attach renderer to DOM and add listeners
  var container = document.getElementById('three');
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setClearColor(0xf0f0f0, 0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  document.addEventListener('mousedown', onDocumentMouseDown, false);
  document.addEventListener('touchstart', onDocumentTouchStart, false);
  document.addEventListener('touchmove', onDocumentTouchMove, false);
  window.addEventListener('resize', onWindowResize, false)
}

/**/
var triangleShapeTemplate = new THREE.Shape();
triangleShapeTemplate.moveTo(-15, 0);
triangleShapeTemplate.lineTo(15, 0);
triangleShapeTemplate.lineTo(0, -30);
triangleShapeTemplate.lineTo(-15, 0);

/**/
function addPizza(x, y, z) {

  // pizza shape
  var triangleShape = triangleShapeTemplate;

  var extrudeSettings = {
    amount: 6,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 2,
    bevelThickness: 1
  };

  // pizza texture
  var pizzaMaterial = new THREE.MeshPhongMaterial({
    map: pizzaTexture,
    shininess: 100,
    specular: 0xffffff,
    normalMap: pizzaTexture,
    normalScale: new THREE.Vector2(1, 1),
    shading: THREE.FlatShading
  });

  // add 3d extruded pizzas to scene
  addShape(
    triangleShape,
    extrudeSettings,
    0xf2c165,
    x, y, z,
    0, 0, 0,
    1,
    pizzaMaterial
  );

  /* extrude the supplied shape */
  function addShape(shape, extrudeSettings, color, x, y, z, rx, ry, rz, s, mat) {

    let geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // generate vertex UVs for texturing
    let faces = geometry.faceVertexUvs[0].length;
    geometry.faceVertexUvs[0] = [];
    let by = 0.05;
    // base y (minY) for texture; HACK to cut off watermark ¯\_(ツ)_/¯

    for (var i = 0; i < faces; i += 2) {
      geometry.faceVertexUvs[0][i] = [
        new THREE.Vector2(0, by),
        new THREE.Vector2(1, by),
        new THREE.Vector2(0, 1)
      ];
      geometry.faceVertexUvs[0][i + 1] = [
        new THREE.Vector2(0, by),
        new THREE.Vector2(1, 1),
        new THREE.Vector2(0, 1)
      ];
    }

    let mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.scale.set(s, s, s);

    slices.push({
      slice: mesh,
      lethargy: rand(0.1, 0.9),
      v: rand(-4, 4),
      phase: rand(0, Math.PI)
    });
    scene.add(mesh);

  }

}

/**
 * Util
 **/

/* rand clamp */
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

/* Orbit */
function orbit(t, T, r, phase) {
  let x, y, z;
  let oid = 2 * Math.PI * t / T + phase;

  x = -r * Math.sin(oid);
  y = r * Math.cos(oid);
  z = -r * Math.cos(oid);

  return [x, y, z];
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {

  let t = clock.getElapsedTime();

  slices.forEach(function (sliceObj) {
    let slice = sliceObj.slice;
    // let lethargy = sliceObj.lethargy;
    let pos = orbit(t, 5, 0.5, sliceObj.phase);
    slice.translateX(pos[0]);
    slice.translateY(pos[1]);
    slice.translateZ(pos[2]);
    // slice.translateX(0.1*Math.sin(t) * sliceObj.v);
    // slice.rotation.z += ( targetRotation - slice.rotation.z ) * 0.05 * lethargy;
    // slice.rotation.y += options.ySpinVelocity * lethargy;
  });

  pivot.rotation.z += (targetRotation - pivot.rotation.z) * 0.05;
  renderer.render(scene, camera);
}

/* Load textures and start yr engines */
loader = new THREE.TextureLoader(),
  loader.setCrossOrigin('anonymous');
loader.load(textureUrl, function (texture) {
  pizzaTexture = texture;

  clock = new THREE.Clock();
  init();
  animate();
});

/* Listener functions */
function onWindowResize(event) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function onDocumentMouseDown(event) {
  event.preventDefault();
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  document.addEventListener('mouseup', onDocumentMouseUp, false);
  document.addEventListener('mouseout', onDocumentMouseOut, false);
  mouseXOnMouseDown = event.clientX - window.innerWidth / 2;
  targetRotationOnMouseDown = targetRotation;
}

function onDocumentMouseMove(event) {
  mouseX = event.clientX - window.innerWidth / 2;
  targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.02;
}

function onDocumentMouseUp(event) {
  document.removeEventListener('mousemove', onDocumentMouseMove, false);
  document.removeEventListener('mouseup', onDocumentMouseUp, false);
  document.removeEventListener('mouseout', onDocumentMouseOut, false);
}

function onDocumentMouseOut(event) {
  document.removeEventListener('mousemove', onDocumentMouseMove, false);
  document.removeEventListener('mouseup', onDocumentMouseUp, false);
  document.removeEventListener('mouseout', onDocumentMouseOut, false);
}

function onDocumentTouchStart(event) {
  if (event.touches.length == 1) {
    event.preventDefault();
    mouseXOnMouseDown = event.touches[0].pageX - window.innerWidth / 2;
    targetRotationOnMouseDown = targetRotation;
  }
}

function onDocumentTouchMove(event) {
  if (event.touches.length == 1) {
    event.preventDefault();
    mouseX = event.touches[0].pageX - window.innerWidth / 2;
    targetRotation = targetRotationOnMouseDown + (mouseX - mouseXOnMouseDown) * 0.05;
  }
}

console.log('Ello');
