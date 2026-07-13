import { describe, expect, it } from 'vitest';

import { extractImageData, setupMockCanvas } from '../../util/test/mockCanvas';
import { setupMockConsole } from '../../util/test/mockConsole';
import { DropShadow } from '../dropShadow';
import { Line } from './line';

describe('Line', () => {
    setupMockConsole();

    describe('stroke shadow rendering', () => {
        const canvasCtx = setupMockCanvas({ width: 520, height: 240 });

        const shadow = (props: Partial<DropShadow>) => new DropShadow().set(props);

        const CASES: Partial<Line>[] = [
            // Stroke shadow, no spread.
            { stroke: 'blue', strokeWidth: 4, strokeShadow: shadow({ xOffset: 6, yOffset: 6 }) },
            // Stroke shadow with spread widens the cast.
            { stroke: 'blue', strokeWidth: 4, strokeShadow: shadow({ xOffset: 6, yOffset: 6, spread: 6 }) },
            // Round-capped thick line with spread.
            {
                stroke: 'blue',
                strokeWidth: 8,
                lineCap: 'round',
                strokeShadow: shadow({ xOffset: 6, yOffset: 6, spread: 4 }),
            },
        ];

        it('should render as expected', () => {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 0, canvasCtx.nodeCanvas.height ?? 0);

            let currX = 60;
            for (const testCase of CASES) {
                const line = Object.assign(new Line(), testCase);
                line.x1 = currX;
                line.y1 = 50;
                line.x2 = currX + 70;
                line.y2 = 180;

                const renderCtx = {
                    ctx,
                    direction: 'ltr' as const,
                    width: canvasCtx.nodeCanvas.width,
                    height: canvasCtx.nodeCanvas.height,
                    devicePixelRatio: 1,
                    debugNodes: {},
                };
                ctx.save();
                line.render(renderCtx);
                ctx.restore();

                currX += 150;
            }

            const imageData = extractImageData(canvasCtx);
            expect(imageData).toMatchImageSnapshot();
        });
    });
});
