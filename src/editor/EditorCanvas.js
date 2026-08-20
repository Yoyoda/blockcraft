import { appState, TOOLS } from '../core/AppState.js';
import { rectCells, sphereCells, lineCells, circleCells, radiusBetween } from '../core/shapes.js';

/**
 * 2D layer editor rendered on a canvas.
 */
export class EditorCanvas {
  constructor(canvas, { cursorLabel = null } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cursorLabel = cursorLabel;
    this.cursorCell = null;
    this.cellSize = 24;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isPanning = false;
    this.isDrawing = false;
    // Shape tools drag from an anchor cell to the cursor before being committed.
    this.shapeDrag = null;
    this.lastPan = { x: 0, y: 0 };

    this._resizeCanvas();
    this._bindEvents();
    appState.onChange(() => {
      this.render();
      this._updateCursorLabel();
    });
    this.render();
    this._updateCursorLabel();
  }

  _resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    // Center the grid
    this.offsetX = Math.floor(this.canvas.width / 2);
    this.offsetY = Math.floor(this.canvas.height / 2);
  }

  _bindEvents() {
    window.addEventListener('resize', () => {
      this._resizeCanvas();
      this.render();
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        this.isPanning = true;
        this.lastPan = { x: e.clientX, y: e.clientY };
        return;
      }
      if (e.button !== 0 && e.button !== 2) return;
      const erase = e.button === 2;
      if (appState.currentTool === TOOLS.PENCIL) {
        this.isDrawing = true;
        if (erase) this._handleErase(e);
        else this._handleDraw(e);
      } else {
        const anchor = this._screenToGrid(e.clientX, e.clientY);
        this.shapeDrag = { anchor, current: anchor, erase };
        this.render();
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.cursorCell = this._screenToGrid(e.clientX, e.clientY);
      if (this.shapeDrag) this.shapeDrag.current = this.cursorCell;
      this._updateCursorLabel();
      if (this.isPanning) {
        this.offsetX += e.clientX - this.lastPan.x;
        this.offsetY += e.clientY - this.lastPan.y;
        this.lastPan = { x: e.clientX, y: e.clientY };
        this.render();
      } else if (this.shapeDrag) {
        this.render();
      } else if (this.isDrawing) {
        if (e.buttons === 1 && !e.altKey) this._handleDraw(e);
        else if (e.buttons === 2) this._handleErase(e);
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.cursorCell = null;
      this._updateCursorLabel();
    });

    window.addEventListener('mouseup', () => {
      this.isPanning = false;
      this.isDrawing = false;
      this._commitShape();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.shapeDrag) {
        this.shapeDrag = null;
        this.render();
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.ctrlKey) {
        appState.setLayer(appState.currentLayer + (e.deltaY < 0 ? 1 : -1));
        return;
      }
      const zoom = e.deltaY < 0 ? 1.1 : 0.9;
      this.cellSize = Math.max(8, Math.min(64, Math.round(this.cellSize * zoom)));
      this.render();
    }, { passive: false });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _updateCursorLabel() {
    if (!this.cursorLabel) return;
    const z = appState.currentLayer;
    const pos = this.cursorCell
      ? `X ${this.cursorCell.x}   Y ${this.cursorCell.y}   Z ${z}`
      : `X –   Y –   Z ${z}`;
    this.cursorLabel.textContent = pos + this._shapeHint();
  }

  _shapeHint() {
    const drag = this.shapeDrag;
    if (!drag) return '';
    const { anchor, current } = drag;
    switch (appState.currentTool) {
      case TOOLS.LINE:
        return `   ╱ ${lineCells(anchor, current, 0).length}`;
      case TOOLS.RECT: {
        const w = Math.abs(current.x - anchor.x) + 1;
        const h = Math.abs(current.y - anchor.y) + 1;
        return `   ▭ ${w}×${h}`;
      }
      case TOOLS.CIRCLE:
        return `   ○ r ${radiusBetween(anchor, current)}`;
      default:
        return `   ⬤ r ${radiusBetween(anchor, current)}`;
    }
  }

  /** Cells the in-progress shape would fill, restricted to the current layer. */
  _previewCells() {
    const drag = this.shapeDrag;
    if (!drag) return [];
    const z = appState.currentLayer;
    switch (appState.currentTool) {
      case TOOLS.LINE:
        return lineCells(drag.anchor, drag.current, z);
      case TOOLS.RECT:
        return rectCells(drag.anchor, drag.current, z);
      case TOOLS.CIRCLE:
        return circleCells(drag.anchor, radiusBetween(drag.anchor, drag.current), z);
      default: {
        const center = { x: drag.anchor.x, y: drag.anchor.y, z };
        return sphereCells(center, radiusBetween(drag.anchor, drag.current)).filter(c => c.z === z);
      }
    }
  }

  _commitShape() {
    const drag = this.shapeDrag;
    if (!drag) return;
    this.shapeDrag = null;
    const { anchor, current, erase } = drag;
    switch (appState.currentTool) {
      case TOOLS.LINE:
        appState.drawLine(anchor, current, { erase });
        break;
      case TOOLS.RECT:
        appState.drawRect(anchor, current, { erase });
        break;
      case TOOLS.CIRCLE:
        appState.drawCircle(anchor, radiusBetween(anchor, current), { erase });
        break;
      default:
        appState.drawSphere(anchor, radiusBetween(anchor, current), { erase });
    }
  }

  _screenToGrid(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const gx = Math.floor((sx - this.offsetX) / this.cellSize);
    // Y grows upwards on screen to match the viewer's right-handed frame.
    const gy = Math.floor((this.offsetY - sy) / this.cellSize);
    return { x: gx, y: gy };
  }

  _handleDraw(e) {
    const { x, y } = this._screenToGrid(e.clientX, e.clientY);
    appState.placeBlock(x, y);
  }

  _handleErase(e) {
    const { x, y } = this._screenToGrid(e.clientX, e.clientY);
    appState.eraseBlock(x, y);
  }

  render() {
    const { ctx, canvas, cellSize, offsetX, offsetY } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;

    const startX = offsetX % cellSize;
    const startY = offsetY % cellSize;

    for (let x = startX; x < canvas.width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = startY; y < canvas.height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw origin crosshair
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(offsetX, 0);
    ctx.lineTo(offsetX, canvas.height);
    ctx.moveTo(0, offsetY);
    ctx.lineTo(canvas.width, offsetY);
    ctx.stroke();

    // Draw blocks on current layer
    const layer = appState.structure.getLayer(appState.currentLayer);
    const library = appState.library;

    for (const [key, blockId] of layer) {
      const [x, y] = key.split(',').map(Number);
      const block = library.get(blockId);
      const sx = offsetX + x * cellSize;
      const sy = offsetY - (y + 1) * cellSize;
      ctx.fillStyle = block ? block.color : '#FF00FF';
      ctx.fillRect(sx, sy, cellSize - 1, cellSize - 1);
    }

    this._renderShapePreview();
  }

  _renderShapePreview() {
    const cells = this._previewCells();
    if (cells.length === 0) return;
    const { ctx, cellSize, offsetX, offsetY } = this;
    const material = appState.library.get(appState.selectedMaterialId);
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = this.shapeDrag.erase ? '#000' : (material ? material.color : '#FF00FF');
    ctx.strokeStyle = this.shapeDrag.erase ? '#e94560' : '#fff';
    ctx.lineWidth = 1;
    for (const { x, y } of cells) {
      const sx = offsetX + x * cellSize;
      const sy = offsetY - (y + 1) * cellSize;
      ctx.fillRect(sx, sy, cellSize - 1, cellSize - 1);
      ctx.strokeRect(sx + 0.5, sy + 0.5, cellSize - 2, cellSize - 2);
    }
    ctx.restore();
  }
}
