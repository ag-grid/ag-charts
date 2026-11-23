import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    BBox,
    CUT_ONLY_GLOW,
    Group,
    Logger,
    Path,
    RadialColumnShape,
    Rect,
    SHADOW_SHRINK_AFTER,
    Scalable,
    Scene,
    SegmentedGroup,
    SegmentedPath,
    Text,
    TransformableGroup,
    Translatable,
    castShadows,
    destroyShadowScratch,
    joinsShadowKey,
    overrideTintableShadows,
    releaseShadowScratch,
    shadowPass,
    startShadowFrame,
} from 'ag-charts-core';
import type { RenderContext, ResolvedDropShadowOptions, ShadowKey, Shape } from 'ag-charts-core';

import { differingBytes } from '../chart/test/expectSamePixels';
import { setupMockCanvas } from '../util/test/mockCanvas';
import { BLACK, type Pixel, box, isHalfRed, maxAlpha } from '../util/test/shadowPixels';

const WIDTH = 400;
const HEIGHT = 220;

// The layer is transparent, so the alpha of a pixel is the strength of the shadow cast on it.
const RED_HALF = { enabled: true, fill: 'rgba(255, 0, 0, 0.5)', xOffset: 100, yOffset: 0, blur: 0 };
const BLUE = { enabled: true, fill: 'rgba(0, 0, 255, 1)', xOffset: 100, yOffset: 0, blur: 0 };
const IN_PLACE = { enabled: true, fill: 'rgba(255, 0, 0, 1)', xOffset: 0, yOffset: 0, blur: 0 };
const GAPPED_GLOW = { ...IN_PLACE, spread: 8, gap: 0, glow: true as const };

const inUse = (canvases: OffscreenCanvas[]) => canvases.filter((canvas) => canvas.width > 0);

const BLUE_PIXEL = [0, 0, 255, 255];
const CLEAR = [0, 0, 0, 0];

// The stroke of a Rect is inset, but that of a Path is centred on its edge.
const pathBox = (x: number, y: number, width: number, height: number, mixin: Partial<Path> = {}) => {
    const node = new Path();
    Object.assign(node, { fill: 'black', stroke: undefined, strokeWidth: 0, ...mixin });
    node.path.rect(x, y, width, height);
    return node;
};

const whisker = (x: number, y: number, mixin: Partial<Path>) => {
    const node = new Path();
    Object.assign(node, { fill: undefined, strokeWidth: 8, ...mixin });
    node.path.moveTo(x, y);
    node.path.lineTo(x, y + 50);
    return node;
};

