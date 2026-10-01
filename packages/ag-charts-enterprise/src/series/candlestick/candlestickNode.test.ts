import { describe, expect, it } from 'vitest';

import { setupMockCanvas } from 'ag-charts-community-test';
import { testLogger } from 'ag-charts-test';

import { CandlestickNode } from './candlestickNode';

describe('CandlestickNode', () => {
    describe('silhouette shadow', () => {
        const canvasCtx = setupMockCanvas({ width: 400, height: 220 });

        const render = (node: CandlestickNode<unknown>) => {
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
                // No offset or blur, so the silhouette shadow is exactly the node's own pixels and nothing else.
                fillShadow: { enabled: true, color: 'rgba(255, 0, 0, 1)', xOffset: 0, yOffset: 0, blur: 0 },
                ...mixin,
            });
            return node;
        };

        it('should not leave a copy of a wick wider than the body stroke at the left edge', () => {
            const node = candlestick({ wickStroke: 'black', wickStrokeWidth: 12 });
            render(node);

            // The wick is 12px wide, so it reaches 3px past the 6px body on each side.
            expect(node['wickPath'].isEmpty()).toBe(false);
            const columns = blackColumns();
            expect(columns[0]).toBeGreaterThanOrEqual(93);
            expect(columns.at(-1)).toBeLessThanOrEqual(106);
        });
    });
});
