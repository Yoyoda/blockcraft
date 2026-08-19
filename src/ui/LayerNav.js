import { appState } from '../core/AppState.js';

/**
 * Layer navigation controls.
 */
export function initLayerNav(container) {
  const render = () => {
    container.innerHTML = `
      <button id="layer-down">▼</button>
      <span id="layer-display">Layer Z: ${appState.currentLayer}</span>
      <button id="layer-up">▲</button>
    `;
    container.querySelector('#layer-up').addEventListener('click', () => {
      appState.setLayer(appState.currentLayer + 1);
    });
    container.querySelector('#layer-down').addEventListener('click', () => {
      appState.setLayer(appState.currentLayer - 1);
    });
  };

  render();
  appState.onChange(render);
}
