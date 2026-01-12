import { JSDOM } from 'jsdom';
import { DOMMatrix, Image, Path2D } from 'skia-canvas';

import { NodeCanvas } from './canvas-config';
import type { IsolatedEnvironment } from './types';

export function createIsolatedEnvironment(): IsolatedEnvironment {
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="container"></div></body></html>', {
        url: 'http://localhost/',
    });

    const { window } = dom;

    (window as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0);
    (window as any).cancelAnimationFrame = clearTimeout;

    (window as any).OffscreenCanvas = NodeCanvas;
    (window as any).DOMMatrix = DOMMatrix;
    (window as any).Image = Image;
    (window as any).Path2D = Path2D;
    (window as any).agChartsSceneRenderModel = 'composite';

    return {
        window: window as unknown as Window & typeof globalThis,
        document: window.document,
        dispose: () => {
            dom.window.close();
        },
    };
}
