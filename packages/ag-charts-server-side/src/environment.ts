import { JSDOM } from 'jsdom';
import type { Canvas, DOMMatrix as SkiaDOMMatrix, Image as SkiaImage, Path2D as SkiaPath2D } from 'skia-canvas';
import { DOMMatrix, Image, Path2D } from 'skia-canvas';

import { NodeCanvas } from './canvas-config';
import type { IsolatedEnvironment } from './types';

/** Extended window interface for server-side rendering environment */
interface ServerSideWindow extends Omit<Window, 'requestAnimationFrame' | 'cancelAnimationFrame'> {
    requestAnimationFrame: (callback: FrameRequestCallback) => number;
    cancelAnimationFrame: (handle: number) => void;
    OffscreenCanvas: typeof Canvas;
    DOMMatrix: typeof SkiaDOMMatrix;
    Image: typeof SkiaImage;
    Path2D: typeof SkiaPath2D;
    agChartsSceneRenderModel: string;
}

export function createIsolatedEnvironment(): IsolatedEnvironment {
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="container"></div></body></html>', {
        url: 'http://localhost/',
    });

    const win = dom.window as unknown as ServerSideWindow;

    win.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0) as unknown as number;
    win.cancelAnimationFrame = (handle: number) => clearTimeout(handle);

    win.OffscreenCanvas = NodeCanvas;
    win.DOMMatrix = DOMMatrix;
    win.Image = Image;
    win.Path2D = Path2D;
    win.agChartsSceneRenderModel = 'composite';

    return {
        window: win as unknown as Window & typeof globalThis,
        document: win.document,
        dispose: () => {
            dom.window.close();
        },
    };
}
