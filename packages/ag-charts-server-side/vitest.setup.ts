import { type MatchImageSnapshotOptions } from 'jest-image-snapshot';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import path from 'path';
import { DOMMatrix, FontLibrary, Image, Path2D } from 'skia-canvas';
import { expect } from 'vitest';

import { NodeCanvas } from './src/canvasConfig';

FontLibrary.use('Verdana', [
    path.resolve(__dirname, 'test/fonts/Arimo-Regular.ttf'),
    path.resolve(__dirname, 'test/fonts/Arimo-Bold.ttf'),
]);

FontLibrary.use('Impact', [path.resolve(__dirname, 'test/fonts/Arimo-Bold.ttf')]);

declare module 'vitest' {
    interface Assertion<T = any> {
        toMatchImageSnapshot(options?: MatchImageSnapshotOptions): T;
    }
}

expect.extend({ toMatchImageSnapshot });

interface BrowserGlobals {
    Path2D: typeof Path2D;
    DOMMatrix: typeof DOMMatrix;
    OffscreenCanvas: typeof OffscreenCanvas;
    Image: typeof HTMLImageElement;
    DocumentFragment: typeof DocumentFragment;
    Element: typeof Element;
    Node: typeof Node;
    HTMLElement: typeof HTMLElement;
}

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
            if (prop === Symbol.hasInstance) {
                return () => false;
            }
            throw new Error(
                `Direct ${name} property access detected: ${String(prop)}\n` +
                    `Use SSR-safe utilities from ag-charts-core instead.`
            );
        },
    };
    return new Proxy(function () {} as unknown as T, handler);
}

const globals = globalThis as typeof globalThis & BrowserGlobals;
globals.Path2D = createStrictGlobal('Path2D', Path2D);
globals.DOMMatrix = createStrictGlobal('DOMMatrix', DOMMatrix);
globals.OffscreenCanvas = createStrictGlobal('OffscreenCanvas', NodeCanvas as unknown as typeof OffscreenCanvas);
globals.Image = createStrictGlobal('Image', Image as unknown as typeof HTMLImageElement);

globals.DocumentFragment = createStrictDOMGlobal<typeof DocumentFragment>('DocumentFragment');
globals.Element = createStrictDOMGlobal<typeof Element>('Element');
globals.Node = createStrictDOMGlobal<typeof Node>('Node');
globals.HTMLElement = createStrictDOMGlobal<typeof HTMLElement>('HTMLElement');
