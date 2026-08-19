# blockcraft
A webapp to plan block-based structure.


## Project structure:

 - Vite build system with GitHub Pages base path
 - Core: Structure (sparse Map<"x,y,z", blockId>, Z-up), StorageManager (localStorage CRUD), HistoryManager (global undo/redo with command pattern), AppState (central reactive state)
 - Library: 40 Minecraft-inspired blocks with colors, organized by category
 - 2D Editor: Canvas-based grid with pencil/eraser, pan (middle-click/alt+click), zoom (scroll wheel), layer navigation
 - 3D Viewer: Three.js with instanced meshes, OrbitControls, Z-up camera, live sync with editor
 - UI: Split-panel layout (palette | editor | viewer), toolbar (new/save/load/export/import/undo/redo), keyboard shortcuts (Ctrl+Z/Y)
