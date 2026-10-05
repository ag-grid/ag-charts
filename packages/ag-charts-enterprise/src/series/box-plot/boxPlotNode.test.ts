import { describe, expect, it } from 'vitest';

import { setupMockCanvas } from 'ag-charts-community-test';

import { RED_SHADOW, blackColumns, leftEdgeIsWhite, pixelAt, renderNode } from '../../test/utils';
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

    describe.each([1, 2, 3])('silhouette shadow at a device pixel ratio of %i', (pixelRatio) => {
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
    });
});
