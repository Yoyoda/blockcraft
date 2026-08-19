import { appState } from '../core/AppState.js';

/**
 * Block palette panel.
 */
export function initPalette(container) {
  const render = () => {
    const categories = appState.library.categories;
    let html = '<h3>Blocks</h3>';
    for (const cat of categories) {
      html += `<div class="palette-category"><h4>${cat}</h4><div class="palette-blocks">`;
      const blocks = appState.library.getByCategory(cat);
      for (const block of blocks) {
        const selected = block.id === appState.selectedBlockId ? ' selected' : '';
        html += `<div class="palette-block${selected}" data-id="${block.id}" title="${block.name}" style="background:${block.color}"></div>`;
      }
      html += '</div></div>';
    }
    container.innerHTML = html;

    container.querySelectorAll('.palette-block').forEach(el => {
      el.addEventListener('click', () => {
        appState.selectBlock(el.dataset.id);
      });
    });
  };

  render();
  appState.onChange(render);
}
