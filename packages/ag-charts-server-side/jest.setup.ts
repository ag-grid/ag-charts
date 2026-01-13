import { type MatchImageSnapshotOptions, toMatchImageSnapshot } from 'jest-image-snapshot';
import { JSDOM } from 'jsdom';
import { DOMMatrix, Image, Path2D } from 'skia-canvas';

import { NodeCanvas } from './src/canvas-config';

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
    OffscreenCanvas: typeof OffscreenCanvas;
    Image: typeof HTMLImageElement;
}

/**
 * Creates a "strict" global that throws an error when accessed directly.
 * This helps detect SSR-incompatible code that uses browser globals directly
 * instead of through the proxy functions (getPath2D, getDOMMatrix, etc.).
 */
function createStrictGlobal<T extends new (...args: any[]) => any>(name: string, _implementation: T): T {
    const handler: ProxyHandler<T> = {
        construct(_target, _args) {
            throw new Error(
                `Direct ${name} instantiation detected!\n` +
                    `Use get${name}() from ag-charts-core instead of "new ${name}()"`
            );
        },
        get(_target, prop) {
            if (prop === Symbol.toStringTag) return name;
            if (prop === 'prototype') return {};
            throw new Error(
                `Direct ${name} property access detected: ${String(prop)}\n` +
                    `Use get${name}() from ag-charts-core instead`
            );
        },
    };
    return new Proxy(function () {} as unknown as T, handler);
}

// Provide browser globals that ag-charts-community expects
// Note: Do NOT provide HTMLElement - container validation passes if HTMLElement is undefined
const globals = globalThis as typeof globalThis & BrowserGlobals;
globals.DocumentFragment = dom.window.DocumentFragment;
globals.Element = dom.window.Element;
globals.Node = dom.window.Node;

// Provide canvas-related globals as STRICT proxies that throw on direct access.
// This ensures SSR-incompatible code paths are caught during testing.
// Code should use getPath2D(), getDOMMatrix(), etc. from ag-charts-core instead.
globals.Path2D = createStrictGlobal('Path2D', Path2D);
globals.DOMMatrix = createStrictGlobal('DOMMatrix', DOMMatrix);
globals.OffscreenCanvas = createStrictGlobal('OffscreenCanvas', NodeCanvas as unknown as typeof OffscreenCanvas);
globals.Image = createStrictGlobal('Image', Image as unknown as typeof HTMLImageElement);
