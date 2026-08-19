import { appState } from '../core/AppState.js';
import { storage } from '../core/StorageManager.js';
import { Structure } from '../core/Structure.js';

/**
 * Build the toolbar UI.
 */
export function initToolbar(container) {
  container.innerHTML = `
    <div class="toolbar-group">
      <button id="btn-new" title="New Structure">🆕 New</button>
      <button id="btn-save" title="Save">💾 Save</button>
      <button id="btn-load" title="Load">📂 Load</button>
      <button id="btn-export" title="Export">⬇️ Export</button>
      <button id="btn-import" title="Import">⬆️ Import</button>
    </div>
    <div class="toolbar-group">
      <button id="btn-undo" title="Undo (Ctrl+Z)">↩️ Undo</button>
      <button id="btn-redo" title="Redo (Ctrl+Y)">↪️ Redo</button>
    </div>
    <div class="toolbar-group">
      <input id="structure-name" class="structure-name" type="text" value="${appState.structure.name}" title="Structure name" />
    </div>
  `;

  container.querySelector('#btn-new').addEventListener('click', () => {
    const name = prompt('Structure name:', 'New Structure');
    if (name) appState.loadStructure(new Structure({ name }));
  });

  container.querySelector('#btn-save').addEventListener('click', () => {
    storage.save(appState.structure);
    alert('Saved!');
  });

  container.querySelector('#btn-load').addEventListener('click', () => {
    const index = storage.getIndex();
    if (index.length === 0) { alert('No saved structures.'); return; }
    const msg = index.map((e, i) => `${i + 1}. ${e.name}`).join('\n');
    const choice = prompt(`Select structure:\n${msg}`);
    const idx = parseInt(choice, 10) - 1;
    if (idx >= 0 && idx < index.length) {
      const s = storage.load(index[idx].id);
      if (s) appState.loadStructure(s);
    }
  });

  container.querySelector('#btn-export').addEventListener('click', () => {
    const data = JSON.stringify(appState.structure.toJSON(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appState.structure.name}.blockcraft.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  container.querySelector('#btn-import').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.blockcraft.json';
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const s = Structure.fromJSON(data);
          appState.loadStructure(s);
        } catch (err) {
          alert('Invalid file: ' + err.message);
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });

  const nameInput = container.querySelector('#structure-name');
  nameInput.addEventListener('change', () => {
    appState.renameStructure(nameInput.value);
    nameInput.value = appState.structure.name;
  });
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') nameInput.blur();
  });

  container.querySelector('#btn-undo').addEventListener('click', () => {
    appState.history.undo();
    appState.notify();
  });

  container.querySelector('#btn-redo').addEventListener('click', () => {
    appState.history.redo();
    appState.notify();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); appState.history.undo(); appState.notify(); }
    if (e.ctrlKey && e.key === 'y') { e.preventDefault(); appState.history.redo(); appState.notify(); }
  });

  // Update name display
  appState.onChange(() => {
    if (document.activeElement !== nameInput) nameInput.value = appState.structure.name;
  });
}
