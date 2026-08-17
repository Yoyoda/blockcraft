import MINECRAFT_BLOCKS from './minecraft.js';

/**
 * BlockLibrary provides access to block definitions.
 */
export class BlockLibrary {
  constructor(blocks = MINECRAFT_BLOCKS) {
    this.blocks = blocks;
    this.byId = new Map(blocks.map(b => [b.id, b]));
    this.categories = [...new Set(blocks.map(b => b.category))];
  }

  get(id) {
    return this.byId.get(id) || null;
  }

  getByCategory(category) {
    return this.blocks.filter(b => b.category === category);
  }

  getAll() {
    return this.blocks;
  }
}

export const defaultLibrary = new BlockLibrary();
