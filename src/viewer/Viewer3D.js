import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { appState } from '../core/AppState.js';

/**
 * 3D viewer using Three.js with instanced meshes.
 */
export class Viewer3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    this._setupCamera();
    this._setupRenderer();
    this._setupLights();
    this._setupControls();

    this.meshes = new Map(); // blockId -> InstancedMesh
    this.geometry = new THREE.BoxGeometry(1, 1, 1);

    appState.onChange(() => this.rebuild());
    this.rebuild();
    this._animate();
  }

  _setupCamera() {
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(10, 10, 10);
    this.camera.up.set(0, 0, 1); // Z-up
    this.camera.lookAt(0, 0, 0);
  }

  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this._resizeRenderer();
    window.addEventListener('resize', () => this._resizeRenderer());
  }

  _resizeRenderer() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height);
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
  }

  _setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 8, 10);
    this.scene.add(dir);
  }

  _setupControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
  }

  rebuild() {
    // Remove old meshes
    for (const mesh of this.meshes.values()) {
      this.scene.remove(mesh);
      mesh.dispose();
    }
    this.meshes.clear();

    const structure = appState.structure;
    const library = appState.library;

    // Group blocks by type
    const groups = new Map();
    for (const [key, blockId] of structure.blocks) {
      if (!groups.has(blockId)) groups.set(blockId, []);
      groups.get(blockId).push(key);
    }

    // Create instanced mesh for each block type
    for (const [blockId, keys] of groups) {
      const block = library.get(blockId);
      const color = block ? block.color : '#FF00FF';
      const material = new THREE.MeshLambertMaterial({ color });
      const mesh = new THREE.InstancedMesh(this.geometry, material, keys.length);

      const matrix = new THREE.Matrix4();
      keys.forEach((key, i) => {
        const { x, y, z } = appState.structure.constructor.parseKey(key);
        matrix.setPosition(x, y, z);
        mesh.setMatrixAt(i, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      this.scene.add(mesh);
      this.meshes.set(blockId, mesh);
    }
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
