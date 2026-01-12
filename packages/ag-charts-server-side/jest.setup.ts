import { JSDOM } from 'jsdom';
import { DOMMatrix, Path2D } from 'skia-canvas';

// Create a minimal JSDOM environment to provide browser globals needed by ag-charts-community
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
});

// Provide browser globals that ag-charts-community expects
// Note: Do NOT provide HTMLElement - container validation passes if HTMLElement is undefined
(globalThis as any).DocumentFragment = dom.window.DocumentFragment;
(globalThis as any).Element = dom.window.Element;
(globalThis as any).Node = dom.window.Node;

// Provide canvas-related globals from skia-canvas
(globalThis as any).Path2D = Path2D;
(globalThis as any).DOMMatrix = DOMMatrix;
