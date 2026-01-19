/* eslint-disable @typescript-eslint/unbound-method */
import path from 'path';
import * as SkiaCanvas from 'skia-canvas';
import { Canvas, DOMMatrix, type ExportFormat, FontLibrary } from 'skia-canvas';

import { CANVAS_TO_BUFFER_DEFAULTS, ConfiguredCanvasMixin, applySkiaPatches } from 'ag-charts-core';

// Something is causing this to not be imported as a value
const { CanvasRenderingContext2D } = SkiaCanvas as any;

// Apply skia-canvas patches for consistent rendering
applySkiaPatches(CanvasRenderingContext2D, DOMMatrix);

FontLibrary.use('Verdana', [
    path.resolve(__dirname, '../../../fonts/Arimo-Regular.ttf'),
    path.resolve(__dirname, '../../../fonts/Arimo-Bold.ttf'),
]);

// Create configured canvas class using the mixin
export const ConfiguredCanvas = ConfiguredCanvasMixin(Canvas);

export { CANVAS_TO_BUFFER_DEFAULTS } from 'ag-charts-core';

export class MockContext {
    ctx: {
        nodeCanvas: Canvas;
        snapshot: () => ImageData;
        getRenderContext2D: () => globalThis.CanvasRenderingContext2D;
        getActiveCanvasInstances: () => Canvas[];
        getActiveOffscreenCanvasInstances: () => OffscreenCanvas[];
    };
    canvasStack: Canvas[];
    canvases: WeakRef<Canvas>[] = [];
    offscreenCanvases: WeakRef<OffscreenCanvas>[] = [];

    mockText = false;

    constructor(
        public width: number,
        public height: number,
        public document: Document,
        public realCreateElement: Document['createElement'] = document.createElement,
        public realOffscreenCanvas: typeof globalThis.OffscreenCanvas = globalThis.OffscreenCanvas
    ) {
        const nodeCanvas = new ConfiguredCanvas(width, height);

        this.ctx = {
            nodeCanvas,
            snapshot: this.snapshot.bind(this),
            getRenderContext2D: this.getRenderContext2D.bind(this),
            getActiveCanvasInstances: this.getActiveCanvasInstances.bind(this),
            getActiveOffscreenCanvasInstances: this.getActiveOffscreenCanvasInstances.bind(this),
        };
        this.canvasStack = [nodeCanvas];
        this.registerCanvasInstance(nodeCanvas);
    }

    reset() {
        this.ctx.nodeCanvas ??= new ConfiguredCanvas(this.width, this.height);
        this.canvasStack = [this.ctx.nodeCanvas];

        this.registerCanvasInstance(this.ctx.nodeCanvas);
    }

    snapshot() {
        return this.ctx.nodeCanvas
            .getContext('2d')
            .getImageData(0, 0, this.ctx.nodeCanvas.width, this.ctx.nodeCanvas.height);
    }

    getRenderContext2D(): globalThis.CanvasRenderingContext2D {
        const ctx = this.ctx.nodeCanvas.getContext('2d') as unknown as CanvasRenderingContext2D;
        return ctx as unknown as globalThis.CanvasRenderingContext2D;
    }

    registerCanvasInstance(canvas: Canvas) {
        this.canvases.push(new WeakRef(canvas));
    }

    registerOffscreenCanvasInstance(canvas: OffscreenCanvas) {
        this.offscreenCanvases.push(new WeakRef(canvas));
    }

    getActiveCanvasInstances() {
        const instances = this.canvases.map((ref) => ref.deref()).filter((ref): ref is Canvas => ref != null);
        const uniqueInstances = new Set(instances);
        this.canvases = [...uniqueInstances].map((c) => new WeakRef(c));
        return [...uniqueInstances];
    }

    getActiveOffscreenCanvasInstances() {
        const instances = this.offscreenCanvases
            .map((ref) => ref.deref())
            .filter((ref): ref is OffscreenCanvas => ref != null);
        const uniqueInstances = new Set(instances);
        this.offscreenCanvases = [...uniqueInstances].map((c) => new WeakRef(c));
        return [...uniqueInstances];
    }

    destroy() {
        (this as any).ctx.nodeCanvas = undefined;
        (this as any).realCreateElement = undefined;
        this.canvasStack = [];
        this.canvases = [];
    }
}

function proxyGetContext2D(_mockCtx: MockContext, canvas: Canvas, target: any) {
    if (target.__patched === true) return;
    target.__patched = true;

    const { getContext } = canvas;
    target.getContext = (type: '2d') => {
        const ctx = getContext.call(canvas, type);
        return ctx;
    };
}

export function setup(opts: { width?: number; height?: number; document?: Document } | MockContext) {
    let mockCtx: MockContext;
    if (opts instanceof MockContext) {
        mockCtx = opts;
        mockCtx.reset();
    } else {
        const { width = 800, height = 600, document = globalThis.document } = opts;
        mockCtx = new MockContext(width, height, document);
    }

    const { width, height, document } = mockCtx;

    const realCreateElement = document.createElement;
    mockCtx.realCreateElement = realCreateElement;

    (document as any).createElement = (element: any, options: any) => {
        if (element === 'canvas') {
            const mockedElement = realCreateElement.call(document, element, options) as HTMLCanvasElement;

            const nextCanvas = mockCtx.canvasStack.shift() ?? new ConfiguredCanvas(width, height);
            mockCtx.registerCanvasInstance(nextCanvas);

            proxyGetContext2D(mockCtx, nextCanvas, mockedElement);

            mockedElement.toDataURL = (mimeType = 'image/png') => {
                return nextCanvas.toDataURLSync(mimeType.split('/')[1] as ExportFormat);
            };

            return mockedElement;
        } else if (element === 'img') {
            return new Image();
        }

        return realCreateElement.call(document, element, options);
    };

    if (typeof globalThis.window !== 'undefined') {
        (globalThis as any).OffscreenCanvas = class OffscreenCanvas extends ConfiguredCanvas {
            constructor(w: number, h: number) {
                super(w, h);
                mockCtx.registerOffscreenCanvasInstance(this as any);
                proxyGetContext2D(mockCtx, this as unknown as Canvas, this);
            }
        };
    }

    return mockCtx;
}

export function teardown(mockContext: MockContext) {
    mockContext.document.createElement = mockContext.realCreateElement!;
    if (typeof globalThis.window !== 'undefined') {
        globalThis.OffscreenCanvas = mockContext.realOffscreenCanvas;
    }
    mockContext.destroy();
}

export function extractImageData({
    nodeCanvas,
    bbox,
}: {
    nodeCanvas: Canvas;
    bbox?: { x: number; y: number; width: number; height: number };
}) {
    let sourceCanvas = nodeCanvas;
    if (bbox && nodeCanvas) {
        const { x, y, width, height } = bbox;

        // Canvas must have a valid size, otherwise node-canvas fails.
        if (width < 0.5 || height < 0.5) {
            throw new Error('Invalid image size provided, dimensions must be greater than zero.');
        }

        sourceCanvas = new ConfiguredCanvas(width, height);
        sourceCanvas
            ?.getContext('2d')
            .drawImage(
                nodeCanvas,
                Math.round(x),
                Math.round(y),
                Math.round(width),
                Math.round(height),
                0,
                0,
                Math.round(width),
                Math.round(height)
            );
    }

    return sourceCanvas?.toBufferSync('png', CANVAS_TO_BUFFER_DEFAULTS);
}
