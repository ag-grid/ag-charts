import { describe, expect, it } from '@jest/globals';
import { extractImageData, setupMockCanvas } from '../../chart/test/utils';
import { DropShadow } from '../dropShadow';
import { Rect } from './rect';

describe('Rect', () => {
    describe('rendering', () => {
        const canvasCtx = setupMockCanvas();

        const shadowFn = (offset: number) => Object.assign(new DropShadow(), { xOffset: offset, yOffset: offset });

        const GAP = 20;
        const DEFAULTS: Partial<Rect> = { width: 20, height: 20 };
        const STROKE_WIDTH_CASES = [0, 3, 8, 10, 20, 25, 36, 44];
        const STROKE_TC_PARAMS = {
            crisp: true,
            stroke: 'red',
            fill: 'yellow',
        };
        const TEST_CASES: (Partial<Rect> | undefined)[][] = [
            // Stroke-width cases.
            STROKE_WIDTH_CASES.map((strokeWidth) => ({
                height: 40,
                strokeWidth,
                ...STROKE_TC_PARAMS,
            })),
            STROKE_WIDTH_CASES.map((strokeWidth) => ({
                width: 40,
                strokeWidth,
                ...STROKE_TC_PARAMS,
            })),
            STROKE_WIDTH_CASES.map((strokeWidth) => ({
                height: 40,
                strokeWidth,
                lineDash: [5, 10],
                ...STROKE_TC_PARAMS,
            })),
            STROKE_WIDTH_CASES.map((strokeWidth) => ({
                width: 40,
                strokeWidth,
                lineDash: [5, 10],
                ...STROKE_TC_PARAMS,
            })),
            [
                // Shadow cases.
                { fillShadow: shadowFn(5), strokeWidth: 3, stroke: 'yellow', fill: 'blue' },
                { fillShadow: shadowFn(10), strokeWidth: 3, stroke: 'yellow', fill: 'blue' },
                { fillShadow: shadowFn(15), strokeWidth: 3, stroke: 'yellow', fill: 'blue' },
                // Line dash cases.
                { lineDash: [2, 4], strokeWidth: 3, stroke: 'yellow', fill: 'blue' },
                // Opacity cases.
                { opacity: 0.5, strokeWidth: 3, stroke: 'yellow', fill: 'blue' },
                { fillOpacity: 0.5, strokeWidth: 3, stroke: 'yellow', fill: 'blue' },
                { strokeOpacity: 0.5, strokeWidth: 3, stroke: 'yellow', fill: 'blue' },
            ],
            [
                // Gradient cases.
                { width: 40, height: 40, crisp: true, fill: 'linear-gradient(180deg, #000000, #ff0000, #ffff00)' },
                { width: 40, height: 40, crisp: true, fill: 'linear-gradient(90deg, #00FF00, white, rgb(255, 0, 0))' },
            ],
            [
                // Gradient rotation
                { width: 40, height: 80, crisp: true, fill: 'linear-gradient(0deg, white, black)' },
                { width: 40, height: 80, crisp: true, fill: 'linear-gradient(45deg, white, black)' },
                { width: 40, height: 80, crisp: true, fill: 'linear-gradient(90deg, white, black)' },
                { width: 40, height: 80, crisp: true, fill: 'linear-gradient(135deg, white, black)' },
                { width: 40, height: 80, crisp: true, fill: 'linear-gradient(180deg, white, black)' },
                { width: 40, height: 80, crisp: true, fill: 'linear-gradient(225deg, white, black)' },
                { width: 40, height: 80, crisp: true, fill: 'linear-gradient(270deg, white, black)' },
                { width: 40, height: 80, crisp: true, fill: 'linear-gradient(315deg, white, black)' },
                { width: 40, height: 80, crisp: true, fill: 'linear-gradient(360deg, white, black)' },
                { width: 40, height: 80, crisp: true, fill: 'linear-gradient(-45deg, white, black)' },
                { width: 40, height: 80, crisp: true, fill: 'linear-gradient(-90deg, white, black)' },
                { width: 40, height: 80, crisp: true, fill: 'linear-gradient(-180deg, white, black)' },
                { width: 40, height: 80, crisp: true, fill: 'linear-gradient(-270deg, white, black)' },
            ],
            // GO FOR IT!
            [{}, { lineDash: [5, 5] }, { opacity: 0.5 }].map((mixin) => ({
                fillShadow: shadowFn(10),
                gradient: true,
                width: 40,
                height: 40,
                crisp: true,
                fill: 'blue',
                strokeWidth: 3,
                stroke: 'yellow',
                ...mixin,
            })),
            (() => {
                const results: Array<Partial<Rect>> = [];
                const thicknesses = [1, 0.5, 0.25, 0.125];
                const strokeWidths = [1, 0];
                const sizeProps: Array<Array<keyof Rect>> = [
                    ['width', 'height'],
                    ['height', 'width'],
                ];
                sizeProps.forEach(([thinProp, thickProp]) => {
                    strokeWidths.forEach((strokeWidth) => {
                        thicknesses.forEach((thickness) => {
                            results.push({
                                [thinProp]: thickness,
                                [thickProp]: 40,
                                strokeWidth,
                                stroke: 'black',
                                fill: 'red',
                                crisp: true,
                            });
                        });
                    });
                });
                return results;
            })(),
        ];

        it('should render as expected', () => {
            const ctx = canvasCtx.nodeCanvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 0, canvasCtx.nodeCanvas.height ?? 0);

            let currY = 0;
            let rowHeight = 0;
            for (const testCaseRow of TEST_CASES) {
                let currX = GAP;
                currY = currY + rowHeight + GAP;
                rowHeight = 0;

                for (const testCase of testCaseRow) {
                    const rect = Object.assign(new Rect(), { ...DEFAULTS }, testCase);

                    // Position Rect.
                    rect.x = currX;
                    rect.y = currY;

                    // Render.
                    ctx.save();
                    rect.render({ ctx, forceRender: true, resized: false, debugNodes: {} });
                    ctx.restore();

                    // Prepare for next case.
                    currX += rect.width + GAP;
                    rowHeight = Math.max(rect.height, rowHeight);
                }
            }

            // Check rendering.
            const imageData = extractImageData(canvasCtx);
            expect(imageData).toMatchImageSnapshot();
        });
    });
});