describe('Group shadow compositor', () => {
    const canvasCtx = setupMockCanvas({ width: WIDTH, height: HEIGHT });

    const groups: Group[] = [];

    afterEach(() => {
        // Groups outside a scene share a scratch canvas, which must not outlive the test that created it.
        for (const group of groups.splice(0)) releaseShadowScratch(undefined, group);
    });

    const ctx = () => canvasCtx.getRenderContext2D();

    const at = (x: number, y: number): Pixel => Array.from(ctx().getImageData(x, y, 1, 1).data);

    const clearCanvas = () => ctx().clearRect(0, 0, WIDTH, HEIGHT);

    const offscreenCanvases = () => new Set(canvasCtx.getActiveOffscreenCanvasInstances());

    const createdSince = (before: Set<OffscreenCanvas>) =>
        canvasCtx.getActiveOffscreenCanvasInstances().filter((canvas) => !before.has(canvas));

    const createGroup = (children: readonly Shape[], batchShadows: Group['batchShadows'] = true) => {
        const group = new Group({ name: 'shadow-group' });
        group.batchShadows = batchShadows;
        for (const child of children) group.appendChild(child);
        groups.push(group);
        return group;
    };

    const pixels = () => Array.from(ctx().getImageData(0, 0, WIDTH, HEIGHT).data);

    const drawGroup = (
        group: Group,
        context: CanvasRenderingContext2D,
        width: number,
        height: number,
        devicePixelRatio = 1,
        direction: 'ltr' | 'rtl' = 'ltr'
    ) => {
        const renderCtx = {
            ctx: context,
            direction,
            width,
            height,
            devicePixelRatio,
            logger: new Logger(),
            debugNodes: {},
        };
        group.preRender(renderCtx);
        group.render(renderCtx);
    };

    const renderGroup = (group: Group, devicePixelRatio = 1, direction: 'ltr' | 'rtl' = 'ltr') => {
        clearCanvas();
        ctx().save();
        ctx().scale(devicePixelRatio, devicePixelRatio);
        drawGroup(group, ctx(), WIDTH, HEIGHT, devicePixelRatio, direction);
        ctx().restore();
    };

    const drawOnLayer = (group: Group, layer: OffscreenCanvas) =>
        drawGroup(group, layer.getContext('2d')! as unknown as CanvasRenderingContext2D, layer.width, layer.height);

    // Nodes draw in the order they were created, so the children must be created in the order they should draw.
    const renderNodes = (children: readonly Shape[], batchShadows: Group['batchShadows'] = true) => {
        const group = createGroup(children, batchShadows);
        renderGroup(group);
        return group;
    };

    // The pixels of the batched and the unbatched render of the same nodes, which are created afresh for each.
    const renderBoth = (nodes: () => Shape[]) => {
        renderNodes(nodes(), false);
        const unbatched = pixels();
        renderNodes(nodes());
        return { unbatched, batched: pixels() };
    };

    const paintedPixels = () => {
        const { data } = ctx().getImageData(0, 0, WIDTH, HEIGHT);
        let painted = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) painted++;
        return painted;
    };

    describe('silhouette shadows', () => {
        // Two boxes, each with a 10px stroke centred on the edge of a fill 20 to 60 across, and shadows 100px right.
        const strokedBoxes = (mixin: Partial<Path>) => [
            pathBox(20, 40, 40, 60, { fill: 'black', stroke: 'black', strokeWidth: 10, ...mixin }),
            pathBox(20, 130, 40, 60, { fill: 'black', stroke: 'black', strokeWidth: 10, ...mixin }),
        ];

        it('should not darken the shadow where a stroke meets its fill', () => {
            renderNodes(strokedBoxes({ fillShadow: RED_HALF, shadowMode: 'silhouette' }));

            // The silhouette is 15 to 65 across, so its shadow is 115 to 165. The stroke covers 15 to 25 and 55 to 65.
            expect(isHalfRed(at(117, 70))).toBe(true);
            expect(isHalfRed(at(120, 70))).toBe(true);
            expect(isHalfRed(at(140, 70))).toBe(true);
            expect(isHalfRed(at(160, 70))).toBe(true);
            expect(isHalfRed(at(163, 160))).toBe(true);
            expect(at(113, 70)).toEqual(CLEAR);
            expect(at(167, 70)).toEqual(CLEAR);
        });

        it('should not cast a shadow from the stroke of a fill mode shape', () => {
            renderNodes(strokedBoxes({ fillShadow: RED_HALF, shadowMode: 'fill' }));

            // The fill is 20 to 60 across, so its shadow is 120 to 160. The stroke would reach 115 to 165.
            expect(isHalfRed(at(123, 70))).toBe(true);
            expect(isHalfRed(at(157, 70))).toBe(true);
            expect(at(117, 70)).toEqual(CLEAR);
            expect(at(163, 70)).toEqual(CLEAR);
        });

        it('should not darken the shadow where two items of a batch overlap', () => {
            renderNodes([box(20, 40, 60, 60, { fillShadow: RED_HALF }), box(50, 70, 60, 60, { fillShadow: RED_HALF })]);

            // The shadows are 120 to 180 and 150 to 210 across, and overlap at 150 to 180 across and 70 to 100 down.
            expect(isHalfRed(at(135, 55))).toBe(true);
            expect(isHalfRed(at(165, 85))).toBe(true);
            expect(isHalfRed(at(195, 115))).toBe(true);
        });
    });

    describe('shadow beneath the batch', () => {
        // The shadow of the box at 100 to 160 across is at 50 to 110, and so lands on the box at 20 to 80.
        const LEFT_SHADOW = { ...RED_HALF, xOffset: -50 };
        const leftShadowed = () => [
            box(20, 40, 60, 60, { fillShadow: LEFT_SHADOW }),
            box(100, 40, 60, 60, { fillShadow: LEFT_SHADOW }),
        ];

        it('should draw every shadow of a batch beneath every item of the batch', () => {
            renderNodes(leftShadowed());

            expect(at(65, 70)).toEqual(BLACK);
            expect(at(40, 70)).toEqual(BLACK);
            expect(isHalfRed(at(90, 70))).toBe(true);
            expect(at(105, 70)).toEqual(BLACK);
        });

        it('should draw the shadow of a later item over an earlier item when batching is off', () => {
            renderNodes(leftShadowed(), false);

            expect(at(65, 70)[0]).toBeGreaterThan(0);
            expect(at(65, 70)).not.toEqual(BLACK);
        });

        // A series that gives each item a zIndex only to order them, as an aggregated scatter does, still has one batch.
        it('should keep items of different zIndex in one batch', () => {
            const [first, second] = leftShadowed();
            first.zIndex = [-2, 0];
            second.zIndex = [-2, 1];
            renderNodes([first, second]);

            expect(at(65, 70)).toEqual(BLACK);
            expect(isHalfRed(at(90, 70))).toBe(true);
        });

        it('should end a batch at a change of zIndex in a group that batches by layer', () => {
            const [first, second] = leftShadowed();
            first.zIndex = 0;
            second.zIndex = 1;
            const group = createGroup([first, second]);
            group.batchShadows = 'by-layer';
            renderGroup(group);

            // The shadow of the item on the upper layer lands on the item beneath it.
            expect(at(65, 70)[0]).toBeGreaterThan(0);
            expect(at(65, 70)).not.toEqual(BLACK);
        });
    });

    describe('segmented group', () => {
        const LEFT_SHADOW = { ...RED_HALF, xOffset: -50 };

        // A segment that no item reaches, so that every item is drawn in the gaps between segments.
        const segment = {
            clipRect: { x0: 300, y0: 0, x1: 400, y1: 100 },
            fill: 'green',
            fillOpacity: 1,
            stroke: 'green',
            strokeOpacity: 1,
            strokeWidth: 1,
        };

        const renderSegmented = (segments: (typeof segment)[]) => {
            const group = new SegmentedGroup({ name: 'segmented-group', batchShadows: true });
            group.segments = segments;
            group.appendChild(box(20, 40, 60, 60, { fillShadow: LEFT_SHADOW }));
            group.appendChild(box(100, 40, 60, 60, { fillShadow: LEFT_SHADOW }));
            groups.push(group);
            renderGroup(group);
        };

        it('should draw every shadow of a batch beneath every item when it has segments', () => {
            renderSegmented([segment]);

            expect(at(65, 70)).toEqual(BLACK);
            expect(isHalfRed(at(90, 70))).toBe(true);
            expect(at(105, 70)).toEqual(BLACK);
        });

        it('should draw the same shadows when it has no segments', () => {
            renderSegmented([]);

            expect(at(65, 70)).toEqual(BLACK);
            expect(isHalfRed(at(90, 70))).toBe(true);
        });
    });

    describe('spread', () => {
        it.each(['transparent', 'rgba(0, 0, 0, 0)'])(
            'should spread the shadow of an opaque fill with a stroke colour of %s',
            (stroke) => {
                const shadow = { ...RED_HALF, xOffset: 0, spread: 10 };
                const item = (y: number) =>
                    pathBox(60, y, 40, 50, { fillShadow: shadow, shadowMode: 'silhouette', stroke, strokeWidth: 6 });
                const { unbatched, batched } = renderBoth(() => [item(40), item(130)]);

                // The shadow reaches the spread past the fill, as the item casts it for itself.
                expect(isHalfRed(at(105, 65))).toBe(true);
                expect(batched).toEqual(unbatched);
            }
        );

        it('should grow the shadow of every item of a batch by the spread', () => {
            const shadow = { ...RED_HALF, spread: 10 };
            renderNodes([box(20, 40, 40, 40, { fillShadow: shadow }), box(20, 130, 40, 40, { fillShadow: shadow })]);

            // Without a spread the shadows are 120 to 160 across, and 40 to 80 and 130 to 170 down.
            for (const [x, y] of [
                [112, 60],
                [140, 32],
                [140, 88],
                [168, 60],
                [112, 150],
                [140, 122],
            ]) {
                expect(isHalfRed(at(x, y))).toBe(true);
            }
            for (const [x, y] of [
                [107, 60],
                [173, 60],
                [140, 27],
                [140, 93],
            ]) {
                expect(at(x, y)).toEqual(CLEAR);
            }
        });

        it('should not grow the shadow of a batch that has no spread', () => {
            renderNodes([
                box(20, 40, 40, 40, { fillShadow: RED_HALF }),
                box(20, 130, 40, 40, { fillShadow: RED_HALF }),
            ]);

            expect(isHalfRed(at(125, 60))).toBe(true);
            expect(at(115, 60)).toEqual(CLEAR);
            expect(at(165, 60)).toEqual(CLEAR);
        });

        it.each([false, true])(
            'should cast a spread shadow as strong as the composited paint of a pattern (batched: %s)',
            (batched) => {
                // A background at 0.5 under a motif at 0.5 is 0.75 where they overlap.
                const pattern = {
                    type: 'pattern' as const,
                    pattern: 'squares' as const,
                    width: 10,
                    height: 10,
                    fill: 'black',
                    fillOpacity: 0.5,
                    backgroundFill: 'black',
                    backgroundFillOpacity: 0.5,
                    strokeWidth: 0,
                };
                const shadow = { ...RED_HALF, fill: 'rgba(255, 0, 0, 1)', spread: 10 };
                renderNodes(
                    [
                        box(20, 40, 40, 50, { fill: pattern, fillShadow: shadow }),
                        box(20, 130, 40, 50, { fill: pattern, fillShadow: shadow }),
                    ],
                    batched
                );

                for (const pixel of [at(140, 65), at(115, 65), at(140, 155)]) {
                    expect(pixel[3]).toBeGreaterThanOrEqual(190);
                    expect(pixel[3]).toBeLessThanOrEqual(192);
                }
            }
        );

        it('should fade the shadow of a crisp rectangle that is narrower than a pixel, as the rectangle fades', () => {
            const shadow = { ...RED_HALF, fill: 'rgba(255, 0, 0, 1)', spread: 4 };
            const thin = () => [
                box(20, 40, 0.4, 50, { crisp: true, fillShadow: shadow }),
                box(20, 130, 0.4, 50, { crisp: true, fillShadow: shadow }),
            ];
            renderNodes(thin(), false);
            const alone = Array.from(ctx().getImageData(100, 20, 60, 180).data);

            renderNodes(thin());
            const batched = Array.from(ctx().getImageData(100, 20, 60, 180).data);

            expect(alone.some((value) => value !== 0)).toBe(true);
            expect(maxAlpha(alone)).toBeLessThan(255);
            expect(batched).toEqual(alone);
        });

        describe('a crisp rectangle that is narrower than a pixel', () => {
            const SOLID = { ...RED_HALF, fill: 'rgba(255, 0, 0, 1)', spread: 4 };
            // A bar that is 0.4 across, or high, which crisp rendering fades rather than widening to a pixel.
            const bars = {
                thin: () => [
                    box(20, 40, 0.4, 50, { crisp: true, fillShadow: SOLID }),
                    box(20, 130, 0.4, 50, { crisp: true, fillShadow: SOLID }),
                ],
                short: () => [
                    box(20, 40, 50, 0.4, { crisp: true, fillShadow: SOLID }),
                    box(20, 130, 50, 0.4, { crisp: true, fillShadow: SOLID }),
                ],
            };
            const rendered = (devicePixelRatio: number, children: readonly Shape[], batchShadows = true) => {
                renderGroup(createGroup(children, batchShadows), devicePixelRatio);
                return pixels();
            };

            it.each([['thin'], ['short']] as const)(
                'should fade the shadow of a %s crisp bar, as the bar fades',
                (name) => {
                    const alone = rendered(1, bars[name](), false);

                    expect(alone.some((value) => value !== 0)).toBe(true);
                    expect(maxAlpha(alone)).toBeLessThan(255);
                    expect(rendered(1, bars[name]())).toEqual(alone);
                }
            );

            it.each([['thin'], ['short']] as const)(
                'should fade the shadow of a %s crisp bar at a device pixel ratio of 2, as the bar fades',
                (name) => {
                    // A scene gives the casters the layer's pixel ratio, which they size and snap their own shadows by.
                    const renderScene = (batchShadows: boolean) => {
                        const scene = new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 2 });
                        scene.resize(WIDTH, HEIGHT, 2);
                        const root = new Group({ name: 'root' });
                        root.appendChild(createGroup(bars[name](), batchShadows));
                        scene.setRoot(root);
                        scene.render();
                        const { context } = scene.canvas;
                        const data = Array.from(context.getImageData(0, 0, WIDTH * 2, HEIGHT * 2).data);
                        scene.destroy();
                        return data;
                    };
                    const alone = renderScene(false);

                    expect(alone.some((value) => value !== 0)).toBe(true);
                    expect(maxAlpha(alone)).toBeLessThan(255);
                    expect(renderScene(true)).toEqual(alone);
                }
            );

            it.each([['thin'], ['short']] as const)(
                'should leave a %s crisp bar to cast for itself when the browser gives no context for the mask',
                (name) => {
                    const alone = rendered(1, bars[name](), false);

                    // The mask is the first canvas that the batch makes, and the casters then draw their own spread.
                    const noContext = vi.spyOn(OffscreenCanvas.prototype, 'getContext').mockReturnValueOnce(null);
                    let batched: number[];
                    try {
                        batched = rendered(1, bars[name]());
                        expect(noContext).toHaveBeenCalled();
                    } finally {
                        noContext.mockRestore();
                    }

                    expect(alone.some((value) => value !== 0)).toBe(true);
                    expect(batched).toEqual(alone);
                }
            );
        });

        describe('a pattern of several parts', () => {
            const SOLID = { ...RED_HALF, fill: 'rgba(255, 0, 0, 1)', spread: 10 };

            it.each([false, true])(
                'should cast the shadow of a pattern with a background, a fill and a visible stroke (batched: %s)',
                (batched) => {
                    // 0.5 under 0.5 under 0.5 is 0.875 where all three overlap.
                    const pattern = {
                        type: 'pattern' as const,
                        pattern: 'squares' as const,
                        width: 10,
                        height: 10,
                        fill: 'black',
                        fillOpacity: 0.5,
                        backgroundFill: 'black',
                        backgroundFillOpacity: 0.5,
                        stroke: 'black',
                        strokeOpacity: 0.5,
                        strokeWidth: 2,
                    };
                    renderNodes(
                        [
                            box(20, 40, 40, 50, { fill: pattern, fillShadow: SOLID }),
                            box(20, 130, 40, 50, { fill: pattern, fillShadow: SOLID }),
                        ],
                        batched
                    );

                    for (const pixel of [at(140, 65), at(115, 65), at(140, 155)]) {
                        expect(pixel[3]).toBeGreaterThanOrEqual(222);
                        expect(pixel[3]).toBeLessThanOrEqual(225);
                    }
                }
            );
        });

        describe('a gradient whose last stop has no colour', () => {
            it.each([false, true])(
                'should cast the shadow at the alpha of the colour that the stop inherits (batched: %s)',
                (batched) => {
                    const gradient = {
                        type: 'gradient' as const,
                        gradient: 'linear' as const,
                        colorStops: [{ color: 'rgba(0, 0, 255, 0.4)', stop: 0 }, { stop: 1 }],
                    };
                    const shadow = { ...RED_HALF, fill: 'rgba(255, 0, 0, 1)', spread: 10 };
                    renderNodes(
                        [
                            box(20, 40, 40, 50, { fill: gradient, fillShadow: shadow }),
                            box(20, 130, 40, 50, { fill: gradient, fillShadow: shadow }),
                        ],
                        batched
                    );

                    // 0.4 of 255 is 102.
                    for (const pixel of [at(140, 65), at(115, 65), at(140, 155)]) {
                        expect(pixel[3]).toBeGreaterThanOrEqual(101);
                        expect(pixel[3]).toBeLessThanOrEqual(103);
                    }
                }
            );
        });

        describe('line patterns', () => {
            const shadow = { ...RED_HALF, fill: 'rgba(255, 0, 0, 1)', spread: 10 };

            it.each([['forward-slanted-lines'], ['backward-slanted-lines'], ['vertical-lines'], ['horizontal-lines']])(
                'should cast no shadow from a %s pattern with no stroke, as its fill is open segments that paint nothing',
                (name) => {
                    // The lines are open segments, so the fill paints nothing, and the stroke is not drawn at 0px.
                    const pattern = {
                        type: 'pattern' as const,
                        pattern: name as 'vertical-lines',
                        fill: 'black',
                        backgroundFill: 'none',
                        strokeWidth: 0,
                    };
                    for (const batched of [false, true]) {
                        renderNodes(
                            [
                                box(20, 40, 40, 50, { fill: pattern, fillShadow: shadow }),
                                box(20, 130, 40, 50, { fill: pattern, fillShadow: shadow }),
                            ],
                            batched
                        );

                        expect(at(140, 65)).toEqual(CLEAR);
                        expect(at(115, 65)).toEqual(CLEAR);
                    }
                }
            );

            it.each([
                ['an invalid', 'not a path', CLEAR],
                ['a valid', 'M 0 0 L 4 0 L 4 4 Z', undefined],
            ])(
                'should count the fill of a line pattern with %s custom path as the pattern does',
                (_name, path, clear) => {
                    // A path that does not parse leaves the pattern drawing its lines, whose fill paints nothing.
                    const pattern = {
                        type: 'pattern' as const,
                        pattern: 'vertical-lines' as const,
                        path,
                        fill: 'black',
                        backgroundFill: 'none',
                        strokeWidth: 0,
                    };
                    for (const batched of [false, true]) {
                        renderNodes(
                            [
                                box(20, 40, 40, 50, { fill: pattern, fillShadow: shadow }),
                                box(20, 130, 40, 50, { fill: pattern, fillShadow: shadow }),
                            ],
                            batched
                        );

                        if (clear == null) expect(at(140, 65)[3]).toBeGreaterThan(0);
                        else expect(at(140, 65)).toEqual(clear);
                    }
                }
            );

            it.each([['forward-slanted-lines'], ['backward-slanted-lines'], ['vertical-lines'], ['horizontal-lines']])(
                'should cast the shadow of the strokes of a %s pattern, at the strength of the stroke',
                (name) => {
                    const pattern = {
                        type: 'pattern' as const,
                        pattern: name as 'vertical-lines',
                        // A fill that would count at 0.9 if the lines were closed.
                        fill: 'black',
                        fillOpacity: 0.9,
                        backgroundFill: 'none',
                        stroke: 'black',
                        strokeOpacity: 0.5,
                        strokeWidth: 2,
                    };
                    for (const batched of [false, true]) {
                        renderNodes(
                            [
                                box(20, 40, 40, 50, { fill: pattern, fillShadow: shadow }),
                                box(20, 130, 40, 50, { fill: pattern, fillShadow: shadow }),
                            ],
                            batched
                        );

                        expect(at(140, 65)[3]).toBeGreaterThanOrEqual(127);
                        expect(at(140, 65)[3]).toBeLessThanOrEqual(129);
                    }
                }
            );
        });

        describe('a shape that paints only extras', () => {
            // A shape that paints a stroke apart from its main path, and scales the opacity of what it paints.
            class ExtrasPath extends Path {
                extrasX = 0;
                extrasY = 0;
                protected override getSilhouetteExtrasOpacity() {
                    return 1;
                }
                protected override getPaintOpacityScale() {
                    return 0.5;
                }
                protected override dilateSilhouetteExtras(target: CanvasRenderingContext2D, growth: number) {
                    const extras = new Path2D();
                    extras.moveTo(this.extrasX, this.extrasY);
                    extras.lineTo(this.extrasX, this.extrasY + 50);
                    target.lineWidth = 8 + growth;
                    target.stroke(extras);
                }
            }

            it('should cast its spread shadow at the scaled opacity, whether or not the shadow is batched', () => {
                const shadow = { ...RED_HALF, fill: 'rgba(255, 0, 0, 1)', xOffset: 0, spread: 4 };
                const extras = (x: number, y: number) => {
                    const node = new ExtrasPath();
                    Object.assign(node, { fill: 'none', stroke: undefined, strokeWidth: 0, fillShadow: shadow });
                    Object.assign(node, { shadowMode: 'silhouette', extrasX: x, extrasY: y });
                    node.path.moveTo(x, y);
                    node.path.lineTo(x, y + 50);
                    return node;
                };
                const alphaAt = (batchShadows: boolean) => {
                    renderNodes([extras(100, 40), extras(200, 130)], batchShadows);
                    return [at(100, 65)[3], at(200, 155)[3]];
                };

                // Half of 255.
                expect(alphaAt(false)).toEqual([128, 128]);
                expect(alphaAt(true)).toEqual([128, 128]);
            });
        });

        describe('the strength of the casters of a batch', () => {
            const shadow = { ...RED_HALF, fill: 'rgba(255, 0, 0, 1)', spread: 12 };
            const item = (y: number, alpha: number) =>
                box(20, y, 40, 50, { fill: `rgba(0, 0, 255, ${alpha})`, fillShadow: shadow });
            const alphaAt = (x: number, y: number) => at(x, y)[3];

            it('should cast casters of one translucent strength as one shadow, where their spreads overlap', () => {
                // The items are 5px apart, so their 12px spreads overlap in the gap, at y 90 to 95.
                renderNodes([item(40, 0.5), item(95, 0.5), item(150, 0.5)]);

                // Half of 255, beside an item, between two of them, and above the first. Not 0.75, as stacked shadows would be.
                expect([alphaAt(140, 65), alphaAt(140, 92), alphaAt(140, 120), alphaAt(140, 34)]).toEqual([
                    128, 128, 128, 128,
                ]);
            });

            it('should cast casters of different strengths each at their own, where their spreads do not meet', () => {
                const { unbatched: alone, batched } = renderBoth(() => [item(40, 0.5), item(130, 1)]);

                expect([alphaAt(140, 65), alphaAt(140, 155)]).toEqual([128, 255]);
                expect(batched).toEqual(alone);
            });

            it('should cast the stronger of casters of different strengths, where their spreads overlap', () => {
                // 5px apart, so their spreads overlap in the gap at y 90 to 95.
                renderNodes([item(40, 0.5), item(95, 1)]);

                // The translucent item's shadow beside it, the gap between the two, and the opaque item's shadow beside it.
                expect([alphaAt(140, 65), alphaAt(140, 92), alphaAt(140, 120)]).toEqual([128, 255, 255]);
            });

            it('should not let a caster that paints nothing stop the others casting at one strength', () => {
                // The transparent item casts nothing, so it has no strength to differ by.
                renderNodes([item(40, 0.5), item(95, 0), item(150, 0.5)]);

                // Beside the first item and just below it, then 120, which only the transparent item's spread (83 to 157) would
                // reach, then beside the last item.
                expect([alphaAt(140, 65), alphaAt(140, 92), alphaAt(140, 120), alphaAt(140, 175)]).toEqual([
                    128, 128, 0, 128,
                ]);
            });

            it('should cast at the strength of the casters and the alpha of the layer together', () => {
                const render = (batchShadows: boolean) => {
                    const group = createGroup([item(40, 0.5), item(95, 0.5), item(150, 0.5)], batchShadows);
                    group.opacity = 0.5;
                    renderGroup(group);
                    return [alphaAt(140, 65), alphaAt(140, 92)];
                };
                // Beside an item, a caster cast for itself is the same. Between two, the shadows of casters cast for themselves stack.
                const [aloneBeside] = render(false);

                const [batchedBeside, batchedBetween] = render(true);

                // A quarter of 255, not the 0.5 of the group alone, and not stacked to 0.4375 between two items.
                expect([aloneBeside, batchedBeside, batchedBetween]).toEqual([64, 64, 64]);
            });

            it('should treat casters whose strengths differ by less than the tolerance as one strength', () => {
                // 0.5 and 0.5005 are within 1/512 of each other, so the shadow is cast once rather than twice over.
                renderNodes([item(40, 0.5), item(95, 0.5005)]);

                expect([alphaAt(140, 65), alphaAt(140, 92), alphaAt(140, 120)]).toEqual([128, 128, 128]);
            });

            it('should cast each caster for itself where one has no path to dilate', () => {
                // A shape without a path to dilate has no strength, so the batch cannot cast its casters as one.
                class NoSpreadPath extends Rect {
                    protected override hasSpreadMaskPath() {
                        return false;
                    }
                }
                const unspread = (y: number) => {
                    const node = new NoSpreadPath();
                    Object.assign(node, {
                        x: 20,
                        y,
                        width: 40,
                        height: 50,
                        fill: 'rgba(0, 0, 255, 0.5)',
                        stroke: undefined,
                        strokeWidth: 0,
                        fillShadow: shadow,
                    });
                    return node;
                };
                const { unbatched: alone, batched } = renderBoth(() => [item(40, 0.5), unspread(130)]);

                expect(alone.some((value) => value !== 0)).toBe(true);
                expect(batched).toEqual(alone);
            });
        });
    });

    describe('knock-out of a translucent item', () => {
        const INK = { enabled: true, fill: 'rgba(255, 0, 0, 1)', xOffset: 0, yOffset: 0, blur: 0 };

        const translucent = (y: number, spread?: number) =>
            box(60, y, 60, 50, { fill: 'rgba(0, 0, 255, 0.5)', fillShadow: { ...INK, spread } });

        it('should not show the spread shadow of a translucent item through the item', () => {
            // 6px inside the left edge of the item, which the 12px spread reaches across.
            renderNodes([translucent(30, 12), translucent(130, 12)]);
            const withSpread = at(66, 55);

            renderNodes([translucent(30), translucent(130)]);
            const withoutSpread = at(66, 55);

            expect(withSpread[3]).toBeGreaterThan(0);
            expect(withSpread).toEqual(withoutSpread);
        });

        it('should cast a uniform shadow around a translucent item with a spread', () => {
            renderNodes([translucent(30, 12), translucent(130, 12)]);

            // The ring is as strong at the corner, where the dilation overlaps itself, as it is beside an edge.
            const side = at(54, 55);
            expect(side[3]).toBeGreaterThan(0);
            expect(at(54, 25)).toEqual(side);
        });

        it('should cast a uniform shadow over the fill of a translucent item with a stroke and a spread', () => {
            const stroked = (y: number) =>
                pathBox(60, y, 60, 50, {
                    fill: 'rgba(0, 0, 0, 0.5)',
                    stroke: 'rgba(0, 0, 0, 0.5)',
                    strokeWidth: 2,
                    fillShadow: { ...INK, spread: 6 },
                    shadowMode: 'silhouette',
                });

            renderNodes([stroked(30), stroked(130)], false);
            const unbatched = [at(63, 55), at(66, 55), at(90, 55)];

            renderNodes([stroked(30), stroked(130)]);

            // 3 and 6px inside the left edge, which the stroke and the 6px spread reach across, and the middle.
            expect(unbatched[0][3]).toBeGreaterThan(0);
            expect([at(63, 55), at(66, 55), at(90, 55)]).toEqual(unbatched);
        });

        describe('a stroke with a fill that casts nothing', () => {
            const transparentGradient = {
                type: 'gradient' as const,
                colorStops: [
                    { color: 'rgba(0, 0, 0, 0)', stop: 0 },
                    { color: 'rgba(255, 0, 0, 0)', stop: 1 },
                ],
            };
            const transparentPattern = {
                type: 'pattern' as const,
                pattern: 'squares' as const,
                width: 10,
                height: 10,
                fill: 'rgba(0, 0, 0, 0)',
                backgroundFill: 'rgba(0, 0, 0, 0)',
                strokeOpacity: 0,
            };

            it.each([
                ['colour', 'transparent'],
                ['rgba colour', 'rgba(0, 0, 0, 0)'],
                ['gradient', transparentGradient],
                ['pattern', transparentPattern],
            ])('should cast the whole dilated stroke with a transparent %s fill', (_name, fill) => {
                const item = (y: number) =>
                    pathBox(60, y, 60, 50, {
                        fill,
                        stroke: 'black',
                        strokeWidth: 6,
                        fillShadow: { ...RED_HALF, xOffset: 0, spread: 6 },
                        shadowMode: 'silhouette',
                    });

                renderNodes([item(30), item(130)]);

                // 6px inside the left edge, which the inner half of the stroke and its spread reach across.
                expect(isHalfRed(at(66, 55))).toBe(true);
                expect(isHalfRed(at(66, 155))).toBe(true);
            });
        });

        it.each([['transparent'], ['rgba(0, 0, 255, 0)'], ['rgba(0, 0, 255, 0.5)'], ['blue']])(
            'should cast the same shadow as an item that casts for itself, from an opaque stroke over a %s fill',
            (fill) => {
                const item = (y: number) =>
                    pathBox(40, y, 60, 50, {
                        fill,
                        stroke: 'black',
                        strokeWidth: 6,
                        fillShadow: { ...RED_HALF, fill: 'rgba(255, 0, 0, 1)', xOffset: 0, spread: 8 },
                        shadowMode: 'silhouette',
                    });
                // Outside the edge, on the stroke, inside its footprint and in the middle of the fill.
                const xs = [30, 34, 38, 41, 44, 48, 52, 70];

                renderNodes([item(30), item(130)], false);
                const alone = xs.map((x) => at(x, 55));

                renderNodes([item(30), item(130)]);

                expect(alone.some((pixel) => pixel[3] > 0)).toBe(true);
                expect(xs.map((x) => at(x, 55))).toEqual(alone);
                expect(xs.map((x) => at(x, 155))).toEqual(alone);
            }
        );

        describe('a spread shadow of paint that is not a plain colour', () => {
            const item = (y: number, mixin: Partial<Path>) =>
                pathBox(40, y, 60, 50, {
                    stroke: 'black',
                    strokeWidth: 6,
                    fillShadow: { ...RED_HALF, fill: 'rgba(255, 0, 0, 1)', xOffset: 0, spread: 8 },
                    shadowMode: 'silhouette',
                    ...mixin,
                });

            const alphaAcross = (y: number) => [30, 34, 38, 41, 44, 48, 52, 70].map((x) => at(x, y)[3]);

            it.each([
                [
                    'a pattern',
                    {
                        type: 'pattern' as const,
                        pattern: 'vertical-lines' as const,
                        fill: 'blue',
                        width: 6,
                        height: 6,
                        strokeWidth: 3,
                    },
                ],
                [
                    'a gradient',
                    {
                        type: 'gradient' as const,
                        gradient: 'linear' as const,
                        colorStops: [
                            { color: 'rgba(0, 0, 255, 0.2)', stop: 0 },
                            { color: 'rgba(0, 0, 255, 1)', stop: 1 },
                        ],
                    },
                ],
            ])('should cast a solid shadow, as it does for itself, from an opaque stroke over %s', (_name, fill) => {
                renderNodes([item(30, { fill }), item(130, { fill })], false);
                const alone = alphaAcross(55);

                renderNodes([item(30, { fill }), item(130, { fill })]);

                expect(alone.includes(255)).toBe(true);
                expect(alphaAcross(55)).toEqual(alone);
                expect(alphaAcross(155)).toEqual(alone);
            });

            it.each([
                ['a transparent fill and stroke', { fill: 'rgba(0, 0, 0, 0)', stroke: 'rgba(0, 0, 0, 0)' }],
                ['a visible stroke of no width', { fill: 'rgba(0, 0, 0, 0)', stroke: 'black', strokeWidth: 0 }],
                ['no stroke, whose default is not drawn', { fill: 'none', stroke: 'rgba(0, 0, 0, 0)' }],
            ])('should cast the stroke of a shape whose pattern paints nothing, with %s', (_name, paint) => {
                // The background is `none`, as a theme resolves it.
                const fill = {
                    type: 'pattern' as const,
                    pattern: 'squares' as const,
                    backgroundFill: 'none',
                    ...paint,
                };
                renderNodes([item(30, { fill }), item(130, { fill })], false);
                const alone = [30, 34, 38].map((x) => at(x, 55)[3]);

                renderNodes([item(30, { fill }), item(130, { fill })]);

                // Outside the edge, which only the stroke's spread reaches.
                expect(alone).toEqual([255, 255, 255]);
                expect([30, 34, 38].map((x) => at(x, 55)[3])).toEqual(alone);
            });
        });

        describe('a spread shadow at fractional coordinates', () => {
            const item = (y: number, mixin: Partial<Path>) =>
                pathBox(60.5, y + 0.25, 40.25, 30.5, {
                    stroke: 'black',
                    strokeWidth: 3,
                    fillShadow: { ...RED_HALF, fill: 'rgba(255, 0, 0, 1)', xOffset: 0, spread: 6 },
                    shadowMode: 'silhouette',
                    ...mixin,
                });
            const region = () => Array.from(ctx().getImageData(40, 10, 100, 190).data);
            const worstDifference = (a: number[], b: number[]) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));

            it.each([['blue'], ['rgba(0, 0, 255, 1)']])(
                'should leave no seam in the shadow of an opaque %s fill',
                (fill) => {
                    renderNodes([item(30, { fill }), item(130, { fill })], false);
                    const alone = region();

                    renderNodes([item(30, { fill }), item(130, { fill })]);

                    expect(alone.some((value) => value !== 0)).toBe(true);
                    expect(worstDifference(region(), alone)).toBe(0);
                }
            );

            it('should cast the same shadow as an item that casts for itself from a translucent fill', () => {
                const fill = 'rgba(0, 0, 255, 0.5)';
                renderNodes([item(30, { fill }), item(130, { fill })], false);
                const alone = region();

                renderNodes([item(30, { fill }), item(130, { fill })]);

                expect(worstDifference(region(), alone)).toBe(0);
            });
        });

        it('should match the shadow of an item that casts for itself', () => {
            renderNodes([translucent(30, 12), translucent(130, 12)], false);
            const alone = Array.from(ctx().getImageData(40, 10, 100, 90).data);

            renderNodes([translucent(30, 12), translucent(130, 12)]);
            const batched = Array.from(ctx().getImageData(40, 10, 100, 90).data);

            expect(alone.some((value) => value !== 0)).toBe(true);
            expect(batched).toEqual(alone);
        });
    });

    describe('paint that casts nothing', () => {
        const transparentGradient = {
            type: 'gradient' as const,
            colorStops: [
                { color: 'rgba(0, 0, 0, 0)', stop: 0 },
                { color: 'rgba(255, 0, 0, 0)', stop: 1 },
            ],
        };
        const transparentPattern = {
            type: 'pattern' as const,
            pattern: 'squares' as const,
            width: 10,
            height: 10,
            fill: 'rgba(0, 0, 0, 0)',
            backgroundFill: 'rgba(0, 0, 0, 0)',
            strokeOpacity: 0,
        };

        describe.each([undefined, 10])('with a spread of %s', (spread) => {
            const shadow = { ...RED_HALF, spread };

            // The second item of each batch is visible, so that there is a caster in the batch that does cast.
            it.each([
                ['fill colour', { fill: 'rgba(0, 0, 0, 0)' }],
                ['fill opacity', { fill: 'black', fillOpacity: 0 }],
                ['gradient', { fill: transparentGradient }],
                ['pattern', { fill: transparentPattern }],
                // A stop without a colour paints the colour of the stop before it.
                [
                    'gradient whose last stop inherits a transparent colour',
                    {
                        fill: {
                            type: 'gradient' as const,
                            colorStops: [{ color: 'rgba(0, 0, 0, 0)', stop: 0 }, { stop: 1 }],
                        },
                    },
                ],
            ])('should cast no shadow from a transparent %s', (_name, mixin) => {
                renderNodes([
                    box(20, 40, 40, 50, { ...mixin, fillShadow: shadow }),
                    box(20, 130, 40, 50, { fillShadow: shadow }),
                ]);

                expect(isHalfRed(at(140, 155))).toBe(true);
                expect(at(140, 65)).toEqual(CLEAR);
                expect(at(125, 45)).toEqual(CLEAR);
                expect(at(112, 65)).toEqual(CLEAR);
                expect(at(40, 65)).toEqual(CLEAR);
            });

            it.each(['stroke', 'silhouette'] as const)(
                'should cast no shadow from a whisker with a zero alpha stroke in %s mode',
                (shadowMode) => {
                    renderNodes([
                        whisker(40, 30, { stroke: 'rgba(0, 0, 0, 0)', fillShadow: shadow, shadowMode }),
                        whisker(40, 130, { stroke: 'black', fillShadow: shadow, shadowMode }),
                    ]);

                    expect(at(140, 155)[3]).toBeGreaterThan(0);
                    expect(at(140, 55)).toEqual(CLEAR);
                    expect(at(40, 55)).toEqual(CLEAR);
                }
            );

            it('should cast no shadow from a lone transparent item with a spread, beside items with other options', () => {
                const lone = () => box(20, 40, 40, 50, { fill: transparentGradient, fillShadow: shadow });

                renderNodes([lone()]);
                expect(at(140, 65)).toEqual(CLEAR);
                expect(at(125, 45)).toEqual(CLEAR);

                renderNodes([lone(), box(20, 130, 40, 50, { fillShadow: BLUE })]);
                expect(at(140, 65)).toEqual(CLEAR);
                expect(at(125, 45)).toEqual(CLEAR);
                expect(at(140, 155)).toEqual(BLUE_PIXEL);
            });

            it('should cast no shadow from a whisker with a zero stroke opacity', () => {
                renderNodes([
                    whisker(40, 30, { stroke: 'black', strokeOpacity: 0, fillShadow: shadow, shadowMode: 'stroke' }),
                    whisker(40, 130, { stroke: 'black', fillShadow: shadow, shadowMode: 'stroke' }),
                ]);

                expect(at(140, 155)[3]).toBeGreaterThan(0);
                expect(at(140, 55)).toEqual(CLEAR);
            });
        });

        it('should cast a weaker shadow from a translucent fill than from an opaque one', () => {
            renderNodes([
                box(20, 40, 40, 50, { fill: 'rgba(0, 0, 0, 0.5)', fillShadow: BLUE }),
                box(20, 130, 40, 50, { fill: 'black', fillShadow: BLUE }),
            ]);

            expect(at(140, 155)[3]).toBe(255);
            expect(at(140, 65)[3]).toBeGreaterThan(0);
            expect(at(140, 65)[3]).toBeLessThan(255);
        });
    });

    describe('strength of a spread batch', () => {
        // The shadow is opaque and lands 100px right of the items, so that its alpha is that of the mask under it.
        const SPREAD = { enabled: true, fill: 'rgba(255, 0, 0, 1)', xOffset: 100, yOffset: 0, blur: 0, spread: 6 };

        // Two items that overlap at 50 to 80 across, and 60 to 90 down, so their shadows overlap there.
        const overlapping = (first: Partial<Rect>, second: Partial<Rect>) => [
            box(20, 40, 60, 50, { fill: 'blue', fillShadow: SPREAD, ...first }),
            box(50, 60, 60, 50, { fill: 'blue', fillShadow: SPREAD, ...second }),
        ];

        const alphaAt = (x: number, y: number) => at(x, y)[3];
        const expectAlpha = (x: number, y: number, alpha: number) => {
            expect(Math.abs(alphaAt(x, y) - alpha)).toBeLessThanOrEqual(2);
        };

        it('should cast the overlap of items at a shared translucent strength at that strength', () => {
            renderNodes(overlapping({ fillOpacity: 0.5 }, { fillOpacity: 0.5 }));

            // Each shadow alone, and where the two overlap, which is not the 0.75 that two translucent shadows add up to.
            expectAlpha(130, 50, 128);
            expectAlpha(190, 100, 128);
            expectAlpha(160, 75, 128);
        });

        it('should scale a shared translucent strength by the opacity of the layer', () => {
            const group = createGroup(overlapping({ fillOpacity: 0.5 }, { fillOpacity: 0.5 }));
            group.opacity = 0.5;
            renderGroup(group);

            expectAlpha(130, 50, 64);
            expectAlpha(160, 75, 64);
        });

        it('should cast each item at its own strength when the strengths differ', () => {
            renderNodes(overlapping({ fillOpacity: 0.5 }, { fillOpacity: 0.25 }));

            // The shadows add where they overlap: 1 - (1 - 0.5) * (1 - 0.25) = 0.625.
            expectAlpha(130, 50, 128);
            expectAlpha(190, 100, 64);
            expectAlpha(160, 75, 159);
        });

        it('should cast items whose strengths differ by less than the tolerance as one', () => {
            renderNodes(overlapping({ fillOpacity: 0.5 }, { fillOpacity: 0.501 }));

            expectAlpha(160, 75, 128);
        });

        it('should skip the mask of a batch whose items all cast nothing', () => {
            const before = offscreenCanvases();

            renderNodes(overlapping({ fillOpacity: 0 }, { fillOpacity: 0 }));

            expect(createdSince(before)).toHaveLength(0);
            expect(paintedPixels()).toBe(0);
        });
    });

    describe('cutout', () => {
        // The cutout is 200 to 260 across. The shadow of the first batch lands on its left part, and that of the
        // second batch on its right part.
        const aroundCutout = () => [
            box(100, 90, 40, 40, { fillShadow: RED_HALF }),
            box(20, 160, 40, 40, { fillShadow: RED_HALF }),
            box(200, 90, 60, 40, { fill: 'rgba(0, 0, 255, 0.5)', drawingMode: 'cutout', fillShadow: RED_HALF }),
            box(140, 90, 20, 40, { fillShadow: RED_HALF }),
            box(20, 20, 40, 40, { fillShadow: RED_HALF }),
        ];

        it('should end a batch at a cutout node', () => {
            renderNodes(aroundCutout());

            // The cutout erased the shadow that the first batch cast beneath it, and left only its own fill.
            const erased = at(220, 110);
            expect(erased.slice(0, 3)).toEqual([0, 0, 255]);
            expect(Math.abs(erased[3] - 128)).toBeLessThanOrEqual(1);
            // The second batch casts after the cutout, so its shadow is over the cutout and not erased by it.
            const over = at(250, 110);
            expect(over[0]).toBeGreaterThan(0);
            expect(over[3]).toBeGreaterThan(190);
        });

        it('should draw the items and shadows around a cutout node', () => {
            renderNodes(aroundCutout());

            expect(at(120, 110)).toEqual(BLACK);
            expect(at(150, 110)).toEqual(BLACK);
            expect(isHalfRed(at(140, 180))).toBe(true);
            expect(isHalfRed(at(140, 40))).toBe(true);
            // The cutout casts its own shadow, as a single caster.
            expect(at(330, 110)[3]).toBeGreaterThan(0);
        });

        describe.each([
            ['without a spread, inline', {}],
            ['with a spread, from the pre-pass', { spread: 4 }],
        ])('a cutout with a glow %s', (_name, extra) => {
            const cutoutWith = (options: Partial<Shape>) =>
                box(200, 90, 60, 40, { fill: 'rgba(0, 0, 255, 0.5)', drawingMode: 'cutout', ...options });

            it('should cast its own glow as it casts its own shadow, once', () => {
                const CAST = { ...RED_HALF, ...extra };
                renderNodes([box(100, 90, 40, 40, { fillShadow: CAST }), cutoutWith({ fillShadow: CAST })]);
                const asShadow = pixels();
                renderNodes([box(100, 90, 40, 40, { fillShadow: CAST }), cutoutWith({ fillGlow: CAST })]);

                expect(pixels()).toEqual(asShadow);
                // Cast by the cutout alone, at the strength of its fill: the batch would stack a second glow over it.
                expect(at(330, 110)).toEqual([255, 0, 0, 64]);
            });

            it('should cast its glow and its shadow together, each once', () => {
                const SHADOW = { ...RED_HALF, ...extra };
                const GLOW = { ...BLUE, xOffset: -100, ...extra };
                renderNodes([cutoutWith({ fillShadow: SHADOW, fillGlow: GLOW })]);

                expect(at(330, 110)).toEqual([255, 0, 0, 64]);
                expect(at(130, 110)).toEqual([0, 0, 255, 128]);
            });
        });
    });

    describe('mixed shadow options', () => {
        const BLUE_LEFT = { ...BLUE, xOffset: -100 };
        const RED_LEFT = { ...RED_HALF, xOffset: -100 };

        it('should batch each run of shared shadow options separately', () => {
            // The tall box is 20 to 60 across and 20 to 120 down. The red batch casts onto its lower half, from the box
            // beside it, and the blue batch onto its upper half.
            renderNodes([
                box(20, 20, 40, 100, { fillShadow: RED_LEFT }),
                box(120, 80, 40, 40, { fillShadow: RED_LEFT }),
                box(120, 20, 40, 40, { fillShadow: BLUE_LEFT }),
                box(300, 150, 40, 40, { fillShadow: BLUE_LEFT }),
            ]);

            // A shadow is beneath the items of its own batch, and over the items of the batch before it.
            expect(at(40, 100)).toEqual(BLACK);
            expect(at(40, 40)).toEqual(BLUE_PIXEL);
            expect(at(220, 170)).toEqual(BLUE_PIXEL);
        });

        it('should give one item with its own shadow options a shadow of its own', () => {
            // As the item with `highlightedItem.shadow` does.
            renderNodes([
                box(20, 20, 40, 100, { fillShadow: RED_LEFT }),
                box(300, 150, 40, 40, { fillShadow: RED_LEFT }),
                box(120, 20, 40, 170, { fillShadow: BLUE_LEFT }),
                box(20, 130, 40, 60, { fillShadow: RED_LEFT }),
                box(300, 20, 40, 40, { fillShadow: RED_LEFT }),
            ]);

            // Its shadow is over the item drawn before it, in the gap, and under the batch drawn after it.
            expect(at(40, 60)).toEqual(BLUE_PIXEL);
            expect(at(40, 125)).toEqual(BLUE_PIXEL);
            expect(at(40, 160)).toEqual(BLACK);
            // The other items cast their own colour.
            expect(isHalfRed(at(220, 170))).toBe(true);
            expect(isHalfRed(at(220, 40))).toBe(true);
        });
    });

    describe('layer edges', () => {
        it.each([
            [undefined, CLEAR],
            [10, [255, 0, 0, 255]],
        ])('should leave no copy of an item that overhangs the left edge, with a spread of %s', (spread, near) => {
            renderNodes([
                box(-30, 40, 40, 60, { fillShadow: { ...IN_PLACE, spread } }),
                box(-30, 130, 40, 60, { fillShadow: { ...IN_PLACE, spread } }),
            ]);

            // The item covers 0 to 10 across. A spread of 10 grows its shadow to 20.
            expect(at(5, 70)).toEqual(BLACK);
            expect(at(15, 70)).toEqual(near);
            expect(at(25, 70)).toEqual(CLEAR);
            const { data } = ctx().getImageData(WIDTH / 2, 0, WIDTH / 2, HEIGHT);
            expect(data.every((value) => value === 0)).toBe(true);
        });

        it('should leave no copy of an item that overhangs the right edge', () => {
            renderNodes([
                box(WIDTH - 10, 40, 40, 60, { fillShadow: IN_PLACE }),
                box(WIDTH - 10, 130, 40, 60, { fillShadow: IN_PLACE }),
            ]);

            const { data } = ctx().getImageData(0, 0, WIDTH / 2, HEIGHT);
            expect(data.every((value) => value === 0)).toBe(true);
            expect(at(WIDTH - 5, 70)).toEqual(BLACK);
        });

        it('should cast the shadow of an item that overhangs the left edge across the whole item', () => {
            renderNodes([
                box(-30, 40, 40, 60, { fillShadow: { ...RED_HALF, xOffset: 40 } }),
                box(-30, 130, 40, 60, { fillShadow: { ...RED_HALF, xOffset: 40 } }),
            ]);

            // The item is -30 to 10 across, so its shadow is 10 to 50, as it is when the item casts for itself.
            expect(isHalfRed(at(15, 70))).toBe(true);
            expect(isHalfRed(at(45, 70))).toBe(true);
            expect(isHalfRed(at(45, 160))).toBe(true);
            expect(at(55, 70)).toEqual(CLEAR);
        });

        it('should cast the shadow of an item that is off the layer, onto it', () => {
            renderNodes([
                box(-60, 40, 40, 60, { fillShadow: { ...RED_HALF, xOffset: 80 } }),
                box(-60, 130, 40, 60, { fillShadow: { ...RED_HALF, xOffset: 80 } }),
            ]);

            // The items are -60 to -20 across, so their shadows are 20 to 60.
            expect(at(10, 70)).toEqual(CLEAR);
            expect(isHalfRed(at(30, 70))).toBe(true);
            expect(isHalfRed(at(50, 160))).toBe(true);
            expect(at(70, 70)).toEqual(CLEAR);
        });

        it.each([
            ['left', { xOffset: -60, yOffset: 0 }, [box(WIDTH + 20, 40, 40, 60), box(WIDTH + 20, 130, 40, 60)]],
            ['top', { xOffset: 0, yOffset: 60 }, [box(100, -80, 40, 40), box(200, -80, 40, 40)]],
            ['bottom', { xOffset: 0, yOffset: -60 }, [box(100, HEIGHT + 20, 40, 40), box(200, HEIGHT + 20, 40, 40)]],
        ])('should cast a blurred shadow onto the layer from items off the %s edge', (_edge, offset, items) => {
            const shadow = { ...RED_HALF, ...offset, blur: 8, spread: 4 };
            const { unbatched, batched } = renderBoth(() =>
                items.map((item) => box(item.x, item.y, item.width, item.height, { fillShadow: shadow }))
            );

            expect(unbatched.some((value) => value !== 0)).toBe(true);
            expect(batched).toEqual(unbatched);
        });

        it('should draw a batch through the mask when its shadow reaches further than the layer is wide', () => {
            const before = offscreenCanvases();
            const shadow = { ...RED_HALF, xOffset: WIDTH * 2 };
            renderNodes([box(20, 40, 40, 40, { fillShadow: shadow }), box(20, 130, 40, 40, { fillShadow: shadow })]);

            expect(createdSince(before)).toHaveLength(1);
            expect(at(30, 60)).toEqual(BLACK);
            expect(at(30, 150)).toEqual(BLACK);
        });

        it('should cast no shadow from transparent items, however far the shadow reaches', () => {
            const transparentGradient = {
                type: 'gradient' as const,
                colorStops: [
                    { color: 'rgba(0, 0, 0, 0)', stop: 0 },
                    { color: 'rgba(255, 0, 0, 0)', stop: 1 },
                ],
            };
            const shadow = { ...RED_HALF, xOffset: 300, blur: 40, spread: 6 };
            renderNodes([
                box(20, 40, 40, 40, { fill: transparentGradient, fillShadow: shadow }),
                box(20, 130, 40, 40, { fill: transparentGradient, fillShadow: shadow }),
            ]);

            expect(paintedPixels()).toBe(0);
        });
    });

    describe('clipped paths', () => {
        const clipped = (x: number, y: number, clipX: number, mixin: Partial<Path> = {}) => {
            const node = pathBox(x, y, 60, 50, { fillShadow: { ...RED_HALF, xOffset: 30 }, clip: true, ...mixin });
            node.clipX = clipX;
            node.clipY = HEIGHT;
            return node;
        };

        it('should clip the shadow of a path that is clipped, as it does for itself', () => {
            const { unbatched, batched } = renderBoth(() => [
                clipped(20, 20, 90),
                clipped(20, 100, 90),
                box(200, 160, 40, 40, { fillShadow: RED_HALF }),
            ]);

            // The paths are 20 to 80 across, and their shadows 50 to 110 are clipped at 90, with the shadow's own edge.
            expect(isHalfRed(at(85, 45))).toBe(true);
            expect(at(100, 45)).toEqual(CLEAR);
            expect(batched).toEqual(unbatched);
        });

        it('should cast the shadow of the part of a path that is outside its clip into it', () => {
            const shadow = { ...RED_HALF, xOffset: -60 };
            const before = offscreenCanvases();
            const { unbatched, batched } = renderBoth(() => [
                clipped(100, 20, 90, { fillShadow: shadow }),
                clipped(100, 100, 90, { fillShadow: shadow }),
            ]);

            // The paths are 100 to 160 across, outside their clip of 0 to 90, and their shadows are 40 to 100.
            expect(createdSince(before)).toHaveLength(1);
            expect(isHalfRed(at(60, 45))).toBe(true);
            expect(at(95, 45)).toEqual(CLEAR);
            expect(batched).toEqual(unbatched);
        });

        it('should clip the shadow of a path with a transform of its own in the coordinates of the path', () => {
            const TranslatedPath = Translatable(Path);
            const translated = (y: number) => {
                const node = new TranslatedPath();
                Object.assign(node, {
                    fill: 'black',
                    stroke: undefined,
                    strokeWidth: 0,
                    fillShadow: { ...RED_HALF, xOffset: 30 },
                    clip: true,
                    clipX: 90,
                    clipY: HEIGHT,
                    translationX: 100,
                    translationY: y,
                });
                node.path.rect(20, 0, 60, 50);
                return node;
            };
            const { unbatched, batched } = renderBoth(() => [translated(20), translated(100)]);

            // The paths are 120 to 180 across, and their shadows 150 to 210 are clipped at 100 + 90.
            expect(isHalfRed(at(185, 45))).toBe(true);
            expect(at(195, 45)).toEqual(CLEAR);
            expect(batched).toEqual(unbatched);
        });

        it('should clip each path to its own clip', () => {
            const { unbatched, batched } = renderBoth(() => [
                clipped(20, 20, 90),
                clipped(20, 100, 100),
                clipped(20, 150, 90),
            ]);

            // Their shadows are 50 to 110 across, outside the paths from 80, and are clipped at 90, 100 and 90.
            expect(isHalfRed(at(95, 125))).toBe(true);
            expect(at(95, 45)).toEqual(CLEAR);
            expect(at(95, 175)).toEqual(CLEAR);
            expect(batched).toEqual(unbatched);
        });
    });

    describe('device pixel ratio', () => {
        it('should scale the offset of a batch by the device pixel ratio', () => {
            renderGroup(
                createGroup([
                    box(20, 40, 40, 40, { fillShadow: { ...RED_HALF, xOffset: 50 } }),
                    box(20, 130, 40, 40, { fillShadow: { ...RED_HALF, xOffset: 50 } }),
                ]),
                2
            );

            // At twice the ratio the boxes are 40 to 120 across, and the shadow is 100 further, at 140 to 220.
            expect(at(100, 120)).toEqual(BLACK);
            expect(at(130, 120)).toEqual(CLEAR);
            expect(isHalfRed(at(180, 120))).toBe(true);
            expect(at(230, 120)).toEqual(CLEAR);
        });
    });

    describe('groups without batched shadows', () => {
        const casters = () => [
            box(20, 40, 60, 60, { fillShadow: RED_HALF }),
            box(30, 130, 60, 60, { fillShadow: RED_HALF }),
            box(250, 40, 60, 60, { fillShadow: RED_HALF }),
        ];

        it('should take the existing path for a group with no shadow casters', () => {
            const plain = () => [box(20, 40, 60, 60), box(130, 40, 60, 60, { fill: 'red' }), box(250, 40, 60, 60)];
            const before = offscreenCanvases();

            renderNodes(plain());
            const batching = pixels();
            expect(createdSince(before)).toHaveLength(0);

            renderNodes(plain(), false);
            expect(pixels()).toEqual(batching);
            expect(paintedPixels()).toBe(3 * 60 * 60);
        });

        it('should take the existing path for a group whose shadows are disabled', () => {
            const before = offscreenCanvases();

            renderNodes(casters().map((node) => Object.assign(node, { fillShadow: { ...RED_HALF, enabled: false } })));

            expect(createdSince(before)).toHaveLength(0);
            expect(paintedPixels()).toBe(3 * 60 * 60);
        });

        it('should cast the shadow of a group with a single shadow caster through the mask', () => {
            const before = offscreenCanvases();

            renderNodes([box(20, 40, 60, 60, { fillShadow: RED_HALF }), box(250, 40, 60, 60)]);

            expect(createdSince(before)).toHaveLength(1);
            expect(isHalfRed(at(130, 70))).toBe(true);
        });

        it('should not batch the shadows of a group that has not opted in', () => {
            const before = offscreenCanvases();

            renderNodes(casters(), false);

            expect(createdSince(before)).toHaveLength(0);
            expect(isHalfRed(at(130, 70))).toBe(true);
        });

        it('should count the shadow casters again after a child changes', () => {
            const nodes = casters().slice(0, 2);
            const group = createGroup(nodes);
            const before = offscreenCanvases();

            renderGroup(group);
            expect(createdSince(before).length).toBeGreaterThan(0);
            expect(isHalfRed(at(130, 70))).toBe(true);
            expect(isHalfRed(at(140, 160))).toBe(true);

            // One caster is left, which still casts through the mask.
            nodes[1].fillShadow = undefined;
            renderGroup(group);
            expect(isHalfRed(at(130, 70))).toBe(true);
            expect(at(140, 160)).toEqual(CLEAR);

            nodes[1].fillShadow = RED_HALF;
            renderGroup(group);
            expect(isHalfRed(at(130, 70))).toBe(true);
            expect(isHalfRed(at(140, 160))).toBe(true);
        });
    });

    describe('scratch canvas', () => {
        const newScene = () => new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });

        const shadowed = (x: number, y: number) => box(x, y, 40, 40, { fillShadow: RED_HALF });

        const setRoot = (scene: Scene, ...children: Group[]) => {
            const root = new Group({ name: 'root' });
            for (const child of children) root.appendChild(child);
            scene.setRoot(root);
        };

        it('should keep the mask within what a browser can allocate, with a blur wider than the layer at 2x', () => {
            const before = offscreenCanvases();
            const shadow = { ...RED_HALF, fill: 'rgba(255, 0, 0, 1)', xOffset: 0, blur: 3000 };
            renderGroup(
                createGroup([
                    box(20, 40, 40, 40, { fillShadow: shadow }),
                    box(20, 130, 40, 40, { fillShadow: shadow }),
                ]),
                2
            );

            const [mask] = inUse(createdSince(before));
            expect(mask.width * mask.height).toBeLessThanOrEqual(4096 * 4096);
            // The item is still cast through the mask, which is blurred beyond the point where it can be seen.
            expect(paintedPixels()).toBeGreaterThan(0);
        });

        it('should let the items cast for themselves when the browser gives no context for the mask', () => {
            const nodes = () => [
                box(20, 40, 40, 40, { fillShadow: RED_HALF }),
                box(20, 130, 40, 40, { fillShadow: RED_HALF }),
            ];
            renderNodes(nodes(), false);
            const alone = pixels();

            const noContext = vi.spyOn(OffscreenCanvas.prototype, 'getContext').mockReturnValue(null);
            let batched: number[];
            try {
                renderNodes(nodes());
                batched = pixels();
            } finally {
                noContext.mockRestore();
            }

            expect(alone.some((value) => value !== 0)).toBe(true);
            expect(batched).toEqual(alone);
        });

        describe('a layer too large for the mask', () => {
            const transparentGradient = {
                type: 'gradient' as const,
                colorStops: [
                    { color: 'rgba(0, 0, 0, 0)', stop: 0 },
                    { color: 'rgba(255, 0, 0, 0)', stop: 1 },
                ],
            };

            const renderLayer = (layerWidth: number, layerHeight: number, group: Group) => {
                const layer = new OffscreenCanvas(layerWidth, layerHeight);
                drawOnLayer(group, layer);
                const layerCtx = layer.getContext('2d')! as unknown as CanvasRenderingContext2D;
                return { layer, alpha: (x: number, y: number) => layerCtx.getImageData(x, y, 1, 1).data[3] };
            };

            it.each([
                [4200, 4100],
                [8000, 3000],
            ])(
                'should cast the shadow through a mask of a lower resolution, for a layer of %i x %i',
                (width, height) => {
                    const shadow = { ...RED_HALF, fill: 'rgba(255, 0, 0, 1)', spread: 8 };
                    const before = offscreenCanvases();
                    const group = createGroup([
                        box(20, 40, 40, 50, { fill: transparentGradient, fillShadow: shadow }),
                        box(20, 130, 40, 50, { fillShadow: shadow }),
                    ]);

                    const { layer, alpha } = renderLayer(width, height, group);

                    // One mask, within what a browser can allocate, was made for the layer, and the casters did not cast for themselves.
                    const masks = inUse(createdSince(before).filter((canvas) => canvas !== layer));
                    const [mask] = masks;
                    expect(mask.width * mask.height).toBeLessThanOrEqual(4096 * 4096);
                    expect(mask.width).toBeLessThan(width);
                    // The shadow of the visible item sits 100px right of it, at its full strength and in its place, and the
                    // transparent one casts none, even as dilated.
                    expect([alpha(140, 155), alpha(140, 130), alpha(140, 180)]).toEqual([255, 255, 255]);
                    expect([alpha(140, 65), alpha(125, 45), alpha(112, 65)]).toEqual([0, 0, 0]);
                    // Well past the 8px of spread, which a mask of a lower resolution blurs the edge of by a pixel.
                    expect([alpha(104, 155), alpha(176, 155), alpha(140, 114), alpha(140, 196)]).toEqual([0, 0, 0, 0]);
                }
            );

            it('should cast the shadow of a segmented path past the width that the mask reaches at its resolution', () => {
                const shadow = { ...RED_HALF, fill: 'rgba(255, 0, 0, 1)' };
                // A segment that no item reaches, so that the item is drawn in the gap between segments.
                const segments = [{ clipRect: { x0: 0, y0: 0, x1: 10, y1: 10 } }];
                const segmentedBox = (x: number) => {
                    const node = new SegmentedPath();
                    Object.assign(node, {
                        fill: 'black',
                        stroke: undefined,
                        strokeWidth: 0,
                        fillShadow: shadow,
                        segments,
                    });
                    node.path.rect(x, 40, 40, 50);
                    return node;
                };
                const unbatched = renderLayer(8000, 3000, createGroup([segmentedBox(7000)], false));
                const before = offscreenCanvases();
                const { layer, alpha } = renderLayer(8000, 3000, createGroup([segmentedBox(7000)]));

                // The mask is smaller than the layer, and its resolution leaves the right of the layer past its canvas.
                const [mask] = inUse(createdSince(before).filter((canvas) => canvas !== layer));
                expect(mask.width).toBeLessThan(7000);
                expect(unbatched.alpha(7120, 65)).toBe(255);
                expect([alpha(7120, 65), alpha(7120, 45), alpha(7120, 85)]).toEqual([255, 255, 255]);
                expect(alpha(7220, 65)).toBe(0);
            });

            describe('a glow with a gap', () => {
                const pixelOf = (layer: OffscreenCanvas, x: number, y: number) =>
                    Array.from(
                        (layer.getContext('2d')! as unknown as CanvasRenderingContext2D).getImageData(x, y, 1, 1).data
                    );

                // The footprint of the item is cut out of the glow on a canvas that fits the glow, not the layer. The large item's
                // glow is itself too large for a canvas, so it is cut at a lower resolution.
                it.each([
                    ['a small item', [20, 40, 40, 50], [40, 65], [64, 65], [80, 65]],
                    ['an item as large as the layer', [20, 20, 4150, 4050], [2000, 2000], [4174, 2000], [4190, 2000]],
                ])(
                    'should cast the glow around %s with the footprint cut out of it',
                    (_name, [x, y, width, height], inside, glow, far) => {
                        const group = createGroup([
                            box(x, y, width, height, { fill: 'rgba(0, 0, 255, 0.5)', fillGlow: GAPPED_GLOW }),
                            box(20, 4000, 40, 50, { fillShadow: RED_HALF }),
                        ]);

                        const { layer } = renderLayer(4200, 4100, group);

                        expect(pixelOf(layer, inside[0], inside[1]).slice(0, 3)).toEqual([0, 0, 255]);
                        expect(pixelOf(layer, glow[0], glow[1])[3]).toBeGreaterThan(0);
                        expect(pixelOf(layer, far[0], far[1])[3]).toBe(0);
                        // The shadow of the other item is cast in the same run.
                        expect(pixelOf(layer, 140, 4025)[3]).toBeGreaterThan(0);
                    }
                );

                // A glow with no fill takes the colour of its item, and a canvas that can tint casts it from one mask of every colour.
                // The cut is made on a canvas that fits the glow, or a lower resolution of it, and is the same either way.
                describe('with no fill', () => {
                    afterEach(() => overrideTintableShadows());

                    it.each([
                        ['a small item', [20, 40, 40, 50], [40, 65], [64, 65], [80, 65]],
                        [
                            'an item as large as the layer',
                            [20, 20, 4150, 4050],
                            [2000, 2000],
                            [4174, 2000],
                            [4190, 2000],
                        ],
                    ])(
                        'should cast the glow of the colour of %s with the footprint cut out, whether or not the canvas can tint',
                        (_name, [x, y, width, height], inside, glow, far) => {
                            const probes = (canTint: boolean) => {
                                overrideTintableShadows(canTint);
                                const group = createGroup([
                                    box(x, y, width, height, {
                                        fill: 'rgba(0, 0, 255, 0.5)',
                                        fillGlow: { ...GAPPED_GLOW, fill: undefined, fillOpacity: 1 },
                                    }),
                                ]);
                                const { layer } = renderLayer(4200, 4100, group);
                                return [inside, glow, far].map(([px, py]) => pixelOf(layer, px, py));
                            };

                            const tinted = probes(true);
                            const perColour = probes(false);

                            for (const [cut, ring, beyond] of [tinted, perColour]) {
                                // Only the item, at half strength, where the glow is cut out of it.
                                expect(cut.slice(0, 3)).toEqual([0, 0, 255]);
                                expect(Math.abs(cut[3] - 128)).toBeLessThanOrEqual(1);
                                // The alpha of the colour applies to the glow once in its colour and once in its strength.
                                expect(ring.slice(0, 3)).toEqual([0, 0, 255]);
                                expect(Math.abs(ring[3] - 64)).toBeLessThanOrEqual(2);
                                expect(beyond[3]).toBe(0);
                            }
                            for (let i = 0; i < tinted.length; i++) {
                                for (let c = 0; c < 4; c++) {
                                    expect(Math.abs(tinted[i][c] - perColour[i][c])).toBeLessThanOrEqual(1);
                                }
                            }
                        }
                    );
                });

                it('should cast the glow without the cut, and the shadows beside it, when no canvas can cut it', () => {
                    const group = createGroup([
                        box(20, 40, 40, 50, { fill: 'rgba(0, 0, 255, 0.5)', fillGlow: GAPPED_GLOW }),
                        box(20, 130, 40, 50, { fillShadow: RED_HALF }),
                    ]);
                    const layer = new OffscreenCanvas(WIDTH, HEIGHT);

                    // The glow's cast makes its scratch canvas, then the canvas that the gap is cut on, which is refused.
                    const getContext = OffscreenCanvas.prototype.getContext;
                    const canvases: OffscreenCanvas[] = [];
                    const refuseGapCanvas = vi
                        .spyOn(OffscreenCanvas.prototype, 'getContext')
                        .mockImplementation(function (this: OffscreenCanvas, ...args: Parameters<typeof getContext>) {
                            if (!canvases.includes(this)) canvases.push(this);
                            return canvases.indexOf(this) === 1 ? null : getContext.apply(this, args);
                        } as typeof getContext);
                    try {
                        drawOnLayer(group, layer);
                    } finally {
                        refuseGapCanvas.mockRestore();
                    }

                    expect(canvases.length).toBeGreaterThan(1);
                    const inside = pixelOf(layer, 40, 65);
                    expect(inside[0]).toBeGreaterThan(0);
                    expect(inside[2]).toBeGreaterThan(0);
                    expect(pixelOf(layer, 64, 65)[3]).toBeGreaterThan(0);
                    expect(pixelOf(layer, 140, 155)[3]).toBeGreaterThan(0);
                });
            });
        });

        it('should share one scratch canvas between the groups of a scene', () => {
            const before = offscreenCanvases();
            const scene = newScene();
            const batching = [0, 1, 2].map((i) =>
                createGroup([shadowed(10, 10 + i * 60), shadowed(120, 10 + i * 60)], false)
            );
            setRoot(scene, ...batching);
            scene.render();
            const unbatched = inUse(createdSince(before)).length;

            for (const group of batching) group.batchShadows = true;
            scene.render();

            expect(inUse(createdSince(before)).length - unbatched).toBe(1);
        });

        it('should grow the scratch canvas to fit layers of different proportions', () => {
            const wideLayer = new OffscreenCanvas(400, 200);
            const tallLayer = new OffscreenCanvas(200, 400);
            const wide = createGroup([shadowed(10, 10), shadowed(10, 80)]);
            const tall = createGroup([shadowed(10, 10), shadowed(10, 80)]);
            const before = offscreenCanvases();

            drawOnLayer(wide, wideLayer);
            drawOnLayer(tall, tallLayer);

            // The canvas that fits the wide layer is replaced by one that fits both, which neither group replaces again.
            const [scratch] = inUse(createdSince(before));
            // The mask reaches 100 further than a layer, for the offset of the shadow, so 500 across the wide one and
            // 300 across the tall one.
            expect(scratch.width).toBe(500);
            expect(scratch.height).toBe(400);

            drawOnLayer(wide, wideLayer);
            drawOnLayer(tall, tallLayer);

            // A redraw that changed nothing keeps its shadows on canvases the size of the layer, but not on another scratch.
            const scratches = inUse(createdSince(before)).filter(({ width }) => width === scratch.width);
            expect(scratches).toEqual([scratch]);
        });

        it('should free the scratch canvas when shadows switch off', () => {
            const before = offscreenCanvases();
            const scene = newScene();
            const nodes = [shadowed(10, 10), shadowed(10, 80), shadowed(10, 150), shadowed(120, 150)];
            setRoot(scene, createGroup(nodes.slice(0, 2)), createGroup(nodes.slice(2)));
            scene.render();

            const [scratch] = inUse(createdSince(before));
            expect(scratch).toBeDefined();

            // The second group still batches, and keeps the canvas.
            for (const node of nodes.slice(0, 2)) node.fillShadow = undefined;
            scene.render();
            expect(scratch.width).toBeGreaterThan(0);

            for (const node of nodes.slice(2)) node.fillShadow = undefined;
            scene.render();
            expect(scratch.width).toBe(0);
            expect(scratch.height).toBe(0);
        });

        it('should free the scratch canvas when the scene is destroyed', () => {
            const before = offscreenCanvases();
            const scene = newScene();
            setRoot(scene, createGroup([shadowed(10, 10), shadowed(10, 80)]));
            scene.render();

            const [scratch] = inUse(createdSince(before));
            expect(scratch).toBeDefined();

            scene.destroy();
            expect(scratch.width).toBe(0);
        });

        it('should not share a scratch canvas between scenes', () => {
            const before = offscreenCanvases();
            const first = newScene();
            const second = newScene();
            setRoot(first, createGroup([shadowed(10, 10), shadowed(10, 80)]));
            setRoot(second, createGroup([shadowed(10, 10), shadowed(10, 80)]));
            first.render();
            second.render();
            const scratches = inUse(createdSince(before));
            expect(scratches).toHaveLength(2);

            first.destroy();

            expect(inUse(scratches)).toHaveLength(1);
        });
    });
    describe('shadow cache', () => {
        // The x of each caster that drew into a mask, which is how a cast that blurred again shows itself.
        let masked: number[] = [];
        let failing = false;

        class TestRect extends Rect {
            override isolatedRender(renderCtx: RenderContext) {
                if (shadowPass.state === 'mask') masked.push(this.x);
                return super.isolatedRender(renderCtx);
            }

            override render(renderCtx: RenderContext) {
                if (failing && shadowPass.state === 'mask') throw new Error('mask failure');
                super.render(renderCtx);
            }
        }

        beforeEach(() => {
            masked = [];
            failing = false;
            vi.spyOn(console, 'warn').mockImplementation(() => {});
        });

        afterEach(() => {
            vi.mocked(console.warn).mockRestore();
        });

        const SHADOW = { ...RED_HALF, blur: 4 };

        const caster = (x: number, mixin: Partial<Rect> = {}) => {
            const node = new TestRect();
            Object.assign(node, { x, y: 40, width: 40, height: 40, fill: 'black', fillShadow: SHADOW, ...mixin });
            return node;
        };

        const scene = () => [caster(20), caster(120), box(220, 40, 40, 40)];

        // A layer for each caster, each of which casts for itself because they differ in zIndex.
        const layers = (count: number) =>
            createGroup(
                Array.from({ length: count }, (_, i) => caster(20 + i * 50, { y: 40 + i * 10, zIndex: i })),
                'by-layer'
            );

        const expectSamePixels = (actual: number[], expected: number[]) => {
            expect(actual).toHaveLength(expected.length);
            expect(actual.every((value, i) => Math.abs(value - expected[i]) <= 1)).toBe(true);
        };

        const redraw = (group: Group, devicePixelRatio = 1, direction: 'ltr' | 'rtl' = 'ltr') => {
            renderGroup(group, devicePixelRatio, direction);
            const result = { pixels: pixels(), masked };
            masked = [];
            return result;
        };

        // What a draw must show whatever a cache did: the same scene, changed the same way, drawn the first time.
        const direct = (make: () => Group, change: (group: Group) => void, devicePixelRatio = 1) => {
            const group = make();
            change(group);
            const { pixels: expected } = redraw(group, devicePixelRatio);
            return expected;
        };

        const sceneGroup = () => createGroup(scene());

        // A cast keeps its shadows once it repeats, so the group is drawn until the next draw would blit them.
        const kept = (make: () => Group = sceneGroup) => {
            const group = make();
            redraw(group);
            redraw(group);
            expect(paintedPixels()).toBeGreaterThan(0);
            return group;
        };

        const nothing = () => {};

        it('should blit the shadows again when a redraw changed none of the casters', () => {
            const group = kept();

            group.markDirty();
            const { pixels: actual, masked: casts } = redraw(group);

            expect(casts).toEqual([]);
            expectSamePixels(actual, direct(sceneGroup, nothing));
        });

        it('should blit the shadows again when only a node that casts none changed', () => {
            const group = kept();
            const move = (target: Group) => {
                const plain = [...target.children()].find(
                    (child) => child instanceof Rect && child.__fillShadow == null
                );
                (plain as Rect).x = 300;
            };

            move(group);
            const { pixels: actual, masked: casts } = redraw(group);

            expect(casts).toEqual([]);
            expectSamePixels(actual, direct(sceneGroup, move));
        });

        // The first draw after a change casts again, as does the next, which fills the cache, and the third blits that.
        it.each([
            [
                'the shadow options',
                (group: Group) => {
                    ([...group.children()][0] as Rect).fillShadow = { ...SHADOW, xOffset: 60 };
                },
                1,
                [20, 120],
            ],
            [
                'the geometry of a caster',
                (group: Group) => {
                    ([...group.children()][0] as Rect).width = 80;
                },
                1,
                [20, 120],
            ],
            [
                'the visibility of a caster',
                (group: Group) => {
                    ([...group.children()][0] as Rect).visible = false;
                },
                1,
                [120],
            ],
            [
                'the opacity of the group',
                (group: Group) => {
                    group.opacity = 0.5;
                },
                1,
                [20, 120],
            ],
            [
                'the casters of the group',
                (group: Group) => {
                    [...group.children()][0].remove();
                },
                1,
                [120],
            ],
            ['the pixel ratio', nothing, 2, [20, 120]],
        ])('should cast the shadows again when %s changed', (_name, change, ratio, expectedMasked) => {
            const group = kept();
            const expected = direct(sceneGroup, change, ratio);

            change(group);
            const first = redraw(group, ratio);
            const second = redraw(group, ratio);
            const third = redraw(group, ratio);

            expect(first.masked).toEqual(expectedMasked);
            expectSamePixels(first.pixels, expected);
            expect(second.masked).toEqual(expectedMasked);
            expectSamePixels(second.pixels, expected);
            expect(third.masked).toEqual([]);
            expectSamePixels(third.pixels, expected);
        });

        // The item is clear of the layer's origin, so the kept canvas is offset from it, and the cut is made on that offset.
        it('should cut a glow with a gap the same from what it kept as it drew at first', () => {
            const group = createGroup([
                caster(60, { fill: 'rgba(0, 0, 255, 0.5)', fillShadow: undefined, fillGlow: GAPPED_GLOW }),
                box(220, 40, 40, 40),
            ]);

            const first = redraw(group);
            const second = redraw(group);
            const third = redraw(group);

            // The first draw casts directly, the second fills the cache, and the third blits it, with no cast.
            expect(first.masked).toContain(60);
            expect(second.masked).toContain(60);
            expect(third.masked).toEqual([]);
            expectSamePixels(second.pixels, first.pixels);
            expectSamePixels(third.pixels, first.pixels);
            expect(at(80, 60)).toEqual(BLUE_PIXEL.map((value, i) => (i === 3 ? 128 : value)));
            expect(at(106, 60)[3]).toBeGreaterThan(0);
        });

        // A kept glow is cut with the gap it was cast with, so a change of the gap alone, with the same casters, casts it again.
        // The probe is where the two gaps differ: inside the item, and in the ring between the item and a gap of 5.
        it.each([
            ['unset to 0', undefined, 0, { x: 80, y: 60 }],
            ['0 to 5', 0, 5, { x: 57, y: 60 }],
        ])('should cast a kept glow again when its gap changed from %s', (_name, from, to, probe) => {
            const glow = (gap: number | undefined): Rect['fillGlow'] => ({
                ...GAPPED_GLOW,
                gap,
            });
            const make = (gap: number | undefined) => () =>
                createGroup([
                    caster(60, { fill: 'rgba(0, 0, 255, 0.5)', fillShadow: undefined, fillGlow: glow(gap) }),
                    box(220, 40, 40, 40),
                ]);
            const change = (target: Group) => {
                ([...target.children()][0] as Rect).fillGlow = glow(to);
            };
            const expected = direct(make(to), nothing);
            const group = kept(make(from));
            const before = redraw(group).pixels;
            const probed = (data: number[]) => {
                const i = (probe.y * WIDTH + probe.x) * 4;
                return data.slice(i, i + 4);
            };
            expect(probed(before)).not.toEqual(probed(expected));

            change(group);
            const first = redraw(group);
            const second = redraw(group);
            const third = redraw(group);

            expect(first.masked).toContain(60);
            expect(second.masked).toContain(60);
            expect(third.masked).toEqual([]);
            for (const draw of [first, second, third]) {
                expectSamePixels(draw.pixels, expected);
            }
        });

        it.each([
            ['a glow with a gap', GAPPED_GLOW],
            ['a glow with no gap', { ...GAPPED_GLOW, gap: undefined }],
        ])('should measure each caster of %s once when it fills the cache', (_name, fillGlow) => {
            const measured = vi.spyOn(Rect.prototype, 'getShadowSilhouetteBounds');
            const group = createGroup([
                caster(60, { fill: 'rgba(0, 0, 255, 0.5)', fillShadow: undefined, fillGlow }),
                caster(140, { fill: 'rgba(0, 0, 255, 0.5)', fillShadow: undefined, fillGlow }),
                box(220, 40, 40, 40),
            ]);
            redraw(group);
            measured.mockClear();

            // The second draw of a cast fills the cache, so it measures the casters for the cache and for the cut.
            redraw(group);

            expect(measured).toHaveBeenCalledTimes(2);
            measured.mockRestore();
        });

        it('should keep the shadow of another item showing through an item with a gap of 0, from what it kept', () => {
            const GREEN = { ...RED_HALF, fill: 'rgba(0, 255, 0, 1)', xOffset: 50 };
            const translucent = { fill: 'rgba(0, 0, 255, 0.5)', fillShadow: undefined };
            const make = (fillGlow?: Rect['fillGlow']) => () =>
                createGroup([
                    caster(20, { fill: 'black', fillShadow: GREEN }),
                    caster(60, { ...translucent, fillGlow }),
                    box(220, 40, 40, 40),
                ]);
            redraw(make()());
            const expected = at(85, 60);
            expect(expected[1]).toBeGreaterThan(100);

            const group = make(GAPPED_GLOW)();
            const first = redraw(group);
            const second = redraw(group);
            const third = redraw(group);

            expect(first.masked).toContain(60);
            expect(second.masked).toContain(60);
            expect(third.masked).toEqual([]);
            expectSamePixels(third.pixels, first.pixels);
            for (const draw of [first, second, third]) {
                const pixel = draw.pixels.slice((60 * WIDTH + 85) * 4, (60 * WIDTH + 85) * 4 + 4);
                expect(pixel.every((value, i) => Math.abs(value - expected[i]) <= 1)).toBe(true);
            }
            expect(at(80, 36)[3]).toBeGreaterThan(0);
        });

        it('should free its canvas when the shadows changed, and keep the shadows again once the cast repeats', () => {
            const before = offscreenCanvases();
            const group = kept();
            const held = inUse(createdSince(before));
            expect(held).not.toHaveLength(0);
            // Both casters, so that the run stays one cast with one canvas.
            const change = (target: Group) => {
                for (const child of [...target.children()].slice(0, 2)) {
                    (child as Rect).fillShadow = { ...SHADOW, xOffset: 60 };
                }
            };

            change(group);
            redraw(group);
            // Only the scratch canvas of the scene remains.
            expect(inUse(held)).toHaveLength(1);

            redraw(group);
            const { pixels: actual, masked: casts } = redraw(group);
            expect(casts).toEqual([]);
            expectSamePixels(actual, direct(sceneGroup, change));
        });

        it('should keep every pixel of shadows that reach far past casters with a stroke, a spread and a long blur', () => {
            const reaching = () =>
                createGroup([
                    caster(20, {
                        stroke: 'blue',
                        strokeWidth: 8,
                        lineJoin: 'miter',
                        fillShadow: { ...RED_HALF, blur: 16, spread: 6, xOffset: 30, yOffset: -20 },
                    }),
                    caster(150, {
                        stroke: 'blue',
                        strokeWidth: 8,
                        lineJoin: 'miter',
                        fillShadow: { ...RED_HALF, blur: 16, spread: 6, xOffset: 30, yOffset: -20 },
                    }),
                ]);

            const group = reaching();
            for (let i = 0; i < 2; i++) redraw(group, 2);
            const { pixels: actual, masked: casts } = redraw(group, 2);

            expect(paintedPixels()).toBeGreaterThan(0);
            expect(casts).toEqual([]);
            expectSamePixels(actual, direct(reaching, nothing, 2));
        });

        // A transform moves the casters without marking any of them changed, so the transform is part of what is compared.
        it.each([
            ['translated across', (group: TransformableGroup) => (group.translationX = 30)],
            ['translated down', (group: TransformableGroup) => (group.translationY = 30)],
            [
                'rotated',
                // About the origin, so that only the linear part of the transform changes.
                (group: TransformableGroup) => {
                    group.rotation = 0.4;
                },
            ],
        ])('should cast the shadows again when the group is %s, with no caster changed', (_name, transform) => {
            const make = () => {
                const group = new TransformableGroup({ name: 'shadow-group' });
                group.batchShadows = true;
                for (const child of scene()) group.appendChild(child);
                groups.push(group);
                return group;
            };
            const group = kept(make);
            const move = (target: Group) => transform(target as TransformableGroup);
            const expected = direct(make, move);

            move(group);
            const first = redraw(group);
            const second = redraw(group);
            const third = redraw(group);

            expect(first.masked).toEqual([20, 120]);
            expectSamePixels(first.pixels, expected);
            expect(second.masked).toEqual([20, 120]);
            expect(third.masked).toEqual([]);
            expectSamePixels(third.pixels, expected);
        });

        // The shadows that were kept for a layer are no use on another size, where they would be cut off or misplaced.
        it.each([
            ['wider', 600, HEIGHT],
            ['taller', WIDTH, 400],
        ])('should cast the shadows again when the layer is %s', (_name, width, height) => {
            const make = () => createGroup([caster(20), caster(420), caster(20, { y: 300 })]);
            const draw = (group: Group, layer: OffscreenCanvas) => {
                const layerCtx = layer.getContext('2d')! as unknown as CanvasRenderingContext2D;
                layerCtx.clearRect(0, 0, layer.width, layer.height);
                drawOnLayer(group, layer);
                const alphas = [
                    [140, 60],
                    [540, 60],
                    [140, 320],
                ].map(([x, y]) => layerCtx.getImageData(x, y, 1, 1).data[3]);
                const result = { alphas, masked };
                masked = [];
                return result;
            };
            const small = new OffscreenCanvas(WIDTH, HEIGHT);
            const large = new OffscreenCanvas(width, height);

            const group = make();
            draw(group, small);
            draw(group, small);
            const expected = draw(make(), large).alphas;
            expect(expected.some((alpha) => alpha > 0)).toBe(true);

            const first = draw(group, large);
            const second = draw(group, large);
            const third = draw(group, large);

            expect(first.masked).toEqual([20, 420, 20]);
            expect(first.alphas).toEqual(expected);
            expect(second.masked).toEqual([20, 420, 20]);
            expect(third.masked).toEqual([]);
            expect(third.alphas).toEqual(expected);
        });

        describe('a clipped path', () => {
            let casts: number[] = [];

            class TestPath extends Path {
                marker = 0;

                override isolatedRender(renderCtx: RenderContext) {
                    if (shadowPass.state === 'mask') casts.push(this.marker);
                    return super.isolatedRender(renderCtx);
                }
            }

            const clipped = (tag: number, y: number, clipX: number) => {
                const node = new TestPath();
                Object.assign(node, { marker: tag, fill: 'black', fillShadow: { ...SHADOW, xOffset: 30 }, clip: true });
                node.path.rect(20, y, 60, 50);
                node.clipX = clipX;
                node.clipY = HEIGHT;
                return node;
            };
            const makeClipped = () => createGroup([clipped(1, 20, 90), clipped(2, 100, 90)]);

            it('should cast the shadows again when the clip changed, with the same casters', () => {
                const group = kept(makeClipped);
                casts = [];
                const change = (target: Group) => {
                    for (const child of target.children()) (child as Path).clipX = 70;
                };
                const expected = direct(makeClipped, change);
                casts = [];

                change(group);
                const first = redraw(group);
                const firstCasts = casts;
                casts = [];
                redraw(group);
                casts = [];
                const third = redraw(group);

                expect(firstCasts).toEqual([1, 2]);
                expectSamePixels(first.pixels, expected);
                expect(casts).toEqual([]);
                expectSamePixels(third.pixels, expected);
            });
        });

        describe('the casts of a frame', () => {
            // Two runs, because their shadow options differ, so two casts and a cache for each.
            const twoRuns = () => [caster(20), caster(120, { fillShadow: { ...SHADOW, xOffset: 60 } })];

            it('should free the shadows that a cast kept when the group makes fewer casts', () => {
                const before = offscreenCanvases();
                const group = kept(() => createGroup(twoRuns()));
                const held = inUse(createdSince(before));
                // The scratch canvas, and a cache for each cast.
                expect(held).toHaveLength(3);

                [...group.children()][1].remove();
                const { pixels: actual, masked: casts } = redraw(group);

                const after = inUse(held);
                expect(after).toHaveLength(2);
                // The first cast still blits what it kept.
                expect(casts).toEqual([]);
                expectSamePixels(
                    actual,
                    direct(
                        () => createGroup(twoRuns()),
                        (target) => [...target.children()][1].remove()
                    )
                );
            });
        });

        describe('a group by layer', () => {
            it('should blit the shadows of every layer again when a redraw changed none of them', () => {
                const group = kept(() => layers(3));

                const { pixels: actual, masked: casts } = redraw(group);

                expect(casts).toEqual([]);
                expectSamePixels(
                    actual,
                    direct(() => layers(3), nothing)
                );
            });

            it('should cast again only the layer that changed', () => {
                const group = kept(() => layers(3));
                const change = (target: Group) => {
                    ([...target.children()][1] as Rect).width = 80;
                };
                const expected = direct(() => layers(3), change);

                change(group);
                const first = redraw(group);
                const second = redraw(group);
                const third = redraw(group);

                // The middle layer has x of 70.
                expect(first.masked).toEqual([70]);
                expect(second.masked).toEqual([70]);
                expect(third.masked).toEqual([]);
                expectSamePixels(first.pixels, expected);
                expectSamePixels(third.pixels, expected);
            });

            // A group keeps only so many casts, so those beyond them are cast every frame, and must still draw the same.
            it('should cast the layers beyond those that it keeps every frame, and draw the same', () => {
                const group = kept(() => layers(6));
                const expected = direct(() => layers(6), nothing);

                const { pixels: actual, masked: casts } = redraw(group);

                expect(casts).toEqual([220, 270]);
                expectSamePixels(actual, expected);
            });
        });

        describe('what it holds', () => {
            describe('in a scene', () => {
                const newScene = () => new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });

                // Two groups, each with a cast that repeats, so that each holds a kept cache beside the scene's one scratch canvas.
                const keptInScene = () => {
                    const before = offscreenCanvases();
                    const chart = newScene();
                    const first = createGroup([caster(20), caster(120)]);
                    const second = createGroup([caster(20), caster(120)]);
                    const root = new Group({ name: 'root' });
                    root.appendChild(first);
                    root.appendChild(second);
                    chart.setRoot(root);
                    chart.render();
                    first.markDirty();
                    second.markDirty();
                    chart.render();

                    const held = inUse(createdSince(before));
                    // The scratch canvas, and a cache for each group.
                    expect(held).toHaveLength(3);
                    return { chart, first, second, held };
                };

                it('should free the shadows that a group kept when it leaves the scene, and no others', () => {
                    const { chart, first, held } = keptInScene();

                    first.remove();

                    // The scratch canvas, which the other group still uses, and the cache of the other group.
                    expect(inUse(held)).toHaveLength(2);
                    chart.destroy();
                });

                it('should free the shadows that the groups of a scene kept when the scene is destroyed', () => {
                    const { chart, held } = keptInScene();

                    chart.destroy();

                    expect(inUse(held)).toHaveLength(0);
                });
            });

            it('should free the shadows that it kept when the group is hidden, and keep them again once it is shown', () => {
                const before = offscreenCanvases();
                const group = kept();
                const held = inUse(createdSince(before));
                expect(held).not.toHaveLength(0);

                group.visible = false;
                renderGroup(group);
                expect(inUse(held)).toHaveLength(0);

                group.visible = true;
                redraw(group);
                redraw(group);
                const { pixels: actual, masked: casts } = redraw(group);
                expect(casts).toEqual([]);
                expectSamePixels(actual, direct(sceneGroup, nothing));
            });

            it('should free the shadows that it kept when no caster of the group is visible', () => {
                const before = offscreenCanvases();
                const group = kept();
                const held = inUse(createdSince(before));
                expect(held).not.toHaveLength(0);

                for (const child of group.children()) child.visible = false;
                renderGroup(group);

                expect(inUse(held)).toHaveLength(0);
            });

            // A kept cast holds a canvas as large as its shadows reach, and a scene holds no more pixels in them than its budget.
            describe.each([
                ['small casters', 3000, 3000, {}, 2],
                ['casters as large as the layer', 2000, 2000, { width: 2000, height: 2000 }, 1],
                ['small casters', 4200, 4100, {}, 0],
            ])('%s on a layer of %i x %i', (_name, width, height, size, expectedKept) => {
                it(`should keep the shadows of ${expectedKept} of its 2 casts, and draw the same either way`, () => {
                    const make = () =>
                        createGroup(
                            [caster(20, { ...size, zIndex: 0 }), caster(220, { ...size, zIndex: 1 })],
                            'by-layer'
                        );
                    const alphasOf = (layer: OffscreenCanvas) => {
                        const layerCtx = layer.getContext('2d')! as unknown as CanvasRenderingContext2D;
                        return [140, 340].map((x) => layerCtx.getImageData(x, 60, 1, 1).data[3]);
                    };

                    const reference = new OffscreenCanvas(width, height);
                    drawOnLayer(make(), reference);
                    const expected = alphasOf(reference);
                    expect(expected.every((alpha) => alpha > 0)).toBe(true);

                    const before = offscreenCanvases();
                    const group = make();
                    const layer = new OffscreenCanvas(width, height);
                    const layerCtx = layer.getContext('2d')! as unknown as CanvasRenderingContext2D;
                    for (let i = 0; i < 3; i++) {
                        masked = [];
                        layerCtx.clearRect(0, 0, width, height);
                        drawOnLayer(group, layer);
                    }

                    // The third draw blits what the second kept, so it blurs only the casts that were not kept.
                    expect(masked).toHaveLength(2 - expectedKept);
                    const layerSized = createdSince(before).filter(
                        (canvas) => canvas !== layer && canvas.width === width && canvas.height === height
                    );
                    expect(inUse(layerSized)).toHaveLength(0);
                    expect(alphasOf(layer)).toEqual(expected);
                });
            });
        });

        describe('a caster that fails to draw', () => {
            it('should not keep the shadows of a cast that failed, and cast again until it draws', () => {
                const group = kept();
                const change = (target: Group) => {
                    ([...target.children()][0] as Rect).x = 30;
                };
                change(group);
                failing = true;
                redraw(group);
                redraw(group);

                // The cast fills the cache, but a caster failed to draw into it, so it is not blitted.
                const stillFailing = redraw(group);
                expect(stillFailing.masked).not.toEqual([]);

                failing = false;
                const recovered = redraw(group);
                const blitted = redraw(group);

                expect(recovered.masked).not.toEqual([]);
                expect(blitted.masked).toEqual([]);
                expectSamePixels(blitted.pixels, direct(sceneGroup, change));
            });
        });

        // A caster with a transform of its own widens its stroke and spread with it, which the kept canvas must reach.
        describe('a caster with a transform of its own', () => {
            const ScalableRect = Scalable(Rect);

            const scaled = (x: number) => {
                const node = new ScalableRect();
                Object.assign(node, {
                    x,
                    y: 10,
                    width: 15,
                    height: 15,
                    fill: 'black',
                    stroke: 'black',
                    strokeWidth: 6,
                    lineJoin: 'round',
                    scalingX: 4,
                    scalingY: 4,
                    fillShadow: { ...SHADOW, xOffset: 60, spread: 10 },
                });
                return node;
            };
            const makeScaled = () => createGroup([scaled(5), scaled(40)]);

            it('should draw the same shadows from what it kept as it drew at first', () => {
                const group = kept(makeScaled);
                const expected = direct(makeScaled, nothing);

                const { pixels: actual, masked: casts } = redraw(group);

                expect(casts).toEqual([]);
                expect(paintedPixels()).toBeGreaterThan(0);
                expectSamePixels(actual, expected);
            });
        });

        // A cast keeps the shadows within its casters' bounds, so a caster that draws past them must keep the whole layer.
        describe('a caster that draws past its bounds', () => {
            // The path of a bevelled column starts its inner arc closer to the centre than the bounds that its radii give.
            const TranslatableColumn = Translatable(RadialColumnShape);

            const column = (x: number, mixin: Partial<RadialColumnShape> = {}) => {
                const node = new TranslatableColumn();
                Object.assign(node, {
                    translationX: x,
                    translationY: 200,
                    // Pointing up, with an inner radius of 100 and a column 160 wide, so its inner corners are 40 above the arc's ends.
                    startAngle: -Math.PI / 2 - 0.1,
                    endAngle: -Math.PI / 2 + 0.1,
                    columnWidth: 160,
                    innerRadius: 100,
                    outerRadius: 150,
                    axisInnerRadius: 100,
                    axisOuterRadius: 150,
                    fill: 'black',
                    stroke: undefined,
                    strokeWidth: 0,
                    fillShadow: { ...SHADOW, xOffset: 0, yOffset: 30, blur: 2 },
                    ...mixin,
                });
                return node;
            };

            // Its bounds are a 10px corner of a path that is 100px across.
            class Overhang extends Path {
                protected override computeBBox() {
                    return new BBox(20, 40, 10, 10);
                }

                protected override hasBoundedSilhouette() {
                    return false;
                }
            }

            const overhang = (x: number) => {
                const node = new Overhang();
                Object.assign(node, {
                    fill: 'black',
                    stroke: undefined,
                    strokeWidth: 0,
                    fillShadow: { ...SHADOW, xOffset: 0, yOffset: 30, blur: 2 },
                });
                node.path.rect(x, 40, 100, 100);
                return node;
            };

            const makeColumn = () => createGroup([column(120), column(300, { columnWidth: 100 })]);
            const makeOverhang = () => createGroup([overhang(20), overhang(200)]);

            it.each([
                ['a bevelled radial column touching the inner radius', makeColumn],
                ['a caster whose path is not bounded by its bounds', makeOverhang],
            ])('should draw the same shadows of %s from what it kept as it drew at first', (_name, make) => {
                const group = kept(make);
                const expected = direct(make, nothing);
                expect(paintedPixels()).toBeGreaterThan(0);

                const { pixels: actual, masked: casts } = redraw(group);

                expect(casts).toEqual([]);
                expectSamePixels(actual, expected);
            });

            it('should draw the same shadows of a column from what it kept after it changed, as at first', () => {
                const change = (target: Group) => {
                    ([...target.children()][0] as RadialColumnShape).outerRadius = 140;
                };
                const group = kept(makeColumn);
                change(group);
                redraw(group);
                redraw(group);

                const { pixels: actual } = redraw(group);

                expectSamePixels(actual, direct(makeColumn, change));
            });
        });

        // A cast that was refused room does not measure its casters, or ask for a canvas, until it could be given one.
        describe('a cast that was refused room', () => {
            const SIZE = 2000;
            // Each caster is as large as the layer, so that the kept shadows of one fill most of the budget and a second would not fit.
            // They differ in x, which is how a cast that blurred again shows itself.
            const makeLayers = () => {
                const casters = [20, 21].map((x, i) => caster(x, { width: SIZE, height: SIZE, zIndex: i }));
                const measures = casters.map((node) => vi.spyOn(node, 'getShadowSilhouetteBounds'));
                return { group: createGroup(casters, 'by-layer'), casters, measures };
            };

            const drawLayer = (group: Group, layer: OffscreenCanvas) => {
                masked = [];
                const layerCtx = layer.getContext('2d')! as unknown as CanvasRenderingContext2D;
                layerCtx.clearRect(0, 0, SIZE, SIZE);
                drawOnLayer(group, layer);
                return { masked, alpha: layerCtx.getImageData(300, 60, 1, 1).data[3] };
            };

            it('should not measure the casters of a cast that did not fit again, and keep its shadows once it does', () => {
                const { group, casters, measures } = makeLayers();
                const [first, second] = measures;
                const layer = new OffscreenCanvas(SIZE, SIZE);

                // A cast that is not kept measures its casters once, to clip its blur to them.
                drawLayer(group, layer);
                expect(first).toHaveBeenCalledTimes(1);
                const repeated = drawLayer(group, layer);
                // Both casts repeat, so both measure what they would keep, and the second finds no room for it.
                expect(first).toHaveBeenCalledTimes(2);
                expect(second).toHaveBeenCalledTimes(2);
                expect(repeated.masked).toEqual([20, 21]);
                expect(repeated.alpha).toBeGreaterThan(0);

                // The first blits what it kept, and the second, which could not keep any, casts again without measuring.
                const refused = drawLayer(group, layer);
                expect(first).toHaveBeenCalledTimes(2);
                expect(second).toHaveBeenCalledTimes(2);
                expect(refused.masked).toEqual([21]);
                expect(refused.alpha).toEqual(repeated.alpha);

                // The first casts again once it moves, which frees what it held, so the second measures and keeps its shadows.
                casters[0].x = 22;
                const freed = drawLayer(group, layer);
                expect(second).toHaveBeenCalledTimes(3);
                expect(freed.masked).toEqual([22, 21]);
                const blitted = drawLayer(group, layer);
                expect(second).toHaveBeenCalledTimes(3);
                expect(blitted.masked).not.toContain(21);
                expect(blitted.alpha).toBeGreaterThan(0);
            });
        });

        // The bounds of a text follow the direction of the scene, and are not marked changed when it switches.
        describe('a text caster', () => {
            const makeScene = () => {
                const chart = new Scene({ canvasElement: document.createElement('canvas'), pixelRatio: 1 });
                chart.resize(WIDTH, HEIGHT, 1);
                const text = new Text();
                Object.assign(text, {
                    x: 200,
                    y: 100,
                    text: 'Shadow',
                    fontSize: 40,
                    fontFamily: 'Arial',
                    fill: 'black',
                    textAlign: 'start',
                    textBaseline: 'middle',
                    fillShadow: { ...SHADOW, xOffset: 30, blur: 2 },
                });
                const group = createGroup([text]);
                const root = new Group({ name: 'root' });
                root.appendChild(group);
                chart.setRoot(root);
                return { chart, group };
            };

            const draw = (chart: Scene, group: Group, rtl: boolean) => {
                chart.setDirection(rtl);
                group.markDirty();
                chart.render();
                const { width, height } = chart.canvas;
                return Array.from(chart.canvas.context.getImageData(0, 0, width, height).data);
            };

            it('should draw the same shadows from what it kept after the direction switched as a first draw', () => {
                const { chart, group } = makeScene();
                draw(chart, group, false);
                draw(chart, group, false);
                const ltr = draw(chart, group, false);
                expect(ltr.some((value) => value !== 0)).toBe(true);

                draw(chart, group, true);
                draw(chart, group, true);
                const afterSwitch = draw(chart, group, true);

                const reference = makeScene();
                const expected = draw(reference.chart, reference.group, true);
                expect(expected).not.toEqual(ltr);
                expectSamePixels(afterSwitch, expected);
                chart.destroy();
                reference.chart.destroy();
            });
        });

        describe('text direction', () => {
            it('should cast the shadows again when the direction changed, and keep them again after', () => {
                const group = kept();

                const first = redraw(group, 1, 'rtl');
                redraw(group, 1, 'rtl');
                const third = redraw(group, 1, 'rtl');

                expect(first.masked).toEqual([20, 120]);
                expect(third.masked).toEqual([]);
                expectSamePixels(third.pixels, direct(sceneGroup, nothing));
            });
        });
    });

    describe('shadow engine', () => {
        const renderContext = (): RenderContext => ({
            ctx: ctx(),
            direction: 'ltr',
            width: WIDTH,
            height: HEIGHT,
            devicePixelRatio: 1,
            logger: new Logger(),
            debugNodes: {},
        });

        const keyOf = (caster: Shape, shadow: ResolvedDropShadowOptions): ShadowKey => ({
            slot: 'shadow',
            shadow,
            clip: undefined,
            casters: [caster],
        });

        it('should draw no shadow at all when one of its keys can not be cast', () => {
            clearCanvas();
            const first = box(20, 40, 40, 40, { fillShadow: BLUE });
            const second = box(20, 130, 40, 40, { fillShadow: BLUE });
            const user = createGroup([first, second]);
            user.preRender(renderContext());
            const keys = (blur: number) => [keyOf(first, BLUE), keyOf(second, { ...BLUE, blur })];
            const drawImage = vi.spyOn(ctx(), 'drawImage');

            expect(castShadows({ scene: undefined, user, keys: keys(Number.NaN), index: 0 }, renderContext())).toBe(
                false
            );
            expect(drawImage).not.toHaveBeenCalled();
            expect(paintedPixels()).toBe(0);

            expect(castShadows({ scene: undefined, user, keys: keys(0), index: 0 }, renderContext())).toBe(true);
            expect(paintedPixels()).toBeGreaterThan(0);
        });

        // The casters of the keys are the same node throughout, so only the gap of the shadow tells a kept cast to be made again.
        it.each([
            ['unset to 0', undefined, 0, { x: 80, y: 60 }],
            ['0 to 5', 0, 5, { x: 57, y: 60 }],
        ])('should cast a kept glow again when only its gap changed from %s', (_name, from, to, probe) => {
            const glowWith = (gap: number | undefined): ResolvedDropShadowOptions =>
                gap == null ? { ...IN_PLACE, spread: 8, glow: true } : { ...IN_PLACE, spread: 8, gap, glow: true };
            // The node keeps the glow it has, as only the key's shadow changes between the casts.
            const item = box(60, 40, 40, 40, { fill: 'rgba(0, 0, 255, 0.5)', fillGlow: glowWith(from) });
            createGroup([item]).preRender(renderContext());
            const cast = (user: object, gap: number | undefined) => {
                clearCanvas();
                const key: ShadowKey = { ...keyOf(item, glowWith(gap)), slot: 'glow' };
                castShadows({ scene: undefined, user, keys: [key], index: 0 }, renderContext());
                return pixels();
            };
            const probed = (data: number[]) => data.slice((probe.y * WIDTH + probe.x) * 4).slice(0, 4);
            const expected = cast({}, to);
            const user = {};

            // The second cast fills the cache and the third blits it.
            const [, , before] = [cast(user, from), cast(user, from), cast(user, from)];
            expect(probed(before)).not.toEqual(probed(expected));
            const first = cast(user, to);
            const second = cast(user, to);
            const third = cast(user, to);

            for (const actual of [first, second, third]) {
                expect(actual).toHaveLength(expected.length);
                expect(actual.every((value, i) => Math.abs(value - expected[i]) <= 1)).toBe(true);
            }
        });

        // A group casts each run of children that share a shadow in a call of its own, so a run that can't be cast falls back
        // alone. The runs that the group did cast stay cast once, and the one that fell back is drawn once, by its shapes.
        describe('a group with a run whose shadow can not be cast', () => {
            const UNCASTABLE = { ...RED_HALF, blur: Number.NaN };
            const nodes = (second: NonNullable<Shape['fillShadow']> = UNCASTABLE) => [
                box(20, 40, 40, 40, { fillShadow: BLUE }),
                box(20, 130, 40, 40, { fillShadow: second }),
            ];

            const aloneAfter = (second: NonNullable<Shape['fillShadow']> = UNCASTABLE) => {
                renderNodes(nodes(second), false);
                return pixels();
            };

            it.each([true, 'by-layer'] as const)(
                'should draw each shadow once when a later run can not be cast, in a group that batches %s',
                (batchShadows) => {
                    const alone = aloneAfter();
                    expect(paintedPixels()).toBeGreaterThan(0);

                    const blits = vi.spyOn(ctx(), 'drawImage');
                    try {
                        renderNodes(nodes(), batchShadows);
                        // The first run's mask, and not a second blit for the run that fell back.
                        expect(blits).toHaveBeenCalledTimes(1);
                    } finally {
                        blits.mockRestore();
                    }

                    expect(pixels()).toEqual(alone);
                }
            );

            it('should not blit the shadows that a run kept when it stops being castable', () => {
                const [first, second] = nodes(RED_HALF);
                const group = createGroup([first, second]);
                renderGroup(group);
                renderGroup(group);
                renderGroup(group);

                second.fillShadow = UNCASTABLE;
                const blits = vi.spyOn(ctx(), 'drawImage');
                try {
                    renderGroup(group);
                    expect(blits).toHaveBeenCalledTimes(1);
                } finally {
                    blits.mockRestore();
                }

                expect(pixels()).toEqual(aloneAfter());
            });

            it('should cast the run through the mask again once it can be cast', () => {
                const [first, second] = nodes();
                const group = createGroup([first, second]);
                renderGroup(group);

                second.fillShadow = RED_HALF;
                const blits = vi.spyOn(ctx(), 'drawImage');
                try {
                    renderGroup(group);
                    expect(blits).toHaveBeenCalledTimes(2);
                } finally {
                    blits.mockRestore();
                }
            });
        });

        // A glow with no `fill` takes the colour of each item it surrounds, and is keyed without one, so the items of many
        // colours share a mask, which is blurred and blitted once.
        describe('a glow with no fill around items of different colours', () => {
            const GLOW = {
                enabled: true,
                xOffset: 0,
                yOffset: 0,
                blur: 0,
                spread: 8,
                fillOpacity: 1,
                glow: true as const,
            };
            const COLOURS = [
                'rgb(255, 0, 0)',
                'rgb(0, 255, 0)',
                'rgb(0, 0, 255)',
                'rgb(255, 255, 0)',
                'rgb(0, 255, 255)',
            ];
            const items = (count: number, fillShadow: Shape['fillShadow'] | ((i: number) => Shape['fillShadow'])) =>
                COLOURS.slice(0, count).map((fill, i) =>
                    box(20 + i * 70, 60, 40, 40, {
                        fill,
                        fillShadow: typeof fillShadow === 'function' ? fillShadow(i) : fillShadow,
                    })
                );

            const blitsOf = (nodes: Shape[], batchShadows: Group['batchShadows'] = true) => {
                const blits = vi.spyOn(ctx(), 'drawImage');
                try {
                    renderNodes(nodes, batchShadows);
                    return blits.mock.calls.length;
                } finally {
                    blits.mockRestore();
                }
            };

            it.each([true, 'by-layer'] as const)(
                'should blit one mask however many colours the items have, in a group that batches %s',
                (batchShadows) => {
                    expect(blitsOf(items(1, GLOW), batchShadows)).toBe(1);
                    expect(blitsOf(items(COLOURS.length, GLOW), batchShadows)).toBe(1);
                }
            );

            it('should make a mask for each colour of a glow that has a fill, as the colour is part of its key', () => {
                const blits = blitsOf(items(COLOURS.length, (i) => ({ ...GLOW, fill: COLOURS[i] })));

                expect(blits).toBe(COLOURS.length);
            });

            it('should still make a mask for each spread, however many colours the items have', () => {
                const nodes = [
                    ...items(2, GLOW),
                    box(300, 60, 40, 40, { fill: 'rgb(255, 0, 255)', fillShadow: { ...GLOW, spread: 2 } }),
                ];

                expect(blitsOf(nodes)).toBe(2);
            });

            // Without a spread the mask draws the paint as it is, so an item that paints more than a solid fill is keyed by its
            // colour even where the canvas can tint. This is accepted for a glow with no spread, which is not the default.
            describe('without a spread', () => {
                const NO_SPREAD = { ...GLOW, spread: 0 };
                const fading = (colour: string) => ({
                    type: 'gradient' as const,
                    colorStops: [
                        { color: colour, stop: 0 },
                        { color: 'rgba(0, 0, 0, 0)', stop: 1 },
                    ],
                });

                it('should blit one mask however many colours the items have, when they are a solid fill', () => {
                    expect(blitsOf(items(COLOURS.length, NO_SPREAD))).toBe(1);
                });

                // A solid item that also paints strokes apart from its main path, as a candlestick does with its wicks.
                class ExtrasPath extends Path {
                    protected override getSilhouetteExtrasOpacity() {
                        return 1;
                    }
                }
                const withExtras = (x: number, y: number, width: number, height: number, mixin: Partial<Path>) => {
                    const node = new ExtrasPath();
                    Object.assign(node, { strokeWidth: 0, ...mixin });
                    node.path.rect(x, y, width, height);
                    node.shadowMode = 'silhouette';
                    return node;
                };

                const PAINTS = [
                    ['a stroke with no fill', (fill: string) => ({ fill: 'none', stroke: fill, strokeWidth: 4 })],
                    ['a gradient fill', (fill: string) => ({ fill: fading(fill) })],
                    ['extras', (fill: string) => ({ fill, stroke: fill })],
                ] as const;
                const paintedNodes = (
                    name: (typeof PAINTS)[number][0],
                    paint: (typeof PAINTS)[number][1],
                    fillShadow: Shape['fillShadow'],
                    count: number
                ) => {
                    const create = name === 'extras' ? withExtras : box;
                    return COLOURS.slice(0, count).map((colour, i) =>
                        create(20 + i * 70, 60, 40, 40, { ...paint(colour), fillShadow })
                    );
                };

                it.each(PAINTS)('should make a mask for each colour of items with %s', (name, paint) => {
                    expect(blitsOf(paintedNodes(name, paint, NO_SPREAD, 1))).toBe(1);
                    expect(blitsOf(paintedNodes(name, paint, NO_SPREAD, COLOURS.length))).toBe(COLOURS.length);
                });

                // A gap dilates the silhouette as a spread does, so the mask is a solid silhouette that any colour can tint.
                it.each(PAINTS)(
                    'should share a mask between the colours of items with %s, given a gap',
                    (name, paint) => {
                        const gapped = { ...NO_SPREAD, gap: 0 };
                        const alone = blitsOf(paintedNodes(name, paint, gapped, 1));

                        expect(alone).toBeGreaterThan(0);
                        expect(blitsOf(paintedNodes(name, paint, gapped, COLOURS.length))).toBe(alone);
                    }
                );
            });

            it('should draw the glow around each item in the colour of that item', () => {
                renderNodes(items(3, GLOW));

                // 4px outside the edge of each item, clear of the others, within the 8px of spread of the glow.
                const glowAt = (i: number) => at(20 + i * 70 + 20, 60 - 4);
                const [red, green, blue] = [0, 1, 2].map(glowAt);
                expect([red[0], red[1], red[2]]).toEqual([255, 0, 0]);
                expect([green[0], green[1], green[2]]).toEqual([0, 255, 0]);
                expect([blue[0], blue[1], blue[2]]).toEqual([0, 0, 255]);
                for (const pixel of [red, green, blue]) expect(pixel[3]).toBe(255);
                // Beyond the spread there is none.
                expect(at(20 + 20, 60 - 12)).toEqual(CLEAR);
            });

            describe('translucent items', () => {
                afterEach(() => overrideTintableShadows());

                // The colour of an item has an alpha of a half, which applies to the colour of its glow and to its strength.
                const translucent = (fillShadow: Shape['fillShadow']) => [
                    box(20, 60, 40, 40, { fill: 'rgba(255, 0, 0, 0.5)', fillShadow }),
                ];
                const glowPixel = (fillShadow: Shape['fillShadow'], canTint: boolean | undefined) => {
                    overrideTintableShadows(canTint);
                    renderNodes(translucent(fillShadow));
                    return at(20 + 20, 60 - 4);
                };
                const EXPLICIT = { ...GLOW, fill: 'rgba(255, 0, 0, 0.5)' };

                it('should cast the alpha of the colour once in the colour and once in the strength', () => {
                    // A half of a half.
                    const [red, green, blue, alpha] = glowPixel(GLOW, true);

                    expect([red, green, blue]).toEqual([255, 0, 0]);
                    expect(Math.abs(alpha - 64)).toBeLessThanOrEqual(2);
                });

                it.each([true, false])(
                    'should cast the same pixels from the inferred colour as from the same fill, where tinting is %s',
                    (canTint) => {
                        const inferred = glowPixel(GLOW, canTint);
                        const explicit = glowPixel(EXPLICIT, canTint);

                        for (let i = 0; i < 4; i++) expect(Math.abs(inferred[i] - explicit[i])).toBeLessThanOrEqual(1);
                    }
                );

                it.each([GLOW, EXPLICIT])(
                    'should cast the same pixels whether or not the canvas can tint',
                    (shadow) => {
                        const tinted = glowPixel(shadow, true);
                        const perColour = glowPixel(shadow, false);

                        for (let i = 0; i < 4; i++) expect(Math.abs(tinted[i] - perColour[i])).toBeLessThanOrEqual(1);
                    }
                );
            });

            describe('translucent items with a gap', () => {
                afterEach(() => overrideTintableShadows());

                // The item is red at half strength, and sits clear of the layer's origin, so the cut is made on a canvas offset from it.
                const GAPPED = { ...GLOW, gap: 0 };
                const render = (fillShadow: Shape['fillShadow'], canTint: boolean) => {
                    overrideTintableShadows(canTint);
                    renderNodes([box(20, 60, 40, 40, { fill: 'rgba(255, 0, 0, 0.5)', fillShadow })]);
                    return pixels();
                };
                const pixelAtOf = (data: number[], x: number, y: number) =>
                    data.slice((y * WIDTH + x) * 4, (y * WIDTH + x) * 4 + 4);

                it.each([true, false])(
                    'should cut the item out of its own glow, and cast the rest as with no gap, where tinting is %s',
                    (canTint) => {
                        const ungapped = render(GLOW, canTint);
                        const gapped = render(GAPPED, canTint);

                        // Where the item is, the glow of the ungapped one shows through it, and the gapped one is the item alone.
                        expect(pixelAtOf(ungapped, 40, 80)[3]).toBeGreaterThan(140);
                        const [red, green, blue, alpha] = pixelAtOf(gapped, 40, 80);
                        expect([red, green, blue]).toEqual([255, 0, 0]);
                        expect(Math.abs(alpha - 128)).toBeLessThanOrEqual(1);
                        // Around it, beyond the footprint, the glow is as strong as the ungapped glow, and ends where it does.
                        for (const [x, y] of [
                            [40, 56],
                            [16, 80],
                            [64, 80],
                            [40, 104],
                        ]) {
                            const [, , , outside] = pixelAtOf(gapped, x, y);
                            expect(Math.abs(outside - 64)).toBeLessThanOrEqual(2);
                            expect(outside).toBe(pixelAtOf(ungapped, x, y)[3]);
                        }
                        expect(pixelAtOf(gapped, 40, 40)[3]).toBe(0);
                    }
                );

                // A canvas that blurs a mask with a filter and one that blurs it with a shadow differ a little in the tail of the blur,
                // with or without a gap, so a gap may not widen that difference.
                const tintingDifference = (shadow: Shape['fillShadow']) => {
                    const [tinted, perColour] = [true, false].map((canTint) => render(shadow, canTint));
                    let worst = 0;
                    for (let i = 0; i < tinted.length; i += 4) {
                        worst = Math.max(worst, Math.abs(tinted[i + 3] - perColour[i + 3]));
                        // The colour of a pixel that is almost clear is not meaningful.
                        if (tinted[i + 3] > 16 && perColour[i + 3] > 16) {
                            for (let c = 0; c < 3; c++)
                                worst = Math.max(worst, Math.abs(tinted[i + c] - perColour[i + c]));
                        }
                    }
                    return { worst, tinted };
                };

                it('should cast a blurred glow in the same place, as strong, whether or not the canvas can tint', () => {
                    const ungapped = tintingDifference({ ...GLOW, blur: 6 });
                    const gapped = tintingDifference({ ...GAPPED, blur: 6 });

                    expect(maxAlpha(gapped.tinted)).toBeGreaterThan(0);
                    expect(gapped.worst).toBeLessThanOrEqual(ungapped.worst + 2);
                    // The cut is where the item is.
                    expect(Math.abs(pixelAtOf(gapped.tinted, 40, 80)[3] - 128)).toBeLessThanOrEqual(1);
                });
            });

            describe('where the canvas cannot blur a mask of many colours', () => {
                beforeEach(() => overrideTintableShadows(false));
                afterEach(() => overrideTintableShadows());

                it('should make a mask for each colour of the items, which the glow has no fill to key by', () => {
                    expect(blitsOf(items(1, GLOW))).toBe(1);
                    expect(blitsOf(items(COLOURS.length, GLOW))).toBe(COLOURS.length);
                });

                it('should share a mask between neighbouring items of the same colour', () => {
                    // A cast ends where an item of another colour comes between, as it would draw over the glow.
                    const nodes = [0, 0, 1, 1].map((colour, i) =>
                        box(20 + i * 70, 60, 40, 40, { fill: COLOURS[colour], fillShadow: GLOW })
                    );

                    expect(blitsOf(nodes)).toBe(2);
                });

                it('should draw the glow around each item in the colour of that item', () => {
                    renderNodes(items(3, GLOW));

                    const glowAt = (i: number) => at(20 + i * 70 + 20, 60 - 4);
                    for (const [i, rgb] of [
                        [255, 0, 0],
                        [0, 255, 0],
                        [0, 0, 255],
                    ].entries()) {
                        expect(glowAt(i)).toEqual([...rgb, 255]);
                    }
                    expect(at(20 + 20, 60 - 12)).toEqual(CLEAR);
                });

                it('should cast the glow of each translucent item at the strength of its alpha', () => {
                    renderNodes(
                        COLOURS.slice(0, 2).map((colour, i) =>
                            box(20 + i * 70, 60, 40, 40, {
                                fill: colour.replace('rgb', 'rgba').replace(')', ', 0.5)'),
                                fillShadow: GLOW,
                            })
                        )
                    );

                    const [red, green, blue, alpha] = at(20 + 20, 60 - 4);
                    expect([red, green, blue]).toEqual([255, 0, 0]);
                    expect(Math.abs(alpha - 64)).toBeLessThanOrEqual(2);
                    const second = at(20 + 70 + 20, 60 - 4);
                    expect([second[0], second[1], second[2]]).toEqual([0, 255, 0]);
                    expect(Math.abs(second[3] - 64)).toBeLessThanOrEqual(2);
                });
            });
        });

        it('should end a cast at a change of zIndex only in a scope by layer', () => {
            const lower = box(20, 40, 40, 40, { fillShadow: BLUE, zIndex: 0 });
            const upper = box(120, 40, 40, 40, { fillShadow: BLUE, zIndex: 1 });
            const key = keyOf(lower, BLUE);

            expect(joinsShadowKey(key, upper, BLUE, undefined, 'run')).toBe(true);
            expect(joinsShadowKey(key, upper, BLUE, undefined, 'layer')).toBe(false);
        });

        // A key's mask is cleared and blurred over the union of its casters' silhouettes. A caster that can't be bounded fails
        // open to the whole mask, so that is the reference: no pixel may differ from it.
        describe('a mask bounded to its casters', () => {
            const LAYER = { width: 400, height: 300 };
            const BLURRED = { enabled: true, fill: 'rgba(0, 0, 255, 1)', xOffset: 10, yOffset: 6, blur: 6 };
            const BLURRED_GLOW = { ...BLURRED, xOffset: 0, yOffset: 0, spread: 8, glow: true as const };

            const shadowKey = (casters: Shape[], shadow: ResolvedDropShadowOptions = BLURRED): ShadowKey => ({
                ...keyOf(casters[0], shadow),
                casters,
            });
            const glowKeyOf = (node: Shape, glow: ResolvedDropShadowOptions): ShadowKey => ({
                ...keyOf(node, glow),
                slot: 'glow',
            });

            interface Scenario {
                keys: () => ShadowKey[];
                devicePixelRatio?: number;
                overlay?: boolean;
                /** Whether a key has more than 16 casters, which is bounded on a kept cast only: a direct cast clears and blurs it whole. */
                crowded?: boolean;
                /** The size of the part of each key's casters that is on the layer, which its mask holds, in css pixels. */
                held: { width: number; height: number };
                /** The size of the layer in css pixels, if not {@link LAYER}. A large one is compared by a digest of its pixels. */
                layer?: { width: number; height: number };
                /** How many casts of the same user make up a kept cast, whose last is blitted from the cache. Three if unset. */
                casts?: number;
                /** Measures the casters of the bounded cast as it says, in place of the shape: it writes the bounds, and returns whether it did. */
                measure?: (out: { minX: number; minY: number; maxX: number; maxY: number }) => boolean;
                /** Runs once the cast is made, as the render of a test cleans up. */
                cleanup?: () => void;
            }

            const grid = (count: number, slot: 'fillShadow' | 'fillGlow', shadow: ResolvedDropShadowOptions) => {
                const items: Shape[] = [];
                for (let i = 0; i < count; i++) {
                    const x = 100 + (i % 6) * 30;
                    const y = 80 + Math.floor(i / 6) * 30;
                    items.push(box(x, y, 20, 20, { [slot]: shadow }));
                }
                return items;
            };

            const HOVERED = { width: 40, height: 30 };
            const GRID = { width: 170, height: 110 };

            const SCENARIOS: Array<[string, Scenario]> = [
                [
                    'a hovered item',
                    {
                        keys: () => [shadowKey([box(150, 100, 40, 30, { fillShadow: BLURRED })])],
                        held: HOVERED,
                    },
                ],
                [
                    'a hovered item at twice the device pixel ratio',
                    {
                        keys: () => [shadowKey([box(150, 100, 40, 30, { fillShadow: BLURRED })])],
                        devicePixelRatio: 2,
                        held: HOVERED,
                    },
                ],
                [
                    'a key of more than 16 casters',
                    {
                        keys: () => [shadowKey(grid(20, 'fillShadow', BLURRED))],
                        crowded: true,
                        held: GRID,
                    },
                ],
                [
                    'a translucent caster',
                    {
                        keys: () => [
                            shadowKey([box(150, 100, 40, 30, { fill: 'rgba(0, 0, 0, 0.5)', fillShadow: BLURRED })]),
                        ],
                        held: HOVERED,
                    },
                ],
                [
                    'a caster that the layer clips at its left and top',
                    {
                        keys: () => [
                            shadowKey([box(-15, -10, 40, 30, { fillShadow: BLURRED })], { ...BLURRED, xOffset: -20 }),
                        ],
                        held: { width: 25, height: 20 },
                    },
                ],
                [
                    'a caster that the layer clips at its right and bottom',
                    {
                        keys: () => [shadowKey([box(380, 285, 40, 30, { fillShadow: BLURRED })])],
                        held: { width: 20, height: 15 },
                    },
                ],
                [
                    'a caster beside the layer whose shadow is carried onto it',
                    {
                        keys: () => [
                            shadowKey([box(-60, 100, 40, 30, { fillShadow: BLURRED })], { ...BLURRED, xOffset: 80 }),
                        ],
                        held: { width: 0, height: 0 },
                    },
                ],
                [
                    'a glow with a gap',
                    {
                        keys: () => {
                            const glow = { ...BLURRED_GLOW, gap: 4 };
                            return [glowKeyOf(box(150, 100, 40, 30, { fillGlow: glow }), glow)];
                        },
                        held: HOVERED,
                    },
                ],
                [
                    'a glow with a gap of more than 16 casters',
                    {
                        keys: () => {
                            const glow = { ...BLURRED_GLOW, gap: 2 };
                            const casters = grid(20, 'fillGlow', glow);
                            return [{ ...glowKeyOf(casters[0], glow), casters }];
                        },
                        crowded: true,
                        held: GRID,
                    },
                ],
                [
                    'an overlay glow',
                    {
                        keys: () => {
                            const glow = { ...BLURRED_GLOW, fill: 'rgba(0, 0, 255, 0.6)' };
                            return [
                                glowKeyOf(box(100, 100, 40, 30, { fillGlow: glow }), glow),
                                glowKeyOf(box(180, 140, 40, 30, { fillGlow: glow }), glow),
                            ];
                        },
                        overlay: true,
                        held: HOVERED,
                    },
                ],
                [
                    'an overlay glow with a gap',
                    {
                        keys: () => {
                            const glow = { ...BLURRED_GLOW, gap: 0 };
                            return [
                                glowKeyOf(box(100, 100, 40, 30, { fillGlow: glow }), glow),
                                glowKeyOf(box(180, 140, 40, 30, { fillGlow: glow }), glow),
                            ];
                        },
                        overlay: true,
                        held: HOVERED,
                    },
                ],
                [
                    'an overlay glow at the layer edge',
                    {
                        keys: () => {
                            const glow = { ...BLURRED_GLOW, fill: 'rgba(0, 0, 255, 0.6)' };
                            return [
                                glowKeyOf(box(-10, 5, 40, 30, { fillGlow: glow }), glow),
                                glowKeyOf(box(370, 270, 40, 30, { fillGlow: glow }), glow),
                            ];
                        },
                        overlay: true,
                        held: { width: 30, height: 30 },
                    },
                ],
            ];

            interface Cast {
                /** Empty for a scenario of a large layer, which has a digest to compare instead. */
                pixels: number[];
                /** A digest of the pixels of the layer, and how many of its bytes are not zero. */
                digest: string;
                painted: number;
                /** The rectangles that a mask was cleared at on the scratch canvas, as x, y, width and height. */
                masks: number[][];
                /** The source and destination rectangles of the masks blurred from the scratch canvas, onto the layer or a cache. */
                sources: number[][];
                /** What the last cast cleared and drew from the scratch canvas, which for a kept cast is a blit of the cache. */
                last: { clears: number; sources: number };
                /** The size of the scratch canvas. */
                scratch: [number, number];
            }

            /** The count of differing bytes is reported in place of a diff of arrays too large to print. */
            const expectEqualPixels = (actual: Cast, expected: Cast) => {
                expect(actual.pixels).toHaveLength(expected.pixels.length);
                expect(differingBytes({ data: actual.pixels }, { data: expected.pixels })).toBe(0);
                expect(actual.digest).toBe(expected.digest);
            };

            /** A digest of bytes (FNV-1a), to compare the layers of a size that an array of numbers can't hold. */
            const digestOf = (data: ArrayLike<number>) => {
                let hash = 0x811c9dc5;
                let painted = 0;
                for (let i = 0; i < data.length; i++) {
                    hash = Math.imul(hash ^ data[i], 0x01000193) >>> 0;
                    if (data[i] !== 0) painted++;
                }
                return { digest: hash.toString(16), painted };
            };

            /** The clears of the scratch canvas at a rect that a blur then draws from, which a stamp's clear is not. */
            const maskClears = (clears: unknown[][], blurs: unknown[][]) =>
                clears
                    .map((args) => args.map(Number))
                    .filter((rect) => blurs.some((blur) => rect.every((value, i) => value === blur[i + 1])));

            /** Casts the scenario on a layer of its own: a direct cast is of a user that has cast nothing, a kept one is its third cast. */
            const castScenario = (scenario: Scenario, unbounded: boolean, kept = false): Cast => {
                const dpr = scenario.devicePixelRatio ?? 1;
                const { width: layerWidth, height: layerHeight } = scenario.layer ?? LAYER;
                const layer = new OffscreenCanvas(layerWidth * dpr, layerHeight * dpr);
                const context = layer.getContext('2d')! as unknown as CanvasRenderingContext2D;
                const renderCtx = {
                    ...renderContext(),
                    ctx: context,
                    width: layer.width,
                    height: layer.height,
                    devicePixelRatio: dpr,
                };
                const keys = scenario.keys();
                for (const key of keys) {
                    createGroup(key.casters).preRender(renderCtx);
                    if (unbounded) {
                        for (const caster of key.casters) {
                            vi.spyOn(caster, 'getShadowSilhouetteBounds').mockReturnValue(false);
                        }
                    } else if (scenario.measure != null) {
                        const { measure } = scenario;
                        for (const caster of key.casters) {
                            vi.spyOn(caster, 'getShadowSilhouetteBounds').mockImplementation((_parent, _spread, out) =>
                                measure(out)
                            );
                        }
                    }
                }
                const scene = {};
                const users = [{}, {}, {}];
                const cast = (user: object) => {
                    context.save();
                    context.clearRect(0, 0, layer.width, layer.height);
                    context.scale(dpr, dpr);
                    const shadowCast = { scene, user, keys, index: 0, overlay: scenario.overlay };
                    expect(castShadows(shadowCast, renderCtx)).toBe(true);
                    context.restore();
                };

                // A cast of a scene makes the scratch canvas, which the casts after it clear and draw on.
                const before = offscreenCanvases();
                cast(users[0]);
                const [scratch] = inUse(createdSince(before));
                const scratchContext = scratch.getContext('2d')! as unknown as CanvasRenderingContext2D;
                const clearRect = vi.spyOn(scratchContext, 'clearRect');
                const drawImage = vi.spyOn(Object.getPrototypeOf(context), 'drawImage');
                let result: Cast;
                try {
                    // A blur draws its mask displaced by its shadow's offset, which a stamp of the scratch canvas does not.
                    const sourcesOf = () =>
                        drawImage.mock.calls.filter(
                            ([source, sx, sy, , , dx, dy]) => source === scratch && (dx !== sx || dy !== sy)
                        );
                    let last = { clears: 0, sources: 0 };
                    if (kept) {
                        const casts = scenario.casts ?? 3;
                        for (let i = 0; i < casts - 1; i++) {
                            const clearsBefore = clearRect.mock.calls.length;
                            const sourcesBefore = sourcesOf().length;
                            cast(users[0]);
                            last = {
                                clears: clearRect.mock.calls.length - clearsBefore,
                                sources: sourcesOf().length - sourcesBefore,
                            };
                        }
                    } else cast(users[1]);

                    const data = context.getImageData(0, 0, layer.width, layer.height).data;
                    result = {
                        pixels: scenario.layer == null ? Array.from(data) : [],
                        ...digestOf(data),
                        masks: maskClears(clearRect.mock.calls, sourcesOf()),
                        sources: sourcesOf().map((args) => args.slice(1) as number[]),
                        last,
                        scratch: [scratch.width, scratch.height],
                    };
                } finally {
                    // The spy on the prototype is shared by every canvas of every later test.
                    clearRect.mockRestore();
                    drawImage.mockRestore();
                }
                for (const user of users) destroyShadowScratch(user);
                destroyShadowScratch(scene);
                scenario.cleanup?.();
                return result;
            };

            describe.each(SCENARIOS)('%s', (_name, scenario) => {
                const dpr = scenario.devicePixelRatio ?? 1;
                let bounded: Cast;
                let full: Cast;
                beforeEach(() => {
                    bounded = castScenario(scenario, false);
                    full = castScenario(scenario, true);
                });

                it('should draw the pixels that the whole mask draws', () => {
                    expect(maxAlpha(full.pixels)).toBeGreaterThan(0);
                    expect(bounded.pixels).toHaveLength(full.pixels.length);
                    expectEqualPixels(bounded, full);
                });

                it('should blit the pixels of a kept cast that the whole mask draws', () => {
                    const keptBounded = castScenario(scenario, false, true);
                    const keptFull = castScenario(scenario, true, true);
                    expect(maxAlpha(keptFull.pixels)).toBeGreaterThan(0);
                    expectEqualPixels(keptBounded, keptFull);
                    // The cast that was kept draws what a direct one does.
                    expectEqualPixels(keptBounded, bounded);
                    // And it is blitted from the cache: the last cast clears no mask and draws none, bounded or not.
                    expect(keptFull.last).toEqual({ clears: 0, sources: 0 });
                    expect(keptBounded.last).toEqual({ clears: 0, sources: 0 });
                });

                if (scenario.crowded === true) {
                    it('should clear and blur the whole mask for a direct cast', () => {
                        expectWhole(bounded, full);
                    });
                } else {
                    it('should clear a mask that holds the casters and not the layer, where the whole mask clears the layer', () => {
                        expect(full.masks.length).toBeGreaterThan(0);
                        for (const [, , clearWidth, clearHeight] of full.masks) {
                            expect(clearWidth).toBeGreaterThanOrEqual(LAYER.width * dpr);
                            expect(clearHeight).toBeGreaterThanOrEqual(LAYER.height * dpr);
                        }

                        const { held } = scenario;
                        expect(bounded.masks).toHaveLength(full.masks.length);
                        for (const [, , clearWidth, clearHeight] of bounded.masks) {
                            expect(clearWidth * clearHeight).toBeLessThan(full.scratch[0] * full.scratch[1]);
                            expect(clearWidth).toBeGreaterThanOrEqual(Math.floor(held.width * dpr));
                            expect(clearHeight).toBeGreaterThanOrEqual(Math.floor(held.height * dpr));
                        }
                    });

                    it('should blur the rect of the mask that it cleared, from its source rect', () => {
                        expectBounded(bounded, full);
                    });
                }

                it('should clear and blur a part of the mask for a kept cast', () => {
                    const keptBounded = castScenario(scenario, false, true);
                    const keptFull = castScenario(scenario, true, true);
                    expectBounded(keptBounded, keptFull);
                    const { held } = scenario;
                    for (const [, , clearWidth, clearHeight] of keptBounded.masks) {
                        expect(clearWidth).toBeGreaterThanOrEqual(Math.floor(held.width * dpr));
                        expect(clearHeight).toBeGreaterThanOrEqual(Math.floor(held.height * dpr));
                    }
                });
            });

            const expectSameCast = (bounded: Cast, full: Cast) => {
                expect(full.painted).toBeGreaterThan(0);
                expect(bounded.digest).toBe(full.digest);
                expectEqualPixels(bounded, full);
            };

            /** A key is cut down: it clears less than the whole mask does, and blurs the rect that it cleared. */
            const expectBounded = (bounded: Cast, full: Cast) => {
                expect(full.sources.length).toBeGreaterThan(0);
                expect(bounded.sources).toHaveLength(full.sources.length);
                expect(bounded.masks).toHaveLength(full.masks.length);
                for (const [i, [x, y, w, h]] of bounded.masks.entries()) {
                    const [, , wholeWidth, wholeHeight] = full.masks[i];
                    expect(x + w).toBeLessThanOrEqual(wholeWidth);
                    expect(y + h).toBeLessThanOrEqual(wholeHeight);
                    expect(w * h).toBeLessThan(wholeWidth * wholeHeight);
                }
                for (const [i, [sx, sy, sw, sh, , , dw, dh]] of bounded.sources.entries()) {
                    expect(bounded.masks).toContainEqual([sx, sy, sw, sh]);
                    expect([dw, dh]).toEqual([sw, sh]);
                    expect(sw * sh).toBeLessThan(full.sources[i][2] * full.sources[i][3]);
                }
            };

            /** A key is not cut down: it clears the whole mask, and blurs all of it, as the whole mask does. */
            const expectWhole = (bounded: Cast, full: Cast) => {
                expect(full.sources.length).toBeGreaterThan(0);
                expect(bounded.masks).toEqual(full.masks);
                expect(bounded.sources).toEqual(full.sources);
            };

            /** Expects the pixels of the whole mask. A key of more than 16 casters is whole on a direct cast, bounded on a kept one. */
            const expectSameAsWhole = (scenario: Scenario) => {
                const bounded = castScenario(scenario, false);
                const full = castScenario(scenario, true);
                expectSameCast(bounded, full);
                if (scenario.crowded !== true) {
                    expectBounded(bounded, full);
                    return bounded;
                }
                expectWhole(bounded, full);
                const keptBounded = castScenario(scenario, false, true);
                const keptFull = castScenario(scenario, true, true);
                expectSameCast(keptBounded, keptFull);
                expectBounded(keptBounded, keptFull);
                return keptBounded;
            };

            const hovered = (shadow: Partial<ResolvedDropShadowOptions>, over: Partial<Scenario> = {}): Scenario => ({
                keys: () => [
                    shadowKey([box(150, 100, 40, 30, { fillShadow: { ...BLURRED, ...shadow } })], {
                        ...BLURRED,
                        ...shadow,
                    }),
                ],
                held: HOVERED,
                ...over,
            });

            const crowd = (
                shadow: Partial<ResolvedDropShadowOptions>,
                over: Partial<Scenario> = {},
                shift = 0
            ): Scenario => ({
                keys: () => {
                    const full = { ...BLURRED, ...shadow };
                    const casters: Shape[] = [];
                    for (let i = 0; i < 20; i++) {
                        const x = 100 + (i % 6) * 30 + shift;
                        const y = 80 + Math.floor(i / 6) * 30 + shift * 2.3;
                        casters.push(box(x, y, 20 + shift, 20 + shift * 2, { fillShadow: full }));
                    }
                    return [shadowKey(casters, full)];
                },
                crowded: true,
                held: GRID,
                ...over,
            });

            // The skia that draws a shadow blur does not blur a part of a canvas as it does the whole when the shadow is offset by
            // part of a device pixel, so a key is bounded only if both its offsets, in device pixels, are whole.
            describe('a shadow offset by part of a device pixel', () => {
                const FRACTIONAL: Array<[string, Scenario]> = [
                    [
                        '20 casters, a spread and a fractional offset on both axes',
                        crowd({ xOffset: 4.5, yOffset: 2.2, spread: 3 }),
                    ],
                    ['a hovered item and a fractional offset on both axes', hovered({ xOffset: 0.3, yOffset: 0.3 })],
                    ['a hovered item and a fractional offset on x alone', hovered({ xOffset: 4.5, yOffset: 2 })],
                    ['a hovered item and a fractional offset on y alone', hovered({ xOffset: 4, yOffset: 2.2 })],
                    [
                        'whole css offsets at a device pixel ratio of 1.25',
                        hovered({ xOffset: 10, yOffset: 6 }, { devicePixelRatio: 1.25 }),
                    ],
                    [
                        'a quarter of a css pixel at twice the ratio',
                        hovered({ xOffset: 4.25, yOffset: 2.25 }, { devicePixelRatio: 2 }),
                    ],
                    [
                        '20 casters of fractional geometry at a ratio of 1.25',
                        crowd({ xOffset: 10, yOffset: 6, spread: 3 }, { devicePixelRatio: 1.25 }, 0.3),
                    ],
                ];

                // What is drawn is what a cast of the whole mask draws, which includes the clip of the blur to the extent of a small
                // key. That clip is not a clip of the mask, so a cast of no clip is not the reference for the pixels here.
                it.each(FRACTIONAL)('should clear and blur the whole mask for %s', (_name, scenario) => {
                    const bounded = castScenario(scenario, false);
                    const full = castScenario(scenario, true);

                    expect(bounded.painted).toBeGreaterThan(0);
                    expectWhole(bounded, full);
                });

                it.each(FRACTIONAL)('should clear the whole mask of a kept cast for %s', (_name, scenario) => {
                    const bounded = castScenario(scenario, false, true);
                    const full = castScenario(scenario, true, true);

                    expect(bounded.painted).toBeGreaterThan(0);
                    expectWhole(bounded, full);
                });
            });

            describe('a shadow offset by whole device pixels', () => {
                const WHOLE: Array<[string, Scenario]> = [
                    [
                        'fractional geometry, a spread and a ratio of 1.25',
                        hovered(
                            { xOffset: 4, yOffset: 8, spread: 3 },
                            {
                                devicePixelRatio: 1.25,
                                keys: () => {
                                    const shadow = { ...BLURRED, xOffset: 4, yOffset: 8, spread: 3 };
                                    return [shadowKey([box(150.3, 100.7, 40.2, 30.6, { fillShadow: shadow })], shadow)];
                                },
                            }
                        ),
                    ],
                    [
                        '20 casters of fractional geometry, a spread and a ratio of 1.25',
                        crowd({ xOffset: 4, yOffset: 8, spread: 3 }, { devicePixelRatio: 1.25 }, 0.3),
                    ],
                    ['a ratio of 1.5', hovered({ xOffset: 4, yOffset: 2 }, { devicePixelRatio: 1.5 })],
                    [
                        'half a css pixel at twice the ratio',
                        hovered({ xOffset: 4.5, yOffset: 2.5 }, { devicePixelRatio: 2 }),
                    ],
                    ['a negative offset', hovered({ xOffset: -7, yOffset: -3 })],
                    ['no offset', hovered({ xOffset: 0, yOffset: 0 })],
                ];

                it.each(WHOLE)('should clear and blur a part of the mask for %s', (_name, scenario) => {
                    expectSameAsWhole(scenario);
                });

                // The blurs are wider than the extent that the mask is cut to, so skia blurs from a different crop in each case.
                const BLURS = [12, 20, 30, 40, 60];
                const SPREADS = [0, 5];
                const OFFSETS = [
                    [4, 2],
                    [0, 0],
                    [7, -3],
                ];
                const LARGE = BLURS.flatMap((blur) =>
                    SPREADS.flatMap((spread) =>
                        OFFSETS.map(([xOffset, yOffset]) => ({ blur, spread, xOffset, yOffset }))
                    )
                );

                it.each(LARGE)(
                    'should draw the pixels of the whole mask for 20 casters of a blur of $blur, a spread of $spread and an offset of $xOffset, $yOffset',
                    (shadow) => {
                        expectSameAsWhole(crowd(shadow));
                    }
                );

                it.each(BLURS)(
                    'should draw the pixels of the whole mask for a glow of a blur of %i and a spread of 12',
                    (blur) => {
                        const glow = { ...BLURRED_GLOW, blur, spread: 12 };
                        const scenario: Scenario = {
                            keys: () => [glowKeyOf(box(150, 100, 40, 30, { fillGlow: glow }), glow)],
                            held: HOVERED,
                        };
                        expectSameAsWhole(scenario);
                    }
                );
            });

            // The premise of the whole-pixel condition, in skia alone: a source rect of any size around the casters blurs to
            // the pixels that the whole canvas does. The sizes include those that differed by one alpha for a part of a pixel.
            describe('a source rect of a canvas blurred with a shadow', () => {
                const PAD_X = 14;
                const PAD_Y = 12;
                const SIZE = { width: 423, height: 321 };
                const MARGINS = [0, 2, 8, 11, 12, 16, 19, 30, 33, 34, 43, 44];

                const blurred = (
                    source: OffscreenCanvas,
                    rect: [number, number, number, number],
                    offset: [number, number],
                    blur: number
                ) => {
                    const dest = new OffscreenCanvas(400, 300);
                    const d = dest.getContext('2d')! as unknown as CanvasRenderingContext2D;
                    const [sx, sy, sw, sh] = rect;
                    d.shadowColor = 'rgba(0, 0, 255, 1)';
                    // The mask is drawn this far to the left, so that none of it is on the layer.
                    d.shadowOffsetX = offset[0] + SIZE.width;
                    d.shadowOffsetY = offset[1];
                    d.shadowBlur = blur;
                    d.drawImage(source, sx, sy, sw, sh, -PAD_X - SIZE.width + sx, -PAD_Y + sy, sw, sh);
                    return d.getImageData(0, 0, 400, 300).data;
                };

                const cases = [6, 12, 30, 60].flatMap((blur) =>
                    (
                        [
                            [4, 2],
                            [0, 0],
                            [7, -3],
                            [10, 10],
                        ] as Array<[number, number]>
                    ).map((offset) => ({ blur, offset }))
                );

                it.each(cases)(
                    'should draw the pixels of the whole canvas for a blur of $blur and an offset of $offset',
                    ({ blur, offset }) => {
                        const source = new OffscreenCanvas(SIZE.width, SIZE.height);
                        const sc = source.getContext('2d')! as unknown as CanvasRenderingContext2D;
                        for (let i = 0; i < 20; i++) {
                            sc.fillRect(PAD_X + 100 + (i % 6) * 30, PAD_Y + 80 + Math.floor(i / 6) * 30, 20, 20);
                        }
                        const whole = blurred(source, [0, 0, SIZE.width, SIZE.height], offset, blur);
                        expect(whole.some((value) => value !== 0)).toBe(true);

                        for (const margin of MARGINS) {
                            const rect: [number, number, number, number] = [
                                100 + PAD_X - margin,
                                80 + PAD_Y - margin,
                                170 + 2 * margin,
                                110 + 2 * margin,
                            ];
                            const part = blurred(source, rect, offset, blur);
                            const differing = differingBytes({ data: part }, { data: whole });
                            expect({ margin, differing }).toEqual({ margin, differing: 0 });
                        }
                    }
                );
            });

            // The kinds of key whose masks are cut by code of their own: how they are drawn, merged and read back.
            describe('the kinds of key that a mask is bounded for', () => {
                afterEach(() => overrideTintableShadows());

                const TINTED = {
                    enabled: true,
                    xOffset: 0,
                    yOffset: 0,
                    blur: 6,
                    spread: 8,
                    fillOpacity: 1,
                    glow: true as const,
                };
                const tinted = (canTint: boolean): Scenario => ({
                    keys: () => {
                        overrideTintableShadows(canTint);
                        const casters = [
                            box(100, 100, 40, 30, { fill: 'rgb(255, 0, 0)', fillGlow: TINTED }),
                            box(180, 140, 40, 30, { fill: 'rgb(0, 160, 0)', fillGlow: TINTED }),
                        ];
                        return [{ ...glowKeyOf(casters[0], TINTED as ResolvedDropShadowOptions), casters }];
                    },
                    held: HOVERED,
                });

                it.each([true, false])(
                    'should draw the pixels of the whole mask for a glow with no fill, where tinting is %s',
                    (canTint) => {
                        expectSameAsWhole(tinted(canTint));
                    }
                );

                it('should draw the pixels of the whole mask for casters of a root key, each with a frame of its own', () => {
                    const scenario: Scenario = {
                        keys: () => {
                            const casters = [
                                box(0, 0, 40, 30, { fillShadow: BLURRED }),
                                box(0, 0, 40, 30, { fillShadow: BLURRED }),
                            ];
                            const frames = [
                                { matrix: [1, 0, 0, 1, 150, 100], alpha: 1, clips: [] },
                                { matrix: [1, 0, 0, 1, 230, 160], alpha: 0.5, clips: [] },
                            ];
                            return [{ ...shadowKey(casters), frames }];
                        },
                        held: { width: 120, height: 90 },
                    };
                    expectSameAsWhole(scenario);
                });

                // A key of 512 casters or more at different strengths is cast as a mask of each strength, and each is cut to the
                // extent of all the casters, which the parts are the superset of.
                it('should draw the pixels of the whole mask for an overlay glow split by strength', () => {
                    const glow = { ...BLURRED_GLOW, spread: 3, blur: 4 };
                    const scenario: Scenario = {
                        overlay: true,
                        keys: () => {
                            const casters: Shape[] = [];
                            for (let i = 0; i < 520; i++) {
                                const x = 24 + (i % 40) * 9;
                                const y = 60 + Math.floor(i / 40) * 9;
                                casters.push(box(x, y, 6, 6, { fillOpacity: i % 2 === 0 ? 1 : 0.5, fillGlow: glow }));
                            }
                            return [{ ...glowKeyOf(casters[0], glow), casters }];
                        },
                        crowded: true,
                        held: { width: 360, height: 117 },
                    };
                    // One mask for each strength, cleared whole by a direct cast.
                    const bounded = castScenario(scenario, false);
                    const full = castScenario(scenario, true);
                    expectSameCast(bounded, full);
                    expectWhole(bounded, full);
                    expect(bounded.masks).toHaveLength(2);
                    expect(bounded.masks[0]).toEqual(bounded.masks[1]);

                    // A cast that repeats it draws each part from the glow that the cast before kept, so it blurs no mask.
                    const keptBounded = castScenario(scenario, false, true);
                    const keptFull = castScenario(scenario, true, true);
                    expectSameCast(keptBounded, keptFull);
                    expectEqualPixels(keptBounded, bounded);
                    expect(keptFull.sources).toHaveLength(0);
                });

                it('should draw the pixels of the whole mask for an overlay glow cut by an item that casts none', () => {
                    const glow = { ...BLURRED_GLOW, spread: 10, blur: 4, gap: 2 };
                    const scenario: Scenario = {
                        overlay: true,
                        keys: () => {
                            const glowing = box(100, 100, 40, 30, { fillGlow: glow });
                            const cutter = box(120, 90, 60, 20, { fill: 'rgb(0, 0, 0)' });
                            return [
                                glowKeyOf(glowing, glow),
                                { slot: 'glow', shadow: CUT_ONLY_GLOW, clip: undefined, casters: [cutter] },
                            ];
                        },
                        held: HOVERED,
                    };
                    // The cutter casts no mask of its own, so the one mask is that of the key that casts.
                    expect(expectSameAsWhole(scenario).masks).toHaveLength(1);
                });

                it('should clear one pixel across of a mask whose casters are all off it', () => {
                    const scenario: Scenario = {
                        keys: () => [shadowKey([box(-600, 100, 40, 30, { fillShadow: BLURRED })])],
                        held: { width: 0, height: 0 },
                    };
                    const bounded = castScenario(scenario, false);
                    const full = castScenario(scenario, true);

                    expect(bounded.digest).toBe(full.digest);
                    expectEqualPixels(bounded, full);
                    // It is one pixel wide where it is off the mask, and is as tall as the caster where it is on it.
                    expect(bounded.masks).toEqual([[0, expect.any(Number), 1, expect.any(Number)]]);
                    expect(bounded.masks[0][3]).toBeLessThan(LAYER.height);
                });

                it.each([
                    ['not a number', Number.NaN],
                    ['infinite', Number.POSITIVE_INFINITY],
                ])('should clear and blur the whole mask for casters measured as %s', (_name, value) => {
                    const scenario = hovered(
                        {},
                        {
                            measure: (out) => {
                                out.minX = out.minY = value;
                                out.maxX = out.maxY = value;
                                return true;
                            },
                        }
                    );
                    const bounded = castScenario(scenario, false);
                    const full = castScenario(scenario, true);

                    expectSameCast(bounded, full);
                    expectWhole(bounded, full);
                });

                // A mask of more than 4096 x 4096 pixels is scaled down, and a part of it would not be drawn to the pixels that the
                // whole is, so it is cleared and blurred whole.
                it('should clear and blur the whole mask of a layer whose mask is scaled down', () => {
                    const scenario = hovered({}, { layer: { width: 4200, height: 4100 } });
                    const bounded = castScenario(scenario, false);
                    const full = castScenario(scenario, true);

                    expectSameCast(bounded, full);
                    expectWhole(bounded, full);
                    expect(bounded.scratch[0] * bounded.scratch[1]).toBeLessThanOrEqual(4096 * 4096);
                });

                // A cast that is refused room to keep its shadows is cast again each frame, with the masks of casters that are large.
                it('should draw the pixels of the whole mask for casts whose cache is declined', () => {
                    const scenario: Scenario = {
                        keys: () => [
                            shadowKey([
                                box(10, 10, 40, 30, { fillShadow: BLURRED }),
                                box(2350, 1760, 40, 30, { fillShadow: BLURRED }),
                            ]),
                        ],
                        held: { width: 2380, height: 1780 },
                        layer: { width: 2400, height: 1800 },
                        casts: 5,
                    };
                    const bounded = castScenario(scenario, false, true);
                    const full = castScenario(scenario, true, true);

                    expectSameCast(bounded, full);
                    // The last cast was made directly, since the cache was refused, and it cleared and blurred whole masks.
                    expect(full.last.sources).toBeGreaterThan(0);
                    expect(bounded.last).toEqual(full.last);
                    expect(bounded.masks.slice(-bounded.last.clears)).toEqual(full.masks.slice(-full.last.clears));
                    expect(bounded.sources.slice(-bounded.last.sources)).toEqual(
                        full.sources.slice(-full.last.sources)
                    );
                });
            });
        });

        // A canvas shrinks for the frames of a scene, so each cast here is of a frame, with a user of its own to keep no cache.
        describe('canvas shrinking', () => {
            // Wide and tall are small casts of different shapes, wider is one wider than both, and narrow is as tall as the canvas, and long is taller still.
            type Size = 'large' | 'small' | 'wide' | 'tall' | 'wider' | 'narrow' | 'long';
            const SIZES: Size[] = ['large', 'small', 'wide', 'tall', 'wider', 'narrow', 'long'];
            const MID = { width: 200, height: 120 };
            const area = ({ width, height }: OffscreenCanvas) => width * height;

            interface LayerSize {
                width: number;
                height: number;
            }

            interface ShrinkPath {
                /** The size of the layer that a cast of each size is drawn on, which a size with none shares with the small. */
                layers: { large: LayerSize; small: LayerSize } & Partial<Record<Size, LayerSize>>;
                keys: (size: Size) => ShadowKey[];
                overlay: boolean;
                /** Whether the canvas that shrinks is the scratch, which the layer sizes, rather than one that a glow's gap uses. */
                scratch: boolean;
                /** Whether the keys differ in shape between the sizes wide, tall, wider and narrow. */
                shapes: boolean;
            }

            const glowKey = (x: number, y: number, width: number, height = width) => {
                const glow = { ...GAPPED_GLOW, fill: 'rgba(0, 0, 255, 1)' };
                return { ...keyOf(box(x, y, width, height, { fillGlow: glow }), glow), slot: 'glow' as const };
            };

            const GAP_LAYER = { width: 400, height: 300 };
            const GAP_SHAPES: Record<Size, [number, number]> = {
                large: [400, 300],
                small: [15, 15],
                wide: [100, 20],
                tall: [20, 100],
                wider: [120, 20],
                narrow: [2, 100],
                long: [20, 240],
            };

            const PATHS: Array<[string, ShrinkPath]> = [
                [
                    'scratch',
                    {
                        layers: {
                            large: { width: 1000, height: 800 },
                            small: { width: 200, height: 100 },
                            wide: { width: 400, height: 100 },
                            tall: { width: 100, height: 400 },
                            wider: { width: 440, height: 100 },
                            narrow: { width: 20, height: 400 },
                            long: { width: 100, height: 450 },
                        },
                        keys: () => [keyOf(box(20, 20, 40, 40, { fillShadow: RED_HALF }), RED_HALF)],
                        overlay: false,
                        scratch: true,
                        shapes: true,
                    },
                ],
                [
                    'gap',
                    {
                        layers: { large: GAP_LAYER, small: GAP_LAYER },
                        keys: (size) => [GAP_SHAPES[size]].map(([width, height]) => glowKey(10, 10, width, height)),
                        overlay: false,
                        scratch: false,
                        shapes: true,
                    },
                ],
                [
                    'overlay merge and cut',
                    {
                        layers: { large: MID, small: MID },
                        keys: (size) =>
                            size === 'large'
                                ? [glowKey(10, 10, 20), glowKey(170, 90, 20)]
                                : [glowKey(10, 10, 15), glowKey(30, 10, 15)],
                        overlay: true,
                        scratch: false,
                        shapes: false,
                    },
                ],
            ];

            describe.each(PATHS)('the %s canvas', (_name, path) => {
                let scene: object;
                let layers: Map<LayerSize, OffscreenCanvas>;
                const layerOf = (size: Size) => layers.get(path.layers[size] ?? path.layers.small)!;
                beforeEach(() => {
                    scene = {};
                    layers = new Map();
                    for (const size of SIZES) {
                        const layer = path.layers[size] ?? path.layers.small;
                        if (!layers.has(layer)) layers.set(layer, new OffscreenCanvas(layer.width, layer.height));
                    }
                });
                afterEach(() => destroyShadowScratch(scene));

                const cast = (size: Size) => {
                    const layer = layerOf(size);
                    const context = layer.getContext('2d')! as unknown as CanvasRenderingContext2D;
                    context.clearRect(0, 0, layer.width, layer.height);
                    const renderCtx = { ...renderContext(), ctx: context, width: layer.width, height: layer.height };
                    const keys = path.keys(size);
                    // The casters make their paths as their group prepares to render.
                    for (const key of keys) createGroup(key.casters).preRender(renderCtx);
                    expect(castShadows({ scene, user: {}, keys, index: 0, overlay: path.overlay }, renderCtx)).toBe(
                        true
                    );
                    return context;
                };

                // Reading the layer back expands it into an array, so only the test that compares pixels does.
                const castPixels = (size: Size) => {
                    const { width, height } = layerOf(size);
                    return Array.from(cast(size).getImageData(0, 0, width, height).data);
                };

                const frame = (...sizes: Size[]) => {
                    startShadowFrame(scene);
                    for (const size of sizes) cast(size);
                };

                // The canvases that shrink: the scratch, or else the others, as the layer sizes the scratch.
                const shrinkable = (since: Set<OffscreenCanvas>) => {
                    const canvases = inUse(createdSince(since));
                    return (path.scratch ? canvases : canvases.slice(1)).reduce((sum, canvas) => sum + area(canvas), 0);
                };

                it('should shrink once enough small frames follow a large one', () => {
                    const before = offscreenCanvases();
                    frame('large');
                    const large = shrinkable(before);
                    expect(large).toBeGreaterThan(0);

                    for (let i = 0; i < SHADOW_SHRINK_AFTER; i++) frame('small');
                    expect(shrinkable(before)).toBe(large);

                    // A frame counts once the next one starts. The merge and the cut canvas of the overlay are one size, so
                    // that one failing to shrink leaves more than a quarter of the pixels.
                    frame('small');
                    expect(shrinkable(before) * 4).toBeLessThan(large);
                });

                // A frame is as large as its largest cast, whichever order it casts in, so none of these is a small frame.
                it.each<[string, Size[]]>([
                    ['small then large', ['small', 'large']],
                    ['large then small', ['large', 'small']],
                    ['small, large, then small', ['small', 'large', 'small']],
                ])('should count a frame by its largest cast, cast %s', (_order, casts) => {
                    const before = offscreenCanvases();
                    frame(...casts);
                    const large = shrinkable(before);
                    const created = createdSince(before).length;

                    for (let i = 0; i < SHADOW_SHRINK_AFTER + 5; i++) frame(...casts);

                    expect(shrinkable(before)).toBe(large);
                    expect(createdSince(before)).toHaveLength(created);
                });

                it('should reset the count when a larger cast follows, so that it never shrinks and regrows', () => {
                    const before = offscreenCanvases();
                    frame('large');
                    const large = shrinkable(before);
                    const created = createdSince(before).length;

                    // Fewer small frames than it takes to shrink on each side of a large one, but more than that between
                    // the first and the last, so that a count that the large frame didn't reset would shrink the canvas.
                    const BEFORE_LARGE = Math.floor(SHADOW_SHRINK_AFTER * 0.7);
                    expect(BEFORE_LARGE * 2).toBeGreaterThan(SHADOW_SHRINK_AFTER);
                    for (let i = 0; i < 3; i++) {
                        for (let j = 0; j < BEFORE_LARGE; j++) frame('small');
                        frame('large');
                    }
                    for (let j = 0; j < BEFORE_LARGE; j++) frame('small');

                    expect(shrinkable(before)).toBe(large);
                    expect(createdSince(before)).toHaveLength(created);
                });

                it('should count a frame that grows the canvas by the cast that grew it', () => {
                    const before = offscreenCanvases();
                    frame('small');
                    const small = shrinkable(before);

                    // The canvas grows for the large cast, and the small one that follows must not make the frame a small one.
                    frame('large', 'small');
                    const large = shrinkable(before);
                    expect(large).toBeGreaterThan(small);
                    const created = createdSince(before).length;

                    // The count restarts after the large frame, so these frames fall one short of shrinking the canvas.
                    for (let i = 0; i < SHADOW_SHRINK_AFTER; i++) frame('small');

                    expect(shrinkable(before)).toBe(large);
                    expect(createdSince(before)).toHaveLength(created);

                    frame('small');
                    expect(shrinkable(before) * 4).toBeLessThan(large);
                });

                it.runIf(path.shapes)(
                    'should count a frame that grows the canvas by the largest of its casts, not the one that grew it',
                    () => {
                        const before = offscreenCanvases();
                        frame('wide');
                        const wide = shrinkable(before);

                        // The narrow cast grows only the height, and by itself it is a small frame, but the frame was as wide as the other.
                        frame('wide', 'narrow');
                        const grown = shrinkable(before);
                        expect(grown).toBeGreaterThan(wide);
                        const created = createdSince(before).length;

                        for (let i = 0; i < SHADOW_SHRINK_AFTER; i++) frame('narrow');

                        expect(shrinkable(before)).toBe(grown);
                        expect(createdSince(before)).toHaveLength(created);

                        frame('narrow');
                        expect(shrinkable(before) * 4).toBeLessThan(grown);
                    }
                );

                it('should count a frame that allocates the canvas by the cast that allocated it', () => {
                    const before = offscreenCanvases();
                    frame('large', 'small');
                    const large = shrinkable(before);
                    const created = createdSince(before).length;

                    for (let i = 0; i < SHADOW_SHRINK_AFTER; i++) frame('small');

                    expect(shrinkable(before)).toBe(large);
                    expect(createdSince(before)).toHaveLength(created);
                });

                it('should not be reallocated by frames of one large cast and many small', () => {
                    const before = offscreenCanvases();
                    const casts: Size[] = [
                        'large',
                        ...Array.from({ length: SHADOW_SHRINK_AFTER + 5 }, (): Size => 'small'),
                    ];
                    frame(...casts);
                    const created = createdSince(before).length;

                    frame(...casts);

                    expect(createdSince(before)).toHaveLength(created);
                });

                it('should not be reallocated once it has shrunk, by the casts that it shrank for', () => {
                    const before = offscreenCanvases();
                    frame('large');
                    for (let i = 0; i < SHADOW_SHRINK_AFTER + 1; i++) frame('small');
                    const created = createdSince(before).length;

                    for (let i = 0; i < SHADOW_SHRINK_AFTER; i++) frame('small');

                    expect(createdSince(before)).toHaveLength(created);
                });

                describe.runIf(path.shapes)('with casts of different shapes', () => {
                    // The shapes are small enough together that the canvas shrinks to cover them both.
                    const bothShapes: Size[] = ['wide', 'tall'];

                    it('should shrink to cover the casts of every frame of the run, so that none allocates again', () => {
                        const before = offscreenCanvases();
                        frame('large');
                        const large = shrinkable(before);

                        for (let i = 0; i <= SHADOW_SHRINK_AFTER; i++) frame(bothShapes[i % 2]);
                        expect(shrinkable(before) * 4).toBeLessThan(large);
                        const created = createdSince(before).length;

                        for (const shape of bothShapes) frame(shape);

                        expect(createdSince(before)).toHaveLength(created);
                    });

                    it('should shrink to cover the cast that it shrinks for, when that is larger than the run', () => {
                        const before = offscreenCanvases();
                        frame('large');
                        const large = shrinkable(before);

                        for (let i = 0; i < SHADOW_SHRINK_AFTER; i++) frame('wide');
                        frame('wider');
                        expect(shrinkable(before) * 4).toBeLessThan(large);
                        const created = createdSince(before).length;

                        frame('wider');

                        expect(createdSince(before)).toHaveLength(created);
                    });
                });

                it.runIf(path.shapes)('should keep its size when casts that are small alone are not together', () => {
                    const before = offscreenCanvases();
                    frame('large');
                    const large = shrinkable(before);
                    const created = createdSince(before).length;

                    // Each frame is at most a quarter of the canvas, but the canvas that fits the wide and the long is not.
                    for (let i = 0; i <= SHADOW_SHRINK_AFTER; i++) frame(i % 2 === 0 ? 'wide' : 'long');

                    expect(shrinkable(before)).toBe(large);
                    expect(createdSince(before)).toHaveLength(created);
                });

                it('should draw the same pixels from the shrunk canvas', () => {
                    const before = offscreenCanvases();
                    startShadowFrame(scene);
                    const expected = castPixels('small');
                    expect(maxAlpha(expected)).toBeGreaterThan(0);
                    destroyShadowScratch(scene);

                    frame('large');
                    const large = shrinkable(before);
                    for (let i = 0; i < SHADOW_SHRINK_AFTER; i++) frame('small');
                    startShadowFrame(scene);
                    const actual = castPixels('small');

                    expect(shrinkable(before) * 4).toBeLessThan(large);
                    expect(actual).toEqual(expected);
                });
            });
        });
    });

    describe('glow in the batches of a group', () => {
        const BLUE_LEFT = { ...BLUE, xOffset: -100 };

        // The group batches a run of children that cast alike, or by layer; a glow is a cast in its own slot.
        describe.each([true, 'by-layer'] as const)('with batchShadows %s', (batchShadows) => {
            // A glow draws the pixels that the same options draw as a shadow, for any run of boxes.
            const LAYOUTS: Array<[string, (slot: 'fillShadow' | 'fillGlow') => Shape[]]> = [
                ['a single box', (slot) => [box(40, 90, 40, 40, { [slot]: RED_HALF })]],
                [
                    'overlapping boxes of one glow',
                    (slot) => [box(40, 90, 40, 40, { [slot]: RED_HALF }), box(60, 90, 40, 40, { [slot]: RED_HALF })],
                ],
                [
                    'boxes that a box with no cast separates',
                    (slot) => [
                        box(40, 90, 30, 40, { [slot]: RED_HALF }),
                        box(100, 90, 30, 40),
                        box(130, 90, 30, 40, { [slot]: RED_HALF }),
                    ],
                ],
                [
                    'boxes of different glows',
                    (slot) => [
                        box(40, 90, 30, 40, { [slot]: RED_HALF }),
                        box(100, 90, 30, 40, { [slot]: { ...RED_HALF, xOffset: -30 } }),
                    ],
                ],
            ];

            it.each(LAYOUTS)('should cast %s as it casts the same shadow', (_name, nodes) => {
                renderNodes(nodes('fillShadow'), batchShadows);
                const asShadow = pixels();
                expect(maxAlpha(asShadow)).toBeGreaterThan(0);

                renderNodes(nodes('fillGlow'), batchShadows);

                expect(pixels()).toEqual(asShadow);
            });

            it('should cast the glow of a box, away from the box that it surrounds', () => {
                renderNodes([box(40, 90, 40, 40, { fillGlow: BLUE })], batchShadows);

                expect(at(160, 110)).toEqual(BLUE_PIXEL);
                expect(at(260, 110)).toEqual(CLEAR);
            });

            it('should cast a shadow and a glow of one box, each in its own slot', () => {
                renderNodes([box(140, 90, 40, 40, { fillShadow: RED_HALF, fillGlow: BLUE_LEFT })], batchShadows);

                expect(at(260, 110)).toEqual([255, 0, 0, 128]);
                expect(at(60, 110)).toEqual(BLUE_PIXEL);
            });

            it('should cast the shadow before the glow, so that a shadow never darkens a glow', () => {
                renderNodes([box(40, 90, 40, 40, { fillShadow: RED_HALF, fillGlow: BLUE })], batchShadows);

                // Both land at the same place: the glow, cast last, covers the shadow.
                expect(at(160, 110)).toEqual(BLUE_PIXEL);
            });

            it('should end a run in the glow slot alone where the glow changes and the shadow does not', () => {
                const DOWN = { ...RED_HALF, xOffset: 0, yOffset: 50 };
                renderNodes(
                    [
                        box(120, 40, 20, 40, { fillShadow: DOWN, fillGlow: BLUE }),
                        box(160, 40, 20, 40, { fillShadow: DOWN, fillGlow: BLUE_LEFT }),
                    ],
                    batchShadows
                );

                // Each box casts its own glow, and not that of the other.
                expect(at(230, 60)).toEqual(BLUE_PIXEL);
                expect(at(70, 60)).toEqual(BLUE_PIXEL);
                expect(at(30, 60)).toEqual(CLEAR);
                expect(at(270, 60)).toEqual(CLEAR);
                // The shadow is cast beneath both.
                expect(at(130, 110)).toEqual([255, 0, 0, 128]);
                expect(at(170, 110)).toEqual([255, 0, 0, 128]);
            });
        });
    });
});
