import { type MatchImageSnapshotOptions, toMatchImageSnapshot } from 'jest-image-snapshot';
import path from 'path';
import { DOMMatrix, FontLibrary, Image, Path2D } from 'skia-canvas';

import { NodeCanvas } from './src/canvasConfig';

// Register consistent fonts for visual regression testing.
// Uses Arimo (free Google Font) as Verdana substitute for cross-environment consistency.
FontLibrary.use('Verdana', [
    path.resolve(__dirname, 'test/fonts/Arimo-Regular.ttf'),
    path.resolve(__dirname, 'test/fonts/Arimo-Bold.ttf'),
]);

// Extend Jest matchers with image snapshot support
declare module 'expect' {
    interface Matchers<R> {
        toMatchImageSnapshot(options?: MatchImageSnapshotOptions): R;
    }
}

expect.extend({ toMatchImageSnapshot });

// Type for browser globals we're injecting
interface BrowserGlobals {
    Path2D: typeof Path2D;
    DOMMatrix: typeof DOMMatrix;
    OffscreenCanvas: typeof OffscreenCanvas;
    Image: typeof HTMLImageElement;
    // DOM types - should never be used directly (use SSR-safe duck-typing instead)
    DocumentFragment: typeof DocumentFragment;
    Element: typeof Element;
    Node: typeof Node;
    HTMLElement: typeof HTMLElement;
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

/**
 * Creates a strict global for DOM types that throws on instanceof checks.
 * This helps detect SSR-incompatible code that uses `instanceof Element` etc.
 * instead of SSR-safe duck-typing (nodeType checks).
 */
function createStrictDOMGlobal<T extends abstract new (...args: any[]) => any>(name: string): T {
    const handler: ProxyHandler<T> = {
        construct(_target, _args) {
            throw new Error(
                `Direct ${name} instantiation detected!\n` +
                    `DOM types should not be instantiated directly in SSR context.`
            );
        },
        get(_target, prop) {
            if (prop === Symbol.toStringTag) return name;
            if (prop === 'prototype') return {};
            // Allow Symbol.hasInstance to be accessed so we can intercept instanceof
            if (prop === Symbol.hasInstance) {
                return () => {
                    throw new Error(
                        `Direct "instanceof ${name}" check detected!\n` +
                            `Use SSR-safe duck-typing (isNode, isElement, isDocumentFragment, isHTMLElement) ` +
                            `from ag-charts-core instead of "instanceof ${name}".`
                    );
                };
            }
            throw new Error(
                `Direct ${name} property access detected: ${String(prop)}\n` +
                    `Use SSR-safe utilities from ag-charts-core instead.`
            );
        },
    };
    return new Proxy(function () {} as unknown as T, handler);
}

// Provide canvas-related globals as STRICT proxies that throw on direct access.
// This ensures SSR-incompatible code paths are caught during testing.
// Code should use getPath2D(), getDOMMatrix(), etc. from ag-charts-core instead.
const globals = globalThis as typeof globalThis & BrowserGlobals;
globals.Path2D = createStrictGlobal('Path2D', Path2D);
globals.DOMMatrix = createStrictGlobal('DOMMatrix', DOMMatrix);
globals.OffscreenCanvas = createStrictGlobal('OffscreenCanvas', NodeCanvas as unknown as typeof OffscreenCanvas);
globals.Image = createStrictGlobal('Image', Image as unknown as typeof HTMLImageElement);

// Provide DOM type globals as STRICT proxies that throw on instanceof checks.
// This ensures SSR-incompatible code that uses `instanceof Element` etc. is caught.
// Code should use SSR-safe duck-typing (isNode, isElement, etc.) from ag-charts-core instead.
globals.DocumentFragment = createStrictDOMGlobal<typeof DocumentFragment>('DocumentFragment');
globals.Element = createStrictDOMGlobal<typeof Element>('Element');
globals.Node = createStrictDOMGlobal<typeof Node>('Node');
globals.HTMLElement = createStrictDOMGlobal<typeof HTMLElement>('HTMLElement');
