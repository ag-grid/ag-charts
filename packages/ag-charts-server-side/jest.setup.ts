import { type MatchImageSnapshotOptions, toMatchImageSnapshot } from 'jest-image-snapshot';
import { JSDOM } from 'jsdom';
import { DOMMatrix, Path2D } from 'skia-canvas';

// Extend Jest matchers with image snapshot support
declare module 'expect' {
    interface Matchers<R> {
        toMatchImageSnapshot(options?: MatchImageSnapshotOptions): R;
    }
}

expect.extend({ toMatchImageSnapshot });

// Create a minimal JSDOM environment to provide browser globals needed by ag-charts-community
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
});

// Type for browser globals we're injecting
interface BrowserGlobals {
    DocumentFragment: typeof DocumentFragment;
    Element: typeof Element;
    Node: typeof Node;
    Path2D: typeof Path2D;
    DOMMatrix: typeof DOMMatrix;
}

// Provide browser globals that ag-charts-community expects
// Note: Do NOT provide HTMLElement - container validation passes if HTMLElement is undefined
const globals = globalThis as typeof globalThis & BrowserGlobals;
globals.DocumentFragment = dom.window.DocumentFragment;
globals.Element = dom.window.Element;
globals.Node = dom.window.Node;

// Provide canvas-related globals from skia-canvas
globals.Path2D = Path2D;
globals.DOMMatrix = DOMMatrix;
