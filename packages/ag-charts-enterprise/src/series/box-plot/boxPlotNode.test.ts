import { describe, expect, it } from 'vitest';

import { setupMockCanvas } from 'ag-charts-community-test';

import {
    RED_SHADOW,
    allWhite,
    blackColumns,
    leftEdgeIsWhite,
    pixelAt,
    renderNode,
    renderShadowBatch,
} from '../../test/utils';
import { BoxPlotNode } from './boxPlotNode';

const boxPlot = (mixin: Partial<BoxPlotNode>) => {
    const node = new BoxPlotNode();
    Object.assign(node, {
        horizontal: true,
        center: 110,
        thickness: 60,
        min: 150,
        q1: 200,
        median: 240,
        q3: 280,
        max: 360,
        fill: 'black',
        stroke: 'black',
        strokeWidth: 4,
        crisp: false,
        fillShadow: RED_SHADOW,
        ...mixin,
    });
    return node;
};

describe('BoxPlotNode', () => {
    describe('silhouette shadow', () => {
        const canvasCtx = setupMockCanvas({ width: 400, height: 220 });

        const verticalWhiskers = (spread?: number) =>
            boxPlot({
                horizontal: false,
                min: 20,
                q1: 70,
                median: 100,
                q3: 130,
                max: 190,
                wickStroke: 'rgb(0, 0, 0)',
                wickStrokeWidth: 2,
                fillShadow: { ...RED_SHADOW, spread },
            });

        it('should not leave a copy of separately styled whiskers at the left edge of a horizontal box plot', () => {
            const node = boxPlot({ wickStrokeWidth: 2 });
            renderNode(canvasCtx, node);

            expect(node['wickPath'].isEmpty()).toBe(false);
            const columns = blackColumns(canvasCtx);
            // The 2px caps are centred on the whisker ends, so they take the column on either side.
            expect(columns[0]).toBe(149);
            expect(columns.at(-1)).toBe(360);
        });

        it('should not leave a copy of whiskers wider than the box stroke at the left edge', () => {
            const node = boxPlot({ strokeWidth: 2, wickStrokeWidth: 20 });
            renderNode(canvasCtx, node);

            // The caps are 20px wide, so they reach 10px past the whisker ends at 150 and 360.
            expect(node['wickPath'].isEmpty()).toBe(false);
            const columns = blackColumns(canvasCtx);
            expect(columns[0]).toBe(140);
            expect(columns.at(-1)).toBe(369);
        });

        it('should draw the same pixels as a box plot whose whiskers share the box style', () => {
            renderNode(canvasCtx, boxPlot({}));
            const shared = blackColumns(canvasCtx);

            // Same colour in a different spelling, so the whiskers take the separate path but look the same.
            const separate = boxPlot({ wickStroke: 'rgb(0, 0, 0)' });
            renderNode(canvasCtx, separate);
            expect(separate['wickPath'].isEmpty()).toBe(false);
            expect(blackColumns(canvasCtx)).toEqual(shared);
            expect(shared[0]).toBeGreaterThanOrEqual(148);
        });

        it('should cast a shadow beside a separately styled whisker', () => {
            const node = boxPlot({
                horizontal: false,
                min: 20,
                q1: 70,
                median: 100,
                q3: 130,
                max: 190,
                wickStroke: 'rgb(0, 0, 0)',
                fillShadow: { ...RED_SHADOW, xOffset: 100 },
            });
            renderNode(canvasCtx, node);

            expect(node['wickPath'].isEmpty()).toBe(false);
            // The lower whisker runs from 20 to 70 at x = 110, so its shadow lands at x = 210, clear of the box shadow.
            expect(pixelAt(canvasCtx, 210, 45)).toEqual([255, 0, 0, 255]);
        });

        it('should grow the shadow of a separately styled whisker by the spread', () => {
            renderNode(canvasCtx, verticalWhiskers());
            // The lower whisker is 2px wide at x = 110, so without a spread its shadow hides behind it.
            expect(pixelAt(canvasCtx, 117, 45)).toEqual([255, 255, 255, 255]);

            renderNode(canvasCtx, verticalWhiskers(10));
            // With a spread of 10 the whisker's shadow is 22px wide: 99 to 121.
            expect(pixelAt(canvasCtx, 117, 45)).toEqual([255, 0, 0, 255]);
            expect(pixelAt(canvasCtx, 125, 45)).toEqual([255, 255, 255, 255]);
        });

        it('should spread the shadow past the ends of a whisker by the spread', () => {
            renderNode(canvasCtx, verticalWhiskers());
            // The whiskers end at 20 and 190, and without a spread their shadows hide behind them.
            expect(pixelAt(canvasCtx, 110, 15)).toEqual([255, 255, 255, 255]);
            expect(pixelAt(canvasCtx, 110, 195)).toEqual([255, 255, 255, 255]);

            renderNode(canvasCtx, verticalWhiskers(10));
            // The whiskers have butt caps, but their shadows still reach `spread` past each end, and no further.
            for (const y of [10, 14, 18, 191, 195, 199]) {
                expect(pixelAt(canvasCtx, 110, y)).toEqual([255, 0, 0, 255]);
            }
            for (const y of [5, 205]) {
                expect(pixelAt(canvasCtx, 110, y)).toEqual([255, 255, 255, 255]);
            }
        });

        it.each([
            ['a whisker stroke opacity of 0', { wickStrokeOpacity: 0 }],
            ['a whisker stroke width of 0', { wickStrokeWidth: 0 }],
        ])('should cast no shadow from a whisker with %s, with or without a spread', (_, hidden) => {
            for (const spread of [undefined, 10]) {
                const node = verticalWhiskers(spread);
                Object.assign(node, hidden);
                renderNode(canvasCtx, node);

                // Where the visible whisker's shadow lands, and past its end: a hidden whisker casts none.
                for (const [x, y] of [
                    [110, 45],
                    [117, 45],
                    [110, 15],
                    [110, 195],
                ]) {
                    expect(pixelAt(canvasCtx, x, y)).toEqual([255, 255, 255, 255]);
                }
            }
        });

        it('should cast no shadow from a box plot that is fully transparent, with or without a spread', () => {
            for (const spread of [undefined, 10]) {
                const node = verticalWhiskers(spread);
                // As the series styles an item at `opacity: 0`.
                Object.assign(node, { fillOpacity: 0, strokeOpacity: 0, wickStrokeOpacity: 0, opacity: 0 });
                renderNode(canvasCtx, node);

                expect(allWhite(canvasCtx)).toBe(true);
            }
        });

        it('should not leave a sliver on the left edge for a crisp horizontal box plot with a hard shadow', () => {
            const node = boxPlot({
                crisp: true,
                strokeWidth: 1,
                strokeAlignment: 0.5,
                wickStrokeWidth: 1,
                wickStrokeAlignment: 1,
                max: 360.5,
            });
            renderNode(canvasCtx, node);

            expect(leftEdgeIsWhite(canvasCtx)).toBe(true);
        });
    });

    describe('batched shadow', () => {
        const canvasCtx = setupMockCanvas({ width: 400, height: 220 });

        const whiskers = (center: number, mixin: Partial<BoxPlotNode>) =>
            boxPlot({
                horizontal: false,
                center,
                thickness: 40,
                min: 20,
                q1: 70,
                median: 100,
                q3: 130,
                max: 190,
                wickStroke: 'rgb(0, 0, 0)',
                wickStrokeWidth: 2,
                ...mixin,
            });

        it('should cast the shadow of a translucent whisker once', () => {
            const style = { wickStrokeOpacity: 0.5, fillShadow: { ...RED_SHADOW, xOffset: 20 } };
            renderNode(canvasCtx, whiskers(100, style));
            const unbatched = pixelAt(canvasCtx, 120, 40);

            renderShadowBatch(canvasCtx, [whiskers(100, style), whiskers(250, style)]);

            // Drawn twice into the mask, the whisker would cast a shadow of 0.75 rather than 0.5.
            expect(unbatched).not.toEqual([255, 255, 255, 255]);
            expect(pixelAt(canvasCtx, 120, 40)).toEqual(unbatched);
            expect(pixelAt(canvasCtx, 270, 40)).toEqual(unbatched);
        });

        it('should spread the shadow of a whisker with its own colour when the body stroke is transparent', () => {
            const style = { fill: 'none', stroke: 'transparent', fillShadow: { ...RED_SHADOW, spread: 10 } };
            renderShadowBatch(canvasCtx, [whiskers(100, style), whiskers(250, style)]);

            for (const x of [100, 250]) {
                for (const y of [10, 14, 18]) {
                    expect(pixelAt(canvasCtx, x, y)).toEqual([255, 0, 0, 255]);
                }
                expect(pixelAt(canvasCtx, x, 5)).toEqual([255, 255, 255, 255]);
            }
        });
    });

    describe.each([0.5, 1, 2, 3])('silhouette shadow at a device pixel ratio of %s', (pixelRatio) => {
        const canvasCtx = setupMockCanvas({ width: 400 * pixelRatio, height: 220 * pixelRatio });

        it('should not leave a sliver on the left edge for a crisp box plot with theme default strokes', () => {
            const node = boxPlot({
                max: 360.5,
                strokeAlignment: 1,
                wickStrokeWidth: 2,
                wickStrokeAlignment: 2,
                strokeWidth: 2,
                crisp: true,
            });
            renderNode(canvasCtx, node, pixelRatio);

            expect(leftEdgeIsWhite(canvasCtx, 4)).toBe(true);
        });

        it('should not leave a copy of spread whiskers on the left edge', () => {
            const node = boxPlot({
                wickStrokeWidth: 2,
                wickStroke: 'rgb(0, 0, 0)',
                fillShadow: { ...RED_SHADOW, spread: 40 },
            });
            renderNode(canvasCtx, node, pixelRatio);

            expect(node['wickPath'].isEmpty()).toBe(false);
            // The shadow reaches 40px past the whisker end at 150, so everything left of 110 is untouched.
            expect(leftEdgeIsWhite(canvasCtx, 100 * pixelRatio)).toBe(true);
        });

        it('should not leave a sliver on the left edge for a crisp vertical box plot without a stroke', () => {
            const node = boxPlot({
                horizontal: false,
                crisp: true,
                strokeWidth: 0,
                center: 100.5,
                thickness: 5,
                min: 20,
                q1: 70,
                median: 100,
                q3: 130,
                max: 190,
                fillShadow: RED_SHADOW,
            });
            renderNode(canvasCtx, node, pixelRatio);

            expect(leftEdgeIsWhite(canvasCtx, 4)).toBe(true);
        });

        // The alignment snaps a whisker end outward at some ratios and inward at others, so try a few ends.
        it.each([360.5, 361, 363])(
            'should not leave a sliver on the left edge for a crisp box plot with a 1px round-joined stroke and max %s',
            (max) => {
                const node = boxPlot({
                    max,
                    strokeWidth: 1,
                    lineJoin: 'round',
                    wickStrokeWidth: 1,
                    crisp: true,
                });
                renderNode(canvasCtx, node, pixelRatio);

                expect(leftEdgeIsWhite(canvasCtx, 4)).toBe(true);
            }
        );
    });
});
