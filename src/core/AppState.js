import { Structure } from './Structure.js';
import { defaultLibrary } from '../library/BlockLibrary.js';
import { HistoryManager, SetBlockCommand, BatchBlockCommand } from './HistoryManager.js';

/**
 * Central application state.
 */
class AppState {
  constructor() {
    this.structure = new Structure({ name: 'New Structure' });
    this.library = defaultLibrary;
    this.history = new HistoryManager();
    this.currentLayer = 0;
    this.selectedBlockId = 'stone';
    this.currentTool = 'pencil';
    // Z range displayed in the 3D viewer; null means "show everything"
    this.layerRange = null;
    this.listeners = new Set();
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const fn of this.listeners) fn();
  }

  setLayer(z) {
    this.currentLayer = z;
    this.notify();
  }

  setLayerRange(min, max) {
    this.layerRange = { min: Math.min(min, max), max: Math.max(min, max) };
    this.notify();
  }

  selectBlock(blockId) {
    this.selectedBlockId = blockId;
    this.notify();
  }

  selectTool(tool) {
    this.currentTool = tool;
    this.notify();
  }

  placeBlock(x, y) {
    const cmd = new SetBlockCommand(
      this.structure, x, y, this.currentLayer, this.selectedBlockId
    );
    this.history.execute(cmd);
    this.notify();
  }

  eraseBlock(x, y) {
    const cmd = new SetBlockCommand(
      this.structure, x, y, this.currentLayer, null
    );
    this.history.execute(cmd);
    this.notify();
  }

  placeBlocks(positions) {
    const changes = positions.map(([x, y]) => ({
      x, y, z: this.currentLayer, blockId: this.selectedBlockId,
    }));
    const cmd = new BatchBlockCommand(this.structure, changes);
    this.history.execute(cmd);
    this.notify();
  }

  /** Insert a copy of the current layer one level up (+1) or down (-1) and follow it. */
  copyLayer(direction) {
    const z0 = this.currentLayer;
    const range = this.structure.getZRange();
    const changes = [];
    if (direction > 0) {
      // Shift everything above up by one; the freed level receives the copy.
      for (let z = Math.max(range.max, z0) + 1; z > z0; z--) {
        this._collectLayerCopy(changes, z, z - 1);
      }
    } else {
      for (let z = Math.min(range.min, z0) - 1; z < z0; z++) {
        this._collectLayerCopy(changes, z, z + 1);
      }
    }
    if (changes.length > 0) {
      this.history.execute(new BatchBlockCommand(this.structure, changes));
    }
    this.currentLayer = z0 + Math.sign(direction);
    this.notify();
  }

  /** Translate every block of the current layer by (dx, dy). */
  moveLayer(dx, dy) {
    if (dx === 0 && dy === 0) return;
    const source = this.structure.getLayer(this.currentLayer);
    if (source.size === 0) return;
    const cells = new Map();
    for (const key of source.keys()) cells.set(key, null);
    for (const [key, blockId] of source) {
      const [x, y] = key.split(',').map(Number);
      cells.set(`${x + dx},${y + dy}`, blockId);
    }
    this._applyCells(cells, this.currentLayer);
    this.notify();
  }

  /** Remove every block of the current layer, leaving the level in place. */
  clearLayer() {
    const source = this.structure.getLayer(this.currentLayer);
    if (source.size === 0) return;
    const cells = new Map();
    for (const key of source.keys()) cells.set(key, null);
    this._applyCells(cells, this.currentLayer);
    this.notify();
  }

  /** Delete the current level entirely: every layer above shifts one step down. */
  removeLayer() {
    const z0 = this.currentLayer;
    const zMax = Math.max(this.structure.getZRange().max, z0);
    const changes = [];
    for (let z = z0; z <= zMax; z++) {
      this._collectLayerCopy(changes, z, z + 1);
    }
    if (changes.length === 0) return;
    this.history.execute(new BatchBlockCommand(this.structure, changes));
    this.notify();
  }

  /** Queue the changes making level targetZ an exact copy of level sourceZ. */
  _collectLayerCopy(changes, targetZ, sourceZ) {
    const cells = new Map();
    for (const key of this.structure.getLayer(targetZ).keys()) cells.set(key, null);
    for (const [key, blockId] of this.structure.getLayer(sourceZ)) cells.set(key, blockId);
    for (const [key, blockId] of cells) {
      const [x, y] = key.split(',').map(Number);
      changes.push({ x, y, z: targetZ, blockId });
    }
  }

  /** cells: Map of "x,y" -> blockId|null, applied as one undoable batch. */
  _applyCells(cells, z) {
    const changes = [];
    for (const [key, blockId] of cells) {
      const [x, y] = key.split(',').map(Number);
      changes.push({ x, y, z, blockId });
    }
    if (changes.length === 0) return;
    this.history.execute(new BatchBlockCommand(this.structure, changes));
  }

  loadStructure(structure) {
    this.structure = structure;
    this.history.clear();
    this.currentLayer = 0;
    this.layerRange = null;
    this.notify();
  }
}

export const appState = new AppState();
