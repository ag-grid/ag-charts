/* eslint-disable @typescript-eslint/unbound-method */
import { Canvas, CanvasRenderingContext2D, Image } from 'skia-canvas';

import { mockCanvasText } from './mock-canvas-text';

// node-canvas does not support createImageBitmap() yet (https://github.com/Automattic/node-canvas/issues/876).
// However, the Canvas.drawImage(img,...) method does accept a Canvas-type img parameter. So use as new Canvas
// as an ImageBitmap.
Object.defineProperty(Canvas.prototype, 'transferToImageBitmap', {
    value: function transferToImageBitmap() {
        const { width, height } = this;
        const bitmap = createCanvas(width, height);
        bitmap.getContext('2d').drawImage(this, 0, 0, width, height);
        Object.defineProperty(bitmap, 'close', {
            // no-op
            value: () => {},
        });
        return bitmap;
    },
    enumerable: false,
    writable: true,
    configurable: true,
});

export function createCanvas(width: number, height: number) {
    const canvas = new Canvas(width, height);
    canvas.gpu = false;
    return canvas;
}

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
        public realOffscreenCanvas: typeof global.OffscreenCanvas = Canvas as unknown as typeof global.OffscreenCanvas
    ) {
        const nodeCanvas = createCanvas(width, height);

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

    snapshot() {
        return this.ctx.nodeCanvas
            .getContext('2d')
            .getImageData(0, 0, this.ctx.nodeCanvas.width, this.ctx.nodeCanvas.height);
    }

    getRenderContext2D(): globalThis.CanvasRenderingContext2D {
        let ctx = this.ctx.nodeCanvas.getContext('2d') as unknown as CanvasRenderingContext2D;
        if (this.mockText) {
            ctx = mockCanvasText(ctx as any) as any;
        }
        return ctx as unknown as globalThis.CanvasRenderingContext2D;
    }

    registerCanvasInstance(canvas: Canvas) {
        this.canvases.push(new WeakRef(canvas));
    }

    registerOffscreenCanvasInstance(canvas: OffscreenCanvas) {
        this.offscreenCanvases.push(new WeakRef(canvas));
    }

    getActiveCanvasInstances() {
        const instances = this.canvases.map((ref) => ref.deref());
        this.canvases = this.canvases.filter((_ref, index) => instances[index] != null);
        return instances.filter((value): value is NonNullable<typeof value> => value != null);
    }

    getActiveOffscreenCanvasInstances() {
        const instances = this.offscreenCanvases.map((ref) => ref.deref());
        this.offscreenCanvases = this.offscreenCanvases.filter((_ref, index) => instances[index] != null);
        return instances.filter((value): value is NonNullable<typeof value> => value != null);
    }

    destroy() {
        (this as any).ctx.nodeCanvas = undefined;
        (this as any).realCreateElement = undefined;
        this.canvasStack = [];
        this.canvases = [];
    }
}

function proxyGetContext2D(mockCtx: MockContext, canvas: Canvas, target: any) {
    if (target.__patched === true) return;
    target.__patched = true;

    const { getContext } = canvas;
    target.getContext = (type: '2d') => {
        let ctx = getContext.call(canvas, type);
        if (mockCtx.mockText) {
            ctx = mockCanvasText(ctx as any) as any;
        }
        return ctx;
    };
}

export function setup(opts: { width?: number; height?: number; document?: Document } | MockContext) {
    let mockCtx: MockContext;
    if (opts instanceof MockContext) {
        mockCtx = opts;
    } else {
        const { width = 800, height = 600, document = window.document } = opts;
        mockCtx = new MockContext(width, height, document);
    }

    const { width, height, document } = mockCtx;

    const nodeCanvas = createCanvas(width, height);
    mockCtx.ctx.nodeCanvas = nodeCanvas;
    mockCtx.canvasStack = [nodeCanvas];

    if (typeof window === 'undefined') {
        (global as any)['agChartsSceneRenderModel'] = 'composite';
    } else {
        (window as any)['agChartsSceneRenderModel'] = 'composite';
    }

    const realCreateElement = document.createElement;
    mockCtx.realCreateElement = realCreateElement;

    (document as any).createElement = (element: any, options: any) => {
        if (element === 'canvas') {
            const mockedElement = realCreateElement.call(document, element, options) as HTMLCanvasElement;

            const nextCanvas = mockCtx.canvasStack.shift() ?? createCanvas(width, height);
            mockCtx.registerCanvasInstance(nextCanvas);

            proxyGetContext2D(mockCtx, nextCanvas, mockedElement);

            mockedElement.toDataURL = (mimeType?: 'png') => {
                return nextCanvas.toDataURLSync(mimeType ?? 'png');
            };

            return mockedElement;
        } else if (element === 'img') {
            return new Image();
        }

        return realCreateElement.call(document, element, options);
    };

    if (typeof window !== 'undefined') {
        (window as any).OffscreenCanvas = class OffscreenCanvas extends mockCtx.realOffscreenCanvas {
            constructor(w: number, h: number) {
                super(w, h);
                mockCtx.registerOffscreenCanvasInstance(this);
                proxyGetContext2D(mockCtx, this as unknown as Canvas, this);

                (this as any).gpu = false;
            }
        };
    }

    return mockCtx;
}

export function teardown(mockContext: MockContext) {
    mockContext.document.createElement = mockContext.realCreateElement!;
    if (typeof window !== 'undefined') {
        window.OffscreenCanvas = mockContext.realOffscreenCanvas;
    }
    mockContext.destroy();
}
