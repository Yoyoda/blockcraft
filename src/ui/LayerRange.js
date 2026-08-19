import { appState } from '../core/AppState.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Vertical dual-handle slider selecting the Z range shown in the 3D viewer.
 */
export function initLayerRange(container) {
  container.innerHTML = `
    <div class="lr-title">Z</div>
    <div class="lr-value" id="lr-value-max">0</div>
    <div class="lr-track" id="lr-track">
      <div class="lr-fill" id="lr-fill"></div>
      <div class="lr-handle" id="lr-handle-max" data-which="max" title="Top layer"></div>
      <div class="lr-handle" id="lr-handle-min" data-which="min" title="Bottom layer"></div>
    </div>
    <div class="lr-value" id="lr-value-min">0</div>
    <button id="lr-reset" title="Show all layers">All</button>
  `;

  const track = container.querySelector('#lr-track');
  const fill = container.querySelector('#lr-fill');
  const handleMin = container.querySelector('#lr-handle-min');
  const handleMax = container.querySelector('#lr-handle-max');
  const valueMin = container.querySelector('#lr-value-min');
  const valueMax = container.querySelector('#lr-value-max');

  let bounds = { min: 0, max: 0 };

  const positionFor = (value) => {
    const span = bounds.max - bounds.min;
    const ratio = span === 0 ? 0 : (bounds.max - value) / span;
    return ratio * 100;
  };

  const valueAt = (clientY) => {
    const rect = track.getBoundingClientRect();
    const span = bounds.max - bounds.min;
    if (rect.height === 0 || span === 0) return bounds.min;
    const ratio = clamp((clientY - rect.top) / rect.height, 0, 1);
    return Math.round(bounds.max - ratio * span);
  };

  const paint = () => {
    const range = appState.layerRange || bounds;
    const topPct = positionFor(range.max);
    const bottomPct = positionFor(range.min);
    handleMax.style.top = `${topPct}%`;
    handleMin.style.top = `${bottomPct}%`;
    fill.style.top = `${topPct}%`;
    fill.style.height = `${bottomPct - topPct}%`;
    valueMax.textContent = range.max;
    valueMin.textContent = range.min;
  };

  const syncBounds = () => {
    const z = appState.structure.getZRange();
    const next = {
      min: Math.min(z.min, appState.currentLayer),
      max: Math.max(z.max, appState.currentLayer),
    };
    const current = appState.layerRange;
    const wasFull = !current || (current.min <= bounds.min && current.max >= bounds.max);
    bounds = next;
    // Mutate directly: we are already inside a notify cycle.
    appState.layerRange = wasFull
      ? { ...bounds }
      : {
          min: clamp(current.min, bounds.min, bounds.max),
          max: clamp(current.max, bounds.min, bounds.max),
        };
    paint();
  };

  const drag = (which, clientY) => {
    const value = valueAt(clientY);
    const range = appState.layerRange || bounds;
    if (which === 'min') appState.setLayerRange(Math.min(value, range.max), range.max);
    else appState.setLayerRange(range.min, Math.max(value, range.min));
  };

  for (const handle of [handleMin, handleMax]) {
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      const which = handle.dataset.which;
      const onMove = (ev) => drag(which, ev.clientY);
      const onUp = () => {
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onUp);
      };
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
    });
  }

  track.addEventListener('pointerdown', (e) => {
    if (e.target !== track && e.target !== fill) return;
    const value = valueAt(e.clientY);
    const range = appState.layerRange || bounds;
    const which = Math.abs(value - range.min) <= Math.abs(value - range.max) ? 'min' : 'max';
    drag(which, e.clientY);
  });

  container.querySelector('#lr-reset').addEventListener('click', () => {
    appState.setLayerRange(bounds.min, bounds.max);
  });

  syncBounds();
  appState.onChange(syncBounds);
}
