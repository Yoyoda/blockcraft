/**
 * Global undo/redo system using command pattern.
 * Each command: { execute(), undo(), description }
 */
export class HistoryManager {
  constructor(maxSize = 200) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxSize = maxSize;
    this.listeners = [];
  }

  /** Execute a command and push it to undo stack */
  execute(command) {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this._notify();
  }

  undo() {
    const command = this.undoStack.pop();
    if (!command) return;
    command.undo();
    this.redoStack.push(command);
    this._notify();
  }

  redo() {
    const command = this.redoStack.pop();
    if (!command) return;
    command.execute();
    this.undoStack.push(command);
    this._notify();
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  onChange(fn) {
    this.listeners.push(fn);
  }

  _notify() {
    for (const fn of this.listeners) fn();
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this._notify();
  }
}

/**
 * Command to set a single block.
 */
export class SetBlockCommand {
  constructor(structure, x, y, z, newBlockId) {
    this.structure = structure;
    this.x = x;
    this.y = y;
    this.z = z;
    this.newBlockId = newBlockId;
    this.oldBlockId = structure.getBlock(x, y, z);
  }

  execute() {
    this.structure.setBlock(this.x, this.y, this.z, this.newBlockId);
  }

  undo() {
    this.structure.setBlock(this.x, this.y, this.z, this.oldBlockId);
  }
}

/**
 * Command to set multiple blocks at once (batch).
 */
export class BatchBlockCommand {
  constructor(structure, changes) {
    // changes: [{ x, y, z, blockId }]
    this.structure = structure;
    this.changes = changes;
    this.oldValues = changes.map(c => ({
      ...c,
      oldBlockId: structure.getBlock(c.x, c.y, c.z),
    }));
  }

  execute() {
    for (const c of this.changes) {
      this.structure.setBlock(c.x, c.y, c.z, c.blockId);
    }
  }

  undo() {
    for (const c of this.oldValues) {
      this.structure.setBlock(c.x, c.y, c.z, c.oldBlockId);
    }
  }
}
