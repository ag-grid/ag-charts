/* eslint-disable @typescript-eslint/unbound-method */
import { Canvas, CanvasPattern, CanvasRenderingContext2D, type DOMMatrix, Image, createCanvas } from 'canvas';

import { ConicGradient } from './conicGradient';
import { mockCanvasText } from './mock-canvas-text';

// node-canvas does not support createImageBitmap() yet (https://github.com/Automattic/node-canvas/issues/876).
// However, the Canvas.drawImage(img,...) method does accept a Canvas-type img parameter. So use as new Canvas
// as an ImageBitmap.
Object.defineProperty(Canvas.prototype, 'transferToImageBitmap', {
    value: function transferToImageBitmap() {
        const { width, height } = this;
        const bitmap = new Canvas(width, height);
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

Object.defineProperty(CanvasRenderingContext2D.prototype, 'createConicGradient', {
    value: function createConicGradient(startAngle: number, x: number, y: number) {
        return new ConicGradient(this, startAngle, x, y);
    },
    enumerable: false,
    writable: true,
    configurable: true,
});

// https://github.com/Automattic/node-canvas/issues/1852
const context2dTransform = CanvasRenderingContext2D.prototype.transform;
Object.defineProperty(CanvasRenderingContext2D.prototype, 'transform', {
    value: function transform(a: number, b: number, c: number, d: number, e: number, f: number) {
        if (a === 0) {
            context2dTransform.call(this, 1e-6, 0, 0, 1e-6, 0, 0);
            return;
        }

        context2dTransform.call(this, a, b, c, d, e, f);
    },
    enumerable: false,
    writable: true,
    configurable: true,
});

// https://github.com/Automattic/node-canvas/issues/1852
const context2dCreatePattern = CanvasRenderingContext2D.prototype.createPattern;
Object.defineProperty(CanvasRenderingContext2D.prototype, 'createPattern', {
    value: function createPattern(image: any, repeat: any) {
        const pattern = context2dCreatePattern.call(this, image, repeat);
        if (image instanceof Image) {
            (pattern as any).__skipSetTransformWorkaround = true;
        }
        return pattern;
    },
    enumerable: false,
    writable: true,
    configurable: true,
});

const canvasPatternSetTransform = CanvasPattern.prototype.setTransform;
Object.defineProperty(CanvasPattern.prototype, 'setTransform', {
    value: function setTransform(matrix: DOMMatrix) {
        if (this.__skipSetTransformWorkaround !== true) {
            // Node canvas has bugs with pattern translations
            matrix.e = 0;
            matrix.f = 0;
        }

        canvasPatternSetTransform.call(this, matrix);
    },
    enumerable: false,
    writable: true,
    configurable: true,
});

export class MockContext {
    ctx: {
        nodeCanvas: Canvas;
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
        public realOffscreenCanvas: typeof global.OffscreenCanvas = global.OffscreenCanvas
    ) {
        const nodeCanvas = createCanvas(width, height);

        this.ctx = {
            nodeCanvas,
            getRenderContext2D: this.getRenderContext2D.bind(this),
            getActiveCanvasInstances: this.getActiveCanvasInstances.bind(this),
            getActiveOffscreenCanvasInstances: this.getActiveOffscreenCanvasInstances.bind(this),
        };
        this.canvasStack = [nodeCanvas];
        this.registerCanvasInstance(nodeCanvas);
    }

    getRenderContext2D(): globalThis.CanvasRenderingContext2D {
        let ctx = this.ctx.nodeCanvas.getContext('2d') as unknown as CanvasRenderingContext2D;
        if (this.mockText) {
            ctx = mockCanvasText(ctx);
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
            ctx = mockCanvasText(ctx);
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

    if (typeof window !== 'undefined') {
        (window as any)['agChartsSceneRenderModel'] = 'composite';
    } else {
        (global as any)['agChartsSceneRenderModel'] = 'composite';
    }

    const realCreateElement = document.createElement;
    mockCtx.realCreateElement = realCreateElement;

    (document as any).createElement = (element: any, options: any) => {
        if (element === 'canvas') {
            const mockedElement = realCreateElement.call(document, element, options) as HTMLCanvasElement;

            const nextCanvas = mockCtx.canvasStack.shift() ?? createCanvas(width, height);
            mockCtx.registerCanvasInstance(nextCanvas);

            proxyGetContext2D(mockCtx, nextCanvas, mockedElement);

            mockedElement.toDataURL = (mimeType?: 'image/png') => {
                return nextCanvas.toDataURL(mimeType ?? 'image/png');
            };

            return mockedElement;
        } else if (element === 'img') {
            return new Image();
        }

        return realCreateElement.call(document, element, options);
    };

    if (typeof window !== 'undefined') {
        const OffscreenCanvas = function OffscreenCanvas(w: number, h: number) {
            const canvas = new mockCtx.realOffscreenCanvas(w, h);
            mockCtx.registerOffscreenCanvasInstance(canvas);
            proxyGetContext2D(mockCtx, canvas as unknown as Canvas, canvas);
            return canvas;
        };
        OffscreenCanvas.prototype = mockCtx.realOffscreenCanvas;
        (window as any).OffscreenCanvas = OffscreenCanvas;
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
