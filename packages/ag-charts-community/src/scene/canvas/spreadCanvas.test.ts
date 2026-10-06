import { describe, expect, it } from 'vitest';

import { setupMockCanvas } from '../../util/test/mockCanvas';
import { HdpiCanvas } from './hdpiCanvas';
import { HdpiOffscreenCanvas } from './hdpiOffscreenCanvas';
import { getSpreadCanvas, releaseSpreadCanvas } from './spreadCanvas';

type Layer = HdpiCanvas | HdpiOffscreenCanvas;

describe('spread scratch canvases', () => {
    setupMockCanvas();

    const layers: [string, () => Layer][] = [
        [
            'HdpiCanvas',
            () =>
                new HdpiCanvas({
                    canvasElement: document.createElement('canvas'),
                    width: 200,
                    height: 100,
                    pixelRatio: 1,
                }),
        ],
        ['HdpiOffscreenCanvas', () => new HdpiOffscreenCanvas({ width: 200, height: 100, pixelRatio: 1 })],
    ];

    describe('getSpreadCanvas', () => {
        const ctx = {};

        it('should reuse the canvas for a context and size class', () => {
            const first = getSpreadCanvas(ctx, 30, 20, 200, 100);
            // 30 x 20 and 50 x 40 both fall in the 64 x 64 class, which is the smallest.
            expect(first.canvas.width).toBe(64);
            expect(first.canvas.height).toBe(64);
            expect(getSpreadCanvas(ctx, 50, 40, 200, 100)).toBe(first);
            releaseSpreadCanvas(ctx);
        });

        it('should give each context its own canvas', () => {
            const other = {};
            expect(getSpreadCanvas(ctx, 30, 20, 200, 100)).not.toBe(getSpreadCanvas(other, 30, 20, 200, 100));
            releaseSpreadCanvas(ctx);
            releaseSpreadCanvas(other);
        });

        it('should cap the size class at the layer size', () => {
            const { canvas } = getSpreadCanvas(ctx, 150, 90, 200, 100);
            // 150 x 90 would round up to 256 x 128, but the layer is only 200 x 100.
            expect(canvas.width).toBe(200);
            expect(canvas.height).toBe(100);
            releaseSpreadCanvas(ctx);
        });
    });

    describe('releaseSpreadCanvas', () => {
        it('should empty every canvas of the context and make the next request create a new one', () => {
            const ctx = {};
            const small = getSpreadCanvas(ctx, 30, 20, 200, 100);
            const large = getSpreadCanvas(ctx, 150, 90, 200, 100);
            expect(small.canvas).not.toBe(large.canvas);

            releaseSpreadCanvas(ctx);
            for (const { canvas } of [small, large]) {
                expect(canvas.width).toBe(0);
                expect(canvas.height).toBe(0);
            }
            expect(getSpreadCanvas(ctx, 30, 20, 200, 100)).not.toBe(small);
            releaseSpreadCanvas(ctx);
        });

        it('should ignore a context that has none', () => {
            expect(() => releaseSpreadCanvas({})).not.toThrow();
        });
    });

    describe.each(layers)('%s resize', (_name, createLayer) => {
        it('should release the scratch canvases when the layer size changes', () => {
            const layer = createLayer();
            const small = getSpreadCanvas(layer.context, 30, 20, 200, 100);
            // As large as the layer, so its size class is the layer size, which would otherwise be kept per size.
            const layerSized = getSpreadCanvas(layer.context, 150, 90, 200, 100);

            layer.resize(300, 150, 1);
            for (const { canvas } of [small, layerSized]) {
                expect(canvas.width).toBe(0);
                expect(canvas.height).toBe(0);
            }

            const resized = getSpreadCanvas(layer.context, 290, 140, 300, 150);
            expect(resized).not.toBe(layerSized);
            expect(resized.canvas.width).toBe(300);
            expect(resized.canvas.height).toBe(150);
        });

        it('should not keep the canvases of each size the layer has been resized to', () => {
            const layer = createLayer();
            const seen: OffscreenCanvas[] = [];
            for (const width of [220, 240, 260, 280]) {
                layer.resize(width, 100, 1);
                seen.push(getSpreadCanvas(layer.context, width - 10, 90, width, 100).canvas);
            }

            // Only the one for the current size is left.
            expect(seen.map((canvas) => canvas.width)).toEqual([0, 0, 0, 280]);
        });

        it('should release the scratch canvases when only the pixel ratio changes', () => {
            const layer = createLayer();
            const { canvas } = getSpreadCanvas(layer.context, 150, 90, 200, 100);

            layer.resize(200, 100, 2);
            expect(canvas.width).toBe(0);
        });

        it('should keep the scratch canvases when the size is unchanged', () => {
            const layer = createLayer();
            const scratch = getSpreadCanvas(layer.context, 150, 90, 200, 100);

            layer.resize(200, 100, 1);
            expect(scratch.canvas.width).toBe(200);
            expect(getSpreadCanvas(layer.context, 150, 90, 200, 100)).toBe(scratch);
        });

        it('should release the scratch canvases when the layer is destroyed', () => {
            const layer = createLayer();
            const { canvas } = getSpreadCanvas(layer.context, 150, 90, 200, 100);

            layer.destroy();
            expect(canvas.width).toBe(0);
        });
    });
});
