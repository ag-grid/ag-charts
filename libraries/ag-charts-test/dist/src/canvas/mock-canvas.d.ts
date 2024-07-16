import type { Canvas } from 'canvas';
export declare class MockContext {
    document: Document;
    realCreateElement: Document['createElement'];
    ctx: {
        nodeCanvas: Canvas;
        getActiveCanvasInstances: () => Canvas[];
    };
    canvasStack: Canvas[];
    canvases: WeakRef<Canvas>[];
    constructor(width: number | undefined, height: number | undefined, document: Document, realCreateElement?: Document['createElement']);
    registerCanvasInstance(canvas: Canvas): void;
    getActiveCanvasInstances(): Canvas[];
    destroy(): void;
}
export declare function setup(opts: {
    width?: number;
    height?: number;
    document?: Document;
    mockCtx?: MockContext;
    mockText?: boolean;
}): MockContext;
export declare function teardown(mockContext: MockContext): void;
