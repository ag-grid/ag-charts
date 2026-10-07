import { afterEach, describe, expect, it, vi } from 'vitest';

import { Logger } from 'ag-charts-core';
import { testLogger } from 'ag-charts-test';
import type { AgPatternName } from 'ag-charts-types';

import { Marker } from '../../chart/marker/marker';
import { PATTERN_SNAPSHOT_DEFAULTS, looserSnapshotDefaults } from '../../chart/test/utils';
import { extractImageData, setupMockCanvas } from '../../util/test/mockCanvas';
import { setupMockConsole } from '../../util/test/mockConsole';
import { Scalable } from '../transformable';
import { BarShape } from './barShape';
import { Line } from './line';
import { Path } from './path';
import { Rect } from './rect';
import type { ShapeShadowMode } from './shape';

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
                        direction: 'ltr' as const,
                        width: canvasCtx.nodeCanvas.width,
                        height: canvasCtx.nodeCanvas.height,
                        devicePixelRatio: 1,
                        logger: testLogger,
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
                        direction: 'ltr' as const,
                        width: canvasCtx.nodeCanvas.width,
                        height: canvasCtx.nodeCanvas.height,
                        devicePixelRatio: 1,
                        logger: testLogger,
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
                        direction: 'ltr' as const,
                        width: canvasCtx.nodeCanvas.width,
                        height: canvasCtx.nodeCanvas.height,
                        devicePixelRatio: 1,
                        logger: testLogger,
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
                        direction: 'ltr' as const,
                        width: canvasCtx.nodeCanvas.width,
                        height: canvasCtx.nodeCanvas.height,
                        devicePixelRatio: 1,
                        logger: testLogger,
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
                        direction: 'ltr' as const,
                        width: canvasCtx.nodeCanvas.width,
                        height: canvasCtx.nodeCanvas.height,
                        devicePixelRatio: 1,
                        logger: testLogger,
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
                        direction: 'ltr' as const,
                        width: canvasCtx.nodeCanvas.width,
                        height: canvasCtx.nodeCanvas.height,
                        devicePixelRatio: 1,
                        logger: testLogger,
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
                        direction: 'ltr' as const,
                        width: canvasCtx.nodeCanvas.width,
                        height: canvasCtx.nodeCanvas.height,
                        devicePixelRatio: 1,
                        logger: testLogger,
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

    describe('pattern/image fill logger routing', () => {
        const canvasCtx = setupMockCanvas({ width: 100, height: 100 });

        afterEach(() => vi.restoreAllMocks());

        // Pattern width clamps to >= 1, so scale < 1 forces width * scale < 1 — the "too small" guard.
        const tooSmallPatternRect = () => {
            const testCase: Partial<Rect> = {
                width: 50,
                height: 50,
                fill: { type: 'pattern', pattern: 'circles', width: 1, scale: 0.5, fill: 'black' },
            };
            return Object.assign(new Rect(), testCase);
        };

        const render = (rect: Rect, logger: Logger = testLogger) => {
            const ctx = canvasCtx.getRenderContext2D();
            const renderCtx = {
                ctx,
                direction: 'ltr' as const,
                width: 100,
                height: 100,
                devicePixelRatio: 1,
                logger,
                debugNodes: {},
            };
            ctx.save();
            rect.preRender(renderCtx);
            rect.render(renderCtx);
            ctx.restore();
        };

        it('routes a pattern fill "too small to render" warning through the render-context logger', () => {
            const logger = new Logger();
            const other = new Logger();
            const scoped = vi.spyOn(logger, 'warnOnce').mockImplementation(() => {});
            const unrelated = vi.spyOn(other, 'warnOnce').mockImplementation(() => {});

            render(tooSmallPatternRect(), logger);

            expect(scoped).toHaveBeenCalledWith('Pattern fill is too small to render, ignoring.');
            expect(unrelated).not.toHaveBeenCalled();
        });
    });

    describe('shadow modes', () => {
        const canvasCtx = setupMockCanvas({ width: 400, height: 220 });

        const SHADOW = { enabled: true, color: 'rgba(0, 0, 0, 0.7)', xOffset: 6, yOffset: 6, blur: 4 };

        const renderNode = (node: Line | Path, ctx = canvasCtx.getRenderContext2D()) => {
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

        const lineNode = (shadowMode: ShapeShadowMode, y: number, strokeWidth = 8) => {
            const line = new Line();
            Object.assign(line, {
                x1: 20,
                y1: y,
                x2: 120,
                y2: y + 30,
                stroke: 'red',
                strokeWidth,
                fillShadow: SHADOW,
                shadowMode,
            });
            return line;
        };

        /** A filled box with whiskers sticking out above and below, as in a box plot. */
        const whiskerPath = (shadowMode: ShapeShadowMode, x: number, mixin: Partial<Path> = {}) => {
            const path = new Path();
            Object.assign(path, {
                fill: 'gold',
                stroke: 'navy',
                strokeWidth: 4,
                fillShadow: SHADOW,
                shadowMode,
                ...mixin,
            });
            const { path: p } = path;
            p.moveTo(x, 40);
            p.lineTo(x + 60, 40);
            p.lineTo(x + 60, 140);
            p.lineTo(x, 140);
            p.closePath();
            p.moveTo(x + 30, 10);
            p.lineTo(x + 30, 40);
            p.moveTo(x + 30, 140);
            p.lineTo(x + 30, 190);
            return path;
        };

        const clearCanvas = () => {
            const ctx = canvasCtx.getRenderContext2D();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasCtx.nodeCanvas.width ?? 0, canvasCtx.nodeCanvas.height ?? 0);
        };

        it('should render a stroke-only line and path with a stroke shadow', () => {
            clearCanvas();
            renderNode(lineNode('stroke', 20));
            renderNode(lineNode('stroke', 100, 3));

            const open = new Path();
            Object.assign(open, {
                fill: undefined,
                stroke: 'green',
                strokeWidth: 6,
                lineJoin: 'round',
                fillShadow: SHADOW,
                shadowMode: 'stroke',
            });
            open.path.moveTo(200, 160);
            open.path.lineTo(250, 40);
            open.path.lineTo(300, 160);
            open.path.lineTo(350, 40);
            renderNode(open);

            expect(extractImageData(canvasCtx)).toMatchImageSnapshot();
        });

        it('should render a mixed path with open subpaths with a silhouette shadow', () => {
            clearCanvas();
            renderNode(whiskerPath('silhouette', 40));
            renderNode(
                whiskerPath('silhouette', 200, { fill: { type: 'pattern', pattern: 'circles', width: 10, height: 10 } })
            );

            expect(extractImageData(canvasCtx)).toMatchImageSnapshot();
        });

        it('should not paint the silhouette source off-canvas on to the canvas', () => {
            clearCanvas();
            // No shadow offset or blur, so a silhouette shadow is exactly the shape's own pixels.
            const path = whiskerPath('silhouette', 40, {
                fill: 'black',
                stroke: 'black',
                fillShadow: { enabled: true, color: 'rgba(255, 0, 0, 1)', xOffset: 0, yOffset: 0, blur: 0 },
            });
            renderNode(path);

            const ctx = canvasCtx.getRenderContext2D();
            const pixel = (x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data);
            // Inside the body: black fill on top of the shadow. On the whisker: black stroke on top.
            expect(pixel(70, 90)).toEqual([0, 0, 0, 255]);
            expect(pixel(70, 20)).toEqual([0, 0, 0, 255]);
            // Nothing is drawn away from the shape, including the far right where the shifted source would land.
            expect(pixel(300, 90)).toEqual([255, 255, 255, 255]);
        });

        describe.each([undefined, 10])('square caps with a spread of %s', (spread) => {
            it('should not leave a copy of a diagonal stroke on the left edge', () => {
                clearCanvas();
                const path = new Path();
                Object.assign(path, {
                    fill: undefined,
                    stroke: 'black',
                    strokeWidth: 40,
                    lineCap: 'square',
                    lineJoin: 'round',
                    shadowMode: 'silhouette',
                    // No offset or blur, so a silhouette shadow is exactly the shape's own pixels.
                    fillShadow: { enabled: true, color: 'rgba(255, 0, 0, 1)', xOffset: 0, yOffset: 0, blur: 0, spread },
                });
                // A square cap on a 45° stroke points its corner straight along x, √2 half-strokes past the end.
                path.path.moveTo(100, 40);
                path.path.lineTo(160, 100);
                renderNode(path);

                const { data } = canvasCtx.getRenderContext2D().getImageData(0, 0, 40, canvasCtx.nodeCanvas.height);
                expect(data.every((value) => value === 255)).toBe(true);
            });
        });

        it('should not paint a silhouette node past the right edge back on to the canvas', () => {
            clearCanvas();
            const width = canvasCtx.nodeCanvas.width;
            // Between one and two canvas widths to the right: a shift of one canvas width would land it back on-screen.
            const unshadowed = { enabled: true, color: 'rgba(255, 0, 0, 1)', xOffset: 0, yOffset: 0, blur: 0 };
            renderNode(
                whiskerPath('silhouette', width + 40, { fill: 'black', stroke: 'black', fillShadow: unshadowed })
            );
            // Same node, with a shadow offset that brings only its shadow back on-screen.
            renderNode(
                whiskerPath('silhouette', width + 40, {
                    fill: 'black',
                    stroke: 'black',
                    fillShadow: { ...unshadowed, xOffset: -(width + 20) },
                })
            );

            const { data } = canvasCtx.getRenderContext2D().getImageData(0, 0, width, canvasCtx.nodeCanvas.height);
            let black = 0;
            let red = 0;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) black++;
                if (data[i] === 255 && data[i + 1] === 0) red++;
            }
            // The node is off-canvas, so its own pixels never reach the canvas; only the offset shadow does.
            expect(black).toBe(0);
            expect(red).toBeGreaterThan(0);
        });

        it('should scale the silhouette shadow offset by the device pixel ratio of the layer', () => {
            const ctx = canvasCtx.getRenderContext2D();
            const node = new Path();
            Object.assign(node, {
                fill: 'black',
                stroke: undefined,
                strokeWidth: 0,
                fillShadow: { enabled: true, color: 'rgba(255, 0, 0, 1)', xOffset: 5, yOffset: 5, blur: 0 },
                shadowMode: 'silhouette',
            });
            node.path.rect(20, 20, 30, 50);
            // A 200x110 layer at a pixel ratio of 2 is the 400x220 canvas.
            vi.spyOn(node, 'layerManager', 'get').mockReturnValue({
                canvas: { width: 200, height: 110, pixelRatio: 2 },
            } as any);

            clearCanvas();
            ctx.save();
            ctx.scale(2, 2);
            renderNode(node, ctx);
            ctx.restore();
            vi.restoreAllMocks();

            const pixel = (x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data);
            expect(pixel(70, 90)).toEqual([0, 0, 0, 255]);
            // The node spans 40 to 100 on the canvas, and its shadow another 10 to the right.
            expect(pixel(108, 100)).toEqual([255, 0, 0, 255]);
            expect(pixel(112, 100)).toEqual([255, 255, 255, 255]);
            expect(pixel(300, 100)).toEqual([255, 255, 255, 255]);
        });

        describe('extent coordinate spaces', () => {
            const BLACK = [0, 0, 0, 255];
            const unshadowed = { enabled: true, color: 'rgba(255, 0, 0, 1)', xOffset: 0, yOffset: 0, blur: 0 };

            /** The device-pixel columns that hold at least one pixel of the given colour. */
            const columnsOf = (colour: number[]) => {
                const { width, height } = canvasCtx.nodeCanvas;
                const { data } = canvasCtx.getRenderContext2D().getImageData(0, 0, width, height);
                const columns = new Set<number>();
                for (let i = 0; i < data.length; i += 4) {
                    if (colour.every((v, k) => data[i + k] === v)) columns.add((i / 4) % width);
                }
                return [...columns].sort((a, b) => a - b);
            };

            it('should place the silhouette source by the scaled geometry of a Scalable Path', () => {
                class ScalablePath extends Scalable(Path) {}

                clearCanvas();
                const node = new ScalablePath();
                Object.assign(node, {
                    fill: 'black',
                    stroke: 'black',
                    strokeWidth: 0,
                    fillShadow: unshadowed,
                    shadowMode: 'silhouette',
                    scalingX: 0.5,
                });
                // 200 to 300 in local space, 100 to 150 on screen once scaled.
                node.path.rect(200, 40, 100, 100);
                renderNode(node);

                // Only the node's own pixels reach the canvas.
                const columns = columnsOf(BLACK);
                expect(columns[0]).toBe(100);
                expect(columns.at(-1)).toBe(149);
            });

            it('should scale the stroke reach of a Scalable Path with the node', () => {
                class ScalablePath extends Scalable(Path) {}

                clearCanvas();
                const node = new ScalablePath();
                Object.assign(node, {
                    fill: 'black',
                    stroke: 'black',
                    strokeWidth: 10,
                    fillShadow: unshadowed,
                    shadowMode: 'silhouette',
                    scalingX: 4,
                });
                // 20 to 30 in local space, 80 to 120 on screen. The stroke is scaled too, so it adds 20px on each side.
                node.path.rect(20, 40, 10, 100);
                renderNode(node);

                // The source copy is shifted clear of the canvas by the scaled stroke, so none of it lands at the left.
                const columns = columnsOf(BLACK);
                expect(columns[0]).toBe(60);
                expect(columns.at(-1)).toBe(139);
            });

            it('should place the silhouette source clear of the canvas when the node is mirrored', () => {
                class ScalablePath extends Scalable(Path) {}

                clearCanvas();
                const node = new ScalablePath();
                Object.assign(node, {
                    fill: 'black',
                    stroke: 'black',
                    strokeWidth: 10,
                    fillShadow: unshadowed,
                    shadowMode: 'silhouette',
                    scalingX: -1,
                    scalingCenterX: 100,
                });
                // 20 to 30 in local space, 170 to 180 on screen once mirrored around x = 100, and the stroke adds 5px.
                node.path.rect(20, 40, 10, 100);
                renderNode(node);

                const columns = columnsOf(BLACK);
                expect(columns[0]).toBe(165);
                expect(columns.at(-1)).toBe(184);
            });

            it('should not skip the silhouette of a node whose stroke is the only part on the canvas', () => {
                const node = new Path();
                Object.assign(node, {
                    fill: 'black',
                    stroke: 'black',
                    strokeWidth: 10,
                    fillShadow: unshadowed,
                    shadowMode: 'silhouette',
                });
                // The geometry starts at x = 403, past the right edge of the 400px canvas, but its stroke starts at 398.
                node.path.rect(403, 40, 10, 100);

                const ctx = canvasCtx.getRenderContext2D();
                const shadowedStrokes: unknown[] = [];
                const stroke = ctx.stroke.bind(ctx);
                vi.spyOn(ctx, 'stroke').mockImplementation((...args: Parameters<typeof stroke>) => {
                    if (ctx.shadowColor !== 'rgba(0, 0, 0, 0)') shadowedStrokes.push(ctx.shadowColor);
                    stroke(...args);
                });
                clearCanvas();
                renderNode(node, ctx);
                vi.restoreAllMocks();

                expect(shadowedStrokes).toHaveLength(1);
                expect(columnsOf(BLACK)).toEqual([398, 399]);
            });

            it('should not skip the silhouette of a marker drawn in a translated context', () => {
                clearCanvas();
                const marker = new Marker();
                // More than half way across the canvas, so a bbox that is translated twice lands off it.
                Object.assign(marker, {
                    x: 300,
                    y: 100,
                    size: 40,
                    shape: 'square',
                    fill: 'black',
                    strokeWidth: 0,
                    // Nothing but the shadow reaches the canvas to the right of the marker.
                    fillShadow: { ...unshadowed, xOffset: 30 },
                    shadowMode: 'silhouette',
                });
                renderNode(marker);

                const ctx = canvasCtx.getRenderContext2D();
                const pixel = (x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data);
                expect(pixel(300, 100)).toEqual(BLACK);
                expect(pixel(335, 100)).toEqual([255, 0, 0, 255]);
                // The pre-pass source never lands on the canvas.
                expect(columnsOf(BLACK).at(-1)).toBeLessThan(321);
            });

            it('should shadow a Line with its stroke, where it is drawn', () => {
                clearCanvas();
                const line = lineNode('silhouette', 20, 8);
                line.fillShadow = { ...unshadowed, color: 'rgba(0, 0, 255, 1)', yOffset: 60 };
                renderNode(line);

                const ctx = canvasCtx.getRenderContext2D();
                const pixel = (x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data);
                // The line runs from (20, 20) to (120, 50). Its shadow is the same line, 60px lower.
                expect(pixel(70, 35)).toEqual([255, 0, 0, 255]);
                expect(pixel(70, 95)).toEqual([0, 0, 255, 255]);
                // No second copy of the line, and no shadow, to the right of it.
                expect(columnsOf([0, 0, 255, 255]).at(-1)).toBeLessThan(125);
                expect(columnsOf([255, 0, 0, 255]).at(-1)).toBeLessThan(125);
            });
        });

        describe('on a Rect', () => {
            it.each<ShapeShadowMode>(['stroke', 'silhouette'])('falls back to fill when set to %s', (mode) => {
                const rect = new Rect();
                rect.shadowMode = mode;
                expect(rect.shadowMode).toBe('fill');
            });

            it('falls back to fill on a BarShape', () => {
                const bar = new BarShape();
                bar.shadowMode = 'silhouette';
                expect(bar.shadowMode).toBe('fill');
            });
        });

        describe('draw order', () => {
            const record = (node: Line | Path) => {
                const ctx = canvasCtx.getRenderContext2D();
                const calls: string[] = [];
                const wrap = (name: 'fill' | 'stroke') => {
                    const original = ctx[name].bind(ctx) as (...args: unknown[]) => void;
                    vi.spyOn(ctx, name).mockImplementation((...args: unknown[]) => {
                        calls.push(`${name}:${ctx.shadowColor}:${ctx.shadowOffsetX}`);
                        original(...args);
                    });
                };
                wrap('fill');
                wrap('stroke');
                renderNode(node, ctx);
                return calls;
            };

            // The mock canvas normalises the 0.7 alpha to 8-bit precision.
            const SHADOWED = /^(fill|stroke):rgba\(0, 0, 0, 0\.7\d*\):/;

            afterEach(() => {
                vi.restoreAllMocks();
            });

            it('shadows only the fill in fill mode', () => {
                const calls = record(whiskerPath('fill', 40));
                expect(calls.map((c) => [c.split(':')[0], SHADOWED.test(c)])).toEqual([
                    ['fill', true],
                    ['stroke', false],
                ]);
            });

            it('shadows only the stroke in stroke mode', () => {
                const calls = record(whiskerPath('stroke', 40));
                expect(calls.map((c) => [c.split(':')[0], SHADOWED.test(c)])).toEqual([
                    ['fill', false],
                    ['stroke', true],
                ]);
            });

            it('shadows a pre-pass of fill then stroke in silhouette mode, then paints unshadowed', () => {
                const calls = record(whiskerPath('silhouette', 40));
                expect(calls.map((c) => [c.split(':')[0], SHADOWED.test(c)])).toEqual([
                    ['fill', true],
                    ['stroke', true],
                    ['fill', false],
                    ['stroke', false],
                ]);
            });

            it('bounds the silhouette offset by how far right the shape reaches, plus blur and half the stroke width', () => {
                const calls = record(whiskerPath('silhouette', 40, { lineJoin: 'round' }));
                const offset = Number(calls[0].split(':')[2]);
                // distance + xOffset, with distance = right edge of the shape (40 + 60) + blur + strokeWidth / 2.
                expect(offset).toBe(100 + SHADOW.blur + 4 / 2 + SHADOW.xOffset);
            });

            it('pads the silhouette offset by the miter reach of the stroke', () => {
                const calls = record(whiskerPath('silhouette', 40, { lineJoin: 'miter', miterLimit: 3 }));
                const offset = Number(calls[0].split(':')[2]);
                // As above, with the stroke reaching miterLimit * strokeWidth / 2 past the shape.
                expect(offset).toBe(100 + SHADOW.blur + 3 * (4 / 2) + SHADOW.xOffset);
            });

            it('keeps a silhouette whose visible blur just reaches the canvas', () => {
                const fillShadow = { ...SHADOW, blur: 10 };
                const calls = record(whiskerPath('silhouette', -80, { lineJoin: 'round', fillShadow }));
                // The shadow's edge is 2px short of the canvas, but the blur fades out about 1.5 * blur from it.
                expect(calls).toHaveLength(4);
            });

            it('skips the silhouette pre-pass when the shadow is not finite', () => {
                const calls = record(whiskerPath('silhouette', 40, { fillShadow: { ...SHADOW, blur: Number.NaN } }));
                expect(calls.map((c) => [c.split(':')[0], SHADOWED.test(c)])).toEqual([
                    ['fill', false],
                    ['stroke', false],
                ]);
            });

            it('skips the silhouette pre-pass for a shape whose shadow is nowhere near the canvas', () => {
                const calls = record(whiskerPath('silhouette', 700));
                expect(calls.map((c) => [c.split(':')[0], SHADOWED.test(c)])).toEqual([
                    ['fill', false],
                    ['stroke', false],
                ]);
            });
        });
    });
});
