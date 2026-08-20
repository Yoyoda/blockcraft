import { appState, TOOLS } from '../core/AppState.js';

const TOOL_BUTTONS = [
  { id: TOOLS.PENCIL, icon: '✏️', label: 'Pencil', hint: 'Paint cell by cell' },
  { id: TOOLS.LINE, icon: '╱', label: 'Line', hint: 'Drag between two cells of this layer' },
  { id: TOOLS.RECT, icon: '▭', label: 'Rectangle', hint: 'Drag to fill a rectangle on this layer' },
  { id: TOOLS.CIRCLE, icon: '○', label: 'Circle', hint: 'Drag from the centre to fill a disc on this layer' },
  { id: TOOLS.SPHERE, icon: '⬤', label: 'Sphere', hint: 'Drag from the centre; widest section on this layer' },
];

/**
 * Left panel: drawing tools and material palette.
 */
export function initPalette(container) {
  const render = () => {
    let html = '<h3>Tools</h3><div class="palette-tools">';
    for (const tool of TOOL_BUTTONS) {
      const selected = tool.id === appState.currentTool ? ' selected' : '';
      html += `<button class="palette-tool${selected}" data-tool="${tool.id}" title="${tool.label} — ${tool.hint}"><span class="palette-tool-icon">${tool.icon}</span>${tool.label}</button>`;
    }
    html += '</div><h3>Materials</h3>';

    for (const cat of appState.library.categories) {
      html += `<div class="palette-category"><h4>${cat}</h4><div class="palette-blocks">`;
      for (const block of appState.library.getByCategory(cat)) {
        const selected = block.id === appState.selectedMaterialId ? ' selected' : '';
        html += `<div class="palette-block${selected}" data-id="${block.id}" title="${block.name}" style="background:${block.color}"></div>`;
      }
      html += '</div></div>';
    }
    container.innerHTML = html;

    container.querySelectorAll('.palette-tool').forEach(el => {
      el.addEventListener('click', () => appState.selectTool(el.dataset.tool));
    });
    container.querySelectorAll('.palette-block').forEach(el => {
      el.addEventListener('click', () => appState.selectMaterial(el.dataset.id));
    });
  };

  render();
  appState.onChange(render);
}
