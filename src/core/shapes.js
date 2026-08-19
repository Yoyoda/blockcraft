/**
 * Voxel shape generators. All of them return arrays of { x, y, z } cells.
 */

/** Bresenham line between two cells of the same Z level (both ends included). */
export function lineCells(a, b, z) {
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  const stepX = a.x < b.x ? 1 : -1;
  const stepY = a.y < b.y ? 1 : -1;
  let err = dx - dy;
  let x = a.x;
  let y = a.y;
  const cells = [];
  for (;;) {
    cells.push({ x, y, z });
    if (x === b.x && y === b.y) return cells;
    const err2 = 2 * err;
    if (err2 > -dy) { err -= dy; x += stepX; }
    if (err2 < dx) { err += dx; y += stepY; }
  }
}

/** Filled rectangle on a single Z level, from corner a to corner b (inclusive). */
export function rectCells(a, b, z) {
  const x0 = Math.min(a.x, b.x);
  const x1 = Math.max(a.x, b.x);
  const y0 = Math.min(a.y, b.y);
  const y1 = Math.max(a.y, b.y);
  const cells = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) cells.push({ x, y, z });
  }
  return cells;
}

/** Filled sphere centred on (x, y, z); its widest section lies on level z. */
export function sphereCells(center, radius) {
  const r = Math.max(0, Math.round(radius));
  const limit = (r + 0.5) * (r + 0.5);
  const cells = [];
  for (let dz = -r; dz <= r; dz++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy + dz * dz > limit) continue;
        cells.push({ x: center.x + dx, y: center.y + dy, z: center.z + dz });
      }
    }
  }
  return cells;
}

/** Radius implied by dragging from the sphere centre to a grid cell. */
export function radiusBetween(center, edge) {
  return Math.round(Math.hypot(edge.x - center.x, edge.y - center.y));
}
