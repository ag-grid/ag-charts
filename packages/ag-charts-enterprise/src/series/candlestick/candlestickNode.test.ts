import { describe, expect, it } from 'vitest';

import { setupMockCanvas } from 'ag-charts-community-test';

import { RED_SHADOW, blackColumns, leftEdgeIsWhite, pixelAt, renderNode } from '../../test/utils';
import { CandlestickNode } from './candlestickNode';

const candlestick = (mixin: Partial<CandlestickNode<unknown>>) => {
    const node = new CandlestickNode<unknown>();
    Object.assign(node, {
        centerX: 100,
        width: 6,
        y: 20,
        height: 160,
        yOpen: 80,
        yClose: 120,
        fill: 'black',
        stroke: 'black',
        strokeWidth: 1,
        crisp: false,
        fillShadow: RED_SHADOW,
        ...mixin,
    });
    return node;
};

describe('CandlestickNode', () => {
    describe('silhouette shadow', () => {
        const canvasCtx = setupMockCanvas({ width: 400, height: 220 });

        it('should not leave a copy of a wick wider than the body stroke at the left edge', () => {
            const node = candlestick({ wickStroke: 'black', wickStrokeWidth: 12 });
            renderNode(canvasCtx, node);

            // The wick is 12px wide, so it reaches 3px past the 6px body on each side.
            expect(node['wickPath'].isEmpty()).toBe(false);
            const columns = blackColumns(canvasCtx);
            expect(columns[0]).toBe(94);
            expect(columns.at(-1)).toBe(105);
        });

        it('should cast a shadow beside a separately styled wick', () => {
            const node = candlestick({
                wickStroke: 'black',
                wickStrokeWidth: 2,
                fillShadow: { ...RED_SHADOW, xOffset: 20 },
            });
            renderNode(canvasCtx, node);

            expect(node['wickPath'].isEmpty()).toBe(false);
            // The upper wick runs from 20 to 80 at x = 100, so its shadow lands at x = 120, above the body shadow.
            expect(pixelAt(canvasCtx, 120, 50)).toEqual([255, 0, 0, 255]);
        });
    });

    describe.each([1, 2, 3])('silhouette shadow at a device pixel ratio of %i', (pixelRatio) => {
        const canvasCtx = setupMockCanvas({ width: 400 * pixelRatio, height: 220 * pixelRatio });

        it('should not leave a sliver on the left edge for a crisp candlestick without a stroke', () => {
            const node = candlestick({ crisp: true, strokeWidth: 0, centerX: 100.5, width: 5 });
            renderNode(canvasCtx, node, pixelRatio);

            expect(leftEdgeIsWhite(canvasCtx, 4)).toBe(true);
        });
    });
});
