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

  loadStructure(structure) {
    this.structure = structure;
    this.history.clear();
    this.currentLayer = 0;
    this.notify();
  }
}

export const appState = new AppState();
