import { describe, expect, it, vi } from 'vitest';

import { BBox, BarShape, Group, Line, type Logger, Path, Rect, shadowPass } from 'ag-charts-core';
import { testLogger } from 'ag-charts-test';

import { extractImageData, setupMockCanvas } from '../../util/test/mockCanvas';
import { setupMockConsole } from '../../util/test/mockConsole';

describe('Rect', () => {
    setupMockConsole();

    describe('rendering', () => {
        const canvasCtx = setupMockCanvas({ height: 1000 });

        const shadowFn = (offset: number) => ({
            enabled: true,
            color: 'rgba(0, 0, 0, 0.5)',
            xOffset: offset,
            yOffset: offset,
            blur: 5,
        });

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

    describe('painting', () => {
        const canvasCtx = setupMockCanvas({ width: 100, height: 100 });

        function renderContext(ctx: CanvasRenderingContext2D) {
            return {
                ctx,
                direction: 'ltr' as const,
                width: 100,
                height: 100,
                devicePixelRatio: 1,
                logger: testLogger,
                debugNodes: {},
            };
        }

        /** Renders as the scene does: a pre-render, then an isolated render of the node. */
        function paint(rect: Rect, ctx: CanvasRenderingContext2D) {
            const renderCtx = renderContext(ctx);
            rect.preRender(renderCtx);
            rect.isolatedRender(renderCtx);
        }

        function plainRect(overrides: Partial<Rect> = {}) {
            return Object.assign(new Rect(), { x: 10.3, y: 12.7, width: 20.4, height: 15.2, fill: 'red' }, overrides);
        }

        /** A rect that is always saved around and filled through its path, as every rect was. */
        class PathPaintedRect extends Rect {
            protected override needsIsolatedState() {
                return true;
            }

            override drawPath(ctx: CanvasRenderingContext2D, logger: Logger) {
                Path.prototype.drawPath.call(this, ctx, logger);
            }
        }

        function pathPaintedRect(overrides: Partial<Rect>) {
            return Object.assign(new PathPaintedRect(), plainRect(overrides));
        }

        it('fills a plain rect with a fillRect and puts back the global alpha', () => {
            const ctx = canvasCtx.getRenderContext2D();
            const fill = vi.spyOn(ctx, 'fill');
            const fillRect = vi.spyOn(ctx, 'fillRect');
            ctx.globalAlpha = 0.8;

            paint(plainRect({ fillOpacity: 0.5, crisp: true }), ctx);

            expect(fill).not.toHaveBeenCalled();
            expect(fillRect).toHaveBeenCalledTimes(1);
            expect(ctx.globalAlpha).toBeCloseTo(0.8, 5);
        });

        const IMAGE_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="red"/></svg>'
        )}`;

        const pixels = (ctx: CanvasRenderingContext2D) => Buffer.from(ctx.getImageData(0, 0, 100, 100).data);

        it.each([
            ['unaligned', { crisp: false }],
            ['crisp', { crisp: true }],
            ['translucent', { fill: 'rgba(255, 0, 0, 0.4)', fillOpacity: 0.7, opacity: 0.9 }],
            ['sub-pixel', { crisp: true, width: 0.4 }],
            ['a stroke colour with no stroke width', { stroke: 'blue', strokeWidth: 0 }],
        ] as [string, Partial<Rect>][])('paints the same pixels as filling the path (%s)', (_, overrides) => {
            const ctx = canvasCtx.getRenderContext2D();
            const fill = vi.spyOn(ctx, 'fill');
            const fillRect = vi.spyOn(ctx, 'fillRect');

            paint(plainRect(overrides), ctx);
            const direct = pixels(ctx);
            expect(fillRect).toHaveBeenCalledTimes(1);
            expect(direct.some((byte) => byte !== 0)).toBe(true);

            ctx.clearRect(0, 0, 100, 100);
            fillRect.mockClear();
            paint(pathPaintedRect(overrides), ctx);

            expect(fillRect).not.toHaveBeenCalled();
            expect(fill).toHaveBeenCalled();
            expect(pixels(ctx).equals(direct)).toBe(true);
        });

        it.each([
            ['a fill of none', { fill: 'none' }],
            ['a fill opacity of zero', { fillOpacity: 0 }],
            ['an opacity of zero', { opacity: 0 }],
        ] as [string, Partial<Rect>][])('paints nothing with %s', (_, overrides) => {
            const ctx = canvasCtx.getRenderContext2D();

            paint(plainRect(overrides), ctx);

            expect(pixels(ctx).every((byte) => byte === 0)).toBe(true);
        });

        it('leaves out the context save and restore for a plain rect only', () => {
            const ctx = canvasCtx.getRenderContext2D();
            const save = vi.spyOn(ctx, 'save');
            const restore = vi.spyOn(ctx, 'restore');

            paint(plainRect(), ctx);
            expect(save).not.toHaveBeenCalled();
            expect(restore).not.toHaveBeenCalled();

            paint(plainRect({ stroke: 'blue', strokeWidth: 2 }), ctx);
            expect(save).toHaveBeenCalledTimes(1);
            expect(restore).toHaveBeenCalledTimes(1);
        });

        it.each([
            ['rounded corners', { cornerRadius: 4 }],
            ['a stroke', { stroke: 'blue', strokeWidth: 2 }],
            ['a stroke width and no stroke colour', { stroke: 'none', strokeWidth: 3 }],
            ['a clip box', { clipBBox: new BBox(12, 14, 10, 10) }],
            ['a clip', { clip: true, clipX: 15, clipY: 10 }],
            ['a cutout', { drawingMode: 'cutout' as const }],
            ['a shadow', { fillShadow: { enabled: true, color: 'black', xOffset: 2, yOffset: 2, blur: 3 } }],
            [
                'a gradient fill',
                {
                    fill: {
                        type: 'gradient',
                        rotation: 90,
                        colorStops: [{ color: 'rgb(255, 0, 0)' }, { color: 'rgb(0, 0, 255)' }],
                    },
                },
            ],
            [
                'a pattern fill',
                {
                    fill: {
                        type: 'pattern',
                        pattern: 'circles',
                        fill: 'blue',
                        backgroundFill: 'yellow',
                        stroke: 'orange',
                        width: 4,
                        height: 4,
                    },
                },
            ],
            [
                'an image fill',
                { fill: { type: 'image', url: IMAGE_URL, backgroundFill: 'rgb(0, 128, 0)', backgroundFillOpacity: 1 } },
            ],
        ] as [string, Partial<Rect>][])('keeps filling the path with %s', (_, overrides) => {
            const ctx = canvasCtx.getRenderContext2D();
            const fill = vi.spyOn(ctx, 'fill');
            const fillRect = vi.spyOn(ctx, 'fillRect');

            paint(plainRect(overrides), ctx);

            expect(fill).toHaveBeenCalled();
            expect(fillRect).not.toHaveBeenCalled();
        });

        it('paints the background of an image fill', () => {
            const ctx = canvasCtx.getRenderContext2D();
            const fill = { type: 'image' as const, url: IMAGE_URL, backgroundFill: 'rgb(0, 128, 0)' };

            paint(plainRect({ x: 0, y: 0, width: 10, height: 10, fill }), ctx);

            expect(Array.from(ctx.getImageData(5, 5, 1, 1).data)).toEqual([0, 128, 0, 255]);
        });

        it('keeps filling the path while a shadow batch is being drawn', () => {
            const ctx = canvasCtx.getRenderContext2D();
            const fill = vi.spyOn(ctx, 'fill');
            const fillRect = vi.spyOn(ctx, 'fillRect');
            const previous = shadowPass.state;

            shadowPass.state = 'suppress';
            try {
                paint(plainRect(), ctx);
            } finally {
                shadowPass.state = previous;
            }

            expect(fill).toHaveBeenCalled();
            expect(fillRect).not.toHaveBeenCalled();
        });

        it('does not rebuild its path when only the paint changes', () => {
            const ctx = canvasCtx.getRenderContext2D();
            const rect = plainRect();
            const updatePath = vi.spyOn(rect, 'updatePath');
            const renderCtx = renderContext(ctx);

            rect.preRender(renderCtx);
            expect(updatePath).toHaveBeenCalledTimes(1);

            rect.preRender(renderCtx);
            rect.fill = 'blue';
            rect.fillOpacity = 0.5;
            rect.stroke = 'green';
            rect.opacity = 0.9;
            rect.setStyleProperties({ fill: 'lime', fillOpacity: 0.3 });
            rect.preRender(renderCtx);
            expect(updatePath).toHaveBeenCalledTimes(1);

            rect.x += 3;
            rect.preRender(renderCtx);
            expect(updatePath).toHaveBeenCalledTimes(2);

            rect.crisp = true;
            rect.preRender(renderCtx);
            expect(updatePath).toHaveBeenCalledTimes(3);

            rect.setStyleProperties({ fill: 'lime', stroke: 'black', strokeWidth: 2 });
            rect.preRender(renderCtx);
            expect(updatePath).toHaveBeenCalledTimes(4);
        });

        it('paints a repainted fill in the new colour', () => {
            const ctx = canvasCtx.getRenderContext2D();
            const rect = plainRect({ x: 0, y: 0, width: 10, height: 10, fill: 'rgb(255, 0, 0)' });
            const pixelAt = () => Array.from(ctx.getImageData(0, 0, 1, 1).data);

            paint(rect, ctx);
            expect(pixelAt()).toEqual([255, 0, 0, 255]);

            rect.fill = 'rgb(0, 0, 255)';
            paint(rect, ctx);
            expect(pixelAt()).toEqual([0, 0, 255, 255]);
        });

        it('hit tests the rect by its bounds, and by its path once its corners are rounded', () => {
            const ctx = canvasCtx.getRenderContext2D();
            const rect = plainRect({ x: 0, y: 0, width: 40, height: 40 });
            const renderCtx = renderContext(ctx);

            rect.preRender(renderCtx);
            expect(rect.isPointInPath(1, 1)).toBe(true);
            expect(rect.distanceSquared(1, 1)).toBe(0);
            expect(rect.distanceSquared(50, 20)).toBe(100);

            rect.cornerRadius = 20;
            rect.preRender(renderCtx);
            expect(rect.isPointInPath(1, 1)).toBe(false);
            expect(rect.isPointInPath(20, 20)).toBe(true);
            expect(rect.distanceSquared(1, 1)).toBeGreaterThan(0);
        });

        it('paints a stroke when the stroke width goes from zero to positive and back', () => {
            const ctx = canvasCtx.getRenderContext2D();
            const options = { x: 20, y: 20, width: 40, height: 30, fill: 'rgb(255, 0, 0)', stroke: 'rgb(0, 0, 255)' };
            const rect = plainRect({ ...options, strokeWidth: 0 });

            paint(rect, ctx);
            const plain = pixels(ctx);
            expect(Array.from(ctx.getImageData(20, 20, 1, 1).data)).toEqual([255, 0, 0, 255]);

            ctx.clearRect(0, 0, 100, 100);
            rect.strokeWidth = 4;
            paint(rect, ctx);
            expect(Array.from(ctx.getImageData(20, 20, 1, 1).data)).toEqual([0, 0, 255, 255]);
            expect(pixels(ctx).equals(plain)).toBe(false);

            ctx.clearRect(0, 0, 100, 100);
            rect.strokeWidth = 0;
            paint(rect, ctx);
            expect(pixels(ctx).equals(plain)).toBe(true);
        });

        it('returns to a direct fill once a corner radius, clip box or shadow is removed', () => {
            const ctx = canvasCtx.getRenderContext2D();
            const fillRect = vi.spyOn(ctx, 'fillRect');
            const rect = plainRect({ cornerRadius: 4, clipBBox: new BBox(12, 14, 10, 10) });

            paint(rect, ctx);
            expect(fillRect).not.toHaveBeenCalled();

            rect.cornerRadius = 0;
            paint(rect, ctx);
            expect(fillRect).not.toHaveBeenCalled();

            rect.clipBBox = undefined;
            paint(rect, ctx);
            expect(fillRect).toHaveBeenCalledTimes(1);

            rect.fillShadow = { enabled: true, color: 'black', xOffset: 2, yOffset: 2, blur: 3 };
            paint(rect, ctx);
            expect(fillRect).toHaveBeenCalledTimes(1);

            rect.fillShadow = undefined;
            paint(rect, ctx);
            expect(fillRect).toHaveBeenCalledTimes(2);
        });

        it('paints where it was moved to and resized to', () => {
            const ctx = canvasCtx.getRenderContext2D();
            const rect = plainRect({ x: 0, y: 0, width: 10, height: 10, fill: 'rgb(255, 0, 0)' });
            const alphaAt = (x: number, y: number) => ctx.getImageData(x, y, 1, 1).data[3];

            paint(rect, ctx);
            expect(alphaAt(5, 5)).toBe(255);
            expect(alphaAt(55, 55)).toBe(0);

            ctx.clearRect(0, 0, 100, 100);
            Object.assign(rect, { x: 50, y: 50, width: 20, height: 20 });
            paint(rect, ctx);
            expect(alphaAt(5, 5)).toBe(0);
            expect(alphaAt(55, 55)).toBe(255);
            expect(alphaAt(65, 65)).toBe(255);
            expect(alphaAt(75, 75)).toBe(0);
        });

        it('does not paint a rect without width or height', () => {
            const ctx = canvasCtx.getRenderContext2D();
            const fillRect = vi.spyOn(ctx, 'fillRect');

            paint(plainRect({ width: 0 }), ctx);
            paint(plainRect({ height: 0 }), ctx);

            expect(fillRect).not.toHaveBeenCalled();
            expect(pixels(ctx).every((byte) => byte === 0)).toBe(true);
        });

        it('leaves the canvas state to the nodes that follow a plain rect as they would find it', () => {
            const ctx = canvasCtx.getRenderContext2D();

            function scene(isolateRects: boolean) {
                const rectOf = isolateRects ? pathPaintedRect : plainRect;
                const group = new Group({ name: 'root' });
                group.opacity = 0.7;
                const rects = [
                    rectOf({ x: 5, y: 5, width: 30, height: 30, fill: 'rgb(255, 0, 0)', fillOpacity: 0.5 }),
                    rectOf({ x: 20, y: 20, width: 30, height: 30, fill: 'rgb(0, 128, 0)', opacity: 0.6 }),
                    rectOf({ x: 40, y: 40, width: 30, height: 30, fill: 'rgb(0, 0, 255)', crisp: true }),
                ];
                const line = Object.assign(new Line(), {
                    x1: 0,
                    y1: 90,
                    x2: 100,
                    y2: 60,
                    stroke: 'black',
                    strokeWidth: 3,
                });
                const path = new Path();
                path.path.moveTo(60, 5);
                path.path.lineTo(95, 5);
                path.path.lineTo(95, 40);
                path.path.closePath();
                Object.assign(path, { fill: undefined, stroke: 'purple', strokeWidth: 2 });
                const filled = new Path();
                filled.path.rect(60, 50, 30, 20);
                Object.assign(filled, { fill: 'orange' });
                group.append([rects[0], line, rects[1], path, rects[2], filled]);
                return group;
            }

            function render(group: Group) {
                ctx.clearRect(0, 0, 100, 100);
                ctx.globalAlpha = 1;
                const renderCtx = renderContext(ctx);
                group.preRender(renderCtx);
                group.render(renderCtx);
                expect(ctx.globalAlpha).toBe(1);
                return pixels(ctx);
            }

            const isolated = render(scene(true));
            expect(isolated.some((byte) => byte !== 0)).toBe(true);
            expect(render(scene(false)).equals(isolated)).toBe(true);
        });

        it('erases a cutout fully after a translucent plain rect', () => {
            const ctx = canvasCtx.getRenderContext2D();

            function render(rectOf: (overrides: Partial<Rect>) => Rect) {
                const group = new Group({ name: 'root' });
                group.append([
                    rectOf({ x: 0, y: 0, width: 60, height: 60, fill: 'rgb(255, 0, 0)' }),
                    rectOf({ x: 70, y: 0, width: 20, height: 20, fill: 'rgba(0, 0, 255, 0.5)' }),
                    plainRect({ x: 10, y: 10, width: 30, height: 30, fill: undefined, drawingMode: 'cutout' }),
                ]);
                ctx.clearRect(0, 0, 100, 100);
                const renderCtx = renderContext(ctx);
                group.preRender(renderCtx);
                group.render(renderCtx);
                return pixels(ctx);
            }

            const alphaAt = (data: Buffer, x: number, y: number) => data[(y * 100 + x) * 4 + 3];

            const direct = render(plainRect);
            expect(alphaAt(direct, 5, 5)).toBe(255);
            expect(alphaAt(direct, 20, 20)).toBe(0);
            expect(direct.equals(render(pathPaintedRect))).toBe(true);
        });

        it('keeps a bar shape with square corners painting as it did, whether it is feathered or not', () => {
            const ctx = canvasCtx.getRenderContext2D();
            const fillRect = vi.spyOn(ctx, 'fillRect');
            const fill = vi.spyOn(ctx, 'fill');
            const bar = Object.assign(new BarShape(), { x: 10, y: 10, width: 30, height: 40, fill: 'red' });

            bar.featherRatio = 0.3;
            paint(bar, ctx);
            expect(fillRect).not.toHaveBeenCalled();
            expect(fill).toHaveBeenCalledTimes(1);
            expect(bar.isPointInPath(15, 15)).toBe(true);

            bar.featherRatio = 0;
            paint(bar, ctx);
            expect(fillRect).toHaveBeenCalledTimes(1);

            bar.featherRatio = 0.3;
            paint(bar, ctx);
            expect(fillRect).toHaveBeenCalledTimes(1);
            expect(fill).toHaveBeenCalledTimes(2);
        });

        it('hit tests where the rect is now, without a new pre-render', () => {
            const ctx = canvasCtx.getRenderContext2D();
            const rect = plainRect({ x: 0, y: 0, width: 10, height: 10 });
            rect.preRender(renderContext(ctx));
            expect(rect.isPointInPath(5, 5)).toBe(true);
            expect(rect.isPointInPath(55, 55)).toBe(false);

            Object.assign(rect, { x: 50, y: 50 });
            expect(rect.isPointInPath(55, 55)).toBe(true);
            expect(rect.isPointInPath(5, 5)).toBe(false);
            expect(rect.distanceSquared(5, 55)).toBe(45 * 45);
        });
    });

    describe('bbox cache invalidation', () => {
        it('AG-17249 should invalidate cached bbox on every property change, not just the first', () => {
            const rect = new Rect();
            rect.width = 50;
            rect.height = 50;

            // First change → populates cache.
            rect.x = 8;
            rect.y = 8;
            const initial = rect.getBBox();
            expect(initial.x).toBe(8);
            expect(initial.y).toBe(8);

            // Second change while `_dirtyPath` is already true — the old guard skipped
            // `super.onChangeDetection`, leaving the cached bbox at x=8.
            rect.x = 55.95;
            const updated = rect.getBBox();
            expect(updated.x).toBe(55.95);
        });
    });
});
