import { describe, expect, it } from '@jest/globals';

import { AgPatternName } from 'ag-charts-types';

import { extractImageData, setupMockCanvas } from '../../util/test/mockCanvas';
import { Rect } from './rect';

describe('Shape', () => {
    describe('rendering fills', () => {
        const canvasCtx = setupMockCanvas({ width: 1000, height: 1000 });

        const GAP = 20;
        const DEFAULTS: Partial<Rect> = { width: 230, height: 230 };

        const patternDefaults = {
            width: 30,
            height: 30,
        };

        const STOCK_PATTERN_CASES: (Partial<Rect> | undefined)[][] = [
            (
                [
                    'vertical-lines',
                    'horizontal-lines',
                    'forward-slanted-lines',
                    'backward-slanted-lines',
                ] as AgPatternName[]
            ).map((pattern) => ({
                fill: {
                    ...patternDefaults,
                    type: 'pattern',
                    pattern,
                },
            })),
            (['circles', 'squares', 'triangles', 'diamonds'] as AgPatternName[]).map((pattern) => ({
                fill: {
                    ...patternDefaults,
                    type: 'pattern',
                    pattern,
                },
            })),
            (['stars', 'hearts', 'crosses'] as AgPatternName[]).map((pattern) => ({
                fill: {
                    ...patternDefaults,
                    type: 'pattern',
                    pattern,
                },
            })),
        ];

        const STOCK_PATTERN_CONFIGURED_DIMENSIONS_CASES: (Partial<Rect> | undefined)[][] = [
            (['circles', 'squares', 'triangles', 'diamonds'] as AgPatternName[]).map((pattern) => ({
                fill: {
                    ...patternDefaults,
                    type: 'pattern',
                    pattern,
                    fill: 'blue',
                    backgroundFill: 'yellow',
                    stroke: 'orange',
                    width: 2,
                    height: 2,
                },
            })),
            (['stars', 'hearts', 'crosses'] as AgPatternName[]).map((pattern) => ({
                fill: {
                    ...patternDefaults,
                    type: 'pattern',
                    pattern,
                    fill: 'blue',
                    backgroundFill: 'yellow',
                    stroke: 'orange',
                    width: 2,
                    height: 2,
                },
            })),
            (['circles', 'squares', 'triangles', 'diamonds'] as AgPatternName[]).map((pattern) => ({
                fill: {
                    ...patternDefaults,
                    type: 'pattern',
                    pattern,
                    fill: 'blue',
                    backgroundFill: 'yellow',
                    stroke: 'orange',
                    width: 30,
                    height: 30,
                    padding: 5,
                },
            })),
            (['stars', 'hearts', 'crosses'] as AgPatternName[]).map((pattern) => ({
                fill: {
                    ...patternDefaults,
                    type: 'pattern',
                    pattern,
                    fill: 'blue',
                    backgroundFill: 'yellow',
                    stroke: 'orange',
                    width: 30,
                    height: 30,
                    padding: 5,
                },
            })),
        ];

        const CUSTOMISED_PATTERN_CASES: (Partial<Rect> | undefined)[][] = [
            [
                {
                    width: 460,
                    height: 460,
                    fill: {
                        type: 'pattern',
                        pattern: 'circles',
                        backgroundFill: 'green',
                        backgroundFillOpacity: 0.1,
                        fill: 'black',
                        fillOpacity: 0.5,
                        stroke: 'red',
                        strokeWidth: 5,
                        strokeOpacity: 0.2,
                        width: 30,
                        height: 30,
                    },
                },
                {
                    // strokeWidth 0 case
                    width: 460,
                    height: 460,
                    fill: {
                        type: 'pattern',
                        pattern: 'circles',
                        backgroundFill: 'lightBlue',
                        fill: 'white',
                        stroke: 'red',
                        strokeWidth: 0,
                        width: 30,
                        height: 30,
                    },
                },
            ],
        ];

        const PATTERN_ROTATION_CASES: (Partial<Rect> | undefined)[][] = [
            [
                // Pattern rotation
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        // @ts-expect-error undocumented option
                        rotation: 0,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        // @ts-expect-error undocumented option
                        rotation: 45,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        // @ts-expect-error undocumented option
                        rotation: 90,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        // @ts-expect-error undocumented option
                        rotation: 135,
                    },
                },
            ],
            [
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        // @ts-expect-error undocumented option
                        rotation: 180,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        // @ts-expect-error undocumented option
                        rotation: 225,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        // @ts-expect-error undocumented option
                        rotation: 270,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        // @ts-expect-error undocumented option
                        rotation: 315,
                    },
                },
            ],
            [
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        // @ts-expect-error undocumented option
                        rotation: 360,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        // @ts-expect-error undocumented option
                        rotation: -45,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        // @ts-expect-error undocumented option
                        rotation: -90,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        // @ts-expect-error undocumented option
                        rotation: -180,
                    },
                },
            ],
            [
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        // @ts-expect-error undocumented option
                        rotation: -270,
                    },
                },
            ],
        ];

        it('should render stock patterns as expected', () => {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 0, canvasCtx.nodeCanvas.height ?? 0);

            let currY = 0;
            let rowHeight = 0;
            for (const testCaseRow of STOCK_PATTERN_CASES) {
                let currX = 0;
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

        it('should render stock patterns with rotation as expected', () => {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 0, canvasCtx.nodeCanvas.height ?? 0);

            let currY = 0;
            let rowHeight = 0;
            for (const testCaseRow of PATTERN_ROTATION_CASES) {
                let currX = 0;
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

        it('should render stock patterns with configured dimensions as expected', () => {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 0, canvasCtx.nodeCanvas.height ?? 0);

            let currY = 0;
            let rowHeight = 0;
            for (const testCaseRow of STOCK_PATTERN_CONFIGURED_DIMENSIONS_CASES) {
                let currX = 0;
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

        it('should render custom patterns as expected', () => {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 0, canvasCtx.nodeCanvas.height ?? 0);

            let currY = 0;
            let rowHeight = 0;
            for (const testCaseRow of CUSTOMISED_PATTERN_CASES) {
                let currX = 0;
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
