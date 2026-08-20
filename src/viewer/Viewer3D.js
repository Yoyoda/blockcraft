import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { appState } from '../core/AppState.js';
import { Structure } from '../core/Structure.js';

const GIZMO_SIZE = 90; // px, square viewport in the top-right corner
const GIZMO_MARGIN = 12;
const AXIS_COLORS = { x: 0xe94560, y: 0x3ddc84, z: 0x4aa3ff };

function makeAxisLabelSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 32, 34);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.5, 0.5, 0.5);
  return sprite;
}

/**
 * 3D viewer using Three.js with instanced meshes.
 */
export class Viewer3D {
  constructor(canvas, { axesToggle = null } = {}) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.showOriginAxes = true;
    this.originAxes = null;

    this._setupCamera();
    this._setupRenderer();
    this._setupLights();
    this._setupControls();
    this._setupGizmo();
    this._setupAxesToggle(axesToggle);

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

  _setupGizmo() {
    this.gizmoScene = new THREE.Scene();
    this.gizmoScene.background = new THREE.Color(0x0f3460);
    this.gizmoCamera = new THREE.OrthographicCamera(-1.6, 1.6, 1.6, -1.6, 0.1, 10);
    this.gizmoCamera.up.set(0, 0, 1);

    for (const axis of ['x', 'y', 'z']) {
      const color = AXIS_COLORS[axis];
      const dir = new THREE.Vector3(
        axis === 'x' ? 1 : 0,
        axis === 'y' ? 1 : 0,
        axis === 'z' ? 1 : 0,
      );
      const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1, color, 0.3, 0.15);
      this.gizmoScene.add(arrow);
      const label = makeAxisLabelSprite(axis.toUpperCase(), color);
      label.position.copy(dir).multiplyScalar(1.3);
      this.gizmoScene.add(label);
    }
  }

  _setupAxesToggle(container) {
    if (!container) return;
    container.innerHTML = `
      <label class="axes-toggle-label">
        <input type="checkbox" id="toggle-origin-axes" ${this.showOriginAxes ? 'checked' : ''} />
        Axes
      </label>
    `;
    container.querySelector('#toggle-origin-axes').addEventListener('change', (e) => {
      this.showOriginAxes = e.target.checked;
      if (this.originAxes) this.originAxes.visible = this.showOriginAxes;
    });
  }

  rebuild() {
    // Remove old meshes and dispose materials
    for (const mesh of this.meshes.values()) {
      this.scene.remove(mesh);
      mesh.material.dispose();
      mesh.dispose();
    }
    this.meshes.clear();

    const structure = appState.structure;
    const library = appState.library;
    const range = appState.layerRange;

    // Group blocks by type
    const groups = new Map();
    for (const [key, blockId] of structure.blocks) {
      if (range) {
        const { z } = Structure.parseKey(key);
        if (z < range.min || z > range.max) continue;
      }
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
        const { x, y, z } = Structure.parseKey(key);
        matrix.setPosition(x, y, z);
        mesh.setMatrixAt(i, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      this.scene.add(mesh);
      this.meshes.set(blockId, mesh);
    }

    this._updateOriginAxes();
  }

  /** Colored X/Y/Z lines through the world origin, sized to fit the structure. */
  _updateOriginAxes() {
    if (this.originAxes) {
      this.scene.remove(this.originAxes);
      for (const line of this.originAxes.children) {
        line.geometry.dispose();
        line.material.dispose();
      }
    }

    const bounds = appState.structure.getBounds();
    const extent = Math.max(
      8,
      Math.abs(bounds.minX), Math.abs(bounds.maxX),
      Math.abs(bounds.minY), Math.abs(bounds.maxY),
      Math.abs(bounds.minZ), Math.abs(bounds.maxZ),
    ) + 4;

    const group = new THREE.Group();
    for (const axis of ['x', 'y', 'z']) {
      const from = new THREE.Vector3(
        axis === 'x' ? -extent : 0,
        axis === 'y' ? -extent : 0,
        axis === 'z' ? -extent : 0,
      );
      const to = new THREE.Vector3(
        axis === 'x' ? extent : 0,
        axis === 'y' ? extent : 0,
        axis === 'z' ? extent : 0,
      );
      const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
      const material = new THREE.LineBasicMaterial({ color: AXIS_COLORS[axis] });
      group.add(new THREE.Line(geometry, material));
    }
    group.visible = this.showOriginAxes;
    this.originAxes = group;
    this.scene.add(group);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this._renderGizmo();
  }

  _renderGizmo() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const x = rect.width - GIZMO_SIZE - GIZMO_MARGIN;
    const y = rect.height - GIZMO_SIZE - GIZMO_MARGIN;

    this.gizmoCamera.quaternion.copy(this.camera.quaternion);
    this.gizmoCamera.position.set(0, 0, 3).applyQuaternion(this.gizmoCamera.quaternion);

    this.renderer.setViewport(x, y, GIZMO_SIZE, GIZMO_SIZE);
    this.renderer.setScissor(x, y, GIZMO_SIZE, GIZMO_SIZE);
    this.renderer.setScissorTest(true);
    this.renderer.autoClear = false;
    this.renderer.clear(true, true, false);
    this.renderer.render(this.gizmoScene, this.gizmoCamera);

    this.renderer.setScissorTest(false);
    this.renderer.setViewport(0, 0, rect.width, rect.height);
    this.renderer.autoClear = true;
  }
}
