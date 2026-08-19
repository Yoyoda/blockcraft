import { EditorCanvas } from './editor/EditorCanvas.js';
import { Viewer3D } from './viewer/Viewer3D.js';
import { initToolbar } from './ui/Toolbar.js';
import { initPalette } from './ui/Palette.js';
import { initLayerNav } from './ui/LayerNav.js';
import { initLayerRange } from './ui/LayerRange.js';

// Initialize UI
initToolbar(document.getElementById('toolbar'));
initPalette(document.getElementById('palette-panel'));
initLayerNav(document.getElementById('layer-nav'));
initLayerRange(document.getElementById('layer-range'));

// Initialize canvases
new EditorCanvas(document.getElementById('editor-canvas'), {
  cursorLabel: document.getElementById('editor-cursor'),
});
new Viewer3D(document.getElementById('viewer-canvas'));
