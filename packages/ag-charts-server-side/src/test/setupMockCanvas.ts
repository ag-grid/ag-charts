import { CANVAS_HEIGHT, CANVAS_WIDTH } from 'ag-charts-core';

import { NodeCanvas, type NodeCanvasInstance } from '../canvasConfig';
import { type DocumentPatchResult, patchDocumentCreateElement } from '../documentPatch';

export interface MockCanvasContext {
    nodeCanvas: NodeCanvasInstance;
    snapshot: () => ImageData;
    getRenderContext2D: () => CanvasRenderingContext2D;
}

let patchResult: DocumentPatchResult | null = null;

export function setupMockCanvas(opts: { width?: number; height?: number } = {}): MockCanvasContext {
    const { width = CANVAS_WIDTH, height = CANVAS_HEIGHT } = opts;

    const canvas = new NodeCanvas(width, height);

    beforeEach(() => {
        patchResult = patchDocumentCreateElement(document, {
            getCanvas: () => canvas,
        });
    });

    afterEach(() => {
        patchResult?.restore();
        patchResult = null;
    });

    return {
        nodeCanvas: canvas,
        snapshot: () => {
            const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
            return ctx.getImageData(0, 0, width, height);
        },
        getRenderContext2D: () => canvas.getContext('2d') as CanvasRenderingContext2D,
    };
}
