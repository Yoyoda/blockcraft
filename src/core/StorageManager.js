import { Structure } from './Structure.js';

const STORAGE_KEY = 'blockcraft_structures';
const INDEX_KEY = 'blockcraft_index';

/**
 * Manages saving/loading structures to/from localStorage.
 */
export class StorageManager {
  /** Get list of saved structures (metadata only) */
  getIndex() {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  _saveIndex(index) {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }

  /** Save a structure */
  save(structure) {
    const data = structure.toJSON();
    localStorage.setItem(`${STORAGE_KEY}_${structure.id}`, JSON.stringify(data));

    const index = this.getIndex();
    const existing = index.findIndex(e => e.id === structure.id);
    const meta = { id: structure.id, name: structure.name, updatedAt: structure.updatedAt };
    if (existing >= 0) {
      index[existing] = meta;
    } else {
      index.push(meta);
    }
    this._saveIndex(index);
  }

  /** Load a structure by ID */
  load(id) {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${id}`);
    if (!raw) return null;
    return Structure.fromJSON(JSON.parse(raw));
  }

  /** Delete a structure by ID */
  delete(id) {
    localStorage.removeItem(`${STORAGE_KEY}_${id}`);
    const index = this.getIndex().filter(e => e.id !== id);
    this._saveIndex(index);
  }

  /** Rename a structure */
  rename(id, newName) {
    const structure = this.load(id);
    if (!structure) return;
    structure.name = newName;
    structure.updatedAt = Date.now();
    this.save(structure);
  }
}

export const storage = new StorageManager();
