import { EditorCanvas } from './editor/EditorCanvas.js';
import { Viewer3D } from './viewer/Viewer3D.js';
import { initToolbar } from './ui/Toolbar.js';
import { initPalette } from './ui/Palette.js';
import { initLayerNav } from './ui/LayerNav.js';

// Initialize UI
initToolbar(document.getElementById('toolbar'));
initPalette(document.getElementById('palette-panel'));
initLayerNav(document.getElementById('layer-nav'));

// Initialize canvases
new EditorCanvas(document.getElementById('editor-canvas'));
new Viewer3D(document.getElementById('viewer-canvas'));
