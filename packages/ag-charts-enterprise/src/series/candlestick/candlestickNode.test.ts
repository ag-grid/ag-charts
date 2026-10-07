import { describe, expect, it } from 'vitest';

import { setupMockCanvas } from 'ag-charts-community-test';

import { RED_SHADOW, allWhite, blackColumns, leftEdgeIsWhite, pixelAt, renderNode } from '../../test/utils';
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

        it('should spread the shadow past the ends of a wick by the spread', () => {
            const wicks = (spread?: number) =>
                candlestick({
                    wickStroke: 'black',
                    wickStrokeWidth: 2,
                    fillShadow: { ...RED_SHADOW, spread },
                });

            renderNode(canvasCtx, wicks());
            // The upper wick ends at 20 and the lower at 180, and without a spread their shadows hide behind them.
            expect(pixelAt(canvasCtx, 100, 15)).toEqual([255, 255, 255, 255]);
            expect(pixelAt(canvasCtx, 100, 185)).toEqual([255, 255, 255, 255]);

            renderNode(canvasCtx, wicks(10));
            // The wicks have butt caps, but their shadows still reach `spread` past each end, and no further.
            for (const y of [11, 15, 19, 180, 184, 188]) {
                expect(pixelAt(canvasCtx, 100, y)).toEqual([255, 0, 0, 255]);
            }
            for (const y of [5, 195]) {
                expect(pixelAt(canvasCtx, 100, y)).toEqual([255, 255, 255, 255]);
            }
        });

        it('should spread the shadow of visible wicks when the unfilled body has a transparent stroke', () => {
            const node = candlestick({
                fill: 'none',
                stroke: 'transparent',
                wickStroke: 'black',
                wickStrokeWidth: 2,
                fillShadow: { ...RED_SHADOW, spread: 10 },
            });
            renderNode(canvasCtx, node);

            // Only the wicks cast: the upper one ends at 20, and its shadow reaches 10 past that.
            expect(node['wickPath'].isEmpty()).toBe(false);
            for (const y of [11, 15, 19]) {
                expect(pixelAt(canvasCtx, 100, y)).toEqual([255, 0, 0, 255]);
            }
            expect(pixelAt(canvasCtx, 100, 5)).toEqual([255, 255, 255, 255]);
        });

        it('should not spread the shadow of wicks that share the body path and are not painted', () => {
            const node = candlestick({ strokeOpacity: 0, fillShadow: { ...RED_SHADOW, spread: 10 } });
            renderNode(canvasCtx, node);

            // The wicks are in the body's path, but with no stroke only the body is painted, so only it casts.
            expect(node['wickPath'].isEmpty()).toBe(true);
            for (const [x, y] of [
                [100, 15],
                [100, 185],
                [104, 50],
            ]) {
                expect(pixelAt(canvasCtx, x, y)).toEqual([255, 255, 255, 255]);
            }
            // Beside the body (80 to 120), its shadow does reach 10 past the edge.
            expect(pixelAt(canvasCtx, 100, 75)).toEqual([255, 0, 0, 255]);
        });

        it.each([
            ['a wick stroke opacity of 0', { wickStrokeOpacity: 0 }],
            ['a wick stroke width of 0', { wickStrokeWidth: 0 }],
        ])('should cast no shadow from a wick with %s, with or without a spread', (_, hidden) => {
            for (const spread of [undefined, 10]) {
                const node = candlestick({
                    wickStroke: 'black',
                    wickStrokeWidth: 2,
                    fillShadow: { ...RED_SHADOW, spread },
                });
                Object.assign(node, hidden);
                renderNode(canvasCtx, node);

                // The upper wick runs from 20 to 80 at x = 100: a hidden wick casts nothing on it or past its ends.
                for (const [x, y] of [
                    [100, 50],
                    [104, 50],
                    [100, 15],
                    [100, 185],
                ]) {
                    expect(pixelAt(canvasCtx, x, y)).toEqual([255, 255, 255, 255]);
                }
            }
        });

        it('should cast no shadow from a candlestick that is fully transparent, with or without a spread', () => {
            for (const spread of [undefined, 10]) {
                const node = candlestick({
                    wickStroke: 'black',
                    wickStrokeWidth: 2,
                    fillShadow: { ...RED_SHADOW, spread },
                });
                // As a series styles an item at `opacity: 0`.
                Object.assign(node, { fillOpacity: 0, strokeOpacity: 0, wickStrokeOpacity: 0, opacity: 0 });
                renderNode(canvasCtx, node);

                expect(allWhite(canvasCtx)).toBe(true);
            }
        });
    });

    describe.each([0.5, 0.6, 1, 2, 3])('silhouette shadow at a device pixel ratio of %s', (pixelRatio) => {
        const canvasCtx = setupMockCanvas({ width: 400 * pixelRatio, height: 220 * pixelRatio });

        it('should not leave a sliver on the left edge for a crisp candlestick without a stroke', () => {
            const node = candlestick({ crisp: true, strokeWidth: 0, centerX: 100.5, width: 5 });
            renderNode(canvasCtx, node, pixelRatio);

            expect(leftEdgeIsWhite(canvasCtx, 4)).toBe(true);
        });

        // The alignment snaps the body outward at some ratios and inward at others, so try a few centres.
        it.each([100.5, 101, 102.5, 103])(
            'should not leave a sliver on the left edge for a crisp candlestick with a 1px round-joined stroke at x %s',
            (centerX) => {
                const node = candlestick({ crisp: true, strokeWidth: 1, lineJoin: 'round', centerX, width: 5 });
                renderNode(canvasCtx, node, pixelRatio);

                expect(leftEdgeIsWhite(canvasCtx, 4)).toBe(true);
            }
        );
    });
});
