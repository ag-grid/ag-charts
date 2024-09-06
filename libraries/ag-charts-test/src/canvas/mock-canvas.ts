import { Canvas, Image, CanvasRenderingContext2D as NodeCanvasRenderingContext2D, createCanvas } from 'canvas';

import { mockCanvasText } from './mock-canvas-text';

// node-canvas does not support createImageBitmap() yet (https://github.com/Automattic/node-canvas/issues/876).
// However, the Canvas.drawImage(img,...) method does accept a Canvas-type img parameter. So use as new Canvas
// as an ImageBitmap.
(Canvas.prototype as any).transferToImageBitmap = function () {
    const { width, height } = this;
    const bitmap = new Canvas(width, height);
    bitmap.getContext('2d').drawImage(this, 0, 0, width, height);
    return bitmap;
};

interface ColorStop {
    offset: number;
    color: string;
}

function parseColor(input: string): number[] {
    if (input.startsWith('#')) {
        const parts: number[] = [];

        const delta = input.length < 6 ? 1 : 2;
        for (let i = 1; i < input.length; i += delta) {
            const part = input.slice(i, i + delta);
            const value = parseInt(part, 16);
            if (delta === 1) {
                parts.push(value + value * 16);
            } else {
                parts.push(value);
            }
        }

        return parts;
    } else if (input.startsWith('rgb')) {
        const rgba = Array.from(input.matchAll(/[\d.]+/g), (match) => Number(match[0]));

        if (rgba.length === 3) {
            return [rgba[0], rgba[1], rgba[2]];
        } else if (rgba.length === 4) {
            return [rgba[0], rgba[1], rgba[2], rgba[3]];
        }
    }

    throw new Error(`Failed to parse "${input}"`);
}

class ConicGradient {
    colorStops: ColorStop[] = [];

    constructor(
        private ctx: NodeCanvasRenderingContext2D,
        private startAngle: number,
        private cx: number,
        private cy: number
    ) {}

    addColorStop(offset: number, color: string) {
        this.colorStops.push({ offset, color });
    }

    createPattern() {
        const { ctx, colorStops, startAngle, cx, cy } = this;
        const { width, height } = ctx.canvas;

        const externalCanvas = new Canvas(width, height);
        const externalCtx = externalCanvas.getContext('2d');
        const imageData = externalCtx.getImageData(0, 0, width, height);

        const resolvedColors = colorStops.map(({ offset, color }) => {
            const [r, g, b] = parseColor(color);
            return { offset, r, g, b };
        });

        for (let x = 0; x < imageData.width; x += 1) {
            for (let y = 0; y < imageData.height; y += 1) {
                const i = (y * imageData.width + x) * 4;

                const angle = Math.atan2(y - cy, x - cx);
                let offset = (angle - startAngle) / (2 * Math.PI);
                offset = ((offset % 1) + 1) % 1;
                const colorStopBefore = resolvedColors.findLast((c) => c.offset < offset) ?? resolvedColors.at(0)!;
                const colorStopAfter = resolvedColors.find((c) => c.offset > offset) ?? resolvedColors.at(-1)!;

                const offsetRange = colorStopAfter.offset - colorStopBefore.offset;
                const delta =
                    offsetRange > 0
                        ? (offset - colorStopBefore.offset) / (colorStopAfter.offset - colorStopBefore.offset)
                        : 0;
                const r = colorStopBefore.r * (1 - delta) + colorStopAfter.r * delta;
                const g = colorStopBefore.g * (1 - delta) + colorStopAfter.g * delta;
                const b = colorStopBefore.b * (1 - delta) + colorStopAfter.b * delta;

                imageData.data[i + 0] = r;
                imageData.data[i + 1] = g;
                imageData.data[i + 2] = b;
                imageData.data[i + 3] = 255;
            }
        }

        externalCtx.putImageData(imageData, 0, 0);

        return ctx.createPattern(externalCanvas, 'repeat');
    }
}

(NodeCanvasRenderingContext2D.prototype as any).createConicGradient = function (
    startAngle: number,
    x: number,
    y: number
) {
    return new ConicGradient(this, startAngle, x, y);
};

export class MockContext {
    document: Document;
    realCreateElement: Document['createElement'];
    ctx: {
        nodeCanvas: Canvas;
        getRenderContext2D: () => CanvasRenderingContext2D;
        getActiveCanvasInstances: () => Canvas[];
    };
    canvasStack: Canvas[];
    canvases: WeakRef<Canvas>[] = [];

    constructor(
        width = 1,
        height = 1,
        document: Document,
        realCreateElement: Document['createElement'] = document.createElement
    ) {
        this.document = document;

        const nodeCanvas = createCanvas(width, height);

        this.realCreateElement = realCreateElement;
        this.ctx = {
            nodeCanvas,
            getRenderContext2D: () => this.ctx.nodeCanvas.getContext('2d') as unknown as CanvasRenderingContext2D,
            getActiveCanvasInstances: this.getActiveCanvasInstances.bind(this),
        };
        this.canvasStack = [nodeCanvas];
        this.registerCanvasInstance(nodeCanvas);
    }

    registerCanvasInstance(canvas: Canvas) {
        this.canvases.push(new WeakRef(canvas));
    }

    getActiveCanvasInstances() {
        const instances = this.canvases.map((ref) => ref.deref());
        this.canvases = this.canvases.filter((_ref, index) => instances[index] != null);
        return instances.filter((value): value is NonNullable<typeof value> => value != null);
    }

    destroy() {
        (this as any).ctx.nodeCanvas = undefined;
        (this as any).realCreateElement = undefined;
        this.canvasStack = [];
        this.canvases = [];
    }
}

export function setup(opts: {
    width?: number;
    height?: number;
    document?: Document;
    mockCtx?: MockContext;
    mockText?: boolean;
}) {
    const {
        width = 800,
        height = 600,
        document = window.document,
        mockCtx = new MockContext(width, height, document),
        mockText = false,
    } = opts;
    if (mockText) {
        mockCanvasText();
    }
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

            let [nextCanvas] = mockCtx.canvasStack.splice(0, 1);
            if (!nextCanvas) {
                nextCanvas = createCanvas(width, height);
            }
            mockCtx.registerCanvasInstance(nextCanvas);

            mockedElement.getContext = (type: any) => {
                const context2d = nextCanvas.getContext(type, { alpha: true });
                context2d.patternQuality = 'good';
                context2d.quality = 'good';
                context2d.textDrawingMode = 'path';
                context2d.antialias = 'subpixel';

                return context2d as any;
            };

            return mockedElement;
        } else if (element === 'img') {
            return new Image();
        }

        return realCreateElement.call(document, element, options);
    };

    return mockCtx;
}

export function teardown(mockContext: MockContext) {
    mockContext.document.createElement = mockContext.realCreateElement!;
    mockContext.destroy();
}
