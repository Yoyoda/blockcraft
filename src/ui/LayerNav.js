import { appState } from '../core/AppState.js';

/**
 * Layer navigation, duplication and translation controls.
 */
export function initLayerNav(container) {
  container.innerHTML = `
    <div class="layer-group">
      <button id="layer-down" title="Layer down (Ctrl+Wheel)">▼</button>
      <span id="layer-display">Layer Z: ${appState.currentLayer}</span>
      <button id="layer-up" title="Layer up (Ctrl+Wheel)">▲</button>
    </div>
    <div class="layer-group">
      <span class="layer-group-label">Copy</span>
      <button id="layer-copy-up" title="Copy this layer above (Z+1)">⧉▲</button>
      <button id="layer-copy-down" title="Copy this layer below (Z-1)">⧉▼</button>
    </div>
    <div class="layer-group">
      <span class="layer-group-label">Move</span>
      <button id="layer-move-left" title="Move layer -X">←</button>
      <button id="layer-move-right" title="Move layer +X">→</button>
      <button id="layer-move-up" title="Move layer -Y">↑</button>
      <button id="layer-move-down" title="Move layer +Y">↓</button>
    </div>
    <div class="layer-group">
      <span class="layer-group-label">Delete</span>
      <button id="layer-clear" title="Clear this layer's blocks">🗑</button>
      <button id="layer-remove" title="Delete this layer (layers above shift down)">⤓</button>
    </div>
  `;

  const on = (id, fn) => container.querySelector(id).addEventListener('click', fn);

  on('#layer-up', () => appState.setLayer(appState.currentLayer + 1));
  on('#layer-down', () => appState.setLayer(appState.currentLayer - 1));
  on('#layer-copy-up', () => appState.copyLayer(1));
  on('#layer-copy-down', () => appState.copyLayer(-1));
  on('#layer-move-left', () => appState.moveLayer(-1, 0));
  on('#layer-move-right', () => appState.moveLayer(1, 0));
  on('#layer-move-up', () => appState.moveLayer(0, -1));
  on('#layer-move-down', () => appState.moveLayer(0, 1));
  on('#layer-clear', () => appState.clearLayer());
  on('#layer-remove', () => appState.removeLayer());

  const display = container.querySelector('#layer-display');
  appState.onChange(() => {
    display.textContent = `Layer Z: ${appState.currentLayer}`;
  });
}
