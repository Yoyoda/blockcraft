/**
 * Structure represents a sparse 3D grid of blocks.
 * Coordinate system: X/Y horizontal plane, Z = height (up).
 */
export class Structure {
  constructor({ name = 'Untitled', id = null, blocks = null } = {}) {
    this.id = id || crypto.randomUUID();
    this.name = name;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    // Sparse map: key "x,y,z" -> blockId (string)
    this.blocks = blocks || new Map();
  }

  static keyFor(x, y, z) {
    return `${x},${y},${z}`;
  }

  static parseKey(key) {
    const [x, y, z] = key.split(',').map(Number);
    return { x, y, z };
  }

  getBlock(x, y, z) {
    return this.blocks.get(Structure.keyFor(x, y, z)) || null;
  }

  setBlock(x, y, z, blockId) {
    const key = Structure.keyFor(x, y, z);
    if (blockId === null || blockId === undefined) {
      this.blocks.delete(key);
    } else {
      this.blocks.set(key, blockId);
    }
    this.updatedAt = Date.now();
  }

  /** Get all blocks at a given Z level */
  getLayer(z) {
    const layer = new Map();
    for (const [key, blockId] of this.blocks) {
      const pos = Structure.parseKey(key);
      if (pos.z === z) {
        layer.set(`${pos.x},${pos.y}`, blockId);
      }
    }
    return layer;
  }

  /** Get the range of occupied Z levels */
  getZRange() {
    let min = Infinity;
    let max = -Infinity;
    for (const key of this.blocks.keys()) {
      const { z } = Structure.parseKey(key);
      if (z < min) min = z;
      if (z > max) max = z;
    }
    if (min === Infinity) return { min: 0, max: 0 };
    return { min, max };
  }

  /** Get bounding box */
  getBounds() {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const key of this.blocks.keys()) {
      const { x, y, z } = Structure.parseKey(key);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }
    if (minX === Infinity) {
      return { minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0 };
    }
    return { minX, minY, minZ, maxX, maxY, maxZ };
  }

  /** Serialize to plain object */
  toJSON() {
    const layers = {};
    for (const [key, blockId] of this.blocks) {
      const { x, y, z } = Structure.parseKey(key);
      if (!layers[z]) layers[z] = {};
      layers[z][`${x},${y}`] = blockId;
    }
    return {
      version: 1,
      id: this.id,
      name: this.name,
      library: 'minecraft-default',
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      layers,
    };
  }

  /** Deserialize from plain object */
  static fromJSON(data) {
    const blocks = new Map();
    if (data.layers) {
      for (const [zStr, layer] of Object.entries(data.layers)) {
        const z = parseInt(zStr, 10);
        for (const [xyStr, blockId] of Object.entries(layer)) {
          const [x, y] = xyStr.split(',').map(Number);
          blocks.set(Structure.keyFor(x, y, z), blockId);
        }
      }
    }
    const structure = new Structure({
      name: data.name,
      id: data.id,
      blocks,
    });
    structure.createdAt = data.createdAt || Date.now();
    structure.updatedAt = data.updatedAt || Date.now();
    return structure;
  }
}
