import { describe, expect, it } from '@jest/globals';

import type { AgPatternName } from 'ag-charts-types';

import { PATTERN_SNAPSHOT_DEFAULTS, looserSnapshotDefaults } from '../../chart/test/utils';
import { extractImageData, setupMockCanvas } from '../../util/test/mockCanvas';
import { setupMockConsole } from '../../util/test/mockConsole';
import { Rect } from './rect';

describe('Shape', () => {
    setupMockConsole();

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

        const CUSTOM_SVG_PATTERN_CASES: (Partial<Rect> | undefined)[][] = [
            [
                {
                    width: 460,
                    height: 230,
                    fill: {
                        type: 'pattern',
                        path: 'M 8 16 C 12.4183 16 16 12.4183 16 8 C 16 3.58172 12.4183 0 8 0 C 3.58172 0 0 3.58172 0 8 C 0 12.4183 3.58172 16 8 16 Z M 8 14 C 11.3137 14 14 11.3137 14 8 C 14 4.68629 11.3137 2 8 2 C 4.68629 2 2 4.68629 2 8 C 2 11.3137 4.68629 14 8 14 Z M 41.4142 8 L 47.364 2.05025 L 45.9497 0.636039 L 40 6.58579 L 34.0503 0.636039 L 32.636 2.05025 L 38.5858 8 L 32.636 13.9497 L 34.0503 15.364 L 40 9.41421 L 45.9497 15.364 L 47.364 13.9497 L 41.4142 8 Z M 40 48 C 44.4183 48 48 44.4183 48 40 C 48 35.5817 44.4183 32 40 32 C 35.5817 32 32 35.5817 32 40 C 32 44.4183 35.5817 48 40 48 Z M 40 46 C 43.3137 46 46 43.3137 46 40 C 46 36.6863 43.3137 34 40 34 C 36.6863 34 34 36.6863 34 40 C 34 43.3137 36.6863 46 40 46 Z M 9.41421 40 L 15.364 34.0503 L 13.9497 32.636 L 8 38.5858 L 2.05025 32.636 L 0.636039 34.0503 L 6.58579 40 L 0.636039 45.9497 L 2.05025 47.364 L 8 41.4142 L 13.9497 47.364 L 15.364 45.9497 L 9.41421 40 Z',
                        width: 65,
                        height: 65,
                    },
                },
                {
                    width: 460,
                    height: 230,
                    fill: {
                        type: 'pattern',
                        path: 'M 20 12 L 20 10 L 0 0 L 0 10 L 4 12 L 20 12 L 20 12 Z M 38 12 L 42 10 L 42 0 L 22 10 L 22 12 L 38 12 Z M 20 0 L 20 8 L 4 1.77636e-15 L 20 0 L 20 0 Z M 38 8.88178e-16 L 22 8 L 22 0 L 38 5.55112e-16 L 38 8.88178e-16 Z',
                        width: 44,
                        height: 12,
                    },
                },
            ],
            [
                {
                    width: 460,
                    height: 230,
                    fill: {
                        type: 'pattern',
                        path: 'M 15 0 C 6.71573 0 0 6.71573 0 15 C 8.28427 15 15 8.28427 15 0 Z M 0 15 C 0 23.2843 6.71573 30 15 30 C 15 21.7157 8.28427 15 0 15 Z M 30 15 C 30 6.71573 23.2843 0 15 0 C 15 8.28427 21.7157 15 30 15 Z M 30 15 C 30 23.2843 23.2843 30 15 30 C 15 21.7157 21.7157 15 30 15 Z',
                        width: 30,
                        height: 30,
                    },
                },
                {
                    width: 460,
                    height: 230,
                    fill: {
                        type: 'pattern',
                        path: 'M 48 28 L 48 24 L 36 12 L 24 24 L 12 12 L 0 24 L 0 28 L 0 28 L 4 32 L 0 36 L 0 40 L 12 52 L 24 40 L 36 52 L 48 40 L 48 36 L 44 32 L 48 28 L 48 28 Z M 8 32 L 2 26 L 12 16 L 22 26 L 16 32 L 22 38 L 12 48 L 2 38 L 8 32 L 8 32 L 8 32 L 8 32 L 8 32 L 8 32 Z M 20 32 L 24 28 L 28 32 L 24 36 L 20 32 L 20 32 L 20 32 L 20 32 L 20 32 L 20 32 Z M 32 32 L 26 26 L 36 16 L 46 26 L 40 32 L 46 38 L 36 48 L 26 38 L 32 32 L 32 32 L 32 32 L 32 32 L 32 32 L 32 32 Z M 0 16 L 10 6 L 4 0 L 8 0 L 12 4 L 16 0 L 20 0 L 14 6 L 24 16 L 34 6 L 28 0 L 32 0 L 36 4 L 40 0 L 44 0 L 38 6 L 48 16 L 48 20 L 36 8 L 24 20 L 12 8 L 0 20 L 0 16 L 0 16 L 0 16 L 0 16 L 0 16 L 0 16 Z M 0 48 L 10 58 L 4 64 L 8 64 L 12 60 L 16 64 L 20 64 L 14 58 L 24 48 L 34 58 L 28 64 L 32 64 L 36 60 L 40 64 L 44 64 L 38 58 L 48 48 L 48 44 L 36 56 L 24 44 L 12 56 L 0 44 L 0 48 L 0 48 L 0 48 L 0 48 L 0 48 L 0 48 Z',
                        width: 48,
                        height: 64,
                    },
                },
            ],
            [
                {
                    width: 460,
                    height: 230,
                    fill: {
                        type: 'pattern',
                        path: 'M 0 40 C 5.52285 40 10 35.5228 10 30 L 10 20 L 10 0 C 4.47715 0 0 4.47715 0 10 L 0 20 L 0 40 Z M 22 40 C 16.4772 40 12 35.5228 12 30 L 12 20 L 12 0 C 17.5228 0 22 4.47715 22 10 L 22 20 L 22 40 Z',
                        width: 24,
                        height: 40,
                    },
                },
                {
                    width: 460,
                    height: 230,
                    fill: {
                        type: 'pattern',
                        path: 'M 84 23 c -4.417 0 -8 -3.584 -8 -7.998 V 8 h -7.002 C 64.58 8 61 4.42 61 0 H 23 c 0 4.417 -3.584 8 -7.998 8 H 8 v 7.002 C 8 19.42 4.42 23 0 23 v 38 c 4.417 0 8 3.584 8 7.998 V 76 h 7.002 C 19.42 76 23 79.58 23 84 h 38 c 0 -4.417 3.584 -8 7.998 -8 H 76 v -7.002 C 76 64.58 79.58 61 84 61 V 23 Z M 59.05 83 H 43 V 66.95 c 5.054 -0.5 9 -4.764 9 -9.948 V 52 h 5.002 c 5.18 0 9.446 -3.947 9.95 -9 H 83 v 16.05 c -5.054 0.5 -9 4.764 -9 9.948 V 74 h -5.002 c -5.18 0 -9.446 3.947 -9.95 9 Z m -34.1 0 H 41 V 66.95 c -5.053 -0.502 -9 -4.768 -9 -9.948 V 52 h -5.002 c -5.184 0 -9.447 -3.946 -9.95 -9 H 1 v 16.05 c 5.053 0.502 9 4.768 9 9.948 V 74 h 5.002 c 5.184 0 9.447 3.946 9.95 9 Z m 0 -82 H 41 v 16.05 c -5.054 0.5 -9 4.764 -9 9.948 V 32 h -5.002 c -5.18 0 -9.446 3.947 -9.95 9 H 1 V 24.95 c 5.054 -0.5 9 -4.764 9 -9.948 V 10 h 5.002 c 5.18 0 9.446 -3.947 9.95 -9 Z m 34.1 0 H 43 v 16.05 c 5.053 0.502 9 4.768 9 9.948 V 32 h 5.002 c 5.184 0 9.447 3.946 9.95 9 H 83 V 24.95 c -5.053 -0.502 -9 -4.768 -9 -9.948 V 10 h -5.002 c -5.184 0 -9.447 -3.946 -9.95 -9 Z M 50 50 v 7.002 C 50 61.42 46.42 65 42 65 c -4.417 0 -8 -3.584 -8 -7.998 V 50 h -7.002 C 22.58 50 19 46.42 19 42 c 0 -4.417 3.584 -8 7.998 -8 H 34 v -7.002 C 34 22.58 37.58 19 42 19 c 4.417 0 8 3.584 8 7.998 V 34 h 7.002 C 61.42 34 65 37.58 65 42 c 0 4.417 -3.584 8 -7.998 8 H 50 Z',
                        width: 84,
                        height: 84,
                    },
                },
            ],
        ];

        const ADVANCED_CUSTOM_SVG_PATTERN_CASES: (Partial<Rect> | undefined)[][] = [
            [
                {
                    width: 1000,
                    height: 230,
                    fill: {
                        type: 'pattern',
                        // C and S
                        path: 'M25,50 C25,25 62.5,25 62.5,50 S100,75 100,50',
                        width: 100,
                        height: 70,
                    },
                },
            ],
            [
                {
                    width: 1000,
                    height: 230,
                    fill: {
                        type: 'pattern',
                        // Q and T
                        path: 'M0,70 Q50,0 50,70 T100,70',
                        width: 100,
                        height: 125,
                    },
                },
            ],
            [
                {
                    width: 1000,
                    height: 230,
                    fill: {
                        type: 'pattern',
                        // Compact case, L command letter eliminated
                        path: 'M 2 100 L 100 2 100 100 2 2 2 100',
                        width: 100,
                        height: 100,
                    },
                },
            ],
        ];

        const ELLIPTICAL_ARC_CUSTOM_SVG_PATTERN_CASES: (Partial<Rect> | undefined)[][] = [
            [
                {
                    width: 1000,
                    height: 460,
                    fill: {
                        type: 'pattern',
                        // Elliptical arc with anticlockwise curve
                        path: `M 125,75 a 100,50 180 0,0 100,50M 125,75 a 100,50 180 0,1 100,50M 125,75 a 100,50 180 1,0 100,50M 125,75 a 100,50 180 1,1 100,50`,
                        width: 330,
                        height: 200,
                    },
                },
            ],
            [
                {
                    width: 1000,
                    height: 460,
                    fill: {
                        type: 'pattern',
                        // Elliptical arc with relative moves
                        path: `M 0 17.83 V 0 h 17.83 a 3 3 0 0 1 -5.66 2 H 5.9 A 5 5 0 0 1 2 5.9 v 6.27 a 3 3 0 0 1 -2 5.66 Z m 0 18.34 a 3 3 0 0 1 2 5.66 v 6.27 A 5 5 0 0 1 5.9 52 h 6.27 a 3 3 0 0 1 5.66 0 H 0 V 36.17 Z M 36.17 52 a 3 3 0 0 1 5.66 0 h 6.27 a 5 5 0 0 1 3.9 -3.9 v -6.27 a 3 3 0 0 1 0 -5.66 V 52 H 36.17 Z M 0 31.93 v -9.78 a 5 5 0 0 1 3.8 0.72 l 4.43 -4.43 a 3 3 0 1 1 1.42 1.41 L 5.2 24.28 a 5 5 0 0 1 0 5.52 l 4.44 4.43 a 3 3 0 1 1 -1.42 1.42 L 3.8 31.2 a 5 5 0 0 1 -3.8 0.72 Z m 52 -14.1 a 3 3 0 0 1 0 -5.66 V 5.9 A 5 5 0 0 1 48.1 2 h -6.27 a 3 3 0 0 1 -5.66 -2 H 52 v 17.83 Z m 0 14.1 a 4.97 4.97 0 0 1 -1.72 -0.72 l -4.43 4.44 a 3 3 0 1 1 -1.41 -1.42 l 4.43 -4.43 a 5 5 0 0 1 0 -5.52 l -4.43 -4.43 a 3 3 0 1 1 1.41 -1.41 l 4.43 4.43 c 0.53 -0.35 1.12 -0.6 1.72 -0.72 v 9.78 Z M 22.15 0 h 9.78 a 5 5 0 0 1 -0.72 3.8 l 4.44 4.43 a 3 3 0 1 1 -1.42 1.42 L 29.8 5.2 a 5 5 0 0 1 -5.52 0 l -4.43 4.44 a 3 3 0 1 1 -1.41 -1.42 l 4.43 -4.43 a 5 5 0 0 1 -0.72 -3.8 Z m 0 52 c 0.13 -0.6 0.37 -1.19 0.72 -1.72 l -4.43 -4.43 a 3 3 0 1 1 1.41 -1.41 l 4.43 4.43 a 5 5 0 0 1 5.52 0 l 4.43 -4.43 a 3 3 0 1 1 1.42 1.41 l -4.44 4.43 c 0.36 0.53 0.6 1.12 0.72 1.72 h -9.78 Z m 9.75 -24 a 5 5 0 0 1 -3.9 3.9 v 6.27 a 3 3 0 1 1 -2 0 V 31.9 a 5 5 0 0 1 -3.9 -3.9 h -6.27 a 3 3 0 1 1 0 -2 h 6.27 a 5 5 0 0 1 3.9 -3.9 v -6.27 a 3 3 0 1 1 2 0 v 6.27 a 5 5 0 0 1 3.9 3.9 h 6.27 a 3 3 0 1 1 0 2 H 31.9 Z`,
                        width: 52,
                        height: 52,
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
                        rotation: 0,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        rotation: 45,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        rotation: 90,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
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
                        rotation: 180,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        rotation: 225,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        rotation: 270,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
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
                        rotation: 360,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        rotation: -45,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
                        rotation: -90,
                    },
                },
                {
                    fill: {
                        ...patternDefaults,
                        type: 'pattern',
                        pattern: 'hearts',
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
            expect(imageData).toMatchImageSnapshot(PATTERN_SNAPSHOT_DEFAULTS);
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
            expect(imageData).toMatchImageSnapshot(looserSnapshotDefaults(0.12, 50));
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

        it('should render custom svg patterns as expected', () => {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 0, canvasCtx.nodeCanvas.height ?? 0);

            let currY = 0;
            let rowHeight = 0;
            for (const testCaseRow of CUSTOM_SVG_PATTERN_CASES) {
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

        it('should render more complex custom svg path patterns as expected', () => {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 0, canvasCtx.nodeCanvas.height ?? 0);

            let currY = 0;
            let rowHeight = 0;
            for (const testCaseRow of ADVANCED_CUSTOM_SVG_PATTERN_CASES) {
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

        it('should render custom svg path patterns with elliptical arcs as expected', () => {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 0, canvasCtx.nodeCanvas.height ?? 0);

            let currY = 0;
            let rowHeight = 0;
            for (const testCaseRow of ELLIPTICAL_ARC_CUSTOM_SVG_PATTERN_CASES) {
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
