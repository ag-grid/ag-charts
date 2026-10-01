import { describe, expect, it } from 'vitest';

import { setupMockCanvas } from 'ag-charts-community-test';
import { testLogger } from 'ag-charts-test';

import { BoxPlotNode } from './boxPlotNode';

describe('BoxPlotNode', () => {
    describe('silhouette shadow', () => {
        const canvasCtx = setupMockCanvas({ width: 400, height: 220 });

        const render = (node: BoxPlotNode) => {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width, canvasCtx.nodeCanvas.height);

            const renderCtx = {
                ctx,
                direction: 'ltr' as const,
                width: canvasCtx.nodeCanvas.width,
                height: canvasCtx.nodeCanvas.height,
                devicePixelRatio: 1,
                logger: testLogger,
                debugNodes: {},
            };
            ctx.save();
            node.preRender(renderCtx);
            node.render(renderCtx);
            ctx.restore();
            return ctx;
        };

        /** The device-pixel columns that hold at least one black pixel. */
        const blackColumns = () => {
            const { width, height } = canvasCtx.nodeCanvas;
            const { data } = canvasCtx.getRenderContext2D().getImageData(0, 0, width, height);
            const columns = new Set<number>();
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0 && data[i + 3] === 255) {
                    columns.add((i / 4) % width);
                }
            }
            return [...columns].sort((a, b) => a - b);
        };

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
                // No offset or blur, so the silhouette shadow is exactly the node's own pixels and nothing else.
                fillShadow: { enabled: true, color: 'rgba(255, 0, 0, 1)', xOffset: 0, yOffset: 0, blur: 0 },
                ...mixin,
            });
            return node;
        };

        it('should not leave a copy of separately styled whiskers at the left edge of a horizontal box plot', () => {
            const node = boxPlot({ wickStrokeWidth: 2 });
            render(node);

            // The whiskers run from 150 to 360 and are drawn once, in place. The extent that sizes the pre-pass has to
            // cover the whiskers as well as the box, or the off-canvas copy that casts their shadow lands on the canvas.
            expect(node['wickPath'].isEmpty()).toBe(false);
            const columns = blackColumns();
            expect(columns[0]).toBeGreaterThanOrEqual(148);
            expect(columns.at(-1)).toBeLessThanOrEqual(361);
        });

        it('should not leave a copy of whiskers wider than the box stroke at the left edge', () => {
            const node = boxPlot({ strokeWidth: 2, wickStrokeWidth: 20 });
            render(node);

            // The caps are 20px wide, so they reach 10px past the whisker ends at 150 and 360.
            expect(node['wickPath'].isEmpty()).toBe(false);
            const columns = blackColumns();
            expect(columns[0]).toBeGreaterThanOrEqual(139);
            expect(columns.at(-1)).toBeLessThanOrEqual(371);
        });

        it('should draw the same pixels as a box plot whose whiskers share the box style', () => {
            render(boxPlot({}));
            const shared = blackColumns();

            // Same colour in a different spelling, so the whiskers take the separate path but look the same.
            const separate = boxPlot({ wickStroke: 'rgb(0, 0, 0)' });
            render(separate);
            expect(separate['wickPath'].isEmpty()).toBe(false);
            expect(blackColumns()).toEqual(shared);
            expect(shared[0]).toBeGreaterThanOrEqual(148);
        });
    });
});
