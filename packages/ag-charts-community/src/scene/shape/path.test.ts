import { describe, expect, it } from 'vitest';

import { extractImageData, setupMockCanvas } from '../../util/test/mockCanvas';
import { setupMockConsole } from '../../util/test/mockConsole';
import { DropShadow } from '../dropShadow';
import type { ExtendedPath2D } from '../extendedPath2D';
import { Path } from './path';

describe('Path', () => {
    setupMockConsole();

    describe('spread and stroke shadow rendering', () => {
        const canvasCtx = setupMockCanvas({ width: 720, height: 260 });

        const shadow = (props: Partial<DropShadow>) => new DropShadow().set(props);

        function buildStar(path: ExtendedPath2D, cx: number, cy: number, outer: number, inner: number, points: number) {
            for (let i = 0; i < points * 2; i += 1) {
                const radius = i % 2 === 0 ? outer : inner;
                const angle = (Math.PI * i) / points - Math.PI / 2;
                const x = cx + radius * Math.cos(angle);
                const y = cy + radius * Math.sin(angle);
                if (i === 0) {
                    path.moveTo(x, y);
                } else {
                    path.lineTo(x, y);
                }
            }
            path.closePath();
        }

        const CASES: Partial<Path>[] = [
            // Positive-spread fill shadow on arbitrary geometry (generic silhouette-fatten).
            {
                fill: 'blue',
                stroke: 'navy',
                strokeWidth: 2,
                fillShadow: shadow({ xOffset: 6, yOffset: 6, spread: 12 }),
            },
            // Negative spread — generic silhouette does not contract, so the shadow matches the shape.
            { fill: 'blue', fillShadow: shadow({ xOffset: 6, yOffset: 6, spread: -6 }) },
            // Stroke shadow with spread.
            {
                fill: 'none',
                stroke: 'blue',
                strokeWidth: 5,
                strokeShadow: shadow({ xOffset: 6, yOffset: 6, spread: 6 }),
            },
        ];

        it('should render as expected', () => {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 0, canvasCtx.nodeCanvas.height ?? 0);

            let currX = 110;
            for (const testCase of CASES) {
                const path = Object.assign(new Path(), testCase);
                buildStar(path.path, currX, 125, 55, 24, 5);

                const renderCtx = {
                    ctx,
                    direction: 'ltr' as const,
                    width: canvasCtx.nodeCanvas.width,
                    height: canvasCtx.nodeCanvas.height,
                    devicePixelRatio: 1,
                    debugNodes: {},
                };
                ctx.save();
                path.preRender(renderCtx);
                path.render(renderCtx);
                ctx.restore();

                currX += 220;
            }

            const imageData = extractImageData(canvasCtx);
            expect(imageData).toMatchImageSnapshot();
        });
    });
});
