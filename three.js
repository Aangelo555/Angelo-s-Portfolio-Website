import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(600, 500);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 600/500, 0.1, 100);
camera.position.set(0, 2, 4);

const ambientLight = new THREE.AmbientLight(0xffffff, 5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 5);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

const controls = new OrbitControls(camera, canvas);
controls.enableZoom = false;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load('./models/gaming_computer-v2.glb', (gltf) => {
    document.getElementById('loading-text').style.display = 'none';
    gltf.scene.scale.set(0.55, 0.55, 0.55);
    gltf.scene.position.set(0, -0.8, 0);
    gltf.scene.rotation.set(0, 11, 0);
    scene.add(gltf.scene);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();