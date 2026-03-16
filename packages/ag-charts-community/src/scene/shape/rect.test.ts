import { describe, expect, it } from '@jest/globals';

import { extractImageData, setupMockCanvas } from '../../util/test/mockCanvas';
import { setupMockConsole } from '../../util/test/mockConsole';
import { BBox } from '../bbox';
import { DropShadow } from '../dropShadow';
import { Rect } from './rect';

describe('Rect', () => {
    setupMockConsole();

    describe('rendering', () => {
        const canvasCtx = setupMockCanvas({ height: 1000 });

        const shadowFn = (offset: number) => new DropShadow().set({ xOffset: offset, yOffset: offset });

        const GAP = 20;
        const DEFAULTS: Partial<Rect> = { width: 20, height: 20 };
        const STROKE_WIDTH_CASES = [0, 3, 8, 10, 20, 25, 36, 44];
        const STROKE_TC_PARAMS = {
            crisp: true,
            stroke: 'red',
            fill: 'yellow',
        };
        const CORNER_RADIUS_CASES = [0, 1, 2, 3, 5, 10, 15];
        const CORNER_RADIUS_TC_PARAMS = {
            ...DEFAULTS,
            stroke: 'blue',
            fill: 'cyan',
            strokeWidth: 1,
        };

        const colorStops = [
            {
                color: 'white',
            },
            {
                color: 'black',
            },
        ];

        const CLIP_BBOX_CASES = [
            { x: 0, y: 0, width: 60, height: 60, clipBBox: new BBox(0, 0, 50, 50) },
            { x: -10, y: 0, width: 60, height: 60, clipBBox: new BBox(0, 0, 50, 50) },
            { x: -10, y: -10, width: 60, height: 60, clipBBox: new BBox(0, 0, 50, 50) },
            { x: 0, y: -10, width: 60, height: 60, clipBBox: new BBox(0, 0, 50, 50) },
            { x: -5, y: 0, width: 60, height: 60, clipBBox: new BBox(0, 0, 50, 50) },
            { x: -10, y: -5, width: 60, height: 60, clipBBox: new BBox(0, 0, 50, 50) },
            { x: -5, y: -10, width: 60, height: 60, clipBBox: new BBox(0, 0, 50, 50) },
            { x: 0, y: -5, width: 60, height: 60, clipBBox: new BBox(0, 0, 50, 50) },
        ];
        const CORNER_RADIUS_BBOX_TC_PARAMS = {
            stroke: 'green',
            fill: 'lime',
            width: 50,
            height: 50,
            strokeWidth: 1,
            cornerRadius: 20,
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
            CORNER_RADIUS_CASES.map((cornerRadius) => ({
                cornerRadius,
                ...CORNER_RADIUS_TC_PARAMS,
            })),
            CLIP_BBOX_CASES.map((params) => ({ ...CORNER_RADIUS_BBOX_TC_PARAMS, ...params })),
            [
                { x: 0, y: 0, width: 100, height: 40, cornerRadius: 100, clipBBox: new BBox(0, 0, 10, 10) },
                { x: -90, y: 0, width: 100, height: 40, cornerRadius: 100, clipBBox: new BBox(0, 0, 10, 10) },
                { x: 0, y: 0, width: 40, height: 100, cornerRadius: 100, clipBBox: new BBox(0, 0, 10, 10) },
                { x: 0, y: -90, width: 40, height: 100, cornerRadius: 100, clipBBox: new BBox(0, 0, 10, 10) },
                { x: 0, y: 0, width: 100, height: 40, cornerRadius: 100, clipBBox: new BBox(0, 0, 10, 40) },
                { x: -90, y: 0, width: 100, height: 40, cornerRadius: 100, clipBBox: new BBox(0, 0, 10, 40) },
                { x: 0, y: 0, width: 40, height: 100, cornerRadius: 100, clipBBox: new BBox(0, 0, 40, 10) },
                { x: 0, y: -90, width: 40, height: 100, cornerRadius: 100, clipBBox: new BBox(0, 0, 40, 10) },
            ],
            [],
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
                {
                    width: 40,
                    height: 40,
                    crisp: true,
                    fill: {
                        type: 'gradient',
                        rotation: 180,
                        colorStops: [
                            {
                                color: '#000000',
                            },
                            {
                                color: '#ff0000',
                            },
                            {
                                color: '#ffff00',
                            },
                        ],
                    },
                },
                {
                    width: 40,
                    height: 40,
                    crisp: true,
                    fill: {
                        type: 'gradient',
                        rotation: 90,
                        colorStops: [
                            {
                                color: '#00FF00',
                            },

                            {
                                color: 'white',
                            },
                            {
                                color: 'rgb(255, 0, 0)',
                            },
                        ],
                    },
                },
            ],
            [
                // Gradient rotation
                {
                    width: 40,
                    height: 80,
                    crisp: true,
                    fill: {
                        type: 'gradient',
                        rotation: 0,
                        colorStops,
                    },
                },
                {
                    width: 40,
                    height: 80,
                    crisp: true,
                    fill: {
                        type: 'gradient',
                        rotation: 45,
                        colorStops,
                    },
                },
                {
                    width: 40,
                    height: 80,
                    crisp: true,
                    fill: {
                        type: 'gradient',
                        rotation: 90,
                        colorStops,
                    },
                },
                {
                    width: 40,
                    height: 80,
                    crisp: true,
                    fill: {
                        type: 'gradient',
                        rotation: 135,
                        colorStops,
                    },
                },
                {
                    width: 40,
                    height: 80,
                    crisp: true,
                    fill: {
                        type: 'gradient',
                        rotation: 180,
                        colorStops,
                    },
                },
                {
                    width: 40,
                    height: 80,
                    crisp: true,
                    fill: {
                        type: 'gradient',
                        rotation: 225,
                        colorStops,
                    },
                },
                {
                    width: 40,
                    height: 80,
                    crisp: true,
                    fill: {
                        type: 'gradient',
                        rotation: 270,
                        colorStops,
                    },
                },
                {
                    width: 40,
                    height: 80,
                    crisp: true,
                    fill: {
                        type: 'gradient',
                        rotation: 315,
                        colorStops,
                    },
                },
                {
                    width: 40,
                    height: 80,
                    crisp: true,
                    fill: {
                        type: 'gradient',
                        rotation: 360,
                        colorStops,
                    },
                },
                {
                    width: 40,
                    height: 80,
                    crisp: true,
                    fill: {
                        type: 'gradient',
                        rotation: -45,
                        colorStops,
                    },
                },
                {
                    width: 40,
                    height: 80,
                    crisp: true,
                    fill: {
                        type: 'gradient',
                        rotation: -90,
                        colorStops,
                    },
                },
                {
                    width: 40,
                    height: 80,
                    crisp: true,
                    fill: {
                        type: 'gradient',
                        rotation: -180,
                        colorStops,
                    },
                },
                {
                    width: 40,
                    height: 80,
                    crisp: true,
                    fill: {
                        type: 'gradient',
                        rotation: -270,
                        colorStops,
                    },
                },
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
                for (const [thinProp, thickProp] of sizeProps) {
                    for (const strokeWidth of strokeWidths) {
                        for (const thickness of thicknesses) {
                            results.push({
                                [thinProp]: thickness,
                                [thickProp]: 40,
                                strokeWidth,
                                stroke: 'black',
                                fill: 'red',
                                crisp: true,
                            });
                        }
                    }
                }
                return results;
            })(),
        ];

        it('should render as expected', () => {
            const ctx = canvasCtx.getRenderContext2D();
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
                    rect.x = (rect.x ?? 0) + currX;
                    rect.y = (rect.y ?? 0) + currY;

                    if (rect.clipBBox != null) {
                        rect.clipBBox.x += currX;
                        rect.clipBBox.y += currY;
                    }

                    // Render.
                    const renderCtx = {
                        ctx,
                        direction: 'ltr' as const,
                        width: canvasCtx.nodeCanvas.width,
                        height: canvasCtx.nodeCanvas.height,
                        devicePixelRatio: 1,
                        debugNodes: {},
                    };
                    ctx.save();
                    rect.preRender(renderCtx);
                    rect.render(renderCtx);
                    ctx.restore();

                    // Prepare for next case.
                    currX += (rect.clipBBox?.width ?? rect.width) + GAP;
                    rowHeight = Math.max(rect.clipBBox?.height ?? rect.height, rowHeight);
                }
            }

            // Check rendering.
            const imageData = extractImageData(canvasCtx);
            expect(imageData).toMatchImageSnapshot();
        });
    });
});
